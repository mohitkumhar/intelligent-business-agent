import psycopg2
import psycopg2.extras
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://admin:root@localhost:5432/test_db"
)


def get_db_connection():
    """Returns a new psycopg2 connection to the PostgreSQL database."""
    return psycopg2.connect(DATABASE_URL)


def get_db_schema() -> str:
    """
    Reads all user tables and their columns from the database.
    Returns a formatted string the LLM can use to understand the schema.
    """
    query = """
        SELECT table_name, column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        ORDER BY table_name, ordinal_position;
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(query)
        rows = cur.fetchall()
        cur.close()
        conn.close()

        schema_lines = []
        current_table = None
        for table_name, column_name, data_type, is_nullable in rows:
            if table_name != current_table:
                current_table = table_name
                schema_lines.append(f"\nTable: {table_name}")
                schema_lines.append("-" * 40)
            nullable = "NULL" if is_nullable == "YES" else "NOT NULL"
            schema_lines.append(f"  {column_name} ({data_type}, {nullable})")

        return "\n".join(schema_lines)
    except Exception as e:
        return f"Error reading schema: {str(e)}"


def execute_read_query(sql: str) -> list[dict]:
    """
    Safely executes a SELECT-only SQL query.
    Returns results as a list of dicts.
    Raises ValueError if the query is not a SELECT.
    """
    cleaned = sql.strip().lower()
    if not cleaned.startswith("select"):
        raise ValueError("Only SELECT queries are allowed for safety.")

    forbidden = ["insert ", "update ", "delete ", "drop ", "alter ", "truncate ", "create "]
    for keyword in forbidden:
        if keyword in cleaned:
            raise ValueError(f"Forbidden SQL keyword detected: {keyword.strip()}")

    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(sql)
        results = cur.fetchall()
        cur.close()
        return [dict(row) for row in results]
    except Exception as e:
        raise RuntimeError(f"SQL execution error: {str(e)}")
    finally:
        conn.close()
