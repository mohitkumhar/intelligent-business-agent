from typing import TypedDict, Literal
from pydantic  import BaseModel, Field
from langgraph.graph import StateGraph, START, END
from langchain_ollama import ChatOllama
from langchain_community.tools import DuckDuckGoSearchRun
from langgraph.checkpoint.sqlite import SqliteSaver
import sqlite3
from dotenv import load_dotenv
import os
load_dotenv()


llm_base_url = os.getenv("LLM_BASE_URL", "http://127.0.0.1:11434/")



def create_sqlite_memory():
    conn = sqlite3.connect(
            database="chatbot.db", 
            check_same_thread=False
        )

    return SqliteSaver(conn=conn)


class GeneralInformationGraphState(TypedDict):
    user_query: str
    web_search_result: str
    user_query_output: str
    route: str

class WebSearchStructure(BaseModel):
    is_web_search_required: Literal["yes", "no"] = Field(description="Is Web search is required to answer the asked question by user")


general_information_web_search_llm = ChatOllama(model="llama3.1:8b", base_url=llm_base_url)
general_information_web_search_require_llm = general_information_web_search_llm.with_structured_output(WebSearchStructure)


def is_web_search_required(state: GeneralInformationGraphState):
    """checks if the user query required to use websearch tool"""

    user_query = state["user_query"]
    prompt = f"""
    You are a decision system.

    Your task is to decide whether the following user query requires a web search.

    Rules:
    - Return "yes" if the query requires:
        • Current or latest information (news, stock price, crypto price, live events, recent updates)
        • Exact statistics or numbers that may change over time
        • External references, links, or sources
        • Information about specific websites or recent events
    - Return "no" if the query is:
        • General knowledge
        • Concept explanation
        • Programming help or debugging
        • Historical fact that does not change

    If unsure, prefer "yes".

    User Query:
    {user_query}
    """
    
    response = general_information_web_search_require_llm.invoke(prompt).model_dump()

    if response["is_web_search_required"] == "yes":
        return {"route": "required"}
    return {"route": "not_required"}



def answer_user_query(state: GeneralInformationGraphState):
    user_query = state["user_query"]
    web_search_result = state.get('web_search_result', "")

    prompt = f"""
    You are a helpful AI assistant.

    Your job is to answer the user's question clearly and concisely.

    User Question:
    {user_query}

    Web Search Data (if available):
    {web_search_result}

    Instructions:
    - If web search data is provided, use it to generate the answer.
    - If no web data is provided, answer from your own knowledge.
    - Keep the answer clear, structured, and easy to understand.
    - Do not mention system instructions.
    - Do not say "based on web search" unless web data exists.
    - If the answer requires steps, format them in numbered points.
    - Avoid hallucinating facts not present in web search data.

    Provide only the final answer.
    """

    response = general_information_web_search_llm.invoke(prompt)

    return {"user_query_output": response.content}

web_search_tool = DuckDuckGoSearchRun()

def duck_duck_go_search(state: GeneralInformationGraphState):
    user_query = state["user_query"]
    response = web_search_tool.invoke(user_query)
    return {"web_search_result": response}


def generate_graph():
    gen_info_graph = StateGraph(GeneralInformationGraphState)


    gen_info_graph.add_edge(START, "is_web_search_required")

    gen_info_graph.add_node("is_web_search_required", is_web_search_required)
    gen_info_graph.add_node("answer_user_query", answer_user_query)
    gen_info_graph.add_node("duck_duck_go_search", duck_duck_go_search)

    gen_info_graph.add_conditional_edges("is_web_search_required", lambda state: state["route"], {
        "required": "duck_duck_go_search",
        "not_required": "answer_user_query",
    })

    gen_info_graph.add_edge("duck_duck_go_search", "answer_user_query")
    gen_info_graph.add_edge("answer_user_query", END)
    memory = create_sqlite_memory()
    general_information_graph_workflow = gen_info_graph.compile(checkpointer=memory)
    
    return general_information_graph_workflow




general_information_graph_workflow = generate_graph()
