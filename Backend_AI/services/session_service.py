from datetime import datetime
from typing import Optional, List

from db.mongo import get_session_collection
from models.session import ChatMessage, SessionDocument

collection = get_session_collection()


async def get_session(session_id: str) -> Optional[SessionDocument]:
    raw = await collection.find_one({"session_id": session_id})
    return SessionDocument(**raw) if raw else None


async def create_session(session_id: str) -> SessionDocument:
    session = SessionDocument(session_id=session_id)
    await collection.insert_one(session.dict())
    return session


async def list_sessions() -> List[SessionDocument]:
    cursor = collection.find().sort("updated_at", -1)
    sessions = await cursor.to_list(length=100)
    return [SessionDocument(**raw) for raw in sessions]


async def upsert_session(session: SessionDocument):
    session.updated_at = datetime.utcnow()
    await collection.update_one(
        {"session_id": session.session_id},
        {"$set": session.dict()},
        upsert=True,
    )


async def append_message(session_id: str, message: ChatMessage):
    await collection.update_one(
        {"session_id": session_id},
        {
            "$push": {"chat_history": message.dict()},
            "$set": {"updated_at": datetime.utcnow()},
        },
    )
