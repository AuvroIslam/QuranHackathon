import AsyncStorage from '@react-native-async-storage/async-storage';
import { BookOpen, CheckCircle, Circle, Flame, Moon, Star, Zap } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { completeTask, getUserProfile, getUserTasksForDate } from '../lib/firestore';
import { getTodaysTasks, Task } from '../lib/tasks-data';
import { COLORS, DEPTH, RADIUS, SHADOW } from '../theme';

const SESSION_KEY = '@deenquest_daily_sessions';

interface Props {
  onStartLesson: () => void;
  onGetAyah: () => void;
}

export default function HomeScreen({ onStartLesson, onGetAyah }: Props) {
  const { uid, user } = useAuth();
  const [streak, setStreak] = useState(0);
  const [xp, setXp] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);
  const [lessonPressed, setLessonPressed] = useState(false);
  const [ayahPressed, setAyahPressed] = useState(false);
  const [sessionsToday, setSessionsToday] = useState(0);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    AsyncStorage.getItem(SESSION_KEY).then((raw) => {
      if (!raw) return;
      try {
        const { date, count } = JSON.parse(raw);
        if (date === today) setSessionsToday(count);
      } catch {}
    });
  }, [today]);

  const loadData = useCallback(async () => {
    setTasks(getTodaysTasks());
    if (!uid) return;
    try {
      const [profile, userTasks] = await Promise.all([
        getUserProfile(uid),
        getUserTasksForDate(uid, today),
      ]);
      if (profile) {
        setStreak(profile.streak ?? 0);
        setXp(profile.xp ?? 0);
      }
      setCompletedIds(new Set(userTasks.filter((t) => t.completed).map((t) => t.taskId)));
    } catch {}
    setLoadingTasks(false);
  }, [uid, today]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleComplete = async (task: Task) => {
    if (!uid || completedIds.has(task.id) || completing) return;
    setCompleting(task.id);
    setCompletedIds((prev) => new Set([...prev, task.id]));
    setXp((prev) => prev + task.xpReward);
    try {
      await completeTask(uid, task.id, today, task.xpReward);
    } catch {}
    setCompleting(null);
  };

  const stars = xp * 2;
  const displayName = user?.displayName?.split(' ')[0] ?? 'there';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brand}>
            <Image source={require('../../assets/logo.png')} style={styles.logo} />
            <Text style={styles.brandName}>DeenQuest</Text>
          </View>
          <Text style={styles.greeting}>مرحباً، {displayName}</Text>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatCard icon={<Flame size={20} color="#FF6B35" fill="#FF6B35" />} value={streak} label="Streak" bg="#FFF0EB" color="#FF6B35" />
          <StatCard icon={<Star size={20} color={COLORS.accent} fill={COLORS.accent} />} value={stars} label="Hasanat" bg="#FFFBEB" color={COLORS.accentDark} />
          <StatCard icon={<Zap size={20} color={COLORS.primary} fill={COLORS.primary} />} value={xp} label="XP" bg={COLORS.primaryBg} color={COLORS.primaryDark} />
        </View>

        {/* Start Today's Lesson card */}
        <ImageBackground
          source={require('../../elementsApp/cardBg1.png')}
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
                  style={[styles.lessonBtn, styles.lessonBtnAyah, DEPTH.button, ayahPressed && DEPTH.buttonPressed]}
                >
                  <Text style={styles.lessonBtnText}>Get an Ayah →</Text>
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
                    <Text style={styles.lessonTitle}>Start Today's Quran Journey</Text>
                    <Text style={styles.lessonSub}>Personalised ayah based on your mood</Text>
                  </View>
                </View>
                <Pressable
                  onPressIn={() => setLessonPressed(true)}
                  onPressOut={() => setLessonPressed(false)}
                  onPress={onStartLesson}
                  style={[styles.lessonBtn, DEPTH.button, lessonPressed && DEPTH.buttonPressed]}
                >
                  <Text style={styles.lessonBtnText}>Begin Now →</Text>
                </Pressable>
              </>
            )}
          </View>
        </ImageBackground>

        {/* Today's Tasks */}
        <View style={styles.sectionHeader}>
          <BookOpen size={16} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Today's Tasks</Text>
          <Text style={styles.sectionSub}>Complete all 3 for bonus XP</Text>
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
    </SafeAreaView>
  );
}

function StatCard({ icon, value, label, bg, color }: {
  icon: React.ReactNode; value: number; label: string; bg: string; color: string;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: bg }]}>
      {icon}
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function TaskCard({ task, done, completing, onComplete }: {
  task: Task; done: boolean; completing: boolean; onComplete: () => void;
}) {
  const CATEGORY_COLORS: Record<string, string> = {
    reading: '#7C3AED', prayer: '#059669', charity: '#F59E0B',
    memorization: '#2563EB', character: '#DC2626', kindness: '#EC4899',
    listening: '#0891B2', dawah: '#7C3AED', reflection: '#6D28D9',
  };
  const catColor = CATEGORY_COLORS[task.category] ?? COLORS.primary;

  return (
    <View style={[styles.taskCard, done && styles.taskCardDone]}>
      <Pressable onPress={onComplete} disabled={done || completing} style={styles.taskCheck}>
        {completing
          ? <ActivityIndicator size="small" color={COLORS.primary} />
          : done
            ? <CheckCircle size={26} color={COLORS.primary} fill={COLORS.primaryBg} />
            : <Circle size={26} color={COLORS.cardBorder} />}
      </Pressable>

      <View style={styles.taskBody}>
        <Text style={[styles.taskTitle, done && styles.taskTitleDone]}>{task.title}</Text>
        <Text style={styles.taskDesc} numberOfLines={1}>{task.description}</Text>
        <View style={styles.taskMeta}>
          <View style={[styles.catPill, { backgroundColor: `${catColor}18`, borderColor: `${catColor}44` }]}>
            <Text style={[styles.catText, { color: catColor }]}>{task.category}</Text>
          </View>
          <Text style={styles.taskRef}>Quran {task.ayahRef}</Text>
        </View>
      </View>

      <View style={[styles.xpPill, done && styles.xpPillDone]}>
        <Zap size={11} color={done ? COLORS.primary : COLORS.textMuted} />
        <Text style={[styles.xpText, done && styles.xpTextDone]}>+{task.xpReward} XP</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { paddingBottom: 100 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo: { width: 30, height: 30, borderRadius: 8 },
  brandName: { color: COLORS.primaryDark, fontSize: 18, fontWeight: '800' },
  greeting: { color: COLORS.textSub, fontSize: 14, fontStyle: 'italic' },

  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingVertical: 12 },
  statCard: { flex: 1, borderRadius: RADIUS.xl, padding: 12, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '600' },

  lessonCard: { marginHorizontal: 20, borderRadius: RADIUS.xl, overflow: 'hidden', marginBottom: 24, backgroundColor: COLORS.bgDeep, ...SHADOW.strong },
  lessonCardBg: { borderRadius: RADIUS.xl, opacity: 1 },
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
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.card, borderRadius: RADIUS.xl,
    borderWidth: 1.5, borderColor: COLORS.cardBorder,
    padding: 14, gap: 12, ...SHADOW.card,
  },
  taskCardDone: { backgroundColor: COLORS.primaryBg, borderColor: `${COLORS.primary}44` },
  taskCheck: { padding: 2 },
  taskBody: { flex: 1, gap: 4 },
  taskTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
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
  },
  xpPillDone: { backgroundColor: COLORS.primaryBg },
  xpText: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700' },
  xpTextDone: { color: COLORS.primary },

  allDoneBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginHorizontal: 16, marginTop: 16,
    backgroundColor: COLORS.primaryBg, borderRadius: RADIUS.xl,
    padding: 16, borderWidth: 1, borderColor: `${COLORS.primary}33`,
  },
  allDoneChar: { width: 60, height: 60, resizeMode: 'contain' },
  allDoneTitle: { color: COLORS.primaryDark, fontSize: 16, fontWeight: '800' },
  allDoneSub: { color: COLORS.textSub, fontSize: 13, marginTop: 2 },
});
