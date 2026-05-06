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
      const res = await axios.get<ChatSession[]>(
        "http://127.0.0.1:8000/sessions",
      );
      setSessions(res.data);
      return res.data;
    } catch (err) {
      console.error("Error loading sessions:", err);
      return [];
    }
  };

  const loadHistory = async (sessionIdToLoad: string) => {
    try {
      const res = await axios.get<HistoryResponse>(
        `http://127.0.0.1:8000/chat/${sessionIdToLoad}`,
      );
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
    const initializeChat = async () => {
      const previousSessions = await loadSessions();
      if (previousSessions && previousSessions.length > 0) {
        setSessionId(previousSessions[0].id);
      }
    };
    initializeChat();
  }, []);

  useEffect(() => {
    loadHistory(sessionId);
  }, [sessionId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim()) return;

    const userMessage: Message = { role: "user", content: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setInput("");

    try {
      const res = await axios.post<ChatResponse>("http://127.0.0.1:8000/chat", {
        session_id: sessionId,
        query: textToSend,
      });

      const botMessage: Message = {
        role: "assistant",
        content: res.data.answer,
        sources: res.data.sources,
      };

      setMessages((prev) => [...prev, botMessage]);
      setCurrentSessionTitle(
        (prev) => prev || textToSend.trim().slice(0, 50) + "...",
      );

      await loadSessions();
    } catch (err) {
      console.error("Chat request failed:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "❌ Error fetching response." },
      ]);
    } finally {
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

  // Helper for suggestion chips
  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  return (
    <div className="app">
      {sidebarVisible && (
        <aside className="sidebar">
          <div className="sidebar-brand">Medical Chatbot</div>
          <button onClick={startNewChat} className="new-chat-btn">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            New Chat
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
              </li>
            ))}
          </ul>
        </aside>
      )}

      <div className="main-content">
        <header className="header">
          <button
            className="toggle-sidebar-btn icon-btn"
            onClick={() => setSidebarVisible((prev) => !prev)}
            title={sidebarVisible ? "Close sidebar" : "Open sidebar"}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="3" x2="9" y2="21"></line>
            </svg>
          </button>
          <div className="header-title">
            {currentSessionTitle && `${currentSessionTitle}`}
          </div>
          <div style={{ width: 24 }}></div> {/* Spacer for flex centering */}
        </header>

        {messages.length === 0 && !loading ? (
          /* --- EMPTY STATE (HERO VIEW) --- */
          <div className="welcome-hero">
            <h2>How can I help you today?</h2>

            <div className="hero-input-container">
              <div className="hero-input-wrapper">
                <span className="icon-plus">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </span>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything"
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                />
                <button className="voice-btn" title="Voice Input (Coming Soon)">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="22"></line>
                  </svg>
                </button>
                {input && (
                  <button className="submit-btn" onClick={() => sendMessage()}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                  </button>
                )}
              </div>

              <div className="suggestion-chips">
                <button
                  className="chip"
                  onClick={() =>
                    handleSuggestionClick("Explain a complex medical case")
                  }
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                  Analyze a case
                </button>
                <button
                  className="chip"
                  onClick={() =>
                    handleSuggestionClick("Lookup patient history format")
                  }
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  Draft documents
                </button>
                <button
                  className="chip"
                  onClick={() =>
                    handleSuggestionClick("Search medical guidelines")
                  }
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                  </svg>
                  Look something up
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* --- ACTIVE CHAT VIEW --- */
          <>
            <div className="chat-container">
              {messages.map((msg, i) => (
                <div key={i} className={`message-row ${msg.role}`}>
                  <div className="avatar">
                    {msg.role === "assistant" ? (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M12 2a2 2 0 0 1 2 2c0 1.1-.9 2-2 2s-2-.9-2-2c0-1.1.9-2 2-2zm0 6c-3.31 0-6 2.69-6 6v4a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-4c0-3.31-2.69-6-6-6z"></path>
                      </svg>
                    ) : (
                      "U"
                    )}
                  </div>
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
                  <div className="avatar">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 2a2 2 0 0 1 2 2c0 1.1-.9 2-2 2s-2-.9-2-2c0-1.1.9-2 2-2zm0 6c-3.31 0-6 2.69-6 6v4a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-4c0-3.31-2.69-6-6-6z"></path>
                    </svg>
                  </div>
                  <div className="bubble typing">Thinking...</div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="bottom-input-container">
              <div className="input-wrapper">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask medical question..."
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={loading || !input.trim()}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default App;
