import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  writeBatch,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  orderBy,
  increment,
  arrayUnion,
  arrayRemove,
  deleteDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import type { UserProfile, UserTask, Post, Answer, UserGoal, UserLevel, TimePerDay, Bookmark } from "./types";

// ─── User Profile ───────────────────────────────────────────────

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as UserProfile) : null;
}

export async function createUserProfile(uid: string, name: string, email: string) {
  const now = new Date().toISOString();
  const profile: Omit<UserProfile, "id"> = {
    name,
    email,
    xp: 0,
    streak: 0,
    goalSet: false,
    lastActive: now,
    createdAt: now,
  };
  await setDoc(doc(db, "users", uid), profile);
  return { id: uid, ...profile } as UserProfile;
}

export async function addXP(uid: string, amount: number) {
  await updateDoc(doc(db, "users", uid), {
    xp: increment(amount),
    lastActive: new Date().toISOString(),
  });
}

export async function updateStreak(uid: string, streak: number) {
  await updateDoc(doc(db, "users", uid), {
    streak,
    lastActive: new Date().toISOString(),
  });
}

// ─── Goal Setup ─────────────────────────────────────────────────

export async function saveUserGoal(
  uid: string,
  goal: UserGoal,
  options: { level?: UserLevel; timePerDay?: TimePerDay }
) {
  const updates: Record<string, unknown> = { goal, goalSet: true };
  if (goal === 'learn') {
    updates.level = options.level ?? null;
    updates.timePerDay = options.timePerDay ?? null;
  } else {
    updates.timePerDay = options.timePerDay ?? null;
    updates.quranProgress = { surahNumber: 1, ayahNumber: 1 };
    updates.currentDay = 1;
  }
  await updateDoc(doc(db, "users", uid), updates);
}

export async function updateQuranProgress(uid: string, surahNumber: number, ayahNumber: number) {
  await updateDoc(doc(db, "users", uid), {
    quranProgress: { surahNumber, ayahNumber },
    lastActive: new Date().toISOString(),
  });
}

export async function incrementCurrentDay(uid: string) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const today = new Date().toISOString().split('T')[0];
  if (snap.data().lastCurrentDayDate === today) return;
  await updateDoc(ref, {
    currentDay: increment(1),
    lastCurrentDayDate: today,
  });
}

// ─── Session Completion ──────────────────────────────────────────

export async function getDailySessionCount(uid: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return 0;
  const data = snap.data();
  return data.sessionDate === today ? (data.sessionsToday ?? 0) : 0;
}

export async function completeSession(
  uid: string,
  isStreakRecoveryComplete: boolean
): Promise<{ newStreak: number; sessionsToday: number }> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { newStreak: 1, sessionsToday: 1 };

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
    } else if (missedDays >= 3) {
      newStreak = 1;
    } else {
      newStreak = 1;
    }
  }

  const isToday = data.sessionDate === today;
  const sessionsToday = isToday ? (data.sessionsToday ?? 0) + 1 : 1;

  await updateDoc(ref, {
    lastSessionDate: today,
    streak: newStreak,
    lastActive: new Date().toISOString(),
    sessionDate: today,
    sessionsToday,
    xp: increment(10),
  });

  return { newStreak, sessionsToday };
}

// ─── Tasks ──────────────────────────────────────────────────────

export async function getTasksCompletedCount(uid: string): Promise<number> {
  const q = query(collection(db, "userTasks"), where("userId", "==", uid));
  const snap = await getDocs(q);
  return snap.size;
}

export async function getUserTasksForDate(uid: string, date: string): Promise<UserTask[]> {
  const q = query(
    collection(db, "userTasks"),
    where("userId", "==", uid),
    where("date", "==", date)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data() } as UserTask));
}

export async function completeTask(
  uid: string,
  taskId: string,
  date: string,
  xpReward: number,
  isStreakRecovery = false
) {
  const userRef = doc(db, "users", uid);
  const taskRef = doc(collection(db, "userTasks"));
  const batch = writeBatch(db);

  batch.set(taskRef, {
    userId: uid,
    taskId,
    completed: true,
    date,
    ...(isStreakRecovery ? { isStreakRecovery: true } : {}),
  });
  batch.update(userRef, {
    xp: increment(xpReward),
    lastActive: new Date().toISOString(),
  });

  await batch.commit();
}

// ─── Bookmarks ──────────────────────────────────────────────────

const bmDocId = (verseKey: string) => verseKey.replace(':', '_');

export async function addBookmark(
  uid: string,
  data: Omit<Bookmark, 'id' | 'createdAt'>
): Promise<void> {
  const ref = doc(db, 'users', uid, 'bookmarks', bmDocId(data.verseKey));
  await setDoc(ref, { ...data, createdAt: new Date().toISOString() });
}

export async function removeBookmark(uid: string, verseKey: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'bookmarks', bmDocId(verseKey)));
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

export async function toggleBookmark(
  uid: string,
  data: Omit<Bookmark, 'id' | 'createdAt'>
): Promise<boolean> {
  const ref = doc(db, 'users', uid, 'bookmarks', bmDocId(data.verseKey));
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await deleteDoc(ref);
    return false;
  }
  await setDoc(ref, { ...data, createdAt: new Date().toISOString() });
  return true;
}

// ─── Community Posts ────────────────────────────────────────────

export async function createPost(
  uid: string,
  userName: string,
  content: string,
  type: "question" | "reflection",
  title: string = ""
) {
  const data = {
    userId: uid,
    userName,
    title,
    content,
    type,
    upvotes: 0,
    upvotedBy: [],
    createdAt: new Date().toISOString(),
  };
  const ref = await addDoc(collection(db, "posts"), data);
  return { id: ref.id, ...data } as Post;
}

export async function getPosts(): Promise<Post[]> {
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Post));
}

export async function deletePost(postId: string, uid: string) {
  const ref = doc(db, "posts", postId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Post not found");
  if (snap.data().userId !== uid) throw new Error("Not authorized");
  const { deleteDoc } = await import("firebase/firestore");
  await deleteDoc(ref);
}

export async function updatePost(postId: string, uid: string, title: string, content: string) {
  if (!title.trim() || !content.trim()) throw new Error("Title and content required");
  const ref = doc(db, "posts", postId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Post not found");
  if (snap.data().userId !== uid) throw new Error("Not authorized");
  await updateDoc(ref, { title: title.trim(), content: content.trim(), updatedAt: new Date().toISOString() });
}

export async function upvotePost(postId: string, uid: string) {
  const ref = doc(db, "posts", postId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();
  if (data.upvotedBy?.includes(uid)) {
    await updateDoc(ref, { upvotes: increment(-1), upvotedBy: arrayRemove(uid) });
  } else {
    await updateDoc(ref, { upvotes: increment(1), upvotedBy: arrayUnion(uid) });
  }
}

export async function createAnswer(
  postId: string,
  uid: string,
  userName: string,
  content: string,
  parentId?: string,
  replyToName?: string
) {
  const data: Record<string, unknown> = {
    postId,
    userId: uid,
    userName,
    content,
    upvotes: 0,
    upvotedBy: [],
    createdAt: new Date().toISOString(),
  };
  if (parentId) {
    data.parentId = parentId;
    data.replyToName = replyToName || "";
  }
  const ref = await addDoc(collection(db, "answers"), data);
  return { id: ref.id, ...data } as Answer;
}

export async function getAnswers(postId: string): Promise<Answer[]> {
  const q = query(
    collection(db, "answers"),
    where("postId", "==", postId)
  );
  const snap = await getDocs(q);
  const results = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Answer));
  return results.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function upvoteAnswer(answerId: string, uid: string) {
  const ref = doc(db, "answers", answerId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();
  if (data.upvotedBy?.includes(uid)) {
    await updateDoc(ref, { upvotes: increment(-1), upvotedBy: arrayRemove(uid) });
  } else {
    await updateDoc(ref, { upvotes: increment(1), upvotedBy: arrayUnion(uid) });
  }
}

// ─── Listening Progress ─────────────────────────────────────────

export interface ListeningProgress {
  chapterId: number;
  chapterName: string;
  lastVerse: number;
  totalVerses: number;
  updatedAt: string;
}

export async function saveListeningProgress(
  uid: string,
  chapterId: number,
  chapterName: string,
  lastVerse: number,
  totalVerses: number
) {
  const ref = doc(db, "listeningProgress", `${uid}_${chapterId}`);
  await setDoc(ref, {
    userId: uid,
    chapterId,
    chapterName,
    lastVerse,
    totalVerses,
    updatedAt: new Date().toISOString(),
  });
}

export async function getListeningProgress(uid: string): Promise<ListeningProgress[]> {
  const q = query(collection(db, "listeningProgress"), where("userId", "==", uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as ListeningProgress);
}

export async function getChapterProgress(uid: string, chapterId: number): Promise<ListeningProgress | null> {
  const ref = doc(db, "listeningProgress", `${uid}_${chapterId}`);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as ListeningProgress) : null;
}

// ─── Daily Goal ───────────────────────────────────────────────

export async function saveDailyGoal(uid: string, verses: number) {
  await updateDoc(doc(db, "users", uid), { dailyGoal: verses });
}

export async function getDailyGoal(uid: string): Promise<number | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  const val = snap.data()?.dailyGoal;
  return typeof val === "number" ? val : null;
}

export async function updateUserName(uid: string, name: string) {
  await updateDoc(doc(db, "users", uid), { name });
}

