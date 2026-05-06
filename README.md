
```markdown
# 🏥 Medical Chatbot (RAG + Hybrid Retrieval + Reranking)

An advanced **AI-powered Medical Chatbot** built using **Retrieval-Augmented Generation (RAG)** with **Hybrid Search (FAISS + BM25)** and **Cross-Encoder Reranking** for highly accurate, context-aware responses.

> ⚡ Designed to reduce hallucinations by grounding answers in real medical documents.

---

## 🚀 Key Features

- 🤖 **LLM Integration**: Groq (Llama 3.1) for fast inference
- 🔍 **Hybrid Retrieval**:
  - Semantic Search → FAISS
  - Keyword Search → BM25
- 🎯 **Reranking Layer**:
  - CrossEncoder (`ms-marco-MiniLM`) for precision boost
- 📚 **RAG Pipeline**:
  - Context-aware answers from documents
- 💾 **Session Memory**:
  - MongoDB for persistent chat history
- 🧠 **Context Handling**:
  - Supports multi-turn + case-based queries
- 📄 **Source Attribution**:
  - Returns relevant document chunks with scores

---

## 🛠️ Tech Stack

**Backend**
- FastAPI
- LangChain
- Groq API (Llama 3.1)
- FAISS (Vector DB)
- BM25 (Keyword Search)
- Sentence Transformers (Embeddings + Reranker)
- MongoDB (Motor - async driver)

---

## 🏗️ Architecture

```

User Query
↓
Hybrid Retrieval (FAISS + BM25)
↓
Top Documents
↓
CrossEncoder Reranking
↓
Top-K Relevant Context
↓
LLM (Groq - Llama 3.1)
↓
Final Answer + Sources

```

---

## 🔍 RAG Pipeline (Your Core Strength 💡)

1. **Document Ingestion**
   - PDFs → Loaded → Chunked
2. **Embedding**
   - Model: `BAAI/bge-base-en-v1.5`
3. **Storage**
   - FAISS vector index
4. **Retrieval**
   - FAISS (semantic) + BM25 (keyword)
5. **Reranking**
   - CrossEncoder improves ranking accuracy
6. **Generation**
   - LLM generates grounded response

---

## 📂 Project Structure

```

Backend_AI/
├── main.py                      # FastAPI app
├── connect_memory_with_llm.py  # RAG + Hybrid Retriever + Reranker
├── create_memory_for_llm.py    # PDF processing + FAISS creation
├── core/config.py              # Environment config
├── db/mongo.py                 # MongoDB connection
├── requirements.txt
└── .env

````

---

## ⚙️ Installation & Setup

### 1️⃣ Clone Repo
```bash
git clone <your-repo-url>
cd Backend_AI
````

---

### 2️⃣ Create Virtual Environment

```bash
python -m venv .venv
.venv\Scripts\activate   # Windows
```

---

### 3️⃣ Install Dependencies

```bash
pip install -r requirements.txt
```

---

### 4️⃣ Setup Environment Variables

Create `.env` file:

```env
GROQ_API_KEY=your_groq_api_key
MONGODB_URI=your_mongodb_uri
MONGODB_DB=medical_chatbot
```

---

### 5️⃣ Prepare Data (IMPORTANT)

Place PDFs in:

```
data/pdf/
```

Run:

```bash
python create_memory_for_llm.py
```

This will:

* Load PDFs
* Create chunks
* Generate embeddings
* Store FAISS index
* Save `documents.pkl`

---

### 6️⃣ Run Backend

```bash
uvicorn main:app --reload
```

👉 API runs at:

```
http://127.0.0.1:8000
```

---

## 📡 API Example

### POST `/chat`

#### Request

```json
{
  "session_id": "123",
  "query": "What are symptoms of diabetes?"
}
```

#### Response

```json
{
  "answer": "Diabetes symptoms include...",
  "sources": [
    {
      "content": "Type 2 diabetes symptoms...",
      "source": "100Cases.pdf",
      "score": 0.91
    }
  ]
}
```

---

## 🧠 Key Implementation Highlights

### 🔹 Hybrid Retrieval

```python
EnsembleRetriever(
  retrievers=[FAISS, BM25],
  weights=[0.7, 0.3]
)
```

---

### 🔹 Reranking (Accuracy Booster 🚀)

```python
CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
```

✔ Improves relevance
✔ Reduces noise from retrieval

---

### 🔹 Embedding Model

```python
BAAI/bge-base-en-v1.5
```

✔ Optimized for semantic search
✔ Uses query prefix for better results

---

## 📊 Performance

* ⚡ Fast retrieval (FAISS)
* 🎯 High accuracy (reranking)
* 🧠 Context-aware responses
* 📉 Reduced hallucination

---

## ⚠️ Limitations

* Not a replacement for medical professionals
* Depends on quality of input documents
* Requires proper query phrasing for best results

---

## 🚀 Future Improvements

* Streaming responses
* Multi-user authentication
* UI (React Chat Interface)
* Advanced caching
* Better chunking strategies

---

## 👨‍💻 Author

Built to demonstrate:

* RAG Architecture
* Hybrid Search Systems
* LLM Integration
* Production-ready AI backend

---

⭐ If you like this project, give it a star!

```




