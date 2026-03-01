from flask import Flask, request, jsonify
from datetime import datetime
import os
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
                "business_id": "",
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

    # ── general information / greeting ──────────────────────────────
    if intent["intent"] in ["general_information_request", "greeting_request"]:
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

    # ── database request ────────────────────────────────────────────
    if intent["intent"] == "database_request":
        return _handle_database_request(input_query, thread_id, intent)

    # ── unsupported intents ─────────────────────────────────────────
    return jsonify({
        "error": f"Intent '{intent['intent']}' is not yet supported.",
        "is_error": True,
    }), 400


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)













# # Project: Flask agent with modular nodes and intent subgraphs
# # Layout shown here as separate file blocks. Save each block to the matching filename.

# """
# File: requirements.txt
# flask==2.2.5
# python-dotenv==1.0.0

# """


# """
# File: .env
# # Set a simple API key for authenticate_request to check
# API_KEY=secret-token
# """


# """
# File: app.py
# This is the Flask entrypoint. It orchestrates the node flow:
# __start__ -> authenticate_request -> intent_detection -> <intent node> -> format_response -> __end__
# """

# from flask import Flask, request, jsonify
# import os
# from dotenv import load_dotenv

# # load env
# load_dotenv()

# from nodes import authenticate_request, intent_detection, format_response
# from nodes import database_request, general_information_request, greeting_request, logs_request, metrics_request

# app = Flask(__name__)

# INTENT_HANDLERS = {
#     'database_request': database_request.handle,
#     'general_information_request': general_information_request.handle,
#     'greeting_request': greeting_request.handle,
#     'logs_request': logs_request.handle,
#     'metrics_request': metrics_request.handle,
# }

# @app.route('/api/v1/query', methods=['POST'])
# def query_agent():
#     # __start__
#     payload = request.json or {}
#     text = payload.get('input', '')

#     # authenticate_request node
#     ok, auth_meta = authenticate_request.authenticate(request)
#     if not ok:
#         return jsonify(format_response.format_error('authentication_failed', auth_meta)), 401

#     # intent_detection node
#     intent, intent_meta = intent_detection.detect_intent(text)

#     # choose handler
#     handler = INTENT_HANDLERS.get(intent)
#     if not handler:
#         # fallback to general information
#         handler = general_information_request.handle
#         intent = 'general_information_request'

#     # execute the selected intent subgraph (node)
#     result = handler(text, intent_meta)

#     # format_response node
#     response = format_response.format_response(intent, result, auth_meta, intent_meta)
#     return jsonify(response), 200


# if __name__ == '__main__':
#     app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=True)


# # """
# # File: nodes/__init__.py
# # """



# # """
# # File: nodes/authenticate_request.py
# # """


# # """
# # File: nodes/intent_detection.py
# # """

# # """
# # File: nodes/format_response.py
# # """

# # """
# # File: nodes/database_request.py
# # """


# # """
# # File: nodes/general_information_request.py
# # """

# # """
# # File: nodes/greeting_request.py
# # """


# # """
# # File: nodes/logs_request.py
# # """


# # """
# # File: nodes/metrics_request.py
# # """


# # """
# # File: llm/mock_llm.py
# # This mock LLM module simulates intent detection and provides simple responses per intent.
# # Replace with a real LLM client later.
# # """

# # KEYWORDS = {
# #     'greeting': ['hello', 'hi', 'hey', 'good morning', 'good evening'],
# #     'database_request': ['db', 'database', 'query', 'select', 'find'],
# #     'logs_request': ['logs', 'log', 'error', 'traceback'],
# #     'metrics_request': ['metric', 'cpu', 'memory', 'throughput', 'latency'],
# #     'general_information_request': ['what', 'how', 'who', 'when', 'why'],
# # }


# # def detect_intent(text: str):
# #     t = (text or '').lower()
# #     for intent, kws in KEYWORDS.items():
# #         for k in kws:
# #             if k in t:
# #                 return intent, {'matched_keyword': k}
# #     # default
# #     return 'general_information_request', {'matched_keyword': None}


# # def respond_for_intent(intent: str, text: str, meta: dict):
# #     # basic canned responses per intent
# #     if intent == 'greeting':
# #         return {'message': 'Hello! How can I help you today?'}
# #     if intent == 'database_request':
# #         return {'message': f"I can run a DB query for: '{text}' (mock)"}
# #     if intent == 'logs_request':
# #         return {'message': 'I found 3 log entries that match your query (mock)'}
# #     if intent == 'metrics_request':
# #         return {'cpu': '12%', 'memory': '256MB', 'note': 'mock metrics'}
# #     return {'message': f"General info answer for: '{text}' (mock)"}


# # """
# # File: intents/greeting/subgraph.py
# # Each intent subgraph is a small set of steps. Real subgraphs may have many steps and calls to tools.
# # We keep them simple and return structured outputs.
# # """

# # def run(text, meta):
# #     # e.g., steps: parse -> select response -> enrich
# #     parsed = {'text_len': len(text)}
# #     response = {
# #         'parsed': parsed,
# #         'reply': 'Hi there! (from greeting subgraph)'
# #     }
# #     return response


# # """
# # File: intents/general_information/subgraph.py
# # """

# # def run(text, meta):
# #     # steps: search knowledge base -> produce answer
# #     answer = f"This is a mock general-information response to: '{text}'"
# #     return {'answer': answer, 'kb_matches': 0}


# # """
# # File: intents/database/subgraph.py
# # """

# # def run(text, meta):
# #     # steps: parse query -> run mock DB -> format rows
# #     rows = [
# #         {'id': 1, 'name': 'Alice'},
# #         {'id': 2, 'name': 'Bob'},
# #     ]
# #     return {'query': text, 'rows': rows}


# # """
# # File: intents/logs/subgraph.py
# # """

# # def run(text, meta):
# #     # steps: filter logs -> summarize
# #     logs = [
# #         {'ts': '2026-02-24T10:00:00Z', 'level': 'ERROR', 'msg': 'Something failed'},
# #         {'ts': '2026-02-24T10:02:00Z', 'level': 'WARN', 'msg': 'Slow response'},
# #     ]
# #     return {'query': text, 'logs': logs}


# # """
# # File: intents/metrics/subgraph.py
# # """

# # def run(text, meta):
# #     metrics = {'cpu': '10%', 'memory': '120MB', 'requests_per_min': 45}
# #     return {'query': text, 'metrics': metrics}


# # """
# # File: README.md
# # Instructions to run the project:
# # 1. Save each file under the exact path shown by the "File: ..." header.
# # 2. Create a virtualenv and install requirements: pip install -r requirements.txt
# # 3. Copy .env to the project root (or set API_KEY env var). Default key is 'secret-token'.
# # 4. Run: python app.py
# # 5. Example request:
# #    curl -X POST http://127.0.0.1:5000/api/v1/query \
# #      -H "Content-Type: application/json" \
# #      -H "X-API-KEY: secret-token" \
# #      -d '{"input": "hello"}'

# # Notes:
# # - Each node lives in its own file under nodes/ and delegates intent-specific logic to intents/* subgraphs.
# # - The llm/mock_llm.py simulates intent detection and canned responses. Replace with a real LLM client for production.
# # """
