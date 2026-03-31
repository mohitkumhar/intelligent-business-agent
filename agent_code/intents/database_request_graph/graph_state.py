from typing import Annotated, NotRequired, TypedDict

from langgraph.graph.message import add_messages


class DatabaseRequestGraphState(TypedDict):
    # input
    user_query: str
    messages: Annotated[list, add_messages]

    # routing & budget (LangGraph advisory / database orchestration)
    step_count: NotRequired[int]
    max_steps: NotRequired[int]
    high_level_intent: NotRequired[str]
    """database | advisory | hybrid | out_of_scope"""

    business_id: NotRequired[str]
    financial_context: NotRequired[str]
    advisory_result: NotRequired[str]
    structured_response: NotRequired[str]
    halt_pipeline: NotRequired[bool]
    emergency_reason: NotRequired[str]
    query_understood: NotRequired[str]
    partial_snapshot: NotRequired[str]
    chain_prior_summaries: NotRequired[str]
    """Markdown/text from earlier intents in the same user turn (chained execution)."""

    status_updates: NotRequired[list]
    error_message: NotRequired[str]

    # resolve_data_range
    date_range_start: str
    date_range_end: str
    date_range_description: str

    # validate_entities
    target_tables: list[str]
    target_columns: list[str]
    entities_valid: bool

    # fetch_table_schema
    table_schema: str

    # SQL_generation
    generated_sql: str
    sql_explanation: str

    # SQL_validation
    is_sql_valid: bool
    sql_validation_error: str
    sql_retry_count: int

    # execute_query
    query_results: str  # JSON string
    execution_error: str
    has_results: bool

    # logging
    log_entry: str

    # post_query_operations
    processed_data: str  # JSON string

    # business_insight_generator
    business_insight: str  # JSON string

    # format_response_of_business_insight_generator
    formatted_response: str

    # internal routing
    route: str
