from pydantic import BaseModel, Field


class LogsQueryParseOutput(BaseModel):
    """Structured output from the LLM that parses the user's log query."""

    log_query: str = Field(
        description=(
            "A Loki LogQL query string to retrieve the relevant logs. "
            "Examples: '{job=\"python_app\"}', "
            "'{job=\"python_app\"} |= \"ERROR\"', "
            "'{job=\"python_app\"} |~ \"database|sql\"'. "
            "Always scope to the job label used by Promtail: job=\"python_app\"."
        ),
    )
    lookback_minutes: int = Field(
        default=60,
        description=(
            "How many minutes of logs to look back. "
            "'last 5 minutes' -> 5, 'last hour' -> 60, "
            "'last 24 hours' -> 1440. Default 60."
        ),
    )
    limit: int = Field(
        default=100,
        description=(
            "Maximum number of log lines to retrieve. "
            "Default 100. Use up to 500 for broad queries."
        ),
    )
    time_range_description: str = Field(
        description="Human-readable description of the time range, e.g. 'Last 60 minutes'.",
    )
    search_keywords: list[str] = Field(
        default_factory=list,
        description=(
            "Key terms the user is looking for, extracted from the query. "
            "Examples: ['ERROR', 'database', 'timeout', 'intent_detection']."
        ),
    )


class LogsAnalysisOutput(BaseModel):
    """Structured LLM output that analyses retrieved log lines."""

    summary: str = Field(
        description="Executive summary of the log findings.",
    )
    error_count: int = Field(
        default=0,
        description="Number of ERROR-level log lines observed.",
    )
    warning_count: int = Field(
        default=0,
        description="Number of WARNING-level log lines observed.",
    )
    key_events: list[str] = Field(
        default_factory=list,
        description="The most important or notable log events (up to 10).",
    )
    recurring_patterns: list[str] = Field(
        default_factory=list,
        description="Patterns that appear repeatedly in the logs.",
    )
    anomalies: list[str] = Field(
        default_factory=list,
        description="Unexpected or suspicious entries that need attention.",
    )
    health_assessment: str = Field(
        default="unknown",
        description="Overall health assessment based on logs: 'healthy', 'degraded', or 'critical'.",
    )
    recommended_actions: list[str] = Field(
        default_factory=list,
        description="Suggested follow-up actions based on log analysis.",
    )
