# QuranHackathon — DeenQuest

## Repository Structure

```
├── deenquest/                  # Next.js web application (COMPLETE)
├── deenQuestApplication/       # Expo React Native mobile app (COMPLETE)
├── ApiDetails.md               # QF API credentials & endpoint reference
├── prompt.md                   # Base feature specification
├── questionHackathon.md        # Official hackathon questions & requirements
└── README.md                   # This file
```

> **Security note:** Firebase service account JSON files (`*-firebase-adminsdk-*.json`) are git-ignored at both root and `deenquest/` level. Never commit them.

---

## 1. Web App — `deenquest/` (Next.js, App Router)

### Tech Stack
- Next.js 16, TypeScript, Tailwind CSS v4
- Firebase JS SDK v12 (Firestore + Auth) + Firebase Admin SDK (server-side)
- OpenAI / Groq / Mistral APIs (chatbot, speech check, dawah)
- Quran.Foundation (QF) OAuth2 PKCE + user/content APIs
- Deployed on Vercel

### Pages (`src/app/`)
| Route | Description |
|---|---|
| `/` | Home — mood selector, personalised ayah, today's tasks, streak/XP stats |
| `/session` | Guided session — mood → ayah → reading journey with streak tracking |
| `/listen` | Full Quran reader — surah list, word-by-word Arabic, audio, per-ayah bookmark, tafsir |
| `/community` | Firestore community posts — share reflections & questions |
| `/chatbot` | Ask AI — Islamic Q&A (Groq-powered) |
| `/dawah` | Dawah perspectives — topic search, Quranic guidance, cross-scripture comparison |
| `/perspective` | AI-powered perspective & reflection on any topic |
| `/levels` | XP levels & badge gallery |
| `/login` | Firebase email/password auth |
| `/setup` | Goal setup wizard |
| `/terms` | Terms of service |
| `/privacy` | Privacy policy |
| `/auth/qf-start` | Initiates QF OAuth PKCE flow (mobile deep-link trigger) |
| `/auth/qf-callback` | QF OAuth callback — exchanges code, saves tokens via Admin SDK |

### API Routes (`src/app/api/`) — 14 routes

> **No Quran text is hardcoded.** Every ayah's Arabic / transliteration /
> translation is fetched live by verse key from the Quran Foundation Content
> API (OAuth2 client-credentials; `api.quran.com` public fallback; 1 h cache).
> If verified text can't be fetched the route fails (503) and the client shows
> a retry — it never serves a bundled copy of the Quran.

| Route | Method | Description |
|---|---|---|
| `/api/quran` | GET | QF Content API proxy — verses, chapters, recitations, tafsir |
| `/api/quran/search` | GET | QF full-text Quran search |
| `/api/mood-ayah` | GET | `?mood=` → a verified ayah (fetched live from QF) + a comprehension MCQ. Fetch-or-fail. |
| `/api/lessons` | GET | `?level=&day=` → lesson pedagogy from the server bank, with the verse's Arabic/translation fetched live from QF. Fetch-or-fail. |
| `/api/lessons/check` | POST | Server-side MCQ answer validation — the answer key is never sent to the client |
| `/api/hadith` | GET | `?mood=&situation=` → authentic hadith from hadithapi.com (Sahih) → curated verified bank. The LLM only refines the search keyword; it never authors hadith text or numbers. |
| `/api/reflection` | POST | AI reflection on an ayah, **grounded in verified tafsir from the Quran MCP server** |
| `/api/deepseek` | POST | LLM (Groq → Mistral → DeepSeek) for the chatbot & dawah; grounded via the Quran MCP server |
| `/api/speech-check` | POST | Audio → OpenAI Whisper transcription + word-level recitation accuracy |
| `/api/qf/token` | POST | QF OAuth2 (PKCE) code→token exchange + Firestore token persistence (Admin SDK) |
| `/api/qf/bookmark` | GET/POST/DELETE | QF User API bookmark add/remove |
| `/api/qf/collections` | GET/POST | QF User API collections |
| `/api/qf/reading-session` | POST | QF User API reading-session sync |
| `/api/qf/streak` | GET/POST | QF User API activity-day / streak sync |

> Note: the chatbot UI calls `/api/deepseek` (there is no `/api/chatbot`
> route). MCP grounding lives in `src/lib/quran-mcp.ts` and is used by
> `/api/reflection` and `/api/deepseek`.

### Key Lib Files (`src/lib/`)
- `firebase.ts` — Firebase client SDK init
- `firebase-admin.ts` — Firebase Admin SDK init (base64 service account via `FIREBASE_SERVICE_ACCOUNT_BASE64`)
- `firestore.ts` — User profile, XP, streak, bookmarks, QF token helpers
- `tasks-data.ts` — 12 `DAILY_TASKS`; a seeded (epoch-day) Fisher–Yates shuffle picks 3 distinct tasks that change every calendar day (same algorithm in the mobile app)
- `qf-auth.ts` / `qf-user-auth.ts` — QF PKCE flow, session storage, OAuth state helpers
- `quran.ts` / `quran-mcp.ts` — Quran data helpers + MCP tool calls

### Environment Variables (Vercel + `.env.local`)
```
FIREBASE_SERVICE_ACCOUNT_BASE64=...   # base64(service-account.json) — Admin SDK
NEXT_PUBLIC_FIREBASE_*=...            # Firebase client config
QF_CLIENT_ID / QF_CLIENT_SECRET=...   # Quran Foundation OAuth
OPENAI_API_KEY=...                    # Whisper speech check
GROQ_API_KEY=...                      # Chatbot (primary)
MISTRAL_API_KEY=...                   # Dawah generation
DEEPSEEK_API_KEY=...                  # Fallback
```
See `ApiDetails.md` for the full variable list.

---

## 2. Mobile App — `deenQuestApplication/` (Expo SDK 54, React Native 0.81.5)

### Tech Stack
- Expo SDK 54, React Native 0.81.5, React 19.1.0, TypeScript
- `@react-navigation/bottom-tabs` + `@react-navigation/native`
- Firebase JS SDK v10.14.1 (same Firestore project as web)
- `expo-av` for Quran audio playback
- `lucide-react-native` + `react-native-svg` for icons
- `react-native-safe-area-context` v5.6 — all screens use `SafeAreaView` from this package
- `@react-native-async-storage/async-storage` for local persistence
- Metro config: `unstable_enablePackageExports: true` (required for Firebase CJS modules)
- Deep link scheme: `deenquest://` (registered in `app.json`)

### App Entry Flow (`App.tsx`)
```
SafeAreaProvider
  └── AuthProvider (Firebase onAuthStateChanged)
        └── RootNavigator
              ├── [loading] ActivityIndicator
              ├── [not onboarded] OnboardingScreen
              ├── [no user] AuthScreen
              ├── [!goalSet] GoalSetupScreen
              └── [authenticated + goalSet] AppNavigator (5 tabs)
```

### Tab Navigation
| Tab | Screen | Icon |
|---|---|---|
| Home | `HomeScreen` | Home |
| Journey | `JourneyScreen` | Map |
| Quran | `QuranScreen` | BookOpen |
| Explore | `ExploreScreen` | Compass |
| Profile | `ProfileScreen` | User |

---

## 3. Screens

### `OnboardingScreen.tsx`
3 animated slides → saves `@deenquest_onboarded`

### `AuthScreen.tsx`
Email/password sign in + sign up. Creates Firestore `users/{uid}` doc on first signup.

### `GoalSetupScreen.tsx`
3-step animated wizard (goal → level/time). Saves goal to Firestore + `@deenquest_goal_set`.

### `HomeScreen.tsx`
Arabic greeting, streak/XP/hasanat stats, lesson card, today's 3 tasks (deterministic).

### `JourneyScreen.tsx`
Duolingo-style lesson flow. Learn path: intro → ayah → listen → speak → MCQ → action → completion (lesson + live Quran text fetched from `/api/lessons`, advancing each completed session). Complete Quran path: mood → ayah → reading session → completion.

### `QuranScreen.tsx`
114 surahs, searchable. Per-ayah audio playback via `everyayah.com`.

### `ExploreScreen.tsx`
Pill tab bar: Dawah | Community | Ask AI

### `ProfileScreen.tsx`
Level/XP, 4-stat grid, 6 achievement badges, bookmarks list, Quran.com connection badge, sign out.

---

## 4. Journey Step Components

| Component | Description |
|---|---|
| `LessonIntroStep` | Day intro for learn path (days 1–10) |
| `MoodSelection` | 7 mood card grid with custom text input |
| `AyahDisplay` | Arabic + transliteration + translation with bookmark button |
| `ListenStep` | Audio playback of ayah |
| `SpeakStep` | Mic → Whisper → word-chip accuracy feedback |
| `MCQQuestion` | 4-option MCQ |
| `ActionSelection` | Spiritual action picker |
| `CompletionStep` | XP + streak summary |
| `QuranReadingSession` | Per-ayah reading session — Arabic/transliteration/translation, audio, bookmark button (with loading state) |

---

## 5. QF OAuth Flow (Mobile)

```
ProfileScreen "Connect Quran.com"
  → opens browser: /auth/qf-start
  → redirects to oauth2.quran.foundation
  → user authenticates
  → callback: /auth/qf-callback
  → /api/qf/token (server) exchanges code + saves tokens via Admin SDK → Firestore users/{uid}
  → deep link: deenquest://qf-connected
  → ProfileScreen reads tokens via getQFTokens(uid) → shows green "Connected" badge
```


## 6. Mobile App — Detailed Reference (`deenQuestApplication/`)

### Tech Stack
- Expo SDK 54, React Native 0.81.5, React 19.1.0, TypeScript
- `@react-navigation/bottom-tabs` + `@react-navigation/native` for tab navigation
- Firebase JS SDK v10.14.1 (same project as web)
- `expo-av` for Quran audio playback
- `lucide-react-native` + `react-native-svg` for icons
- `react-native-safe-area-context` v5.6 — **all screens use `SafeAreaView` from this package, NOT from `react-native`**
- `@react-native-async-storage/async-storage` for local storage
- Metro config: `unstable_enablePackageExports: true` (required for Firebase CJS modules)

### App Entry Flow (`App.tsx`)
```
SafeAreaProvider
  └── AuthProvider (Firebase onAuthStateChanged)
        └── RootNavigator
              ├── [loading] ActivityIndicator (purple, COLORS.bg background)
              ├── [not onboarded] OnboardingScreen (3 slides → saves @deenquest_onboarded)
              ├── [no user] AuthScreen (email/password sign in + sign up)
              ├── [goalSet === null] ActivityIndicator (reading AsyncStorage)
              ├── [!goalSet] GoalSetupScreen (3-step wizard → saves @deenquest_goal_set)
              └── [authenticated + goalSet] NavigationContainer → AppNavigator (5 tabs)
```

**Streak check on app open:** `checkDailyStreak(uid)` is called in `RootNavigator` whenever `uid` becomes truthy — increments Firestore streak once per calendar day.

**First sign-in detection:** `user.metadata?.creationTime === user.metadata?.lastSignInTime` is used as fallback when `@deenquest_goal_set` is not in AsyncStorage (handles app reinstall / AsyncStorage wipe — returning users skip goal setup).

### Tab Navigation (`src/navigation/AppNavigator.tsx`)
| Tab | Screen | Icon |
|---|---|---|
| Home | `HomeScreen` | `Home` (Lucide) |
| Journey | `JourneyScreen` | `Map` (Lucide) |
| Quran | `QuranScreen` | `BookOpen` (Lucide) |
| Explore | `ExploreScreen` | `Compass` (Lucide) |
| Profile | `ProfileScreen` | `User` (Lucide) |

### Auth & Context (`src/context/AuthContext.tsx`)
- `AuthProvider` — wraps entire app, listens to `onAuthStateChanged`
- `useAuth()` hook — returns `{ user, uid, loading }`
- Available in every screen — eliminates need for prop drilling

---

## 3. Screens

### `src/screens/OnboardingScreen.tsx`
- 3 animated slides (FlatList, pagingEnabled, scrollEnabled=false)
- Characters: `waving_onboarding`, `reciting`, `reading`
- Purple dot indicator with animated width
- On final slide "Get Started" → saves `@deenquest_onboarded = 'true'` → calls `onDone()`
- Exports `ONBOARDING_KEY = '@deenquest_onboarded'`

### `src/screens/AuthScreen.tsx`
- Toggle between Sign In / Sign Up
- Sign Up: name + email + password → `createUserWithEmailAndPassword` + `updateProfile` + creates Firestore `users/{uid}` doc
- Signup doc fields: `name, email, xp: 0, streak: 0, tasksCompleted: 0, lastActive, createdAt, goal: null, level: null, timePerDay: null, quranProgress: null, currentDay: 1`
- Sign In: `signInWithEmailAndPassword`
- Friendly error messages mapped from Firebase error codes
- Uses `mainBg.png` as background, `waving_onboarding` character

### `src/screens/GoalSetupScreen.tsx` ← NEW
- **Shown once after first sign-in, before the main app**
- 3-step animated wizard (2 steps for "Complete Quran" path, 3 steps for "Learn to Read" path)
- Exports `GOAL_SET_KEY = '@deenquest_goal_set'`
- Animated mascot image + speech bubble changes per step (fade transition)
- **Step 1 — Goal:** "Complete the Quran" or "Learn to Read Quran"
- **Step 2A — Time per day** (Complete path): 3 / 5 / 10 mins with estimated completion time
- **Step 2B — Level** (Learn path): Newbie / Intermediate / Fluent
- **Step 3 — Time per day** (Learn path): 3 / 5 / 10 mins with exercises-per-session estimate
- On finish: calls `saveUserGoal(uid, goal, { level, timePerDay })` → saves to Firestore → writes `@deenquest_goal_set = 'true'` to AsyncStorage → calls `onDone()`
- Uses Duolingo-style 3D cards (`DEPTH.card`, `DEPTH.cardPressed`)
- Mascot images: Step goal = `waving_onboarding`, Step level = `achievement`, Step time = `reading`
- Progress dots at top (fills purple as steps complete)

### `src/screens/HomeScreen.tsx`
- Uses `useAuth()` for uid + user.displayName
- Arabic greeting: `مرحباً، {firstName}`
- **Stats row:** Streak (orange flame), Hasanat (gold star, = xp×2), XP (purple zap)
- **Lesson card:** `ImageBackground(mainBg.png)` + `waving_onboarding` character + `NeuButton` "Begin Now" → navigates to Journey tab
- **Today's Tasks:** 3 tasks from `getTodaysTasks()` (deterministic, same as web), checkable, writes to Firestore on completion
- **All-done banner:** shows `celebrating` character when all 3 tasks complete

### `src/screens/JourneyScreen.tsx` ← UPDATED
- Loads user profile: `userGoal`, `userLevel`, `userTimePerDay`, `currentDay`, `quranProgress`
- **Profile re-fetched on every focus via `useFocusEffect`** — `loadProfile` callback is called on every screen focus, not just on first mount. This ensures a mode switch in ProfileScreen is reflected immediately (JourneyScreen is a tab and doesn't remount).
- **Duolingo-style header** (shown on all steps except completion):
  - `←` (X) circular button → navigates to Home tab via `useNavigation`
  - Thick purple progress bar (fills proportionally with `stepIndex / (totalSteps - 1)`)
  - `⚡ {xpEarned}` badge in amber/gold
- **Learn path:** `'mood'` step always renders `MoodSelection` first. After mood is selected, if `apiLesson` is ready, `handleLearnMoodSelect` uses the lesson content; otherwise falls back to `getAyahByMood`. This ensures the mood screen is never skipped in Learn mode.
- **Complete Quran path:** uses `COMPLETE_STEP_ORDER` (mood → ayah → reading → completion). `'reading'` step renders `QuranReadingSession`
- `passThreshold` per level: newbie = 0.4, intermediate = 0.6, fluent = 0.7
- `showTransliteration`: true for newbie/intermediate, false for fluent
- `ayahCount` for reading session: 3/5/10 based on `timePerDay`
- `handleComplete` calls `incrementCurrentDay(uid)` for learn users on days ≤ 10
- `ContinueButton` uses `DEPTH.button` / `DEPTH.buttonPressed` for 3D press effect
- **No `assets/logo.png` dependency** — brandBar removed in the rewrite

### `src/screens/QuranScreen.tsx`
- **Surah list view:** 114 surahs from `api.alquran.cloud/v1/surah`, searchable by name/number
- **Surah detail view:** Arabic ayahs from `api.alquran.cloud/v1/surah/{number}`
- **Per-ayah audio:** `everyayah.com/data/Alafasy_128kbps/{surah3}{ayah3}.mp3` via `expo-av`
- Play/pause toggle per ayah, single `Audio.Sound` ref (stops previous on new tap)
- Back navigation via `ChevronRight` rotated 180°

### `src/screens/ExploreScreen.tsx`
- Inner pill tab bar: **Dawah | Community | Ask AI**
- Routes to `DawahTab`, `CommunityTab`, `AskAITab`

### `src/screens/ProfileScreen.tsx`
- Shows `user.displayName ?? user.email`
- Level system: Seeker(0) → Student(100) → Reader(300) → Reciter(600) → Hafidh(1000) → Scholar(1500)
- XP progress bar toward next level
- 4-stat grid: Day Streak, Hasanat, Total XP, Tasks Done
- 6 achievement badges (locked/unlocked based on xp/streak/tasksCompleted)
- **Profile re-fetched on every focus via `useFocusEffect`** — streak, XP, and badges update correctly after returning from a session (tab screen doesn't remount)
- Sign Out shows a custom purple neumorphic modal (`DEPTH` press effect) instead of the default `Alert` — "Yes, Sign Out" + "Cancel" buttons
- Mode switch (Learning ↔ Reading): calls `updateUserGoal`, clears journey AsyncStorage cache
- Loads from Firestore `users/{uid}`

---

## 4. Journey Step Components (`src/components/steps/`)

| Component | Description |
|---|---|
| `LessonIntroStep.tsx` | **NEW** — Day intro for learn users (days 1–10). Shows mascot (`pointing_towards_you`), speech bubble, day progress bar, lesson card (title/subtitle/practice list), 3D "Begin Lesson" button |
| `MoodSelection.tsx` | 3-col grid of 7 mood cards with `elementsApp/mood/` images + custom text input |
| `AyahDisplay.tsx` | Arabic ayah + transliteration (if present) + translation + `reading` character |
| `ListenStep.tsx` | Audio playback of ayah + `listening` character |
| `SpeakStep.tsx` | Mic recording → `/api/speech-check` → word-chip feedback. Props: `passThreshold` (level-based), `showTransliteration`. Features: "Hear it again" play button above mic, greyed word chips before recording that light up green/red after |
| `MCQQuestion.tsx` | 4-option MCQ with `thinking` character |
| `ActionSelection.tsx` | Pick a spiritual action with `dua_praying` character |
| `CompletionStep.tsx` | XP + streak summary with `celebrating` character + `mainBg` background |

---

## 5. Other Components (`src/components/`)

| Component | Description |
|---|---|
| `QuranReadingSession.tsx` | **NEW** — Used in Journey for "Complete Quran" users. Fetches 3 APIs in parallel: `alquran.cloud` Arabic + `en.asad` + `en.transliteration`. Per-ayah play/pause audio, mark as read, "Complete Session" button. Props: `surahNumber`, `startAyah`, `ayahCount`, `onComplete(nextSurah, nextAyah)`. Handles surah boundary (advances to next surah when current exhausted). |
| `NeuButton.tsx` | Neumorphic button — dual-shadow via 2 nested `Animated.View`s. `default export NeuButton`, named export `NeuIconButton`. `primary` prop = solid purple. |
| `ProgressBar.tsx` | Animated step progress bar (used internally by older code — superseded by inline progress in JourneyScreen header) |
| `StreakHeader.tsx` | Streak + XP + stars header strip (kept for potential reuse) |

---

## 6. Lib Files (`src/lib/`)

### `firebase.ts`
- `initializeApp` + `initializeAuth` with AsyncStorage React-Native persistence + `getFirestore`
- `auth` is explicitly typed `Auth` and `getReactNativePersistence` is imported with a `@ts-ignore` (it exists in the firebase RN runtime but is missing from this version's web typings) — the project type-checks cleanly with `npm run typecheck`
- Exports: `auth`, `db`, `default app`

### `firestore.ts`

`UserProfile` interface:
```ts
interface UserProfile {
  id: string;
  name: string;
  email: string;
  xp: number;
  streak: number;
  tasksCompleted: number;
  lastActive: string;           // ISO string
  createdAt: string;
  goal?: 'complete' | 'learn' | null;
  level?: 'newbie' | 'intermediate' | 'fluent' | null;
  timePerDay?: 3 | 5 | 10 | null;
  quranProgress?: { surahNumber: number; ayahNumber: number } | null;
  currentDay?: number;          // 1-based, incremented each session for learn users
}
```

Exported functions:
| Function | Description |
|---|---|
| `getUserProfile(uid)` | Fetch full profile from `users/{uid}` |
| `getUserTasksForDate(uid, date)` | Query `userTasks` collection |
| `completeTask(uid, taskId, date, xpReward)` | Batch: write userTask + increment xp/tasksCompleted |
| `addXP(uid, amount)` | Increment xp + update lastActive |
| `completeJourney(uid, xpEarned)` | Increment xp, update lastActive, increment streak if new day |
| `saveUserGoal(uid, goal, options)` | Write goal/level/timePerDay to Firestore. For 'complete' goal: also sets `quranProgress: { surahNumber: 1, ayahNumber: 1 }` |
| `incrementCurrentDay(uid)` | advances `currentDay` after each completed learn session, so the next session serves the next lesson (curriculum wraps after 20) |
| `updateQuranProgress(uid, surahNumber, ayahNumber)` | Write new Quran reading position |
| `checkDailyStreak(uid)` | Called on app open — increments streak once per calendar day using `lastActive` comparison |

### Lesson curriculum (server-side, no hardcoded Quran)
The mobile app no longer bundles any Quran text. The curriculum lives
server-side in `deenquest/src/lib/server/lessons-bank.ts` and holds **only
pedagogy** — verse `reference`, teaching `explanation`, `audioUrl`, `mcq`,
`actionText`. The Arabic / transliteration / translation are fetched live by
verse key from the Quran Foundation Content API inside `/api/lessons`.

- **20 lessons per level (60 total)**, wrapping into a review cycle once
  exhausted (`getLesson` never returns null for a valid day ≥ 1)
- Beginner: Arabic letters → Bismillah → Al-Fatiha → first short surahs
- Intermediate: the short surahs (Al-Ikhlas … Al-'Alaq)
- Fluent: powerful verses (Ayatul Kursi, Al-Baqarah 285-286, Ar-Rahman, …)
- The mobile screen fetches the lesson via `fetchLesson(level, day)` in
  `services/api.ts`; `mcq.correctIndex` is `-1` client-side and validated
  server-side by `/api/lessons/check`
- **Level key mapping in JourneyScreen:** `newbie → beginner`,
  `intermediate → intermediate`, `fluent → fluent`
- The legacy `deenQuestApplication/src/lib/lessons-data.ts` is retained but is
  no longer in the lesson render path

### `tasks-data.ts`
- 12 `DAILY_TASKS`, `getTasksForDate(date)`, `getTodaysTasks()`
- Algorithm: a seeded (epoch-day) Fisher–Yates shuffle picks 3 distinct tasks
  that change every calendar day
- **Must stay in sync with web app's `src/lib/tasks-data.ts`** (identical algorithm)

---

## 7. Services (`src/services/api.ts`)

- `API_BASE = 'https://quran-hackathon-omega.vercel.app'` — live Vercel deployment of web app
- `getAyahByMood(mood)` — GETs `/api/mood-ayah`; returns `{ ayah, question } | null`. The verse text is fetched live from the Quran Foundation API server-side; on failure it returns `null` and the UI shows a retry (no hardcoded Quran fallback)
- `fetchLesson(level, day)` — GETs `/api/lessons`; returns the lesson with live QF verse text, or `null`
- `checkLessonAnswer(level, day, i)` — POSTs `/api/lessons/check` for server-side MCQ validation
- `checkSpeech(audioUri, expectedText)` — POST to `/api/speech-check`. **Fallback on error is `{ spoken: '', score: 0, correct: false, words: [] }` (NOT `correct: true`)**

---

## 8. Types (`src/types/index.ts`)

```ts
export type Mood = 'stressed' | 'sad' | 'grateful' | 'lost' | 'indecisive' | 'justHere' | 'overthinking';
export type UserGoal = 'complete' | 'learn';
export type UserLevel = 'newbie' | 'intermediate' | 'fluent';
export type TimePerDay = 3 | 5 | 10;

export interface Ayah {
  arabic: string;
  transliteration?: string;   // ← added; shown in SpeakStep and AyahDisplay
  translation: string;
  explanation: string;
  audioUrl: string;
  reference: string;
}

export type JourneyStep = 'mood' | 'ayah' | 'listen' | 'speak' | 'mcq' | 'action' | 'reading' | 'completion';

// Learn path: mood → ayah → listen → speak → mcq → action → completion
export const LEARN_STEP_ORDER: JourneyStep[];

// Complete Quran path: mood → ayah → reading → completion
export const COMPLETE_STEP_ORDER: JourneyStep[];
```

---

## 9. Theme (`src/theme.ts`)

```ts
// Colors (purple scheme — DO NOT CHANGE)
primary: '#7C3AED'
primaryLight: '#A78BFA'
primaryDark: '#5B21B6'
primaryBg: '#EDE9FE'
bg: '#F0EBFF'
card: '#FFFFFF'
cardBorder: '#E4D9FF'
accent: '#F59E0B'      // gold — used in XP badge
accentLight: '#FDE68A'
accentDark: '#B45309'
text: '#1E1B4B'
textSub: '#4C4693'
textMuted: '#9D99CC'

// Duolingo-style 3D depth (apply to interactive buttons & cards)
DEPTH.button           = { borderBottomWidth: 4, borderBottomColor: '#5B21B6' }
DEPTH.buttonPressed    = { borderBottomWidth: 0, marginTop: 4 }
DEPTH.card             = { borderBottomWidth: 3, borderBottomColor: '#C4B5FD' }
DEPTH.cardPressed      = { borderBottomWidth: 0, marginTop: 3 }
```

`DEPTH` is used in: `GoalSetupScreen` (all cards), `LessonIntroStep` (Begin button), `JourneyScreen` (Continue button).

---

## 10. Asset Images (`elementsApp/`)

All character images have `-removebg-preview.png` suffix:

| Image | Used In |
|---|---|
| `waving_onboarding` | Onboarding slide 1, AuthScreen, HomeScreen lesson card, GoalSetupScreen (goal step) |
| `reciting` | Onboarding slide 2 |
| `reading` | Onboarding slide 3, AyahDisplay, GoalSetupScreen (time step) |
| `listening` | ListenStep |
| `thinking` | MCQQuestion, AskAITab empty state |
| `celebrating` | CompletionStep, HomeScreen all-done banner |
| `dua_praying` | ActionSelection |
| `thumbsUp_Encouraging` | SpeakStep (correct result) |
| `sad_retry` | SpeakStep (wrong result) |
| `achievement` | ProfileScreen, GoalSetupScreen (level step) |
| `pointing_towards_you` | LessonIntroStep mascot |
| `surprised` | Available, not yet used |
| `mainBg.png` | HomeScreen lesson card, MoodSelection hero, OnboardingScreen, AuthScreen, CompletionStep |
| `alternateBG.png` | Available, not yet used |
| `uiThemeRef.png` | Design reference only |

**Mood images (`elementsApp/mood/`):** `stressed.png, sad.png, grateful.png, lost.png, indecisive.png, overthinking.png, justHere.png`

---

## 11. Firestore Schema

### `users/{uid}`
```
name: string
email: string
xp: number
streak: number
tasksCompleted: number
lastActive: string          // ISO datetime — used for streak calculation
createdAt: string
goal: 'complete' | 'learn' | null
level: 'newbie' | 'intermediate' | 'fluent' | null   // learn path only
timePerDay: 3 | 5 | 10 | null
quranProgress: { surahNumber: number; ayahNumber: number } | null  // complete path only
currentDay: number          // 1-based day counter for learn path (days 1-10)
```

### `userTasks/{auto}`
```
userId: string
taskId: string
completed: boolean
date: string   // 'YYYY-MM-DD'
```

### `posts/{auto}` (shared with web app)
```
userId, userName, title, content, type, upvotes, upvotedBy[], createdAt
```

---

## 12. Firebase Project

- **Project ID:** `quranhackathon`
- **API Key:** `AIzaSyAJxUgFdrKXqQ-ZT6sL8GwirGe0wdw-X-o`
- **App ID:** `1:94900107612:web:cde4b4b02c73c3e8c5e999`
- Web and mobile share the **same Firestore database**

---

## 13. What Is Complete vs Pending

### Web App (`deenquest/`) — COMPLETE
All pages, API routes, and features are implemented and deployed.

### Mobile App (`deenQuestApplication/`) — FEATURE COMPLETE

#### Done
- [x] Expo SDK 54 + React Native 0.81.5 setup
- [x] Purple theme with `DEPTH` 3D constants (`src/theme.ts`)
- [x] Firebase auth with AsyncStorage persistence
- [x] `AuthContext` with `useAuth()` hook
- [x] 3-slide `OnboardingScreen` (one-time)
- [x] `AuthScreen` — sign in + sign up + Firestore profile creation (with all new fields)
- [x] `GoalSetupScreen` — 3-step goal wizard (goal → level → time), mascot animations, 3D cards
- [x] `App.tsx` — full flow: onboarding → auth → goal setup → main app
- [x] 5-tab `AppNavigator`
- [x] `HomeScreen` — stats, lesson CTA, today's tasks, Firebase sync
- [x] `JourneyScreen` — Duolingo header, API-driven lesson flow (live QF verse text), Complete Quran path, goal-aware routing
- [x] `LessonIntroStep` — day intro with mascot, progress bar, lesson card, 3D begin button
- [x] Server lesson bank — 60 lessons (20/level), pedagogy + verse reference only, Quran text fetched live from QF (no hardcoded Quran)
- [x] All Journey step components (MoodSelection, AyahDisplay, ListenStep, SpeakStep, MCQQuestion, ActionSelection, CompletionStep)
- [x] `AyahDisplay` — shows transliteration
- [x] `SpeakStep` — play button, word chips, level-based threshold, transliteration option
- [x] `QuranReadingSession` — fetches Arabic + translation + transliteration, per-ayah audio, session completion
- [x] `QuranScreen` — 114 surah browser + ayah reader + audio
- [x] `ExploreScreen` — Dawah, Community, Ask AI tabs
- [x] `ProfileScreen` — levels, badges, stats, sign out
- [x] Speech check fallback bug fixed (`correct: false` not `correct: true`)
- [x] `checkDailyStreak` called on app open
- [x] `incrementCurrentDay` called after each completed learn session (advances to the next lesson)
- [x] No hardcoded Quran text anywhere — all ayah/lesson text fetched live from the Quran Foundation API (fetch-or-fail)
- [x] AI reflection grounded in verified tafsir via the Quran MCP server
- [x] Hadith sourced from hadithapi.com (Sahih) / curated bank — the LLM only refines the search keyword, never authors citations
- [x] 60-lesson curriculum (20 per level), wrapping into a review cycle
- [x] Both codebases type-check cleanly (`npm run typecheck` in the app; `tsc --noEmit` + `next build` for web)
- [x] Unit test suite — 27 tests (web: arabic-utils, tasks-data, streakUtils) + 11 tests (mobile: tasks-data, streakUtils)
- [x] GitHub Actions CI — runs both test suites on every push; deploys to Vercel production only after all tests pass on `main`
- [x] Arabic normalization extracted to `src/lib/arabic-utils.ts` (shared, testable) — fixed a latent regex bug where the diacritic range also stripped base Arabic letters
- [x] `ListenScreen.tsx` removed — was an orphaned "Coming Soon" placeholder not wired into navigation
- [x] **Accessibility (web)** — ARIA roles, labels, and `aria-live` regions added across all major web pages and components (home, session, listen, community, chatbot, dawah, navbar, profile panel)
- [x] **Streak = 0 bug fixed (mobile)** — `HomeScreen` `useFocusEffect` now calls `loadData()` on every focus; streak/XP re-fetched from Firestore when returning from JourneyScreen
- [x] **Profile stale data fixed (mobile)** — `ProfileScreen` `useFocusEffect` now re-fetches the full profile (streak, XP, badges) on every focus, not just on first mount
- [x] **JourneyScreen goal staleness fixed (mobile)** — profile loading extracted into `loadProfile` callback, called in `useFocusEffect`; mode switch from ProfileScreen is reflected immediately without requiring a remount
- [x] **Sign out custom modal (mobile)** — replaced default `Alert.alert` with a custom purple neumorphic modal with `DEPTH` 3D press effect
- [x] **Learning mode mood screen restored** — mood selection always shown first in Learn path; lesson content used after mood is picked (previously `LessonIntroStep` was shown instead, skipping mood)

#### Pending / Known Issues

- [ ] **Listen tab** — A dedicated "Listen" tab for full surah playback with word-by-word highlighting is planned but not yet built. Audio playback currently exists inside `QuranScreen` (per-ayah) and `ListenStep` (within sessions).
- [ ] **Translation switching UI** — The Quran Foundation API supports 50+ translations and they are fetched, but the UI does not expose a language/translation selector. Users cannot switch translations.
- [ ] **Web transliteration** — The web Quran reader (`/listen`) does not show transliteration. The mobile `QuranScreen` and `SpeakStep` do.
- [x] **Accessibility (web)** — ARIA roles and labels added across all major pages and components
- [ ] **Accessibility (mobile)** — No `accessibilityLabel` / `accessibilityRole` audit done on React Native components
- [ ] **Dark / light mode** — Both apps use a fixed purple theme with no user toggle.
- [ ] **Re-record the demo video** — Should reflect the current deployed build with live-fetch lessons, CI pipeline, and test suite.

---

## 14. Running the Projects

### Web App
```bash
cd deenquest
npm install
npm run dev
# Open http://localhost:3000
# .env.local is already included
```

### Mobile App
```bash
cd deenQuestApplication
npm install --legacy-peer-deps   # required: React 19 peer dep conflicts
npx expo start --clear           # --clear flushes Metro bundler cache
# Scan QR with Expo Go (SDK 54) on Android/iOS
```

---

## 15. Handoff Notes for Next LLM

### Architecture overview
The mobile app has two distinct user journeys determined by the `goal` field in Firestore:

**"Learn to Read" (`goal: 'learn'`):**
- Days 1–10: `JourneyScreen` shows `LessonIntroStep` → lesson flows through ayah/listen/speak/mcq/action
- Level-based: `newbie` (all help, 0.4 threshold), `intermediate` (transliteration, 0.6), `fluent` (no transliteration, 0.7)
- After day 10: mood-based free practice (same as complete path without reading session)

**"Complete the Quran" (`goal: 'complete'`):**
- Every session: mood → ayah → `QuranReadingSession` (reading N ayahs from current position) → completion
- N ayahs = 3/5/10 based on `timePerDay`
- Position saved to `quranProgress` in Firestore after each session

### Critical code locations
- Goal-based routing: [JourneyScreen.tsx](deenQuestApplication/src/screens/JourneyScreen.tsx) — `isLessonDay`, `renderStep`, `handleComplete`
- Lesson curriculum: [lessons-data.ts](deenQuestApplication/src/lib/lessons-data.ts) — `getLesson(level, day)`
- Speech check API fallback: [api.ts](deenQuestApplication/src/services/api.ts) — must remain `correct: false`
- App flow gating: [App.tsx](deenQuestApplication/App.tsx) — `onboarded` → `user` → `goalSet` chain
- Firestore writes: [firestore.ts](deenQuestApplication/src/lib/firestore.ts) — `saveUserGoal`, `incrementCurrentDay`, `updateQuranProgress`, `checkDailyStreak`

### Common pitfalls
1. **Don't import `SafeAreaView` from `react-native`** — always use `react-native-safe-area-context`
2. **`getLesson` expects `'beginner'` not `'newbie'`** — map via `levelToLessonKey()` in JourneyScreen
3. **Firebase requires `unstable_enablePackageExports: true`** in metro.config.js — don't remove it
4. **`DEPTH` styles must combine with `SHADOW` separately** — `DEPTH.button` only adds `borderBottomWidth`, it doesn't include shadow. Spread both: `[styles.btn, DEPTH.button, SHADOW.glow(...)]`
5. **`checkSpeech` fallback** — must stay `correct: false`. If server is down, all recordings should fail, not pass silently.
