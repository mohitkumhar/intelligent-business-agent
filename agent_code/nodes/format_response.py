from datetime import datetime
import json
from llm.format_response_llm import llm


def _serialize(data) -> str:
    """Safely convert any data (dicts, lists, primitives) to a readable string."""
    if isinstance(data, str):
        return data
    try:
        return json.dumps(data, default=str, indent=2, ensure_ascii=False)
    except (TypeError, ValueError):
        return str(data)


def format_response(intent, result, auth_meta=None, intent_meta=None):
    """Use an LLM to rephrase and restructure raw tool output into a
    polished, user-friendly response.  Handles numerical data, textual
    data, and database result-sets."""

    raw_text = _serialize(result)

    # Greetings / trivial intents — skip the LLM round-trip
    if intent == "greeting":
        formatted = raw_text
    else:
        prompt = (
            "You are a professional business-intelligence assistant.\n"
            "Your job is to take raw data produced by an internal tool and "
            "turn it into a clear, well-structured response for the end-user.\n\n"
            f"Intent category: {intent}\n\n"
            f"Raw data:\n{raw_text}\n\n"
            "Formatting rules:\n"
            "- For **numerical / financial data**: use proper currency symbols "
            "(₹ or $ as appropriate), thousand-separators, and percentages. "
            "Summarise key figures and highlight trends.\n"
            "- For **tabular / database rows**: present as a neatly formatted "
            "markdown table or a numbered list, whichever is more readable.\n"
            "- For **textual / general-information data**: rephrase into concise, "
            "well-structured paragraphs with bullet points where helpful.\n"
            "- For **errors**: explain the issue in friendly language and suggest "
            "what the user can do next.\n"
            "- NEVER expose internal details like SQL queries, route names, or "
            "system internals.\n"
            "- Keep the tone professional yet approachable.\n\n"
            "Respond ONLY with the formatted answer — no preamble."
        )
        try:
            llm_response = llm.invoke(prompt)
            formatted = llm_response.content
        except Exception:
            # Graceful degradation — return the raw data if the LLM is down
            formatted = raw_text

    return {
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'status': 'ok',
        'intent': intent,
        'result': formatted,
        'auth_meta': auth_meta,
        'intent_meta': intent_meta,
    }
