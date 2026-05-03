import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, DEPTH, RADIUS, SHADOW } from '../../theme';
import type { Lesson } from '../../lib/lessons-data';

interface Props {
  lesson: Lesson;
  currentDay: number;
  totalDays: number;
  onBegin: () => void;
}

export default function LessonIntroStep({ lesson, currentDay, totalDays, onBegin }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 50, friction: 10 }),
    ]).start();
  }, []);

  const progress = currentDay / totalDays;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      {/* Mascot with speech bubble */}
      <View style={styles.mascotRow}>
        <Image
          source={require('../../../elementsApp/pointing_towards_you-removebg-preview.png')}
          style={styles.mascot}
        />
        <View style={styles.bubble}>
          <View style={styles.bubbleTail} />
          <Text style={styles.bubbleText}>Today's lesson is ready! Let's go 🎯</Text>
        </View>
      </View>

      {/* Day progress */}
      <View style={styles.dayRow}>
        <Text style={styles.dayLabel}>Day {currentDay} of {totalDays}</Text>
        <View style={styles.dayTrack}>
          <View style={[styles.dayFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
        </View>
      </View>

      {/* Lesson card */}
      <View style={[styles.lessonCard, DEPTH.card]}>
        <View style={styles.focusBadge}>
          <Text style={styles.focusText}>Today's focus</Text>
        </View>
        <Text style={styles.lessonTitle}>{lesson.title}</Text>
        <Text style={styles.lessonSubtitle}>{lesson.subtitle}</Text>

        <View style={styles.divider} />

        <Text style={styles.practiceLabel}>You will practice:</Text>
        <View style={styles.practiceItem}>
          <Text style={styles.dot}>▸</Text>
          <Text style={styles.practiceText}>Listen to the recitation</Text>
        </View>
        <View style={styles.practiceItem}>
          <Text style={styles.dot}>▸</Text>
          <Text style={styles.practiceText}>Recite it yourself</Text>
        </View>
        <View style={styles.practiceItem}>
          <Text style={styles.dot}>▸</Text>
          <Text style={styles.practiceText}>Answer a reflection question</Text>
        </View>
      </View>

      {/* 3D Begin button */}
      <Pressable
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        onPress={onBegin}
        style={[styles.beginBtn, DEPTH.button, pressed && DEPTH.buttonPressed]}
      >
        <Text style={styles.beginText}>Begin Lesson →</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 18 },

  mascotRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  mascot: { width: 90, height: 90, resizeMode: 'contain' },
  bubble: {
    flex: 1, backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg, padding: 14,
    borderWidth: 1.5, borderColor: COLORS.cardBorder,
    position: 'relative',
    ...SHADOW.card,
  },
  bubbleTail: {
    position: 'absolute', left: -10, bottom: 18,
    width: 0, height: 0,
    borderTopWidth: 8, borderTopColor: 'transparent',
    borderBottomWidth: 8, borderBottomColor: 'transparent',
    borderRightWidth: 10, borderRightColor: COLORS.card,
  },
  bubbleText: { color: COLORS.text, fontSize: 14, fontWeight: '600', lineHeight: 20 },

  dayRow: { gap: 6 },
  dayLabel: { color: COLORS.primary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  dayTrack: { height: 10, backgroundColor: COLORS.surfaceDark, borderRadius: 5, overflow: 'hidden' },
  dayFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 5 },

  lessonCard: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.xl,
    borderWidth: 1.5, borderColor: COLORS.cardBorder,
    padding: 18, gap: 8, ...SHADOW.card,
  },
  focusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primaryBg, borderRadius: RADIUS.full,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  focusText: { color: COLORS.primary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  lessonTitle: { color: COLORS.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  lessonSubtitle: { color: COLORS.textSub, fontSize: 13, lineHeight: 19 },
  divider: { height: 1, backgroundColor: COLORS.surfaceDark, marginVertical: 4 },
  practiceLabel: { color: COLORS.textMuted, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },
  practiceItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { color: COLORS.primary, fontSize: 12 },
  practiceText: { color: COLORS.textSub, fontSize: 13 },

  beginBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    paddingVertical: 17,
    alignItems: 'center',
  },
  beginText: { color: COLORS.white, fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },
});
