"""Build Slack Block Kit payloads from agent text (markdown or JSON envelope), plus follow-up buttons."""

from __future__ import annotations

import base64
import json
from typing import Any

from slack_integration.smart_assigner import parse_business_envelope

# Slack limits
_MRKDWD_SECTION = 3000
_BUTTON_LABEL = 75
_VALUE_MAX = 2000


def _truncate(s: str, n: int) -> str:
    s = s or ""
    if len(s) <= n:
        return s
    return s[: n - 1] + "…"


def _encode_followup_value(thread_id: str, question: str) -> str:
    payload = {"t": thread_id, "q": question}
    raw = json.dumps(payload, ensure_ascii=False)
    if len(raw) > _VALUE_MAX:
        payload["q"] = question[: _VALUE_MAX - 80]
        raw = json.dumps(payload, ensure_ascii=False)
    b = base64.urlsafe_b64encode(raw.encode("utf-8")).decode("ascii")
    if len(b) > _VALUE_MAX:
        payload["q"] = question[:400]
        b = base64.urlsafe_b64encode(json.dumps(payload).encode("utf-8")).decode("ascii")
    return b


def decode_followup_value(value: str) -> tuple[str, str] | None:
    try:
        raw = base64.urlsafe_b64decode(value.encode("ascii")).decode("utf-8")
        o = json.loads(raw)
        t, q = o.get("t"), o.get("q")
        if isinstance(t, str) and isinstance(q, str) and t and q:
            return t, q
    except (json.JSONDecodeError, TypeError, ValueError, KeyError):
        pass
    return None


_RISK_EMOJI = {"low": "🟢", "medium": "🟡", "high": "🔴"}


def _envelope_to_mrkdwn(data: dict[str, Any]) -> tuple[str, list[str]]:
    summary = data.get("summary") or ""
    if not summary and isinstance(data.get("result"), dict):
        summary = (data["result"] or {}).get("summary") or ""
    if not isinstance(summary, str):
        summary = str(summary)

    recs = data.get("recommendations")
    if recs is None and isinstance(data.get("result"), dict):
        recs = (data["result"] or {}).get("recommendations")
    if not isinstance(recs, list):
        recs = []

    risk_raw = (data.get("risk_level") or "").strip().lower()
    if not risk_raw and isinstance(data.get("result"), dict):
        risk_raw = str((data["result"] or {}).get("risk_level") or "").strip().lower()

    follow = data.get("follow_up_questions")
    if not isinstance(follow, list):
        follow = []

    qu = data.get("query_understood") or ""
    lines: list[str] = []
    if qu:
        lines.append(f"_🧠 {qu}_")
        lines.append("")
    if summary:
        lines.append("*📋 Summary*")
        lines.append(summary)
        lines.append("")
    if recs:
        lines.append("*💡 Recommendations*")
        for r in recs:
            lines.append(f"• {r}")
        lines.append("")
    if risk_raw and risk_raw in _RISK_EMOJI:
        lines.append(f"*⚠️ Risk level:* {_RISK_EMOJI[risk_raw]} `{risk_raw.upper()}`")
        lines.append("")

    body = "\n".join(lines).strip()
    return body, [str(x) for x in follow if str(x).strip()]


def build_reply_blocks(
    assistant_text: str,
    *,
    thread_id: str,
    intent_str: str = "",
) -> list[dict[str, Any]]:
    """
    Primary section (mrkdwn) + optional follow-up buttons (same behaviour as web UI chips).
    """
    env = parse_business_envelope(assistant_text)
    if env:
        body, follow_ups = _envelope_to_mrkdwn(env)
    else:
        body = (assistant_text or "").strip()
        follow_ups = []

    if not body:
        body = "_I could not produce a reply._"

    blocks: list[dict[str, Any]] = []
    for i in range(0, len(body), _MRKDWD_SECTION):
        part = body[i : i + _MRKDWD_SECTION]
        blocks.append({"type": "section", "text": {"type": "mrkdwn", "text": part}})

    if intent_str:
        blocks.append(
            {
                "type": "context",
                "elements": [{"type": "mrkdwn", "text": f"_Intent:_ `{intent_str}`"}],
            }
        )

    if follow_ups:
        elements: list[dict[str, Any]] = []
        for q in follow_ups[:5]:
            elements.append(
                {
                    "type": "button",
                    "text": {"type": "plain_text", "text": _truncate(q, _BUTTON_LABEL)},
                    "action_id": "agent_follow_up",
                    "value": _encode_followup_value(thread_id, q),
                }
            )
        blocks.append({"type": "actions", "block_id": "followups", "elements": elements})

    return blocks


def build_assignment_dm_blocks(
    *,
    reporter_user_id: str,
    user_query: str,
    summary: str,
    risk_level: str | None,
) -> list[dict[str, Any]]:
    risk = (risk_level or "n/a").strip()
    return [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": (
                    "*Assignment / escalation notice*\n"
                    f"• *From user* `<@{reporter_user_id}>`\n"
                    f"• *Risk (if known):* `{risk}`\n"
                    f"*Their question:*\n```{_truncate(user_query, 900)}```"
                ),
            },
        },
        {
            "type": "section",
            "text": {"type": "mrkdwn", "text": f"*Summary / agent output:*\n{_truncate(summary, 2800)}"},
        },
    ]
