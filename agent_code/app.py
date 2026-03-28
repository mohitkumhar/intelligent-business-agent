from flask import Flask, request, jsonify, Response, stream_with_context
import time
import json
from datetime import datetime
from dotenv import load_dotenv

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


if __name__ == '__main__':
    try:
        logger.info("Starting Flask development server.")
        app.run(host='0.0.0.0', port=5000, debug=True)
    except Exception as e:
        logger.critical(f"Failed to start the server: {e}", exc_info=True)
