from flask import Flask, request, jsonify, Response, stream_with_context, g
from flask_cors import CORS
import os
import sqlite3
import time
import json
import uuid
from datetime import datetime, timedelta
from dotenv import load_dotenv
from db_config import get_db_connection, execute_read_query_params

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
        cur.execute(
            """
            INSERT INTO public.businesses (
                business_id, business_name, industry_type, owner_name
            ) VALUES (%s, %s, %s, %s)
            RETURNING business_id
            """,
            (
                business_id,
                business_name,
                industry_type,
                full_name,
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
# REAL SQL DASHBOARD ROUTES (ported from web/app.py)
# SQL reviewed against company_db_schema.sql — tables/columns below exist in DDL.
# (Drift note: onboarding INSERT may use columns not in the checked-in DDL; unrelated to these SELECTs.)
# ─────────────────────────────────────────────


@app.route("/api/dashboard/summary", methods=["GET", "OPTIONS"])
def api_dashboard_summary():
    """KPI summary — last 24h from daily_transactions + alerts (web parity)."""
    cutoff = (datetime.utcnow() - timedelta(hours=24)).strftime("%Y-%m-%d")
    try:
        txn = execute_read_query_params(
            """
            SELECT
                COALESCE(SUM(CASE WHEN type='Revenue' THEN amount END), 0) AS total_revenue,
                COALESCE(SUM(CASE WHEN type='Expense' THEN amount END), 0) AS total_expenses,
                COUNT(*) AS total_transactions
            FROM daily_transactions
            WHERE transaction_date >= %s
            """,
            (cutoff,),
        )
        alerts = execute_read_query_params(
            """
            SELECT COUNT(*) AS active_alerts
            FROM alerts
            WHERE status = 'Active' AND created_at >= %s
            """,
            (cutoff,),
        )
        row = txn[0] if txn else {}
        alert_row = alerts[0] if alerts else {}
        return jsonify(
            {
                "total_revenue": float(row.get("total_revenue", 0)),
                "total_expenses": float(row.get("total_expenses", 0)),
                "net_profit": float(row.get("total_revenue", 0))
                - float(row.get("total_expenses", 0)),
                "total_transactions": int(row.get("total_transactions", 0)),
                "active_alerts": int(alert_row.get("active_alerts", 0)),
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
    """Last 24h revenue vs expense by category (web parity)."""
    cutoff = (datetime.utcnow() - timedelta(hours=24)).strftime("%Y-%m-%d")
    try:
        rows = execute_read_query_params(
            """
            SELECT category, type,
                   COALESCE(SUM(amount), 0) AS total
            FROM daily_transactions
            WHERE transaction_date >= %s
            GROUP BY category, type
            ORDER BY total DESC
            """,
            (cutoff,),
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
    """Daily buckets from daily_transactions — last 7 days (web parity)."""
    cutoff = (datetime.utcnow() - timedelta(days=7)).strftime("%Y-%m-%d")
    try:
        rows = execute_read_query_params(
            """
            SELECT transaction_date,
                   COALESCE(SUM(CASE WHEN type='Revenue' THEN amount END), 0) AS revenue,
                   COALESCE(SUM(CASE WHEN type='Expense' THEN amount END), 0) AS expenses
            FROM daily_transactions
            WHERE transaction_date >= %s
            GROUP BY transaction_date
            ORDER BY transaction_date
            """,
            (cutoff,),
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
    try:
        rows = execute_read_query_params(
            """
            SELECT severity, COUNT(*) AS cnt
            FROM alerts
            WHERE status = 'Active'
            GROUP BY severity
            """
        )
        return jsonify(
            {"labels": [r["severity"] for r in rows], "data": [int(r["cnt"]) for r in rows]}
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/dashboard/health-scores", methods=["GET", "OPTIONS"])
def api_health_scores():
    try:
        rows = execute_read_query_params(
            """
            SELECT bhs.overall_score, bhs.cash_score,
                   bhs.profitability_score, bhs.growth_score,
                   bhs.cost_control_score, bhs.risk_score,
                   b.business_name
            FROM business_health_scores bhs
            JOIN businesses b ON b.business_id = bhs.business_id
            ORDER BY bhs.calculated_at DESC
            LIMIT 5
            """
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
    try:
        rows = execute_read_query_params(
            """
            SELECT p.product_name, p.stock_quantity, p.selling_price, p.cost_price
            FROM products p
            ORDER BY p.stock_quantity DESC
            LIMIT 10
            """
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
    try:
        rows = execute_read_query_params(
            """
            SELECT status, COUNT(*) AS cnt, COALESCE(AVG(salary),0) AS avg_salary
            FROM employees
            GROUP BY status
            """
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
    try:
        base_sql = """
            SELECT transaction_id, transaction_date, type, category,
                   amount, description
            FROM daily_transactions
            WHERE 1=1
        """
        params = []
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
    try:
        rows = execute_read_query_params(
            """
            SELECT b.business_name, b.monthly_target_revenue,
                   COALESCE(SUM(CASE WHEN dt.type='Revenue' THEN dt.amount END), 0) AS current_revenue
            FROM businesses b
            LEFT JOIN daily_transactions dt ON dt.business_id = b.business_id
                AND EXTRACT(MONTH FROM dt.transaction_date) = EXTRACT(MONTH FROM CURRENT_DATE)
                AND EXTRACT(YEAR FROM dt.transaction_date) = EXTRACT(YEAR FROM CURRENT_DATE)
            GROUP BY b.business_id, b.business_name, b.monthly_target_revenue
            ORDER BY current_revenue DESC
            LIMIT 1
            """
        )
        if rows:
            row = rows[0]
            target = float(row["monthly_target_revenue"] or 100000)
            current = float(row["current_revenue"] or 0)
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
def api_categories():
    try:
        rows = execute_read_query_params(
            "SELECT DISTINCT category FROM daily_transactions ORDER BY category"
        )
        return jsonify({"categories": [r["category"] for r in rows if r["category"]]})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/dashboard/business-info", methods=["GET", "OPTIONS"])
def get_business_info():
    conn = get_db_connection()
    try:
        import psycopg2.extras

        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM public.businesses ORDER BY created_at DESC LIMIT 1")
        business = cur.fetchone()
        if not business:
            return jsonify({"error": "No business found"}), 404
        return jsonify(business)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


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
