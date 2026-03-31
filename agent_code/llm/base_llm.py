from __future__ import annotations

import os
from functools import lru_cache

from dotenv import load_dotenv

from logger.logger import logger

load_dotenv()

_DEFAULT_GROQ_INTENT_MODEL = "llama-3.1-8b-instant"
_DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile"
_DEFAULT_OLLAMA_BASE = "http://127.0.0.1:11434/"
_DEFAULT_OLLAMA = "llama3.2:3b"
_DEFAULT_OLLAMA_INTENT = "llama3.1:8b"


def _groq_enabled() -> bool:
    return bool(os.getenv("GROQ_API_KEY", "").strip())


@lru_cache(maxsize=2)
def _build_llm(*, for_intent: bool) -> object:
    """Groq when GROQ_API_KEY is set; otherwise local Ollama."""
    if _groq_enabled():
        from langchain_groq import ChatGroq

        if for_intent:
            model = os.getenv("GROQ_INTENT_MODEL", _DEFAULT_GROQ_INTENT_MODEL)
            temperature = 0
        else:
            model = os.getenv("GROQ_MODEL", _DEFAULT_GROQ_MODEL)
            temperature = float(os.getenv("GROQ_TEMPERATURE", "0.2"))
        logger.info("Initializing Groq Chat: model=%s intent_mode=%s", model, for_intent)
        return ChatGroq(
            model=model,
            temperature=temperature,
            api_key=os.getenv("GROQ_API_KEY"),
            max_retries=2,
        )

    from langchain_ollama import ChatOllama

    base_url = os.getenv("LLM_BASE_URL", _DEFAULT_OLLAMA_BASE)
    model = (
        os.getenv("OLLAMA_INTENT_MODEL", _DEFAULT_OLLAMA_INTENT)
        if for_intent
        else os.getenv("OLLAMA_MODEL", _DEFAULT_OLLAMA)
    )
    logger.info("Initializing Ollama Chat: model=%s base_url=%s", model, base_url)
    return ChatOllama(model=model, base_url=base_url)


base_llm = _build_llm(for_intent=False)
logger.info("Base LLM ready.")

intent_llm = _build_llm(for_intent=True)
