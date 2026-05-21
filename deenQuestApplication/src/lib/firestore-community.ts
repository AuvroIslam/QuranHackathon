import {
  collection, query, orderBy, where, getDocs, addDoc, updateDoc,
  doc, increment, arrayUnion, arrayRemove, getDoc, deleteDoc,
} from 'firebase/firestore';
import { db } from './firebase';

export interface Answer {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  content: string;
  upvotes: number;
  upvotedBy: string[];
  createdAt: string;
  parentAnswerId?: string | null;
}

export async function getPosts() {
  const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function createPost(
  uid: string, userName: string, content: string,
  type: 'question' | 'reflection', title: string
) {
  return addDoc(collection(db, 'posts'), {
    userId: uid, userName, title, content, type,
    upvotes: 0, upvotedBy: [], createdAt: new Date().toISOString(),
  });
}

export async function upvotePost(postId: string, uid: string) {
  const ref = doc(db, 'posts', postId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const upvotedBy: string[] = snap.data().upvotedBy ?? [];
  if (upvotedBy.includes(uid)) {
    await updateDoc(ref, { upvotes: increment(-1), upvotedBy: arrayRemove(uid) });
  } else {
    await updateDoc(ref, { upvotes: increment(1), upvotedBy: arrayUnion(uid) });
  }
}

export async function getAnswers(postId: string): Promise<Answer[]> {
  const q = query(collection(db, 'answers'), where('postId', '==', postId));
  const snap = await getDocs(q);
  const results = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Answer));
  return results.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function createAnswer(
  postId: string,
  uid: string,
  userName: string,
  content: string,
  parentAnswerId?: string | null
): Promise<Answer> {
  const data: Omit<Answer, 'id'> = {
    postId,
    userId: uid,
    userName,
    content,
    upvotes: 0,
    upvotedBy: [],
    createdAt: new Date().toISOString(),
    parentAnswerId: parentAnswerId ?? null,
  };
  const ref = await addDoc(collection(db, 'answers'), data);
  return { id: ref.id, ...data };
}

export async function deleteAnswer(answerId: string, uid: string) {
  const ref = doc(db, 'answers', answerId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Answer not found');
  if (snap.data().userId !== uid) throw new Error('Not authorized');
  await deleteDoc(ref);
}

export async function upvoteAnswer(answerId: string, uid: string) {
  const ref = doc(db, 'answers', answerId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const upvotedBy: string[] = snap.data().upvotedBy ?? [];
  if (upvotedBy.includes(uid)) {
    await updateDoc(ref, { upvotes: increment(-1), upvotedBy: arrayRemove(uid) });
  } else {
    await updateDoc(ref, { upvotes: increment(1), upvotedBy: arrayUnion(uid) });
  }
}
