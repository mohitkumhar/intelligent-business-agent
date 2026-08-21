from datetime import datetime
import json
from llm.base_llm import base_llm
from prompts.system_prompt import (
    ANTI_HALLUCINATION_RULES,
    CURRENCY_RULE,
    NO_INTERNALS_RULE,
    TONE_RULES,
    with_system,
)

_FORMATTING_RULES = (
    "Formatting rules:\n"
    "- For **numerical / financial data**: use thousand-separators and percentages, "
    "summarise the key figures, and point out trends the data actually shows.\n"
    "- For **tabular / database rows**: present as a neat markdown table or a numbered "
    "list, whichever is more readable.\n"
    "- For **textual / general-information data**: rephrase into short, structured "
    "sections with bullet points where helpful.\n"
    "- For **errors**: explain the issue in friendly language and say what the owner "
    "can do next.\n"
    "- If the raw data says no records were found, say that plainly — do not render "
    "empty tables or empty trend headings.\n"
    "- Surface every risk or warning present in the raw data; never drop one.\n"
    "- You are re-formatting, not re-analysing. Carry over only the numbers and claims "
    "already present in the raw data — never add a figure, percentage, trend, or "
    "benchmark of your own.\n"
    "- End with one clear next step when the data supports one."
)


def _format_task(intent, raw_text: str) -> str:
    return (
        "Take the raw output of an internal tool and turn it into a clear, "
        "well-structured response for the business owner.\n\n"
        f"Intent category: {intent}\n\n"
        f"Raw data:\n{raw_text}\n\n"
        f"{_FORMATTING_RULES}\n\n"
        "Respond ONLY with the formatted answer — no preamble."
    )


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
        messages = with_system(
            _format_task(intent, raw_text),
            ANTI_HALLUCINATION_RULES,
            TONE_RULES,
            CURRENCY_RULE,
            NO_INTERNALS_RULE,
        )
        try:
            llm_response = base_llm.invoke(messages)
            formatted = llm_response.content
        except Exception:
            # Graceful degradation — return the raw data if the LLM is down
            formatted = raw_text

    return {
        "is_error": False,
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'status': 'ok',
        'intent': intent,
        'result': formatted,
        'auth_meta': auth_meta,
        'intent_meta': intent_meta,
    }

def format_response_stream(intent, result, auth_meta=None, intent_meta=None):
    """Streaming version of format_response."""
    
    # Check if the intent is a greeting (intent is now a dict: {'intent': ['greeting_request']})
    is_greeting = False
    if isinstance(intent, dict) and "intent" in intent:
        if "greeting_request" in intent["intent"] or "greeting" in intent["intent"]:
            is_greeting = True
    elif isinstance(intent, str) and ("greeting" in intent.lower()):
        is_greeting = True

    # For general/greeting graphs, the actual text is in 'user_query_output'
    if is_greeting:
        if isinstance(result, dict) and "user_query_output" in result:
            yield str(result["user_query_output"])
        elif isinstance(result, str):
            yield result
        else:
            yield _serialize(result)
        return

    # If it's a general information request, we also want to just return the 
    # AI's answer directly rather than reformatting it into a heavy business table.
    is_general = False
    if isinstance(intent, dict) and "intent" in intent:
        if "general_information_request" in intent["intent"]:
            is_general = True
            
    if is_general:
        if isinstance(result, dict) and "user_query_output" in result:
            yield str(result["user_query_output"])
            return

    raw_text = _serialize(result)

    messages = with_system(
        _format_task(intent, raw_text),
        ANTI_HALLUCINATION_RULES,
        TONE_RULES,
        CURRENCY_RULE,
        NO_INTERNALS_RULE,
    )
    try:
        for chunk in base_llm.stream(messages):
            yield chunk.content
    except Exception:
        yield raw_text
