from flask import Flask, request, jsonify, Response, stream_with_context, g
from flask_cors import CORS
import os
import sqlite3
import time
import json
import uuid
from datetime import datetime, timedelta
from dotenv import load_dotenv
import numpy as np
from db_config import get_db_connection, execute_read_query_params
from langchain_openai import ChatOpenAI


load_dotenv()

# keep only required imports
from nodes import intent_detection, format_response

# import subgraphs
from intents.general_information_graph.subgraph import general_information_graph_workflow
from intents.database_request_graph.subgraph import database_request_graph_workflow
from intents.logs_request_graph.subgraph import logs_request_graph_workflow
from intents.metrics_request_graph.subgraph import metrics_request_graph_workflow

# langgraph helpers for human-in-the-loop
from langgraph.types import Command

from logger.logger import logger

# Prometheus
from prometheus_client import (
    Counter, Histogram, generate_latest,
    CONTENT_TYPE_LATEST, REGISTRY,
)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

CHAT_DB_PATH = os.getenv("CHAT_DB_PATH", "chat_history.db")

# Groq Client for Insights
groq_llm = ChatOpenAI(
    model_name="llama3-70b-8192",
    openai_api_key=os.getenv("GROQ_API_KEY"),
    openai_api_base="https://api.groq.com/openai/v1"
)


# Prometheus metrics
# ===============================
AGENT_REQUEST_COUNT = Counter(
    "agent_requests_total",
    "Total requests to the agent API",
    ["method", "endpoint", "status"],
)
AGENT_REQUEST_LATENCY = Histogram(
    "agent_request_duration_seconds",
    "Agent API request latency",
    ["method", "endpoint"],
    buckets=[0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30, 60, 120],
)
AGENT_INTENT_COUNT = Counter(
    "agent_intent_detections_total",
    "Total intent detections by type",
    ["intent"],
)
AGENT_INTENT_LATENCY = Histogram(
    "agent_intent_processing_seconds",
    "Time to process each intent",
    ["intent"],
    buckets=[0.5, 1, 2, 5, 10, 30, 60, 120],
)
AGENT_ERRORS = Counter(
    "agent_errors_total",
    "Total agent errors",
    ["intent", "error_type"],
)


@app.before_request
def _start_timer():
    g.start_time = time.time()


@app.after_request
def _record_metrics(response):
    if request.path == "/metrics":
        return response
    latency = time.time() - getattr(g, "start_time", time.time())
    endpoint = request.endpoint or "unknown"
    AGENT_REQUEST_COUNT.labels(request.method, endpoint, response.status_code).inc()
    AGENT_REQUEST_LATENCY.labels(request.method, endpoint).observe(latency)
    return response


@app.route("/metrics")
def metrics_endpoint():
    return Response(generate_latest(REGISTRY), mimetype=CONTENT_TYPE_LATEST)


# ═══════════════════════════════════════════════════════════════════
# SQLite — chat history (ported from web/app.py)
# ═══════════════════════════════════════════════════════════════════
def _get_chat_db():
    if "chat_db" not in g:
        g.chat_db = sqlite3.connect(CHAT_DB_PATH)
        g.chat_db.row_factory = sqlite3.Row
    return g.chat_db


@app.teardown_appcontext
def _close_chat_db(exc):
    db = g.pop("chat_db", None)
    if db is not None:
        db.close()


def _init_chat_db():
    db = sqlite3.connect(CHAT_DB_PATH)
    db.executescript(
        """
        CREATE TABLE IF NOT EXISTS conversations (
            conversation_id TEXT PRIMARY KEY,
            title           TEXT NOT NULL DEFAULT 'New Chat',
            created_at      TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS messages (
            message_id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id TEXT NOT NULL,
            role        TEXT NOT NULL CHECK(role IN ('user','assistant')),
            content     TEXT NOT NULL,
            intent      TEXT DEFAULT NULL,
            created_at  TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id)
        );
        """
    )
    try:
        db.execute("SELECT intent FROM messages LIMIT 1")
    except sqlite3.OperationalError:
        db.execute("ALTER TABLE messages ADD COLUMN intent TEXT DEFAULT NULL")
        db.commit()
    db.close()


# helper: Handle Streaming from LangGraph
# ============================================
def _stream_graph(workflow, initial_state, config, intent_dict, final_node_names, resume_input=None):
    intent_str = ",".join(intent_dict["intent"])
    clarification = None

    try:
        inputs = Command(resume=resume_input) if resume_input else initial_state

        yield f"data: {json.dumps({'type': 'status', 'status': 'Starting workflow...'})}\n\n"

        for event in workflow.stream(inputs, config, stream_mode=["messages", "updates"]):
            mode = event[0]
            if mode == "messages":
                chunk, metadata = event[1]
                node_name = metadata.get("langgraph_node")
                if node_name in final_node_names:
                    content = getattr(chunk, "content", "")
                    if content:
                        yield f"data: {json.dumps({'type': 'token', 'content': content})}\n\n"
            elif mode == "updates":
                update_dict = event[1]
                for node_name in update_dict.keys():
                    if node_name not in final_node_names:
                        friendly_name = node_name.replace("_", " ").title()
                        yield f"data: {json.dumps({'type': 'status', 'status': f'Completed: {friendly_name}'})}\n\n"
        state = workflow.get_state(config)
        if state and state.next:
            for task in (state.tasks or []):
                if hasattr(task, "interrupts") and task.interrupts:
                    clarification = task.interrupts[0].value
                    break
            if clarification:
                yield f"data: {json.dumps({'type': 'clarification', 'clarification': clarification, 'intent_str': intent_str})}\n\n"
                return

        yield f"data: {json.dumps({'type': 'final', 'intent_str': intent_str})}\n\n"

    except Exception as exc:
        logger.error(f"Error during stream: {exc}", exc_info=True)
        yield f"data: {json.dumps({'type': 'error', 'error': str(exc), 'intent_str': intent_str})}\n\n"


def _iter_general_sse(intent, input_query, config, intent_start, i):
    initial_state = {
        "user_query": input_query,
        "messages": [{"role": "user", "content": input_query}],
    }
    intent_str = ",".join(intent["intent"])
    try:
        yield f"data: {json.dumps({'type': 'status', 'status': 'Analyzing query context...'})}\n\n"
        final_state = general_information_graph_workflow.invoke(initial_state, config=config)
        yield f"data: {json.dumps({'type': 'status', 'status': 'Generating response...'})}\n\n"
        for token in format_response.format_response_stream(intent, final_state):
            yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"
        yield f"data: {json.dumps({'type': 'final', 'intent_str': intent_str})}\n\n"
        AGENT_INTENT_LATENCY.labels(i).observe(time.time() - intent_start)
    except Exception as exc:
        logger.error(f"Error in general_information_graph: {exc}", exc_info=True)
        yield f"data: {json.dumps({'type': 'error', 'error': str(exc), 'intent_str': intent_str})}\n\n"


def iter_query_sse(input_query: str, thread_id: str):
    """
    Shared SSE event generator for /api/v1/query and /api/chat/send.
    Yields strings: each 'data: {...}\\n\\n' chunk (same contract as before).
    """
    config = {"configurable": {"thread_id": thread_id}}

    try:
        logger.info(f"Checking for pending interrupts for thread_id: '{thread_id}'")
        snapshot = database_request_graph_workflow.get_state(config)
        if snapshot and snapshot.next:
            logger.info(
                f"Pending interrupt found for thread_id: '{thread_id}'. Resuming database_request graph."
            )
            intent_dict = {"intent": ["database_request"]}
            yield from _stream_graph(
                database_request_graph_workflow,
                None,
                config,
                intent_dict,
                ["format_response_of_business_insight_generator"],
                resume_input=input_query,
            )
            return
    except Exception as e:
        logger.warning(
            f"Error checking for pending interrupt for thread_id '{thread_id}': {e}",
            exc_info=True,
        )

    logger.info(f"No pending interrupt for thread_id: '{thread_id}'. Starting intent detection.")
    intent = intent_detection.detect_intent(input_query)
    logger.info(f"Detected intent for query '{input_query}': {intent}")

    for i in intent["intent"]:
        logger.info(f"Processing intent '{i}' for thread_id: '{thread_id}'")
        AGENT_INTENT_COUNT.labels(i).inc()
        intent_start = time.time()

        if i in ["general_information_request", "greeting_request"]:
            yield from _iter_general_sse(intent, input_query, config, intent_start, i)
            return

        if i == "database_request":
            initial_state = {
                "user_query": input_query,
                "messages": [{"role": "user", "content": input_query}],
                "sql_retry_count": 0,
            }
            yield from _stream_graph(
                database_request_graph_workflow,
                initial_state,
                config,
                intent,
                ["format_response_of_business_insight_generator"],
            )
            AGENT_INTENT_LATENCY.labels(i).observe(time.time() - intent_start)
            return

        if i == "logs_request":
            initial_state = {
                "user_query": input_query,
                "messages": [{"role": "user", "content": input_query}],
            }
            yield from _stream_graph(
                logs_request_graph_workflow,
                initial_state,
                config,
                intent,
                ["format_logs_response"],
            )
            AGENT_INTENT_LATENCY.labels(i).observe(time.time() - intent_start)
            return

        if i == "metrics_request":
            initial_state = {
                "user_query": input_query,
                "messages": [{"role": "user", "content": input_query}],
            }
            yield from _stream_graph(
                metrics_request_graph_workflow,
                initial_state,
                config,
                intent,
                ["format_metrics_response"],
            )
            AGENT_INTENT_LATENCY.labels(i).observe(time.time() - intent_start)
            return

        logger.warning(f"Unsupported intent '{i}' for query: '{input_query}'")
        yield f"data: {json.dumps({'type': 'error', 'error': f'Intent {i} is not yet supported.', 'intent_str': ','.join(intent['intent'])})}\n\n"
        return


def _sse_stream_response(generator):
    resp = Response(stream_with_context(generator), mimetype="text/event-stream")
    resp.headers["Cache-Control"] = "no-cache, no-transform"
    resp.headers["X-Accel-Buffering"] = "no"
    resp.headers["Connection"] = "keep-alive"
    return resp


logger.info("Starting Intelligent AI Agent...")


@app.route("/")
def home():
    logger.info("Home endpoint '/' was accessed.")
    return "Intelligent AI Agent is running. Use the /api/v1/query endpoint to interact with the agent."


@app.route("/api/v1/query", methods=["POST", "GET"])
def query_agent():
    logger.info(f"'/api/v1/query' endpoint hit with method: {request.method}")
    input_query = request.args.get("input-query", "")
    thread_id = request.args.get("thread-id", "")
    logger.info(f"Received query: '{input_query}' with thread_id: '{thread_id}'")

    if not input_query:
        logger.error("Input query is missing in the request.")
        return jsonify({"is_error": True, "error": "input query is required in form data"}), 400

    if not thread_id:
        logger.error("Thread ID is missing in the request.")
        return jsonify({"is_error": True, "error": "thread-id is required in form data"}), 400

    return _sse_stream_response(iter_query_sse(input_query, thread_id))


@app.route("/api/v1/onboarding", methods=["POST"])
def onboarding():
    """
    Endpoint for new business onboarding.
    Creates:
    1. A new business entry
    2. A default 'Owner' role for the business
    3. A new user entry linked to the business and 'Owner' role
    """
    data = request.json
    logger.info(f"Received onboarding data: {data}")
    if not data:
        return jsonify({"is_error": True, "error": "No data received"}), 400

    business_name = data.get("business_name")
    industry_type = data.get("business_category")
    city = data.get("city")
    employees_range = data.get("employees_range")
    monthly_revenue = data.get("monthly_revenue")
    business_age = data.get("business_age")
    biggest_challenge = data.get("biggest_challenge")
    finance_tracking_method = data.get("finance_tracking_method")
    onboarding_notes = data.get("onboarding_notes")

    full_name = data.get("full_name")
    phone = data.get("phone")
    email = data.get("email")

    if not all([business_name, email, full_name]):
        return jsonify({"is_error": True, "error": "Missing required fields"}), 400

    conn = get_db_connection()
    try:
        cur = conn.cursor()

        business_id = str(uuid.uuid4())

        # Map monthly_revenue string to numeric target
        revenue_map = {
            "Under ₹50K": 50000,
            "₹50K–₹2L": 200000,
            "₹2L–₹10L": 1000000,
            "₹10L–₹50L": 5000000,
            "Above ₹50L": 10000000,
        }
        monthly_target = revenue_map.get(monthly_revenue, None)

        cur.execute(
            """
            INSERT INTO public.businesses (
                business_id, business_name, industry_type, owner_name, monthly_target_revenue
            ) VALUES (%s, %s, %s, %s, %s)
            RETURNING business_id
            """,
            (
                business_id,
                business_name,
                industry_type,
                full_name,
                monthly_target,
            ),
        )

        cur.execute(
            """
            INSERT INTO public.roles (business_id, role_name, description)
            VALUES (%s, %s, %s)
            RETURNING role_id
            """,
            (business_id, "Owner", "Business owner role created during onboarding"),
        )
        role_id = cur.fetchone()[0]

        cur.execute(
            """
            INSERT INTO public.users (
                business_id, role_id, name, email, password_hash
            ) VALUES (%s, %s, %s, %s, %s)
            RETURNING user_id
            """,
            (business_id, role_id, full_name, email, "no_password_set"),
        )

        conn.commit()
        logger.info(f"Onboarding successful for business: {business_name}")
        return jsonify(
            {"success": True, "business_id": business_id, "message": "Business onboarding successful"}
        ), 201

    except Exception as e:
        conn.rollback()
        logger.error(f"Onboarding failed: {str(e)}", exc_info=True)
        return jsonify({"is_error": True, "error": str(e)}), 500
    finally:
        conn.close()


# ─────────────────────────────────────────────
# PERIOD HELPER (Python side)
# ─────────────────────────────────────────────
def get_period_dates(period):
    """Returns start_date, end_date as YYYY-MM-DD strings."""
    now = datetime.utcnow()
    y, m = now.year, now.month
    
    if period == "this_month":
        start = datetime(y, m, 1)
        return start.strftime("%Y-%m-%d"), now.strftime("%Y-%m-%d")
    
    if period == "last_month":
        last_day_prev = datetime(y, m, 1) - timedelta(days=1)
        py, pm = last_day_prev.year, last_day_prev.month
        start = datetime(py, pm, 1)
        return start.strftime("%Y-%m-%d"), last_day_prev.strftime("%Y-%m-%d")
    
    if period == "ytd":
        start = datetime(y, 1, 1)
        return start.strftime("%Y-%m-%d"), now.strftime("%Y-%m-%d")
    
    # Default to last 30 days if unrecognized or "all"
    start = now - timedelta(days=30)
    return start.strftime("%Y-%m-%d"), now.strftime("%Y-%m-%d")

def get_latest_business_id():
    """Helper to get the most recent business_id."""
    res = execute_read_query_params("SELECT business_id FROM businesses ORDER BY created_at DESC LIMIT 1")
    return res[0]["business_id"] if res else None

@app.route("/api/dashboard/summary", methods=["GET", "OPTIONS"])
def api_dashboard_summary():
    """KPI summary based on period + growth percentages."""
    period = request.args.get("period", "this_month")
    start_date, end_date = get_period_dates(period)
    bid = get_latest_business_id()
    
    if not bid:
        return jsonify({
            "total_revenue": 0, "total_expenses": 0, "net_profit": 0, 
            "total_transactions": 0, "active_alerts": 0,
            "revenue_change": 0, "expenses_change": 0
        })

    try:
        # Current period data
        txn = execute_read_query_params(
            """
            SELECT
                COALESCE(SUM(CASE WHEN type='Revenue' THEN amount END), 0) AS total_revenue,
                COALESCE(SUM(CASE WHEN type='Expense' THEN amount END), 0) AS total_expenses,
                COUNT(*) AS total_transactions
            FROM daily_transactions
            WHERE business_id = %s AND transaction_date BETWEEN %s AND %s
            """,
            (bid, start_date, end_date),
        )
        alerts = execute_read_query_params(
            """
            SELECT COUNT(*) AS active_alerts
            FROM alerts
            WHERE business_id = %s AND status = 'Active'
            """,
            (bid,),
        )
        
        # Previous period for growth comparison
        prev_start, prev_end = get_period_dates("last_month" if period == "this_month" else "prev") 
        # (Simplified: just compare to last month if current is this month)
        prev_txn = execute_read_query_params(
            "SELECT COALESCE(SUM(CASE WHEN type='Revenue' THEN amount END), 0) AS total_revenue, "
            "COALESCE(SUM(CASE WHEN type='Expense' THEN amount END), 0) AS total_expenses, "
            "COUNT(*) AS total_transactions "
            "FROM daily_transactions WHERE business_id = %s AND transaction_date BETWEEN %s AND %s",
            (bid, prev_start, prev_end)
        )

        
        curr = txn[0] if txn else {}
        prev = prev_txn[0] if prev_txn else {}
        
        def calc_pct(c, p):
            if not p or p == 0: return 0
            return round(((c - p) / p) * 100, 1)

        rev_now = float(curr.get("total_revenue", 0))
        rev_prev = float(prev.get("total_revenue", 0))
        exp_now = float(curr.get("total_expenses", 0))
        exp_prev = float(prev.get("total_expenses", 0))
        net_now = rev_now - exp_now
        net_prev = rev_prev - exp_prev
        txn_now = int(curr.get("total_transactions", 0))
        txn_prev = int(prev.get("total_transactions", 0))

        return jsonify(
            {
                "total_revenue": rev_now,
                "total_expenses": exp_now,
                "net_profit": net_now,
                "total_transactions": txn_now,
                "active_alerts": int(alerts[0].get("active_alerts", 0)) if alerts else 0,
                "revenue_change": calc_pct(rev_now, rev_prev),
                "expenses_change": calc_pct(exp_now, exp_prev),
                "net_profit_change": calc_pct(net_now, net_prev),
                "transactions_change": calc_pct(txn_now, txn_prev)
            }
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/dashboard/financial-overview", methods=["GET", "OPTIONS"])
def api_financial_overview():
    """Monthly financial_records aggregates (web parity)."""
    try:
        rows = execute_read_query_params(
            """
            SELECT year, month,
                   COALESCE(SUM(total_revenue),0) AS total_revenue,
                   COALESCE(SUM(total_expenses),0) AS total_expenses,
                   COALESCE(SUM(net_profit),0) AS net_profit,
                   COALESCE(SUM(cash_balance),0) AS cash_balance
            FROM financial_records
            GROUP BY year, month
            ORDER BY year DESC, month DESC
            LIMIT 12
            """
        )
        rows = list(rows)
        rows.reverse()
        labels = [f"{r['year']}-{str(r['month']).zfill(2)}" for r in rows]
        return jsonify(
            {
                "labels": labels,
                "revenue": [float(r["total_revenue"]) for r in rows],
                "expenses": [float(r["total_expenses"]) for r in rows],
                "net_profit": [float(r["net_profit"]) for r in rows],
                "cash_balance": [float(r["cash_balance"]) for r in rows],
            }
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/dashboard/revenue-vs-expense", methods=["GET", "OPTIONS"])
def api_revenue_vs_expense():
    """Revenue vs expense by category based on period."""
    period = request.args.get("period", "this_month")
    start_date, end_date = get_period_dates(period)
    bid = get_latest_business_id()
    
    if not bid:
        return jsonify({"labels": [], "revenue": [], "expenses": []})

    try:
        rows = execute_read_query_params(
            """
            SELECT category, type,
                   COALESCE(SUM(amount), 0) AS total
            FROM daily_transactions
            WHERE business_id = %s AND transaction_date BETWEEN %s AND %s
            GROUP BY category, type
            ORDER BY total DESC
            """,
            (bid, start_date, end_date),
        )
        revenue_cats = {}
        expense_cats = {}
        for r in rows:
            cat = r["category"] or "Other"
            amt = float(r["total"])
            if r["type"] == "Revenue":
                revenue_cats[cat] = revenue_cats.get(cat, 0) + amt
            else:
                expense_cats[cat] = expense_cats.get(cat, 0) + amt

        all_cats = sorted(set(list(revenue_cats.keys()) + list(expense_cats.keys())))
        return jsonify(
            {
                "labels": all_cats,
                "revenue": [revenue_cats.get(c, 0) for c in all_cats],
                "expenses": [expense_cats.get(c, 0) for c in all_cats],
            }
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/dashboard/sales-trend", methods=["GET", "OPTIONS"])
def api_sales_trend():
    """Daily buckets from daily_transactions based on period."""
    period = request.args.get("period", "this_month")
    start_date, end_date = get_period_dates(period)
    bid = get_latest_business_id()
    
    if not bid:
        return jsonify({"labels": [], "revenue": [], "expenses": []})

    try:
        rows = execute_read_query_params(
            """
            SELECT transaction_date,
                   COALESCE(SUM(CASE WHEN type='Revenue' THEN amount END), 0) AS revenue,
                   COALESCE(SUM(CASE WHEN type='Expense' THEN amount END), 0) AS expenses
            FROM daily_transactions
            WHERE business_id = %s AND transaction_date BETWEEN %s AND %s
            GROUP BY transaction_date
            ORDER BY transaction_date
            """,
            (bid, start_date, end_date),
        )
        return jsonify(
            {
                "labels": [r["transaction_date"].isoformat() for r in rows],
                "revenue": [float(r["revenue"]) for r in rows],
                "expenses": [float(r["expenses"]) for r in rows],
            }
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/dashboard/transactions-by-category", methods=["GET", "OPTIONS"])
def api_transactions_by_category():
    cutoff = (datetime.utcnow() - timedelta(hours=24)).strftime("%Y-%m-%d")
    try:
        rows = execute_read_query_params(
            """
            SELECT category, COUNT(*) as cnt
            FROM daily_transactions
            WHERE transaction_date >= %s
            GROUP BY category
            ORDER BY cnt DESC
            """,
            (cutoff,),
        )
        return jsonify(
            {
                "labels": [r["category"] or "Other" for r in rows],
                "data": [int(r["cnt"]) for r in rows],
            }
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/dashboard/alerts-by-severity", methods=["GET", "OPTIONS"])
def api_alerts_by_severity():
    bid = get_latest_business_id()
    if not bid: return jsonify({"labels": [], "data": []})
    try:
        rows = execute_read_query_params(
            """
            SELECT severity, COUNT(*) AS cnt
            FROM alerts
            WHERE business_id = %s AND status = 'Active'
            GROUP BY severity
            """, (bid,)
        )
        return jsonify(
            {"labels": [r["severity"] for r in rows], "data": [int(r["cnt"]) for r in rows]}
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/dashboard/alerts", methods=["GET", "OPTIONS"])
def api_alerts_list():
    """Returns detailed active alerts list."""
    bid = get_latest_business_id()
    if not bid: return jsonify({"alerts": []})
    limit = request.args.get("limit", 50, type=int)
    try:
        rows = execute_read_query_params(
            """
            SELECT alert_id, alert_type, severity, message, status, created_at
            FROM alerts
            WHERE business_id = %s AND status = 'Active'
            ORDER BY created_at DESC
            LIMIT %s
            """,
            (bid, limit),
        )
        for r in rows:
            if r.get("created_at"):
                r["created_at"] = r["created_at"].isoformat()
        return jsonify({"alerts": rows})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/dashboard/forecast", methods=["GET", "OPTIONS"])
def api_forecast():
    """Predict next 30 days revenue based on last 60 days."""
    bid = get_latest_business_id()
    if not bid: return jsonify({"historical":[], "forecast":[], "insight":"No business found"})
    
    try:
        # 1. Fetch historical data (60 days)
        cutoff = (datetime.utcnow() - timedelta(days=60)).strftime("%Y-%m-%d")
        rows = execute_read_query_params(
            """
            SELECT transaction_date, COALESCE(SUM(amount), 0) as amount
            FROM daily_transactions
            WHERE business_id = %s AND type='Revenue' AND transaction_date >= %s
            GROUP BY transaction_date ORDER BY transaction_date ASC
            """, (bid, cutoff)
        )
        
        # 2. Fill gaps with 0
        hist_dict = {r["transaction_date"].strftime("%Y-%m-%d"): float(r["amount"]) for r in rows}
        historical = []
        today = datetime.utcnow().date()
        for i in range(60, -1, -1):
            d = (today - timedelta(days=i)).strftime("%Y-%m-%d")
            historical.append({"date": d, "actual": hist_dict.get(d, 0.0)})
            
        # 3. Forecast logic (Numpy Polyfit for linear trend)
        x = np.arange(len(historical))
        y = np.array([h["actual"] for h in historical])
        z = np.polyfit(x, y, 1) # linear
        p = np.poly1d(z)
        
        forecast = []
        last_date = datetime.strptime(historical[-1]["date"], "%Y-%m-%d")
        for i in range(1, 31):
            pred_date = (last_date + timedelta(days=i)).strftime("%Y-%m-%d")
            pred_val = max(0, float(p(len(historical) + i)))
            std_dev = float(np.std(y)) if len(y) > 0 else 100.0
            forecast.append({
                "date": pred_date,
                "predicted": round(pred_val, 2),
                "lower_bound": round(max(0, pred_val - (std_dev * 0.5)), 2),
                "upper_bound": round(pred_val + (std_dev * 0.5), 2)
            })
            
        # 4. Trend Metrics
        trend_direction = "stable"
        if z[0] > 0.05 * (np.mean(y) if np.mean(y) > 0 else 1): trend_direction = "up"
        elif z[0] < -0.05 * (np.mean(y) if np.mean(y) > 0 else 1): trend_direction = "down"
        
        trend_pct = round((z[0] * 30 / (np.mean(y) if np.mean(y) > 0 else 1)) * 100, 1) if np.mean(y) > 0 else 0
        
        # 5. AI Insight (Groq)
        insight_prompt = f"""As a financial advisor, analyze this 60-day revenue trend for a business.
        Direction: {trend_direction}
        30-day Projected Growth: {trend_pct}%
        Avg Daily Revenue: {np.mean(y):.2f}
        Projected next month: {sum(f['predicted'] for f in forecast):.2f}
        
        Provide a 1-2 sentence tactical advice for the owner. Be concise. Do not use markdown headers."""
        
        try:
            ai_res = groq_llm.invoke(insight_prompt)
            insight = ai_res.content.strip()
        except Exception as e:
            logger.error(f"Groq insight error: {e}")
            insight = f"Revenue is trending {trend_direction}. Keep a close watch on cash reserves."

        return jsonify({
            "historical": historical,
            "forecast": forecast,
            "trend_direction": trend_direction,
            "trend_percent": abs(trend_pct),
            "insight": insight
        })
        
    except Exception as e:
        logger.error(f"Forecast error: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route("/api/dashboard/health-scores", methods=["GET", "OPTIONS"])
def api_health_scores():
    bid = get_latest_business_id()
    if not bid: return jsonify({"businesses": [], "scores": []})
    try:
        rows = execute_read_query_params(
            """
            SELECT b.business_name, h.overall_score, h.cash_score,
                   h.profitability_score, h.growth_score, h.cost_control_score, h.risk_score
            FROM business_health_scores h
            JOIN businesses b ON h.business_id = b.business_id
            WHERE b.business_id = %s
            ORDER BY h.calculated_at DESC
            LIMIT 10
            """, (bid,)
        )
        return jsonify(
            {
                "businesses": [r["business_name"] for r in rows],
                "scores": [
                    {
                        "name": r["business_name"],
                        "overall": float(r["overall_score"] or 0),
                        "cash": float(r["cash_score"] or 0),
                        "profitability": float(r["profitability_score"] or 0),
                        "growth": float(r["growth_score"] or 0),
                        "cost_control": float(r["cost_control_score"] or 0),
                        "risk": float(r["risk_score"] or 0),
                    }
                    for r in rows
                ],
            }
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/dashboard/top-products", methods=["GET", "OPTIONS"])
def api_top_products():
    bid = get_latest_business_id()
    if not bid: return jsonify({"labels": [], "stock": [], "margin": []})
    try:
        rows = execute_read_query_params(
            """
            SELECT p.product_name, p.stock_quantity, p.selling_price, p.cost_price
            FROM products p
            WHERE p.business_id = %s
            ORDER BY p.stock_quantity DESC
            LIMIT 10
            """, (bid,)
        )
        return jsonify(
            {
                "labels": [r["product_name"] for r in rows],
                "stock": [int(r["stock_quantity"] or 0) for r in rows],
                "margin": [
                    float((r["selling_price"] or 0) - (r["cost_price"] or 0)) for r in rows
                ],
            }
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/dashboard/employee-stats", methods=["GET", "OPTIONS"])
def api_employee_stats():
    bid = get_latest_business_id()
    if not bid: return jsonify({"labels": [], "counts": [], "avg_salary": []})
    try:
        rows = execute_read_query_params(
            """
            SELECT status, COUNT(*) AS cnt, COALESCE(AVG(salary),0) AS avg_salary
            FROM employees
            WHERE business_id = %s
            GROUP BY status
            """, (bid,)
        )
        return jsonify(
            {
                "labels": [r["status"] for r in rows],
                "counts": [int(r["cnt"]) for r in rows],
                "avg_salary": [round(float(r["avg_salary"]), 2) for r in rows],
            }
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/dashboard/recent-transactions", methods=["GET", "OPTIONS"])
def api_recent_transactions():
    limit = request.args.get("limit", 20, type=int)
    search = request.args.get("search", "").strip()
    category = request.args.get("category", "").strip()
    period = request.args.get("period", "this_month")
    start_date, end_date = get_period_dates(period)
    bid = get_latest_business_id()
    
    if not bid: return jsonify({"transactions": []})

    try:
        base_sql = """
            SELECT transaction_id, transaction_date, type, category,
                   amount, description
            FROM daily_transactions
            WHERE business_id = %s AND transaction_date BETWEEN %s AND %s
        """
        params = [bid, start_date, end_date]
        if search:
            base_sql += " AND (description ILIKE %s OR category ILIKE %s)"
            params.extend([f"%{search}%", f"%{search}%"])
        if category:
            base_sql += " AND category = %s"
            params.append(category)
        base_sql += " ORDER BY transaction_date DESC, transaction_id DESC LIMIT %s"
        params.append(limit)
        rows = execute_read_query_params(base_sql, tuple(params))
        for r in rows:
            r["amount"] = float(r["amount"] or 0)
            if r.get("transaction_date"):
                r["transaction_date"] = r["transaction_date"].isoformat()
        return jsonify({"transactions": rows})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/dashboard/sales-target", methods=["GET", "OPTIONS"])
def api_sales_target():
    """Gauge: current revenue vs target revenue based on period."""
    period = request.args.get("period", "this_month")
    start_date, end_date = get_period_dates(period)
    bid = get_latest_business_id()
    if not bid: return jsonify({"percentage": 0})
    try:
        biz = execute_read_query_params(
            "SELECT business_name, monthly_target_revenue FROM businesses WHERE business_id = %s", (bid,)
        )
        curr = execute_read_query_params(
            """
            SELECT COALESCE(SUM(amount), 0) AS total
            FROM daily_transactions
            WHERE business_id = %s AND type='Revenue' AND transaction_date BETWEEN %s AND %s
            """,
            (bid, start_date, end_date),
        )
        if biz:
            row = biz[0]
            target = float(row["monthly_target_revenue"] or 100000)
            current = float(curr[0]["total"] or 0)
            pct = round((current / target * 100), 1) if target > 0 else 0
            return jsonify(
                {
                    "business_name": row["business_name"],
                    "current_revenue": current,
                    "target_revenue": target,
                    "percentage": pct,
                }
            )
        return jsonify({"current_revenue": 0, "target_revenue": 100000, "percentage": 0})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/dashboard/categories", methods=["GET", "OPTIONS"])
def api_get_categories():
    bid = get_latest_business_id()
    if not bid: return jsonify({"categories": []})
    try:
        rows = execute_read_query_params(
            "SELECT DISTINCT category FROM daily_transactions WHERE business_id = %s", (bid,)
        )
        return jsonify({"categories": [r["category"] for r in rows if r["category"]]})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/dashboard/business-info", methods=["GET", "OPTIONS"])
def api_business_info():
    bid = get_latest_business_id()
    if not bid: return jsonify({"error": "No business found"}), 404
    try:
        rows = execute_read_query_params(
            "SELECT * FROM businesses WHERE business_id = %s", (bid,)
        )
        return jsonify(rows[0] if rows else {})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─────────────────────────────────────────────
# Chat API (SQLite + shared LangGraph SSE)
# ─────────────────────────────────────────────


@app.route("/api/chat/conversations", methods=["GET"])
def api_list_conversations():
    db = _get_chat_db()
    rows = db.execute("SELECT * FROM conversations ORDER BY updated_at DESC").fetchall()
    return jsonify([dict(r) for r in rows])


@app.route("/api/chat/conversations", methods=["POST"])
def api_create_conversation():
    conv_id = str(uuid.uuid4())
    title = request.json.get("title", "New Chat") if request.is_json else "New Chat"
    db = _get_chat_db()
    db.execute(
        "INSERT INTO conversations (conversation_id, title) VALUES (?, ?)",
        (conv_id, title),
    )
    db.commit()
    return jsonify({"conversation_id": conv_id, "title": title}), 201


@app.route("/api/chat/conversations/<conv_id>", methods=["DELETE"])
def api_delete_conversation(conv_id):
    db = _get_chat_db()
    db.execute("DELETE FROM messages WHERE conversation_id = ?", (conv_id,))
    db.execute("DELETE FROM conversations WHERE conversation_id = ?", (conv_id,))
    db.commit()
    return jsonify({"status": "deleted"}), 200


@app.route("/api/chat/conversations/<conv_id>/messages", methods=["GET"])
def api_get_messages(conv_id):
    db = _get_chat_db()
    rows = db.execute(
        "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at",
        (conv_id,),
    ).fetchall()
    return jsonify([dict(r) for r in rows])


@app.route("/api/chat/send", methods=["POST"])
def api_chat_send():
    data = request.get_json(force=True)
    conv_id = data.get("conversation_id")
    user_msg = data.get("message", "").strip()

    if not conv_id or not user_msg:
        return jsonify({"error": "conversation_id and message are required"}), 400

    db = _get_chat_db()

    exists = db.execute(
        "SELECT 1 FROM conversations WHERE conversation_id = ?", (conv_id,)
    ).fetchone()
    if not exists:
        db.execute(
            "INSERT INTO conversations (conversation_id, title) VALUES (?, ?)",
            (conv_id, user_msg[:50]),
        )

    db.execute(
        "INSERT INTO messages (conversation_id, role, content) VALUES (?, 'user', ?)",
        (conv_id, user_msg),
    )
    db.commit()

    conv_row = db.execute(
        "SELECT title FROM conversations WHERE conversation_id = ?", (conv_id,)
    ).fetchone()
    if conv_row and conv_row["title"] == "New Chat":
        db.execute(
            "UPDATE conversations SET title = ?, updated_at = datetime('now') WHERE conversation_id = ?",
            (user_msg[:60], conv_id),
        )
        db.commit()

    def generate_stream():
        full_assistant_msg = ""
        intent_value = None
        clarification_data = None
        is_error = False

        try:
            for chunk in iter_query_sse(user_msg, conv_id):
                yield chunk
                if chunk.startswith("data: "):
                    payload = chunk[6:].strip()
                    if payload.endswith("\n\n"):
                        payload = payload[:-2]
                    try:
                        chunk_data = json.loads(payload)
                        t = chunk_data.get("type")
                        if t == "token":
                            full_assistant_msg += chunk_data.get("content", "")
                        elif t == "final":
                            intent_value = chunk_data.get("intent_str")
                        elif t == "clarification":
                            clarification_data = chunk_data.get("clarification")
                            intent_value = chunk_data.get("intent_str")
                        elif t == "error":
                            full_assistant_msg = "⚠️ Error: " + chunk_data.get("error", "Unknown")
                            intent_value = chunk_data.get("intent_str")
                            is_error = True
                    except Exception:
                        pass
        except Exception as exc:
            err_msg = f"Could not run agent: {exc}"
            yield f"data: {json.dumps({'type': 'error', 'error': err_msg})}\n\n"
            full_assistant_msg = f"⚠️ Error: {err_msg}"
            is_error = True

        if clarification_data:
            if isinstance(clarification_data, str):
                final_text = clarification_data
            else:
                final_text = clarification_data.get(
                    "message", "Could you please clarify your question?"
                )
        else:
            final_text = full_assistant_msg

        db2 = sqlite3.connect(CHAT_DB_PATH)
        db2.execute(
            "INSERT INTO messages (conversation_id, role, content, intent) VALUES (?, 'assistant', ?, ?)",
            (conv_id, final_text, intent_value),
        )
        db2.execute(
            "UPDATE conversations SET updated_at = datetime('now') WHERE conversation_id = ?",
            (conv_id,),
        )
        db2.commit()
        db2.close()

    return _sse_stream_response(generate_stream())


_init_chat_db()

if __name__ == "__main__":
    try:
        logger.info("Starting Flask development server.")
        app.run(host="0.0.0.0", port=5000, debug=True)
    except Exception as e:
        logger.critical(f"Failed to start the server: {e}", exc_info=True)
