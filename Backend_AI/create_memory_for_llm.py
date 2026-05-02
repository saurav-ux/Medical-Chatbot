import os
from pathlib import Path

from langchain_community.document_loaders import PyPDFLoader, PyMuPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

from langchain_community.embeddings import HuggingFaceEmbeddings

# from langchain.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
import pickle


def process_all_pdfs(pdf_directory):
    """Process all PDF files in a directory"""
    all_documents = []
    pdf_dir = Path(pdf_directory)

    # Find all PDF files recursively
    pdf_files = list(pdf_dir.glob("**/*.pdf"))

    print(f"Found {len(pdf_files)} PDF files to process")

    for pdf_file in pdf_files:
        print(f"\nProcessing: {pdf_file.name}")
        try:
            loader = PyPDFLoader(str(pdf_file))
            documents = loader.load()

            # Add source information to metadata
            for doc in documents:
                doc.metadata["source_file"] = pdf_file.name
                doc.metadata["file_type"] = "pdf"

            all_documents.extend(documents)
            print(f"  ✓ Loaded {len(documents)} pages")

        except Exception as e:
            print(f"  ✗ Error: {e}")

    print(f"\nTotal documents loaded: {len(all_documents)}")
    return all_documents


# Process all PDFs in the data directory
all_pdf_documents = process_all_pdfs(r"D:\AI\rag\data\pdf")

print(f"\nSample document metadata: {len(all_pdf_documents)}")


# Create chunks
def create_chunks(documents):
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=300, chunk_overlap=50)
    final_documents = text_splitter.split_documents(documents)
    return final_documents


final_documents = create_chunks(all_pdf_documents)
if not final_documents:
    raise ValueError("No documents found. Check PDF loading.")
print(f"Total chunks created: {len(final_documents)}")


# create vectore Embeddings

# embeddings = HuggingFaceEmbeddings()
# vector_store = FAISS.from_documents(final_documents, embeddings)
# # Save the vector store to disk
# vector_store.save_local("faiss_vector_store")

# def get_embedding_model():
#     embedding_model = HuggingFaceEmbeddings(
#     model_name="sentence-transformers/BAAI/bge-base-en-v1.5")
#     return embedding_model


def get_embedding_model():
    embedding_model = HuggingFaceEmbeddings(
        model_name="BAAI/bge-base-en-v1.5",
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True},
    )
    return embedding_model


embedding_model = get_embedding_model()

# Storing embedding in FAISS vector store
DB_PATH = "faiss_vector_store"
vector_store = FAISS.from_documents(final_documents, embedding_model)
vector_store.save_local(DB_PATH)

with open("documents.pkl", "wb") as f:
    pickle.dump(final_documents, f)
