from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import re
from core.config import settings
from connect_memory_with_llm import RAGRetriever
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from schemas.chat import ChatRequest, ChatResponse
from services.session_service import (
    append_message,
    create_session,
    get_session,
    list_sessions,
    upsert_session,
)
from models.session import ChatMessage, SessionDocument

import pickle

# Load pre-processed documents from pickle file
with open("documents.pkl", "rb") as f:
    documents = pickle.load(f)

retriever = RAGRetriever(documents=documents)

app = FastAPI(title="Medical Chatbot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# retriever = RAGRetriever(documents=None)  # keep your existing loading logic
llm = ChatGroq(model="llama-3.1-8b-instant", groq_api_key=settings.groq_api_key)  # type: ignore

prompt = ChatPromptTemplate.from_template("""
You are a medical assistant AI.

Rules:
- If answer is not in context, say: "I don't know"
- Do NOT give medical advice
- Be concise
- Always stick to SAME case if mentioned

Chat History:
{history}

Context:
{context}

Question:
{question}

Answer:
""")


def format_history(chat_history: list[ChatMessage]) -> str:
    # Limit to last 10 messages (adjust as needed for balance)
    recent_history = chat_history[-10:]
    return "\n".join(f"{msg.role.capitalize()}: {msg.text}" for msg in recent_history)


@app.get("/")
async def home():
    return {"message": "Medical Chatbot API is running"}


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    session = await get_session(request.session_id)
    if session is None:
        session = await create_session(request.session_id)

    query = request.query

    match = re.search(r"case\s*(\d+)", query.lower())
    if match:
        session.current_case = match.group(1)
        await upsert_session(session)

    if session.current_case and any(
        word in query.lower() for word in ["its", "examination", "history"]
    ):
        query = f"Case {session.current_case} {query}"

    docs = retriever.retrieve(query)
    context = "\n\n".join([doc["content"][:500] for doc in docs])
    history_text = format_history(session.chat_history)

    final_prompt = prompt.format(
        context=context,
        question=query,
        history=history_text,
    )

    response = llm.invoke(final_prompt)
    answer = str(response.content).strip()
    if isinstance(answer, list):
        answer = answer[0] if answer else ""
    else:
        answer = answer.strip()

    await append_message(
        request.session_id,
        ChatMessage(role="user", text=query),
    )
    await append_message(
        request.session_id,
        ChatMessage(role="assistant", text=answer),
    )

    return {
        "answer": answer,
        "sources": [
            {
                "content": doc["content"][:200],
                "source": doc["metadata"].get("source_file", "Unknown"),
                "score": doc["score"],
            }
            for doc in docs
        ],
    }


@app.get("/chat/{session_id}")
async def get_chat_history(session_id: str):
    session = await get_session(session_id)
    if session is None:
        return {"messages": []}

    # Format messages to match the frontend Message type
    messages = [
        {
            "role": msg.role,
            "content": msg.text,
            "timestamp": msg.timestamp.isoformat() if msg.timestamp else None,
        }
        for msg in session.chat_history
    ]
    return {"messages": messages}


@app.get("/sessions")
async def get_sessions():
    sessions = await list_sessions()
    return [
        {
            "id": session.session_id,
            "title": next(
                (msg.text for msg in session.chat_history if msg.role == "user"),
                "Untitled Chat",
            )[:50],
            "lastMessage": (
                session.chat_history[-1].text if session.chat_history else ""
            ),
            "timestamp": session.updated_at.isoformat(),
        }
        for session in sessions
    ]
