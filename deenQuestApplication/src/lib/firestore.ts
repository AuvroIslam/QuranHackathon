import {
  doc, getDoc, setDoc, updateDoc, writeBatch,
  collection, query, where, getDocs, increment, deleteDoc, orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import type { UserTask } from './tasks-data';
import type { TimePerDay, UserGoal, UserLevel, Bookmark } from '../types';

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
  preferredTheme?: 'light' | 'dark';
  preferredTranslationId?: number;
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
export async function completeJourney(uid: string, xpEarned: number, isStreakRecoveryComplete = false): Promise<{ newStreak: number }> {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { newStreak: 1 };

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
  return { newStreak };
}

export async function resetStreak(uid: string) {
  await updateDoc(doc(db, 'users', uid), { streak: 0 });
}

export async function saveUserGoal(
  uid: string,
  goal: UserGoal,
  options: { level?: UserLevel; timePerDay?: TimePerDay }
) {
  const updates: Record<string, any> = { goal, goalSet: true };
  if (goal === 'learn') {
    updates.level = options.level ?? null;
    updates.timePerDay = options.timePerDay ?? null;
    updates.currentDay = 1;
  } else {
    updates.timePerDay = options.timePerDay ?? null;
    updates.quranProgress = { surahNumber: 1, ayahNumber: 1 };
  }
  await updateDoc(doc(db, 'users', uid), updates);
}

/**
 * Advance the learner to the NEXT lesson. Called once per completed learn
 * session — so every "Keep Going" / new session serves the next lesson
 * instead of repeating the current one. Lesson progress is intentionally
 * decoupled from the calendar-day streak (tracked via lastSessionDate).
 */
export async function incrementCurrentDay(uid: string) {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const current = Number(snap.data().currentDay ?? 1);
  await updateDoc(ref, {
    currentDay: (Number.isFinite(current) ? current : 1) + 1,
    lastCurrentDayDate: new Date().toISOString().split('T')[0],
  });
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

/** Change the user's goal between 'complete' and 'learn' WITHOUT resetting
 * streak / xp / bookmarks / quranProgress / currentDay. Used by Settings. */
export async function updateUserGoal(uid: string, goal: UserGoal) {
  await updateDoc(doc(db, 'users', uid), {
    goal,
    goalSet: true,
    lastActive: new Date().toISOString(),
  });
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

// ── Quran Foundation (QF) token bridge ────────────────────────────────────────

export async function saveQFTokens(
  uid: string,
  accessToken: string,
  refreshToken: string,
  expiresAt: number
) {
  await updateDoc(doc(db, 'users', uid), {
    qfAccessToken: accessToken,
    qfRefreshToken: refreshToken,
    qfTokenExpiresAt: expiresAt,
    qfConnectedAt: new Date().toISOString(),
  });
}

export async function getQFTokens(
  uid: string
): Promise<{ accessToken: string; refreshToken: string; expiresAt: number } | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  if (!data.qfAccessToken) return null;
  return {
    accessToken: data.qfAccessToken,
    refreshToken: data.qfRefreshToken ?? '',
    expiresAt: data.qfTokenExpiresAt ?? 0,
  };
}

// ── Bookmarks ──────────────────────────────────────────────────

const bmDocId = (verseKey: string) => verseKey.replace(':', '_');

const VERCEL_BASE = 'https://quran-hackathon-omega.vercel.app';

/** Fire-and-forget sync to Quran.com — never throws */
async function syncBookmarkToQF(
  accessToken: string,
  verseKey: string,
  action: 'add' | 'remove'
): Promise<void> {
  try {
    const [chapterStr, verseStr] = verseKey.split(':');
    const chapterNumber = parseInt(chapterStr, 10);
    const verseNumber = parseInt(verseStr, 10);
    if (!chapterNumber || !verseNumber) return;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      await fetch(`${VERCEL_BASE}/api/qf/bookmark`, {
        method: action === 'add' ? 'POST' : 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-qf-token': accessToken,
        },
        body: JSON.stringify({ chapterNumber, verseNumber }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  } catch {
    // Best-effort — local bookmark is already saved
  }
}

export async function toggleBookmark(
  uid: string,
  data: Omit<Bookmark, 'id' | 'createdAt'>
): Promise<boolean> {
  const ref = doc(db, 'users', uid, 'bookmarks', bmDocId(data.verseKey));
  const snap = await getDoc(ref);

  let added: boolean;
  if (snap.exists()) {
    await deleteDoc(ref);
    added = false;
  } else {
    await setDoc(ref, { ...data, createdAt: new Date().toISOString() });
    added = true;
  }

  // Sync to Quran.com if user is connected and token is valid — fire and forget
  getQFTokens(uid).then((tokens) => {
    if (!tokens?.accessToken) return;
    if (tokens.expiresAt && tokens.expiresAt < Date.now()) return; // token expired, skip sync
    syncBookmarkToQF(tokens.accessToken, data.verseKey, added ? 'add' : 'remove');
  }).catch(() => {});

  return added;
}

export async function getBookmarks(uid: string): Promise<Bookmark[]> {
  const snap = await getDocs(
    query(collection(db, 'users', uid, 'bookmarks'), orderBy('createdAt', 'desc'))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Bookmark));
}

export async function isBookmarked(uid: string, verseKey: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'users', uid, 'bookmarks', bmDocId(verseKey)));
  return snap.exists();
}

export async function updateUserPreferences(
  uid: string,
  prefs: { preferredTheme?: 'light' | 'dark'; preferredTranslationId?: number }
) {
  await updateDoc(doc(db, 'users', uid), prefs);
}

