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

export async function completeTask(uid: string, taskId: string, date: string, xpReward: number) {
  const userRef = doc(db, 'users', uid);
  const taskRef = doc(collection(db, 'userTasks'));
  const batch = writeBatch(db);
  batch.set(taskRef, { userId: uid, taskId, completed: true, date });
  batch.update(userRef, { xp: increment(xpReward), tasksCompleted: increment(1), lastActive: new Date().toISOString() });
  await batch.commit();
}

export async function addXP(uid: string, amount: number) {
  await updateDoc(doc(db, 'users', uid), {
    xp: increment(amount),
    lastActive: new Date().toISOString(),
  });
}

// Called on journey completion — persists XP and increments streak if new day
export async function completeJourney(uid: string, xpEarned: number) {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const today = new Date().toISOString().split('T')[0];
  const lastActive: string = (snap.data().lastActive ?? '').split('T')[0];
  const isNewDay = lastActive !== today;
  const updates: Record<string, any> = {
    xp: increment(xpEarned),
    lastActive: new Date().toISOString(),
  };
  if (isNewDay) updates.streak = increment(1);
  await updateDoc(ref, updates);
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

// Called on app open — increments streak once per calendar day
export async function checkDailyStreak(uid: string) {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const today = new Date().toISOString().split('T')[0];
  const lastActive: string = (snap.data().lastActive ?? '').split('T')[0];
  if (lastActive === today) return;
  await updateDoc(ref, { streak: increment(1), lastActive: new Date().toISOString() });
}
