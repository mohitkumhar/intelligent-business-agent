from flask import Flask, request, jsonify
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# keep only required imports
from nodes import intent_detection, format_response

# import subgraphs
from intents.general_information_graph.subgraph import general_information_graph_workflow
from intents.database_request_graph.subgraph import database_request_graph_workflow

# langgraph helpers for human-in-the-loop
from langgraph.types import Command

from logger.logger import logger

app = Flask(__name__)


# ─── helper: handle database_request with interrupt support ─────────
def _handle_database_request(input_query: str, thread_id: str, intent: dict):
    """
    Invoke the database-request subgraph.
    Handles the human-in-the-loop interrupt flow:
      1. New query  → invoke with initial state
      2. Resuming   → invoke with Command(resume=<user answer>)
    After invoke, checks whether the graph paused (interrupt) or finished.
    """

    logger.info(f"Handling database request for thread_id: '{thread_id}'")
    config = {"configurable": {"thread_id": thread_id}}

    # ── check for a pending interrupt we should resume ──────────────
    is_resuming = False
    try:
        logger.info(f"Checking for pending interrupt for thread_id: '{thread_id}' in database_request_graph.")
        snapshot = database_request_graph_workflow.get_state(config)
        if snapshot and snapshot.next:          # graph is paused
            is_resuming = True
            logger.info(f"Found pending interrupt for thread_id: '{thread_id}'. Resuming graph.")
    except Exception as e:
        logger.warning(f"Could not check for pending interrupt for thread_id '{thread_id}': {e}", exc_info=True)

    # invoke
    try:
        if is_resuming:
            logger.info(f"Resuming database_request_graph_workflow for thread_id: '{thread_id}'")
            final_state = database_request_graph_workflow.invoke(
                Command(resume=input_query), config=config
            )
            logger.info(f"Resumed database_request_graph_workflow completed for thread_id: '{thread_id}'. Final state: {final_state}")
        else:
            logger.info(f"Invoking database_request_graph_workflow for new query on thread_id: '{thread_id}'")
            initial_state = {
                "user_query": input_query,
                "messages": [{"role": "user", "content": input_query}],
                "sql_retry_count": 0,
            }
            logger.info(f"Initial state for database_request_graph for thread_id '{thread_id}': {initial_state}")
            final_state = database_request_graph_workflow.invoke(
                initial_state, config=config
            )
            logger.info(f"database_request_graph_workflow completed for thread_id: '{thread_id}'. Final state: {final_state}")
    except Exception as exc:
        # If the exception is a GraphInterrupt, the state is saved;
        # fall through to the snapshot check below.
        if "interrupt" in type(exc).__name__.lower():
            logger.info(f"GraphInterrupt occurred for thread_id: '{thread_id}'. State is saved.")
            final_state = None
        else:
            logger.error(f"Agent error during database_request_graph_workflow invocation for thread_id '{thread_id}': {exc}", exc_info=True)
            return jsonify({
                "is_error": True,
                "error": f"Agent error: {exc}",
                "intent": intent,
            }), 500

    # did the graph pause for clarification?
    try:
        logger.info(f"Checking for post-invocation snapshot for thread_id: '{thread_id}'")
        post_snapshot = database_request_graph_workflow.get_state(config)
        if post_snapshot and post_snapshot.next:
            # Extract the interrupt payload
            interrupt_data = None
            for task in (post_snapshot.tasks or []):
                if hasattr(task, "interrupts") and task.interrupts:
                    interrupt_data = task.interrupts[0].value
                    break

            logger.info(f"Graph paused for clarification for thread_id: '{thread_id}'.")
            return jsonify({
                "is_error": False,
                "needs_clarification": True,
                "clarification": interrupt_data or {
                    "message": "Could you please clarify your question?"
                },
                "thread_id": thread_id,
                "intent": intent,
            }), 200
    except Exception as e:
        logger.warning(f"Could not get post-invocation snapshot for thread_id '{thread_id}': {e}", exc_info=True)

    # graph completed - return the formatted response
    result_text = (
        final_state.get("formatted_response", "No response generated.")
        if final_state else "No response generated."
    )

    logger.info(f"Database request graph completed for thread_id: '{thread_id}'.")
    return jsonify({
        "is_error": False,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "status": "ok",
        "intent": intent,
        "result": result_text,
        "thread_id": thread_id,
    }), 200

logger.info("Starting Intelligent AI Agent...")
@app.route("/")
def home():
    logger.info("Home endpoint '/' was accessed.")
    return "Intelligent AI Agent is running. Use the /api/v1/query endpoint to interact with the agent."

# ─── main endpoint ──────────────────────────────────────────────────
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

    # check if this thread already has a pending interrupt
    # (user might be replying to a clarification question; skip re-detection)
    try:
        logger.info(f"Checking for pending interrupts for thread_id: '{thread_id}'")
        snapshot = database_request_graph_workflow.get_state(
            {"configurable": {"thread_id": thread_id}}
        )
        if snapshot and snapshot.next:
            logger.info(f"Pending interrupt found for thread_id: '{thread_id}'. Resuming database_request graph.")
            # Resume the interrupted database_request graph
            return _handle_database_request(
                input_query, thread_id, {"intent": "database_request"}
            )
    except Exception as e:
        logger.warning(f"Error checking for pending interrupt for thread_id '{thread_id}': {e}", exc_info=True)

    # ── intent detection ────────────────────────────────────────────
    logger.info(f"No pending interrupt for thread_id: '{thread_id}'. Starting intent detection.")
    intent = intent_detection.detect_intent(input_query)
    logger.info(f"Detected intent for query '{input_query}': {intent}")
    
    for i in intent['intent']:
        logger.info(f"Processing intent '{i}' for thread_id: '{thread_id}'")

        # general information / greeting 
        # ===============================

        if i in ["general_information_request", "greeting_request"]:
            logger.info(f"Invoking general_information_graph for intent '{i}' on thread_id: '{thread_id}'")
            config = {
                "configurable": {
                    "thread_id": thread_id
                }
            }

            initial_state = {
                "user_query": input_query,
                "messages": [{"role": "user", "content": input_query}]
            }
            
            logger.info(f"Initial state for thread_id: {thread_id} for general_information_graph: {initial_state}")

            final_state = general_information_graph_workflow.invoke(
                initial_state, config=config
            )
            
            logger.info(f"general_information_graph_workflow completed for thread_id: '{thread_id}'. Final state: {final_state}")

            logger.info(f"General information graph finished for thread_id: '{thread_id}'. Formatting response.")
            # format response
            response = format_response.format_response(
                intent,
                final_state,
                auth_meta=None,
                intent_meta=None
            )
            
            logger.info(f"Formatted response for thread_id: '{thread_id}': {response}")
            return jsonify(response), 200

        # database request
        # ===============================
        
        # if intent["intent"] == "database_request":
        if i == "database_request":
            logger.info(f"Handling database_request intent for thread_id: '{thread_id}'")
            return _handle_database_request(input_query, thread_id, intent)


        # ── unsupported intents ─────────────────────────────────────────
        logger.warning(f"Unsupported intent '{i}' for query: '{input_query}'")
        return jsonify({
            "error": f"Intent '{i}' is not yet supported.",
            "is_error": True,
        }), 400


if __name__ == '__main__':
    try:
        logger.info("Starting Flask development server.")
        app.run(host='0.0.0.0', port=5000, debug=True)
    except Exception as e:
        logger.critical(f"Failed to start the server: {e}", exc_info=True)
