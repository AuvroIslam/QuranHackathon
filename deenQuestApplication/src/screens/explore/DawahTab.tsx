import { BookOpen, ChevronRight, Share2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, RADIUS, SHADOW } from '../../theme';

const DAWAH_CARDS = [
  {
    id: '1',
    title: 'Why do Muslims pray 5 times a day?',
    answer: 'Prayer (Salah) is the direct connection between a believer and Allah. The five daily prayers are timed throughout the day to keep believers mindful of Allah, purify the heart, and structure life around worship rather than worldly distractions.',
    ayah: '20:14',
    ayahText: 'Indeed, I am Allah. There is no deity except Me, so worship Me and establish prayer for My remembrance.',
  },
  {
    id: '2',
    title: 'What does Islam say about kindness to others?',
    answer: 'Islam places immense emphasis on kindness. The Prophet Muhammad ﷺ said "None of you believes until he loves for his brother what he loves for himself." Kindness to all — humans, animals, and even the environment — is an act of worship.',
    ayah: '2:83',
    ayahText: 'And speak to people good words.',
  },
  {
    id: '3',
    title: 'What is the Quran?',
    answer: "The Quran is the literal word of Allah revealed to Prophet Muhammad ﷺ over 23 years through the angel Jibreel. It is the final and preserved scripture, a complete guide for humanity covering faith, worship, morality, and law.",
    ayah: '15:9',
    ayahText: 'Indeed, it is We who sent down the Quran and indeed, We will be its guardian.',
  },
  {
    id: '4',
    title: 'Why do Muslims fast in Ramadan?',
    answer: 'Fasting in Ramadan is one of the Five Pillars of Islam. It builds taqwa (God-consciousness), empathy for the poor, discipline of desires, and spiritual renewal. The entire month is a intensive training in patience and closeness to Allah.',
    ayah: '2:183',
    ayahText: 'O you who have believed, fasting has been decreed upon you as it was decreed upon those before you that you may become righteous.',
  },
];

export default function DawahTab() {
  const [expanded, setExpanded] = useState<string | null>(null);

  const handleShare = async (card: (typeof DAWAH_CARDS)[0]) => {
    try {
      await Share.share({
        message: `"${card.ayahText}" (Quran ${card.ayah})\n\n${card.answer}\n\nShared via DeenQuest`,
      });
    } catch {}
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.heading}>Common Questions About Islam</Text>
      <Text style={styles.sub}>Share these answers with those curious about Islam</Text>

      {DAWAH_CARDS.map((card) => {
        const open = expanded === card.id;
        return (
          <View key={card.id} style={styles.card}>
            <TouchableOpacity
              style={styles.cardHeader}
              onPress={() => setExpanded(open ? null : card.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.cardTitle}>{card.title}</Text>
              <ChevronRight
                size={18}
                color={COLORS.primary}
                style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }}
              />
            </TouchableOpacity>

            {open && (
              <View style={styles.cardBody}>
                <Text style={styles.answer}>{card.answer}</Text>
                <View style={styles.ayahBox}>
                  <BookOpen size={13} color={COLORS.primary} />
                  <View style={styles.ayahText}>
                    <Text style={styles.ayahRef}>Quran {card.ayah}</Text>
                    <Text style={styles.ayahLine}>"{card.ayahText}"</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.shareBtn} onPress={() => handleShare(card)}>
                  <Share2 size={14} color={COLORS.white} />
                  <Text style={styles.shareBtnText}>Share this</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40, gap: 12 },
  heading: { color: COLORS.text, fontSize: 20, fontWeight: '800' },
  sub: { color: COLORS.textSub, fontSize: 13, marginTop: -6 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
    ...SHADOW.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 10,
  },
  cardTitle: { flex: 1, color: COLORS.text, fontSize: 15, fontWeight: '700' },
  cardBody: { paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
  answer: { color: COLORS.textSub, fontSize: 14, lineHeight: 22 },
  ayahBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: COLORS.primaryBg,
    borderRadius: RADIUS.lg,
    padding: 12,
  },
  ayahText: { flex: 1, gap: 3 },
  ayahRef: { color: COLORS.primary, fontSize: 11, fontWeight: '700' },
  ayahLine: { color: COLORS.text, fontSize: 13, fontStyle: 'italic', lineHeight: 20 },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: RADIUS.full,
  },
  shareBtnText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
});
