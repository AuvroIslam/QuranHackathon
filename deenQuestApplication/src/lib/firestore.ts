import {
  doc, getDoc, setDoc, updateDoc, writeBatch,
  collection, query, where, getDocs, increment,
} from 'firebase/firestore';
import { db } from './firebase';
import type { UserTask } from './tasks-data';
import type { TimePerDay, UserGoal, UserLevel } from '../types';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  xp: number;
  streak: number;
  tasksCompleted: number;
  lastActive: string;
  lastSessionDate?: string;
  createdAt: string;
  goal?: UserGoal | null;
  level?: UserLevel | null;
  timePerDay?: TimePerDay | null;
  quranProgress?: { surahNumber: number; ayahNumber: number } | null;
  currentDay?: number;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as UserProfile) : null;
}

export async function getUserTasksForDate(uid: string, date: string): Promise<UserTask[]> {
  const q = query(
    collection(db, 'userTasks'),
    where('userId', '==', uid),
    where('date', '==', date)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as UserTask);
}

export async function completeTask(uid: string, taskId: string, date: string, xpReward: number, isStreakRecovery = false) {
  const userRef = doc(db, 'users', uid);
  const taskRef = doc(collection(db, 'userTasks'));
  const batch = writeBatch(db);
  batch.set(taskRef, { userId: uid, taskId, completed: true, date, ...(isStreakRecovery ? { isStreakRecovery: true } : {}) });
  batch.update(userRef, { xp: increment(xpReward), tasksCompleted: increment(1), lastActive: new Date().toISOString() });
  await batch.commit();
}

export async function addXP(uid: string, amount: number) {
  await updateDoc(doc(db, 'users', uid), {
    xp: increment(amount),
    lastActive: new Date().toISOString(),
  });
}

// Called on journey completion — persists XP, updates lastSessionDate, handles streak
export async function completeJourney(uid: string, xpEarned: number, isStreakRecoveryComplete = false) {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data();
  const today = new Date().toISOString().split('T')[0];
  const lastSessionDate: string = data.lastSessionDate ?? '';
  const currentStreak: number = data.streak ?? 0;

  let newStreak: number;
  if (lastSessionDate === today) {
    newStreak = currentStreak;
  } else if (!lastSessionDate) {
    newStreak = 1;
  } else {
    const missedDays = Math.floor(
      (new Date(today).getTime() - new Date(lastSessionDate).getTime()) / 86400000
    ) - 1;
    if (missedDays <= 0) {
      newStreak = currentStreak + 1;
    } else if ((missedDays === 1 || missedDays === 2) && isStreakRecoveryComplete) {
      newStreak = currentStreak;
    } else {
      newStreak = 1;
    }
  }

  await updateDoc(ref, {
    xp: increment(xpEarned),
    lastActive: new Date().toISOString(),
    lastSessionDate: today,
    streak: newStreak,
  });
}

export async function saveUserGoal(
  uid: string,
  goal: UserGoal,
  options: { level?: UserLevel; timePerDay?: TimePerDay }
) {
  const updates: Record<string, any> = { goal };
  if (goal === 'learn') {
    updates.level = options.level ?? null;
    updates.timePerDay = options.timePerDay ?? null;
  } else {
    updates.timePerDay = options.timePerDay ?? null;
    updates.quranProgress = { surahNumber: 1, ayahNumber: 1 };
  }
  await updateDoc(doc(db, 'users', uid), updates);
}

export async function incrementCurrentDay(uid: string) {
  await updateDoc(doc(db, 'users', uid), { currentDay: increment(1) });
}

// Switch time plan without touching quranProgress — progress is preserved
export async function updateUserPlan(
  uid: string,
  timePerDay: TimePerDay,
  level?: UserLevel
) {
  const updates: Record<string, any> = { timePerDay };
  if (level !== undefined) updates.level = level;
  await updateDoc(doc(db, 'users', uid), updates);
}

export async function updateQuranProgress(uid: string, surahNumber: number, ayahNumber: number) {
  await updateDoc(doc(db, 'users', uid), {
    quranProgress: { surahNumber, ayahNumber },
    lastActive: new Date().toISOString(),
  });
}

// --- Daily session tracking (stored in Firestore for cross-device sync) ---

export async function getDailySessionCount(uid: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return 0;
  const data = snap.data();
  if (data.sessionDate === today) return data.sessionsToday ?? 0;
  return 0;
}

export async function incrementDailySession(uid: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return 1;
  const data = snap.data();
  const isToday = data.sessionDate === today;
  const newCount = isToday ? (data.sessionsToday ?? 0) + 1 : 1;
  await updateDoc(ref, { sessionDate: today, sessionsToday: newCount });
  return newCount;
}

