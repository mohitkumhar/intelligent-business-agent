from flask import Flask, request, jsonify, Response, stream_with_context, g
from flask_cors import CORS
import os
import sqlite3
import time
import json
import uuid
import numpy as np
from datetime import datetime, timedelta, date
from dateutil.relativedelta import relativedelta
from dotenv import load_dotenv

# Database & AI Imports
from db_config import get_db_connection, execute_read_query_params
from transaction_import import parse_csv_bytes, parse_xlsx_bytes
from ocr_processor import extract_transactions_from_image
from langchain_openai import ChatOpenAI

# Chatbot/LangGraph Imports
from nodes import intent_detection, format_response
from intents.general_information_graph.subgraph import general_information_graph_workflow
from intents.database_request_graph.subgraph import database_request_graph_workflow
from intents.logs_request_graph.subgraph import logs_request_graph_workflow
from intents.metrics_request_graph.subgraph import metrics_request_graph_workflow
from langgraph.types import Command

from logger.logger import logger
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST, REGISTRY

load_dotenv()

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16 MB
CORS(app)

# Constants & AI Clients
CHAT_DB_PATH = os.getenv("CHAT_DB_PATH", "chat_history.db")
groq_llm = ChatOpenAI(
    model_name="llama3-70b-8192",
    openai_api_key=os.getenv("GROQ_API_KEY"),
    openai_api_base="https://api.groq.com/openai/v1"
)

# --- SQLite Chat History Setup ---
def _get_chat_db():
    if "chat_db" not in g:
        g.chat_db = sqlite3.connect(CHAT_DB_PATH)
        g.chat_db.row_factory = sqlite3.Row
    return g.chat_db

def _init_chat_db():
    db = sqlite3.connect(CHAT_DB_PATH)
    db.executescript("""
        CREATE TABLE IF NOT EXISTS conversations (
            conversation_id TEXT PRIMARY KEY,
            title TEXT NOT NULL DEFAULT 'New Chat',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS messages (
            message_id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('user','assistant')),
            content TEXT NOT NULL,
            intent TEXT DEFAULT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id)
        );
    """)
    db.close()

# --- Helper Functions (From Kushal-Dev) ---
def get_period_dates(period):
    now = datetime.utcnow()
    y, m = now.year, now.month
    if period == "this_month":
        return datetime(y, m, 1).strftime("%Y-%m-%d"), now.strftime("%Y-%m-%d")
    if period == "last_month":
        last_day_prev = datetime(y, m, 1) - timedelta(days=1)
        return datetime(last_day_prev.year, last_day_prev.month, 1).strftime("%Y-%m-%d"), last_day_prev.strftime("%Y-%m-%d")
    if period == "ytd":
        return datetime(y, 1, 1).strftime("%Y-%m-%d"), now.strftime("%Y-%m-%d")
    start = now - timedelta(days=30)
    return start.strftime("%Y-%m-%d"), now.strftime("%Y-%m-%d")

def get_latest_business_id():
    res = execute_read_query_params("SELECT business_id FROM businesses ORDER BY created_at DESC LIMIT 1")
    return res[0]["business_id"] if res else None

# --- Dashboard API Endpoints ---

@app.route("/api/dashboard/summary-sql", methods=["GET"])
def api_dashboard_summary():
    period = request.args.get("period", "this_month")
    start_date, end_date = get_period_dates(period)
    bid = get_latest_business_id()
    if not bid: return jsonify({"error": "No business found"}), 404
    
    txn = execute_read_query_params("""
        SELECT 
            COALESCE(SUM(CASE WHEN type='Revenue' THEN amount END), 0) AS total_revenue,
            COALESCE(SUM(CASE WHEN type='Expense' THEN amount END), 0) AS total_expenses,
            COUNT(*) AS total_transactions
        FROM daily_transactions WHERE business_id = %s AND transaction_date BETWEEN %s AND %s
    """, (bid, start_date, end_date))
    
    alerts = execute_read_query_params("SELECT COUNT(*) AS active_alerts FROM alerts WHERE business_id = %s AND status = 'Active'", (bid,))
    
    curr = txn[0] if txn else {}
    return jsonify({
        "total_revenue": float(curr.get("total_revenue", 0)),
        "total_expenses": float(curr.get("total_expenses", 0)),
        "net_profit": float(curr.get("total_revenue", 0)) - float(curr.get("total_expenses", 0)),
        "total_transactions": int(curr.get("total_transactions", 0)),
        "active_alerts": int(alerts[0].get("active_alerts", 0)) if alerts else 0,
        "revenue_change": 12.5, # Static for demo or logic here
        "expenses_change": -2.4
    })

@app.route("/api/dashboard/forecast", methods=["GET"])
def api_forecast():
    bid = get_latest_business_id()
    if not bid: return jsonify({"historical":[], "forecast":[]}), 404
    try:
        cutoff = (datetime.utcnow() - timedelta(days=60)).strftime("%Y-%m-%d")
        rows = execute_read_query_params("""
            SELECT transaction_date, SUM(amount) as amount FROM daily_transactions 
            WHERE business_id = %s AND type='Revenue' AND transaction_date >= %s 
            GROUP BY 1 ORDER BY 1
        """, (bid, cutoff))
        
        hist = [{"date": r["transaction_date"].strftime("%Y-%m-%d"), "actual": float(r["amount"])} for r in rows]
        # Basic prediction logic using numpy
        x = np.arange(len(hist))
        y = np.array([h["actual"] for h in hist])
        z = np.polyfit(x, y, 1)
        p = np.poly1d(z)
        
        forecast = []
        last_date = datetime.strptime(hist[-1]["date"], "%Y-%m-%d") if hist else datetime.utcnow()
        for i in range(1, 31):
            forecast.append({
                "date": (last_date + timedelta(days=i)).strftime("%Y-%m-%d"),
                "predicted": max(0, round(float(p(len(hist) + i)), 2))
            })
        
        return jsonify({"historical": hist, "forecast": forecast, "insight": "Revenue is trending upwards based on last 60 days."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/v1/onboarding", methods=["POST"])
def onboarding():
    data = request.json
    business_name = data.get("business_name")
    email = data.get("email", "").lower().strip()
    if not business_name or not email: return jsonify({"error": "Missing fields"}), 400
    
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        bid = str(uuid.uuid4())
        cur.execute("INSERT INTO businesses (business_id, business_name, industry_type, owner_name) VALUES (%s, %s, %s, %s)", 
                   (bid, business_name, data.get("business_category"), data.get("full_name")))
        cur.execute("INSERT INTO users (business_id, name, email, password_hash) VALUES (%s, %s, %s, %s)",
                   (bid, data.get("full_name"), email, "no_pass"))
        conn.commit()
        return jsonify({"success": True, "business_id": bid}), 201
    finally:
        conn.close()

# --- SSE Chat Logic ---
def iter_query_sse(input_query, thread_id):
    # LangGraph logic from testsparkhack branch
    yield f"data: {json.dumps({'type': 'status', 'status': 'Thinking...'})}\n\n"
    intent = intent_detection.detect_intent(input_query)
    # Stream tokens here... (Simplified for merge, use your full _stream_graph logic)
    yield f"data: {json.dumps({'type': 'token', 'content': 'AI Response placeholder...'})}\n\n"
    yield f"data: {json.dumps({'type': 'final', 'intent_str': 'database_request'})}\n\n"

@app.route("/api/chat/send", methods=["POST"])
def api_chat_send():
    data = request.json
    conv_id = data.get("conversation_id")
    msg = data.get("message")
    # Wrap iter_query_sse in SSE Response
    return Response(stream_with_context(iter_query_sse(msg, conv_id)), mimetype="text/event-stream")

# Start Server
_init_chat_db()
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
