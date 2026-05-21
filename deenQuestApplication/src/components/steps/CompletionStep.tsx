import { CheckCircle, Flame, Moon, Zap } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { triggerHaptic } from '../../lib/haptics';
import { DEPTH, RADIUS, SHADOW } from '../../theme';

interface Props {
  xpEarned: number;
  streak: number;
  lastSessionDate?: string | null;
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

export default function CompletionStep({ xpEarned, streak, lastSessionDate, sessionsToday, maxSessions, onContinue, onRestart }: Props) {
  const { colors, isDark, hapticsEnabled } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const card1Anim = useRef(new Animated.Value(0)).current;
  const card2Anim = useRef(new Animated.Value(0)).current;
  const card3Anim = useRef(new Animated.Value(0)).current;
  const [continuePressed, setContinuePressed] = useState(false);
  const [donePressed, setDonePressed] = useState(false);

  const isMaxed = sessionsToday >= maxSessions;
  const message = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
  const maxOutMessage = MAX_OUT_MESSAGES[Math.floor(Math.random() * MAX_OUT_MESSAGES.length)];
  const [showStreak, setShowStreak] = useState(sessionsToday === 1);

  useEffect(() => {
    triggerHaptic(hapticsEnabled, showStreak ? 'heavy' : 'success');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const styles = useMemo(() => StyleSheet.create({
    bg: { flex: 1 },
    bgImage: { opacity: isDark ? 0.6 : 0.55 },
    container: {
      flex: 1, padding: 24,
      alignItems: 'center', justifyContent: 'center', gap: 20,
    },
    character: { width: 150, height: 150, resizeMode: 'contain' },
    titleArea: { alignItems: 'center', gap: 8 },
    title: { color: colors.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.5, textAlign: 'center' },
    message: { color: colors.textSub, fontSize: 14, textAlign: 'center', lineHeight: 20 },

    dotsRow: { flexDirection: 'row', gap: 8 },
    sessionDot: {
      width: 28, height: 8, borderRadius: 4,
      backgroundColor: colors.surfaceDark,
    },
    sessionDotDone: { backgroundColor: colors.primary },

    stats: { flexDirection: 'row', gap: 10, width: '100%' },
    statCard: {
      flex: 1, backgroundColor: colors.card,
      borderRadius: RADIUS.xl, borderWidth: 1, borderColor: colors.cardBorder,
      padding: 14, alignItems: 'center', gap: 5, ...SHADOW.card,
    },
    statCardStreak: {
      borderColor: isDark ? '#7C3020' : '#FFD5C2',
      backgroundColor: isDark ? '#1A0D08' : '#FFF8F5',
    },
    statCardStar: {
      borderColor: isDark ? '#7C6520' : colors.accentLight,
      backgroundColor: isDark ? '#1A1608' : '#FFFBEB',
    },
    statValue: { fontSize: 24, fontWeight: '800' },
    statLabel: { color: colors.textSub, fontSize: 11, fontWeight: '600' },

    actions: { width: '100%', gap: 10 },
    continueBtn: {
      width: '100%', paddingVertical: 17,
      borderRadius: RADIUS.xl, backgroundColor: colors.primary,
      alignItems: 'center', ...SHADOW.glow(colors.primary),
    },
    continueBtnText: { color: colors.white, fontSize: 16, fontWeight: '800' },
    doneBtn: {
      width: '100%', paddingVertical: 14,
      borderRadius: RADIUS.xl, backgroundColor: colors.card,
      borderWidth: 1.5, borderColor: colors.cardBorder,
      borderBottomWidth: 4, borderBottomColor: '#9B8CC8',
      alignItems: 'center',
    },
    doneBtnText: { color: colors.textSub, fontSize: 15, fontWeight: '700' },

    maxedBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: colors.primaryBg,
      borderRadius: RADIUS.xl, borderWidth: 1, borderColor: colors.cardBorder,
      paddingHorizontal: 16, paddingVertical: 12, width: '100%',
      justifyContent: 'center',
    },
    maxedText: { color: isDark ? colors.primaryLight : colors.primaryDark, fontSize: 14, fontWeight: '700', textAlign: 'center' },
  }), [colors, isDark]);

  const streakStyles = useMemo(() => StyleSheet.create({
    screen: {
      flex: 1, backgroundColor: colors.bg,
      alignItems: 'center', justifyContent: 'center',
      paddingHorizontal: 32, gap: 28,
    },
    flameWrap: {
      width: 120, height: 120,
      alignItems: 'center', justifyContent: 'center',
      position: 'relative',
    },
    flameGlow: {
      position: 'absolute',
      width: 100, height: 100, borderRadius: 50,
      backgroundColor: '#fb923c',
      opacity: 0.15,
      transform: [{ scale: 1.4 }],
    },
    flameBadge: {
      position: 'absolute', top: 4, right: 4,
      width: 30, height: 30, borderRadius: 15,
      backgroundColor: '#f97316',
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 2, borderColor: colors.card,
    },
    flameBadgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },

    weekRow: {
      flexDirection: 'row', gap: 8, width: '100%',
      justifyContent: 'space-between',
    },
    dayCol: { alignItems: 'center', gap: 6 },
    dayLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
    dayCircle: {
      width: 38, height: 38, borderRadius: 19,
      borderWidth: 2, borderColor: colors.cardBorder,
      backgroundColor: colors.surfaceDark,
      alignItems: 'center', justifyContent: 'center',
    },
    dayCircleDone: {
      backgroundColor: '#f97316',
      borderColor: '#fb923c',
    },

    textWrap: { alignItems: 'center', gap: 8 },
    streakTitle: {
      fontSize: 26, fontWeight: '800', color: colors.text, textAlign: 'center',
    },
    streakSub: {
      fontSize: 14, color: colors.textSub, textAlign: 'center', lineHeight: 20,
    },

    continueBtn: {
      width: '100%', paddingVertical: 17,
      borderRadius: RADIUS.xl, backgroundColor: '#f97316',
      alignItems: 'center',
      borderBottomWidth: 4, borderBottomColor: '#c2410c',
    },
    continueBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  }), [colors]);

  // ── Streak celebration screen (first session of day) ──
  if (showStreak) {
    const today = new Date();
    const dow = today.getDay();
    const monFirst = (dow + 6) % 7;
    const DAY_SHORT = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const lastDate = lastSessionDate ? new Date(lastSessionDate) : today;
    const streakStart = new Date(lastDate);
    streakStart.setDate(lastDate.getDate() - Math.max(streak - 1, 0));

    const weekDays = DAY_SHORT.map((label, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - monFirst + i);
      d.setHours(0, 0, 0, 0);
      const start = new Date(streakStart); start.setHours(0, 0, 0, 0);
      const end = new Date(lastDate); end.setHours(0, 0, 0, 0);
      return { label, completed: d >= start && d <= end };
    });

    const streakMsg =
      streak >= 7
        ? 'MashaAllah! A full week! 🌟'
        : streak >= 3
        ? "You're on fire! Keep the flame lit!"
        : 'Every day counts. Build the habit!';

    return (
      <View style={streakStyles.screen}>
        {/* Flame */}
        <View style={streakStyles.flameWrap}>
          <View style={streakStyles.flameGlow} />
          <Flame size={86} color="#fb923c" fill="#fb923c" />
          <View style={streakStyles.flameBadge}>
            <Text style={streakStyles.flameBadgeText}>{streak}</Text>
          </View>
        </View>

        {/* Week row */}
        <View style={streakStyles.weekRow}>
          {weekDays.map((day, i) => (
            <View key={i} style={streakStyles.dayCol}>
              <Text style={streakStyles.dayLabel}>{day.label}</Text>
              <View style={[streakStyles.dayCircle, day.completed && streakStyles.dayCircleDone]}>
                {day.completed && <CheckCircle size={18} color="#fff" fill="#f97316" />}
              </View>
            </View>
          ))}
        </View>

        {/* Text */}
        <View style={streakStyles.textWrap}>
          <Text style={streakStyles.streakTitle}>{streak} day streak!</Text>
          <Text style={streakStyles.streakSub}>{streakMsg}</Text>
        </View>

        {/* Button */}
        <Pressable
          onPress={() => { triggerHaptic(hapticsEnabled, 'success'); setShowStreak(false); }}
          style={streakStyles.continueBtn}
        >
          <Text style={streakStyles.continueBtnText}>CONTINUE</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ImageBackground
      source={isDark
        ? require('../../../elementsApp/homecardBGmoonDark.png')
        : require('../../../elementsApp/cardBg1.png')}
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
            <Zap size={22} color={colors.primary} fill={colors.primary} />
            <Text style={[styles.statValue, { color: colors.primary }]}>+{xpEarned}</Text>
            <Text style={styles.statLabel}>XP Earned</Text>
          </Animated.View>

          <Animated.View style={[styles.statCard, styles.statCardStreak, { transform: [{ scale: card2Anim }] }]}>
            <Flame size={22} color="#FF6B35" fill="#FF6B35" />
            <Text style={[styles.statValue, { color: '#FF6B35' }]}>{streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </Animated.View>

          <Animated.View style={[styles.statCard, styles.statCardStar, { transform: [{ scale: card3Anim }] }]}>
            <Zap size={22} color={colors.primary} fill={colors.primary} />
            <Text style={[styles.statValue, { color: colors.primaryDark }]}>{xpEarned}</Text>
            <Text style={styles.statLabel}>XP Earned</Text>
          </Animated.View>
        </Animated.View>

        <Animated.View style={[styles.actions, { opacity: fadeAnim }]}>
          {isMaxed ? (
            <>
              {/* Maxed out for today */}
              <View style={styles.maxedBadge}>
                <Moon size={16} color={colors.primary} />
                <Text style={styles.maxedText}>3/3 sessions done. See you tomorrow!</Text>
              </View>
              <Pressable
                onPressIn={() => setDonePressed(true)}
                onPressOut={() => setDonePressed(false)}
                onPress={() => { triggerHaptic(hapticsEnabled, 'light'); onRestart(); }}
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
                onPress={() => { triggerHaptic(hapticsEnabled, 'medium'); onContinue(); }}
                style={[styles.continueBtn, DEPTH.button, continuePressed && DEPTH.buttonPressed]}
              >
                <Text style={styles.continueBtnText}>
                  Keep Going
                </Text>
              </Pressable>
              <Pressable
                onPressIn={() => setDonePressed(true)}
                onPressOut={() => setDonePressed(false)}
                onPress={() => { triggerHaptic(hapticsEnabled, 'light'); onRestart(); }}
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
