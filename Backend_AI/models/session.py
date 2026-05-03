from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str
    text: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class SessionDocument(BaseModel):
    session_id: str
    chat_history: List[ChatMessage] = []
    current_case: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        orm_mode = True
