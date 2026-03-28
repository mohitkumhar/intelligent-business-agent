"""
Logs-request node.

Invokes the logs_request_graph subgraph which:
  1. Parses the user query to extract a LogQL expression and time range.
  2. Fetches matching log lines from Loki.
  3. Analyses the logs with an LLM.
  4. Formats a user-friendly markdown response.
"""

from intents.logs_request_graph.subgraph import logs_request_graph_workflow
from logger.logger import logger


def handle_logs_request(
    input_query: str,
    thread_id: str,
) -> dict:
    """Run the logs-request LangGraph and return the final state.

    Args:
        input_query: The raw user question, e.g. "show me recent errors".
        thread_id:   The conversation thread ID used for LangGraph checkpointing.

    Returns:
        The final graph state dict. The caller should read ``state["formatted_response"]``.
    """

    logger.info(
        f"[logs_request] Handling logs request - query='{input_query}', thread_id='{thread_id}'"
    )

    config = {"configurable": {"thread_id": thread_id}}

    initial_state = {
        "user_query": input_query,
        "messages": [{"role": "user", "content": input_query}],
    }

    try:
        final_state = logs_request_graph_workflow.invoke(
            initial_state, config=config
        )
        logger.info(
            f"[logs_request] Graph completed for thread_id='{thread_id}'"
        )
        return final_state
    except Exception as exc:
        logger.error(
            f"[logs_request] Graph invocation failed for thread_id='{thread_id}': {exc}",
            exc_info=True,
        )
        raise
