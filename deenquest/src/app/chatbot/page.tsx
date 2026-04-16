"use client";

import { useAuth } from "@/components/AuthProvider";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Send, Bot, User, Loader2 } from "lucide-react";
import type { ChatMessage } from "@/lib/types";

export default function ChatbotPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [loading, user, router]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/deepseek", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(({ role, content }) => ({ role, content })),
        }),
      });
      const data = await res.json();
      if (data.content) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
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
    <div className="flex flex-col h-[calc(100vh-3.5rem)] md:h-screen">
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
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-gradient-to-r from-primary to-primary-light text-white rounded-br-md shadow-lg shadow-primary/20"
                  : "glass-card text-primary rounded-bl-md"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
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
        <div className="flex gap-3 max-w-3xl mx-auto">
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
            className="px-4 py-3 bg-gradient-to-r from-secondary to-secondary-dark text-white rounded-xl hover:brightness-110 transition-all duration-300 disabled:opacity-50 shadow-lg shadow-secondary/20"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}
