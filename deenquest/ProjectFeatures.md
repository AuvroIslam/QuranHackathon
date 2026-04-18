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
| Groq API | `llama-3.3-70b-versatile` | Primary AI (free) |
| Mistral API | `mistral-small-latest` | Secondary AI fallback (free) |
| DeepSeek Chat API | `deepseek-chat` | Final AI fallback (paid) |
| Quran Foundation API v4 | Public | Quran Data, Search, Audio |
| Quran MCP Server | `mcp.quran.ai` | AI Grounding with Verified Quran Data |
| react-markdown | — | Markdown rendering in chatbot |
| lucide-react | — | Icons |
| react-hot-toast | — | Toast Notifications |

---

## Environment Variables (`.env.local`)

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_FIREBASE_*` | Firebase client config |
| `GROQ_API_KEY` | Groq API key (primary AI) |
| `MISTRAL_API_KEY` | Mistral API key (secondary AI) |
| `MISTRAL_DAWAH_MODEL` | Mistral model override (default: `mistral-small-latest`) |
| `DEEPSEEK_API_KEY` | DeepSeek API key (fallback AI) |
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
- **Mood-Based Ayah Finder** — Select a mood or type a custom situation to get a relevant Quran ayah with AI-generated explanation (no unnecessary Quran MCP grounding — verse is already in the prompt)
- **Daily Tasks** — 3 rotating tasks per day, complete to earn XP (reduced XP for balance)
- XP progress bar with level info

### 2. Login (`/login`)
- Google Sign-In (popup)
- Email/Password sign-in and sign-up
- Auto-creates user profile on first login

### 3. AI Chatbot (`/chatbot`)
- Full conversational AI for Quranic Q&A
- Chat bubble interface with **markdown rendering** (bold, lists, etc.)
- Suggested starter questions
- **Context window** — last 8 messages sent to AI to prevent token bloat and rate limits
- **Session persistence** — chat history saved to sessionStorage, survives page navigation

### 4. Community (`/community`)
- **Keyword search bar** — filter posts by title or content
- Create posts with **title + description** (type: Question or Reflection)
- **Edit / Delete own posts** — pencil and trash icons visible only to post creator; ownership verified server-side in Firestore before any change
- Upvote posts
- **Threaded replies** — reply to posts, reply to replies (nested threading with indentation)
- Upvote individual replies
- **Session persistence** — posts cached in sessionStorage, no reload on navigation; cache updated on new post / delete

### 5. Levels (`/levels`)
- Visual spiritual journey through 5 levels:
  - **Sabr** (Patience) — 0 XP
  - **Shukr** (Gratitude) — 200 XP
  - **Tawakkul** (Trust in Allah) — 500 XP
  - **Ihsan** (Excellence) — 1,000 XP
  - **Taqwa** (God-consciousness) — 2,000 XP
- Each level shows Arabic name, description, locked/unlocked/current state
- XP progress bar + streak badge

### 6. Quran Recitation / Listen (`/listen`)
- Browse all 114 surahs with search filter
- Verse-by-verse audio player with Arabic text + English translation
- Play/Pause, Previous/Next verse controls
- **Auto-advance** — automatically plays next verse (toggle on/off)
- **Random** — jump to a random surah + random verse
- **Progress tracking** — per-surah progress saved to Firestore
- **Resume** — clicking a surah resumes from last listened verse
- Stats bar: total verses listened, surahs started

### 7. Dawah (`/dawah`)
- 12 predefined topics + custom topic input
- AI-generated comparative dawah response in 3 sections:
  - **What Quran Says** — 2-3 sentence summary with ayah references
  - **What Other Scriptures Say** — Bible, Bhagavad Gita, Torah entries with quotes and explanation
  - **Why Quranic Reasoning is Stronger** — styled with pink accent card matching current level highlight
- **MCP Grounded** — verified Quran verses fetched for each topic before AI call
- **Session persistence** — last topic + results saved to sessionStorage
- Moon icon in navbar

### 8. Daily Tasks (`/tasks`)
- Detailed task management view
- 3 tasks per day (rotated from pool of 12)
- Each task has: title, description, Quran ayah reference
- Categories: reading, kindness, prayer, charity, memorization, character, listening, dawah, reflection

---

## AI Provider System (`/api/deepseek`)

### Provider Chain
All modes use: **Groq → Mistral → DeepSeek**
- Groq and Mistral are free tier; DeepSeek (paid) only used as last resort

### Modes
| Mode | Max Tokens | Grounding | Used By |
|---|---|---|---|
| `default` | 512 | No | Home, Chatbot |
| `dawah` | 1500 | Yes (MCP) | Dawah page |

### Optimisations
- Grounding only runs when page explicitly sends `groundingQuery` — chatbot/home never trigger MCP search
- Grounding context capped at 2000 chars (was 4000) — sufficient for 2-3 verses
- System prompt concise (~200 chars vs 457 chars previously)
- Dawah prompt has strict per-field character limits to prevent JSON truncation
- Chatbot sliding window (last 8 messages) prevents token bloat

---

## API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/deepseek` | POST | AI chat with optional MCP grounding — returns `{ content, grounded, provider, model, mode }` |
| `/api/quran` | GET | Proxy to Quran Foundation Content API v4 |
| `/api/quran/search` | GET | Proxy to Quran Foundation Search API |

---

## Gamification System

- **XP (Hasanat)** — Earned by completing daily tasks (8–20 XP each, reduced for balance)
- **5 Spiritual Levels** — Progress from Sabr → Taqwa
- **Daily Streak** — Consecutive login days tracked; resets after >2 day gap
- **Daily Tasks** — 3 rotated per day from pool of 12; tied to Quran references

---

## Firestore Collections

| Collection | Doc ID | Fields |
|---|---|---|
| `users` | `{uid}` | name, email, xp, level, streak, lastActive, createdAt |
| `userTasks` | auto | userId, taskId, completed, date |
| `posts` | auto | userId, userName, title, content, type, upvotes, upvotedBy[], createdAt, updatedAt? |
| `answers` | auto | postId, userId, userName, content, upvotes, upvotedBy[], parentId?, replyToName?, createdAt |
| `listeningProgress` | `{uid}_{chapterId}` | userId, chapterId, chapterName, lastVerse, totalVerses, updatedAt |

---

## Components

| Component | Description |
|---|---|
| `AuthProvider` | Firebase auth context — Google/Email login, streak calc, profile management |
| `Navbar` | Responsive sidebar (desktop) + hamburger menu + bottom tabs (mobile), 7 nav items |
| `MoodSelector` | Mood pills + custom situation text input |
| `AyahCard` | Arabic text (RTL) + translation + audio + optional AI explanation |
| `XPBar` | Gradient progress bar with level name + XP remaining |
| `LevelBadge` | All 5 levels with locked/unlocked/current visual states |
| `StreakBadge` | Flame icon + streak day count |
| `PageTooltip` | Help tooltip shown on each page |

---

## Key Library Files

| File | Purpose |
|---|---|
| `quran.ts` | Client-side Quran API wrapper — random ayah, search, audio, surah list, mood mapping |
| `quran-mcp.ts` | Server-side MCP client — JSON-RPC to `mcp.quran.ai` for AI grounding (English only) |
| `firestore.ts` | All Firestore CRUD — users, tasks, posts (with ownership-checked edit/delete), answers, listening progress |
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
│   ├── chatbot/page.tsx      # AI chatbot with markdown + session persistence
│   ├── community/page.tsx    # Community forum with search + edit/delete + cache
│   ├── levels/page.tsx       # Levels display
│   ├── listen/page.tsx       # Quran recitation player
│   ├── dawah/page.tsx        # Comparative dawah with MCP grounding + session persistence
│   ├── perspective/page.tsx  # Redirects to /dawah
│   ├── tasks/page.tsx        # Daily tasks
│   └── api/
│       ├── deepseek/route.ts # AI endpoint (Groq → Mistral → DeepSeek)
│       └── quran/
│           ├── route.ts      # Quran API proxy
│           └── search/route.ts # Search proxy
├── components/               # Reusable UI components
└── lib/                      # Utilities & services
```
