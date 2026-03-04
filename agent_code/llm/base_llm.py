from langchain_ollama import ChatOllama
from dotenv import load_dotenv
import os
from logger.logger import logger

load_dotenv()

llm_base_url = os.getenv("LLM_BASE_URL", "http://127.0.0.1:11434/")
logger.info(f"Initiliazing the LLM on, Base URL: {llm_base_url}")
base_llm = ChatOllama(model="llama3.1:8b", base_url=llm_base_url)
logger.info("Base LLM initialized successfully.")