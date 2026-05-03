# QuranHackathon — DeenQuest

## Repository Structure

```
├── deenquest/                  # Next.js 14 web application (COMPLETE)
├── deenQuestApplication/       # Expo React Native mobile app (IN PROGRESS)
├── prompt.md                   # Base feature specification
├── questionHackathon.md        # Official hackathon questions & requirements
└── README.md                   # This file
```

---

## 1. Web App — `deenquest/` (Next.js 14, App Router)

### Tech Stack
- Next.js 14 (App Router), TypeScript, Tailwind CSS
- Firebase JS SDK v10 (Firestore + Auth)
- OpenAI API (chatbot + speech check)
- Quran.Foundation (QF) API for Quran data & reading sessions
- Deployed on Vercel — `.env.local` is already present in repo

### Pages (`src/app/`)
| Route | File | Description |
|---|---|---|
| `/` | `page.tsx` | Home — mood selector, ayah display, today's tasks |
| `/tasks` | `tasks/page.tsx` | Today's 3 deterministic tasks (same algorithm as mobile) |
| `/community` | `community/page.tsx` | Firestore community posts — share reflections & questions |
| `/chatbot` | `chatbot/page.tsx` | Ask AI — Islamic Q&A powered by OpenAI |
| `/dawah` | `dawah/page.tsx` | Dawah cards — common questions about Islam with shareable ayahs |
| `/listen` | `listen/page.tsx` | Quran listening page via QF API |
| `/levels` | `levels/page.tsx` | XP levels & badges |
| `/perspective` | `perspective/page.tsx` | Perspective / reflection page |
| `/login` | `login/page.tsx` | Firebase email auth |
| `/terms` | `terms/page.tsx` | Terms of service |
| `/privacy` | `privacy/page.tsx` | Privacy policy |
| `/auth/qf-callback` | `auth/qf-callback/page.tsx` | Quran Foundation OAuth callback |

### API Routes (`src/app/api/`)
| Route | Description |
|---|---|
| `/api/chatbot` | POST `{ messages }` → OpenAI response. Used by both web AND mobile AskAI tab |
| `/api/speech-check` | POST audio → OpenAI Whisper transcription check |
| `/api/deepseek` | DeepSeek model fallback |
| `/api/quran` | Quran data proxy |
| `/api/quran/search` | Quran search |
| `/api/qf/token` | QF OAuth token exchange |
| `/api/qf/reading-session` | QF reading session tracking |
| `/api/qf/bookmark` | QF bookmark management |
| `/api/qf/collections` | QF collections |
| `/api/qf/streak` | QF streak data |

### Key Lib Files (`src/lib/`)
- `firebase.ts` — Firebase app + Firestore init
- `firestore.ts` — User profile, XP, streak, task completion helpers
- `tasks-data.ts` — **12 DAILY_TASKS array** — deterministic daily task selection: `dayOfYear % 12` picks 3 tasks. **Identical algorithm used in mobile app.**
- `types.ts` — Shared TypeScript types
- `qf-auth.ts` / `qf-user-auth.ts` — Quran Foundation auth helpers
- `quran.ts` / `quran-mcp.ts` — Quran data helpers

### Environment Variables (Vercel + `.env.local`)
```
OPENAI_API_KEY=...         # Required for /api/chatbot and /api/speech-check
QF_CLIENT_ID=...           # Quran Foundation OAuth
QF_CLIENT_SECRET=...
NEXTAUTH_SECRET=...
```

---

## 2. Mobile App — `deenQuestApplication/` (Expo SDK 54, React Native 0.81.5)

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
- **Duolingo-style header** (shown on all steps except completion):
  - `←` (X) circular button → navigates to Home tab via `useNavigation`
  - Thick purple progress bar (fills proportionally with `stepIndex / (totalSteps - 1)`)
  - `⚡ {xpEarned}` badge in amber/gold
- **Learn path (days 1–10):** `'mood'` step renders `LessonIntroStep` with today's lesson from `getLesson(levelKey, currentDay)`. Tapping "Begin Lesson" calls `selectMood('justHere', lesson.learnContent, lesson.mcq)` → flows into ayah → listen → speak → mcq → action → completion
- **Learn path (days > 10):** `'mood'` step renders `MoodSelection` as free practice
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
- Sign Out button (LogOut icon, top-right) with Alert confirm → `signOut(auth)`
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
- `initializeApp` + `initializeAuth(getReactNativePersistence(AsyncStorage))` + `getFirestore`
- Exports: `auth`, `db`, `default app`
- **If auth fails to initialize** at runtime, change the import line to: `import { initializeAuth, getReactNativePersistence } from 'firebase/auth/react-native'`

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
| `incrementCurrentDay(uid)` | `currentDay: increment(1)` — called after each learn session (days 1–10) |
| `updateQuranProgress(uid, surahNumber, ayahNumber)` | Write new Quran reading position |
| `checkDailyStreak(uid)` | Called on app open — increments streak once per calendar day using `lastActive` comparison |

### `lessons-data.ts` ← NEW
30 carefully crafted lessons (10 per level). Each lesson:
```ts
interface Lesson {
  day: number;
  title: string;
  subtitle: string;
  focus: string;
  learnContent: LessonContent;  // matches Ayah type — has arabic, transliteration, translation, explanation, audioUrl, reference
  mcq: MCQData;
  actionText: string;
}
```

**Beginner (10 days):** Arabic letters (Alif → dotted letters → Jim/Ha/Kha → curved letters → Sin/Shin + vowels) → first Quranic words → Bismillah mastery → Al-Fatiha 1:2, 1:5, 1:6

**Intermediate (10 days):** Al-Ikhlas → Al-Kawthar → Al-Asr → An-Nasr → Al-Fil → Quraysh → Al-Ma'un → Al-Masad → An-Nas → Al-Falaq

**Fluent (10 days):** Al-Fatiha (tajweed focus) → Ayatul Kursi (2:255) → Al-Baqarah 285 → Al-Baqarah 286 → Al-Imran 18 → Ya-Sin 36:1 → Al-Mulk 67:1 → Al-Rahman 55:1 → Al-Hashr 59:22 → Al-Waqiah 56:77

`getLesson(level: 'beginner' | 'intermediate' | 'fluent', day: number): Lesson | null` — returns `null` for day > 10 (triggers free practice mode in JourneyScreen)

**Level key mapping in JourneyScreen:** `newbie → beginner`, `intermediate → intermediate`, `fluent → fluent`

### `tasks-data.ts`
- 12 `DAILY_TASKS`, `getTasksForDate(date)`, `getTodaysTasks()`
- Algorithm: `dayOfYear % 12` selects 3 tasks
- **Must stay in sync with web app's `src/lib/tasks-data.ts`**

---

## 7. Services (`src/services/api.ts`)

- `API_BASE = 'https://quran-hackathon-omega.vercel.app'` — live Vercel deployment of web app
- `getAyahByMood(mood)` — returns `{ ayah, question }` from `AYAH_BANK`
- `AYAH_BANK` — 17 ayahs covering all 7 moods, **each with `transliteration` field**
- `checkSpeech(audioUri, expectedText)` — POST to `/api/speech-check`. **Fallback on error is `{ spoken: '', score: 0, correct: false, words: [] }` (NOT `correct: true` — this was a bug that has been fixed)**

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
- [x] `JourneyScreen` — Duolingo header, lesson-based flow (days 1–10), free practice (days 11+), Complete Quran path, goal-aware routing
- [x] `LessonIntroStep` — day intro with mascot, progress bar, lesson card, 3D begin button
- [x] `lessons-data.ts` — 30 lessons across beginner/intermediate/fluent
- [x] All Journey step components (MoodSelection, AyahDisplay, ListenStep, SpeakStep, MCQQuestion, ActionSelection, CompletionStep)
- [x] `AyahDisplay` — shows transliteration
- [x] `SpeakStep` — play button, word chips, level-based threshold, transliteration option
- [x] `QuranReadingSession` — fetches Arabic + translation + transliteration, per-ayah audio, session completion
- [x] `QuranScreen` — 114 surah browser + ayah reader + audio
- [x] `ExploreScreen` — Dawah, Community, Ask AI tabs
- [x] `ProfileScreen` — levels, badges, stats, sign out
- [x] Speech check fallback bug fixed (`correct: false` not `correct: true`)
- [x] `checkDailyStreak` called on app open
- [x] `incrementCurrentDay` called after each learn session (days 1–10)

#### Pending / Known Issues

- [ ] **`getReactNativePersistence` import** — if auth fails at runtime, change `firebase.ts` line to: `import { initializeAuth, getReactNativePersistence } from 'firebase/auth/react-native'`
- [ ] **`ListenScreen.tsx`** — `src/screens/ListenScreen.tsx` is a placeholder stub. It is NOT in the tab navigator. Can be safely deleted.
- [ ] **Post-10-day learn curriculum** — after day 10, free practice (mood-based) kicks in automatically. A full day 11+ curriculum is planned for production but not built yet.
- [ ] **OpenAI API key on Vercel** — must be added in the Vercel dashboard for `/api/chatbot` and `/api/speech-check` to work in production.

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
