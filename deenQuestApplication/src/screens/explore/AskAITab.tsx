import { BookOpen, Send, Sparkles } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { API_BASE } from '../../services/api';
import { COLORS, RADIUS, SHADOW } from '../../theme';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'What does the Quran say about patience?',
  'How do I increase my iman?',
  'What is the best dua for anxiety?',
  'Explain Surah Al-Fatiha',
];

export default function AskAITab() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput('');

    const userMsg: Message = { role: 'user', content: trimmed };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setLoading(true);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const res = await fetch(`${API_BASE}/api/chatbot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      const reply = data.message ?? data.content ?? 'I could not process that. Please try again.';
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I could not connect. Please check your internet and try again.' },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      {messages.length === 0 ? (
        <ScrollView contentContainerStyle={styles.emptyContainer} showsVerticalScrollIndicator={false}>
          <Image source={require('../../../elementsApp/thinking-removebg-preview.png')} style={styles.emptyChar} />
          <Text style={styles.emptyTitle}>Ask AI</Text>
          <Text style={styles.emptySub}>Ask any question about Islam, the Quran, or your spiritual journey</Text>
          <View style={styles.suggestions}>
            {SUGGESTIONS.map((s) => (
              <TouchableOpacity key={s} style={styles.suggestion} onPress={() => sendMessage(s)}>
                <Sparkles size={13} color={COLORS.primary} />
                <Text style={styles.suggestionText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.messages}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg, i) => (
            <View key={i} style={[styles.bubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleAI]}>
              {msg.role === 'assistant' && (
                <View style={styles.aiAvatar}>
                  <BookOpen size={14} color={COLORS.primary} />
                </View>
              )}
              <View style={[styles.bubbleText, msg.role === 'user' ? styles.bubbleTextUser : styles.bubbleTextAI]}>
                <Text style={[styles.msgText, msg.role === 'user' && styles.msgTextUser]}>
                  {msg.content}
                </Text>
              </View>
            </View>
          ))}
          {loading && (
            <View style={[styles.bubble, styles.bubbleAI]}>
              <View style={styles.aiAvatar}>
                <BookOpen size={14} color={COLORS.primary} />
              </View>
              <View style={[styles.bubbleText, styles.bubbleTextAI, styles.typingBubble]}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* Input bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Ask about Islam, Quran, dua…"
          placeholderTextColor={COLORS.textMuted}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => sendMessage(input)}
          returnKeyType="send"
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
          onPress={() => sendMessage(input)}
          disabled={!input.trim() || loading}
        >
          <Send size={18} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },

  emptyContainer: { alignItems: 'center', padding: 24, gap: 12 },
  emptyChar: { width: 130, height: 130, resizeMode: 'contain', marginBottom: 4 },
  emptyTitle: { color: COLORS.text, fontSize: 22, fontWeight: '800' },
  emptySub: { color: COLORS.textSub, fontSize: 14, textAlign: 'center', lineHeight: 22 },
  suggestions: { width: '100%', gap: 10, marginTop: 8 },
  suggestion: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.card, borderRadius: RADIUS.xl,
    borderWidth: 1.5, borderColor: COLORS.cardBorder,
    padding: 14, ...SHADOW.card,
  },
  suggestionText: { color: COLORS.text, fontSize: 14, fontWeight: '500', flex: 1 },

  messages: { padding: 16, gap: 12, paddingBottom: 20 },
  bubble: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  bubbleUser: { justifyContent: 'flex-end' },
  bubbleAI: { justifyContent: 'flex-start' },
  aiAvatar: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: COLORS.primaryBg,
    alignItems: 'center', justifyContent: 'center',
  },
  bubbleText: {
    maxWidth: '78%', borderRadius: RADIUS.xl, padding: 12,
  },
  bubbleTextUser: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  bubbleTextAI: {
    backgroundColor: COLORS.card,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    borderBottomLeftRadius: 4,
    ...SHADOW.card,
  },
  typingBubble: { paddingVertical: 14, paddingHorizontal: 20 },
  msgText: { color: COLORS.text, fontSize: 14, lineHeight: 22 },
  msgTextUser: { color: COLORS.white },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    padding: 12, paddingBottom: Platform.OS === 'ios' ? 20 : 12,
    backgroundColor: COLORS.card,
    borderTopWidth: 1, borderTopColor: COLORS.cardBorder,
  },
  input: {
    flex: 1, backgroundColor: COLORS.bg, borderRadius: RADIUS.xl,
    borderWidth: 1.5, borderColor: COLORS.cardBorder,
    paddingHorizontal: 16, paddingVertical: 10,
    color: COLORS.text, fontSize: 14, maxHeight: 100,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});
