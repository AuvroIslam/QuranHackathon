# DeenQuest

A gamified, AI-powered Quran companion that helps you build and maintain a daily connection with the Quran — beyond Ramadan.

Built for the **Quran Foundation Hackathon 2026** (Provision Launch + Quran Foundation).

---

## What it does

- **Mood-based ayah selection** — pick how you're feeling, get a relevant verse fetched live from the Quran Foundation API
- **Two learning modes** — sequentially complete the Quran, or follow structured daily lessons with MCQ and speech practice
- **Streak system with recovery** — miss a day? Complete bonus deeds to save your streak
- **XP and gamification** — earn XP per session and task, track weekly progress
- **AI reflection and Hadith pairing** — each ayah comes with an AI-generated reflection and a matching Hadith
- **Voice recitation practice** — record yourself, get word-level accuracy feedback
- **Quran chatbot** — ask Islamic questions, verified against Quran MCP in real time
- **Dawah perspectives** — explore any topic with Quranic guidance and cross-scripture comparison
- **Community forum** — post questions and reflections, upvote and reply
- **Push notifications** — daily streak reminders via Firebase Cloud Messaging

---

## Tech stack

- **Framework**: Next.js 15 (App Router, TypeScript)
- **Auth & DB**: Firebase Auth + Firestore
- **Content**: Quran Foundation Content API (OAuth2 client credentials)
- **User data**: Quran Foundation User API (OAuth2 PKCE) — bookmarks, reading sessions, streaks, goals
- **AI grounding**: Quran MCP (`mcp.quran.ai`) — search, fetch, translation, tafsir
- **AI responses**: DeepSeek via `/api/deepseek`
- **Push notifications**: Firebase Cloud Messaging + Vercel Cron
- **Styling**: Tailwind CSS

---

## Required environment variables

### Public (safe to expose to browser)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase project API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | FCM web push VAPID key (Firebase Console → Project Settings → Cloud Messaging → Web Push certificates) |
| `NEXT_PUBLIC_QF_CLIENT_ID` | Quran Foundation OAuth2 client ID (for PKCE user auth flow) |
| `NEXT_PUBLIC_QF_AUTH_URL` | Quran Foundation auth base URL |

### Server-only (never expose to browser)

| Variable | Description |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | Firebase Admin SDK service account JSON, base64-encoded |
| `QF_CLIENT_ID` | Quran Foundation client ID (server-side API calls) |
| `QF_CLIENT_SECRET` | Quran Foundation client secret |
| `QF_CONTENT_CLIENT_ID` | QF Content API client ID (if separate from user client) |
| `QF_CONTENT_CLIENT_SECRET` | QF Content API client secret |
| `DEEPSEEK_API_KEY` | DeepSeek API key for AI features |
| `CRON_SECRET` | Secret to authenticate Vercel cron calls to `/api/notifications/send` |
| `QURAN_MCP_URL` | Quran MCP server URL (defaults to `https://mcp.quran.ai`) |

---

## Running locally

```bash
cd deenquest
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Push notifications setup

1. In Firebase Console → Project Settings → Cloud Messaging → Web Push certificates → generate a key pair
2. Add the key as `NEXT_PUBLIC_FIREBASE_VAPID_KEY` in your environment
3. Generate a `CRON_SECRET` (any random string) and add it to Vercel environment variables
4. Vercel cron (`vercel.json`) fires daily at 7pm UTC — calls `/api/notifications/send` which sends FCM reminders to users who haven't completed a session that day

---

## Quran Foundation API usage

| API | Auth flow | Where it appears in the UI |
|---|---|---|
| Content API — verses, translations | OAuth2 client credentials (server-side) | Session reading view (ayahs + transliteration + translation) |
| Content API — audio recitations | OAuth2 client credentials (server-side) | Per-ayah play/pause in reading session and lesson view |
| Content API — full-text search | OAuth2 client credentials (server-side) | Mood-based ayah selection, Dawah topic search |
| User API — bookmarks | OAuth2 PKCE (user-authenticated) | Bookmark button on ayah cards and session ayah step |
| User API — collections | OAuth2 PKCE (user-authenticated) | `BookmarkModal` — users pick an existing QF collection or create a new named one; verses are added directly into the selected collection |
| User API — reading sessions & streaks | OAuth2 PKCE (user-authenticated) | Synced to QF on session complete (ranges + seconds read) |
| User API — goals | OAuth2 PKCE (user-authenticated) | Synced on session complete |
| Quran MCP — search, fetch, translation, tafsir | No auth required | Chatbot (every Quran-related message verified via MCP); AI reflection generation |

All Quran text is fetched live from the API — nothing is hardcoded.

---

## Deploying to Vercel

```bash
vercel deploy
```

Set all environment variables in Vercel → Project Settings → Environment Variables before deploying.
