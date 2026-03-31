"""When to notify a human assignee (DM only) and how to pick their Slack user ID from env."""

from __future__ import annotations

import json
import os
from typing import Any

_ESCALATION_PHRASES = (
    "assign",
    "escalate",
    "human agent",
    "speak to someone",
    "talk to a person",
    "talk to someone",
    "hand off",
    "handoff",
    "speak with someone",
    "connect me to",
    "real person",
)

_CRITICAL_SUMMARY_KEYWORDS = (
    "bankruptcy",
    "fraud",
    "breach",
    "lawsuit",
    "litigation",
    "insolvency",
    "default on",
    "loan default",
    "severe loss",
    "critical risk",
    "material weakness",
    "regulatory action",
    "sec investigation",
    "criminal",
    "embezzle",
)


def user_explicitly_escalates(user_query: str) -> bool:
    t = (user_query or "").lower()
    return any(p in t for p in _ESCALATION_PHRASES)


def summary_has_critical_keywords(summary: str) -> bool:
    s = (summary or "").lower()
    return any(k in s for k in _CRITICAL_SUMMARY_KEYWORDS)


def _normalize_risk(risk_level: str | None) -> str:
    return (risk_level or "").strip().lower()


def should_notify_assignee(
    *,
    user_query: str,
    risk_level: str | None,
    summary: str,
) -> bool:
    """Notify an assignee via DM only when rules say we should suggest assignment."""
    if _normalize_risk(risk_level) == "high":
        return True
    if summary_has_critical_keywords(summary):
        return True
    if user_explicitly_escalates(user_query):
        return True
    return False


def parse_business_envelope(assistant_text: str) -> dict[str, Any] | None:
    """If the model returned JSON (optionally wrapped in ``` fences), return the dict."""
    raw = (assistant_text or "").strip()
    if raw.startswith("```"):
        lines = raw.split("\n")
        if len(lines) >= 2:
            lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            raw = "\n".join(lines).strip()
    if not raw.startswith("{"):
        return None
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return None


def _nested_get(d: dict[str, Any], *keys: str) -> Any:
    cur: Any = d
    for k in keys:
        if not isinstance(cur, dict):
            return None
        cur = cur.get(k)
    return cur


def extract_risk_and_summary(envelope: dict[str, Any] | None, fallback_text: str) -> tuple[str | None, str]:
    if not envelope:
        return None, (fallback_text or "")[:8000]
    risk = envelope.get("risk_level")
    if risk is None:
        risk = _nested_get(envelope, "result", "risk_level")
    summary = envelope.get("summary") or _nested_get(envelope, "result", "summary") or ""
    if not isinstance(summary, str):
        summary = str(summary)
    return (str(risk) if risk is not None else None), summary


def pick_assignee_slack_id(*, user_query: str, summary: str) -> str | None:
    """
    Map to SLACK_ID_* env vars (paste member IDs from Slack profile → Copy member ID).
    - SLACK_ID_SALES — revenue, deal, invoice, payment, customer
    - SLACK_ID_ENGINEERING — log, error, metric, server, api, bug
    - SLACK_ID_MARKETING — marketing, campaign, ads, seo, spend
    - SLACK_ID_UI_UX — ui, ux, design, layout, interface, frontend
    - SLACK_ID_BACKEND — backend, database, server, api, microservice
    - SLACK_ID_DEFAULT — fallback when set
    """
    blob = f"{user_query}\n{summary}".lower()

    sales_keys = ("revenue", "sales", "deal", "invoice", "payment", "customer", "refund", "pricing")
    eng_keys = ("error", "log", "metric", "server", "api", "bug", "timeout", "exception", "database")
    marketing_keys = ("marketing", "campaign", "ads", "seo", "spend", "lead", "promotion")
    ui_ux_keys = ("ui", "ux", "design", "layout", "interface", "frontend", "stylesheet", "css", "react")
    backend_keys = ("backend", "database", "server", "api", "microservice", "infrastructure", "sql")

    if any(k in blob for k in marketing_keys):
        sid = (os.getenv("SLACK_ID_MARKETING") or "").strip()
        if sid:
            return sid
    if any(k in blob for k in ui_ux_keys):
        sid = (os.getenv("SLACK_ID_UI_UX") or "").strip()
        if sid:
            return sid
    if any(k in blob for k in backend_keys):
        sid = (os.getenv("SLACK_ID_BACKEND") or "").strip()
        if sid:
            return sid
    if any(k in blob for k in sales_keys):
        sid = (os.getenv("SLACK_ID_SALES") or "").strip()
        if sid:
            return sid
    if any(k in blob for k in eng_keys):
        sid = (os.getenv("SLACK_ID_ENGINEERING") or "").strip()
        if sid:
            return sid

    default_id = (os.getenv("SLACK_ID_DEFAULT") or "").strip()
    return default_id or None


def slack_thread_id(team_id: str, user_id: str) -> str:
    """Stable LangGraph thread id for a Slack user in a workspace."""
    tid = (team_id or "unknown").strip()
    uid = (user_id or "unknown").strip()
    return f"slack_{tid}_{uid}"
