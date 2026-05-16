import { Audio } from 'expo-av';
import { Bookmark, BookmarkCheck, Pause, Play } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { isBookmarked, toggleBookmark } from '../lib/firestore';
import { API_BASE } from '../services/api';
import { RADIUS, SHADOW } from '../theme';
import BookmarkCollectionModal from './BookmarkCollectionModal';

interface AyahData {
  numberInSurah: number;
  arabic: string;
  transliteration: string;
  translation: string;
  audioUrl: string;
  read: boolean;
}

interface Props {
  surahNumber: number;
  startAyah: number;
  ayahCount: number;
  onComplete: (nextSurah: number, nextAyah: number) => void;
}

function pad3(n: number) { return String(n).padStart(3, '0'); }

function stripHtml(html: string) {
  return html.replace(/<sup[^>]*>.*?<\/sup>/gi, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function qfProxy(path: string, params: Record<string, string> = {}): string {
  const p = new URLSearchParams({ path, ...params });
  return `${API_BASE}/api/quran?${p.toString()}`;
}

export default function QuranReadingSession({ surahNumber, startAyah, ayahCount, onComplete }: Props) {
  const { uid } = useAuth();
  const { colors, translationId } = useTheme();
  const [ayahs, setAyahs] = useState<AyahData[]>([]);
  const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({});
  const [bmLoading, setBmLoading] = useState<Record<string, boolean>>({});
  const [bmModalVerse, setBmModalVerse] = useState<{
    verseKey: string; arabic: string; translation: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [totalInSurah, setTotalInSurah] = useState(0);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const ayahsRef = useRef<AyahData[]>([]);

  useEffect(() => { ayahsRef.current = ayahs; }, [ayahs]);

  useEffect(() => {
    fetchAyahs();
    return () => { soundRef.current?.unloadAsync().catch(() => {}); };
  }, [surahNumber, startAyah, ayahCount]);

  const fetchAyahs = async () => {
    setLoading(true);
    setError(false);
    const safeSurah = Math.max(1, Math.min(114, surahNumber));
    try {
      const res = await fetch(qfProxy(`verses/by_chapter/${safeSurah}`, {
        fields: 'text_uthmani',
        translations: `57,${translationId}`,
        per_page: '300',
      }));
      if (!res.ok) throw new Error('API error');
      const data = await res.json();

      const verses: any[] = data?.verses ?? [];
      const total: number = verses.length;

      const safeStart = Math.max(1, Math.min(startAyah, total));
      const slice = verses.slice(safeStart - 1, safeStart - 1 + ayahCount);

      const allAyahs: AyahData[] = slice.map((v: any) => {
        const [s, a] = (v.verse_key as string).split(':').map(Number);
        return {
          numberInSurah: v.verse_number as number,
          arabic: v.text_uthmani as string,
          transliteration: (v.translations?.find((t: any) => t.resource_id === 57)?.text ?? '') as string,
          translation: stripHtml(v.translations?.find((t: any) => t.resource_id === translationId)?.text ?? ''),
          audioUrl: `https://everyayah.com/data/Alafasy_128kbps/${pad3(s)}${pad3(a)}.mp3`,
          read: false,
        };
      });

      setAyahs(allAyahs);
      setTotalInSurah(total);

      // Load bookmark state for these verses
      if (uid) {
        const keys = allAyahs.map((a) => `${safeSurah}:${a.numberInSurah}`);
        const results = await Promise.all(keys.map((k) => isBookmarked(uid, k).catch(() => false)));
        const map: Record<string, boolean> = {};
        keys.forEach((k, i) => { map[k] = results[i]; });
        setBookmarked(map);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const startPlaying = async (index: number) => {
    const all = ayahsRef.current;
    if (index < 0 || index >= all.length) return;
    if (soundRef.current) {
      await soundRef.current.stopAsync().catch(() => {});
      await soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
    setPlayingIndex(index);
    setIsAudioPlaying(true);
    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync(
        { uri: all[index].audioUrl },
        { shouldPlay: true }
      );
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        if (status.didJustFinish) {
          sound.unloadAsync();
          soundRef.current = null;
          markRead(index);
          const next = index + 1;
          if (next < ayahsRef.current.length) {
            startPlaying(next);
          } else {
            setPlayingIndex(null);
            setIsAudioPlaying(false);
          }
        }
      });
    } catch {
      setPlayingIndex(null);
      setIsAudioPlaying(false);
    }
  };

  const playAyah = async (index: number) => {
    if (playingIndex === index && soundRef.current) {
      if (isAudioPlaying) {
        await soundRef.current.pauseAsync().catch(() => {});
        setIsAudioPlaying(false);
      } else {
        await soundRef.current.playAsync().catch(() => {});
        setIsAudioPlaying(true);
      }
      return;
    }
    await startPlaying(index);
  };

  const handleGlobalPlayPause = async () => {
    if (playingIndex !== null && soundRef.current) {
      if (isAudioPlaying) {
        await soundRef.current.pauseAsync().catch(() => {});
        setIsAudioPlaying(false);
      } else {
        await soundRef.current.playAsync().catch(() => {});
        setIsAudioPlaying(true);
      }
      return;
    }
    const firstUnread = ayahsRef.current.findIndex((a) => !a.read);
    await startPlaying(firstUnread >= 0 ? firstUnread : 0);
  };

  const handleBookmark = async (verseKey: string, arabic: string, translation: string) => {
    if (!uid || bmLoading[verseKey]) return;
    if (bookmarked[verseKey]) {
      // Remove directly
      setBookmarked((prev) => ({ ...prev, [verseKey]: false }));
      setBmLoading((prev) => ({ ...prev, [verseKey]: true }));
      try {
        await toggleBookmark(uid, { verseKey, surahName: `Surah ${surahNumber}`, arabic, translation });
      } catch {
        setBookmarked((prev) => ({ ...prev, [verseKey]: true }));
      } finally {
        setBmLoading((prev) => ({ ...prev, [verseKey]: false }));
      }
    } else {
      // Open collection modal
      setBmModalVerse({ verseKey, arabic, translation });
    }
  };

  const markRead = (index: number) => {
    setAyahs((prev) => prev.map((a, i) => i === index ? { ...a, read: true } : a));
  };

  const handleComplete = () => {
    soundRef.current?.stopAsync().catch(() => {});
    soundRef.current?.unloadAsync().catch(() => {});
    // Compute next position
    const lastAyah = startAyah + ayahCount - 1;
    if (lastAyah >= totalInSurah) {
      const nextSurah = surahNumber < 114 ? surahNumber + 1 : 1;
      onComplete(nextSurah, 1);
    } else {
      onComplete(surahNumber, lastAyah + 1);
    }
  };

  const allRead = ayahs.length > 0 && ayahs.every((a) => a.read);

  const styles = useMemo(() => StyleSheet.create({
    container: { padding: 16, gap: 14, paddingBottom: 40 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
    loadingText: { color: colors.textMuted, fontSize: 14 },
    errorText: { color: colors.textSub, fontSize: 14, textAlign: 'center' },
    retryBtn: {
      paddingHorizontal: 24, paddingVertical: 12, borderRadius: RADIUS.full,
      backgroundColor: colors.primaryBg, borderWidth: 1.5, borderColor: colors.primary,
    },
    retryText: { color: colors.primary, fontWeight: '600' },

    titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    globalPlayBtn: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: colors.primaryBg,
      borderWidth: 1.5, borderColor: colors.cardBorder,
      alignItems: 'center', justifyContent: 'center',
      ...SHADOW.card,
    },
    globalPlayBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    title: { color: colors.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.4 },
    sub: { color: colors.textSub, fontSize: 14, marginTop: 2 },

    ayahCard: {
      backgroundColor: colors.card, borderRadius: RADIUS.xl,
      borderWidth: 1.5, borderColor: colors.cardBorder,
      padding: 16, gap: 10, ...SHADOW.card,
    },
    ayahCardRead: { borderColor: `${colors.primary}66`, backgroundColor: colors.primaryBg },
    ayahHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    bmBtn: {
      padding: 6,
      alignItems: 'center', justifyContent: 'center',
    },
    bmBtnActive: {},
    playBtn: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: colors.primaryBg,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: colors.cardBorder,
    },
    playBtnActive: { backgroundColor: `${colors.primary}18`, borderColor: colors.primary },

    arabic: {
      color: colors.text, fontSize: 22, textAlign: 'right',
      lineHeight: 40, writingDirection: 'rtl',
    },
    transliteration: {
      color: colors.textMuted, fontSize: 12, fontStyle: 'italic', textAlign: 'center',
    },
    translation: { color: colors.textSub, fontSize: 13, lineHeight: 20 },

    markReadBtn: {
      alignSelf: 'flex-start',
      paddingHorizontal: 14, paddingVertical: 6,
      borderRadius: RADIUS.full, borderWidth: 1,
      borderColor: colors.primary, backgroundColor: colors.primaryBg,
    },
    markReadText: { color: colors.primary, fontSize: 12, fontWeight: '600' },

    completeBtn: {
      backgroundColor: colors.primary, borderRadius: RADIUS.xl,
      paddingVertical: 17, alignItems: 'center', justifyContent: 'center',
      flexDirection: 'row', gap: 8, marginTop: 8,
      ...SHADOW.glow(colors.primary),
    },
    completeBtnDim: { opacity: 0.7 },
    completeBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
    skipLink: { alignSelf: 'center', paddingVertical: 8 },
    skipText: { color: colors.textMuted, fontSize: 13, fontWeight: '500' },
  }), [colors]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading Quran…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Could not load ayahs. Check your connection.</Text>
        <Pressable onPress={fetchAyahs} style={styles.retryBtn}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  const surahNames: Record<number, string> = {
    1: 'Al-Fatiha', 2: 'Al-Baqarah', 3: 'Ali Imran', 4: "An-Nisa'", 5: 'Al-Maidah',
    6: "Al-An'am", 7: "Al-A'raf", 8: 'Al-Anfal', 9: 'At-Tawbah', 10: 'Yunus',
  };
  const surahName = surahNames[surahNumber] ?? `Surah ${surahNumber}`;

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.title}>Today's Reading</Text>
          <Text style={styles.sub}>{surahName} · Ayahs {startAyah}–{startAyah + ayahs.length - 1}</Text>
        </View>
        <Pressable
          onPress={handleGlobalPlayPause}
          style={[styles.globalPlayBtn, (playingIndex !== null && isAudioPlaying) && styles.globalPlayBtnActive]}
        >
          {(playingIndex !== null && isAudioPlaying)
            ? <Pause size={18} color={colors.white} fill={colors.white} />
            : <Play size={18} color={colors.primary} fill={colors.primary} />}
        </Pressable>
      </View>

      {ayahs.map((ayah, index) => {
        const verseKey = `${surahNumber}:${ayah.numberInSurah}`;
        const isBm = bookmarked[verseKey] ?? false;
        return (
        <View key={ayah.numberInSurah} style={[styles.ayahCard, ayah.read && styles.ayahCardRead]}>
          <View style={styles.ayahHeader}>
            <Pressable
              onPress={() => handleBookmark(verseKey, ayah.arabic, ayah.translation)}
              style={[styles.bmBtn, isBm && styles.bmBtnActive]}
              disabled={bmLoading[verseKey]}
            >
              {bmLoading[verseKey]
                ? <ActivityIndicator size={13} color={colors.primary} />
                : isBm
                  ? <BookmarkCheck size={15} color={colors.primary} />
                  : <Bookmark size={15} color={colors.textMuted} />}
            </Pressable>
            <Pressable
              onPress={() => playAyah(index)}
              style={[styles.playBtn, playingIndex === index && styles.playBtnActive]}
            >
              {playingIndex === index && isAudioPlaying
                ? <Pause size={16} color={colors.primary} fill={colors.primary} />
                : <Play size={16} color={colors.primary} fill={colors.primary} />}
            </Pressable>
          </View>

          <Text style={styles.arabic}>{ayah.arabic}</Text>
          {ayah.transliteration ? (
            <Text style={styles.transliteration}>{ayah.transliteration}</Text>
          ) : null}
          <Text style={styles.translation}>{ayah.translation}</Text>

          {!ayah.read && (
            <Pressable onPress={() => markRead(index)} style={styles.markReadBtn}>
              <Text style={styles.markReadText}>Mark as read</Text>
            </Pressable>
          )}
        </View>
        );
      })}

      <Pressable
        onPress={handleComplete}
        style={[styles.completeBtn, !allRead && styles.completeBtnDim]}
      >
        <Text style={styles.completeBtnText}>Complete Session</Text>
      </Pressable>

      {bmModalVerse && uid && (
        <BookmarkCollectionModal
          uid={uid}
          verseKey={bmModalVerse.verseKey}
          surahName={`Surah ${surahNumber}`}
          arabic={bmModalVerse.arabic}
          translation={bmModalVerse.translation}
          onClose={() => setBmModalVerse(null)}
          onSaved={() => {
            const vk = bmModalVerse.verseKey;
            setBookmarked((prev) => ({ ...prev, [vk]: true }));
            setBmModalVerse(null);
          }}
        />
      )}
    </ScrollView>
  );
}
