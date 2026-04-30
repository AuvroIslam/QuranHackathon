"use client";

import { useAuth } from "@/components/AuthProvider";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Send, Bot, User, Loader2, ShieldCheck } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { ChatMessage } from "@/lib/types";
import PageTooltip from "@/components/PageTooltip";

const CHAT_STORAGE_KEY = "deenquest_chat_messages";
const GROUNDED_STORAGE_KEY = "deenquest_chat_grounded";

export default function ChatbotPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = sessionStorage.getItem(CHAT_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  // Track which message indices were MCP-grounded
  const [groundedIndices, setGroundedIndices] = useState<Set<number>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const saved = sessionStorage.getItem(GROUNDED_STORAGE_KEY);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [forceGround, setForceGround] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [loading, user, router]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    try {
      sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
      sessionStorage.setItem(GROUNDED_STORAGE_KEY, JSON.stringify([...groundedIndices]));
    } catch { }
  }, [messages, groundedIndices]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const fullHistory = [...messages, userMsg];
      const contextWindow = fullHistory.slice(-8);

      const quranKeywords = ["quran", "ayah", "verse", "surah", "allah", "islam", "prophet", "prayer", "hadith", "tafsir", "ramadan", "dua", "sunnah", "fiqh", "aqeedah"];
      const lower = text.toLowerCase();
      const autoGround = quranKeywords.some((kw) => lower.includes(kw));
      const groundingQuery = (forceGround || autoGround) ? text : "";

      const res = await fetch("/api/deepseek", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: contextWindow.map(({ role, content }) => ({ role, content })),
          groundingQuery,
        }),
      });
      const data = await res.json();
      if (data.content) {
        setMessages((prev) => {
          const next = [...prev, { role: "assistant" as const, content: data.content }];
          if (data.grounded) {
            setGroundedIndices((gi) => new Set(gi).add(next.length - 1));
          }
          return next;
        });
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "I apologize, I was unable to process your question. Please try again." },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Connection error. Please check your internet and try again." },
      ]);
    }
    setSending(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-[calc(100vh-3.5rem)] md:h-screen">
      <div className="absolute left-4 top-4 z-40">
        <button
          type="button"
          onClick={() => setForceGround((v) => !v)}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all border ${
            forceGround
              ? "bg-secondary/20 border-secondary/40 text-secondary"
              : "bg-white/10 border-white/20 text-primary/50 hover:text-primary/70"
          }`}
        >
          <ShieldCheck size={12} />
          {forceGround ? "Force MCP: ON" : "Force MCP: OFF"}
        </button>
      </div>
      <div className="absolute right-4 top-4 z-40">
        <PageTooltip
          title="Quran Chatbot"
          description={[
            "Ask questions about Islam and Quranic teachings.",
            "Quran-related questions auto-verify against Quran MCP.",
            "Force MCP ON to verify every message, not just Quran topics.",
          ]}
        />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gradient-to-br from-secondary to-secondary-dark rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-secondary/25">
              <Bot size={28} className="text-white" />
            </div>
            <h2 className="text-lg font-semibold text-primary mb-2">
              Bismillah, how can I help?
            </h2>
            <p className="text-sm text-primary/50 max-w-md mx-auto">
              Ask me about Quranic verses, their meanings, Islamic guidance, or how to apply
              Quranic teachings in your daily life.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
              {[
                "What does the Quran say about patience?",
                "Explain Surah Al-Fatiha",
                "How to deal with anxiety according to Islam?",
                "What are the benefits of reading Quran daily?",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="text-xs bg-white/20 text-primary/70 px-3 py-2 rounded-lg hover:bg-white/30 transition-all duration-300 text-left backdrop-blur-sm border border-white/20"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-secondary to-secondary-dark flex items-center justify-center flex-shrink-0 shadow-sm">
                <Bot size={16} className="text-white" />
              </div>
            )}
            <div className="flex flex-col gap-1 max-w-[80%]">
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-linear-to-r from-primary to-primary-light text-white rounded-br-md shadow-lg shadow-primary/20"
                    : "glass-card text-primary rounded-bl-md"
                }`}
              >
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                    ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                    li: ({ children }) => <li className="text-sm">{children}</li>,
                  }}
                >{msg.content}</ReactMarkdown>
              </div>
              {msg.role === "assistant" && groundedIndices.has(i) && (
                <span className="flex items-center gap-1 text-xs text-secondary/70 px-1">
                  <ShieldCheck size={11} />
                  Verified with Quran MCP
                </span>
              )}
            </div>
            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center flex-shrink-0">
                <User size={16} className="text-secondary" />
              </div>
            )}
          </div>
        ))}

        {sending && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-secondary to-secondary-dark flex items-center justify-center flex-shrink-0 shadow-sm">
              <Bot size={16} className="text-white" />
            </div>
            <div className="glass-card rounded-2xl rounded-bl-md px-4 py-3">
              <Loader2 size={18} className="animate-spin text-secondary" />
            </div>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="px-4 pb-4 pt-2 glass-strong border-t border-white/15">
        <div className="flex flex-col gap-2 max-w-3xl mx-auto">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Ask about the Quran..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={sending}
              className="flex-1 px-4 py-3 bg-white/25 border border-white/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/30 disabled:opacity-50 backdrop-blur-sm placeholder:text-primary/35 transition-all duration-300"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="px-4 py-3 bg-linear-to-r from-secondary to-secondary-dark text-white rounded-xl hover:brightness-110 transition-all duration-300 disabled:opacity-50 shadow-lg shadow-secondary/20"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
