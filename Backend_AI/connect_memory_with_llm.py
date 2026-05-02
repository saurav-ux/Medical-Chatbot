from typing import List, Dict, Any

# from langchain.embeddings import HuggingFaceEmbeddings
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_community.retrievers import BM25Retriever

from langchain.retrievers import EnsembleRetriever

# from langchain_community.retrievers import EnsembleRetriever
from sentence_transformers import CrossEncoder

# -------------------------
# Load Reranker Model
# -------------------------
reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")


# -------------------------
# Load Vector Store
# -------------------------
def load_vector_store():
    embeddings = HuggingFaceEmbeddings(
        model_name="BAAI/bge-base-en-v1.5",
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True},
    )

    return FAISS.load_local(
        "faiss_vector_store", embeddings, allow_dangerous_deserialization=True
    )


# -------------------------
# Retriever Class
# -------------------------
class RAGRetriever:
    def __init__(self, documents):
        self.vector_store = load_vector_store()

        # 🔹 Vector Retriever (FAISS)
        self.vector_retriever = self.vector_store.as_retriever(search_kwargs={"k": 10})

        # 🔹 Keyword Retriever (BM25)
        self.bm25_retriever = BM25Retriever.from_documents(documents)
        self.bm25_retriever.k = 10

        # 🔥 Hybrid Retriever
        self.hybrid_retriever = EnsembleRetriever(
            retrievers=[self.vector_retriever, self.bm25_retriever], weights=[0.7, 0.3]
        )

    def retrieve(self, user_query: str, top_k: int = 5) -> List[Dict[str, Any]]:

        # 🔥 IMPORTANT for BGE
        query = "Represent this sentence for searching relevant passages: " + user_query

        # 🔹 Step 1: Hybrid retrieval (instead of FAISS only)
        docs = self.hybrid_retriever.get_relevant_documents(query)

        if not docs:
            return []

        # 🔹 Step 2: Prepare (query, doc) pairs for reranker
        pairs = [[user_query, doc.page_content] for doc in docs]

        # 🔹 Step 3: Rerank
        scores = reranker.predict(pairs)

        # 🔹 Step 4: Combine
        ranked_docs = list(zip(docs, scores))

        # 🔹 Step 5: Sort
        ranked_docs.sort(key=lambda x: x[1], reverse=True)

        # 🔹 Step 6: Top K
        top_docs = ranked_docs[:top_k]

        # 🔹 Step 7: Format
        return [
            {
                "content": doc.page_content,
                "metadata": doc.metadata,
                "score": float(score),
                "rank": i + 1,
            }
            for i, (doc, score) in enumerate(top_docs)
        ]
