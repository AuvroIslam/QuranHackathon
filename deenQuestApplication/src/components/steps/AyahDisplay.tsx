import { BookOpen, Lightbulb, Bookmark, BookmarkCheck } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { COLORS, RADIUS, SHADOW } from '../../theme';
import { toggleBookmark, isBookmarked } from '../../lib/firestore';
import { Ayah } from '../../types';

interface Props {
  ayah: Ayah;
  uid?: string;
  surahName?: string;
}

export default function AyahDisplay({ ayah, uid, surahName }: Props) {
  const [bookmarked, setBookmarked] = useState(false);
  const [bmLoading, setBmLoading] = useState(false);

  useEffect(() => {
    if (!uid) return;
    isBookmarked(uid, ayah.reference).then(setBookmarked).catch(() => {});
  }, [uid, ayah.reference]);

  async function handleBookmark() {
    if (!uid || bmLoading) return;
    setBmLoading(true);
    try {
      const result = await toggleBookmark(uid, {
        verseKey: ayah.reference,
        surahName: surahName ?? `Quran ${ayah.reference}`,
        arabic: ayah.arabic,
        translation: ayah.translation,
      });
      setBookmarked(result);
    } catch {} finally {
      setBmLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      {/* Header row */}
      <View style={styles.topRow}>
        <View style={styles.labelBlock}>
          <View style={styles.refBadge}>
            <BookOpen size={12} color={COLORS.primary} />
            <Text style={styles.stepLabel}>Today's Ayah</Text>
          </View>
          <Text style={styles.ref}>Quran {ayah.reference}</Text>
        </View>
        <Image source={require('../../../elementsApp/reading-removebg-preview.png')} style={styles.character} />
      </View>

      {/* Arabic card */}
      <View style={styles.arabicCard}>
        <View style={styles.cardBar} />
        <View style={styles.arabicRow}>
          {uid && (
            <Pressable onPress={handleBookmark} style={[styles.bmBtn, bookmarked && styles.bmBtnActive]} disabled={bmLoading}>
              {bmLoading
                ? <ActivityIndicator size={14} color={COLORS.primary} />
                : bookmarked
                  ? <BookmarkCheck size={16} color={COLORS.primary} />
                  : <Bookmark size={16} color={COLORS.textMuted} />}
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

      {/* Reflection */}
      <View style={styles.reflectionCard}>
        <View style={styles.reflectionHeader}>
          <Lightbulb size={15} color={COLORS.accentDark} />
          <Text style={styles.reflectionTitle}>Reflection</Text>
        </View>
        <Text style={styles.reflection}>{ayah.explanation}</Text>
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, gap: 14, paddingBottom: 8 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  labelBlock: { gap: 6 },
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
    backgroundColor: COLORS.primaryBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  stepLabel: { color: COLORS.primary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  ref: { color: COLORS.text, fontSize: 20, fontWeight: '800' },
  character: { width: 90, height: 90, resizeMode: 'contain' },
  arabicCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
    ...SHADOW.card,
  },
  cardBar: { height: 5, backgroundColor: COLORS.primary },
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
    color: COLORS.text, fontSize: 22, textAlign: 'right',
    lineHeight: 40, writingDirection: 'rtl',
  },
  transliteration: {
    color: COLORS.textMuted, fontSize: 12, textAlign: 'center',
    fontStyle: 'italic', paddingHorizontal: 16, paddingBottom: 14,
  },
  translationCard: {
    backgroundColor: COLORS.primaryBg,
    borderRadius: RADIUS.lg,
    padding: 16, gap: 6,
    borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  translationLabel: { color: COLORS.primary, fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  translation: { color: COLORS.text, fontSize: 15, lineHeight: 24, fontStyle: 'italic' },
  reflectionCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
    borderColor: COLORS.cardBorder,
    padding: 16, gap: 8, ...SHADOW.card,
  },
  reflectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  reflectionTitle: {
    color: COLORS.accentDark, fontSize: 12,
    fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8,
  },
  reflection: { color: COLORS.textSub, fontSize: 14, lineHeight: 22 },
});
