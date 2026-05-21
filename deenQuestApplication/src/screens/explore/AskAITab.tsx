import { BookOpen, Send, ShieldCheck, Sparkles } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { API_BASE } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { DEPTH, RADIUS, SHADOW } from '../../theme';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  grounded?: boolean;
}

const QURAN_KEYWORDS = [
  'quran', 'ayah', 'verse', 'surah', 'allah', 'islam', 'prophet',
  'prayer', 'hadith', 'tafsir', 'ramadan', 'dua', 'sunnah', 'fiqh', 'aqeedah',
];

const SUGGESTIONS = [
  'What does the Quran say about patience?',
  'How do I increase my iman?',
  'What is the best dua for anxiety?',
  'Explain Surah Al-Fatiha',
];

/** Renders basic markdown: **bold**, *italic*, and - bullet lines */
function SimpleMarkdown({ text, style, userBubble }: { text: string; style: object; userBubble?: boolean }) {
  const lines = text.split('\n');
  return (
    <View style={{ gap: 2 }}>
      {lines.map((line, li) => {
        const isBullet = /^(\s*[-*]\s)/.test(line);
        const content = isBullet ? line.replace(/^\s*[-*]\s/, '') : line;
        const parts: React.ReactNode[] = [];
        const boldItalicRe = /\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*/g;
        let last = 0;
        let m: RegExpExecArray | null;
        boldItalicRe.lastIndex = 0;
        while ((m = boldItalicRe.exec(content)) !== null) {
          if (m.index > last) parts.push(<Text key={`t${li}-${last}`} style={style}>{content.slice(last, m.index)}</Text>);
          if (m[1]) parts.push(<Text key={`b${li}-${m.index}`} style={[style, { fontWeight: '700', fontStyle: 'italic' }]}>{m[1]}</Text>);
          else if (m[2]) parts.push(<Text key={`b${li}-${m.index}`} style={[style, { fontWeight: '700' }]}>{m[2]}</Text>);
          else if (m[3]) parts.push(<Text key={`i${li}-${m.index}`} style={[style, { fontStyle: 'italic' }]}>{m[3]}</Text>);
          last = m.index + m[0].length;
        }
        if (last < content.length) parts.push(<Text key={`t${li}-end`} style={style}>{content.slice(last)}</Text>);
        if (parts.length === 0 && content === '') return <View key={li} style={{ height: 4 }} />;
        return (
          <View key={li} style={isBullet ? { flexDirection: 'row', gap: 6 } : {}}>
            {isBullet && <Text style={[style, { marginTop: 2 }]}>{'•'}</Text>}
            <Text style={[style, { flex: isBullet ? 1 : undefined }]}>{parts}</Text>
          </View>
        );
      })}
    </View>
  );
}

export default function AskAITab() {
  const { colors } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Scroll to end when keyboard opens (so latest message stays visible)
  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    });
    return () => sub.remove();
  }, []);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput('');

    const userMsg: Message = { role: 'user', content: trimmed };
    const nextMessages: Message[] = [...messages, userMsg];
    setMessages(nextMessages);
    setLoading(true);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      // Context window: last 8 messages (same as web)
      const contextWindow = nextMessages.slice(-8).map(({ role, content }) => ({ role, content }));

      // Auto-ground on Quran-related keywords (same as web)
      const lower = trimmed.toLowerCase();
      const autoGround = QURAN_KEYWORDS.some((kw) => lower.includes(kw));
      const groundingQuery = autoGround ? trimmed : '';

      const res = await fetch(`${API_BASE}/api/deepseek`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: contextWindow, groundingQuery }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      const reply = data.content ?? 'I could not process that. Please try again.';
      setMessages((prev) => [...prev, { role: 'assistant', content: reply, grounded: !!data.grounded }]);
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

  const styles = useMemo(() => StyleSheet.create({
    flex: { flex: 1 },

    emptyContainer: { alignItems: 'center', padding: 24, gap: 12 },
    emptyChar: { width: 130, height: 130, resizeMode: 'contain', marginBottom: 4 },
    emptyTitle: { color: colors.text, fontSize: 22, fontWeight: '800' },
    emptySub: { color: colors.textSub, fontSize: 14, textAlign: 'center', lineHeight: 22 },
    suggestions: { width: '100%', gap: 10, marginTop: 8 },
    suggestion: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      backgroundColor: colors.card, borderRadius: RADIUS.xl,
      borderWidth: 1.5, borderColor: colors.cardBorder,
      padding: 14, ...SHADOW.card,
      borderBottomWidth: 4, borderBottomColor: '#9B8CC8',
    },
    suggestionText: { color: colors.text, fontSize: 14, fontWeight: '500', flex: 1 },

    messages: { padding: 16, gap: 12, paddingBottom: 20 },
    bubble: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
    bubbleUser: { justifyContent: 'flex-end' },
    bubbleAI: { justifyContent: 'flex-start' },
    bubbleUserWrap: { alignItems: 'flex-end', maxWidth: '78%' },
    bubbleAIWrap: { alignItems: 'flex-start', maxWidth: '78%' },
    aiAvatar: {
      width: 30, height: 30, borderRadius: 15,
      backgroundColor: colors.primaryBg,
      alignItems: 'center', justifyContent: 'center',
    },
    bubbleText: {
      borderRadius: RADIUS.xl, padding: 12,
    },
    bubbleTextUser: {
      backgroundColor: colors.primary,
      borderBottomRightRadius: 4,
    },
    bubbleTextAI: {
      backgroundColor: colors.card,
      borderWidth: 1, borderColor: colors.cardBorder,
      borderBottomLeftRadius: 4,
      ...SHADOW.card,
    },
    typingBubble: { paddingVertical: 14, paddingHorizontal: 20 },
    msgText: { color: colors.text, fontSize: 14, lineHeight: 22 },
    msgTextUser: { color: colors.white },
    groundedBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      marginTop: 4, paddingHorizontal: 2,
    },
    groundedText: { color: colors.primary, fontSize: 11, opacity: 0.8 },

    inputBar: {
      flexDirection: 'row', alignItems: 'flex-end', gap: 10,
      padding: 12, paddingBottom: Platform.OS === 'ios' ? 20 : 12,
      backgroundColor: colors.card,
      borderTopWidth: 1, borderTopColor: colors.cardBorder,
    },
    input: {
      flex: 1, backgroundColor: colors.bg, borderRadius: RADIUS.xl,
      borderWidth: 1.5, borderColor: colors.cardBorder,
      paddingHorizontal: 16, paddingVertical: 10,
      color: colors.text, fontSize: 14, maxHeight: 100,
    },
    sendBtn: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: colors.primary,
      alignItems: 'center', justifyContent: 'center',
    },
    sendBtnDisabled: { opacity: 0.4 },
  }), [colors]);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={84}
    >
      {messages.length === 0 ? (
      <ScrollView
          contentContainerStyle={styles.emptyContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={styles.flex}
        >
          <Image source={require('../../../elementsApp/thinking-removebg-preview.png')} style={styles.emptyChar} />
          <Text style={styles.emptyTitle}>Ask AI</Text>
          <Text style={styles.emptySub}>Ask any question about Islam, the Quran, or your spiritual journey</Text>
          <View style={styles.suggestions}>
            {SUGGESTIONS.map((s) => (
              <SuggestionChip key={s} text={s} onPress={() => sendMessage(s)} styles={styles} colors={colors} />
            ))}
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.messages}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((msg, i) => (
            <View key={i} style={[styles.bubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleAI]}>
              {msg.role === 'assistant' && (
                <View style={styles.aiAvatar}>
                  <BookOpen size={14} color={colors.primary} />
                </View>
              )}
              <View style={msg.role === 'user' ? styles.bubbleUserWrap : styles.bubbleAIWrap}>
                <View style={[styles.bubbleText, msg.role === 'user' ? styles.bubbleTextUser : styles.bubbleTextAI]}>
                  <SimpleMarkdown
                    text={msg.content}
                    style={[styles.msgText, msg.role === 'user' && styles.msgTextUser]}
                    userBubble={msg.role === 'user'}
                  />
                </View>
                {msg.role === 'assistant' && msg.grounded && (
                  <View style={styles.groundedBadge}>
                    <ShieldCheck size={11} color={colors.primary} />
                    <Text style={styles.groundedText}>Verified with Quran MCP</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
          {loading && (
            <View style={[styles.bubble, styles.bubbleAI]}>
              <View style={styles.aiAvatar}>
                <BookOpen size={14} color={colors.primary} />
              </View>
              <View style={[styles.bubbleText, styles.bubbleTextAI, styles.typingBubble]}>
                <ActivityIndicator size="small" color={colors.primary} />
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
          placeholderTextColor={colors.textMuted}
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
          <Send size={18} color={colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function SuggestionChip({ text, onPress, styles, colors }: {
  text: string; onPress: () => void;
  styles: ReturnType<typeof StyleSheet.create>; colors: any;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      style={[styles.suggestion, pressed && DEPTH.buttonPressed]}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
    >
      <Sparkles size={13} color={colors.primary} />
      <Text style={styles.suggestionText}>{text}</Text>
    </Pressable>
  );
}
