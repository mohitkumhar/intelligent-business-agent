"""
Database Request Subgraph

Graph flow:
  __start__
    -> resolve_data_range
    -> validate_entities
    -> fetch_table_schema
    -> SQL_generation
    -> SQL_validation  (can loop back to SQL_generation up to 2 retries)
    -> execute_query
    -> logging
    -> post_query_operations
    -> business_insight_generator
    -> format_response_of_business_insight_generator
  __end__

Human-in-the-loop:
  validate_entities uses interrupt() when table references are ambiguous
  or unrecognisable, asking the user for clarification before continuing.
"""

from typing import TypedDict, Annotated
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.checkpoint.postgres import PostgresSaver
from psycopg_pool import ConnectionPool
from dotenv import load_dotenv
import psycopg
import logging
import os
from intents.database_request_graph.utils import (
    resolve_data_range,
    validate_entities,
    fetch_table_schema,
    sql_generation,
    sql_validation,
    execute_query,
    logging_node,
    post_query_operations,
    business_insight_generator,
    format_response_of_business_insight_generator,        
)

# ── parent path so `db_config` is importable ───────────────────────
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

load_dotenv()

# ── config ──────────────────────────────────────────────────────────
DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://admin:root@localhost:5432/test_db"
)

#  Graph State
# =================================

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


# ── Known tables (mirrors the DDL) ─────────────────────────────────
AVAILABLE_TABLES: list[str] = [
    "alerts",
    "business_health_scores",
    "business",
    "daily_transactions",
    "decision_outcomes",
    "decisions",
    "employees",
    "financial_records",
    "products",
    "roles",
    "users",
]

TABLE_DESCRIPTIONS: dict[str, str] = {
    "alerts": "Business alerts with severity (Low/Medium/High) and status (Active/Resolved)",
    "business_health_scores": "Overall business health metrics - cash, profitability, growth, cost-control, risk scores",
    "business": "Business registration info - name, industry, owner, monthly revenue target, risk appetite",
    "daily_transactions": "Daily revenue & expense transactions with categories and amounts",
    "decision_outcomes": "Outcomes of past decisions with actual profit impact",
    "decisions": "Business decisions (Marketing/Hiring/Pricing/Expansion) with risk levels and success probability",
    "employees": "Employee records - name, role, salary, status (Active/Left)",
    "financial_records": "Monthly financial summaries - revenue, expenses, net profit, cash balance, loans",
    "products": "Product catalog - cost price, selling price, stock quantity",
    "roles": "Roles defined for each business",
    "users": "System users with email, password hash, and role",
}


# graph conditional routing function
def _route_after_sql_validation(state: DatabaseRequestGraphState) -> str:
    return state.get("route", "sql_valid")

# checkpointer
def _create_postgres_memory():
    with psycopg.connect(DATABASE_URL, autocommit=True) as conn:
        PostgresSaver(conn).setup()
    pool = ConnectionPool(conninfo=DATABASE_URL)
    return PostgresSaver(pool)

# graph generation function
def generate_graph():
    graph = StateGraph(DatabaseRequestGraphState)

    # ── add nodes ───────────────────────────────────────────────────
    graph.add_node("resolve_data_range",    resolve_data_range)
    graph.add_node("validate_entities",     validate_entities)
    graph.add_node("fetch_table_schema",    fetch_table_schema)
    graph.add_node("SQL_generation",        sql_generation)
    graph.add_node("SQL_validation",        sql_validation)
    graph.add_node("execute_query",         execute_query)
    graph.add_node("logging",              logging_node)
    graph.add_node("post_query_operations", post_query_operations)
    graph.add_node("business_insight_generator",
                   business_insight_generator)
    graph.add_node("format_response_of_business_insight_generator",
                   format_response_of_business_insight_generator)

    # ── edges (linear backbone) ─────────────────────────────────────
    graph.add_edge(START,                    "resolve_data_range")
    graph.add_edge("resolve_data_range",     "validate_entities")
    graph.add_edge("validate_entities",      "fetch_table_schema")
    graph.add_edge("fetch_table_schema",     "SQL_generation")
    graph.add_edge("SQL_generation",         "SQL_validation")

    # conditional: retry loop for bad SQL (max 2 retries → 3 total attempts)
    graph.add_conditional_edges(
        "SQL_validation",
        _route_after_sql_validation,
        {
            "sql_valid":   "execute_query",
            "sql_invalid": "SQL_generation",   # retry
            "sql_failed":  "execute_query",    # give up, let error propagate
        },
    )

    graph.add_edge("execute_query",          "logging")
    graph.add_edge("logging",                "post_query_operations")
    graph.add_edge("post_query_operations",  "business_insight_generator")
    graph.add_edge("business_insight_generator",
                   "format_response_of_business_insight_generator")
    graph.add_edge("format_response_of_business_insight_generator", END)

    # ── compile with Postgres checkpointer (needed for interrupt) ──
    memory   = _create_postgres_memory()
    workflow = graph.compile(checkpointer=memory)
    return workflow


# ── module-level singleton ──────────────────────────────────────────
database_request_graph_workflow = generate_graph()
