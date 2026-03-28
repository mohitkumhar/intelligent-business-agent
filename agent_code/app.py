from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
import time
import json
from datetime import datetime
from dotenv import load_dotenv
from db_config import get_db_connection
import uuid

load_dotenv()

# keep only required imports
from nodes import intent_detection, format_response
from nodes.logs_request import handle_logs_request
from nodes.metrics_request import handle_metrics_request

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
    Counter, Histogram, Gauge, generate_latest,
    CONTENT_TYPE_LATEST, REGISTRY,
)

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

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

from flask import g as flask_g

@app.before_request
def _start_timer():
    flask_g.start_time = time.time()

@app.after_request
def _record_metrics(response):
    if request.path == "/metrics":
        return response
    latency = time.time() - getattr(flask_g, "start_time", time.time())
    endpoint = request.endpoint or "unknown"
    AGENT_REQUEST_COUNT.labels(request.method, endpoint, response.status_code).inc()
    AGENT_REQUEST_LATENCY.labels(request.method, endpoint).observe(latency)
    return response

@app.route("/metrics")
def metrics_endpoint():
    return Response(generate_latest(REGISTRY), mimetype=CONTENT_TYPE_LATEST)


# helper: Handle Streaming from LangGraph
# ============================================
def _stream_graph(workflow, initial_state, config, intent_dict, final_node_names, resume_input=None):
    intent_str = ",".join(intent_dict["intent"])
    clarification = None
    
    try:
        # If resuming, we pass a Command object. Otherwise, we pass the initial state dict.
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
        # Check if paused for clarification
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


logger.info("Starting Intelligent AI Agent...")
@app.route("/")
def home():
    logger.info("Home endpoint '/' was accessed.")
    return "Intelligent AI Agent is running. Use the /api/v1/query endpoint to interact with the agent."

# main endpoint 
# =====================
@app.route('/api/v1/query', methods=['POST', 'GET'])
def query_agent():

    logger.info(f"'/api/v1/query' endpoint hit with method: {request.method}")
    input_query = request.args.get('input-query', '')
    thread_id = request.args.get('thread-id', '')
    logger.info(f"Received query: '{input_query}' with thread_id: '{thread_id}'")

    if not input_query:
        logger.error("Input query is missing in the request.")
        return jsonify({
            "is_error": True,
            "error": "input query is required in form data"
        }), 400

    if not thread_id:
        logger.error("Thread ID is missing in the request.")
        return jsonify({
            "is_error": True,
            "error": "thread-id is required in form data"
        }), 400

    config = {"configurable": {"thread_id": thread_id}}

    # 1. Check if database_request has a pending interrupt we should resume
    try:
        logger.info(f"Checking for pending interrupts for thread_id: '{thread_id}'")
        snapshot = database_request_graph_workflow.get_state(config)
        if snapshot and snapshot.next:
            logger.info(f"Pending interrupt found for thread_id: '{thread_id}'. Resuming database_request graph.")
            intent_dict = {"intent": ["database_request"]}
            generator = _stream_graph(
                database_request_graph_workflow, 
                None, 
                config, 
                intent_dict, 
                ["format_response_of_business_insight_generator"], 
                resume_input=input_query
            )
            resp = Response(stream_with_context(generator), mimetype='text/event-stream')
            resp.headers['Cache-Control'] = 'no-cache, no-transform'
            resp.headers['X-Accel-Buffering'] = 'no'
            resp.headers['Connection'] = 'keep-alive'
            return resp
    except Exception as e:
        logger.warning(f"Error checking for pending interrupt for thread_id '{thread_id}': {e}", exc_info=True)

    # 2. Intent detection 
    # ===============================
    logger.info(f"No pending interrupt for thread_id: '{thread_id}'. Starting intent detection.")
    intent = intent_detection.detect_intent(input_query)
    logger.info(f"Detected intent for query '{input_query}': {intent}")
    
    # We will process the first valid intent for streaming
    for i in intent['intent']:
        logger.info(f"Processing intent '{i}' for thread_id: '{thread_id}'")
        AGENT_INTENT_COUNT.labels(i).inc()
        intent_start = time.time()
        
        # General Info / Greeting
        # ===============================
        if i in ["general_information_request", "greeting_request"]:
            def generate_general():
                initial_state = {
                    "user_query": input_query,
                    "messages": [{"role": "user", "content": input_query}]
                }
                intent_str = ",".join(intent["intent"])
                try:
                    yield f"data: {json.dumps({'type': 'status', 'status': 'Analyzing query context...'})}\n\n"
                    final_state = general_information_graph_workflow.invoke(initial_state, config=config)
                    yield f"data: {json.dumps({'type': 'status', 'status': 'Generating response...'})}\n\n"
                    # We stream the final formatting helper instead of graph itself to preserve current architecture
                    for token in format_response.format_response_stream(intent, final_state):
                        yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"
                    yield f"data: {json.dumps({'type': 'final', 'intent_str': intent_str})}\n\n"
                    AGENT_INTENT_LATENCY.labels(i).observe(time.time() - intent_start)
                except Exception as exc:
                    logger.error(f"Error in general_information_graph: {exc}", exc_info=True)
                    yield f"data: {json.dumps({'type': 'error', 'error': str(exc), 'intent_str': intent_str})}\n\n"
            resp = Response(stream_with_context(generate_general()), mimetype='text/event-stream')
            resp.headers['Cache-Control'] = 'no-cache, no-transform'
            resp.headers['X-Accel-Buffering'] = 'no'
            resp.headers['Connection'] = 'keep-alive'
            return resp

        # Database Request
        # ===============================
        if i == "database_request":
            initial_state = {
                "user_query": input_query,
                "messages": [{"role": "user", "content": input_query}],
                "sql_retry_count": 0,
            }
            generator = _stream_graph(
                database_request_graph_workflow, 
                initial_state, 
                config, 
                intent, 
                ["format_response_of_business_insight_generator"]
            )
            AGENT_INTENT_LATENCY.labels(i).observe(time.time() - intent_start)
            resp = Response(stream_with_context(generator), mimetype='text/event-stream')
            resp.headers['Cache-Control'] = 'no-cache, no-transform'
            resp.headers['X-Accel-Buffering'] = 'no'
            resp.headers['Connection'] = 'keep-alive'
            return resp

        # Logs Request
        # ===============================
        if i == "logs_request":
            initial_state = {
                "user_query": input_query,
                "messages": [{"role": "user", "content": input_query}],
            }
            generator = _stream_graph(
                logs_request_graph_workflow, 
                initial_state, 
                config, 
                intent, 
                ["format_logs_response"]
            )
            AGENT_INTENT_LATENCY.labels(i).observe(time.time() - intent_start)
            resp = Response(stream_with_context(generator), mimetype='text/event-stream')
            resp.headers['Cache-Control'] = 'no-cache, no-transform'
            resp.headers['X-Accel-Buffering'] = 'no'
            resp.headers['Connection'] = 'keep-alive'
            return resp

        # Metrics Request
        # ===============================
        if i == "metrics_request":
            initial_state = {
                "user_query": input_query,
                "messages": [{"role": "user", "content": input_query}],
            }
            generator = _stream_graph(
                metrics_request_graph_workflow, 
                initial_state, 
                config, 
                intent, 
                ["format_metrics_response"]
            )
            AGENT_INTENT_LATENCY.labels(i).observe(time.time() - intent_start)
            resp = Response(stream_with_context(generator), mimetype='text/event-stream')
            resp.headers['Cache-Control'] = 'no-cache, no-transform'
            resp.headers['X-Accel-Buffering'] = 'no'
            resp.headers['Connection'] = 'keep-alive'
            return resp

        # unsupported intents 
        # ==========================
        logger.warning(f"Unsupported intent '{i}' for query: '{input_query}'")
        def generate_unsupported():
            yield f"data: {json.dumps({'type': 'error', 'error': f'Intent {i} is not yet supported.', 'intent_str': ','.join(intent['intent'])})}\n\n"
        resp = Response(stream_with_context(generate_unsupported()), mimetype='text/event-stream')
        resp.headers['Cache-Control'] = 'no-cache, no-transform'
        resp.headers['X-Accel-Buffering'] = 'no'
        resp.headers['Connection'] = 'keep-alive'
        return resp


@app.route('/api/v1/onboarding', methods=['POST'])
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

    # Business data
    business_name = data.get('business_name')
    industry_type = data.get('business_category') # Mapping from form: Business Category
    city = data.get('city')
    employees_range = data.get('employees_range') # Mapping from form: Number of Employees
    monthly_revenue = data.get('monthly_revenue')
    business_age = data.get('business_age')
    biggest_challenge = data.get('biggest_challenge')
    finance_tracking_method = data.get('finance_tracking_method')
    onboarding_notes = data.get('onboarding_notes')

    # User data
    full_name = data.get('full_name')
    phone = data.get('phone')
    email = data.get('email')

    if not all([business_name, email, full_name]):
        return jsonify({"is_error": True, "error": "Missing required fields"}), 400

    conn = get_db_connection()
    try:
        cur = conn.cursor()
        
        # 1. Insert into businesses
        # Note: we use UUID if generated by DB, or we can generate it here
        business_id = str(uuid.uuid4())
        cur.execute("""
            INSERT INTO public.businesses (
                business_id, business_name, industry_type, owner_name, 
                city, business_age, employees_range, biggest_challenge, 
                finance_tracking_method, onboarding_notes
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING business_id
        """, (
            business_id, business_name, industry_type, full_name,
            city, business_age, employees_range, biggest_challenge,
            finance_tracking_method, onboarding_notes
        ))
        
        # 2. Insert role
        cur.execute("""
            INSERT INTO public.roles (business_id, role_name, description)
            VALUES (%s, %s, %s)
            RETURNING role_id
        """, (business_id, 'Owner', 'Business owner role created during onboarding'))
        role_id = cur.fetchone()[0]
        
        # 3. Insert user
        cur.execute("""
            INSERT INTO public.users (
                business_id, role_id, name, email, password_hash, phone
            ) VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING user_id
        """, (
            business_id, role_id, full_name, email, 
            'no_password_set', phone # Password will be set later
        ))
        
        conn.commit()
        logger.info(f"Onboarding successful for business: {business_name}")
        return jsonify({
            "success": True, 
            "business_id": business_id,
            "message": "Business onboarding successful"
        }), 201
        
    except Exception as e:
        conn.rollback()
        logger.error(f"Onboarding failed: {str(e)}", exc_info=True)
        return jsonify({"is_error": True, "error": str(e)}), 500
    finally:
        conn.close()


def _parse_revenue(rev_str):
    """Helper to parse revenue strings like '₹10L–₹50L' to a base number."""
    if not rev_str: return 100000
    if 'Above ₹50L' in rev_str: return 6000000
    if '₹10L–₹50L' in rev_str: return 2500000
    if '₹2L–₹10L' in rev_str: return 600000
    if '₹50K–₹2L' in rev_str: return 120000
    if 'Under ₹50K' in rev_str: return 35000
    return 100000

@app.route('/api/dashboard/summary', methods=['GET', 'OPTIONS'])
def get_dashboard_summary():
    conn = get_db_connection()
    try:
        import psycopg2.extras
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM public.businesses ORDER BY created_at DESC LIMIT 1")
        business = cur.fetchone()
        if not business:
            return jsonify({"error": "No business found"}), 404
            
        base_rev = _parse_revenue(business.get('monthly_revenue'))
        # Adjust data based on challenge
        expense_ratio = 0.6
        alerts = 2
        if business.get('biggest_challenge') == 'High Expenses':
            expense_ratio = 0.85
            alerts = 5
        elif business.get('biggest_challenge') == 'Low Sales':
            base_rev *= 0.7
            alerts = 4
            
        return jsonify({
            "business_name": business['business_name'],
            "total_revenue": base_rev,
            "total_expenses": int(base_rev * expense_ratio),
            "net_profit": int(base_rev * (1 - expense_ratio)),
            "total_transactions": 250 if base_rev < 100000 else 1200,
            "active_alerts": alerts
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/dashboard/financial-overview', methods=['GET', 'OPTIONS'])
def get_financial_overview():
    conn = get_db_connection()
    try:
        import psycopg2.extras
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM public.businesses ORDER BY created_at DESC LIMIT 1")
        business = cur.fetchone()
        if not business: return jsonify({}), 404
        
        base_rev = _parse_revenue(business.get('monthly_revenue'))
        labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
        
        # Simulating a trend based on business age
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
    finally:
        conn.close()

@app.route('/api/dashboard/revenue-vs-expense', methods=['GET', 'OPTIONS'])
def get_revenue_vs_expense():
    conn = get_db_connection()
    try:
        import psycopg2.extras
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM public.businesses ORDER BY created_at DESC LIMIT 1")
        business = cur.fetchone()
        if not business: return jsonify({}), 404
        
        cat = business.get('industry_type', 'Other')
        # Dynamic categories based on industry
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
            "revenue": revenue + [0, 0], # padding for chart
            "expenses": expenses
        })
    finally:
        conn.close()

@app.route('/api/dashboard/sales-trend', methods=['GET', 'OPTIONS'])
def get_sales_trend():
    labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    return jsonify({
        "labels": labels,
        "revenue": [1200, 1500, 1100, 1800, 2200, 2800, 2400],
        "expenses": [800, 900, 850, 1000, 1200, 1500, 1300]
    })

@app.route('/api/dashboard/business-info', methods=['GET', 'OPTIONS'])
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


if __name__ == '__main__':
    try:
        logger.info("Starting Flask development server.")
        app.run(host='0.0.0.0', port=5000, debug=True)
    except Exception as e:
        logger.critical(f"Failed to start the server: {e}", exc_info=True)
