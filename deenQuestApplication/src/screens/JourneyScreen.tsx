import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { X, Zap } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActionSelection from '../components/steps/ActionSelection';
import AyahDisplay from '../components/steps/AyahDisplay';
import CompletionStep from '../components/steps/CompletionStep';
import LessonIntroStep from '../components/steps/LessonIntroStep';
import ListenStep from '../components/steps/ListenStep';
import MCQQuestion from '../components/steps/MCQQuestion';
import MoodSelection from '../components/steps/MoodSelection';
import SpeakStep from '../components/steps/SpeakStep';
import QuranReadingSession from '../components/QuranReadingSession';
import { useAuth } from '../context/AuthContext';
import { useJourney } from '../hooks/useJourney';
import {
  completeJourney,
  getUserProfile,
  incrementCurrentDay,
  updateQuranProgress,
} from '../lib/firestore';
import { getLesson } from '../lib/lessons-data';
import { getAyahByMood } from '../services/api';
import { COLORS, DEPTH, RADIUS, SHADOW } from '../theme';
import { Ayah, Mood, TimePerDay, UserGoal, UserLevel } from '../types';

const SESSION_KEY = '@deenquest_daily_sessions';
const MAX_SESSIONS = 3;

function levelToLessonKey(level: UserLevel | null): 'beginner' | 'intermediate' | 'fluent' {
  if (level === 'newbie') return 'beginner';
  if (level === 'fluent') return 'fluent';
  return 'intermediate';
}

export default function JourneyScreen() {
  const { uid } = useAuth();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const ayahOnly = route.params?.ayahOnly === true;

  const [userGoal, setUserGoal] = useState<UserGoal | null>(null);
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [userTimePerDay, setUserTimePerDay] = useState<TimePerDay | null>(null);
  const [currentDay, setCurrentDay] = useState(1);
  const [quranProgress, setQuranProgress] = useState<{ surahNumber: number; ayahNumber: number }>({
    surahNumber: 1,
    ayahNumber: 1,
  });
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [sessionsToday, setSessionsToday] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem(SESSION_KEY).then((raw) => {
      if (!raw) return;
      const { date, count } = JSON.parse(raw);
      const today = new Date().toISOString().split('T')[0];
      if (date === today) setSessionsToday(count);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!uid) return;
    getUserProfile(uid)
      .then((profile) => {
        if (profile) {
          setUserGoal(profile.goal ?? 'learn');
          setUserLevel(profile.level ?? null);
          setUserTimePerDay(profile.timePerDay ?? null);
          setCurrentDay(profile.currentDay ?? 1);
          if (profile.quranProgress) setQuranProgress(profile.quranProgress);
        }
      })
      .catch(() => {})
      .finally(() => setProfileLoaded(true));
  }, [uid]);

  const {
    state,
    stepIndex,
    totalSteps,
    selectMood,
    nextStep,
    setSpeechResult,
    setAnswer,
    setAction,
    complete,
    restart,
  } = useJourney(profileLoaded ? userGoal : null, uid);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const animateTo = (dir: 1 | -1, cb: () => void) => {
    Animated.timing(slideAnim, { toValue: -40 * dir, duration: 140, useNativeDriver: true }).start(() => {
      slideAnim.setValue(40 * dir);
      cb();
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 10 }).start();
    });
  };

  const handleMoodSelect = (mood: Mood, customText?: string) => {
    const { ayah, question } = getAyahByMood(mood);
    animateTo(1, () => selectMood(mood, ayah, question, customText));
  };

  const handleCustomText = (text: string) => handleMoodSelect('justHere', text);

  const handleLessonBegin = () => {
    const lessonKey = levelToLessonKey(userLevel);
    const lesson = getLesson(lessonKey, currentDay);
    if (!lesson) { handleMoodSelect('justHere'); return; }
    animateTo(1, () => selectMood('justHere', lesson.learnContent as Ayah, lesson.mcq));
  };

  const handleNext = () => animateTo(1, nextStep);

  const handleComplete = () => {
    animateTo(1, complete);
    const newCount = sessionsToday + 1;
    setSessionsToday(newCount);
    const today = new Date().toISOString().split('T')[0];
    AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ date: today, count: newCount })).catch(() => {});
    if (uid) {
      completeJourney(uid, state.xpEarned + 10).catch(() => {});
      if (userGoal === 'learn' && currentDay <= 10) {
        incrementCurrentDay(uid).catch(() => {});
        setCurrentDay((d) => d + 1);
      }
    }
  };

  const handleContinue = () => animateTo(-1, restart);
  const handleRestart = () => animateTo(-1, restart);

  const handleSpeakResult = (result: Parameters<typeof setSpeechResult>[0]) => {
    setSpeechResult(result);
    if (result.correct) setTimeout(() => animateTo(1, nextStep), 1800);
  };

  const handleSpeakSkip = () => animateTo(1, nextStep);
  const handleAnswer = (index: number) => setAnswer(index);
  const handleActionSelect = (action: string) => setAction(action);

  const handleReadingComplete = (nextSurah: number, nextAyah: number) => {
    if (uid) updateQuranProgress(uid, nextSurah, nextAyah).catch(() => {});
    setQuranProgress({ surahNumber: nextSurah, ayahNumber: nextAyah });
    handleComplete();
  };

  const passThreshold = userLevel === 'newbie' ? 0.4 : userLevel === 'fluent' ? 0.7 : 0.6;
  const showTransliteration = userLevel !== 'fluent';
  const ayahCount = userTimePerDay === 10 ? 20 : userTimePerDay === 5 ? 10 : 6;

  // For learn users on days 1-10, 'mood' step shows lesson intro instead
  const isLessonDay = userGoal === 'learn' && currentDay <= 10;
  const lessonKey = levelToLessonKey(userLevel);
  const todayLesson = isLessonDay ? getLesson(lessonKey, currentDay) : null;

  const showContinue = (): { show: boolean; label: string } => {
    switch (state.step) {
      case 'mood': return { show: false, label: '' };
      case 'ayah': return { show: true, label: ayahOnly ? 'Back to Home' : 'Continue' };
      case 'listen': return { show: true, label: 'Ready to speak' };
      case 'speak': return { show: false, label: '' };
      case 'mcq': return { show: state.selectedAnswer !== undefined, label: 'Continue' };
      case 'action': return { show: !!state.action, label: 'Complete session' };
      case 'reading': return { show: false, label: '' };
      case 'completion': return { show: false, label: '' };
      default: return { show: false, label: '' };
    }
  };

  const handleContinuePress = () => {
    if (ayahOnly && state.step === 'ayah') { restart(); navigation.navigate('Home'); return; }
    if (state.step === 'action') handleComplete();
    else handleNext();
  };

  const { show: showBtn, label: btnLabel } = showContinue();
  const isCompletion = state.step === 'completion';

  // Progress bar width: stepIndex out of (totalSteps - 1)
  const progressPct = totalSteps > 1 ? Math.min((stepIndex / (totalSteps - 1)) * 100, 100) : 0;

  const renderStep = () => {
    switch (state.step) {
      case 'mood':
        if (isLessonDay && todayLesson) {
          return (
            <LessonIntroStep
              lesson={todayLesson}
              currentDay={currentDay}
              totalDays={10}
              onBegin={handleLessonBegin}
            />
          );
        }
        return <MoodSelection onSelect={handleMoodSelect} onCustomText={handleCustomText} />;

      case 'ayah': return state.ayah ? <AyahDisplay ayah={state.ayah} /> : null;
      case 'listen': return state.ayah ? <ListenStep ayah={state.ayah} /> : null;
      case 'speak': return state.ayah ? (
        <SpeakStep
          ayah={state.ayah}
          attempts={state.speechAttempts}
          onResult={handleSpeakResult}
          onSkip={handleSpeakSkip}
          passThreshold={passThreshold}
          showTransliteration={showTransliteration}
        />
      ) : null;
      case 'mcq': return state.question ? (
        <MCQQuestion question={state.question} selectedAnswer={state.selectedAnswer} onAnswer={handleAnswer} />
      ) : null;
      case 'action': return <ActionSelection onSelect={handleActionSelect} selected={state.action} />;
      case 'reading': return (
        <QuranReadingSession
          surahNumber={quranProgress.surahNumber}
          startAyah={quranProgress.ayahNumber}
          ayahCount={ayahCount}
          onComplete={handleReadingComplete}
        />
      );
      case 'completion': return (
        <CompletionStep
          xpEarned={state.xpEarned}
          streak={state.streak}
          sessionsToday={sessionsToday}
          maxSessions={MAX_SESSIONS}
          onContinue={handleContinue}
          onRestart={handleRestart}
        />
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={isCompletion ? ['top'] : ['top', 'bottom']}>
      <View style={styles.container}>

        {/* Duolingo-style header */}
        {!isCompletion && (
          <View style={styles.header}>
            <Pressable
              onPress={() => { restart(); navigation.navigate('Home'); }}
              hitSlop={12}
              style={styles.closeBtn}
            >
              <X size={22} color={COLORS.textMuted} />
            </Pressable>

            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, { width: `${progressPct}%` }]} />
            </View>

            <View style={styles.xpBadge}>
              <Zap size={14} color={COLORS.accent} fill={COLORS.accent} />
              <Text style={styles.xpText}>{state.xpEarned}</Text>
            </View>
          </View>
        )}

        {/* Step content */}
        <Animated.View style={[styles.stepArea, { transform: [{ translateX: slideAnim }] }]}>
          {renderStep()}
        </Animated.View>

        {/* Continue button */}
        {showBtn && (
          <View style={styles.footer}>
            <ContinueButton label={btnLabel} onPress={handleContinuePress} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function ContinueButton({ label, onPress }: { label: string; onPress: () => void }) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
      style={[styles.continueBtn, DEPTH.button, pressed && DEPTH.buttonPressed]}
    >
      <Text style={styles.continueBtnText}>{label} →</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    flex: 1,
    height: 12,
    backgroundColor: COLORS.surfaceDark,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 6,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.accentLight,
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    minWidth: 52,
    justifyContent: 'center',
  },
  xpText: {
    color: COLORS.accentDark,
    fontSize: 13,
    fontWeight: '800',
  },

  stepArea: { flex: 1 },

  footer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 8,
  },
  continueBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    paddingVertical: 17,
    alignItems: 'center',
    ...SHADOW.glow(COLORS.primary),
  },
  continueBtnText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
