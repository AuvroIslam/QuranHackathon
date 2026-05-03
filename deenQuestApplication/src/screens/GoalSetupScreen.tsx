import AsyncStorage from '@react-native-async-storage/async-storage';
import { BookOpen, Check, Clock, GraduationCap } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, Image, Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { saveUserGoal } from '../lib/firestore';
import { COLORS, DEPTH, RADIUS, SHADOW } from '../theme';
import { TimePerDay, UserGoal, UserLevel } from '../types';

export const GOAL_SET_KEY = '@deenquest_goal_set';

const LEVEL_ICONS = {
  newbie:       require('../../elementsApp/newbie_icon_purple(islamic_style)-_very_simple_202605030448.jpeg'),
  intermediate: require('../../elementsApp/intermediatite_icon_islamic_style_,_202605030448.jpeg'),
  fluent:       require('../../elementsApp/expert_icon_islamic_style_,_202605030448.jpeg'),
};

interface Props {
  uid: string;
  onDone: () => void;
}

type WizardStep = 'goal' | 'level' | 'time';

const MASCOTS: Record<WizardStep, any> = {
  goal: require('../../elementsApp/waving_onboarding-removebg-preview.png'),
  level: require('../../elementsApp/achievement-removebg-preview.png'),
  time: require('../../elementsApp/reading-removebg-preview.png'),
};

const MASCOT_SPEECH: Record<WizardStep, string> = {
  goal: "Assalamu Alaykum! What brings you here today? 🌙",
  level: "Great choice! Now, how familiar are you with Arabic? 📖",
  time: "Almost there! How much time can you give each day? ⏰",
};

export default function GoalSetupScreen({ uid, onDone }: Props) {
  const { uid: ctxUid } = useAuth();
  const effectiveUid = uid || ctxUid;
  const [wizardStep, setWizardStep] = useState<WizardStep>('goal');
  const [goal, setGoal] = useState<UserGoal | null>(null);
  const [level, setLevel] = useState<UserLevel | null>(null);
  const [saving, setSaving] = useState(false);

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
      onDone();
    } catch {
      await AsyncStorage.setItem(key, 'true').catch(() => {});
      onDone();
    }
  };

  const stepNum = wizardStep === 'goal' ? 1 : wizardStep === 'level' ? 2 : goal === 'learn' ? 3 : 2;
  const totalSteps = goal === 'learn' ? 3 : 2;

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
                icon={<BookOpen size={28} color={COLORS.primary} />}
                title="Complete the Quran"
                description="Read and listen through all 114 surahs at your own pace"
                onPress={() => handleGoalSelect('complete')}
              />
              <GoalCard
                icon={<GraduationCap size={28} color={COLORS.primary} />}
                title="Learn to Read Quran"
                description="Build your Arabic reading skill from letters to full verses"
                onPress={() => handleGoalSelect('learn')}
              />
            </>
          )}

          {wizardStep === 'level' && (
            <>
              <LevelCard image={LEVEL_ICONS.newbie} title="Newbie" desc="I don't know Arabic letters yet" detail="Letters → Al-Fatiha in 10 days" onPress={() => handleLevelSelect('newbie')} />
              <LevelCard image={LEVEL_ICONS.intermediate} title="Intermediate" desc="I know the letters and basics" detail="Short surahs with transliteration support" onPress={() => handleLevelSelect('intermediate')} />
              <LevelCard image={LEVEL_ICONS.fluent} title="Fluent" desc="I can read, just need practice" detail="Powerful verses — no transliteration" onPress={() => handleLevelSelect('fluent')} />
            </>
          )}

          {wizardStep === 'time' && (
            <>
              <TimeCard minutes={3} estimate={goal === 'complete' ? '~3 years to complete Quran' : '~3 exercises per session'} onPress={() => handleTimeSelect(3)} loading={saving} />
              <TimeCard minutes={5} estimate={goal === 'complete' ? '~1.5 years to complete Quran' : '~5 exercises per session'} onPress={() => handleTimeSelect(5)} loading={saving} />
              <TimeCard minutes={10} estimate={goal === 'complete' ? '~10 months to complete Quran' : '~10 exercises per session'} onPress={() => handleTimeSelect(10)} loading={saving} />
            </>
          )}

        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function GoalCard({ icon, title, description, onPress }: { icon: React.ReactNode; title: string; description: string; onPress: () => void }) {
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
      <Text style={styles.arrow}>→</Text>
    </Pressable>
  );
}

function LevelCard({ image, title, desc, detail, onPress }: { image: any; title: string; desc: string; detail: string; onPress: () => void }) {
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

function TimeCard({ minutes, estimate, onPress, loading }: { minutes: number; estimate: string; onPress: () => void; loading: boolean }) {
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
        <Text style={styles.cardTitle}>{minutes} minutes / day</Text>
        <Text style={styles.cardDesc}>{estimate}</Text>
      </View>
      {loading
        ? <ActivityIndicator color={COLORS.primary} size="small" />
        : <View style={styles.checkCircle}><Check size={16} color={COLORS.primary} /></View>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 24, gap: 20, flexGrow: 1 },

  dotsRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  dot: { height: 7, flex: 1, borderRadius: 4, backgroundColor: COLORS.surfaceDark },
  dotActive: { backgroundColor: COLORS.primary },

  mascotRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  mascot: { width: 100, height: 110, resizeMode: 'contain', marginBottom: -18 },
  bubble: {
    flex: 1, backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg, padding: 14,
    borderWidth: 1.5, borderColor: COLORS.cardBorder,
    position: 'relative', ...SHADOW.card,
    marginBottom: 12,
  },
  bubbleTail: {
    position: 'absolute', left: -10, bottom: 20,
    width: 0, height: 0,
    borderTopWidth: 8, borderTopColor: 'transparent',
    borderBottomWidth: 8, borderBottomColor: 'transparent',
    borderRightWidth: 11, borderRightColor: COLORS.card,
  },
  bubbleText: { color: COLORS.text, fontSize: 14, fontWeight: '600', lineHeight: 20 },

  header: { gap: 4 },
  stepLabel: { color: COLORS.primary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  title: { color: COLORS.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.4 },

  card: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.xl,
    borderWidth: 1.5, borderColor: COLORS.cardBorder,
    padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14,
    ...SHADOW.card,
  },
  cardIcon: {
    width: 60, height: 60,
    alignItems: 'center', justifyContent: 'center',
  },
  cardText: { flex: 1, gap: 2 },
  cardTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  cardDesc: { color: COLORS.textSub, fontSize: 12, lineHeight: 17 },
  cardDetail: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  arrow: { color: COLORS.primary, fontSize: 20, fontWeight: '700' },
  levelIcon: { width: 58, height: 58, resizeMode: 'cover', borderRadius: 16, overflow: 'hidden' },
  emoji: { fontSize: 24 },

  timeCircle: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: COLORS.primaryBg,
    borderWidth: 2, borderColor: COLORS.cardBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  timeNum: { color: COLORS.primary, fontSize: 15, fontWeight: '800', lineHeight: 17 },
  timeUnit: { color: COLORS.textMuted, fontSize: 10, fontWeight: '600' },
  checkCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.primaryBg,
    borderWidth: 1.5, borderColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
});
