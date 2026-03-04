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

    config = {"configurable": {"thread_id": thread_id}}

    # ── check for a pending interrupt we should resume ──────────────
    is_resuming = False
    try:
        snapshot = database_request_graph_workflow.get_state(config)
        if snapshot and snapshot.next:          # graph is paused
            is_resuming = True
    except Exception:
        pass

    # ── invoke ──────────────────────────────────────────────────────
    try:
        if is_resuming:
            final_state = database_request_graph_workflow.invoke(
                Command(resume=input_query), config=config
            )
        else:
            initial_state = {
                "user_query": input_query,
                "messages": [{"role": "user", "content": input_query}],
                "sql_retry_count": 0,
            }
            final_state = database_request_graph_workflow.invoke(
                initial_state, config=config
            )
    except Exception as exc:
        # If the exception is a GraphInterrupt, the state is saved;
        # fall through to the snapshot check below.
        if "interrupt" in type(exc).__name__.lower():
            final_state = None
        else:
            return jsonify({
                "is_error": True,
                "error": f"Agent error: {exc}",
                "intent": intent,
            }), 500

    # ── did the graph pause for clarification? ──────────────────────
    try:
        post_snapshot = database_request_graph_workflow.get_state(config)
        if post_snapshot and post_snapshot.next:
            # Extract the interrupt payload
            interrupt_data = None
            for task in (post_snapshot.tasks or []):
                if hasattr(task, "interrupts") and task.interrupts:
                    interrupt_data = task.interrupts[0].value
                    break

            return jsonify({
                "is_error": False,
                "needs_clarification": True,
                "clarification": interrupt_data or {
                    "message": "Could you please clarify your question?"
                },
                "thread_id": thread_id,
                "intent": intent,
            }), 200
    except Exception:
        pass

    # ── graph completed — return the formatted response ─────────────
    result_text = (
        final_state.get("formatted_response", "No response generated.")
        if final_state else "No response generated."
    )

    return jsonify({
        "is_error": False,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "status": "ok",
        "intent": intent,
        "result": result_text,
        "thread_id": thread_id,
    }), 200


# ─── main endpoint ──────────────────────────────────────────────────
@app.route('/api/v1/query', methods=['POST', 'GET'])
def query_agent():

    input_query = request.args.get('input-query', '')
    thread_id = request.args.get('thread-id', '')
    print("Received query:", input_query, "with thread_id:", thread_id)

    if not input_query:
        return jsonify({
            "is_error": True,
            "error": "input query is required in form data"
        }), 400

    if not thread_id:
        return jsonify({
            "is_error": True,
            "error": "thread-id is required in form data"
        }), 400

    # ── check if this thread already has a pending interrupt ────────
    # (user might be replying to a clarification question; skip re-detection)
    try:
        snapshot = database_request_graph_workflow.get_state(
            {"configurable": {"thread_id": thread_id}}
        )
        if snapshot and snapshot.next:
            # Resume the interrupted database_request graph
            return _handle_database_request(
                input_query, thread_id, {"intent": "database_request"}
            )
    except Exception:
        pass

    # ── intent detection ────────────────────────────────────────────
    intent = intent_detection.detect_intent(input_query)
    print("####################")
    print(type(intent))
    print(intent)
    print(intent["intent"])
    print("####################")
    
    for i in intent['intent']:

        # general information / greeting 
        # ===============================
        
        if i in ["general_information_request", "greeting_request"]:
            config = {
                "configurable": {
                    "thread_id": thread_id
                }
            }

            initial_state = {
                "user_query": input_query,
                "messages": [{"role": "user", "content": input_query}]
            }

            final_state = general_information_graph_workflow.invoke(
                initial_state, config=config
            )

            # format response
            response = format_response.format_response(
                intent,
                final_state,
                auth_meta=None,
                intent_meta=None
            )
            return jsonify(response), 200

        # database request
        # ===============================
        
        # if intent["intent"] == "database_request":
        if i == "database_request":
            return _handle_database_request(input_query, thread_id, intent)


        # ── unsupported intents ─────────────────────────────────────────
        return jsonify({
            "error": f"Intent '{i}' is not yet supported.",
            "is_error": True,
        }), 400


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

