# app.py

import streamlit as st
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
import pickle
from connect_memory_with_llm import RAGRetriever
import re

load_dotenv()

with open("documents.pkl", "rb") as f:
    final_documents = pickle.load(f)

st.title("🧠 Medical Chatbot")
if "chat_history" not in st.session_state:
    st.session_state.chat_history = []

# Load retriever
retriever = RAGRetriever(final_documents)

# LLM
llm = ChatGroq(model="llama-3.1-8b-instant")

# Prompt
prompt = ChatPromptTemplate.from_template(
    """
You are a medical assistant AI.

Rules:
- If answer is not in context, say: "I don't know"
- Do NOT give medical advice
- Be concise

Chat History:
{history}

Context:
{context}

Question:
{question}

Answer:
"""
)
for q, a in st.session_state.chat_history:
    st.chat_message("user").write(q)
    st.chat_message("assistant").write(a)

query = st.text_input("Ask something...")


def format_history(chat_history):
    history_text = ""
    for q, a in chat_history:
        history_text += f"User: {q}\nAssistant: {a}\n"
    return history_text


if query:

    # Detect case number
    match = re.search(r"case\s*(\d+)", query.lower())

    if match:
        st.session_state.current_case = match.group(1)

        unsafe_keywords = ["dose", "dosage", "treatment", "medicine", "prescription"]

        if any(word in query.lower() for word in unsafe_keywords):
            st.warning("⚠️ Please consult a doctor for medical advice.")

    if "current_case" in st.session_state:
        if any(word in query.lower() for word in ["its", "examination", "history"]):
            query = f"Case {st.session_state.current_case} {query}"

    docs = retriever.retrieve(query)

    context = "\n\n".join([doc["content"][:500] for doc in docs])

    history_text = format_history(st.session_state.chat_history)

    final_prompt = prompt.format(context=context, question=query, history=history_text)

    response = llm.invoke(final_prompt)

    answer = response.content

    # Save to memory
    st.session_state.chat_history.append((query, answer))

    st.write("### 🧠 Answer")
    st.write(response.content)

    with st.expander("📄 Sources"):
        for doc in docs:
            st.write(f"📌 Source: {doc['metadata'].get('source_file', 'Unknown')}")
            st.write(doc["content"][:200])
