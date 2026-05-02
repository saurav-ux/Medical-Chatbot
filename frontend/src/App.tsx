import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./App.css";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type ChatResponse = {
  answer: string;
  sources: {
    content: string;
    source: string;
    score: number;
  }[];
};

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // Ref for auto-scrolling to the latest message
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sessionId = "user1";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post<ChatResponse>("http://127.0.0.1:8000/chat", {
        session_id: sessionId,
        query: input,
      });

      const botMessage: Message = {
        role: "assistant",
        content: res.data.answer,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("API Error:", error);

      const errorMessage: Message = {
        role: "assistant",
        content:
          "❌ Something went wrong while connecting to the medical database. Please try again.",
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="chat-header">
        <h2>Medical Assistant</h2>
      </header>

      <main className="chat-window">
        {messages.length === 0 && (
          <div className="empty-state">
            <div className="empty-avatar">🩺</div>
            <h3>How can I help you today?</h3>
            <p>Ask a medical question to get started.</p>
          </div>
        )}

        {messages.map((msg, index) => (
          <div key={index} className={`message-row ${msg.role}`}>
            <div className="message-content">
              <div className={`avatar ${msg.role}`}>
                {msg.role === "user" ? "U" : "AI"}
              </div>
              <div className="text-content">{msg.content}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="message-row assistant">
            <div className="message-content">
              <div className="avatar assistant">AI</div>
              <div className="text-content typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      <div className="input-container">
        <div className="input-wrapper">
          <input
            value={input}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setInput(e.target.value)
            }
            placeholder="Message Medical Assistant..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            disabled={loading}
          />
          <button
            className="send-button"
            onClick={sendMessage}
            disabled={!input.trim() || loading}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22 2L11 13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M22 2L15 22L11 13L2 9L22 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        <div className="footer-text">
          Medical Assistant can make mistakes. Always consult a real doctor for
          serious concerns.
        </div>
      </div>
    </div>
  );
};

export default App;
