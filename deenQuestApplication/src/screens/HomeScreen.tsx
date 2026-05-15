import AsyncStorage from '@react-native-async-storage/async-storage';
import { AlertTriangle, BookOpen, Check, ChevronDown, ChevronRight, ChevronUp, CircleCheck, Flame, Moon, X, Zap } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { completeTask, getDailySessionCount, getUserProfile, getUserTasksForDate, resetStreak } from '../lib/firestore';
import { cancelStreakReminder, scheduleStreakReminder } from '../lib/notifications';
import { getTodaysTasks, Task } from '../lib/tasks-data';
import { getStreakStatus } from '../lib/streakUtils';
import { COLORS, DEPTH, RADIUS, SHADOW } from '../theme';

const SESSION_KEY_PREFIX = '@deenquest_daily_sessions';

interface Props {
  onStartLesson: (resume: boolean) => void;
  onGetAyah: () => void;
}

export default function HomeScreen({ onStartLesson, onGetAyah }: Props) {
  const { uid, user } = useAuth();
  const [streak, setStreak] = useState(0);
  const [lastSessionDate, setLastSessionDate] = useState<string | null>(null);
  const [xp, setXp] = useState(0);
  const [goal, setGoal] = useState<string | null>(null);
  const [quranProgress, setQuranProgress] = useState<{ surahNumber: number; ayahNumber: number } | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);
  const [lessonPressed, setLessonPressed] = useState(false);
  const [ayahPressed, setAyahPressed] = useState(false);
  const [sessionsToday, setSessionsToday] = useState(0);
  const [hasInProgress, setHasInProgress] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [showWeekly, setShowWeekly] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const loadData = useCallback(async () => {
    setTasks(getTodaysTasks());
    if (!uid) return;
    try {
      const [profile, userTasks] = await Promise.all([
        getUserProfile(uid),
        getUserTasksForDate(uid, today),
      ]);
      if (profile) {
        const currentStreak = profile.streak ?? 0;
        const lastDate = profile.lastSessionDate ?? null;
        const status = getStreakStatus(lastDate, currentStreak);
        if (status.status === 'broken' && currentStreak !== 0) {
          resetStreak(uid).catch(() => {});
          setStreak(0);
        } else {
          setStreak(currentStreak);
        }
        setXp(profile.xp ?? 0);
        setLastSessionDate(lastDate);
        setGoal(profile.goal ?? null);
        setQuranProgress(profile.quranProgress ?? null);
      }
      setCompletedIds(new Set(userTasks.filter((t) => t.completed).map((t) => t.taskId)));
    } catch {}
    setLoadingTasks(false);
  }, [uid, today]);

  useEffect(() => { loadData(); }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      if (!uid) return;
      const sessionKey = `${SESSION_KEY_PREFIX}_${uid}`;
      // Fast local read first
      AsyncStorage.getItem(sessionKey).then((raw) => {
        if (!raw) { setSessionsToday(0); return; }
        try {
          const { date, count } = JSON.parse(raw);
          const todayStr = new Date().toISOString().split('T')[0];
          setSessionsToday(date === todayStr ? count : 0);
        } catch {}
      });
      // Authoritative Firestore read (cross-device)
      getDailySessionCount(uid).then((count) => {
        setSessionsToday(count);
        const todayStr = new Date().toISOString().split('T')[0];
        AsyncStorage.setItem(sessionKey, JSON.stringify({ date: todayStr, count })).catch(() => {});
      }).catch(() => {});

      // Check if there's an in-progress journey step saved
      AsyncStorage.getItem(`@deenquest_journey_${uid}`).then((raw) => {
        if (!raw) { setHasInProgress(false); return; }
        try {
          const saved = JSON.parse(raw);
          const mid = saved.step && saved.step !== 'mood' && saved.step !== 'completion';
          setHasInProgress(mid);
        } catch { setHasInProgress(false); }
      });

      // Refresh streak and profile data every time the screen regains focus
      // (e.g. after returning from JourneyScreen where streak may have changed)
      loadData();
    }, [uid, loadData])
  );

  // Schedule or cancel the streak reminder whenever session/streak state is known
  useEffect(() => {
    if (loadingTasks) return;
    if (sessionsToday > 0) {
      cancelStreakReminder().catch(() => {});
    } else {
      scheduleStreakReminder(streak).catch(() => {});
    }
  }, [streak, sessionsToday, loadingTasks]);

  const handleComplete = async (task: Task) => {
    if (!uid || completedIds.has(task.id) || completing) return;
    setCompleting(task.id);
    setCompletedIds((prev) => new Set([...prev, task.id]));
    setXp((prev) => prev + task.xpReward);
    // Cancel the streak reminder as soon as any task is completed
    cancelStreakReminder().catch(() => {});
    const status = getStreakStatus(lastSessionDate, streak);
    const isRecoveryTask =
      status.status === 'recovery' &&
      completedIds.size < status.tasksNeeded;
    try {
      await completeTask(uid, task.id, today, task.xpReward, isRecoveryTask);
    } catch {}
    setCompleting(null);
  };

  const displayName = user?.displayName?.split(' ')[0] ?? 'there';
  const streakStatus = getStreakStatus(lastSessionDate, streak);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Greeting Header */}
        <View style={styles.greetingHeader}>
          <Text style={styles.greetingSub}>Assalamu Alaikum</Text>
          <Text style={styles.greetingName}>{displayName} ✦</Text>
        </View>
        {/* Streak Week Widget */}
        {(() => {
          const today = new Date();
          const dow = today.getDay();
          const monFirst = (dow + 6) % 7;
          const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
          const lastDate = lastSessionDate ? new Date(lastSessionDate) : null;
          const streakStart = lastDate ? new Date(lastDate) : null;
          if (streakStart && lastDate) streakStart.setDate(lastDate.getDate() - Math.max(streak - 1, 0));
          const weekDays = DAY_SHORT.map((label, i) => {
            const d = new Date(today);
            d.setDate(today.getDate() - monFirst + i);
            d.setHours(0, 0, 0, 0);
            const todayMidnight = new Date(today); todayMidnight.setHours(0, 0, 0, 0);
            const isFuture = d > todayMidnight;
            const isToday = d.getTime() === todayMidnight.getTime();
            if (!lastDate || !streakStart) return { label, completed: false, missed: false, isFuture, isToday };
            const s = new Date(streakStart); s.setHours(0, 0, 0, 0);
            const e = new Date(lastDate); e.setHours(0, 0, 0, 0);
            const completed = d >= s && d <= e;
            return { label, completed, missed: !completed && d < todayMidnight, isFuture, isToday };
          });
          return (
            <View style={streakWidgetStyles.card}>
              <View style={streakWidgetStyles.header}>
                <View style={streakWidgetStyles.col}>
                  <View style={streakWidgetStyles.flameCircle}>
                    <Flame size={20} color="#FF6B35" fill="#FF6B35" />
                  </View>
                  <View>
                    <Text style={streakWidgetStyles.label}>STREAK</Text>
                    <Text style={streakWidgetStyles.value} numberOfLines={1}>{streak} <Text style={streakWidgetStyles.unit}>Days</Text></Text>
                    <Text style={streakWidgetStyles.tagline}>Keep going!</Text>
                  </View>
                </View>
                <View style={streakWidgetStyles.vDivider} />
                <View style={streakWidgetStyles.col}>
                  <View style={streakWidgetStyles.zapCircle}>
                    <Zap size={20} color={COLORS.primary} fill={COLORS.primary} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={streakWidgetStyles.label} numberOfLines={1}>XP</Text>
                    <Text style={[streakWidgetStyles.value, { color: COLORS.primaryDark }]} numberOfLines={1}>{xp} <Text style={streakWidgetStyles.unit}>XP</Text></Text>
                    <Text style={[streakWidgetStyles.tagline, { color: COLORS.primary }]} numberOfLines={1}>Keep growing!</Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => setShowWeekly(v => !v)}
                  style={streakWidgetStyles.chevronBtn}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={showWeekly ? "Collapse weekly streak view" : "Expand weekly streak view"}
                  accessibilityState={{ expanded: showWeekly }}
                >
                  {showWeekly
                    ? <ChevronDown size={18} color={COLORS.textMuted} />
                    : <ChevronRight size={18} color={COLORS.textMuted} />}
                </Pressable>
              </View>
              {showWeekly && (
                <>
                  <View style={streakWidgetStyles.divider} />
                  <View style={streakWidgetStyles.weekRow}>
                    {weekDays.map((day, i) => (
                      <View key={i} style={streakWidgetStyles.dayCol}>
                        <View style={[
                          streakWidgetStyles.dayCircle,
                          day.completed && streakWidgetStyles.dayCircleDone,
                          day.missed && streakWidgetStyles.dayCircleMissed,
                          day.isToday && !day.completed && streakWidgetStyles.dayCircleToday,
                        ]}>
                          {day.completed && <CircleCheck size={16} color="#fff" fill="#f97316" />}
                          {day.missed && <X size={14} color="#f87171" strokeWidth={2.5} />}
                        </View>
                        <Text style={streakWidgetStyles.dayLabel}>{day.label.substring(0, 3)}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>
          );
        })()}

        {/* Streak recovery / broken banner */}
        {streakStatus.status === 'recovery' && (
          <View style={styles.recoveryBanner}>
            <AlertTriangle size={16} color="#fb923c" />
            <Text style={styles.recoveryText}>
              {streakStatus.tasksNeeded === 1
                ? `Complete 1 bonus deed to save your ${streakStatus.streak}-day streak`
                : `Complete all 3 bonus deeds to save your ${streakStatus.streak}-day streak`}
            </Text>
          </View>
        )}
        {streakStatus.status === 'broken' && (
          <View style={[styles.recoveryBanner, styles.brokenBanner]}>
            <AlertTriangle size={16} color="#f87171" />
            <Text style={[styles.recoveryText, styles.brokenText]}>
              Streak lost. Start fresh today — every journey begins with one step.
            </Text>
          </View>
        )}

        {/* Start Today's Lesson card */}
        <ImageBackground
          source={require('../../elementsApp/homecardBGmoon.png')}
          style={styles.lessonCard}
          imageStyle={styles.lessonCardBg}
        >
          <View style={styles.lessonCardContent}>
            {sessionsToday >= 3 ? (
              <>
                {/* Sessions maxed — show Get Ayah mode */}
                <View style={styles.lessonBadge}>
                  <Moon size={11} color={COLORS.primary} />
                  <Text style={styles.lessonBadgeText}>3/3 sessions done</Text>
                </View>
                <View style={styles.lessonRow}>
                  <Image
                    source={require('../../elementsApp/celebrating-removebg-preview.png')}
                    style={styles.lessonChar}
                  />
                  <View style={styles.lessonText}>
                    <Text style={styles.lessonTitle}>Amazing work today!</Text>
                    <Text style={styles.lessonSub}>Next session unlocks tomorrow. Still want an ayah?</Text>
                  </View>
                </View>
                <Pressable
                  onPressIn={() => setAyahPressed(true)}
                  onPressOut={() => setAyahPressed(false)}
                  onPress={onGetAyah}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Get a personalised Ayah"
                  style={[styles.lessonBtn, styles.lessonBtnAyah, DEPTH.button, ayahPressed && DEPTH.buttonPressed]}
                >
                  <Text style={styles.lessonBtnText}>Get an Ayah</Text>
                </Pressable>
              </>
            ) : (
              <>
                {/* Normal flow */}
                <View style={styles.lessonBadge}>
                  <Zap size={11} color={COLORS.primary} />
                  <Text style={styles.lessonBadgeText}>
                    {sessionsToday > 0 ? `${3 - sessionsToday} session${3 - sessionsToday !== 1 ? 's' : ''} left today` : '3-min lesson'}
                  </Text>
                </View>
                <View style={styles.lessonRow}>
                  <Image
                    source={require('../../elementsApp/waving_onboarding-removebg-preview.png')}
                    style={styles.lessonChar}
                  />
                  <View style={styles.lessonText}>
                    <Text style={styles.lessonTitle}>
                      {hasInProgress ? 'Continue Your Journey' : 'Start Today\'s Quran Journey'}
                    </Text>
                    <Text style={styles.lessonSub}>
                      {hasInProgress
                        ? 'Pick up where you left off'
                        : sessionsToday > 0
                          ? 'Another session, another step closer'
                          : 'Personalised ayah based on your mood'}
                    </Text>
                    {goal === 'complete' && quranProgress && (
                      <View style={styles.progressPill}>
                        <BookOpen size={11} color="#a78bfa" />
                        <Text style={styles.progressPillText}>Surah {quranProgress.surahNumber}, Ayah {quranProgress.ayahNumber}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Pressable
                  onPressIn={() => setLessonPressed(true)}
                  onPressOut={() => setLessonPressed(false)}
                  onPress={() => {
                    if (streakStatus.status === 'recovery') {
                      setShowRecoveryModal(true);
                    } else {
                      onStartLesson(hasInProgress);
                    }
                  }}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={
                    hasInProgress ? 'Continue your Quran journey' :
                    sessionsToday > 0 ? 'Start another Quran session' :
                    'Begin today\'s Quran journey'
                  }
                  style={[styles.lessonBtn, DEPTH.button, lessonPressed && DEPTH.buttonPressed]}
                >
                  <Text style={styles.lessonBtnText}>
                    {hasInProgress ? 'Continue' : sessionsToday > 0 ? 'Keep Going' : 'Begin Now'}
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </ImageBackground>

        {/* Today's Tasks */}
        <View style={styles.sectionHeader}>
          <BookOpen size={16} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Today's Tasks</Text>
          <Text style={styles.sectionSub}>Earn XP for each deed</Text>
        </View>

        {loadingTasks ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
        ) : (
          <View style={styles.taskList}>
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                done={completedIds.has(task.id)}
                completing={completing === task.id}
                onComplete={() => handleComplete(task)}
              />
            ))}
          </View>
        )}

        {!loadingTasks && completedIds.size >= tasks.length && tasks.length > 0 && (
          <View style={styles.allDoneBanner}>
            <Image source={require('../../elementsApp/celebrating-removebg-preview.png')} style={styles.allDoneChar} />
            <View>
              <Text style={styles.allDoneTitle}>All done today!</Text>
              <Text style={styles.allDoneSub}>Come back tomorrow for more</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Recovery Modal */}
      <Modal
        visible={showRecoveryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRecoveryModal(false)}
      >
        <Pressable style={modalStyles.overlay} onPress={() => setShowRecoveryModal(false)}>
          <Pressable style={modalStyles.sheet} onPress={(e) => e.stopPropagation()}>
            {/* Icon */}
            <View style={modalStyles.iconCircle}>
              <Flame size={28} color="#fb923c" fill="#fb923c" />
            </View>

            {/* Text */}
            <Text style={modalStyles.title}>Save Your Streak</Text>
            <Text style={modalStyles.body}>
              Complete{' '}
              <Text style={modalStyles.highlight}>
                {streakStatus.status === 'recovery'
                  ? `${streakStatus.tasksNeeded} bonus deed${streakStatus.tasksNeeded === 1 ? '' : 's'}`
                  : 'bonus deeds'}
              </Text>{' '}
              to protect your{' '}
              <Text style={modalStyles.highlight}>
                {streakStatus.status === 'recovery' ? streakStatus.streak : streak}-day streak
              </Text>.
            </Text>

            {/* Buttons */}
            <Pressable
              style={modalStyles.primaryBtn}
              onPress={() => setShowRecoveryModal(false)}
            >
              <Text style={modalStyles.primaryBtnText}>Finish bonus deeds</Text>
            </Pressable>

            <Pressable
              style={modalStyles.ghostBtn}
              onPress={() => { setShowRecoveryModal(false); onStartLesson(false); }}
            >
              <Text style={modalStyles.ghostBtnText}>Proceed anyway</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

    </SafeAreaView>
  );
}


function TaskCard({ task, done, completing, onComplete }: {
  task: Task; done: boolean; completing: boolean; onComplete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const CATEGORY_COLORS: Record<string, string> = {
    reading: '#7C3AED', prayer: '#059669', charity: '#F59E0B',
    memorization: '#2563EB', character: '#DC2626', kindness: '#EC4899',
    listening: '#0891B2', dawah: '#7C3AED', reflection: '#6D28D9',
  };
  const catColor = CATEGORY_COLORS[task.category] ?? COLORS.primary;

  return (
    <View style={[styles.taskCard, done && styles.taskCardDone]}>
      <View style={styles.taskRow}>
        <Pressable
          onPress={onComplete}
          disabled={done || completing}
          style={styles.taskCheck}
          accessible={true}
          accessibilityRole="checkbox"
          accessibilityLabel={done ? `${task.title} completed` : `Mark ${task.title} as complete`}
          accessibilityState={{ checked: done, disabled: done || completing }}
        >
          {completing
            ? <ActivityIndicator size="small" color={COLORS.primary} />
            : done
              ? <View style={styles.checkboxDone}><Check size={14} color={COLORS.primary} strokeWidth={3} /></View>
              : <View style={styles.checkboxEmpty} />}
        </Pressable>

        <Pressable
          style={styles.taskBody}
          onPress={() => setExpanded(v => !v)}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`${task.title}. +${task.xpReward} XP. ${expanded ? 'Collapse' : 'Expand'} details`}
          accessibilityState={{ expanded }}
        >
          <View style={styles.taskTitleRow}>
            <Text style={[styles.taskTitle, done && styles.taskTitleDone]}>{task.title}</Text>
            {expanded
              ? <ChevronUp size={16} color={COLORS.textMuted} />
              : <ChevronDown size={16} color={COLORS.textMuted} />}
          </View>
          <Text style={styles.taskDesc} numberOfLines={expanded ? undefined : 1}>{task.description}</Text>
          <View style={styles.taskMeta}>
            <Text style={styles.taskRef}>Quran {task.ayahRef}</Text>
            <View style={[styles.xpPill, done && styles.xpPillDone]}>
              <Zap size={11} color={done ? COLORS.primary : COLORS.textMuted} />
              <Text style={[styles.xpText, done && styles.xpTextDone]}>+{task.xpReward} XP</Text>
            </View>
          </View>
        </Pressable>
      </View>

      {expanded && (
        <View style={styles.taskDetail}>
          <View style={styles.taskDetailSection}>
            <Text style={styles.taskDetailLabel}>What Quran says</Text>
            <Text style={styles.taskDetailText}>{task.quranGuidance}</Text>
          </View>
          <View style={styles.taskDetailDivider} />
          <View style={styles.taskDetailSection}>
            <Text style={styles.taskDetailLabel}>Benefit & reward</Text>
            <Text style={styles.taskDetailText}>{task.deedBenefit}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { paddingBottom: 100, paddingTop: 12 },

  greetingHeader: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8 },
  greetingSub: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },
  greetingName: { fontSize: 24, color: COLORS.text, fontWeight: '800' },


  lessonCard: { marginHorizontal: 20, marginTop: 12, borderRadius: RADIUS.xl, overflow: 'hidden', marginBottom: 24, backgroundColor: COLORS.bgDeep, ...SHADOW.strong },
  lessonCardBg: { borderRadius: RADIUS.xl, opacity: 0.7 },
  lessonCardContent: { padding: 16, gap: 12 },
  lessonBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.85)', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  lessonBadgeText: { color: COLORS.primary, fontSize: 11, fontWeight: '700' },
  lessonRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lessonChar: { width: 90, height: 110, resizeMode: 'contain' },
  lessonText: { flex: 1, gap: 4 },
  lessonTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800', lineHeight: 24, letterSpacing: -0.3 },
  lessonSub: { color: COLORS.textSub, fontSize: 12 },
  progressPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(167,139,250,0.15)',
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: 'rgba(167,139,250,0.4)',
  },
  progressPillText: { color: '#a78bfa', fontSize: 11, fontWeight: '700' },
  lessonBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.xl,
    paddingVertical: 15, alignItems: 'center',
  },
  lessonBtnAyah: { backgroundColor: '#6D28D9' },
  lessonBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, marginBottom: 12 },
  sectionTitle: { color: COLORS.text, fontSize: 17, fontWeight: '800', flex: 1 },
  sectionSub: { color: COLORS.textMuted, fontSize: 12 },

  taskList: { paddingHorizontal: 16, gap: 10 },
  taskCard: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.xl,
    borderWidth: 1.5, borderColor: COLORS.cardBorder,
    padding: 14, ...SHADOW.card,
  },
  taskCardDone: { backgroundColor: COLORS.primaryBg, borderColor: `${COLORS.primary}44` },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  taskCheck: { padding: 2 },
  checkboxDone: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: COLORS.primaryBg,
    borderWidth: 2, borderColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxEmpty: {
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 2, borderColor: COLORS.cardBorder,
  },
  taskBody: { flex: 1, gap: 4 },
  taskTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4 },
  taskTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700', flex: 1 },
  taskTitleDone: { color: COLORS.textMuted, textDecorationLine: 'line-through' },
  taskDesc: { color: COLORS.textSub, fontSize: 12 },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  catPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.full, borderWidth: 1 },
  catText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
  taskRef: { color: COLORS.textMuted, fontSize: 11 },
  xpPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: COLORS.surfaceDark, paddingHorizontal: 8,
    paddingVertical: 5, borderRadius: RADIUS.full,
    marginLeft: 'auto',
  },
  xpPillDone: { backgroundColor: COLORS.primaryBg },
  xpText: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700' },
  xpTextDone: { color: COLORS.primary },
  taskDetail: {
    marginTop: 10, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: COLORS.cardBorder,
    gap: 8,
  },
  taskDetailSection: { gap: 3 },
  taskDetailLabel: { color: COLORS.primary, fontSize: 11, fontWeight: '700' },
  taskDetailText: { color: COLORS.textSub, fontSize: 12, lineHeight: 18 },
  taskDetailDivider: { height: 1, backgroundColor: COLORS.cardBorder },

  allDoneBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginHorizontal: 16, marginTop: 16,
    backgroundColor: COLORS.primaryBg, borderRadius: RADIUS.xl,
    padding: 16, borderWidth: 1, borderColor: `${COLORS.primary}33`,
  },
  allDoneChar: { width: 60, height: 60, resizeMode: 'contain' },
  allDoneTitle: { color: COLORS.primaryDark, fontSize: 16, fontWeight: '800' },
  allDoneSub: { color: COLORS.textSub, fontSize: 13, marginTop: 2 },
  recoveryBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: 'rgba(251,146,60,0.12)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(251,146,60,0.3)',
    paddingHorizontal: 14, paddingVertical: 12, marginHorizontal: 16, marginBottom: 4,
  },
  recoveryText: { flex: 1, color: '#fdba74', fontSize: 13, fontWeight: '600', lineHeight: 18 },
  brokenBanner: { backgroundColor: 'rgba(248,113,113,0.12)', borderColor: 'rgba(248,113,113,0.3)' },
  brokenText: { color: '#fca5a5' },
});

const streakWidgetStyles = StyleSheet.create({
  card: {
    marginHorizontal: 16, marginBottom: 4, marginTop: 4,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.cardBorder,
    borderBottomWidth: 3, borderBottomColor: COLORS.cardBorder,
    padding: 12, gap: 10,
  },
  header: { flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  col: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 },
  flameCircle: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#FFF0EB',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  zapCircle: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: COLORS.primaryBg,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  vDivider: { width: 1, height: 44, backgroundColor: COLORS.cardBorder, marginHorizontal: 8, flexShrink: 0 },
  chevronBtn: { padding: 4, marginLeft: 4 },
  label: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 0.8 },
  value: { fontSize: 18, fontWeight: '800', color: COLORS.text, lineHeight: 24 },
  unit: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  tagline: { fontSize: 10, fontWeight: '700', color: '#FF6B35', marginTop: 1 },
  divider: { height: 1, backgroundColor: COLORS.cardBorder },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', gap: 4 },
  dayCircle: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 2, borderColor: COLORS.cardBorder,
    backgroundColor: COLORS.surfaceDark,
    alignItems: 'center', justifyContent: 'center',
  },
  dayCircleDone: { backgroundColor: '#f97316', borderColor: '#fb923c' },
  dayCircleMissed: { backgroundColor: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.4)' },
  dayCircleToday: { borderColor: '#a855f7' },
  dayLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 32,
    paddingHorizontal: 16,
  },
  sheet: {
    width: '100%',
    backgroundColor: '#1e1040',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(251,146,60,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(251,146,60,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: { color: '#fff', fontSize: 20, fontWeight: '800', textAlign: 'center' },
  body: { color: 'rgba(255,255,255,0.6)', fontSize: 14, textAlign: 'center', lineHeight: 21 },
  highlight: { color: '#fdba74', fontWeight: '700' },
  primaryBtn: {
    width: '100%',
    backgroundColor: '#f97316',
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  ghostBtn: { width: '100%', paddingVertical: 12, alignItems: 'center' },
  ghostBtnText: { color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: '600' },
});
