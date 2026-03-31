"""
Logical agent state shape (API / logging). The app uses Flask + multiple LangGraph
subgraphs; field names align with logging and future parent-graph consolidation.

See also: intents.database_request_graph.graph_state.DatabaseRequestGraphState
"""
from typing import List, NotRequired, TypedDict


class AgentState(TypedDict):
    """Fields used for tracing, SSE status_updates, and loop protection."""

    user_query: str
    intent: NotRequired[str]
    messages: NotRequired[list]
    route: NotRequired[str]
    step_count: NotRequired[int]
    max_steps: NotRequired[int]
    sql_retry_count: NotRequired[int]
    is_sql_valid: NotRequired[bool]
    error_message: NotRequired[str]
    status_updates: NotRequired[List[dict]]
    generated_sql: NotRequired[str]
