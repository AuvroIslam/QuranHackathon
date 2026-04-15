# DeenQuest AI — Project Features

> **Your Journey Back to the Quran** — A gamified, AI-powered Quran companion built for the Quran Hackathon.

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| Next.js (App Router) | 16.2.3 | Framework |
| React | 19.2.4 | UI Library |
| TypeScript | 5 | Type Safety |
| Tailwind CSS | 4 | Styling |
| Firebase | 12 | Auth + Firestore Database |
| DeepSeek Chat API | `deepseek-chat` | AI Responses |
| Quran Foundation API v4 | Public | Quran Data, Search, Audio |
| Quran MCP Server | `mcp.quran.ai` | AI Grounding with Verified Quran Data |
| lucide-react | — | Icons |
| react-hot-toast | — | Toast Notifications |

---

## Environment Variables (`.env.local`)

The `.env.local` file is committed for team convenience. Variables:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase client config |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase client config |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase client config |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase client config |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase client config |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase client config |
| `DEEPSEEK_API_KEY` | Server-side DeepSeek AI key |
| `QF_API_URL` | Quran Foundation API base (`https://api.quran.com/api/v4`) |
| `QURAN_MCP_URL` | Quran MCP Server (`https://mcp.quran.ai`) |

---

## Getting Started

```bash
cd deenquest
npm install
npm run dev
# Open http://localhost:3000
```

---

## Pages & Features

### 1. Dashboard / Home (`/`)
- Greeting with user stats (Hasanat/XP, Level, Streak, Tasks Today)
- **Mood-Based Ayah Finder** — Select a mood (8 options) or type a custom situation to get a relevant Quran ayah with AI-generated explanation
- **Daily Tasks** — 3 rotating tasks per day, complete to earn XP
- XP progress bar with level info

### 2. Login (`/login`)
- Google Sign-In (popup)
- Email/Password sign-in and sign-up
- Auto-creates user profile on first login

### 3. Ayah Explorer (`/ayah`)
- Random ayah generator
- Keyword search (e.g. "patience", "mercy")
- Each ayah displays: Arabic text (RTL), English translation (Sahih International), surah info
- Audio playback (Mishary Al-Afasy recitation)
- Bookmark ayahs (saved to Firestore)

### 4. AI Chatbot (`/chatbot`)
- Full conversational AI for Quranic Q&A
- Chat bubble interface with message history
- Suggested starter questions
- **MCP Grounded** — AI responses are grounded with verified Quran data from `mcp.quran.ai`

### 5. Community (`/community`)
- Create posts with **title + description** (type: Question or Reflection)
- Upvote posts
- **Threaded replies** — reply to posts, reply to replies (nested threading with indentation)
- "Replying to [name]" labels on nested replies
- Upvote individual replies
- All replies persist across page refreshes

### 6. Levels (`/levels`)
- Visual spiritual journey through 5 levels:
  - **Sabr** (Patience) — 0 XP
  - **Shukr** (Gratitude) — 200 XP
  - **Tawakkul** (Trust in Allah) — 500 XP
  - **Ihsan** (Excellence) — 1,000 XP
  - **Taqwa** (God-consciousness) — 2,000 XP
- Each level shows Arabic name, description, locked/unlocked state
- XP progress bar + streak badge

### 7. Quran Recitation / Listen (`/listen`)
- Browse all 114 surahs with search filter
- Verse-by-verse audio player with Arabic text + English translation
- Play/Pause, Previous/Next verse controls
- **Auto-advance** — automatically plays next verse (toggle on/off)
- **Random** — jump to a random surah + random verse
- **Progress tracking** — per-surah progress saved to Firestore
- **Resume** — clicking a surah resumes from last listened verse
- Stats bar: total verses listened, surahs started
- Completion checkmarks for finished surahs

### 8. Quranic Perspectives (`/perspective`)
- 12 predefined topics (Patience, Justice, Mercy, Women, Prayer, Charity, etc.)
- Custom topic search
- AI-generated scholarly perspective summary
- Related ayahs displayed below

### 9. Daily Tasks (`/tasks`)
- Detailed task management view
- 3 tasks per day (rotated from pool of 12)
- Each task has: title, description, Quran ayah reference, XP reward
- Categories: reading, kindness, prayer, charity, memorization, character, listening, dawah, reflection
- Progress counter (X/3 completed)
- Completing tasks awards XP (Hasanat)

---

## API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/deepseek` | POST | AI chat with MCP grounding — returns `{ content, grounded }` |
| `/api/quran` | GET | Proxy to Quran Foundation Content API v4 |
| `/api/quran/search` | GET | Proxy to Quran Foundation Search API |

---

## Gamification System

- **XP (Hasanat)** — Earned by completing daily tasks (20-40 XP each)
- **5 Spiritual Levels** — Progress from Sabr → Taqwa
- **Daily Streak** — Consecutive login days tracked; resets after >2 day gap
- **Daily Tasks** — 3 rotated per day from pool of 12; tied to Quran references
- **Listening Progress** — Per-surah verse tracking with resume capability

---

## Firestore Collections

| Collection | Doc ID | Fields |
|---|---|---|
| `users` | `{uid}` | name, email, xp, level, streak, lastActive, createdAt |
| `userTasks` | auto | userId, taskId, completed, date |
| `ayahBookmarks` | `{uid}_{verseKey}` | userId, ayahId |
| `posts` | auto | userId, userName, title, content, type, upvotes, upvotedBy[], createdAt |
| `answers` | auto | postId, userId, userName, content, upvotes, upvotedBy[], parentId?, replyToName?, createdAt |
| `listeningProgress` | `{uid}_{chapterId}` | userId, chapterId, chapterName, lastVerse, totalVerses, updatedAt |

---

## Components

| Component | Description |
|---|---|
| `AuthProvider` | Firebase auth context — Google/Email login, streak calc, profile management |
| `Navbar` | Responsive sidebar (desktop) + hamburger menu + bottom tabs (mobile), 8 nav items |
| `MoodSelector` | 8 mood pills + custom situation text input |
| `AyahCard` | Arabic text (RTL) + translation + audio + bookmark + optional AI explanation |
| `XPBar` | Gradient progress bar with level name + XP remaining |
| `LevelBadge` | All 5 levels with locked/unlocked/current visual states |
| `StreakBadge` | Flame icon + streak day count |

---

## Key Library Files

| File | Purpose |
|---|---|
| `quran.ts` | Client-side Quran API wrapper — random ayah, search, audio, surah list, mood mapping |
| `quran-mcp.ts` | Server-side MCP client — JSON-RPC to `mcp.quran.ai` for AI grounding |
| `firestore.ts` | All Firestore CRUD — users, tasks, bookmarks, posts, answers, listening progress |
| `firebase.ts` | Firebase app/auth/db singleton init |
| `types.ts` | TypeScript interfaces + level definitions + `getLevelInfo()` |
| `tasks-data.ts` | 12 daily tasks pool + `getTodaysTasks()` rotation logic |

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Dashboard
│   ├── layout.tsx            # Root layout (AuthProvider + Navbar + Toaster)
│   ├── globals.css           # Tailwind v4 + custom animations
│   ├── login/page.tsx        # Auth page
│   ├── ayah/page.tsx         # Ayah explorer
│   ├── chatbot/page.tsx      # AI chatbot
│   ├── community/page.tsx    # Community forum
│   ├── levels/page.tsx       # Levels display
│   ├── listen/page.tsx       # Quran recitation player
│   ├── perspective/page.tsx  # Topic perspectives
│   ├── tasks/page.tsx        # Daily tasks
│   └── api/
│       ├── deepseek/route.ts # AI endpoint
│       └── quran/
│           ├── route.ts      # Quran API proxy
│           └── search/route.ts # Search proxy
├── components/               # Reusable UI components
└── lib/                      # Utilities & services
```
