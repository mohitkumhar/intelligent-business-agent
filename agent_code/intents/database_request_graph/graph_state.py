from typing import Annotated, TypedDict
from langgraph.graph.message import add_messages


class DatabaseRequestGraphState(TypedDict):
    # input
    user_query: str
    messages: Annotated[list, add_messages]

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
    query_results: str          # JSON string
    execution_error: str
    has_results: bool

    # logging
    log_entry: str

    # post_query_operations
    processed_data: str         # JSON string

    # business_insight_generator
    business_insight: str       # JSON string

    # format_response_of_business_insight_generator
    formatted_response: str

    # internal routing
    route: str
