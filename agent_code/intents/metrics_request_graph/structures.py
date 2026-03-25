from pydantic import BaseModel, Field


class MetricsQueryParseOutput(BaseModel):
    """Structured output from LLM that parses the user's metrics query."""

    metric_names: list[str] = Field(
        description=(
            "Prometheus metric names the user is interested in. "
            "Examples: agent_requests_total, agent_request_duration_seconds, "
            "chat_messages_total, dashboard_api_errors_total, "
            "agent_intent_detections_total, agent_intent_processing_seconds, "
            "active_chat_conversations, web_requests_total, web_request_duration_seconds."
        ),
    )
    promql_queries: list[str] = Field(
        description=(
            "One or more PromQL queries to execute. "
            "Examples: 'rate(agent_requests_total[5m])', "
            "'histogram_quantile(0.95, rate(agent_request_duration_seconds_bucket[5m]))', "
            "'sum by (intent) (agent_intent_detections_total)'. "
            "If the user is vague, produce reasonable default queries for the metric_names."
        ),
    )
    lookback_minutes: int = Field(
        default=60,
        description=(
            "How many minutes of data to query. "
            "'last hour' -> 60, 'last 15 minutes' -> 15, "
            "'last 24 hours' -> 1440, 'last day' -> 1440. Default 60."
        ),
    )
    step_seconds: int = Field(
        default=15,
        description=(
            "Step/resolution for range queries in seconds. "
            "Default 15. Use 60 for longer ranges (>6h), 300 for >24h."
        ),
    )
    time_range_description: str = Field(
        description="Human-readable description of the time range",
    )


class MetricsAnalysisOutput(BaseModel):
    """Structured LLM output that analyses Prometheus metrics data."""

    summary: str = Field(
        description="Executive summary of the metrics findings",
    )
    current_values: dict[str, str] = Field(
        default_factory=dict,
        description="Key metric name → current/latest value as a string",
    )
    trends: list[str] = Field(
        default_factory=list,
        description="Observed trends (increasing, decreasing, spikes, etc.)",
    )
    anomalies: list[str] = Field(
        default_factory=list,
        description="Any anomalous values or unexpected patterns",
    )
    health_assessment: str = Field(
        default="unknown",
        description="Overall health assessment: healthy, degraded, or critical",
    )
    recommended_actions: list[str] = Field(
        default_factory=list,
        description="Suggested actions based on the metrics analysis",
    )
