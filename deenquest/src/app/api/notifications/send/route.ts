import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminMessaging } from "@/lib/firebase-admin";

export const runtime = "nodejs";

const CRON_SECRET = process.env.CRON_SECRET ?? "";

// Called by Vercel cron daily at 7pm UTC.
// Queries users with an FCM token who haven't completed a session today,
// then sends them a streak reminder notification.
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().split("T")[0];

  try {
    const snapshot = await adminDb
      .collection("users")
      .where("fcmToken", "!=", "")
      .get();

    const tokens: string[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.fcmToken && data.lastSessionDate !== today) {
        tokens.push(data.fcmToken as string);
      }
    });

    if (tokens.length === 0) {
      return NextResponse.json({ sent: 0, total: 0 });
    }

    let sent = 0;
    // FCM multicast limit is 500 tokens per call
    for (let i = 0; i < tokens.length; i += 500) {
      const batch = tokens.slice(i, i + 500);
      const response = await adminMessaging.sendEachForMulticast({
        tokens: batch,
        notification: {
          title: "Your streak is waiting 🔥",
          body: "Complete today's Quran session before midnight to keep your streak alive.",
        },
        webpush: {
          notification: {
            icon: "/deenQuestLogo.png",
            badge: "/deenQuestLogo.png",
            tag: "deenquest-reminder",
          },
          fcmOptions: { link: "/" },
        },
      });
      sent += response.successCount;

      // Log stale tokens for visibility
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.warn("[FCM] Failed token:", batch[idx], resp.error?.code);
        }
      });
    }

    return NextResponse.json({ sent, total: tokens.length });
  } catch (err) {
    console.error("[FCM] send route failed:", err);
    return NextResponse.json({ error: "Failed to send notifications" }, { status: 500 });
  }
}
