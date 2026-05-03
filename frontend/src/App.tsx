import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import "./App.css";

type Message = {
  role: "user" | "assistant";
  content: string;
  sources?: {
    content: string;
    source: string;
    score: number;
  }[];
  timestamp?: string; // Add timestamp for history
};

type ChatResponse = {
  answer: string;
  sources: {
    content: string;
    source: string;
    score: number;
  }[];
};

type HistoryResponse = {
  messages: {
    role: "user" | "assistant";
    content: string;
    timestamp?: string;
  }[];
};

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sessionId = "user1";
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // 🔽 Load chat history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await axios.get<HistoryResponse>(
          `http://127.0.0.1:8000/chat/${sessionId}`,
        );
        setMessages(res.data.messages);
      } catch (err) {
        console.error("Error loading chat history:", err);
      }
    };
    loadHistory();
  }, [sessionId]);

  // 🔽 Auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);

    setLoading(true);

    try {
      const res = await axios.post<ChatResponse>("http://127.0.0.1:8000/chat", {
        session_id: sessionId,
        query: input,
      });

      const botMessage: Message = {
        role: "assistant",
        content: res.data.answer,
        sources: res.data.sources,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "❌ Error fetching response.",
        },
      ]);
    }

    setInput("");
    setLoading(false);
  };

  return (
    <div className="app">
      <header className="header">🧠 Medical Chatbot</header>

      <div className="chat-container">
        {messages.map((msg, i) => (
          <div key={i} className={`message-row ${msg.role}`}>
            <div className="bubble">
              {msg.content}

              {/* 🔽 Sources toggle */}
              {msg.sources && (
                <details className="sources">
                  <summary>📄 Sources</summary>
                  {msg.sources.map((s, idx) => (
                    <div key={idx} className="source-item">
                      <b>{s.source}</b>
                      <p>{s.content}</p>
                    </div>
                  ))}
                </details>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="message-row assistant">
            <div className="bubble typing">Typing...</div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      <div className="input-container">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask medical question..."
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage} disabled={loading}>
          Send
        </button>
      </div>
    </div>
  );
};

export default App;
