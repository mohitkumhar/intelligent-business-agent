"use client";
import { useState, useRef, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { ChatbotIcon } from "@/components/Icons";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId] = useState(() => crypto.randomUUID());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: conversationId,
          message: userMsg,
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.content || "No response from agent." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error: Could not reach the AI agent. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-area">
        <Topbar onSearch={() => { }} />
        <div className="content-wrapper" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 69px)", padding: 0 }}>
          {/* Chat Header */}
          <div style={{
            padding: "16px 32px",
            borderBottom: "1px solid var(--border-color)",
            background: "var(--bg-card)",
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
              <ChatbotIcon size={20} color="var(--accent-blue)" /> AI Business Agent
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
              Ask questions about your business data, financials, employees, and more.
            </p>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflow: "auto",
            padding: "24px 32px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}>
            {messages.length === 0 && (
              <div style={{
                textAlign: "center",
                color: "var(--text-muted)",
                marginTop: 80,
                fontSize: 14,
              }}>
                <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}>
                  <ChatbotIcon size={48} color="var(--accent-blue)" />
                </div>
                <p style={{ fontWeight: 600, fontSize: 16, color: "var(--text-secondary)", marginBottom: 8 }}>
                  Hello! I&apos;m your AI Business Agent.
                </p>
                <p>Ask me anything about your business data.</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "70%",
                    padding: "12px 18px",
                    borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    background: msg.role === "user" ? "var(--accent-blue)" : "var(--bg-card)",
                    color: msg.role === "user" ? "white" : "var(--text-primary)",
                    border: msg.role === "user" ? "none" : "1px solid var(--border-color)",
                    fontSize: 14,
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{
                  padding: "12px 18px",
                  borderRadius: "16px 16px 16px 4px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-color)",
                  fontSize: 14,
                  color: "var(--text-muted)",
                }}>
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{
            padding: "16px 32px",
            borderTop: "1px solid var(--border-color)",
            background: "var(--bg-card)",
            display: "flex",
            gap: 12,
          }}>
            <input
              type="text"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              style={{
                flex: 1,
                padding: "12px 18px",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-sm)",
                fontSize: 14,
                fontFamily: "Inter, sans-serif",
                outline: "none",
                background: "var(--bg-primary)",
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{
                padding: "12px 24px",
                background: loading ? "#9CA3AF" : "var(--accent-blue)",
                color: "white",
                border: "none",
                borderRadius: "var(--radius-sm)",
                fontWeight: 600,
                fontSize: 14,
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "Inter, sans-serif",
                transition: "all 0.2s",
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
