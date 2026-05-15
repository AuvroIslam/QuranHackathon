import AsyncStorage from '@react-native-async-storage/async-storage';
import { BookOpen, Check, ChevronRight, GraduationCap } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { saveQFTokens, saveUserGoal } from '../lib/firestore';
import { DEPTH, RADIUS, SHADOW } from '../theme';
import { TimePerDay, UserGoal, UserLevel } from '../types';

export const GOAL_SET_KEY = '@deenquest_goal_set';

const LEVEL_ICONS = {
  newbie:       require('../../elementsApp/make_it_simple_and_keep_202605102207-removebg-preview.png'),
  intermediate: require('../../elementsApp/intermediatite_icon_islamic_style___202605030448-removebg-preview.png'),
  fluent:       require('../../elementsApp/expert_icon_islamic_style___202605030448-removebg-preview.png'),
};

interface Props {
  uid: string;
  onDone: () => void;
}

type WizardStep = 'goal' | 'level' | 'time' | 'qfConnect';

const MASCOTS: Record<WizardStep, any> = {
  goal: require('../../elementsApp/waving_onboarding-removebg-preview.png'),
  level: require('../../elementsApp/achievement-removebg-preview.png'),
  time: require('../../elementsApp/reading-removebg-preview.png'),
  qfConnect: require('../../elementsApp/waving_onboarding-removebg-preview.png'),
};

const MASCOT_SPEECH: Record<WizardStep, string> = {
  goal: "Assalamu Alaykum! What brings you here today?",
  level: "Great choice! Now, how familiar are you with Arabic?",
  time: "Almost there! How much time can you give each day?",
  qfConnect: "",
};

export default function GoalSetupScreen({ uid, onDone }: Props) {
  const { uid: ctxUid } = useAuth();
  const { colors } = useTheme();
  const effectiveUid = uid || ctxUid;
  const [wizardStep, setWizardStep] = useState<WizardStep>('goal');
  const [goal, setGoal] = useState<UserGoal | null>(null);
  const [level, setLevel] = useState<UserLevel | null>(null);
  const [saving, setSaving] = useState(false);
  const [waitingForQF, setWaitingForQF] = useState(false);
  const [qfSuccess, setQFSuccess] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const mascotAnim = useRef(new Animated.Value(1)).current;

  const slideForward = (cb: () => void) => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: -50, duration: 140, useNativeDriver: true }),
      Animated.timing(mascotAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start(() => {
      slideAnim.setValue(50);
      cb();
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 10 }),
        Animated.timing(mascotAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleGoalSelect = (selected: UserGoal) => {
    setGoal(selected);
    if (selected === 'learn') {
      slideForward(() => setWizardStep('level'));
    } else {
      slideForward(() => setWizardStep('time'));
    }
  };

  const handleLevelSelect = (selected: UserLevel) => {
    setLevel(selected);
    slideForward(() => setWizardStep('time'));
  };

  const handleTimeSelect = async (time: TimePerDay) => {
    if (!effectiveUid || !goal) return;
    setSaving(true);
    const key = `${GOAL_SET_KEY}_${effectiveUid}`;
    try {
      await saveUserGoal(effectiveUid, goal, { level: level ?? undefined, timePerDay: time });
      await AsyncStorage.setItem(key, 'true');
    } catch {
      await AsyncStorage.setItem(key, 'true').catch(() => {});
    } finally {
      setSaving(false);
    }
    slideForward(() => setWizardStep('qfConnect'));
  };

  const handleQFConnect = () => {
    if (!effectiveUid) { onDone(); return; }
    setWaitingForQF(true);
    const url = `https://quran-hackathon-omega.vercel.app/auth/qf-start?from=mobile&uid=${encodeURIComponent(effectiveUid)}`;
    Linking.openURL(url).catch(() => setWaitingForQF(false));
  };

  useEffect(() => {
    const handleDeepLink = ({ url }: { url: string }) => {
      if (!url.startsWith('deenquest://qf-connected')) return;
      const qs = url.split('?')[1] ?? '';
      const params: Record<string, string> = {};
      qs.split('&').forEach((pair) => {
        const idx = pair.indexOf('=');
        if (idx > -1) params[pair.slice(0, idx)] = decodeURIComponent(pair.slice(idx + 1));
      });
      const at = params.at ?? '';
      const rt = params.rt ?? '';
      const ea = parseInt(params.ea ?? '0', 10);
      if (at && effectiveUid) {
        setQFSuccess(true);
        setWaitingForQF(false);
        saveQFTokens(effectiveUid, at, rt, ea).catch(() => {});
        setTimeout(() => onDone(), 1800);
      } else {
        onDone();
      }
    };
    Linking.getInitialURL().then((url) => { if (url) handleDeepLink({ url }); });
    const sub = Linking.addEventListener('url', handleDeepLink);
    return () => sub.remove();
  }, [effectiveUid]);

  const stepNum = wizardStep === 'goal' ? 1 : wizardStep === 'level' ? 2 : wizardStep === 'time' ? (goal === 'learn' ? 3 : 2) : -1;
  const totalSteps = goal === 'learn' ? 3 : 2;

  const styles = useMemo(() => StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    scroll: { padding: 24, gap: 20, flexGrow: 1 },

    dotsRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
    dot: { height: 7, flex: 1, borderRadius: 4, backgroundColor: colors.surfaceDark },
    dotActive: { backgroundColor: colors.primary },

    mascotRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
    mascot: { width: 100, height: 110, resizeMode: 'contain', marginBottom: -18 },
    bubble: {
      flex: 1, backgroundColor: colors.card,
      borderRadius: RADIUS.lg, padding: 14,
      borderWidth: 1.5, borderColor: colors.cardBorder,
      position: 'relative', ...SHADOW.card,
      marginBottom: 12,
    },
    bubbleTail: {
      position: 'absolute', left: -10, bottom: 20,
      width: 0, height: 0,
      borderTopWidth: 8, borderTopColor: 'transparent',
      borderBottomWidth: 8, borderBottomColor: 'transparent',
      borderRightWidth: 11, borderRightColor: colors.card,
    },
    bubbleText: { color: colors.text, fontSize: 14, fontWeight: '600', lineHeight: 20 },

    header: { gap: 4 },
    stepLabel: { color: colors.primary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
    title: { color: colors.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.4 },

    card: {
      backgroundColor: colors.card, borderRadius: RADIUS.xl,
      borderWidth: 1.5, borderColor: colors.cardBorder,
      borderLeftWidth: 5, borderLeftColor: colors.primary,
      padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14,
      ...SHADOW.card,
    },
    cardIcon: {
      width: 60, height: 60,
      alignItems: 'center', justifyContent: 'center',
    },
    cardText: { flex: 1, gap: 2 },
    cardTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
    cardDesc: { color: colors.textSub, fontSize: 12, lineHeight: 17 },
    cardDetail: { color: colors.textMuted, fontSize: 11, marginTop: 2 },

    levelIcon: { width: 58, height: 58, resizeMode: 'cover', borderRadius: 16, overflow: 'hidden' },
    emoji: { fontSize: 24 },

    timeCircle: {
      width: 60, height: 60, borderRadius: 16,
      backgroundColor: colors.primaryBg,
      borderWidth: 0,
      alignItems: 'center', justifyContent: 'center',
      gap: 0,
    },
    timeNum: { color: colors.primary, fontSize: 22, fontWeight: '900', lineHeight: 26 },
    timeUnit: { color: colors.primary, fontSize: 11, fontWeight: '600', opacity: 0.7 },
  }), [colors]);

  const qfStyles = useMemo(() => StyleSheet.create({
    page: {
      flexGrow: 1,
      padding: 28,
      paddingTop: 40,
      gap: 28,
      alignItems: 'center',
    },

    logo: { width: 300, height: 90 },

    headingBlock: { width: '100%', gap: 10, alignItems: 'center' },
    eyebrow: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    title: {
      color: colors.text,
      fontSize: 28,
      fontWeight: '800',
      textAlign: 'center',
      lineHeight: 36,
      letterSpacing: -0.5,
    },
    subtitle: {
      color: colors.textSub,
      fontSize: 15,
      textAlign: 'center',
      lineHeight: 23,
    },

    benefitList: {
      width: '100%',
      backgroundColor: colors.card,
      borderRadius: RADIUS.xl,
      borderWidth: 1.5,
      borderColor: colors.cardBorder,
      overflow: 'hidden',
      ...SHADOW.card,
    },
    benefitRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingHorizontal: 18,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
    },
    benefitText: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '600' },

    actions: { width: '100%', gap: 14, alignItems: 'center' },
    connectBtn: {
      width: '100%',
      backgroundColor: colors.primary,
      borderRadius: RADIUS.xl,
      paddingVertical: 18,
      alignItems: 'center',
      ...SHADOW.glow(colors.primary),
      ...DEPTH.button,
    },
    connectText: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.2 },
    skipLink: { paddingVertical: 10 },
    skipText: { color: colors.textMuted, fontSize: 15, fontWeight: '600' },

    waitingBlock: { width: '100%', alignItems: 'center', gap: 14 },
    waitingText: { color: colors.text, fontSize: 17, fontWeight: '700' },
    waitingSub: { color: colors.textSub, fontSize: 14, textAlign: 'center', lineHeight: 21 },

    successBlock: { width: '100%', alignItems: 'center', gap: 14 },
    successCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.successLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    successTitle: { color: colors.text, fontSize: 22, fontWeight: '800' },
    successSub: { color: colors.textSub, fontSize: 14, textAlign: 'center', lineHeight: 21 },
  }), [colors]);

  // QF Connect — full page, no wizard chrome
  if (wizardStep === 'qfConnect') {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={qfStyles.page} showsVerticalScrollIndicator={false}>

          {/* Logo */}
          <Image
            source={require('../../elementsApp/quran.comLogo.png')}
            style={qfStyles.logo}
            resizeMode="contain"
          />

          {/* Heading */}
          <View style={qfStyles.headingBlock}>
            <Text style={qfStyles.eyebrow}>One last thing</Text>
            <Text style={qfStyles.title}>Connect your{'\n'}Quran.com account</Text>
            <Text style={qfStyles.subtitle}>
              Sync your bookmarks, reading streaks, and goals across all your devices — automatically.
            </Text>
          </View>

          {/* Benefits */}
          <View style={qfStyles.benefitList}>
            {[
              'Bookmarks & collections',
              'Reading streaks & activity',
              'Goals synced across devices',
            ].map((text) => (
              <View key={text} style={qfStyles.benefitRow}>
                <Text style={qfStyles.benefitText}>{text}</Text>
              </View>
            ))}
          </View>

          {/* Actions */}
          {qfSuccess ? (
            <View style={qfStyles.successBlock}>
              <View style={qfStyles.successCircle}>
                <Check size={32} color={colors.success} />
              </View>
              <Text style={qfStyles.successTitle}>Connected!</Text>
              <Text style={qfStyles.successSub}>Your Quran.com account is linked. Opening DeenQuest…</Text>
            </View>
          ) : waitingForQF ? (
            <View style={qfStyles.waitingBlock}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={qfStyles.waitingText}>Waiting for Quran.com…</Text>
              <Text style={qfStyles.waitingSub}>Complete sign-in in the browser, then return here.</Text>
              <Pressable onPress={onDone} style={qfStyles.skipLink}>
                <Text style={qfStyles.skipText}>Skip for now</Text>
              </Pressable>
            </View>
          ) : (
            <View style={qfStyles.actions}>
              <Pressable style={qfStyles.connectBtn} onPress={handleQFConnect}>
                <Text style={qfStyles.connectText}>Connect Quran.com</Text>
              </Pressable>
              <Pressable onPress={onDone} style={qfStyles.skipLink}>
                <Text style={qfStyles.skipText}>Maybe later</Text>
              </Pressable>
            </View>
          )}

        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Progress dots */}
        <View style={styles.dotsRow}>
          {Array.from({ length: totalSteps }, (_, i) => (
            <View key={i} style={[styles.dot, i < stepNum && styles.dotActive]} />
          ))}
        </View>

        {/* Mascot + speech bubble */}
        <Animated.View style={[styles.mascotRow, { opacity: mascotAnim }]}>
          <Image source={MASCOTS[wizardStep]} style={styles.mascot} />
          <View style={styles.bubble}>
            <View style={styles.bubbleTail} />
            <Text style={styles.bubbleText}>{MASCOT_SPEECH[wizardStep]}</Text>
          </View>
        </Animated.View>

        {/* Step label */}
        <View style={styles.header}>
          <Text style={styles.stepLabel}>Step {stepNum} of {totalSteps}</Text>
          <Text style={styles.title}>
            {wizardStep === 'goal' ? 'What is your goal?' :
             wizardStep === 'level' ? 'What is your level?' :
             'How much time per day?'}
          </Text>
        </View>

        {/* Cards */}
        <Animated.View style={{ transform: [{ translateX: slideAnim }], gap: 14 }}>

          {wizardStep === 'goal' && (
            <>
              <GoalCard
                icon={<BookOpen size={28} color={colors.primary} />}
                title="Complete the Quran"
                description="Read and listen through all 114 surahs at your own pace"
                onPress={() => handleGoalSelect('complete')}
                styles={styles}
              />
              <GoalCard
                icon={<GraduationCap size={28} color={colors.primary} />}
                title="Learn to Read Quran"
                description="Build your Arabic reading skill from letters to full verses"
                onPress={() => handleGoalSelect('learn')}
                styles={styles}
              />
            </>
          )}

          {wizardStep === 'level' && (
            <>
              <LevelCard image={LEVEL_ICONS.newbie} title="Newbie" desc="I don't know Arabic letters yet" detail="Letters → Al-Fatiha in 10 days" onPress={() => handleLevelSelect('newbie')} styles={styles} />
              <LevelCard image={LEVEL_ICONS.intermediate} title="Intermediate" desc="I know the letters and basics" detail="Short surahs with transliteration support" onPress={() => handleLevelSelect('intermediate')} styles={styles} />
              <LevelCard image={LEVEL_ICONS.fluent} title="Fluent" desc="I can read, just need practice" detail="Powerful verses — no transliteration" onPress={() => handleLevelSelect('fluent')} styles={styles} />
            </>
          )}

          {wizardStep === 'time' && (
            <>
              <TimeCard minutes={3} estimate={goal === 'complete' ? '~3 years to complete Quran' : '~3 exercises per session'} onPress={() => handleTimeSelect(3)} loading={saving} colors={colors} styles={styles} />
              <TimeCard minutes={5} estimate={goal === 'complete' ? '~1.5 years to complete Quran' : '~5 exercises per session'} onPress={() => handleTimeSelect(5)} loading={saving} colors={colors} styles={styles} />
              <TimeCard minutes={10} estimate={goal === 'complete' ? '~10 months to complete Quran' : '~10 exercises per session'} onPress={() => handleTimeSelect(10)} loading={saving} colors={colors} styles={styles} />
            </>
          )}

        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function GoalCard({ icon, title, description, onPress, styles }: { icon: React.ReactNode; title: string; description: string; onPress: () => void; styles: any }) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
      style={[styles.card, DEPTH.card, pressed && DEPTH.cardPressed]}
    >
      <View style={styles.cardIcon}>{icon}</View>
      <View style={styles.cardText}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDesc}>{description}</Text>
      </View>
    </Pressable>
  );
}

function LevelCard({ image, title, desc, detail, onPress, styles }: { image: any; title: string; desc: string; detail: string; onPress: () => void; styles: any }) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
      style={[styles.card, DEPTH.card, pressed && DEPTH.cardPressed]}
    >
      <View style={styles.cardIcon}>
        <Image source={image} style={styles.levelIcon} />
      </View>
      <View style={styles.cardText}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDesc}>{desc}</Text>
        <Text style={styles.cardDetail}>{detail}</Text>
      </View>
    </Pressable>
  );
}

function TimeCard({ minutes, estimate, onPress, loading, colors, styles }: { minutes: number; estimate: string; onPress: () => void; loading: boolean; colors: any; styles: any }) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
      disabled={loading}
      style={[styles.card, DEPTH.card, pressed && DEPTH.cardPressed]}
    >
      <View style={styles.timeCircle}>
        <Text style={styles.timeNum}>{minutes}</Text>
        <Text style={styles.timeUnit}>min</Text>
      </View>
      <View style={styles.cardText}>
        <Text style={styles.cardTitle}>{minutes} min / day</Text>
        <Text style={styles.cardDesc}>{estimate}</Text>
      </View>
      {loading
        ? <ActivityIndicator color={colors.primary} size="small" />
        : <ChevronRight size={20} color={colors.textMuted} />}
    </Pressable>
  );
}
