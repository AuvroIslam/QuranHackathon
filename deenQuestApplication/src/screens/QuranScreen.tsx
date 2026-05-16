import { Audio } from 'expo-av';
import { BookOpen, BookmarkCheck, Bookmark, ChevronRight, Loader, Pause, Play, ScrollText, Search } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, FlatList, Pressable,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { toggleBookmark, getBookmarks } from '../lib/firestore';
import { API_BASE } from '../services/api';
import { RADIUS, SHADOW, type AppColors } from '../theme';
import BookmarkCollectionModal from '../components/BookmarkCollectionModal';

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
  const { uid } = useAuth();
  const { colors, translationId } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [filtered, setFiltered] = useState<Chapter[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loadingAyahs, setLoadingAyahs] = useState(false);
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [bookmarkedKeys, setBookmarkedKeys] = useState<Set<string>>(new Set());
  const [bmModalVerse, setBmModalVerse] = useState<{
    verseKey: string; surahName: string; arabic: string; translation: string;
  } | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const ayahsRef = useRef<Ayah[]>([]);

  // Keep ref in sync so auto-advance closure always sees latest list
  useEffect(() => { ayahsRef.current = ayahs; }, [ayahs]);

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

  useEffect(() => {
    return () => { soundRef.current?.unloadAsync().catch(() => {}); };
  }, []);

  const stopAudio = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync().catch(() => {});
      await soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
    setPlayingKey(null);
    setIsPlaying(false);
    setLoadingKey(null);
  };

  const playVerseByKey = async (verseKey: string) => {
    if (soundRef.current) {
      await soundRef.current.stopAsync().catch(() => {});
      await soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
    setPlayingKey(verseKey);
    setIsPlaying(true);
    setLoadingKey(verseKey);
    try {
      const [s, a] = verseKey.split(':').map(Number);
      const uri = `https://everyayah.com/data/Alafasy_128kbps/${pad3(s)}${pad3(a)}.mp3`;
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
      soundRef.current = sound;
      setLoadingKey(null);
      sound.setOnPlaybackStatusUpdate((st) => {
        if (!st.isLoaded) return;
        if (st.didJustFinish) {
          sound.unloadAsync();
          soundRef.current = null;
          const all = ayahsRef.current;
          const idx = all.findIndex((v) => v.verseKey === verseKey);
          if (idx >= 0 && idx < all.length - 1) {
            playVerseByKey(all[idx + 1].verseKey);
          } else {
            setPlayingKey(null);
            setIsPlaying(false);
          }
        }
      });
    } catch {
      setPlayingKey(null);
      setIsPlaying(false);
      setLoadingKey(null);
    }
  };

  const handleVersePlay = async (verseKey: string) => {
    if (playingKey === verseKey) {
      if (isPlaying) {
        await soundRef.current?.pauseAsync().catch(() => {});
        setIsPlaying(false);
      } else {
        await soundRef.current?.playAsync().catch(() => {});
        setIsPlaying(true);
      }
      return;
    }
    await playVerseByKey(verseKey);
  };

  const handleGlobalPlayPause = async () => {
    if (!ayahs.length || loadingAyahs) return;
    if (playingKey && soundRef.current) {
      if (isPlaying) {
        await soundRef.current.pauseAsync().catch(() => {});
        setIsPlaying(false);
      } else {
        await soundRef.current.playAsync().catch(() => {});
        setIsPlaying(true);
      }
      return;
    }
    await playVerseByKey(ayahs[0].verseKey);
  };

  const openChapter = async (chapter: Chapter) => {
    await stopAudio();
    setSelectedChapter(chapter);
    setLoadingAyahs(true);
    setAyahs([]);
    // Load bookmarks for this chapter
    if (uid) {
      getBookmarks(uid).then((bms) => {
        setBookmarkedKeys(new Set(bms.map((b) => b.verseKey)));
      }).catch(() => {});
    }
    try {
      const [verseRes, tafsirRes] = await Promise.all([
        fetch(qfProxy(`verses/by_chapter/${chapter.id}`, {
          fields: 'text_uthmani',
          translations: `57,${translationId}`,
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

      const tafsirMap: Record<string, string> = {};
      for (const t of tafsirList) {
        tafsirMap[t.verse_key] = stripHtml(t.text ?? '');
      }

      const merged: Ayah[] = verses.map((v: any) => ({
        verseKey: v.verse_key as string,
        verseNumber: v.verse_number as number,
        arabic: v.text_uthmani as string,
        transliteration: v.translations?.find((t: any) => t.resource_id === 57)?.text ?? '',
        translation: stripHtml(v.translations?.find((t: any) => t.resource_id === translationId)?.text ?? ''),
        tafsir: tafsirMap[v.verse_key] ?? '',
      }));

      setAyahs(merged);
    } catch {}
    setLoadingAyahs(false);
  };

  if (selectedChapter) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.surahHeader}>
          <Pressable
            onPress={() => { stopAudio(); setSelectedChapter(null); }}
            style={styles.backBtn}
          >
            <ChevronRight size={20} color={colors.primary} style={{ transform: [{ rotate: '180deg' }] }} />
          </Pressable>
          <View style={styles.surahHeaderText}>
            <Text style={styles.surahHeaderName}>{selectedChapter.name_simple}</Text>
            <Text style={styles.surahHeaderAr}>{selectedChapter.name_arabic}</Text>
          </View>
          <Pressable
            onPress={handleGlobalPlayPause}
            disabled={loadingAyahs}
            style={[styles.globalPlayBtn, isPlaying && styles.globalPlayBtnActive]}
          >
            {loadingKey ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : isPlaying ? (
              <Pause size={17} color={colors.white} strokeWidth={1.75} />
            ) : (
              <Play size={17} color={isPlaying ? colors.white : colors.primary} strokeWidth={1.75} />
            )}
          </Pressable>
        </View>

        {loadingAyahs ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.primary} size="large" />
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
                isSelected={playingKey === item.verseKey}
                isPlaying={playingKey === item.verseKey && isPlaying}
                isLoading={loadingKey === item.verseKey}
                isBookmarked={bookmarkedKeys.has(item.verseKey)}
                onPlay={() => handleVersePlay(item.verseKey)}
                onBookmark={async () => {
                  if (!uid || !selectedChapter) return;
                  const vk = item.verseKey;
                  if (bookmarkedKeys.has(vk)) {
                    // Remove directly
                    setBookmarkedKeys((prev) => { const s = new Set(prev); s.delete(vk); return s; });
                    try {
                      await toggleBookmark(uid, {
                        verseKey: vk,
                        surahName: selectedChapter.name_simple,
                        arabic: item.arabic,
                        translation: item.translation,
                      });
                    } catch {
                      setBookmarkedKeys((prev) => { const s = new Set(prev); s.add(vk); return s; });
                    }
                  } else {
                    // Open collection modal
                    setBmModalVerse({
                      verseKey: vk,
                      surahName: selectedChapter.name_simple,
                      arabic: item.arabic,
                      translation: item.translation,
                    });
                  }
                }}
              />
            )}
          />
        )}

        {bmModalVerse && uid && (
          <BookmarkCollectionModal
            uid={uid}
            verseKey={bmModalVerse.verseKey}
            surahName={bmModalVerse.surahName}
            arabic={bmModalVerse.arabic}
            translation={bmModalVerse.translation}
            onClose={() => setBmModalVerse(null)}
            onSaved={() => {
              const vk = bmModalVerse.verseKey;
              setBookmarkedKeys((prev) => { const s = new Set(prev); s.add(vk); return s; });
              setBmModalVerse(null);
            }}
          />
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Quran</Text>
        <Text style={styles.sub}>114 Surahs</Text>
      </View>
      <View style={styles.searchBar}>
        <Search size={16} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search surah name or number…"
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
        />
      </View>
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
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
              <ChevronRight size={16} color={colors.textMuted} />
            </Pressable>
          )}
        />
      )}

    </SafeAreaView>
  );
}

function AyahCard({ ayah, isSelected, isPlaying, isLoading, isBookmarked, onPlay, onBookmark }: {
  ayah: Ayah; isSelected: boolean; isPlaying: boolean; isLoading: boolean;
  isBookmarked?: boolean; onPlay: () => void; onBookmark?: () => void;
}) {
  const [tafsirOpen, setTafsirOpen] = useState(false);
  const [meaningOpen, setMeaningOpen] = useState(false);
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={[styles.ayahCard, isSelected && styles.ayahCardActive]}>
      <View style={styles.ayahTopRow}>
        <Pressable
          onPress={onPlay}
          style={[styles.playAyahBtn, isPlaying && styles.playAyahBtnActive]}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : isPlaying ? (
            <Pause size={20} color={colors.white} strokeWidth={1.75} />
          ) : (
            <Play size={20} color={isSelected ? colors.primary : colors.primary} strokeWidth={1.75} />
          )}
        </Pressable>
        <View style={[styles.ayahNumBadge, isSelected && styles.ayahNumBadgeActive]}>
          <Text style={[styles.ayahNum, isSelected && styles.ayahNumActive]}>{ayah.verseNumber}</Text>
        </View>
      </View>

      <Text style={styles.ayahArabic}>{ayah.arabic}</Text>

      {!!ayah.transliteration && (
        <Text style={styles.ayahTranslit}>{ayah.transliteration}</Text>
      )}

      {meaningOpen && !!ayah.translation && (
        <View style={styles.meaningBox}>
          <Text style={styles.meaningText}>"{ayah.translation}"</Text>
        </View>
      )}

      <View style={styles.ayahActions}>
        {!!ayah.translation && (
          <Pressable
            onPress={() => setMeaningOpen((v) => !v)}
            style={styles.actionBtn}
          >
            <BookOpen size={11} color={meaningOpen ? colors.primary : colors.textMuted} />
            <Text style={[styles.actionBtnText, meaningOpen && styles.actionBtnTextActive]}>
              Meaning
            </Text>
          </Pressable>
        )}

        {!!ayah.tafsir && (
          <Pressable
            onPress={() => setTafsirOpen((v) => !v)}
            style={styles.actionBtn}
          >
            <ScrollText size={11} color={tafsirOpen ? colors.primary : colors.textMuted} />
            <Text style={[styles.actionBtnText, tafsirOpen && styles.actionBtnTextActive]}>
              Tafsir
            </Text>
          </Pressable>
        )}

        {onBookmark && (
          <Pressable
            onPress={onBookmark}
            style={styles.actionBtn}
          >
            {isBookmarked
              ? <BookmarkCheck size={11} color={colors.primary} />
              : <Bookmark size={11} color={colors.textMuted} />}
            <Text style={[styles.actionBtnText, isBookmarked && styles.actionBtnTextActive]}>
              {isBookmarked ? 'Saved' : 'Save'}
            </Text>
          </Pressable>
        )}
      </View>

      {tafsirOpen && !!ayah.tafsir && (
        <View style={styles.tafsirBox}>
          <Text style={styles.tafsirLabel}>📖 Ibn Kathir Tafsir</Text>
          <Text style={styles.tafsirText}>{ayah.tafsir}</Text>
        </View>
      )}
    </View>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
    title: { color: colors.text, fontSize: 26, fontWeight: '800' },
    sub: { color: colors.textSub, fontSize: 13 },
    searchBar: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      marginHorizontal: 16, marginVertical: 12,
      backgroundColor: colors.card, borderRadius: RADIUS.full,
      borderWidth: 1.5, borderColor: colors.cardBorder,
      paddingHorizontal: 16, paddingVertical: 10, ...SHADOW.card,
    },
    searchInput: { flex: 1, color: colors.text, fontSize: 14 },
    list: { paddingHorizontal: 16, gap: 8, paddingBottom: 100 },
    surahRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: colors.card, borderRadius: RADIUS.xl,
      borderWidth: 1.5, borderColor: colors.cardBorder,
      padding: 14, ...SHADOW.card,
    },
    surahNum: {
      width: 38, height: 38, borderRadius: 19,
      backgroundColor: colors.primaryBg,
      alignItems: 'center', justifyContent: 'center',
    },
    surahNumText: { color: colors.primary, fontSize: 13, fontWeight: '800' },
    surahInfo: { flex: 1 },
    surahName: { color: colors.text, fontSize: 15, fontWeight: '700' },
    surahMeaning: { color: colors.textSub, fontSize: 12, marginTop: 1 },
    surahRight: { alignItems: 'flex-end', gap: 2 },
    surahAr: { color: colors.textSub, fontSize: 18, fontWeight: '700', textAlign: 'right' },
    surahCount: { color: colors.textMuted, fontSize: 11 },

    surahHeader: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingHorizontal: 16, paddingVertical: 12,
      backgroundColor: colors.card,
      borderBottomWidth: 1, borderBottomColor: colors.cardBorder,
    },
    backBtn: { padding: 4 },
    surahHeaderText: { flex: 1 },
    surahHeaderName: { color: colors.text, fontSize: 18, fontWeight: '800' },
    surahHeaderAr: { color: colors.primary, fontSize: 14 },

    globalPlayBtn: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: colors.primaryBg,
      borderWidth: 1.5, borderColor: colors.cardBorder,
      alignItems: 'center', justifyContent: 'center',
      ...SHADOW.card,
    },
    globalPlayBtnActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },

    loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    loadingText: { color: colors.textMuted, fontSize: 14 },

    ayahList: { padding: 16, gap: 14, paddingBottom: 100 },
    ayahCard: {
      borderRadius: RADIUS.xl,
      borderWidth: 1, borderColor: colors.cardBorder,
      padding: 16, gap: 10,
      backgroundColor: colors.card,
      ...SHADOW.card,
    },
    ayahCardActive: {
      borderColor: `${colors.primary}55`,
      backgroundColor: colors.primaryBg,
    },

    ayahTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    ayahNumBadge: {
      backgroundColor: colors.primaryBg, width: 30, height: 30,
      borderRadius: 15, alignItems: 'center', justifyContent: 'center',
    },
    ayahNumBadgeActive: { backgroundColor: colors.primary },
    ayahNum: { color: colors.primary, fontSize: 12, fontWeight: '800' },
    ayahNumActive: { color: colors.white },
    ayahArabic: {
      color: colors.text, fontSize: 24, textAlign: 'right',
      lineHeight: 44, writingDirection: 'rtl',
    },
    ayahTranslit: {
      color: colors.textMuted, fontSize: 12, fontStyle: 'italic',
      textAlign: 'center', lineHeight: 18,
    },

    meaningBox: {
      backgroundColor: `${colors.primary}0A`,
      borderRadius: RADIUS.lg,
      borderWidth: 1, borderColor: `${colors.primary}22`,
      padding: 10,
    },
    meaningText: { color: colors.textSub, fontSize: 13, lineHeight: 20, fontStyle: 'italic' },

    ayahActions: {
      flexDirection: 'row', alignItems: 'center', gap: 14, flexWrap: 'wrap',
      marginTop: 8, paddingTop: 8,
      borderTopWidth: 0.5, borderTopColor: colors.cardBorder,
    },
    playAyahBtn: {
      backgroundColor: colors.primaryBg, borderRadius: RADIUS.full,
      padding: 9, borderWidth: 1, borderColor: colors.cardBorder,
    },
    playAyahBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    actionBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingVertical: 2,
    },
    actionBtnActive: {},
    actionBtnText: { color: colors.textMuted, fontSize: 11, fontWeight: '400' },
    actionBtnTextActive: { color: colors.primary },

    tafsirBox: {
      backgroundColor: colors.primaryBg,
      borderRadius: RADIUS.lg,
      borderWidth: 1, borderColor: `${colors.primary}33`,
      padding: 12, gap: 6,
    },
    tafsirLabel: { color: colors.primary, fontSize: 11, fontWeight: '700' },
    tafsirText: { color: colors.textSub, fontSize: 12, lineHeight: 19 },
  });
}
