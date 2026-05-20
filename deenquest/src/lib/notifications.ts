import { getToken, onMessage } from "firebase/messaging";
import { getMessagingInstance } from "./firebase";
import { saveFcmToken } from "./firestore";

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

// Guards against duplicate setup across auth state changes
let _initialized = false;
let _unsubscribeOnMessage: (() => void) | null = null;

export async function initNotifications(uid: string): Promise<void> {
  if (typeof window === "undefined") return;
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
  if (_initialized) return;

  try {
    const messaging = await getMessagingInstance();
    if (!messaging) return;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    const registration = await navigator.serviceWorker.register("/api/fcm-sw", {
      scope: "/",
    });

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      await saveFcmToken(uid, token).catch((err) =>
        console.error("[FCM] Failed to save token:", err)
      );
    }

    // Clean up any stale listener before registering
    _unsubscribeOnMessage?.();
    _unsubscribeOnMessage = onMessage(messaging, (payload) => {
      const title = payload.notification?.title ?? "DeenQuest";
      const body = payload.notification?.body ?? "Time for your daily Quran session!";
      new Notification(title, { body, icon: "/deenQuestLogo.png" });
    });

    _initialized = true;
  } catch (err) {
    console.error("[FCM] Notification setup failed:", err);
  }
}
