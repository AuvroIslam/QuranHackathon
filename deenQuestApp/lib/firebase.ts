import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAJxUgFdrKXqQ-ZT6sL8GwirGe0wdw-X-o",
  authDomain: "quranhackathon.firebaseapp.com",
  projectId: "quranhackathon",
  storageBucket: "quranhackathon.firebasestorage.app",
  messagingSenderId: "94900107612",
  appId: "1:94900107612:web:cde4b4b02c73c3e8c5e999",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
