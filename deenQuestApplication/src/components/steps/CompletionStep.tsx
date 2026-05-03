import { Flame, Moon, Star, Zap } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, DEPTH, RADIUS, SHADOW } from '../../theme';

interface Props {
  xpEarned: number;
  streak: number;
  sessionsToday: number;   // how many sessions completed today (including this one)
  maxSessions: number;     // always 3
  onContinue: () => void;  // start another session
  onRestart: () => void;   // go back to home / done for today
}

const MESSAGES = [
  'May Allah accept it from you.',
  'Every ayah brings you closer.',
  'The angels witnessed your effort.',
  'Consistency is the key to progress.',
  'One session closer to a lifelong habit.',
];

const MAX_OUT_MESSAGES = [
  "You've done amazing today! 🌙",
  "That's your 3 sessions — well done! 🌟",
  "Rest now. Come back tomorrow stronger. 🕌",
];

export default function CompletionStep({ xpEarned, streak, sessionsToday, maxSessions, onContinue, onRestart }: Props) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const card1Anim = useRef(new Animated.Value(0)).current;
  const card2Anim = useRef(new Animated.Value(0)).current;
  const card3Anim = useRef(new Animated.Value(0)).current;
  const [continuePressed, setContinuePressed] = useState(false);
  const [donePressed, setDonePressed] = useState(false);

  const isMaxed = sessionsToday >= maxSessions;
  const sessionsLeft = maxSessions - sessionsToday;
  const message = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
  const maxOutMessage = MAX_OUT_MESSAGES[Math.floor(Math.random() * MAX_OUT_MESSAGES.length)];

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 7 }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.stagger(100, [
        Animated.spring(card1Anim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
        Animated.spring(card2Anim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
        Animated.spring(card3Anim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
      ]),
    ]).start();
  }, []);

  return (
    <ImageBackground
      source={require('../../../elementsApp/cardBg1.png')}
      style={styles.bg}
      imageStyle={styles.bgImage}
    >
      <View style={styles.container}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Image
            source={require('../../../elementsApp/celebrating-removebg-preview.png')}
            style={styles.character}
          />
        </Animated.View>

        <Animated.View style={[styles.titleArea, { opacity: fadeAnim }]}>
          <Text style={styles.title}>
            {isMaxed ? maxOutMessage : 'Session Complete! 🎉'}
          </Text>
          <Text style={styles.message}>{message}</Text>
        </Animated.View>

        {/* Session dots */}
        <Animated.View style={[styles.dotsRow, { opacity: fadeAnim }]}>
          {Array.from({ length: maxSessions }, (_, i) => (
            <View key={i} style={[styles.sessionDot, i < sessionsToday && styles.sessionDotDone]} />
          ))}
        </Animated.View>

        <Animated.View style={[styles.stats, { opacity: fadeAnim }]}>
          <Animated.View style={[styles.statCard, { transform: [{ scale: card1Anim }] }]}>
            <Zap size={22} color={COLORS.primary} fill={COLORS.primary} />
            <Text style={[styles.statValue, { color: COLORS.primary }]}>+{xpEarned}</Text>
            <Text style={styles.statLabel}>XP Earned</Text>
          </Animated.View>

          <Animated.View style={[styles.statCard, styles.statCardStreak, { transform: [{ scale: card2Anim }] }]}>
            <Flame size={22} color="#FF6B35" fill="#FF6B35" />
            <Text style={[styles.statValue, { color: '#FF6B35' }]}>{streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </Animated.View>

          <Animated.View style={[styles.statCard, styles.statCardStar, { transform: [{ scale: card3Anim }] }]}>
            <Star size={22} color={COLORS.accent} fill={COLORS.accent} />
            <Text style={[styles.statValue, { color: COLORS.accentDark }]}>{xpEarned * 2}</Text>
            <Text style={styles.statLabel}>Stars</Text>
          </Animated.View>
        </Animated.View>

        <Animated.View style={[styles.actions, { opacity: fadeAnim }]}>
          {isMaxed ? (
            <>
              {/* Maxed out for today */}
              <View style={styles.maxedBadge}>
                <Moon size={16} color={COLORS.primary} />
                <Text style={styles.maxedText}>3/3 sessions done. See you tomorrow!</Text>
              </View>
              <Pressable
                onPressIn={() => setDonePressed(true)}
                onPressOut={() => setDonePressed(false)}
                onPress={onRestart}
                style={[styles.doneBtn, donePressed && { borderBottomWidth: 0, marginTop: 4 }]}
              >
                <Text style={styles.doneBtnText}>Back to Home</Text>
              </Pressable>
            </>
          ) : (
            <>
              {/* Can do more sessions */}
              <Pressable
                onPressIn={() => setContinuePressed(true)}
                onPressOut={() => setContinuePressed(false)}
                onPress={onContinue}
                style={[styles.continueBtn, DEPTH.button, continuePressed && DEPTH.buttonPressed]}
              >
                <Text style={styles.continueBtnText}>
                  Keep Going 
                </Text>
              </Pressable>
              <Pressable
                onPressIn={() => setDonePressed(true)}
                onPressOut={() => setDonePressed(false)}
                onPress={onRestart}
                style={[styles.doneBtn, donePressed && { borderBottomWidth: 0, marginTop: 4 }]}
              >
                <Text style={styles.doneBtnText}>I'm done for today</Text>
              </Pressable>
            </>
          )}
        </Animated.View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  bgImage: { opacity: 0.55 },
  container: {
    flex: 1, padding: 24,
    alignItems: 'center', justifyContent: 'center', gap: 20,
  },
  character: { width: 150, height: 150, resizeMode: 'contain' },
  titleArea: { alignItems: 'center', gap: 8 },
  title: { color: COLORS.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.5, textAlign: 'center' },
  message: { color: COLORS.textSub, fontSize: 14, textAlign: 'center', lineHeight: 20 },

  dotsRow: { flexDirection: 'row', gap: 8 },
  sessionDot: {
    width: 28, height: 8, borderRadius: 4,
    backgroundColor: COLORS.surfaceDark,
  },
  sessionDotDone: { backgroundColor: COLORS.primary },

  stats: { flexDirection: 'row', gap: 10, width: '100%' },
  statCard: {
    flex: 1, backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.cardBorder,
    padding: 14, alignItems: 'center', gap: 5, ...SHADOW.card,
  },
  statCardStreak: { borderColor: '#FFD5C2', backgroundColor: '#FFF8F5' },
  statCardStar: { borderColor: COLORS.accentLight, backgroundColor: '#FFFBEB' },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { color: COLORS.textSub, fontSize: 11, fontWeight: '600' },

  actions: { width: '100%', gap: 10 },
  continueBtn: {
    width: '100%', paddingVertical: 17,
    borderRadius: RADIUS.xl, backgroundColor: COLORS.primary,
    alignItems: 'center', ...SHADOW.glow(COLORS.primary),
  },
  continueBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  doneBtn: {
    width: '100%', paddingVertical: 14,
    borderRadius: RADIUS.xl, backgroundColor: COLORS.card,
    borderWidth: 1.5, borderColor: COLORS.cardBorder,
    borderBottomWidth: 4, borderBottomColor: '#9B8CC8',
    alignItems: 'center',
  },
  doneBtnText: { color: COLORS.textSub, fontSize: 15, fontWeight: '700' },

  maxedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.primaryBg,
    borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.cardBorder,
    paddingHorizontal: 16, paddingVertical: 12, width: '100%',
    justifyContent: 'center',
  },
  maxedText: { color: COLORS.primaryDark, fontSize: 14, fontWeight: '700', textAlign: 'center' },
});
