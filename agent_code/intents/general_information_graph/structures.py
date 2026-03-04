from pydantic import BaseModel, Field
from typing import Literal

class WebSearchStructure(BaseModel):
    is_web_search_required: Literal["yes", "no"] = Field(description="Is Web search is required to answer the asked question by user")
