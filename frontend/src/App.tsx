import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import "./App.css";

type Message = {
  role: "user" | "assistant";
  content: string;
  sources?: {
    content: string;
    source: string;
    score: number;
  }[];
  timestamp?: string;
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

type ChatSession = {
  id: string;
  title?: string;
  lastMessage?: string;
  timestamp: string;
};

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [sessionId, setSessionId] = useState(() => uuidv4());
  const [currentSessionTitle, setCurrentSessionTitle] = useState("");
  const [sidebarVisible, setSidebarVisible] = useState(true);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const loadSessions = async () => {
    try {
      const res = await axios.get<ChatSession[]>("/sessions");
      setSessions(res.data);
    } catch (err) {
      console.error("Error loading sessions:", err);
    }
  };

  const loadHistory = async (sessionIdToLoad: string) => {
    try {
      const res = await axios.get<HistoryResponse>(`/chat/${sessionIdToLoad}`);
      setMessages(res.data.messages);
      const firstUserMsg = res.data.messages.find((m) => m.role === "user");
      setCurrentSessionTitle(
        firstUserMsg ? firstUserMsg.content.slice(0, 50) + "..." : "",
      );
    } catch (err) {
      console.error("Error loading chat history:", err);
      setMessages([]);
      setCurrentSessionTitle("");
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    loadHistory(sessionId);
  }, [sessionId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await axios.post<ChatResponse>("/chat", {
        session_id: sessionId,
        query: input,
      });

      const botMessage: Message = {
        role: "assistant",
        content: res.data.answer,
        sources: res.data.sources,
      };

      setMessages((prev) => [...prev, botMessage]);
      setCurrentSessionTitle(
        (prev) => prev || input.trim().slice(0, 50) + "...",
      );

      await loadSessions();
    } catch (err) {
      console.error("Chat request failed:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "❌ Error fetching response." },
      ]);
    } finally {
      setInput("");
      setLoading(false);
    }
  };

  const startNewChat = () => {
    const newSessionId = uuidv4();
    setSessionId(newSessionId);
    setMessages([]);
    setCurrentSessionTitle("");
  };

  const loadChat = (chatId: string) => {
    setSessionId(chatId);
  };

  return (
    <div className="app">
      {sidebarVisible && (
        <aside className="sidebar">
          <div className="sidebar-brand">Chatbot Review</div>
          <button onClick={startNewChat} className="new-chat-btn">
            ➕ New Chat
          </button>
          <div className="sidebar-section-title">Recents</div>
          <ul className="chat-list">
            {sessions.map((session) => (
              <li
                key={session.id}
                className={`chat-item ${session.id === sessionId ? "active" : ""}`}
                onClick={() => loadChat(session.id)}
              >
                <div className="chat-title">
                  {session.title || "Untitled Chat"}
                </div>
                <div className="chat-preview">
                  {session.lastMessage?.slice(0, 65)}...
                </div>
                <div className="chat-timestamp">
                  {new Date(session.timestamp).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        </aside>
      )}

      <div className="main-content">
        <header className="header">
          <div className="header-title">
            🧠 Medical Chatbot{" "}
            {currentSessionTitle && `- ${currentSessionTitle}`}
          </div>
          <button
            className="toggle-sidebar-btn"
            onClick={() => setSidebarVisible((prev) => !prev)}
          >
            {sidebarVisible ? "Hide Chats" : "Show Chats"}
          </button>
        </header>

        <div className="chat-container">
          {messages.map((msg, i) => (
            <div key={i} className={`message-row ${msg.role}`}>
              <div className="bubble">
                {msg.content}
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
    </div>
  );
};

export default App;
