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
- 📚 **RAG Pipeline**
- 💾 **Session Memory**: MongoDB
- 🧠 **Context Handling** (multi-turn + case-based)
- 📄 **Source Attribution**

---

## 🖥️ Screenshots

### 🔹 Chat Interface
> Clean and modern chat UI for interacting with the medical assistant  
<img width="1363" height="592" alt="image" src="https://github.com/user-attachments/assets/cc872b19-99e5-4b77-8307-8b994b699a7b" />


---

### 🔹 RAG Responses  
> Responses consider previous queries to maintain conversational context.
<img width="1353" height="590" alt="image" src="https://github.com/user-attachments/assets/3163efd4-1a52-41d3-b3c3-3072705c51a9" />


---

### 🔹 Session History Sidebar
> View and switch between previous conversations  
<img width="1362" height="588" alt="image" src="https://github.com/user-attachments/assets/504b0cf9-25ea-4c69-853c-a1dcbd21666c" />


---

## 🛠️ Tech Stack

**Backend**
- FastAPI
- LangChain
- Groq API
- FAISS
- BM25
- Sentence Transformers
- MongoDB (Motor)

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
Top-K Context
   ↓
LLM (Groq - Llama 3.1)
   ↓
Final Answer + Sources
```

---

## 🔍 RAG Pipeline

1. PDFs → Chunking  
2. Embeddings (`BAAI/bge-base-en-v1.5`)  
3. FAISS Storage  
4. Hybrid Retrieval  
5. Reranking  
6. LLM Generation  

---

## 📂 Project Structure

```
Medical_Chatbot/
├── Backend_AI/
│   ├── main.py                    # FastAPI app entry point
│   ├── models/
│   │   └── session.py             # MongoDB schema
│   ├── services/
│   │   └── session_service.py     # DB operations
│   ├── schemas/
│   │   └── chat.py                # Request/response models
│   ├── db/
│   │   └── mongo.py               # MongoDB connection
│   ├── core/
│   │   └── config.py              # Settings (Pydantic)
│   ├── connect_memory_with_llm.py # RAG retriever
│   ├── create_memory_for_llm.py   # Document ingestion
│   ├── requirements.txt
│   └── .env                       # Environment variables
├── frontend/
│   ├── src/
│   │   ├── App.tsx                # Main React component
│   │   └── App.css                # Styling
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

---

## ⚙️ Setup

### 1. Clone
```bash
git clone <your-repo-url>
cd Backend_AI
```

### 2. Virtual Env
```bash
python -m venv .venv
.venv\Scripts\activate
```

### 3. Install
```bash
pip install -r requirements.txt
```

### 4. .env
```env
GROQ_API_KEY=your_key
MONGODB_URI=your_uri
MONGODB_DB=medical_chatbot
```

### 5. Create Vector DB
```bash
python create_memory_for_llm.py
```

### 6. Run
```bash
uvicorn main:app --reload
```

---

## 📡 API

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
      "content": "...",
      "source": "100Cases.pdf",
      "score": 0.91
    }
  ]
}
```

---

## 🧠 Highlights

### Hybrid Retrieval
```python
EnsembleRetriever(
  retrievers=[FAISS, BM25],
  weights=[0.7, 0.3]
)
```

### Reranker
```python
CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
```

---

## 📊 Performance

- Fast retrieval  
- High accuracy  
- Context-aware  
- Reduced hallucination  

---

## ⚠️ Disclaimer

- Not medical advice  
- Depends on input documents  

---

## 🚀 Future

- Streaming responses  
- Authentication  
- UI improvements  
- Caching  

---

## 👨‍💻 Author

RAG • Hybrid Search • LLM Systems

---

⭐ Star this repo if you found it useful!
