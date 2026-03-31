from langchain_ollama import ChatOllama
from pydantic import BaseModel, Field
from typing import Literal, List
from dotenv import load_dotenv
import os
from logger.logger import logger
from langchain_core.prompts import ChatPromptTemplate

load_dotenv()

class StructureIntentDetectionOutput(BaseModel):
    intent: List[Literal["database_request",'general_information_request', 'greeting_request', 'logs_request', 'metrics_request' ]] = Field(description="The detected intent of the user query")


llm_base_url = os.getenv("LLM_BASE_URL", "http://127.0.0.1:11434/")
intent_detection_llm = ChatOllama(model="llama3.1:8b", base_url=llm_base_url)
intent_detection_llm_with_structure = intent_detection_llm.with_structured_output(StructureIntentDetectionOutput)

def detect_intent(text: str):
    """Intent detection node. Uses llm to detect intent of user query"""
    
    try:
        text = (text or '').strip()
        
        logger.info(f"Detecting intent for query: '{text}'")

        prompt_template = ChatPromptTemplate.from_messages([
        (
            "system", (
                "You are an intent detection assistant. Categorize the user query into one of the following: "
                "'database_request', 'general_information_request', 'greeting_request', 'logs_request', or 'metrics_request'.\n"
                "Rules:\n"
                "- database_request: Queries about tables, records, or data storage.\n"
                "- logs_request: Queries about application errors, stack traces, or history.\n"
                "- metrics_request: Queries about CPU, memory, performance, or numbers.\n"
                "- greeting_request: Simple hellos/goodbyes.\n"
                "- general_information_request: Anything else.\n"
                "In the 'meta' field, extract key entities like table names, timestamps, or error levels."
            )
        ),
        (
            "human", "{text}"
        )
        ])


        prompt = prompt_template.format_prompt(text=text)

        logger.info(f"Formatted prompt for intent detection: {prompt.to_messages()}")

        intent = intent_detection_llm_with_structure.invoke(prompt).model_dump()
        
        logger.info(f"Raw intent detection output: {intent}")
        return intent

    except Exception as e:
        logger.error(f"Error during intent detection for query '{text}': {e}", exc_info=True)
        return {"intent": ["general_information_request"]}
