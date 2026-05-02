from fastapi import FastAPI
from pydantic import BaseModel
import pickle
import re

from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from connect_memory_with_llm import RAGRetriever
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for dev only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Load data
# -----------------------------
with open("documents.pkl", "rb") as f:
    final_documents = pickle.load(f)

retriever = RAGRetriever(final_documents)

llm = ChatGroq(model="llama-3.1-8b-instant")

# -----------------------------
# Memory (in-memory store)
# -----------------------------
sessions = {}


# -----------------------------
# Request Model
# -----------------------------
class ChatRequest(BaseModel):
    session_id: str
    query: str


# -----------------------------
# Helper: Format history
# -----------------------------
def format_history(chat_history):
    history_text = ""
    for q, a in chat_history:
        history_text += f"User: {q}\nAssistant: {a}\n"
    return history_text


# -----------------------------
# Prompt
# -----------------------------
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


# -----------------------------
# API Endpoint
# -----------------------------


@app.get("/")
def home():
    return {"message": "Medical Chatbot API is running"}


@app.post("/chat")
def chat(request: ChatRequest):
    session_id = request.session_id
    query = request.query

    # Create session if not exists
    if session_id not in sessions:
        sessions[session_id] = {"chat_history": [], "current_case": None}

    session = sessions[session_id]

    # -----------------------------
    # Detect Case Number
    # -----------------------------
    match = re.search(r"case\s*(\d+)", query.lower())
    if match:
        session["current_case"] = match.group(1)

    # -----------------------------
    # Fix "its" queries
    # -----------------------------
    if session["current_case"]:
        if any(word in query.lower() for word in ["its", "examination", "history"]):
            query = f"Case {session['current_case']} {query}"

    # -----------------------------
    # Retrieve Docs
    # -----------------------------
    docs = retriever.retrieve(query)

    context = "\n\n".join([doc["content"][:500] for doc in docs])

    # -----------------------------
    # History
    # -----------------------------
    history_text = format_history(session["chat_history"])

    # -----------------------------
    # LLM Call
    # -----------------------------
    final_prompt = prompt.format(context=context, question=query, history=history_text)

    response = llm.invoke(final_prompt)
    answer = response.content

    # -----------------------------
    # Save Memory
    # -----------------------------
    session["chat_history"].append((query, answer))

    # Limit history
    session["chat_history"] = session["chat_history"][-5:]

    # -----------------------------
    # Return Response
    # -----------------------------
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
