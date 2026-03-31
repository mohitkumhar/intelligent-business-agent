from flask import Flask, request, jsonify, Response, stream_with_context, g
from flask_cors import CORS
import os
import sqlite3
import time
import json
import uuid
from datetime import datetime, timedelta, date
from dateutil.relativedelta import relativedelta
from dotenv import load_dotenv
from db_config import get_db_connection, execute_read_query_params
from transaction_import import parse_csv_bytes, parse_xlsx_bytes
from ocr_processor import extract_transactions_from_image

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
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16 MB uploads
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
    email = (data.get("email") or "").strip()
    if email:
        email = email.lower()

    if not all([business_name, email, full_name]):
        return jsonify({"is_error": True, "error": "Missing required fields"}), 400

    conn = get_db_connection()
    try:
        cur = conn.cursor()

        cur.execute("SELECT 1 FROM public.users WHERE email = %s", (email,))
        if cur.fetchone():
            return jsonify(
                {
                    "is_error": True,
                    "error": "An account with this email already exists. Please log in instead.",
                }
            ), 409

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


@app.route("/api/v1/import/transactions", methods=["POST", "OPTIONS"])
def api_import_transactions():
    """Upload CSV or Excel (.xlsx) with columns: date, type, category, amount, description."""
    if request.method == "OPTIONS":
        return "", 204
    email = (request.form.get("email") or request.args.get("email") or "").strip().lower()
    if not email:
        return jsonify({"error": "email is required (form field or query param)"}), 400
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    file = request.files["file"]
    if not file.filename:
        return jsonify({"error": "Empty filename"}), 400
    raw = file.read()
    fn = (file.filename or "").lower()
    try:
        if fn.endswith(".csv"):
            rows = parse_csv_bytes(raw)
        elif fn.endswith(".xlsx"):
            rows = parse_xlsx_bytes(raw)
        else:
            return jsonify(
                {"error": "Unsupported format. Use .csv or .xlsx (Excel 2007+)."}
            ), 400
    except Exception as e:
        logger.warning("import parse failed: %s", e)
        return jsonify({"error": str(e)}), 400

    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT b.business_id FROM public.businesses b
            JOIN public.users u ON u.business_id = b.business_id
            WHERE u.email = %s
            ORDER BY b.created_at DESC NULLS LAST
            LIMIT 1
            """,
            (email,),
        )
        r = cur.fetchone()
        if not r:
            return jsonify(
                {
                    "error": "No business found for this email. Complete onboarding on the landing page first.",
                }
            ), 404
        business_id = r[0]

        batch = [(business_id, d, typ, cat, amt, desc) for d, typ, cat, amt, desc in rows]
        cur.executemany(
            """
            INSERT INTO daily_transactions (business_id, transaction_date, type, category, amount, description)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            batch,
        )
        conn.commit()
        n = len(batch)
        return jsonify(
            {
                "success": True,
                "imported": n,
                "message": f"Imported {n} transaction(s) into your workspace.",
            }
        ), 201
    except Exception as e:
        conn.rollback()
        logger.error("import insert failed: %s", e, exc_info=True)
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


@app.route("/api/v1/import/receipt", methods=["POST", "OPTIONS"])
def api_import_receipt():
    """Store notebook / photo uploads for future AI extraction (file persisted on disk)."""
    if request.method == "OPTIONS":
        return "", 204
    email = (request.form.get("email") or request.args.get("email") or "").strip().lower()
    if not email:
        return jsonify({"error": "email is required"}), 400
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    file = request.files["file"]
    if not file.filename:
        return jsonify({"error": "Empty filename"}), 400

    base = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads", "receipts")
    os.makedirs(base, exist_ok=True)
    uid = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1].lower() or ".bin"
    if ext not in (".png", ".jpg", ".jpeg", ".webp", ".gif", ".heic", ".bin"):
        ext = ".bin"
    path = os.path.join(base, f"{uid}{ext}")
    file.save(path)
    logger.info("Receipt upload saved for %s -> %s", email, path)

    # Process AI extraction immediately
    try:
        # Re-read raw bytes for OCR or use file path
        with open(path, "rb") as f:
            raw_bytes = f.read()
        
        rows = extract_transactions_from_image(raw_bytes, file.filename)
        
        if not rows:
            return jsonify({"success": True, "file_id": uid, "message": "Image saved, but no transactions were extracted by AI."}), 201
            
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                """
                SELECT b.business_id FROM public.businesses b
                JOIN public.users u ON u.business_id = b.business_id
                WHERE u.email = %s
                ORDER BY b.created_at DESC NULLS LAST
                LIMIT 1
                """,
                (email,),
            )
            r = cur.fetchone()
            if not r:
                 return jsonify({"error": "No business found for this email. Complete onboarding first."}), 404
            
            business_id = r[0]
            batch = [(business_id, d, typ, cat, amt, desc) for d, typ, cat, amt, desc in rows]
            cur.executemany(
                """
                INSERT INTO daily_transactions (business_id, transaction_date, type, category, amount, description)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                batch,
            )
            conn.commit()
            n = len(batch)
            logger.info("AI extracted and imported %d transaction(s) for %s", n, email)
            return jsonify(
                {
                    "success": True,
                    "file_id": uid,
                    "imported": n,
                    "message": f"AI extracted and imported {n} transaction(s) from your handwritten ledger.",
                }
            ), 201
        except Exception as db_err:
            conn.rollback()
            logger.error("AI import DB insert failed: %s", db_err, exc_info=True)
            return jsonify({"error": f"Extracted data but failed to store: {str(db_err)}"}), 500
        finally:
            conn.close()

    except ValueError as val_err:
        # Specifically catch API Key errors or OCR parsing errors
        logger.warning("AI extraction warning for %s: %s", email, val_err)
        return jsonify({
            "success": True, 
            "file_id": uid, 
            "message": f"Image saved. (AI Note: {str(val_err)})"
        }), 201
    except Exception as e:
        logger.error("AI extraction failed for %s: %s", email, e, exc_info=True)
        return jsonify({
            "success": True, 
            "file_id": uid, 
            "message": "Image saved. AI extraction failed, but your data is safe."
        }), 201


# ─────────────────────────────────────────────
# REAL SQL DASHBOARD ROUTES (ported from web/app.py)
# SQL reviewed against company_db_schema.sql — tables/columns below exist in DDL.
# (Drift note: onboarding INSERT may use columns not in the checked-in DDL; unrelated to these SELECTs.)
# ─────────────────────────────────────────────

def get_business_by_user(cur, email=None):
    if email:
        cur.execute("""
            SELECT b.*, u.name as user_name, u.email as user_email FROM public.businesses b
            JOIN public.users u ON b.business_id = u.business_id
            WHERE u.email = %s
            ORDER BY b.created_at DESC LIMIT 1
        """, (email,))
    else:
        cur.execute("""
            SELECT b.*, u.name as user_name, u.email as user_email FROM public.businesses b
            LEFT JOIN public.users u ON b.business_id = u.business_id
            ORDER BY b.created_at DESC LIMIT 1
        """)
    return cur.fetchone()

def _parse_revenue(rev_str):
    """
    Parse onboarding `monthly_revenue` labels (e.g. '₹50K–₹2L', 'Under ₹50K') into one INR number.
    Uses the midpoint for ranges so KPIs match what the user selected.
    """
    import re

    if not rev_str:
        return 125000.0
    s = str(rev_str).strip().replace("—", "-").replace("–", "-")
    # Tokens: optional ₹, digits (incl. Indian grouping), optional K / L / Cr
    token_re = re.compile(
        r"(?:₹\s*)?([\d,.]+)\s*(K|k|L|l|CR|cr|Lakh|LAKH)?",
        re.UNICODE,
    )
    amounts = []
    for m in token_re.finditer(s):
        raw = m.group(1).replace(",", "")
        try:
            val = float(raw)
        except ValueError:
            continue
        suf = (m.group(2) or "").upper()
        if suf == "K":
            val *= 1000
        elif suf == "L":
            val *= 100000
        elif suf in ("CR",):
            val *= 10000000
        elif "LAKH" in suf:
            val *= 100000
        else:
            # e.g. "50" immediately before K in substring
            frag = s[max(0, m.start() - 1) : min(len(s), m.end() + 3)].upper()
            if val < 10000 and "K" in frag:
                val *= 1000
            elif val < 1000 and "L" in frag and "K" not in frag:
                val *= 100000
        amounts.append(val)
    if not amounts:
        return 125000.0
    if len(amounts) == 1:
        return float(amounts[0])
    return float(sum(amounts) / len(amounts))


def _dashboard_period_bounds(period: str):
    """Match dashboard `getPeriodBounds`: this_month | last_month | ytd."""
    today = date.today()
    y, m, d = today.year, today.month, today.day
    if period == "last_month":
        first_this = date(y, m, 1)
        last_prev = first_this - timedelta(days=1)
        start = date(last_prev.year, last_prev.month, 1)
        end = last_prev
        return start, end
    if period == "ytd":
        return date(y, 1, 1), today
    return date(y, m, 1), today


def _previous_period_window(start: date, end: date):
    """Same-length window immediately before `start` (for period-over-period KPIs)."""
    n_days = (end - start).days + 1
    prev_end = start - timedelta(days=1)
    prev_start = prev_end - timedelta(days=n_days - 1)
    return prev_start, prev_end


def _pct_change(curr: float, prev: float):
    if prev is None or prev == 0:
        return None if (curr is None or curr == 0) else 100.0
    return round((curr - prev) / prev * 100.0, 1)


def _aggregate_txns_for_window(cur, business_id, start: date, end: date):
    cur.execute(
        """
        SELECT
            COALESCE(SUM(CASE WHEN type = 'Revenue' THEN amount END), 0) AS tr,
            COALESCE(SUM(CASE WHEN type = 'Expense' THEN amount END), 0) AS te,
            COUNT(*) AS tc
        FROM daily_transactions
        WHERE business_id = %s
          AND transaction_date >= %s AND transaction_date <= %s
        """,
        (business_id, start, end),
    )
    row = cur.fetchone() or {}
    return (
        int(row.get("tc") or 0),
        float(row.get("tr") or 0),
        float(row.get("te") or 0),
    )


@app.route('/api/dashboard/summary', methods=['GET', 'OPTIONS'])
def get_dashboard_summary():
    email = request.args.get('email')
    period = request.args.get("period") or "this_month"
    conn = get_db_connection()
    try:
        import psycopg2.extras
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        business = get_business_by_user(cur, email)
        if not business:
            return jsonify({"error": "No business found"}), 404

        start, end = _dashboard_period_bounds(period)
        bid = business["business_id"]
        tc, tr, te = _aggregate_txns_for_window(cur, bid, start, end)
        p_start, p_end = _previous_period_window(start, end)
        p_tc, p_tr, p_te = _aggregate_txns_for_window(cur, bid, p_start, p_end)

        cur.execute(
            """
            SELECT COUNT(*) AS ca
            FROM alerts
            WHERE business_id = %s AND status = 'Active'
            """,
            (bid,),
        )
        alert_row = cur.fetchone() or {}
        active_from_db = int(alert_row.get("ca") or 0)

        cur.execute(
            """
            SELECT severity
            FROM alerts
            WHERE business_id = %s AND status = 'Active'
            ORDER BY
              CASE severity
                WHEN 'High' THEN 1
                WHEN 'Medium' THEN 2
                WHEN 'Low' THEN 3
                ELSE 4
              END
            LIMIT 1
            """,
            (bid,),
        )
        sev_row = cur.fetchone()
        highest_sev = (sev_row.get("severity") if sev_row else None) or None

        kpi_extra = {
            "revenue_change_pct": _pct_change(tr, p_tr),
            "expenses_change_pct": _pct_change(te, p_te),
            "net_profit_change_pct": _pct_change(tr - te, p_tr - p_te),
            "transactions_change_pct": _pct_change(float(tc), float(p_tc)),
        }

        if tc > 0:
            return jsonify({
                "business_name": business['business_name'],
                "total_revenue": int(round(tr)),
                "total_expenses": int(round(te)),
                "net_profit": int(round(tr - te)),
                "total_transactions": tc,
                "active_alerts": active_from_db,
                "alert_highest_severity": highest_sev,
                **kpi_extra,
            })

        base_rev = float(_parse_revenue(business.get('monthly_revenue')))
        expense_ratio = 0.6
        alerts = active_from_db if active_from_db else 2
        if business.get('biggest_challenge') == 'High Expenses':
            expense_ratio = 0.85
            alerts = max(alerts, 5)
        elif business.get('biggest_challenge') == 'Low Sales':
            base_rev *= 0.7
            alerts = max(alerts, 4)

        total_revenue = int(round(base_rev))
        total_expenses = int(round(base_rev * expense_ratio))
        net_profit = total_revenue - total_expenses

        return jsonify({
            "business_name": business['business_name'],
            "total_revenue": total_revenue,
            "total_expenses": total_expenses,
            "net_profit": net_profit,
            "total_transactions": 250 if base_rev < 100000 else 1200,
            "active_alerts": alerts,
            "alert_highest_severity": highest_sev,
            "revenue_change_pct": None,
            "expenses_change_pct": None,
            "net_profit_change_pct": None,
            "transactions_change_pct": None,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route("/api/dashboard/summary-sql", methods=["GET", "OPTIONS"])
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

@app.route('/api/dashboard/financial-overview', methods=['GET', 'OPTIONS'])
def get_financial_overview():
    email = request.args.get('email')
    conn = get_db_connection()
    try:
        import psycopg2.extras
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        business = get_business_by_user(cur, email)
        if not business:
            return jsonify({}), 404

        bid = business["business_id"]
        first_month = date.today().replace(day=1) - relativedelta(months=5)
        cur.execute(
            """
            SELECT date_trunc('month', transaction_date)::date AS m,
                   COALESCE(SUM(CASE WHEN type = 'Revenue' THEN amount END), 0) AS rev,
                   COALESCE(SUM(CASE WHEN type = 'Expense' THEN amount END), 0) AS exp
            FROM daily_transactions
            WHERE business_id = %s AND transaction_date >= %s
            GROUP BY 1
            ORDER BY 1
            """,
            (bid, first_month),
        )
        rows = cur.fetchall()
        by_m = {r["m"]: r for r in rows}
        labels = []
        revenue = []
        expenses = []
        for i in range(6):
            m = first_month + relativedelta(months=i)
            labels.append(f"{m.year}-{m.month:02d}")
            r = by_m.get(m)
            revenue.append(int(round(float(r["rev"] or 0))) if r else 0)
            expenses.append(int(round(float(r["exp"] or 0))) if r else 0)

        if sum(revenue) + sum(expenses) > 0:
            net_profit = [rv - ev for rv, ev in zip(revenue, expenses)]
            cash_balance = [int(max(0, rv * 0.2)) for rv in revenue]
            return jsonify({
                "labels": labels,
                "revenue": revenue,
                "expenses": expenses,
                "net_profit": net_profit,
                "cash_balance": cash_balance,
            })

        base_rev = _parse_revenue(business.get('monthly_revenue'))
        labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
        is_new = business.get('business_age') in ['0–6 months', 'Less than 1 year']
        trend = [0.8, 0.9, 1.0, 1.1, 1.2, 1.3] if is_new else [1.0, 1.05, 0.95, 1.1, 1.0, 1.08]
        revenue = [int(base_rev * t) for t in trend]
        expenses = [int(r * 0.7) for r in revenue]
        return jsonify({
            "labels": labels,
            "revenue": revenue,
            "expenses": expenses,
            "net_profit": [r - e for r, e in zip(revenue, expenses)],
            "cash_balance": [int(base_rev * 1.5) for _ in labels]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/dashboard/revenue-vs-expense', methods=['GET', 'OPTIONS'])
def get_revenue_vs_expense():
    email = request.args.get('email')
    period = request.args.get("period") or "this_month"
    conn = get_db_connection()
    try:
        import psycopg2.extras
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        business = get_business_by_user(cur, email)
        if not business:
            return jsonify({}), 404

        start, end = _dashboard_period_bounds(period)
        bid = business["business_id"]
        cur.execute(
            """
            SELECT * FROM (
                SELECT COALESCE(NULLIF(TRIM(category), ''), 'Other') AS cat,
                       COALESCE(SUM(CASE WHEN type = 'Revenue' THEN amount END), 0) AS rev,
                       COALESCE(SUM(CASE WHEN type = 'Expense' THEN amount END), 0) AS exp
                FROM daily_transactions
                WHERE business_id = %s
                  AND transaction_date >= %s AND transaction_date <= %s
                GROUP BY 1
            ) s
            ORDER BY rev + exp DESC
            LIMIT 12
            """,
            (bid, start, end),
        )
        rows = cur.fetchall()
        if rows:
            labels = [r["cat"] for r in rows]
            revenue = [int(round(float(r["rev"] or 0))) for r in rows]
            expenses = [int(round(float(r["exp"] or 0))) for r in rows]
            return jsonify({"labels": labels, "revenue": revenue, "expenses": expenses})

        cat = business.get('industry_type', 'Other')
        labels = ["Operations", "Marketing", "Payroll", "Rent", "Other"]
        if cat == 'Restaurant/Food':
            labels = ["Ingredients", "Staff", "Marketing", "Rent", "Utilities"]
        elif cat == 'Manufacturing':
            labels = ["Raw Materials", "Labor", "Energy", "Logistics", "Maintenance"]
        base_rev = _parse_revenue(business.get('monthly_revenue'))
        revenue = [int(base_rev * 0.4), int(base_rev * 0.3), int(base_rev * 0.3)]
        expenses = [int(base_rev * 0.25), int(base_rev * 0.15), int(base_rev * 0.2), int(base_rev * 0.1), int(base_rev * 0.1)]
        return jsonify({
            "labels": labels,
            "revenue": revenue + [0, 0],
            "expenses": expenses
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route("/api/dashboard/sales-trend", methods=["GET", "OPTIONS"])
def api_sales_trend():
    """Seven daily buckets from the business's latest transaction activity (or last 7 calendar days)."""
    email = request.args.get("email")
    conn = get_db_connection()
    try:
        import psycopg2.extras
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        business = get_business_by_user(cur, email)
        if not business:
            return jsonify({"labels": [], "revenue": [], "expenses": []})

        bid = business["business_id"]
        cur.execute(
            """
            SELECT MAX(transaction_date) AS max_txn_date
            FROM daily_transactions WHERE business_id = %s
            """,
            (bid,),
        )
        max_d = cur.fetchone()
        max_date = max_d["max_txn_date"] if max_d else None
        today = date.today()
        end = today
        if max_date:
            end = min(today, max_date)
        start = end - timedelta(days=6)

        cur.execute(
            """
            SELECT transaction_date,
                   COALESCE(SUM(CASE WHEN type = 'Revenue' THEN amount END), 0) AS revenue,
                   COALESCE(SUM(CASE WHEN type = 'Expense' THEN amount END), 0) AS expenses
            FROM daily_transactions
            WHERE business_id = %s
              AND transaction_date >= %s AND transaction_date <= %s
            GROUP BY transaction_date
            ORDER BY transaction_date
            """,
            (bid, start, end),
        )
        by_day = {r["transaction_date"]: r for r in cur.fetchall()}
        labels = []
        rev = []
        exp = []
        for i in range(7):
            d = start + timedelta(days=i)
            labels.append(d.isoformat())
            row = by_day.get(d)
            rev.append(float(row["revenue"]) if row else 0.0)
            exp.append(float(row["expenses"]) if row else 0.0)
        return jsonify({"labels": labels, "revenue": rev, "expenses": exp})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


@app.route("/api/dashboard/transactions-by-category", methods=["GET", "OPTIONS"])
def api_transactions_by_category():
    email = request.args.get("email")
    period = request.args.get("period") or "this_month"
    conn = get_db_connection()
    try:
        import psycopg2.extras
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        business = get_business_by_user(cur, email)
        if not business:
            return jsonify({"labels": [], "data": []})
        start, end = _dashboard_period_bounds(period)
        bid = business["business_id"]
        cur.execute(
            """
            SELECT COALESCE(NULLIF(TRIM(category), ''), 'Other') AS category, COUNT(*) AS cnt
            FROM daily_transactions
            WHERE business_id = %s
              AND transaction_date >= %s AND transaction_date <= %s
            GROUP BY 1
            ORDER BY cnt DESC
            """,
            (bid, start, end),
        )
        rows = cur.fetchall()
        return jsonify(
            {
                "labels": [r["category"] for r in rows],
                "data": [int(r["cnt"]) for r in rows],
            }
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


@app.route("/api/dashboard/alerts-by-severity", methods=["GET", "OPTIONS"])
def api_alerts_by_severity():
    email = request.args.get("email")
    conn = get_db_connection()
    try:
        import psycopg2.extras
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        business = get_business_by_user(cur, email)
        if not business:
            return jsonify({"labels": [], "data": []})
        bid = business["business_id"]
        cur.execute(
            """
            SELECT severity, COUNT(*) AS cnt
            FROM alerts
            WHERE status = 'Active' AND business_id = %s
            GROUP BY severity
            """,
            (bid,),
        )
        rows = cur.fetchall()
        return jsonify(
            {"labels": [r["severity"] for r in rows], "data": [int(r["cnt"]) for r in rows]}
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


@app.route("/api/dashboard/alerts-list", methods=["GET", "OPTIONS"])
def api_alerts_list():
    """Active alerts for the logged-in user's business (detail view / modal)."""
    email = request.args.get("email")
    conn = get_db_connection()
    try:
        import psycopg2.extras
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        business = get_business_by_user(cur, email)
        if not business:
            return jsonify({"alerts": []})
        bid = business["business_id"]
        cur.execute(
            """
            SELECT alert_id, alert_type, severity, message, status, created_at
            FROM alerts
            WHERE business_id = %s AND status = 'Active'
            ORDER BY
              CASE severity
                WHEN 'High' THEN 1
                WHEN 'Medium' THEN 2
                WHEN 'Low' THEN 3
                ELSE 4
              END,
              created_at DESC
            """,
            (bid,),
        )
        rows = cur.fetchall()
        out = []
        for r in rows:
            ca = r.get("created_at")
            out.append(
                {
                    "alert_id": int(r["alert_id"]),
                    "alert_type": r.get("alert_type") or "",
                    "severity": r.get("severity") or "",
                    "message": r.get("message") or "",
                    "status": r.get("status") or "",
                    "created_at": ca.isoformat() if ca else None,
                }
            )
        return jsonify({"alerts": out})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


@app.route("/api/dashboard/health-scores", methods=["GET", "OPTIONS"])
def api_health_scores():
    email = request.args.get("email")
    conn = get_db_connection()
    try:
        import psycopg2.extras
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        business = get_business_by_user(cur, email)
        if not business:
            return jsonify({"businesses": [], "scores": []})
        bid = business["business_id"]
        cur.execute(
            """
            SELECT bhs.overall_score, bhs.cash_score,
                   bhs.profitability_score, bhs.growth_score,
                   bhs.cost_control_score, bhs.risk_score,
                   b.business_name
            FROM business_health_scores bhs
            JOIN businesses b ON b.business_id = bhs.business_id
            WHERE bhs.business_id = %s
            ORDER BY bhs.calculated_at DESC
            LIMIT 5
            """,
            (bid,),
        )
        rows = cur.fetchall()
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
    finally:
        conn.close()


@app.route("/api/dashboard/top-products", methods=["GET", "OPTIONS"])
def api_top_products():
    email = request.args.get("email")
    conn = get_db_connection()
    try:
        import psycopg2.extras
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        business = get_business_by_user(cur, email)
        if not business:
            return jsonify({"labels": [], "stock": [], "margin": []})
        bid = business["business_id"]
        cur.execute(
            """
            SELECT p.product_name, p.stock_quantity, p.selling_price, p.cost_price
            FROM products p
            WHERE p.business_id = %s
            ORDER BY p.stock_quantity DESC NULLS LAST
            LIMIT 10
            """,
            (bid,),
        )
        rows = cur.fetchall()
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
    finally:
        conn.close()


@app.route("/api/dashboard/employee-stats", methods=["GET", "OPTIONS"])
def api_employee_stats():
    email = request.args.get("email")
    conn = get_db_connection()
    try:
        import psycopg2.extras
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        business = get_business_by_user(cur, email)
        if not business:
            return jsonify({"labels": [], "counts": [], "avg_salary": []})
        bid = business["business_id"]
        cur.execute(
            """
            SELECT status, COUNT(*) AS cnt, COALESCE(AVG(salary),0) AS avg_salary
            FROM employees
            WHERE business_id = %s
            GROUP BY status
            """,
            (bid,),
        )
        rows = cur.fetchall()
        return jsonify(
            {
                "labels": [r["status"] for r in rows],
                "counts": [int(r["cnt"]) for r in rows],
                "avg_salary": [round(float(r["avg_salary"]), 2) for r in rows],
            }
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


@app.route("/api/dashboard/recent-transactions", methods=["GET", "OPTIONS"])
def api_recent_transactions():
    limit = request.args.get("limit", 20, type=int)
    search = request.args.get("search", "").strip()
    category = request.args.get("category", "").strip()
    period = request.args.get("period", "").strip()
    email = request.args.get("email")
    conn = get_db_connection()
    try:
        import psycopg2.extras
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        business = get_business_by_user(cur, email)
        if not business:
            return jsonify({"transactions": []})

        bid = business["business_id"]
        base_sql = """
            SELECT transaction_id, transaction_date, type, category,
                   amount, description
            FROM daily_transactions
            WHERE business_id = %s
        """
        params = [bid]
        if period in ("this_month", "last_month", "ytd"):
            start, end = _dashboard_period_bounds(period)
            base_sql += " AND transaction_date >= %s AND transaction_date <= %s"
            params.extend([start, end])
        if search:
            base_sql += " AND (description ILIKE %s OR category ILIKE %s)"
            params.extend([f"%{search}%", f"%{search}%"])
        if category:
            base_sql += " AND category = %s"
            params.append(category)
        base_sql += " ORDER BY transaction_date DESC, transaction_id DESC LIMIT %s"
        params.append(limit)
        cur.execute(base_sql, tuple(params))
        rows = cur.fetchall()
        for r in rows:
            r["amount"] = float(r["amount"] or 0)
            if r.get("transaction_date"):
                r["transaction_date"] = r["transaction_date"].isoformat()
        return jsonify({"transactions": rows})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


@app.route("/api/dashboard/sales-target", methods=["GET", "OPTIONS"])
def api_sales_target():
    email = request.args.get("email")
    conn = get_db_connection()
    try:
        import psycopg2.extras
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        business = get_business_by_user(cur, email)
        if not business:
            return jsonify({"current_revenue": 0, "target_revenue": 100000, "percentage": 0})
        bid = business["business_id"]
        cur.execute(
            """
            SELECT b.business_name, b.monthly_target_revenue,
                   COALESCE(SUM(CASE WHEN dt.type = 'Revenue' THEN dt.amount END), 0) AS current_revenue
            FROM businesses b
            LEFT JOIN daily_transactions dt ON dt.business_id = b.business_id
                AND EXTRACT(MONTH FROM dt.transaction_date) = EXTRACT(MONTH FROM CURRENT_DATE)
                AND EXTRACT(YEAR FROM dt.transaction_date) = EXTRACT(YEAR FROM CURRENT_DATE)
            WHERE b.business_id = %s
            GROUP BY b.business_id, b.business_name, b.monthly_target_revenue
            """,
            (bid,),
        )
        rows = cur.fetchall()
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
    finally:
        conn.close()


@app.route("/api/dashboard/categories", methods=["GET", "OPTIONS"])
def api_categories():
    email = request.args.get("email")
    conn = get_db_connection()
    try:
        import psycopg2.extras
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        business = get_business_by_user(cur, email)
        if not business:
            return jsonify({"categories": []})
        bid = business["business_id"]
        cur.execute(
            """
            SELECT DISTINCT category FROM daily_transactions
            WHERE business_id = %s AND category IS NOT NULL AND TRIM(category) <> ''
            ORDER BY category
            """,
            (bid,),
        )
        rows = cur.fetchall()
        return jsonify({"categories": [r["category"] for r in rows]})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


@app.route("/api/dashboard/business-info", methods=["GET", "OPTIONS"])
def get_business_info():
    email = request.args.get('email')
    conn = get_db_connection()
    try:
        import psycopg2.extras

        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        business = get_business_by_user(cur, email)
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
