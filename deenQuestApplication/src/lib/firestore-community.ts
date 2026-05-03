import {
  collection, query, orderBy, getDocs, addDoc, updateDoc,
  doc, increment, arrayUnion, arrayRemove, getDoc,
} from 'firebase/firestore';
import { db } from './firebase';

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
