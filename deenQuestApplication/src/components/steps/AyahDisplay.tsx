import { BookOpen, Lightbulb, Bookmark, BookmarkCheck } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { triggerHaptic } from '../../lib/haptics';
import { RADIUS, SHADOW } from '../../theme';
import { toggleBookmark, isBookmarked } from '../../lib/firestore';
import { fetchLessonReflection } from '../../services/api';
import { Ayah, Mood } from '../../types';
import BookmarkCollectionModal from '../BookmarkCollectionModal';

interface Props {
  ayah: Ayah;
  uid?: string;
  surahName?: string;
  mood?: Mood | null;
  customMoodText?: string | null;
}

function truncateForLabel(text: string, max = 40): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trimEnd()}…`;
}

const MOOD_LABEL: Record<string, string> = {
  stressed: 'stressed',
  sad: 'sad',
  grateful: 'grateful',
  lost: 'lost',
  indecisive: 'indecisive',
  justHere: 'just here',
  overthinking: 'overthinking',
};

export default function AyahDisplay({ ayah, uid, surahName, mood, customMoodText }: Props) {
  const { colors, hapticsEnabled } = useTheme();
  const [bookmarked, setBookmarked] = useState(false);
  const [bmLoading, setBmLoading] = useState(false);
  const [bmModalOpen, setBmModalOpen] = useState(false);
  const [reflection, setReflection] = useState<string | null>(null);
  const [reflectionLoading, setReflectionLoading] = useState(false);
  useEffect(() => {
    if (!uid) return;
    isBookmarked(uid, ayah.reference).then(setBookmarked).catch(() => {});
  }, [uid, ayah.reference]);

  useEffect(() => {
    let cancelled = false;
    setReflectionLoading(true);
    setReflection(null);
    fetchLessonReflection({
      verseKey: ayah.reference,
      arabic: ayah.arabic,
      translation: ayah.translation,
      mood: mood ?? undefined,
      customText: customMoodText ?? undefined,
    })
      .then((r) => { if (!cancelled) setReflection(r); })
      .finally(() => { if (!cancelled) setReflectionLoading(false); });
    return () => { cancelled = true; };
  }, [ayah.reference, ayah.arabic, ayah.translation, mood, customMoodText]);

  async function handleBookmark() {
    if (!uid || bmLoading) return;
    if (bookmarked) {
      // Remove directly
      setBmLoading(true);
      try {
        await toggleBookmark(uid, {
          verseKey: ayah.reference,
          surahName: surahName ?? `Quran ${ayah.reference}`,
          arabic: ayah.arabic,
          translation: ayah.translation,
        });
        setBookmarked(false);
      } catch {} finally {
        setBmLoading(false);
      }
    } else {
      setBmModalOpen(true);
    }
  }

  const subtitleText = customMoodText
    ? `For when you're feeling ${truncateForLabel(customMoodText)}`
    : mood && MOOD_LABEL[mood]
      ? `For when you're feeling ${MOOD_LABEL[mood]}`
      : "Allah's guidance for you today";

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: 16, gap: 14, paddingBottom: 8 },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    labelBlock: { gap: 6, flex: 1 },
    bmBtn: {
      alignSelf: 'flex-start',
      padding: 6,
    },
    bmBtnActive: {},
    refBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      alignSelf: 'flex-start',
      backgroundColor: colors.primaryBg,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: RADIUS.full,
    },
    stepLabel: { color: colors.primary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
    subtitle: { color: colors.textSub, fontSize: 13, lineHeight: 18 },
    ref: { color: colors.text, fontSize: 18, fontWeight: '800' },
    character: { width: 84, height: 84, resizeMode: 'contain' },
    arabicCard: {
      backgroundColor: colors.card,
      borderRadius: RADIUS.xl,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      overflow: 'hidden',
      ...SHADOW.card,
    },
    cardBar: { height: 5, backgroundColor: colors.primary },
    arabicRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingTop: 16,
      paddingBottom: 4,
      gap: 8,
    },
    arabic: {
      flex: 1,
      color: colors.text, fontSize: 22, textAlign: 'right',
      lineHeight: 40, writingDirection: 'rtl',
    },
    transliteration: {
      color: colors.textMuted, fontSize: 12, textAlign: 'center',
      fontStyle: 'italic', paddingHorizontal: 16, paddingBottom: 14,
    },
    translationCard: {
      backgroundColor: colors.primaryBg,
      borderRadius: RADIUS.lg,
      padding: 16, gap: 6,
      borderWidth: 1, borderColor: colors.cardBorder,
    },
    translationLabel: { color: colors.primary, fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
    translation: { color: colors.text, fontSize: 15, lineHeight: 24, fontStyle: 'italic' },
    reflectionCard: {
      backgroundColor: colors.card,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderLeftWidth: 4,
      borderLeftColor: colors.accent,
      borderColor: colors.cardBorder,
      padding: 18, gap: 10, ...SHADOW.card,
    },
    reflectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    reflectionTitle: {
      color: colors.accentDark, fontSize: 12,
      fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8,
    },
    reflection: { color: colors.text, fontSize: 15, lineHeight: 26 },
    skeletonGroup: { gap: 8 },
    skeletonLine: {
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.surfaceDark,
      opacity: 0.7,
    },
  }), [colors]);

  return (
    <View style={styles.container}>
      {bmModalOpen && uid && (
        <BookmarkCollectionModal
          uid={uid}
          verseKey={ayah.reference}
          surahName={surahName ?? `Quran ${ayah.reference}`}
          arabic={ayah.arabic}
          translation={ayah.translation}
          onClose={() => setBmModalOpen(false)}
          onSaved={() => {
            setBookmarked(true);
            setBmModalOpen(false);
          }}
        />
      )}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      {/* Header row */}
      <View style={styles.topRow}>
        <View style={styles.labelBlock}>
          <View style={styles.refBadge}>
            <BookOpen size={12} color={colors.primary} />
            <Text style={styles.stepLabel}>Today's Ayah</Text>
          </View>
          <Text style={styles.subtitle}>{subtitleText}</Text>
          <Text style={styles.ref}>Quran {ayah.reference}</Text>
        </View>
        <Image source={require('../../../elementsApp/reading-removebg-preview.png')} style={styles.character} />
      </View>

      {/* Arabic card */}
      <View style={styles.arabicCard}>
        <View style={styles.cardBar} />
        <View style={styles.arabicRow}>
          {uid && (
            <Pressable onPress={() => { triggerHaptic(hapticsEnabled, 'tick'); handleBookmark(); }} style={[styles.bmBtn, bookmarked && styles.bmBtnActive]} disabled={bmLoading}>
              {bmLoading
                ? <ActivityIndicator size={14} color={colors.primary} />
                : bookmarked
                  ? <BookmarkCheck size={16} color={colors.primary} />
                  : <Bookmark size={16} color={colors.textMuted} />}
            </Pressable>
          )}
          <Text style={styles.arabic}>{ayah.arabic}</Text>
        </View>
        {ayah.transliteration && (
          <Text style={styles.transliteration}>{ayah.transliteration}</Text>
        )}
      </View>

      {/* Translation */}
      <View style={styles.translationCard}>
        <Text style={styles.translationLabel}>TRANSLATION</Text>
        <Text style={styles.translation}>"{ayah.translation}"</Text>
      </View>

      {/* Reflection (AI-generated) */}
      <View style={styles.reflectionCard}>
        <View style={styles.reflectionHeader}>
          <Lightbulb size={15} color={colors.accentDark} />
          <Text style={styles.reflectionTitle}>Reflection</Text>
        </View>
        {reflectionLoading ? (
          <View style={styles.skeletonGroup}>
            <View style={[styles.skeletonLine, { width: '100%' }]} />
            <View style={[styles.skeletonLine, { width: '95%' }]} />
            <View style={[styles.skeletonLine, { width: '100%' }]} />
            <View style={[styles.skeletonLine, { width: '88%' }]} />
            <View style={[styles.skeletonLine, { width: '70%' }]} />
          </View>
        ) : (
          <Text style={styles.reflection}>{reflection ?? ayah.explanation}</Text>
        )}
      </View>

      </ScrollView>
    </View>
  );
}
