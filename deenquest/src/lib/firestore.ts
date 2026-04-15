import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  orderBy,
  increment,
  arrayUnion,
  arrayRemove,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { UserProfile, UserTask, Post, Answer } from "./types";

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
    level: 1,
    streak: 0,
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

export async function updateUserLevel(uid: string, level: number) {
  await updateDoc(doc(db, "users", uid), { level });
}

// ─── Tasks ──────────────────────────────────────────────────────

export async function getUserTasksForDate(uid: string, date: string): Promise<UserTask[]> {
  const q = query(
    collection(db, "userTasks"),
    where("userId", "==", uid),
    where("date", "==", date)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data() } as UserTask));
}

export async function completeTask(uid: string, taskId: string, date: string, xpReward: number) {
  await addDoc(collection(db, "userTasks"), {
    userId: uid,
    taskId,
    completed: true,
    date,
  });
  await addXP(uid, xpReward);
}

// ─── Bookmarks ──────────────────────────────────────────────────

export async function toggleBookmark(uid: string, ayahKey: string) {
  const ref = doc(db, "ayahBookmarks", `${uid}_${ayahKey}`);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const { deleteDoc } = await import("firebase/firestore");
    await deleteDoc(ref);
    return false;
  }
  await setDoc(ref, { userId: uid, ayahId: ayahKey });
  return true;
}

export async function getBookmarks(uid: string): Promise<string[]> {
  const q = query(collection(db, "ayahBookmarks"), where("userId", "==", uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data().ayahId as string);
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
