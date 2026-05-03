import { Audio } from 'expo-av';
import { BookOpen, ChevronRight, Pause, Play, ScrollText, Search } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, FlatList, Pressable,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE } from '../services/api';
import { COLORS, RADIUS, SHADOW } from '../theme';

// Route through the same Vercel proxy as the web app (QF Content API + public fallback)
function qfProxy(path: string, params: Record<string, string> = {}): string {
  const p = new URLSearchParams({ path, ...params });
  return `${API_BASE}/api/quran?${p.toString()}`;
}

interface Chapter {
  id: number;
  name_simple: string;
  name_arabic: string;
  verses_count: number;
  translated_name: { name: string };
}

interface Ayah {
  verseKey: string;
  verseNumber: number;
  arabic: string;
  transliteration: string;
  translation: string;
  tafsir: string;
}

function pad3(n: number) { return String(n).padStart(3, '0'); }

function stripHtml(html: string) {
  return html.replace(/<sup[^>]*>.*?<\/sup>/gi, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

export default function QuranScreen() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [filtered, setFiltered] = useState<Chapter[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loadingAyahs, setLoadingAyahs] = useState(false);
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    fetch(qfProxy('chapters'))
      .then((r) => r.json())
      .then((d) => { setChapters(d.chapters); setFiltered(d.chapters); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = query.toLowerCase();
    setFiltered(chapters.filter(
      (c) =>
        c.name_simple.toLowerCase().includes(q) ||
        c.name_arabic.includes(query) ||
        c.translated_name.name.toLowerCase().includes(q) ||
        String(c.id).includes(query)
    ));
  }, [query, chapters]);

  const openChapter = async (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setLoadingAyahs(true);
    setAyahs([]);
    try {
      const [verseRes, tafsirRes] = await Promise.all([
        fetch(qfProxy(`verses/by_chapter/${chapter.id}`, {
          fields: 'text_uthmani',
          translations: '57,20',
          per_page: '300',
        })),
        fetch(qfProxy(`tafsirs/169/by_chapter/${chapter.id}`, { per_page: '300' })),
      ]);
      const [verseData, tafsirData] = await Promise.all([
        verseRes.json(),
        tafsirRes.json(),
      ]);

      const verses: any[] = verseData?.verses ?? [];
      const tafsirList: any[] = tafsirData?.tafsirs ?? [];

      // Build tafsir lookup by verse_key
      const tafsirMap: Record<string, string> = {};
      for (const t of tafsirList) {
        tafsirMap[t.verse_key] = stripHtml(t.text ?? '');
      }

      const merged: Ayah[] = verses.map((v: any) => ({
        verseKey: v.verse_key as string,
        verseNumber: v.verse_number as number,
        arabic: v.text_uthmani as string,
        // resource_id 57 = transliteration, 20 = Saheeh International English
        transliteration: v.translations?.find((t: any) => t.resource_id === 57)?.text ?? '',
        translation: stripHtml(v.translations?.find((t: any) => t.resource_id === 20)?.text ?? ''),
        tafsir: tafsirMap[v.verse_key] ?? '',
      }));

      setAyahs(merged);
    } catch {}
    setLoadingAyahs(false);
  };

  const playAyah = async (verseKey: string) => {
    if (soundRef.current) {
      await soundRef.current.stopAsync().catch(() => {});
      await soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
    if (playingKey === verseKey) { setPlayingKey(null); return; }
    setPlayingKey(verseKey);
    try {
      const [s, a] = verseKey.split(':').map(Number);
      const uri = `https://everyayah.com/data/Alafasy_128kbps/${pad3(s)}${pad3(a)}.mp3`;
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((st) => {
        if (st.isLoaded && st.didJustFinish) {
          setPlayingKey(null);
          sound.unloadAsync();
          soundRef.current = null;
        }
      });
    } catch { setPlayingKey(null); }
  };

  useEffect(() => {
    return () => { soundRef.current?.unloadAsync().catch(() => {}); };
  }, []);

  if (selectedChapter) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.surahHeader}>
          <Pressable
            onPress={() => { setSelectedChapter(null); setPlayingKey(null); soundRef.current?.unloadAsync(); }}
            style={styles.backBtn}
          >
            <ChevronRight size={20} color={COLORS.primary} style={{ transform: [{ rotate: '180deg' }] }} />
          </Pressable>
          <View style={styles.surahHeaderText}>
            <Text style={styles.surahHeaderName}>{selectedChapter.name_simple}</Text>
            <Text style={styles.surahHeaderAr}>{selectedChapter.name_arabic}</Text>
          </View>
          <Text style={styles.surahHeaderMeta}>{selectedChapter.verses_count} ayahs</Text>
        </View>

        {loadingAyahs ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={COLORS.primary} size="large" />
            <Text style={styles.loadingText}>Loading surah…</Text>
          </View>
        ) : (
          <FlatList
            data={ayahs}
            keyExtractor={(a) => a.verseKey}
            contentContainerStyle={styles.ayahList}
            renderItem={({ item }) => (
              <AyahCard
                ayah={item}
                isPlaying={playingKey === item.verseKey}
                onPlay={() => playAyah(item.verseKey)}
              />
            )}
          />
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Quran</Text>
        <Text style={styles.sub}>114 Surahs</Text>
      </View>
      <View style={styles.searchBar}>
        <Search size={16} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search surah name or number…"
          placeholderTextColor={COLORS.textMuted}
          value={query}
          onChangeText={setQuery}
        />
      </View>
      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(c) => String(c.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable style={styles.surahRow} onPress={() => openChapter(item)}>
              <View style={styles.surahNum}>
                <Text style={styles.surahNumText}>{item.id}</Text>
              </View>
              <View style={styles.surahInfo}>
                <Text style={styles.surahName}>{item.name_simple}</Text>
                <Text style={styles.surahMeaning}>{item.translated_name.name}</Text>
              </View>
              <View style={styles.surahRight}>
                <Text style={styles.surahAr}>{item.name_arabic}</Text>
                <Text style={styles.surahCount}>{item.verses_count} ayahs</Text>
              </View>
              <ChevronRight size={16} color={COLORS.textMuted} />
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function AyahCard({ ayah, isPlaying, onPlay }: {
  ayah: Ayah; isPlaying: boolean; onPlay: () => void;
}) {
  const [tafsirOpen, setTafsirOpen] = useState(false);
  const [meaningOpen, setMeaningOpen] = useState(false);

  return (
    <View style={styles.ayahCard}>
      {/* Top row: play (left) + number (right) */}
      <View style={styles.ayahTopRow}>
        <Pressable
          onPress={onPlay}
          style={[styles.playAyahBtn, isPlaying && styles.playAyahBtnActive]}
        >
          {isPlaying
            ? <Pause size={15} color={COLORS.white} fill={COLORS.white} />
            : <Play size={15} color={COLORS.primary} fill={COLORS.primary} />}
        </Pressable>
        <View style={styles.ayahNumBadge}>
          <Text style={styles.ayahNum}>{ayah.verseNumber}</Text>
        </View>
      </View>

      {/* Arabic */}
      <Text style={styles.ayahArabic}>{ayah.arabic}</Text>

      {/* English pronunciation */}
      {!!ayah.transliteration && (
        <Text style={styles.ayahTranslit}>{ayah.transliteration}</Text>
      )}

      {/* Translation — hidden until "Meaning" pressed */}
      {meaningOpen && !!ayah.translation && (
        <View style={styles.meaningBox}>
          <Text style={styles.meaningText}>"{ayah.translation}"</Text>
        </View>
      )}

      {/* Action row */}
      <View style={styles.ayahActions}>
        {!!ayah.translation && (
          <Pressable
            onPress={() => setMeaningOpen((v) => !v)}
            style={[styles.actionBtn, meaningOpen && styles.actionBtnActive]}
          >
            <BookOpen size={13} color={meaningOpen ? COLORS.primary : COLORS.textMuted} />
            <Text style={[styles.actionBtnText, meaningOpen && styles.actionBtnTextActive]}>
              Meaning {meaningOpen ? '▲' : '▼'}
            </Text>
          </Pressable>
        )}

        {!!ayah.tafsir && (
          <Pressable
            onPress={() => setTafsirOpen((v) => !v)}
            style={[styles.actionBtn, tafsirOpen && styles.actionBtnActive]}
          >
            <ScrollText size={13} color={tafsirOpen ? COLORS.primary : COLORS.textMuted} />
            <Text style={[styles.actionBtnText, tafsirOpen && styles.actionBtnTextActive]}>
              Tafsir {tafsirOpen ? '▲' : '▼'}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Ibn Kathir Tafsir — expandable */}
      {tafsirOpen && !!ayah.tafsir && (
        <View style={styles.tafsirBox}>
          <Text style={styles.tafsirLabel}>📖 Ibn Kathir Tafsir</Text>
          <Text style={styles.tafsirText}>{ayah.tafsir}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  title: { color: COLORS.text, fontSize: 26, fontWeight: '800' },
  sub: { color: COLORS.textSub, fontSize: 13 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginVertical: 12,
    backgroundColor: COLORS.card, borderRadius: RADIUS.full,
    borderWidth: 1.5, borderColor: COLORS.cardBorder,
    paddingHorizontal: 16, paddingVertical: 10, ...SHADOW.card,
  },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 14 },
  list: { paddingHorizontal: 16, gap: 8, paddingBottom: 100 },
  surahRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.card, borderRadius: RADIUS.xl,
    borderWidth: 1.5, borderColor: COLORS.cardBorder,
    padding: 14, ...SHADOW.card,
  },
  surahNum: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.primaryBg,
    alignItems: 'center', justifyContent: 'center',
  },
  surahNumText: { color: COLORS.primary, fontSize: 13, fontWeight: '800' },
  surahInfo: { flex: 1 },
  surahName: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  surahMeaning: { color: COLORS.textSub, fontSize: 12, marginTop: 1 },
  surahRight: { alignItems: 'flex-end', gap: 2 },
  surahAr: { color: COLORS.primary, fontSize: 16, fontWeight: '700' },
  surahCount: { color: COLORS.textMuted, fontSize: 11 },

  surahHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder,
  },
  backBtn: { padding: 4 },
  surahHeaderText: { flex: 1 },
  surahHeaderName: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  surahHeaderAr: { color: COLORS.primary, fontSize: 14 },
  surahHeaderMeta: { color: COLORS.textMuted, fontSize: 12 },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: COLORS.textMuted, fontSize: 14 },

  ayahList: { padding: 16, gap: 14, paddingBottom: 100 },
  ayahCard: {
    borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    padding: 16, gap: 10,
    backgroundColor: COLORS.card,
    ...SHADOW.card,
  },

  ayahTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ayahNumBadge: {
    backgroundColor: COLORS.primaryBg, width: 30, height: 30,
    borderRadius: 15, alignItems: 'center', justifyContent: 'center',
  },
  ayahNum: { color: COLORS.primary, fontSize: 12, fontWeight: '800' },
  ayahArabic: {
    color: COLORS.text, fontSize: 24, textAlign: 'right',
    lineHeight: 44, writingDirection: 'rtl',
  },
  ayahTranslit: {
    color: COLORS.textMuted, fontSize: 12, fontStyle: 'italic',
    textAlign: 'center', lineHeight: 18,
  },

  meaningBox: {
    backgroundColor: `${COLORS.primary}0A`,
    borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: `${COLORS.primary}22`,
    padding: 10,
  },
  meaningText: { color: COLORS.textSub, fontSize: 13, lineHeight: 20, fontStyle: 'italic' },

  ayahActions: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', paddingTop: 2 },
  playAyahBtn: {
    backgroundColor: COLORS.primaryBg, borderRadius: RADIUS.full,
    padding: 9, borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  playAyahBtnActive: { backgroundColor: COLORS.primary },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 11, paddingVertical: 7,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceDark,
    borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  actionBtnActive: { backgroundColor: COLORS.primaryBg, borderColor: COLORS.primary },
  actionBtnText: { color: COLORS.textMuted, fontSize: 12, fontWeight: '600' },
  actionBtnTextActive: { color: COLORS.primary },

  tafsirBox: {
    backgroundColor: COLORS.primaryBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: `${COLORS.primary}33`,
    padding: 12, gap: 6,
  },
  tafsirLabel: { color: COLORS.primary, fontSize: 11, fontWeight: '700' },
  tafsirText: { color: COLORS.textSub, fontSize: 12, lineHeight: 19 },
});
