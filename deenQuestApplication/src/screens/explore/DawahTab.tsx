import { BookOpen, Share2 } from 'lucide-react-native';
import React, { useMemo, useRef, useState } from 'react';
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
import { useTheme } from '../../context/ThemeContext';
import { triggerHaptic } from '../../lib/haptics';
import { DEPTH, RADIUS, SHADOW } from '../../theme';

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
  verseKeys: string[];
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
    verseKeys: [],
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
    if (qv) return { verseKeys: [], quranView: qv, scriptures: [], ummahReasoning: ur ?? fallback.ummahReasoning };
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
      const parsedKeys: string[] = Array.isArray(parsed?.verseKeys)
        ? parsed.verseKeys.filter((k: unknown) => typeof k === 'string' && /^\d+:\d+$/.test(k))
        : [];
      return {
        verseKeys: parsedKeys,
        quranView: parsed.quranView.trim(),
        scriptures: parsedScriptures,
        ummahReasoning: parsed.ummahReasoning.trim(),
      };
    }
  } catch {
    // JSON.parse failed — try regex field extraction on the raw candidate
    const qv = extractStringField(candidate, 'quranView');
    const ur = extractStringField(candidate, 'ummahReasoning');
    if (qv) return { verseKeys: [], quranView: qv, scriptures: [], ummahReasoning: ur ?? fallback.ummahReasoning };
  }
  return fallback;
}

async function fetchVerseByKey(key: string): Promise<{ verseKey: string; arabic: string; translation: string } | null> {
  try {
    const params = new URLSearchParams({ path: `verses/by_key/${key}`, translations: '20', fields: 'text_uthmani,verse_key' });
    const res = await fetch(`${API_BASE}/api/quran?${params.toString()}`);
    if (!res.ok) return null;
    const data = await res.json();
    const verse = data?.verse;
    if (!verse) return null;
    return {
      verseKey: verse.verse_key ?? key,
      arabic: verse.text_uthmani ?? '',
      translation: stripHtml(verse.translations?.[0]?.text ?? ''),
    };
  } catch {
    return null;
  }
}

async function fetchVersesByKeys(keys: string[]): Promise<{ verseKey: string; arabic: string; translation: string }[]> {
  const valid = keys.filter((k) => /^\d+:\d+$/.test(k)).slice(0, 5);
  if (valid.length === 0) return [];
  const settled = await Promise.allSettled(valid.map(fetchVerseByKey));
  return settled
    .filter((r): r is PromiseFulfilledResult<{ verseKey: string; arabic: string; translation: string }> =>
      r.status === 'fulfilled' && r.value !== null)
    .map((r) => r.value);
}

export default function DawahTab() {
  const { colors, hapticsEnabled } = useTheme();
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

  interface DawahCacheEntry {
    ayahs: any[];
    quranView: string;
    scriptures: ScriptureEntry[];
    ummahReasoning: string;
  }
  const cacheRef = useRef<Map<string, DawahCacheEntry>>(new Map());

  const handleTopicSelect = async (topic: string) => {
    setSelectedTopic(topic);

    const cacheKey = topic.trim().toLowerCase();
    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      setAyahs(cached.ayahs);
      setQuranView(cached.quranView);
      setScriptures(cached.scriptures);
      setUmmahReasoning(cached.ummahReasoning);
      setSearching(false);
      return;
    }

    setSearching(true);
    setAyahs([]);
    setQuranView('');
    setScriptures([]);
    setUmmahReasoning('');

    try {
      const aiData = await fetch(`${API_BASE}/api/deepseek`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerMode: 'dawah',
          groundingQuery: topic,
          messages: [
            {
              role: 'user',
              content: `Topic: "${topic}"\n\nRespond with ONLY a raw JSON object. No markdown fences, no explanation outside the JSON.\n\nLimits per field:\n- verseKeys: array of 3-5 verse references (format "surah:ayah") most THEMATICALLY relevant to this topic — pick verses that directly address the concept, not just keyword matches\n- quranView: 2-3 sentences, max 500 chars, include 1-2 ayah refs\n- Each scripture quote: max 150 chars. If translation is uncertain, end with " (translation may vary)" — do NOT wrap the quote in single quotes\n- Each scripture explanation: 2-3 sentences, max 220 chars\n- ummahReasoning: 3-4 sentences, max 500 chars\n- Exactly 3 scriptures: Bible, Bhagavad Gita, Torah\n\nShape:\n{"verseKeys":["2:62","60:8","49:13"],"quranView":"...","scriptures":[{"scriptureName":"...","quote":"...","reference":"...","explanation":"..."}],"ummahReasoning":"..."}\n\nCritical: every string must be a complete sentence. Never cut off mid-word or mid-sentence.`,
            },
          ],
          systemPrompt:
            'You are a respectful Islamic dawah educator. Always return only raw valid JSON — no markdown, no prose outside the JSON. Compare scriptures fairly, keep tone non-inflammatory, cite Quranic references accurately, and never use derogatory language about any faith.',
        }),
      })
        .then((r) => r.json())
        .catch(() => ({}));

      const sections = parseDawahSections(aiData?.content ?? '');

      // Use AI-selected verse keys (thematic match); fall back to QF keyword search
      let ayahList: { verseKey: string; arabic: string; translation: string }[] = [];
      if (sections.verseKeys.length > 0) {
        ayahList = await fetchVersesByKeys(sections.verseKeys);
      }
      if (ayahList.length === 0) {
        const searchParams = new URLSearchParams({ path: 'search', q: topic, size: '5', language: 'en' });
        const data = await fetch(`${API_BASE}/api/quran?${searchParams.toString()}`)
          .then((r) => (r.ok ? r.json() : {}))
          .catch(() => ({}));
        const results: any[] = (data as { search?: { results?: any[] } })?.search?.results ?? [];
        ayahList = results.map((r: any) => ({
          verseKey: r.verse_key,
          arabic: (r.text ?? '') as string,
          translation: stripHtml(r.translations?.[0]?.text ?? ''),
        }));
      }

      setAyahs(ayahList);
      setQuranView(sections.quranView);
      setScriptures(sections.scriptures);
      setUmmahReasoning(sections.ummahReasoning);

      cacheRef.current.set(cacheKey, {
        ayahs: ayahList,
        quranView: sections.quranView,
        scriptures: sections.scriptures,
        ummahReasoning: sections.ummahReasoning,
      });
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

  const styles = useMemo(() => StyleSheet.create({
    container: { padding: 16, paddingBottom: 60, gap: 16 },

    heading: { color: colors.text, fontSize: 20, fontWeight: '800' },
    sub: { color: colors.textSub, fontSize: 13, marginTop: -8 },

    topicSection: { gap: 8 },
    sectionLabel: { color: colors.textSub, fontSize: 12, fontWeight: '600' },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      paddingHorizontal: 14, paddingVertical: 7,
      borderRadius: RADIUS.full,
      backgroundColor: colors.card,
      borderWidth: 1.5, borderColor: colors.cardBorder,
    },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { color: colors.textSub, fontSize: 13, fontWeight: '600' },
    chipTextActive: { color: colors.white },

    customSection: { gap: 8 },
    customInput: {
      backgroundColor: colors.card,
      borderRadius: RADIUS.lg,
      borderWidth: 1.5, borderColor: colors.cardBorder,
      paddingHorizontal: 14, paddingVertical: 12,
      color: colors.text, fontSize: 14,
      minHeight: 70, textAlignVertical: 'top',
      ...SHADOW.card,
    },
    searchBtn: {
      alignSelf: 'flex-end',
      backgroundColor: colors.primary,
      paddingHorizontal: 28, paddingVertical: 14,
      borderRadius: RADIUS.xl,
      ...SHADOW.glow(colors.primary),
    },
    searchBtnDisabled: { opacity: 0.38 },
    searchBtnText: { color: colors.white, fontSize: 14, fontWeight: '700' },

    loadingWrap: { alignItems: 'center', paddingVertical: 32, gap: 12 },
    loadingText: { color: colors.textMuted, fontSize: 14 },

    resultSection: { gap: 8 },
    resultTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
    ayahCard: {
      backgroundColor: colors.primaryBg,
      borderRadius: RADIUS.lg,
      borderWidth: 1, borderColor: `${colors.primary}33`,
      padding: 12, gap: 6,
    },
    ayahHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    ayahRef: { color: colors.primary, fontSize: 12, fontWeight: '700' },
    ayahArabic: {
      color: colors.text,
      fontSize: 17,
      lineHeight: 28,
      textAlign: 'right',
      fontWeight: '600',
      marginBottom: 6,
      writingDirection: 'rtl',
    },
    ayahTranslation: { color: colors.textSub, fontSize: 13, lineHeight: 20, fontStyle: 'italic' },

    resultCard: {
      backgroundColor: colors.card,
      borderRadius: RADIUS.xl,
      borderWidth: 1.5, borderColor: colors.cardBorder,
      padding: 16, gap: 10,
      ...SHADOW.card,
    },
    resultCardTitle: { color: colors.primary, fontSize: 14, fontWeight: '800' },
    resultCardBody: { color: colors.textSub, fontSize: 14, lineHeight: 22 },

    scriptureList: { gap: 12 },
    scriptureEntry: {
      backgroundColor: colors.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1, borderColor: colors.cardBorder,
      padding: 12, gap: 5,
    },
    scriptureName: { color: colors.primary, fontSize: 13, fontWeight: '700' },
    scriptureQuote: { color: colors.text, fontSize: 13, fontStyle: 'italic', lineHeight: 20 },
    scriptureRef: { color: colors.accent, fontSize: 11, fontWeight: '600' },
    scriptureExplanation: { color: colors.textSub, fontSize: 12, lineHeight: 18 },
    shareBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      alignSelf: 'flex-end', marginTop: 4,
      backgroundColor: colors.primary,
      paddingHorizontal: 12, paddingVertical: 6,
      borderRadius: RADIUS.full,
    },
    shareBtnText: { color: colors.white, fontSize: 12, fontWeight: '600' },

    ummahCard: {
      backgroundColor: colors.primary,
      borderRadius: RADIUS.xl,
      padding: 16, gap: 10,
      ...SHADOW.glow(colors.primary),
    },
    ummahTitle: { color: colors.white, fontSize: 14, fontWeight: '800' },
    ummahBody: { color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 22 },
  }), [colors]);

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
              onPress={() => {
                if (searching) return;
                triggerHaptic(hapticsEnabled, 'light');
                setCustomTopic('');
                handleTopicSelect(topic);
              }}
              style={[styles.chip, selectedTopic === topic && styles.chipActive]}
            >
              <Text style={[styles.chipText, selectedTopic === topic && styles.chipTextActive]}>
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
          placeholderTextColor={colors.textMuted}
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
          onPress={() => { triggerHaptic(hapticsEnabled, 'medium'); handleCustomSearch(); }}
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
          <ActivityIndicator size="large" color={colors.primary} />
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
                    <BookOpen size={13} color={colors.primary} />
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
                    <Pressable style={styles.shareBtn} onPress={() => { triggerHaptic(hapticsEnabled, 'tick'); handleShare(entry); }}>
                      <Share2 size={13} color={colors.white} />
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
