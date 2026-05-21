import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { X } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AyahDisplay from '../components/steps/AyahDisplay';
import CompletionStep from '../components/steps/CompletionStep';
import ListenStep from '../components/steps/ListenStep';
import MCQQuestion from '../components/steps/MCQQuestion';
import MoodSelection from '../components/steps/MoodSelection';
import SpeakStep from '../components/steps/SpeakStep';
import QuranReadingSession from '../components/QuranReadingSession';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useJourney } from '../hooks/useJourney';
import {
  completeJourney,
  getDailySessionCount,
  getUserProfile,
  getUserTasksForDate,
  incrementCurrentDay,
  incrementDailySession,
  updateQuranProgress,
} from '../lib/firestore';
import { getStreakStatus } from '../lib/streakUtils';
import { getAyahByMood, getAyahByCustomMood, checkLessonAnswer, fetchLesson, ApiLesson } from '../services/api';
import { triggerHaptic } from '../lib/haptics';
import { DEPTH, RADIUS, SHADOW } from '../theme';
import { Mood, TimePerDay, UserGoal, UserLevel } from '../types';

const SESSION_KEY_PREFIX = '@deenquest_daily_sessions';
const MAX_SESSIONS = 3;

function levelToLessonKey(level: UserLevel | null): 'beginner' | 'intermediate' | 'fluent' {
  if (level === 'newbie') return 'beginner';
  if (level === 'fluent') return 'fluent';
  return 'intermediate';
}

export default function JourneyScreen() {
  const { uid } = useAuth();
  const { colors, hapticsEnabled } = useTheme();
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
  const [firestoreStreak, setFirestoreStreak] = useState(0);
  const [lastSessionDate, setLastSessionDate] = useState<string | null>(null);
  const [recoveryTasksDoneToday, setRecoveryTasksDoneToday] = useState(0);
  const [moodLoading, setMoodLoading] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [mcqVerdict, setMcqVerdict] = useState<{ correctIndex: number } | null>(null);
  const [apiLesson, setApiLesson] = useState<ApiLesson | null>(null);
  const [lessonLoading, setLessonLoading] = useState(false);

  useEffect(() => {
    if (!uid) return;
    const sessionKey = `${SESSION_KEY_PREFIX}_${uid}`;
    // Fast local read first
    AsyncStorage.getItem(sessionKey).then((raw) => {
      if (!raw) return;
      const { date, count } = JSON.parse(raw);
      const today = new Date().toISOString().split('T')[0];
      if (date === today) setSessionsToday(count);
    }).catch(() => {});
    // Authoritative Firestore read (cross-device)
    getDailySessionCount(uid).then((count) => {
      setSessionsToday(count);
      const today = new Date().toISOString().split('T')[0];
      AsyncStorage.setItem(sessionKey, JSON.stringify({ date: today, count })).catch(() => {});
    }).catch(() => {});
  }, [uid]);

  const loadProfile = useCallback(async () => {
    if (!uid) return;
    const today = new Date().toISOString().split('T')[0];
    try {
      const [profile, todayTasks] = await Promise.all([getUserProfile(uid), getUserTasksForDate(uid, today)]);
      if (profile) {
        setUserGoal(profile.goal ?? 'learn');
        setUserLevel(profile.level ?? null);
        setUserTimePerDay(profile.timePerDay ?? null);
        setCurrentDay(profile.currentDay ?? 1);
        if (profile.quranProgress) setQuranProgress(profile.quranProgress);
        setFirestoreStreak(profile.streak ?? 0);
        setLastSessionDate(profile.lastSessionDate ?? null);
      }
      setRecoveryTasksDoneToday(todayTasks.filter((t) => t.isStreakRecovery).length);
    } catch {}
    setProfileLoaded(true);
  }, [uid]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Fetch the lesson (with LIVE Quran text from the backend QF integration)
  // whenever the learner / day changes. No Quran text is bundled in the app.
  useEffect(() => {
    if (!profileLoaded || userGoal !== 'learn') { setApiLesson(null); return; }
    const lk = levelToLessonKey(userLevel);
    let cancelled = false;
    setLessonLoading(true);
    fetchLesson(lk, currentDay)
      .then((l) => { if (!cancelled) setApiLesson(l); })
      .finally(() => { if (!cancelled) setLessonLoading(false); });
    return () => { cancelled = true; };
  }, [profileLoaded, userGoal, userLevel, currentDay]);

  const {
    state,
    stepIndex,
    totalSteps,
    selectMood,
    skipMood,
    nextStep,
    setSpeechResult,
    setAnswer,
    complete,
    restart,
    loadFull,
  } = useJourney(profileLoaded ? userGoal : null, uid);

  // Resume saved state if requested, otherwise restart fresh.
  // Also re-fetch profile on every focus so a mode switch in ProfileScreen
  // is reflected immediately (JourneyScreen is a tab and doesn't re-mount).
  useFocusEffect(
    useCallback(() => {
      loadProfile();
      if (route.params?.resume) {
        loadFull();
      } else {
        restart();
      }
    }, [loadProfile, route.params?.resume, restart, loadFull])
  );

  const slideAnim = useRef(new Animated.Value(0)).current;
  const animateTo = (dir: 1 | -1, cb: () => void) => {
    Animated.timing(slideAnim, { toValue: -40 * dir, duration: 140, useNativeDriver: true }).start(() => {
      slideAnim.setValue(40 * dir);
      cb();
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 10 }).start();
    });
  };

  const handleMoodSelect = async (mood: Mood, customText?: string) => {
    if (moodLoading) return;
    setMoodLoading(true);
    try {
      const res = await getAyahByMood(mood);
      if (!res) {
        setConnectionError("Couldn't load the verse. Please check your connection and try again.");
        return;
      }
      animateTo(1, () => selectMood(mood, res.ayah, res.question, customText));
    } finally {
      setMoodLoading(false);
    }
  };

  const handleCustomText = async (text: string) => {
    if (moodLoading) return;
    setMoodLoading(true);
    try {
      const res = await getAyahByCustomMood(text);
      if (!res) {
        setConnectionError("Couldn't load the verse. Please check your connection and try again.");
        return;
      }
      animateTo(1, () => selectMood('justHere', res.ayah, res.question, text));
    } finally {
      setMoodLoading(false);
    }
  };

  const handleLearnCustomText = async (text: string) => {
    if (moodLoading) return;
    setMoodLoading(true);
    try {
      if (apiLesson) {
        animateTo(1, () => selectMood('justHere', apiLesson.learnContent, apiLesson.mcq, text));
      } else {
        const res = await getAyahByCustomMood(text);
        if (!res) {
          setConnectionError("Couldn't load the verse. Please check your connection and try again.");
          return;
        }
        animateTo(1, () => selectMood('justHere', res.ayah, res.question, text));
      }
    } finally {
      setMoodLoading(false);
    }
  };

  const handleSkip = async () => {
    if (moodLoading) return;
    setMoodLoading(true);
    try {
      const res = await getAyahByMood('justHere');
      if (!res) {
        setConnectionError("Couldn't load the verse. Please check your connection and try again.");
        return;
      }
      animateTo(1, () => skipMood('justHere', res.ayah, res.question));
    } finally {
      setMoodLoading(false);
    }
  };

  const handleLearnMoodSelect = async (mood: Mood, customText?: string) => {
    if (moodLoading) return;
    setMoodLoading(true);
    try {
      if (apiLesson) {
        // Use the structured lesson content — mood is recorded but doesn't change the ayah
        animateTo(1, () => selectMood(mood, apiLesson.learnContent, apiLesson.mcq, customText));
      } else {
        // Lesson not yet loaded — fall back to mood-based ayah
        const res = await getAyahByMood(mood);
        if (!res) {
          setConnectionError("Couldn't load the verse. Please check your connection and try again.");
          return;
        }
        animateTo(1, () => selectMood(mood, res.ayah, res.question, customText));
      }
    } finally {
      setMoodLoading(false);
    }
  };

  const handleLearnSkip = async () => {
    if (moodLoading) return;
    setMoodLoading(true);
    try {
      if (apiLesson) {
        animateTo(1, () => skipMood('justHere', apiLesson.learnContent, apiLesson.mcq));
      } else {
        const res = await getAyahByMood('justHere');
        if (!res) {
          setConnectionError("Couldn't load the verse. Please check your connection and try again.");
          return;
        }
        animateTo(1, () => skipMood('justHere', res.ayah, res.question));
      }
    } finally {
      setMoodLoading(false);
    }
  };

  const handleNext = () => animateTo(1, nextStep);

  const handleComplete = () => {
    const today = new Date().toISOString().split('T')[0];

    // Optimistic updates — CompletionStep must see correct values on first mount
    const isNewDay = lastSessionDate !== today;
    const optimisticStreak = isNewDay ? firestoreStreak + 1 : firestoreStreak;
    const optimisticSessions = sessionsToday + 1;
    setFirestoreStreak(optimisticStreak);
    setSessionsToday(optimisticSessions);
    if (isNewDay) setLastSessionDate(today);

    animateTo(1, complete);

    if (uid) {
      const sessionKey = `${SESSION_KEY_PREFIX}_${uid}`;
      const streakStatus = getStreakStatus(lastSessionDate, firestoreStreak);
      const isStreakRecoveryComplete =
        streakStatus.status === 'recovery'
          ? recoveryTasksDoneToday >= streakStatus.tasksNeeded
          : false;

      incrementDailySession(uid).then((newCount) => {
        setSessionsToday(newCount);
        AsyncStorage.setItem(sessionKey, JSON.stringify({ date: today, count: newCount })).catch(() => {});
      }).catch(() => {});

      completeJourney(uid, state.xpEarned + 10, isStreakRecoveryComplete)
        .then(({ newStreak }) => setFirestoreStreak(newStreak))
        .catch(() => {});

      // Advance to the NEXT lesson on every completed learn session (not once
      // per calendar day) so "Keep Going" never repeats the same lesson.
      if (userGoal === 'learn') {
        incrementCurrentDay(uid).catch(() => {});
        setCurrentDay((d) => d + 1);
      }
    } else {
      setSessionsToday((s) => s + 1);
    }
  };

  const handleContinue = () => animateTo(-1, restart);
  const handleRestart = () => navigation.navigate('Home');

  const handleSpeakResult = (result: Parameters<typeof setSpeechResult>[0]) => {
    setSpeechResult(result);
    if (result.correct) setTimeout(() => animateTo(1, nextStep), 1800);
  };

  const handleSpeakSkip = () => animateTo(1, nextStep);

  const handleAnswer = async (index: number) => {
    const localCorrectIndex = state.question?.correctIndex;
    if (typeof localCorrectIndex === 'number' && localCorrectIndex >= 0) {
      // Mood quiz — answer key already returned by /api/mood-ayah (legacy path)
      const correct = index === localCorrectIndex;
      setMcqVerdict({ correctIndex: localCorrectIndex });
      setAnswer(index, correct);
      return;
    }
    // Lesson quiz — answer is server-validated via /api/lessons/check
    setAnswer(index, false); // optimistic: no XP yet; will be updated below if correct
    const result = await checkLessonAnswer(lessonKey, currentDay, index);
    if (result) {
      setMcqVerdict({ correctIndex: result.correctIndex });
      // If correct, award the 5 XP that SET_ANSWER didn't add. We just dispatch
      // SET_ANSWER again with the same index but correct=true — the reducer adds 5.
      // (Idempotent on selectedAnswer; only side effect is XP.)
      if (result.correct) setAnswer(index, true);
    }
  };

  // Reset verdict whenever we move into / out of MCQ step or restart
  useEffect(() => {
    if (state.step !== 'mcq') setMcqVerdict(null);
  }, [state.step]);

  const handleReadingComplete = (nextSurah: number, nextAyah: number) => {
    if (uid) updateQuranProgress(uid, nextSurah, nextAyah).catch(() => {});
    setQuranProgress({ surahNumber: nextSurah, ayahNumber: nextAyah });
    handleComplete();
  };

  const passThreshold = userLevel === 'newbie' ? 0.4 : userLevel === 'fluent' ? 0.7 : 0.6;
  const showTransliteration = userLevel !== 'fluent';
  const ayahCount = userTimePerDay === 10 ? 20 : userTimePerDay === 5 ? 12 : 8;

  // Learn users always get a guided lesson; its Quran text is fetched live
  // from the backend (Quran Foundation API) — see the fetchLesson effect.
  const isLessonDay = userGoal === 'learn';
  const lessonKey = levelToLessonKey(userLevel);
  const todayLesson = isLessonDay ? apiLesson : null;

  const showContinue = (): { show: boolean; label: string } => {
    switch (state.step) {
      case 'mood': return { show: false, label: '' };
      case 'ayah': return { show: true, label: ayahOnly ? 'Back to Home' : 'Continue' };
      case 'listen': return { show: true, label: 'Ready to speak' };
      case 'speak': return { show: false, label: '' };
      case 'mcq': return { show: true, label: 'Complete Session' };
      case 'reading': return { show: false, label: '' };
      case 'completion': return { show: false, label: '' };
      default: return { show: false, label: '' };
    }
  };

  const handleContinuePress = () => {
    if (ayahOnly && state.step === 'ayah') { restart(); navigation.navigate('Home'); return; }
    if (state.step === 'mcq') handleComplete();
    else handleNext();
  };

  const isContinueDisabled = () => {
    if (state.step === 'mcq') return state.selectedAnswer === undefined;
    return false;
  };

  const { show: showBtn, label: btnLabel } = showContinue();
  const isCompletion = state.step === 'completion';

  // Progress bar width: stepIndex out of (totalSteps - 1)
  const progressPct = totalSteps > 1 ? Math.min((stepIndex / (totalSteps - 1)) * 100, 100) : 0;

  const styles = useMemo(() => StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    container: { flex: 1, backgroundColor: colors.bg },

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
      backgroundColor: colors.surfaceDark,
      alignItems: 'center',
      justifyContent: 'center',
    },
    progressTrack: {
      flex: 1,
      height: 12,
      backgroundColor: colors.surfaceDark,
      borderRadius: 6,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 6,
    },
    xpBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.accentLight,
      borderRadius: RADIUS.full,
      paddingHorizontal: 10,
      paddingVertical: 5,
      minWidth: 52,
      justifyContent: 'center',
    },
    xpText: {
      color: colors.accentDark,
      fontSize: 13,
      fontWeight: '800',
    },

    skipHeaderBtn: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: RADIUS.full,
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.5)',
      borderBottomWidth: 4,
      borderBottomColor: `${colors.primary}55`,
    },
    skipHeaderBtnDisabled: { opacity: 0.35 },
    skipHeaderBtnText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
    skipHeaderBtnTextDisabled: { color: colors.textMuted },

    stepArea: { flex: 1 },
    loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    footer: {
      paddingHorizontal: 16,
      paddingBottom: 8,
      paddingTop: 0,
    },
    continueBtn: {
      backgroundColor: colors.primary,
      borderRadius: RADIUS.xl,
      paddingVertical: 17,
      alignItems: 'center',
      ...SHADOW.glow(colors.primary),
    },
    continueBtnDisabled: {
      backgroundColor: colors.primary,
      borderRadius: RADIUS.xl,
      paddingVertical: 17,
      alignItems: 'center',
      opacity: 0.38,
    },
    continueBtnText: {
      color: colors.white,
      fontSize: 17,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    continueBtnTextDisabled: {
      color: colors.white,
    },
  }), [colors]);

  const renderStep = () => {
    if (!profileLoaded) {
      return (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }
    switch (state.step) {
      case 'mood':
        if (isLessonDay && !ayahOnly && (lessonLoading || (!apiLesson && profileLoaded))) {
          return (
            <View style={styles.loadingCenter}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          );
        }
        return (
          <MoodSelection
            onSelect={isLessonDay && !ayahOnly ? handleLearnMoodSelect : handleMoodSelect}
            onCustomText={isLessonDay && !ayahOnly ? handleLearnCustomText : handleCustomText}
            loading={moodLoading}
          />
        );

      case 'ayah': return state.ayah ? (
        <AyahDisplay
          ayah={state.ayah}
          uid={uid ?? undefined}
          mood={state.mood ?? null}
          customMoodText={state.customMoodText ?? null}
        />
      ) : null;
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
        <MCQQuestion
          key={`mcq-${currentDay}-${state.question.question}`}
          question={state.question}
          selectedAnswer={state.selectedAnswer}
          verdict={mcqVerdict}
          onAnswer={handleAnswer}
        />
      ) : null;
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
          streak={firestoreStreak}
          lastSessionDate={lastSessionDate}
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
      {connectionError && (
        <Pressable
          onPress={() => setConnectionError(null)}
          style={{
            position: 'absolute', bottom: 32, left: 16, right: 16, zIndex: 99,
            backgroundColor: colors.card,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.cardBorder,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            shadowColor: '#000',
            shadowOpacity: 0.35,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 10,
          }}
        >
          <View style={{ width: 6, height: '100%', backgroundColor: colors.error ?? '#ef4444', borderRadius: 3, alignSelf: 'stretch' }} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700' }}>Connection issue</Text>
            <Text style={{ color: colors.textSub, fontSize: 12, lineHeight: 17 }}>{connectionError}</Text>
          </View>
          <Text style={{ color: colors.textMuted, fontSize: 18, lineHeight: 20 }}>×</Text>
        </Pressable>
      )}
      <View style={styles.container}>

        {/* Duolingo-style header */}
        {!isCompletion && (
          <View style={styles.header}>
            <Pressable
              onPress={() => { navigation.navigate('Home'); }}
              hitSlop={12}
              style={styles.closeBtn}
            >
              <X size={22} color={colors.textMuted} />
            </Pressable>

            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, { width: `${progressPct}%` }]} />
            </View>

            {state.step === 'mood' ? (
              <Pressable
                onPress={() => { triggerHaptic(hapticsEnabled, 'light'); if (isLessonDay && !ayahOnly) handleLearnSkip(); else handleSkip(); }}
                disabled={ayahOnly}
                hitSlop={8}
                style={[styles.skipHeaderBtn, ayahOnly && styles.skipHeaderBtnDisabled]}
              >
                <Text style={[styles.skipHeaderBtnText, ayahOnly && styles.skipHeaderBtnTextDisabled]}>
                  Skip
                </Text>
              </Pressable>
            ) : (
              <View />
            )}
          </View>
        )}

        {/* Step content */}
        <Animated.View style={[styles.stepArea, { transform: [{ translateX: slideAnim }] }]}>
          {renderStep()}
        </Animated.View>

        {/* Continue button */}
        {showBtn && (
          <View style={styles.footer}>
            <ContinueButton label={btnLabel} onPress={handleContinuePress} disabled={isContinueDisabled()} styles={styles} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function ContinueButton({ label, onPress, disabled = false, styles }: { label: string; onPress: () => void; disabled?: boolean; styles: any }) {
  const [pressed, setPressed] = useState(false);
  const { hapticsEnabled } = useTheme();
  return (
    <Pressable
      onPressIn={() => { if (!disabled) setPressed(true); }}
      onPressOut={() => setPressed(false)}
      onPress={disabled ? undefined : () => { triggerHaptic(hapticsEnabled, 'medium'); onPress(); }}
      style={[
        styles.continueBtn,
        disabled ? styles.continueBtnDisabled : [DEPTH.button, pressed && DEPTH.buttonPressed],
      ]}
    >
      <Text style={styles.continueBtnText}>{label}</Text>
    </Pressable>
  );
}
