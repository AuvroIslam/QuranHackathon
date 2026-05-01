# DeenQuest AI — Project Features

> **Your Journey Back to the Quran** — A gamified, AI-powered Quran companion built for the Quran Foundation Hackathon.

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
| Quran Foundation Content API v4 | Auth + Public Fallback | Verses, chapters, translations, recitations, tafsir, search |
| Quran Foundation User API v1 | OAuth2 PKCE (production) | Bookmarks, reading sessions, goals, activity days, collections |
| Quran MCP Server | `mcp.quran.ai` | Verified Quran grounding via JSON-RPC tools |
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
| `QF_API_URL` | Quran Foundation public API base (`https://api.quran.com/api/v4`) |
| `QF_CONTENT_CLIENT_ID` | QF Content API OAuth client ID (production, server-side only) |
| `QF_CONTENT_CLIENT_SECRET` | QF Content API OAuth client secret (production, server-side only) |
| `QF_CLIENT_ID` | QF production OAuth client ID (server-side only) |
| `QF_CLIENT_SECRET` | QF production OAuth client secret (server-side only) |
| `QF_OAUTH_BASE_URL` | QF OAuth token exchange base (`https://oauth2.quran.foundation`) |
| `QF_AUTH_BASE_URL` | QF goals/activity-days/streaks base (`https://auth.quran.foundation`) |
| `NEXT_PUBLIC_QF_CLIENT_ID` | QF OAuth client ID used by browser PKCE flow |
| `NEXT_PUBLIC_QF_OAUTH_BASE_URL` | QF OAuth authorize endpoint base used by browser |
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
- **Mood-Based Ayah Finder** — Select a mood or type a custom situation to receive a relevant Quran verse with AI-generated personal explanation
- **Quran.com Bookmark Sync** — Connect Quran.com account via OAuth2 PKCE and save shown ayah via QF User API bookmarks (syncs across all Quran.com apps)
- **Daily Tasks** — 3 rotating Quran-referenced tasks per day, complete to earn XP
- XP progress bar with level info

### 2. Login (`/login`)
- Google Sign-In (popup)
- Email/Password sign-in and sign-up
- Auto-creates user profile on first login

### 3. AI Chatbot (`/chatbot`)
- Full conversational AI for Quranic Q&A
- Chat bubble interface with **markdown rendering** (bold, lists, etc.)
- Suggested starter questions
- **Context window** — last 8 messages sent to AI to prevent token bloat
- **Session persistence** — chat history saved to sessionStorage, survives page navigation
- **MCP Verify toggle** (top-left) — force Quran MCP grounding on every message, on by default

### 4. Community (`/community`)
- **Keyword search bar** — filter posts by title or content
- Create posts with **title + description** (type: Question or Reflection)
- **Edit / Delete own posts** — inline confirmation UI (no browser confirm dialogs)
- Upvote posts
- **Threaded replies** — reply to posts, reply to replies (nested threading)
- Upvote individual replies
- **Share from Home** — "Share as Community Reflection" pre-fills the form and navigates here
- **Session persistence** — posts cached in sessionStorage

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
- **Read + Listen together** — verse-by-verse player with Arabic text + English translation
- **Per-verse Tafsir** — inline Ibn Kathir tafsir panel per verse (lazy loaded)
- Play/Pause, Previous/Next verse controls
- **Auto-advance** — automatically plays next verse when current ends
- **Random** — jump to a random surah + random verse
- **Progress tracking** — per-surah last-verse saved to Firestore; resumes where you left off
- **Quran.com Reading Session Sync** — posts current verse to QF reading sessions API when connected
- **Daily Goal** — set time (min/day) or pages/day goal synced to Quran.com account
  - Goal type: `QURAN_TIME` or `QURAN_PAGES` (correct QF API format)
  - Saves to localStorage + Firestore + Quran.com simultaneously
- **Activity Tracking** — each verse played reports ranges + seconds to QF activity-days API
  - Automatically updates streak, goal progress, and verse count on Quran.com
- **Live Progress Bar** — fetches today's plan from QF after each verse: % done, verses read, minutes
- Stats bar: total verses listened, surahs started

### 7. Dawah (`/dawah`)
- 12 predefined topics + custom topic input
- AI-generated comparative dawah response in 3 sections:
  - **What Quran Says** — with verified ayah references (MCP grounded)
  - **What Other Scriptures Say** — Bible, Bhagavad Gita, Torah with quotes
  - **Why Quranic Reasoning is Stronger**
- **MCP Grounded** — `search_quran` called before AI to fetch verified verses
- **Session persistence** — last topic + results saved to sessionStorage

### 8. Daily Tasks (`/tasks`)
- Detailed task management view
- 3 tasks per day (rotated from pool of 12)
- Each task has: title, description, Quran ayah reference, deed benefit
- Categories: reading, kindness, prayer, charity, memorization, character, listening, dawah, reflection

### 9. Profile Panel (sidebar)
- Opens by clicking user name in navbar
- Inline name editing (saved to Firestore)
- 5-prayer Salah tracker (Fajr, Dhuhr, Asr, Maghrib, Isha) — stored in Firestore per day
- Daily verse goal display
- Quran.com connect / disconnect button
- Bookmarks list (fetches from QF when connected)

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
- MCP grounding only runs when page sends `groundingQuery` — chatbot/home never trigger MCP
- Grounding context capped at 2000 chars
- Chatbot sliding window (last 8 messages) prevents token bloat
- Dawah prompt has strict per-field character limits to prevent JSON truncation

---

## External APIs & MCP Used

### Firebase
- Authentication (Google + Email/Password)
- Cloud Firestore (users, tasks, community posts/replies, listening progress, salah, goals)

### AI Providers
- Groq: `https://api.groq.com/openai/v1/chat/completions`
- Mistral: `https://api.mistral.ai/v1/chat/completions`
- DeepSeek: `https://api.deepseek.com/chat/completions`

### Quran Foundation Content APIs
- Authenticated base: `https://apis.quran.foundation/content/api/v4`
- Public fallback: `https://api.quran.com/api/v4`
- Content OAuth: `https://oauth2.quran.foundation/oauth2/token` (client credentials)
- Endpoints used:
  - `GET /verses/random`
  - `GET /verses/by_key/{verseKey}`
  - `GET /quran/translations/20`
  - `GET /chapters`
  - `GET /search`
  - `GET /verses/by_chapter/{chapterId}`
  - `GET /recitations/7/by_chapter/{chapterId}`
  - `GET /tafsirs/169/by_chapter/{chapterId}`

### Quran Foundation User APIs (OAuth2 PKCE — Production)
- OAuth authorize: `https://oauth2.quran.foundation/oauth2/auth`
- OAuth token exchange: `https://oauth2.quran.foundation/oauth2/token`
- User API base: `https://apis.quran.foundation`
- Auth API base: `https://auth.quran.foundation` (goals, activity-days, streaks)
- Scopes: `openid offline_access bookmark reading_session activity_day goal collection`
- Endpoints used:
  - `POST /auth/v1/bookmarks` — save ayah bookmark
  - `GET /auth/v1/bookmarks` — fetch user bookmarks
  - `DELETE /auth/v1/bookmarks` — remove bookmark
  - `POST /auth/v1/reading-sessions` — sync listening position
  - `POST /v1/goals` — create/update daily reading goal (QURAN_TIME or QURAN_PAGES)
  - `GET /v1/goals/get-todays-plan` — fetch today's progress toward goal
  - `POST /v1/activity-days` — report verses read (ranges + seconds → updates streak + goal)
  - `GET /v1/streaks` — fetch current streak

### Quran Audio
- `https://audio.qurancdn.com/` (ayah audio)
- `https://verses.quran.com/` (recitation files for listen page)

### Quran MCP
- Server: `https://mcp.quran.ai`
- Protocol: JSON-RPC over streamable HTTP / SSE
- Runtime tool: `search_quran` (Dawah page grounding)
- Available helpers (implemented): `fetch_quran`, `fetch_translation`, `fetch_tafsir`

---

## API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/deepseek` | POST | AI chat with optional MCP grounding |
| `/api/quran` | GET | Proxy to QF Content API v4 |
| `/api/quran/search` | GET | Proxy to QF Search API |
| `/api/qf/token` | POST | OAuth2 PKCE code exchange for Quran.com access token |
| `/api/qf/bookmark` | GET / POST / DELETE | List/add/remove ayah bookmarks in Quran.com |
| `/api/qf/reading-session` | POST | Sync current listening position to Quran.com |
| `/api/qf/goals` | GET / POST | Fetch today's goal progress / create goal on Quran.com |
| `/api/qf/streak` | GET / POST | Fetch streak / report activity (ranges + seconds) |
| `/api/qf/collections` | GET / POST | List collections / add bookmark to collection |

---

## Gamification System

- **XP (Hasanat)** — Earned by completing daily tasks (8–20 XP each)
- **5 Spiritual Levels** — Sabr → Shukr → Tawakkul → Ihsan → Taqwa
- **Daily Streak** — Tracked both locally (Firestore) and on Quran.com via activity-days API
- **Daily Tasks** — 3 rotated per day from pool of 12; all tied to Quran references
- **Daily Goal** — Set time or page target; live progress bar synced from Quran.com

---

## Firestore Collections

| Collection | Doc ID | Fields |
|---|---|---|
| `users` | `{uid}` | name, email, xp, level, streak, lastActive, createdAt, dailyGoal |
| `userTasks` | auto | userId, taskId, completed, date |
| `posts` | auto | userId, userName, title, content, type, upvotes, upvotedBy[], createdAt, updatedAt? |
| `answers` | auto | postId, userId, userName, content, upvotes, upvotedBy[], parentId?, replyToName?, createdAt |
| `listeningProgress` | `{uid}_{chapterId}` | userId, chapterId, chapterName, lastVerse, totalVerses, updatedAt |
| `salah` | `{uid}_{date}` | uid, date, Fajr, Dhuhr, Asr, Maghrib, Isha, updatedAt |

---

## Components

| Component | Description |
|---|---|
| `AuthProvider` | Firebase auth context — Google/Email login, streak calc, profile management |
| `Navbar` | Responsive sidebar (desktop) + hamburger menu + bottom tabs (mobile), 7 nav items |
| `ProfilePanel` | Slide-in panel — name edit, salah tracker, daily goal, bookmarks, Quran.com connect |
| `MoodSelector` | Mood pills + custom situation text input |
| `AyahCard` | Arabic text (RTL) + translation + audio + optional AI explanation + bookmark button |
| `XPBar` | Gradient progress bar with level name + XP remaining |
| `LevelBadge` | All 5 levels with locked/unlocked/current visual states |
| `StreakBadge` | Flame icon + streak day count |
| `PageTooltip` | Help tooltip shown on each page |

---

## Key Library Files

| File | Purpose |
|---|---|
| `quran.ts` | Client-side Quran API wrapper — random ayah, search, audio, surah list, mood mapping |
| `quran-mcp.ts` | Server-side MCP client — JSON-RPC to `mcp.quran.ai` for AI grounding |
| `qf-auth.ts` | Server-side OAuth client-credentials token cache for QF Content API |
| `qf-user-auth.ts` | Client-side Quran.com OAuth2 PKCE flow + token/session storage |
| `firestore.ts` | All Firestore CRUD — users, tasks, posts, answers, listening progress, salah, goals |
| `firebase.ts` | Firebase app/auth/db singleton init |
| `types.ts` | TypeScript interfaces + level definitions + `getLevelInfo()` |
| `tasks-data.ts` | 12 daily tasks pool + `getTodaysTasks()` rotation logic |

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Dashboard / Home
│   ├── layout.tsx                  # Root layout (AuthProvider + Navbar + Toaster)
│   ├── globals.css                 # Tailwind v4 + custom animations
│   ├── login/page.tsx              # Auth page
│   ├── chatbot/page.tsx            # AI chatbot
│   ├── community/page.tsx          # Community forum
│   ├── levels/page.tsx             # Levels display
│   ├── listen/page.tsx             # Quran recitation player + goal tracking
│   ├── dawah/page.tsx              # Comparative dawah with MCP grounding
│   ├── perspective/page.tsx        # Redirects to /dawah
│   ├── tasks/page.tsx              # Daily tasks
│   ├── auth/qf-callback/page.tsx   # Quran.com OAuth callback handler
│   └── api/
│       ├── deepseek/route.ts       # AI endpoint (Groq → Mistral → DeepSeek)
│       ├── qf/
│       │   ├── token/route.ts      # OAuth PKCE token exchange
│       │   ├── bookmark/route.ts   # QF bookmark sync (GET/POST/DELETE)
│       │   ├── reading-session/route.ts  # QF reading session sync
│       │   ├── goals/route.ts      # QF goals — create + today's progress
│       │   ├── streak/route.ts     # QF streak + activity-days reporting
│       │   └── collections/route.ts      # QF collections (GET/POST)
│       └── quran/
│           ├── route.ts            # Quran API proxy
│           └── search/route.ts     # Search proxy
├── components/                     # Reusable UI components
└── lib/                            # Utilities & services
```
