import {
  doc, getDoc, setDoc, updateDoc, collection,
  query, where, getDocs, addDoc, orderBy,
  increment, arrayUnion, arrayRemove,
} from "firebase/firestore";
import { db } from "./firebase";
import type { UserProfile, UserTask, Post } from "./types";

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as UserProfile) : null;
}

export async function createUserProfile(uid: string, name: string, email: string) {
  const now = new Date().toISOString();
  const profile: Omit<UserProfile, "id"> = { name, email, xp: 0, level: 1, streak: 0, lastActive: now, createdAt: now };
  await setDoc(doc(db, "users", uid), profile);
  return { id: uid, ...profile } as UserProfile;
}

export async function updateUserName(uid: string, name: string) {
  await updateDoc(doc(db, "users", uid), { name });
}

export async function addXP(uid: string, amount: number) {
  await updateDoc(doc(db, "users", uid), { xp: increment(amount), lastActive: new Date().toISOString() });
}

export async function getUserTasksForDate(uid: string, date: string): Promise<UserTask[]> {
  const q = query(collection(db, "userTasks"), where("userId", "==", uid), where("date", "==", date));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as UserTask));
}

export async function completeTask(uid: string, taskId: string, date: string, xpReward: number) {
  await addDoc(collection(db, "userTasks"), { userId: uid, taskId, date, completedAt: new Date().toISOString(), xpReward });
  await addXP(uid, xpReward);
}

export async function getPosts(): Promise<Post[]> {
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Post));
}

export async function createPost(uid: string, userName: string, content: string, type: "question" | "reflection", title: string): Promise<Post> {
  const post = { userId: uid, userName, content, type, title, upvotes: 0, upvotedBy: [], createdAt: new Date().toISOString() };
  const ref = await addDoc(collection(db, "posts"), post);
  return { id: ref.id, ...post };
}

export async function upvotePost(postId: string, uid: string) {
  const ref = doc(db, "posts", postId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const upvotedBy: string[] = snap.data().upvotedBy || [];
  if (upvotedBy.includes(uid)) {
    await updateDoc(ref, { upvotes: increment(-1), upvotedBy: arrayRemove(uid) });
  } else {
    await updateDoc(ref, { upvotes: increment(1), upvotedBy: arrayUnion(uid) });
  }
}

export async function saveSalahPrayers(uid: string, date: string, prayers: Record<string, boolean>) {
  await setDoc(doc(db, "salah", `${uid}_${date}`), { uid, date, ...prayers, updatedAt: new Date().toISOString() });
}

export async function getSalahPrayers(uid: string, date: string): Promise<Record<string, boolean>> {
  const snap = await getDoc(doc(db, "salah", `${uid}_${date}`));
  if (!snap.exists()) return {};
  const { uid: _u, date: _d, updatedAt: _t, ...prayers } = snap.data();
  return prayers as Record<string, boolean>;
}

export async function saveDailyGoal(uid: string, verses: number) {
  await updateDoc(doc(db, "users", uid), { dailyGoal: verses });
}
