import { BookOpen, Lightbulb } from 'lucide-react-native';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { COLORS, RADIUS, SHADOW } from '../../theme';
import { Ayah } from '../../types';

interface Props {
  ayah: Ayah;
}

export default function AyahDisplay({ ayah }: Props) {
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
        <Text style={styles.arabic}>{ayah.arabic}</Text>
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
  arabic: {
    color: COLORS.text, fontSize: 30, textAlign: 'right',
    lineHeight: 54, padding: 20, paddingBottom: 4, writingDirection: 'rtl',
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
