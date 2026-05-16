# DeenQuest — Quran Foundation Hackathon

## What Is DeenQuest?

DeenQuest helps Muslims build a daily habit of connecting with the Quran — just 3, 5, or 10 minutes a day. Instead of overwhelming users with the full Quran at once, it meets them where they are:

- **Read the Quran** — work through all 114 surahs at your own pace, a few ayahs each session
- **Learn to Read Quran** — structured lessons from Arabic letters all the way to full verses, matched to your level (Newbie / Intermediate / Fluent)

Every session ends with XP, a streak update, and progress synced to your Quran.com account. The goal is consistency: show up for 3–10 minutes, every day.

---

## Repository Structure

```
├── deenquest/                  # Next.js 16 web app — deployed on Vercel
├── deenQuestApplication/       # Expo SDK 54 mobile app (iOS + Android)
├── ApiDetails.md               # QF API credentials & endpoint notes
└── README.md                   # This file
```

---

## 1. Web App — `deenquest/`

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Firebase Firestore + Auth · Quran Foundation APIs · Groq / Mistral / DeepSeek LLM chain · OpenAI Whisper · Deployed on Vercel

### Pages

| Route | What it does |
|---|---|
| `/` | Home — mood selector, today's personalised ayah, 3 daily tasks, streak/XP dashboard |
| `/session` | Guided daily session — mood → ayah → reading journey with streak tracking |
| `/listen` | Full Quran reader — 114 surahs, word-by-word Arabic, per-word audio highlight, per-ayah bookmarks with collection picker, tafsir, translation |
| `/setup` | First-time goal wizard — goal → level → time → Quran.com connect |
| `/settings` | Change goal, reading time, translation preference |
| `/community` | Community posts — share reflections and questions (Firestore) |
| `/chatbot` | Islamic Q&A chatbot (Groq-powered, MCP-grounded) |
| `/dawah` | Dawah topic search — Quranic guidance + cross-scripture perspectives |
| `/perspective` | AI reflection on any topic, grounded in verified tafsir |
| `/levels` | XP level system and badge gallery |
| `/login` | Firebase email/password auth |
| `/terms` · `/privacy` | Legal pages |
| `/auth/qf-start` | Initiates Quran Foundation OAuth2 PKCE flow (used by both web and mobile) |
| `/auth/qf-callback` | Handles OAuth callback — exchanges code, stores tokens via Firebase Admin SDK |

### API Routes

> **No Quran text is hardcoded.** Every Arabic ayah, transliteration, and translation is fetched live from the Quran Foundation Content API. If the fetch fails the route returns 503 — the client shows a retry, never a bundled copy.

| Route | Method(s) | What it does |
|---|---|---|
| `/api/quran` | GET | QF Content API proxy — chapters, verses, recitations, tafsir |
| `/api/quran/search` | GET | Full-text Quran search via QF |
| `/api/mood-ayah` | GET | `?mood=` → verified ayah from QF + comprehension MCQ |
| `/api/lessons` | GET | `?level=&day=` → lesson pedagogy + live QF verse text |
| `/api/lessons/check` | POST | Server-side MCQ answer validation (answer key never sent to client) |
| `/api/hadith` | GET | Authentic hadith from hadithapi.com (Sahih) — LLM only refines search keyword, never authors citations |
| `/api/reflection` | POST | AI reflection on an ayah, grounded in verified tafsir via Quran MCP server |
| `/api/deepseek` | POST | Groq → Mistral → DeepSeek LLM chain; used by chatbot and dawah |
| `/api/speech-check` | POST | Audio → OpenAI Whisper → word-level recitation accuracy |
| `/api/qf/token` | POST | OAuth2 PKCE code → token exchange + Firestore token persistence |
| `/api/qf/bookmark` | GET · POST · DELETE | QF bookmark add / remove / list |
| `/api/qf/collections` | GET · POST | List collections; create named collection; add verse to collection |
| `/api/qf/goal` | POST | Set user's daily reading goal on Quran.com (pages based on time preference) |
| `/api/qf/reading-session` | POST | Sync reading session to QF |
| `/api/qf/streak` | GET · POST | Fetch streak; report activity-day to QF |

### Key Library Files (`src/lib/`)

| File | Purpose |
|---|---|
| `firebase.ts` | Firebase client SDK init |
| `firebase-admin.ts` | Firebase Admin SDK (base64 service account via env var) |
| `firestore.ts` | User profile, XP, streak, bookmarks, QF token helpers |
| `tasks-data.ts` | 12 daily tasks; epoch-day seeded Fisher–Yates shuffle picks 3/day (same algorithm in mobile) |
| `arabic-utils.ts` | `normalize()` + `compareTexts()` — diacritic stripping and word-level accuracy scoring (shared, tested) |
| `streakUtils.ts` | Streak state logic — healthy / recovery-needed / broken |
| `qf-user-auth.ts` | PKCE OAuth helpers, localStorage token management |
| `quran-mcp.ts` | Quran MCP server tool calls for AI grounding |
| `translations.ts` | Translation option list for the UI selector |
| `types.ts` | Shared TypeScript interfaces |

### Environment Variables

```
FIREBASE_SERVICE_ACCOUNT_BASE64=...   # base64(service-account.json) — Admin SDK
NEXT_PUBLIC_FIREBASE_*=...            # Firebase client config
QF_CLIENT_ID / QF_CLIENT_SECRET=...  # Quran Foundation OAuth
QF_AUTH_BASE_URL=...                  # https://auth.quran.foundation
QF_USER_API_BASE_URL=...              # https://apis.quran.foundation
OPENAI_API_KEY=...                    # Whisper (set in Vercel — not in .env.local)
GROQ_API_KEY=...                      # Chatbot (primary LLM)
MISTRAL_API_KEY=...                   # Fallback LLM
DEEPSEEK_API_KEY=...                  # Second fallback LLM
```

---

## 2. Mobile App — `deenQuestApplication/`

**Stack:** Expo SDK 54 · React Native 0.81.5 · React 19 · TypeScript · Firebase JS SDK v10 · expo-av · lucide-react-native · react-native-safe-area-context · Deep link scheme: `deenquest://`

### App Entry Flow

```
SafeAreaProvider
  └── AuthProvider  (Firebase onAuthStateChanged)
        └── RootNavigator
              ├── [loading]         ActivityIndicator
              ├── [not onboarded]   OnboardingScreen  (3 slides → @deenquest_onboarded)
              ├── [no user]         AuthScreen
              ├── [!goalSet]        GoalSetupScreen
              └── [ready]           AppNavigator  (5 tabs)
```

### Tab Navigation

| Tab | Screen | Description |
|---|---|---|
| Home | `HomeScreen` | Greeting, streak/XP/hasanat stats, lesson card, 3 daily tasks |
| Journey | `JourneyScreen` | Full guided session — learn or complete-Quran path |
| Quran | `QuranScreen` | 114 surah browser, per-ayah audio + bookmark with collection picker |
| Explore | `ExploreScreen` | Dawah · Community · Ask AI pill tabs |
| Profile | `ProfileScreen` | Level, badges, bookmarks (with collection labels), Quran.com status, sign out |

### Screens (`src/screens/`)

| Screen | Notes |
|---|---|
| `OnboardingScreen.tsx` | 3 animated slides, shown once |
| `AuthScreen.tsx` | Email/password sign in + sign up; creates Firestore `users/{uid}` doc |
| `GoalSetupScreen.tsx` | Animated wizard: goal → level (learn path) → time → Quran.com connect. Syncs daily goal to QF after connect |
| `HomeScreen.tsx` | Stats, lesson card, 3 deterministic daily tasks, all-done banner |
| `JourneyScreen.tsx` | Learn path (mood → lesson → speak → MCQ → completion) or Complete Quran path (mood → ayah → reading session → completion) |
| `QuranScreen.tsx` | Searchable surah list; per-ayah audio via everyayah.com; bookmark with collection modal |
| `ExploreScreen.tsx` | `DawahTab` · `CommunityTab` · `AskAITab` |
| `ProfileScreen.tsx` | XP levels, 6 badges, bookmarks grouped by collection, QF connection, sign out modal |

### Journey Step Components (`src/components/steps/`)

| Component | Description |
|---|---|
| `LessonIntroStep.tsx` | Day intro — mascot, speech bubble, lesson card, 3D Begin button |
| `MoodSelection.tsx` | 7-mood card grid with custom text input |
| `AyahDisplay.tsx` | Arabic + transliteration + translation + bookmark button |
| `ListenStep.tsx` | Audio playback of the session ayah |
| `SpeakStep.tsx` | Mic → OpenAI Whisper → word-chip accuracy feedback; level-based pass threshold |
| `MCQQuestion.tsx` | 4-option MCQ, answer validated server-side |
| `ActionSelection.tsx` | Spiritual action picker |
| `CompletionStep.tsx` | XP earned + streak summary |

### Other Components (`src/components/`)

| Component | Description |
|---|---|
| `QuranReadingSession.tsx` | Per-ayah reader with audio, mark-as-read, and bookmark modal — used in "Complete Quran" journey |
| `BookmarkCollectionModal.tsx` | Bottom-sheet modal: dropdown selector for Default / existing QF collections / new named collection |
| `NeuButton.tsx` | Neumorphic 3D button |
| `ProgressBar.tsx` | Animated step progress bar |
| `StreakHeader.tsx` | Streak + XP header strip |

### Services (`src/services/api.ts`)

All calls go to `https://quran-hackathon-omega.vercel.app` (Vercel production).

| Function | What it calls |
|---|---|
| `getAyahByMood(mood)` | `GET /api/mood-ayah` |
| `fetchLesson(level, day)` | `GET /api/lessons` |
| `checkLessonAnswer(level, day, i)` | `POST /api/lessons/check` |
| `checkSpeech(audioUri, expectedText)` | `POST /api/speech-check` — fallback is `{ correct: false }` never `true` |
| `syncGoalToQF(accessToken, timePerDay)` | `POST /api/qf/goal` — fire-and-forget |
| `addToQFCollection(token, chapter, verse, collectionId?)` | `POST /api/qf/collections` — adds verse to named collection or default |

---

## 3. Quran.com (QF) Integration

DeenQuest syncs with the user's Quran.com account after they connect via OAuth2 PKCE.

| Feature | Status | Notes |
|---|---|---|
| Bookmarks | Synced | Add/remove via `/api/qf/bookmark` |
| Collections | Synced | Create named collection; add verse directly to collection via `/api/qf/collections` |
| Reading sessions | Synced | After each verse is marked in the Quran reader |
| Daily goal | Synced | Set on setup completion (3 min → 1 page/day, 5 min → 2 pages, 10 min → 4 pages) |
| Activity days / streak | Synced | Reported after each session via `/api/qf/streak` |

**OAuth flow (mobile):**
```
ProfileScreen "Connect Quran.com"
  → opens browser: /auth/qf-start?from=mobile&uid=...
  → redirects to Quran Foundation OAuth server
  → user authenticates
  → /auth/qf-callback exchanges code, saves tokens to Firestore via Admin SDK
  → deep link: deenquest://qf-connected
  → GoalSetupScreen / ProfileScreen saves tokens, syncs pending goal
```

---

## 4. Firestore Schema

### `users/{uid}`
```
name, email, xp, streak, tasksCompleted, lastActive, createdAt
goal: 'complete' | 'learn' | null
level: 'newbie' | 'intermediate' | 'fluent' | null
timePerDay: 3 | 5 | 10 | null
quranProgress: { surahNumber, ayahNumber } | null   # complete path
currentDay: number                                   # learn path, 1-based
lastSessionDate, sessionsToday                       # session rate-limiting
goalSet: boolean
qfAccessToken, qfRefreshToken, qfTokenExpiresAt     # QF OAuth tokens (mobile)
preferredTheme: 'light' | 'dark'
preferredTranslationId: number
```

### `users/{uid}/bookmarks/{verseKey}`
```
verseKey, surahName, arabic, translation, collectionName?, createdAt
```

### `userTasks/{auto}`
```
userId, taskId, completed, date ('YYYY-MM-DD'), isStreakRecovery?
```

### `posts/{auto}` / `posts/{id}/answers/{auto}`
```
userId, userName, title, content, type, upvotes, upvotedBy[], createdAt
```

---

## 5. Lesson Curriculum

- **60 lessons total — 20 per level** (Newbie / Intermediate / Fluent)
- Curriculum lives server-side in `deenquest/src/lib/server/lessons-bank.ts` — pedagogy and verse references only; Arabic text is fetched live from QF
- Newbie: Arabic letters → Bismillah → Al-Fatiha → short surahs
- Intermediate: short surahs (Al-Ikhlas … Al-'Alaq)
- Fluent: powerful verses (Ayatul Kursi, Al-Baqarah 285-286, Ar-Rahman …)
- After lesson 20 the curriculum wraps into a review cycle — `getLesson` never returns null
- `mcq.correctIndex` is `-1` client-side; validated server-side via `/api/lessons/check`
- Mobile level key mapping: `newbie → beginner`, `intermediate → intermediate`, `fluent → fluent`

---

## 6. Daily Tasks & Streak

- 12 tasks in `tasks-data.ts`; a seeded Fisher–Yates shuffle (seed = epoch-day) picks 3 distinct tasks that change every calendar day — same algorithm in both apps
- Streak recovery: 1 missed day → complete 1 recovery task; 2 missed days → 3 tasks; 3+ days → streak resets to 0

---

## 7. Tests & CI

```
deenquest/src/__tests__/
  arabic-utils.test.ts   # 15 tests — normalize + compareTexts
  tasks-data.test.ts     #  6 tests — deterministic daily tasks
  streakUtils.test.ts    #  6 tests — streak state logic

deenQuestApplication/src/__tests__/
  tasks-data.test.ts     #  5 tests
  streakUtils.test.ts    #  6 tests
```

GitHub Actions (`.github/workflows/ci.yml`) runs both test suites in parallel on every push. Vercel production deploy is gated behind passing tests on `main`.

---

## 8. Running Locally

### Web App
```bash
cd deenquest
npm install
npm run dev          # http://localhost:3000
npm test             # run unit tests
```

### Mobile App
```bash
cd deenQuestApplication
npm install --legacy-peer-deps   # React 19 peer dep conflicts
npx expo start --clear           # scan QR with Expo Go (SDK 54)
npm test
```

---

## 9. What Is Complete vs Pending

### Done
- [x] Web app — all pages, API routes, features deployed on Vercel
- [x] Mobile app — all screens, journey flows, Quran reader
- [x] Quran Foundation OAuth2 PKCE (web + mobile)
- [x] QF bookmark sync with named collections and collection picker modal
- [x] QF daily reading goal sync (set on setup + after OAuth connect)
- [x] QF reading-session sync and activity-day / streak sync
- [x] 60-lesson curriculum (20/level), server-side, no hardcoded Quran text
- [x] OpenAI Whisper recitation accuracy with word-chip feedback
- [x] Arabic normalization extracted to `arabic-utils.ts`, latent regex bug fixed
- [x] LLM grounded via Quran MCP server (reflection + chatbot + dawah)
- [x] Hadith sourced from verified API — LLM never authors citations
- [x] Unit test suite — 38 tests across both apps
- [x] GitHub Actions CI — tests gate production deploy
- [x] Streak recovery system (1–3 tasks based on days missed)
- [x] Dark mode (web) + theme toggle (mobile)
- [x] Translation selector (web profile panel + mobile settings)
- [x] ARIA accessibility labels on web

### Pending / Known Issues
- [ ] **Web transliteration** — `/listen` page does not show transliteration; mobile Quran reader does
- [ ] **Translation switching in Quran reader** — multiple translations are fetched but the mobile Quran reader doesn't expose a live switcher mid-session
- [ ] **Accessibility audit (mobile)** — no `accessibilityLabel` / `accessibilityRole` pass done on RN components
- [ ] **Demo video** — needs re-recording to reflect current build

---

## 10. Architecture Notes

### Web Components (`src/components/`)
`AuthProvider` · `Navbar` · `PageContainer` · `PageTooltip` · `ProfilePanel` · `BookmarkModal` · `MoodSelector` · `AyahCard` · `StreakBadge`

### Critical File Locations
- Goal-based routing: `deenQuestApplication/src/screens/JourneyScreen.tsx` — `isLessonDay`, `renderStep`, `handleComplete`
- Lesson bank: `deenquest/src/lib/server/lessons-bank.ts`
- Speech fallback: `deenQuestApplication/src/services/api.ts` — must stay `correct: false`
- App flow gating: `deenQuestApplication/App.tsx`
- QF collections: `deenquest/src/app/api/qf/collections/route.ts` — POST handles create-collection and add-verse-to-collection in one route

### Common Pitfalls
1. `SafeAreaView` must come from `react-native-safe-area-context`, not `react-native`
2. `getLesson` level key is `'beginner'` not `'newbie'` — map via `levelToLessonKey()` in JourneyScreen
3. Firebase requires `unstable_enablePackageExports: true` in `metro.config.js`
4. `OPENAI_API_KEY` is set in Vercel environment variables, not in `.env.local`
5. `checkSpeech` fallback must remain `correct: false` — a server outage should not auto-pass recordings
6. QF collection assignment sends verse coordinates directly (`{ collectionId, chapterNumber, verseNumber }`) — not a chained bookmarkId lookup
