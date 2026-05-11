import { BookOpen, Share2 } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { API_BASE } from '../../services/api';
import { COLORS, DEPTH, RADIUS, SHADOW } from '../../theme';

const TOPICS = [
  'Patience', 'Justice', 'Mercy', 'Women', 'Prayer', 'Charity',
  'Forgiveness', 'Knowledge', 'Family', 'Gratitude', 'Faith', 'Truthfulness',
];

interface ScriptureEntry {
  scriptureName: string;
  quote: string;
  reference: string;
  explanation: string;
}

interface DawahSections {
  quranView: string;
  scriptures: ScriptureEntry[];
  ummahReasoning: string;
}

function stripHtml(html: string) {
  return html.replace(/<sup[^>]*>.*?<\/sup>/gi, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

/** Walk character-by-character to find the first balanced { } object. */
function extractFirstJsonObject(text: string): string | null {
  const start = text.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

/** Last-resort regex extraction of a single string field from raw JSON text. */
function extractStringField(text: string, field: string): string | null {
  const m = text.match(new RegExp(`"${field}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`, 's'));
  return m ? m[1].replace(/\\n/g, ' ').replace(/\\"/g, '"').trim() : null;
}

function parseDawahSections(raw: string): DawahSections {
  const clean = raw.trim();
  const fallback: DawahSections = {
    quranView: 'Unable to generate a Quranic summary right now. Please try again.',
    scriptures: [],
    ummahReasoning: 'Could not parse the ummah-focused reasoning. Please retry.',
  };
  if (!clean) return fallback;

  // Strip markdown fences if present
  const fenced = clean.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] ?? clean).trim();

  // Use balanced extraction instead of greedy regex
  const jsonStr = extractFirstJsonObject(candidate);
  if (!jsonStr) {
    // Try regex field extraction as last resort
    const qv = extractStringField(candidate, 'quranView');
    const ur = extractStringField(candidate, 'ummahReasoning');
    if (qv) return { quranView: qv, scriptures: [], ummahReasoning: ur ?? fallback.ummahReasoning };
    return fallback;
  }

  try {
    const parsed = JSON.parse(jsonStr);
    const parsedScriptures: ScriptureEntry[] = Array.isArray(parsed?.scriptures)
      ? parsed.scriptures
          .map((entry: any) => ({
            scriptureName: typeof entry?.scriptureName === 'string' ? entry.scriptureName.trim() : '',
            quote: typeof entry?.quote === 'string' ? entry.quote.trim().replace(/^'+|'+$/g, '') : '',
            reference: typeof entry?.reference === 'string' ? entry.reference.trim() : '',
            explanation: typeof entry?.explanation === 'string' ? entry.explanation.trim() : '',
          }))
          .filter((e: ScriptureEntry) => e.scriptureName && e.quote && e.reference)
      : [];
    if (typeof parsed?.quranView === 'string' && typeof parsed?.ummahReasoning === 'string') {
      return {
        quranView: parsed.quranView.trim(),
        scriptures: parsedScriptures,
        ummahReasoning: parsed.ummahReasoning.trim(),
      };
    }
  } catch {
    // JSON.parse failed — try regex field extraction on the raw candidate
    const qv = extractStringField(candidate, 'quranView');
    const ur = extractStringField(candidate, 'ummahReasoning');
    if (qv) return { quranView: qv, scriptures: [], ummahReasoning: ur ?? fallback.ummahReasoning };
  }
  return fallback;
}

export default function DawahTab() {
  const [selectedTopic, setSelectedTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [searching, setSearching] = useState(false);
  const [explorePressed, setExplorePressed] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const inputLayoutY = useRef(0);
  const [ayahs, setAyahs] = useState<any[]>([]);
  const [quranView, setQuranView] = useState('');
  const [scriptures, setScriptures] = useState<ScriptureEntry[]>([]);
  const [ummahReasoning, setUmmahReasoning] = useState('');

  const handleTopicSelect = async (topic: string) => {
    setSelectedTopic(topic);
    setCustomTopic('');
    setSearching(true);
    setAyahs([]);
    setQuranView('');
    setScriptures([]);
    setUmmahReasoning('');

    try {
      // 1. Search for related ayahs
      const searchParams = new URLSearchParams({ path: 'search', q: topic, size: '5', language: 'en' });
      const res = await fetch(`${API_BASE}/api/quran?${searchParams.toString()}`);
      const data = res.ok ? await res.json() : {};
      const results: any[] = data?.search?.results ?? [];

      const mapped = results.map((r: any) => ({
        verseKey: r.verse_key,
        arabic: (r.text ?? '') as string,
        translation: stripHtml(r.translations?.[0]?.text ?? ''),
      }));
      setAyahs(mapped);

      const verseSummary = mapped
        .slice(0, 3)
        .map((r: any) => `${r.verseKey}: "${r.translation}"`)
        .join('\n');

      const verseContext = verseSummary
        ? `Use these relevant Quran verses as primary grounding:\n${verseSummary}`
        : 'No direct verse search results were found; use well-known Quranic principles and accurate references.';

      // 2. Generate dawah insights
      const aiRes = await fetch(`${API_BASE}/api/deepseek`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerMode: 'dawah',
          groundingQuery: topic,
          messages: [
            {
              role: 'user',
              content: `Topic: "${topic}"\n\n${verseContext}\n\nRespond with ONLY a raw JSON object. No markdown fences, no explanation outside the JSON.\n\nLimits per field:\n- quranView: 2-3 sentences, max 500 chars, include 1-2 ayah refs\n- Each scripture quote: max 150 chars. If translation is uncertain, end with " (translation may vary)" — do NOT wrap the quote in single quotes\n- Each scripture explanation: 2-3 sentences, max 220 chars\n- ummahReasoning: 3-4 sentences, max 500 chars\n- Exactly 3 scriptures: Bible, Bhagavad Gita, Torah\n\nShape:\n{"quranView":"...","scriptures":[{"scriptureName":"...","quote":"...","reference":"...","explanation":"..."}],"ummahReasoning":"..."}\n\nCritical: every string must be a complete sentence. Never cut off mid-word or mid-sentence.`,
            },
          ],
          systemPrompt:
            'You are a respectful Islamic dawah educator. Always return only raw valid JSON — no markdown, no prose outside the JSON. Compare scriptures fairly, keep tone non-inflammatory, cite Quranic references accurately, and never use derogatory language about any faith.',
        }),
      });

      const aiData = await aiRes.json();
      const sections = parseDawahSections(aiData.content ?? '');
      setQuranView(sections.quranView);
      setScriptures(sections.scriptures);
      setUmmahReasoning(sections.ummahReasoning);
    } catch {
      setQuranView('Unable to generate a Quranic summary right now. Please try again.');
      setScriptures([]);
      setUmmahReasoning('Unable to generate the ummah-focused reasoning right now.');
    } finally {
      setSearching(false);
    }
  };

  const handleCustomSearch = () => {
    if (customTopic.trim()) handleTopicSelect(customTopic.trim());
  };

  const handleShare = async (entry: ScriptureEntry) => {
    try {
      await Share.share({
        message: `"${entry.quote}" — ${entry.reference}\n\n${entry.explanation}\n\nTopic: ${selectedTopic} | Shared via DeenQuest`,
      });
    } catch {}
  };

  const hasResults = !searching && selectedTopic && (quranView || scriptures.length > 0 || ummahReasoning);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.heading}>Dawah Perspectives</Text>
      <Text style={styles.sub}>Explore Quranic guidance and respectful cross-scripture comparison</Text>

      {/* Topic chips */}
      <View style={styles.topicSection}>
        <Text style={styles.sectionLabel}>Choose a topic</Text>
        <View style={styles.chips}>
          {TOPICS.map((topic) => (
            <Pressable
              key={topic}
              onPress={() => !searching && handleTopicSelect(topic)}
              style={[styles.chip, selectedTopic === topic && !searching && styles.chipActive]}
            >
              <Text style={[styles.chipText, selectedTopic === topic && !searching && styles.chipTextActive]}>
                {topic}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Custom input */}
      <View
        style={styles.customSection}
        onLayout={(e) => { inputLayoutY.current = e.nativeEvent.layout.y; }}
      >
        <Text style={styles.sectionLabel}>Or describe any topic</Text>
        <TextInput
          style={styles.customInput}
          placeholder="e.g. treatment of animals in Islam…"
          placeholderTextColor={COLORS.textMuted}
          value={customTopic}
          onChangeText={setCustomTopic}
          multiline
          returnKeyType="search"
          onSubmitEditing={handleCustomSearch}
          onFocus={() => {
            setTimeout(() => {
              scrollRef.current?.scrollTo({ y: inputLayoutY.current - 20, animated: true });
            }, 200);
          }}
        />
        <Pressable
          onPressIn={() => { if (customTopic.trim() && !searching) setExplorePressed(true); }}
          onPressOut={() => setExplorePressed(false)}
          onPress={handleCustomSearch}
          disabled={searching || !customTopic.trim()}
          style={[
            styles.searchBtn,
            (!customTopic.trim() || searching)
              ? styles.searchBtnDisabled
              : [DEPTH.button, explorePressed && DEPTH.buttonPressed],
          ]}
        >
          <Text style={styles.searchBtnText}>Explore</Text>
        </Pressable>
      </View>

      {/* Loading */}
      {searching && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Generating dawah insights…</Text>
        </View>
      )}

      {/* Results */}
      {hasResults && (
        <>
          {/* Related ayahs */}
          {ayahs.length > 0 && (
            <View style={styles.resultSection}>
              <Text style={styles.resultTitle}>Related Ayahs ({ayahs.length})</Text>
              {ayahs.map((ayah, i) => (
                <View key={i} style={styles.ayahCard}>
                  <View style={styles.ayahHeader}>
                    <BookOpen size={13} color={COLORS.primary} />
                    <Text style={styles.ayahRef}>{ayah.verseKey}</Text>
                  </View>
                  {!!ayah.arabic && (
                    <Text style={styles.ayahArabic}>{ayah.arabic}</Text>
                  )}
                  <Text style={styles.ayahTranslation}>"{ayah.translation}"</Text>
                </View>
              ))}
            </View>
          )}

          {/* What Quran says */}
          {!!quranView && (
            <View style={styles.resultCard}>
              <Text style={styles.resultCardTitle}>What Quran Says about "{selectedTopic}"</Text>
              <Text style={styles.resultCardBody}>{quranView}</Text>
            </View>
          )}

          {/* Other scriptures */}
          {scriptures.length > 0 && (
            <View style={styles.resultCard}>
              <Text style={styles.resultCardTitle}>What Other Scriptures Say</Text>
              <View style={styles.scriptureList}>
                {scriptures.map((entry, i) => (
                  <View key={i} style={styles.scriptureEntry}>
                    <Text style={styles.scriptureName}>{entry.scriptureName}</Text>
                    <Text style={styles.scriptureQuote}>"{entry.quote}"</Text>
                    <Text style={styles.scriptureRef}>{entry.reference}</Text>
                    <Text style={styles.scriptureExplanation}>{entry.explanation}</Text>
                    <Pressable style={styles.shareBtn} onPress={() => handleShare(entry)}>
                      <Share2 size={13} color={COLORS.white} />
                      <Text style={styles.shareBtnText}>Share</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Ummah reasoning */}
          {!!ummahReasoning && (
            <View style={styles.ummahCard}>
              <Text style={styles.ummahTitle}>Why Quranic Reasoning is Stronger for the Ummah</Text>
              <Text style={styles.ummahBody}>{ummahReasoning}</Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 60, gap: 16 },

  heading: { color: COLORS.text, fontSize: 20, fontWeight: '800' },
  sub: { color: COLORS.textSub, fontSize: 13, marginTop: -8 },

  topicSection: { gap: 8 },
  sectionLabel: { color: COLORS.textSub, fontSize: 12, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.card,
    borderWidth: 1.5, borderColor: COLORS.cardBorder,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.textSub, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: COLORS.white },

  customSection: { gap: 8 },
  customInput: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5, borderColor: COLORS.cardBorder,
    paddingHorizontal: 14, paddingVertical: 12,
    color: COLORS.text, fontSize: 14,
    minHeight: 70, textAlignVertical: 'top',
    ...SHADOW.card,
  },
  searchBtn: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: RADIUS.xl,
    ...SHADOW.glow(COLORS.primary),
  },
  searchBtnDisabled: { opacity: 0.38 },
  searchBtnText: { color: COLORS.white, fontSize: 14, fontWeight: '700' },

  loadingWrap: { alignItems: 'center', paddingVertical: 32, gap: 12 },
  loadingText: { color: COLORS.textMuted, fontSize: 14 },

  resultSection: { gap: 8 },
  resultTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  ayahCard: {
    backgroundColor: COLORS.primaryBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: `${COLORS.primary}33`,
    padding: 12, gap: 6,
  },
  ayahHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ayahRef: { color: COLORS.primary, fontSize: 12, fontWeight: '700' },
  ayahArabic: {
    color: COLORS.text,
    fontSize: 17,
    lineHeight: 28,
    textAlign: 'right',
    fontWeight: '600',
    marginBottom: 6,
    writingDirection: 'rtl',
  },
  ayahTranslation: { color: COLORS.textSub, fontSize: 13, lineHeight: 20, fontStyle: 'italic' },

  resultCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5, borderColor: COLORS.cardBorder,
    padding: 16, gap: 10,
    ...SHADOW.card,
  },
  resultCardTitle: { color: COLORS.primary, fontSize: 14, fontWeight: '800' },
  resultCardBody: { color: COLORS.textSub, fontSize: 14, lineHeight: 22 },

  scriptureList: { gap: 12 },
  scriptureEntry: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    padding: 12, gap: 5,
  },
  scriptureName: { color: COLORS.primary, fontSize: 13, fontWeight: '700' },
  scriptureQuote: { color: COLORS.text, fontSize: 13, fontStyle: 'italic', lineHeight: 20 },
  scriptureRef: { color: COLORS.accent, fontSize: 11, fontWeight: '600' },
  scriptureExplanation: { color: COLORS.textSub, fontSize: 12, lineHeight: 18 },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-end', marginTop: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  shareBtnText: { color: COLORS.white, fontSize: 12, fontWeight: '600' },

  ummahCard: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    padding: 16, gap: 10,
    ...SHADOW.glow(COLORS.primary),
  },
  ummahTitle: { color: COLORS.white, fontSize: 14, fontWeight: '800' },
  ummahBody: { color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 22 },
});
