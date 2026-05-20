import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 ?? "";
const serviceAccount = JSON.parse(Buffer.from(b64, "base64").toString("utf-8"));

const adminApp =
  getApps().find((a) => a.name === "admin") ??
  initializeApp({ credential: cert(serviceAccount) }, "admin");

export const adminDb = getFirestore(adminApp);
export const adminMessaging = getMessaging(adminApp);
