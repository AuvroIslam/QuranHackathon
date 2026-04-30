import { useState, useRef } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Send, Bot, User, Trash2, Sparkles } from "lucide-react-native";
import { fetchAI } from "../../lib/api";
import type { ChatMessage } from "../../lib/types";

const SUGGESTIONS = [
  "What does the Quran say about patience?",
  "Explain Surah Al-Fatiha",
  "How to strengthen my iman?",
  "What is tawakkul?",
];

export default function AiScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  async function send(text?: string) {
    const q = (text ?? input).trim();
    if (!q || loading) return;
    setInput("");
    const userMsg: ChatMessage = { role: "user", content: q };
    const next = [...messages, userMsg];
    setMessages(next);
    setLoading(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    try {
      const res = await fetchAI(next, q);
      const reply = res.reply || res.content || "Sorry, I couldn't get a response.";
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "Something went wrong. Please try again." }]);
    }
    setLoading(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }

  return (
    <LinearGradient colors={["#0F1639", "#15173D", "#1a0a2e"]} style={s.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>

        <View style={s.header}>
          <View style={s.headerLeft}>
            <View style={s.botIcon}>
              <Bot size={18} color="#E491C9" />
            </View>
            <View>
              <Text style={s.title}>Ask AI</Text>
              <Text style={s.subtitle}>Powered by DeepSeek · Quran-grounded</Text>
            </View>
          </View>
          {messages.length > 0 && (
            <TouchableOpacity onPress={() => setMessages([])} style={s.clearBtn}>
              <Trash2 size={16} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={s.chatArea}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {messages.length === 0 && (
            <View style={s.welcome}>
              <View style={s.welcomeIcon}>
                <Sparkles size={28} color="#E491C9" />
              </View>
              <Text style={s.welcomeTitle}>Islamic AI Assistant</Text>
              <Text style={s.welcomeSub}>Ask questions about the Quran, Islamic guidance, or spirituality</Text>
              <View style={s.suggestions}>
                {SUGGESTIONS.map((s_, i) => (
                  <TouchableOpacity key={i} style={s.suggestionBtn} onPress={() => send(s_)} activeOpacity={0.75}>
                    <Text style={s.suggestionText}>{s_}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {messages.map((msg, i) => (
            <View key={i} style={[s.bubble, msg.role === "user" ? s.userBubble : s.aiBubble]}>
              {msg.role === "assistant" && (
                <View style={s.aiBubbleHeader}>
                  <Bot size={12} color="#E491C9" />
                  <Text style={s.aiBubbleLabel}>DeenQuest AI</Text>
                </View>
              )}
              <Text style={[s.bubbleText, msg.role === "user" && s.userBubbleText]}>
                {msg.content}
              </Text>
            </View>
          ))}

          {loading && (
            <View style={[s.bubble, s.aiBubble]}>
              <View style={s.aiBubbleHeader}>
                <Bot size={12} color="#E491C9" />
                <Text style={s.aiBubbleLabel}>DeenQuest AI</Text>
              </View>
              <View style={s.typingRow}>
                <ActivityIndicator size="small" color="#E491C9" />
                <Text style={s.typingText}>Thinking…</Text>
              </View>
            </View>
          )}

          <View style={{ height: 8 }} />
        </ScrollView>

        <View style={s.inputRow}>
          <TextInput
            style={s.inputBox}
            placeholder="Ask about the Quran…"
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={() => send()}
          />
          <TouchableOpacity
            style={[s.sendBtn, (!input.trim() || loading) && s.sendBtnDisabled]}
            onPress={() => send()}
            disabled={!input.trim() || loading}
            activeOpacity={0.8}
          >
            <Send size={18} color="#fff" />
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.07)" },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  botIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: "rgba(152,37,152,0.25)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(228,145,201,0.3)" },
  title: { fontSize: 18, fontWeight: "700", color: "#fff" },
  subtitle: { fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 1 },
  clearBtn: { padding: 8 },
  chatArea: { padding: 16, flexGrow: 1 },
  welcome: { alignItems: "center", paddingTop: 30, paddingBottom: 20 },
  welcomeIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: "rgba(152,37,152,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 16, borderWidth: 1, borderColor: "rgba(228,145,201,0.25)" },
  welcomeTitle: { fontSize: 20, fontWeight: "700", color: "#fff", marginBottom: 6 },
  welcomeSub: { fontSize: 13, color: "rgba(255,255,255,0.4)", textAlign: "center", paddingHorizontal: 30, lineHeight: 20, marginBottom: 24 },
  suggestions: { width: "100%", gap: 8 },
  suggestionBtn: { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  suggestionText: { color: "rgba(255,255,255,0.6)", fontSize: 13 },
  bubble: { maxWidth: "88%", marginBottom: 12, borderRadius: 18, padding: 14 },
  userBubble: { alignSelf: "flex-end", backgroundColor: "#982598" },
  aiBubble: { alignSelf: "flex-start", backgroundColor: "rgba(20,20,50,0.9)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  aiBubbleHeader: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 6 },
  aiBubbleLabel: { fontSize: 10, color: "#E491C9", fontWeight: "600" },
  bubbleText: { color: "rgba(255,255,255,0.75)", fontSize: 14, lineHeight: 21 },
  userBubbleText: { color: "#fff" },
  typingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  typingText: { color: "rgba(255,255,255,0.4)", fontSize: 13 },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.07)" },
  inputBox: { flex: 1, backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 10, color: "#fff", fontSize: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#982598", alignItems: "center", justifyContent: "center" },
  sendBtnDisabled: { opacity: 0.4 },
});
