# database_request node
# The primary entry-point is the LangGraph subgraph in
# intents/database_request_graph/subgraph.py, invoked directly by app.py.
# This module is kept as a thin wrapper for any non-graph callers.

from intents.database_request_graph.subgraph import database_request_graph_workflow


def handle(text, intent_meta, thread_id):
    """
    Run the database-request subgraph synchronously.
    Prefer calling the subgraph directly from app.py for full
    interrupt (human-in-the-loop) support.
    """

    if not thread_id:
        raise ValueError("Thread Id is missing")
    
    config = {"configurable": {"thread_id": thread_id}}
    initial_state = {
        "user_query": text,
        "messages": [{"role": "user", "content": text}],
        "sql_retry_count": 0,
    }
    result = database_request_graph_workflow.invoke(initial_state, config=config)
    return result.get("formatted_response", "No response generated.")
