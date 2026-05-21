<h1 align="center">DeenQuest</h1>
<p align="center"><strong>Your daily Quran habit — 3 minutes at a time.</strong></p>
<p align="center">
  A Duolingo-style mobile + web app that keeps you connected to the Quran every day —<br/>
  whether you're a complete beginner who can't read Arabic yet, or someone working through all 114 surahs.
</p>

---

## The Problem

Millions of Muslims reconnect deeply with the Quran during Ramadan — then lose that connection when life picks back up. The barrier isn't motivation. It's structure. There's no low-friction, daily way to stay engaged that works for people at every level.

DeenQuest solves that by making a 3–10 minute Quran session feel as natural and rewarding as any other daily habit.

---

## What Is DeenQuest?

DeenQuest is a mobile app (Expo / React Native) paired with a full-featured web app (Next.js) built around one idea: **a little bit of Quran, every day, for everyone**.

On first setup you choose:
- **Your goal** — *Learn to read Quran* or *Complete the Quran*
- **Your level** — Newbie, Intermediate, or Fluent (learning path only)
- **Your time** — 3, 5, or 10 minutes a day

Then you just show up. The app handles the rest.

---

## Repository Structure

```
├── deenquest/               # Next.js 15 web app — deployed on Vercel
├── deenQuestApplication/    # Expo SDK 54 mobile app (Android + iOS)
└── README.md
```

---

## Core Features

### Onboarding

![Onboarding 1](GithubImages/Onboarding1.png)
![Onboarding 2](GithubImages/Onboarding2.png)
![Onboarding 3](GithubImages/Onboarding3.png)

Three slides introduce the app, followed by an animated goal wizard — choose your goal, level, time commitment, and optionally connect your Quran.com account — all before your first session.

---

### Daily Sessions — Learn to Read Quran

![Lesson 1 - Just Listen](GithubImages/lesson1_listen.png)
![Lesson 2 - Now Recite](GithubImages/lesson2_recite.png)
![Lesson 3 - Word by Word Feedback](GithubImages/lesson3_getFeedback.png)
![Lesson 4 - Challenge Your Memory](GithubImages/lesson4_quiz.png)

Every learning session has four steps:

| Step | What happens |
|------|-------------|
| **Just listen** | Hear the ayah from a professional reciter before you attempt it |
| **Now recite** | Tap the mic and say it yourself |
| **Spot your mistakes** | OpenAI Whisper checks your recording word by word — correct words light up green, missed ones red |
| **Challenge your memory** | A short quiz locks in what you just learned |

60 structured lessons across three levels (Newbie → Intermediate → Fluent) take you from Arabic letters all the way to Ayatul Kursi and Surah Ar-Rahman. All Arabic text and audio are fetched live from the Quran Foundation API — nothing is hardcoded.

---

### Daily Sessions — Complete the Quran

![Daily Quran Reading Session](GithubImages/Reading1_dailyQuranReadinglisteningSession.png)

Already know how to read? Pick the *Complete Quran* path and work through all 114 surahs in order, a few ayahs each session. Each completed session syncs a reading record to your Quran.com account so your progress is always backed up.

**"Your daily Quran moment."**

---

### Mood-Based Ayah

![Describe Your Mood](GithubImages/DescribeMood1.png)
![Get a Mood-Based Ayah](GithubImages/DescribeMood2_getMoodBasedAyah.png)

Before every session, the app asks how you're feeling — Stressed, Sad, Grateful, Lost, Overthinking, or just *I'm here*. You can also describe your situation in your own words. DeenQuest finds the most relevant ayah with its translation, transliteration, and a personal AI-generated reflection to set the right mindset before you begin.

---

### Streaks & Habit Building

![Maintain Streak](GithubImages/maintainStreak.png)
![Recover Streak with Bonus Task](GithubImages/dobonusTAskTorecoverStreak.png)

Complete your daily session and your streak grows. **Miss a day? We don't punish you.** Instead, you get a chance to recover your streak by completing a real-life good deed: feed an animal, help someone in need, call a family member. Up to 2 missed days can be recovered this way. The tasks rotate daily using a deterministic shuffle — every user gets the same three tasks on the same day.

**"One task. Streak recovered."**

---

### Quran Library — Read & Listen

![Quran Library](GithubImages/readlistenfromquranlibrary.png)
![Tafsir, Meaning & Pronunciation Available](GithubImages/readlistenfromquranlibrary_tasfir,meaning,pronounciation_avaliable.png)

Browse all 114 surahs with search. For every ayah:

- Arabic text with full diacritics
- Transliteration (pronunciation guide)
- Translation
- **Ibn Kathir Tafsir** — pulled live from the Quran Foundation API
- Per-ayah audio playback
- One-tap bookmark into any collection

**"Recite with meaning, pronunciation & Tafsir — ayah by ayah."**

---

### Bookmarks & Collections — Synced to Quran.com

![Bookmark Any Ayah](GithubImages/Bookmark1.png)
![Save Under a Collection](GithubImages/bookmark2saveundercollenction.png)
![Real-time Quran.com Sync](GithubImages/bookmark3realtimequran.comsync.png)

Tap **Save** on any ayah, name your collection, and it's stored. Collections sync in real time to your Quran.com account via the Quran Foundation User API — open Quran.com and your bookmarks are already there, organised exactly as you named them.

---

### Explore — Dawah

![Dawah Mode](GithubImages/DawahMode.png)
![Related Ayah](GithubImages/DawahMode2_getRelatedAyah.png)
![Other Scripture Reference](GithubImages/DawahMode2_otherScrptureReference.png)
![Quran Reasoning](GithubImages/DawahMode2_whyQuranReasoningBetter.png)

Ask any question — *"What does Islam teach about treating people of other religions?"* — and DeenQuest gives you three layers of response:

1. **Related Ayah** — the most relevant Quranic verse with explanation, grounded via the Quran MCP server
2. **Other Scripture Reference** — what the Bible, Bhagavad Gita, or other texts say about the same topic, with references
3. **Quran Reasoning** — why the Quranic perspective is particularly meaningful for the Ummah

All Quranic references are verified through the Quran MCP server — the AI never invents citations from training memory.

---

### Explore — Community

![Community - Ask Real Muslims](GithubImages/CommunityAsktoRealMuslims.png)

**"Ask the Ummah. Learn together."**

Post questions or reflections, get answers from other Muslims. Upvote helpful replies, search by keyword, and engage in threaded discussions. Built on Firestore for real-time updates.

---

### Explore — Ask AI

![Ask AI - Quran MCP Protected](GithubImages/AskAi_quranMcpProtected.png)
![Ask AI - MCP Verified Response](GithubImages/AskAi_quranMcp2Protected_checkAyah.png)

**"AI answers, Quran MCP verified."**

A conversational Islamic Q&A powered by a Groq → Mistral → DeepSeek LLM chain. When your question mentions Quran-related keywords, the app automatically calls the Quran Foundation MCP server (`mcp.quran.ai`) to fetch verified verse data and injects it into the system prompt before generating a response. Answers grounded through MCP show a **"Verified with Quran MCP"** badge.

---

### Connect Your Quran.com Account

![Link Account with Quran.com](GithubImages/LinkAccountWithQuran.com.png)

OAuth2 PKCE flow connects DeenQuest to your Quran.com account. Once linked:
- Bookmarks and named collections sync both ways
- Reading sessions are recorded to your Quran.com history
- Your daily reading goal is set on Quran.com based on your time commitment (3 min → 1 page/day, 10 min → 4 pages/day)
- Activity days are reported so your Quran.com streak stays in sync

---

### Dark Mode

![Dark Mode](GithubImages/DarkMode.png)

Full dark theme throughout the mobile app, toggled from your profile. The web app ships with a glass-morphism dark design as its default.

---

### Web Version

![Web Version Available](GithubImages/WebVersionAvaliable.png)

No app download needed. The web version at **[quran-hackathon-omega.vercel.app](https://quran-hackathon-omega.vercel.app)** covers every core feature — daily sessions, mood-based ayah, Quran reader with tafsir, bookmarks with collection sync, Dawah explorer, community, and AI chat — with a glassy design that works on desktop and mobile browsers.

---

## Quran Foundation API Integration

DeenQuest is built entirely on verified Quran Foundation data. No Quran text is hardcoded anywhere in the codebase — every Arabic verse, transliteration, translation, audio recitation, and tafsir is fetched live. If a fetch fails, the app surfaces an error and prompts a retry; it never falls back to a bundled copy.

| API | How DeenQuest uses it |
|-----|----------------------|
| **Verses & Chapters** | Lesson content, Quran library, mood-ayah, Dawah responses |
| **Audio Recitations** | Per-ayah playback in the library and lesson Listen step |
| **Tafsir** | Ibn Kathir tafsir shown inline per ayah |
| **Translations** | 50+ options, user-selectable in settings |
| **Full-text Search** | Quran search in the web reader |
| **Bookmarks API** | Save / remove bookmarks synced to Quran.com |
| **Collections API** | Create named collections; add verses directly |
| **Reading Sessions API** | Every verse marked as read is synced as a reading session |
| **Daily Goal API** | Set on setup based on time commitment |
| **Activity / Streak API** | Reported after each session to keep Quran.com streak in sync |
| **Quran MCP Server** | Grounds all AI responses — chatbot, Dawah, and ayah reflections — in verified data |

Authentication uses **OAuth2 PKCE** for User APIs and **OAuth2 Client Credentials** for Content APIs, following the Quran Foundation spec exactly.

---

## Tech Stack

### Mobile (`deenQuestApplication/`)
- Expo SDK 54 · React Native 0.81.5 · React 19 · TypeScript
- Firebase JS SDK v10 (Auth + Firestore)
- expo-av (audio playback + recording)
- lucide-react-native · react-native-safe-area-context
- React Navigation v6 (bottom tabs + stack)
- Deep link scheme: `deenquest://`

### Web (`deenquest/`)
- Next.js 15 (App Router) · TypeScript · Tailwind CSS v4
- Firebase Admin SDK + Firebase client SDK
- Quran Foundation Content & User APIs (OAuth2)
- OpenAI Whisper — recitation accuracy checking
- Groq + Mistral + DeepSeek — LLM chain (Groq primary, others as fallback)
- Quran MCP server (`mcp.quran.ai`) — AI grounding
- Vercel — deployment + CI gating

---

## Running Locally

### Web App
```bash
cd deenquest
npm install
cp .env.example .env.local    # fill in your keys
npm run dev                    # http://localhost:3000
npm test
```

### Mobile App
```bash
cd deenQuestApplication
npm install --legacy-peer-deps
npx expo start --clear         # scan QR with Expo Go (SDK 54)
npm test
```

### Required Environment Variables (Web)
```
FIREBASE_SERVICE_ACCOUNT_BASE64=    # base64(service-account.json) — Admin SDK
NEXT_PUBLIC_FIREBASE_*=             # Firebase client config
QF_CLIENT_ID / QF_CLIENT_SECRET=    # Quran Foundation OAuth2
QF_AUTH_BASE_URL=                   # https://auth.quran.foundation
QF_USER_API_BASE_URL=               # https://apis.quran.foundation
OPENAI_API_KEY=                     # Whisper speech checking
GROQ_API_KEY=                       # Primary LLM
MISTRAL_API_KEY=                    # Fallback LLM
DEEPSEEK_API_KEY=                   # Second fallback LLM
```

---

## Tests

```
deenquest/src/__tests__/
  arabic-utils.test.ts   — 15 tests  (normalize + word-level accuracy scoring)
  tasks-data.test.ts     —  6 tests  (deterministic daily task rotation)
  streakUtils.test.ts    —  6 tests  (streak states: healthy / recovery / broken)

deenQuestApplication/src/__tests__/
  tasks-data.test.ts     —  5 tests
  streakUtils.test.ts    —  6 tests
```

GitHub Actions runs both suites in parallel on every push. Production deploys are gated behind passing tests on `main`.

---

## Firestore Schema (Summary)

```
users/{uid}
  name, email, xp, streak, goal, level, timePerDay
  quranProgress { surahNumber, ayahNumber }   ← complete-Quran path
  currentDay                                  ← learn path (1-based)
  sessionsToday, lastSessionDate
  qfAccessToken, qfRefreshToken, qfTokenExpiresAt
  preferredTheme, preferredTranslationId

users/{uid}/bookmarks/{verseKey}
  verseKey, surahName, arabic, translation, collectionName?, createdAt

userTasks/{auto}
  userId, taskId, completed, date, isStreakRecovery?

posts/{auto}  /  posts/{id}/answers/{auto}
  userId, userName, title, content, type, upvotes, upvotedBy[], createdAt
```

---

## Live Demo

| Platform | Link |
|----------|------|
| Web app  | [quran-hackathon-omega.vercel.app](https://quran-hackathon-omega.vercel.app) |
| Android  | `eas build --profile preview --platform android` |

---

*All Quranic content is fetched live from the Quran Foundation APIs and Quran MCP server — never hardcoded. If a source is unavailable, the app fails gracefully and prompts a retry.*
