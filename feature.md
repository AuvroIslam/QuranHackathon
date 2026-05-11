# DeenQuest — Feature List

Both the web app (`deenquest/`) and mobile app (`deenQuestApplication/`) target the same Firebase project and share API routes hosted on Vercel.

---

## Authentication

| Feature | Web | Mobile |
|---|:---:|:---:|
| Email / password sign-up | ✓ | ✓ |
| Email / password sign-in | ✓ | ✓ |
| Firebase Auth persisted session | ✓ | ✓ |
| Quran.Foundation OAuth connect (PKCE) | ✓ | ✓ |
| QF tokens saved server-side (Admin SDK) | ✓ | ✓ |
| QF "Connected" badge | — | ✓ |

---

## Onboarding

| Feature | Web | Mobile |
|---|:---:|:---:|
| 3-slide animated intro | — | ✓ |
| Persistent onboarding flag (`@deenquest_onboarded`) | — | ✓ |
| 3-step goal setup wizard | ✓ | ✓ |
| Goal saved to Firestore + local storage | ✓ | ✓ |

---

## Home / Dashboard

| Feature | Web | Mobile |
|---|:---:|:---:|
| Arabic greeting | — | ✓ |
| Streak counter | ✓ | ✓ |
| XP / level display | ✓ | ✓ |
| Today's 3 daily tasks (deterministic by day-of-year) | ✓ | ✓ |
| Mood-based ayah card | ✓ | ✓ |
| Lesson card (next journey step) | — | ✓ |
| Daily session limit + unlock prompt | ✓ | — |

---

## Journey / Learning Path

| Feature | Web | Mobile |
|---|:---:|:---:|
| Mood selector (7 moods + custom text) | ✓ | ✓ |
| Mood-based personalised ayah | ✓ | ✓ |
| Ayah bookmark from journey | ✓ | ✓ |
| Ayah audio playback | ✓ | ✓ |
| Arabic → transliteration → translation display | ✓ | ✓ |
| Speaking practice (Whisper speech check) | ✓ | ✓ |
| Word-chip accuracy feedback | ✓ | ✓ |
| MCQ quiz step | — | ✓ |
| Spiritual action selection step | — | ✓ |
| Lesson intro slides (days 1–10) | — | ✓ |
| Duolingo-style progress path (10 days + complete path) | — | ✓ |
| XP reward on completion | ✓ | ✓ |
| Streak update on session complete | ✓ | ✓ |

---

## Quran Reading

| Feature | Web | Mobile |
|---|:---:|:---:|
| Full 114-surah list | ✓ | ✓ |
| Surah search | ✓ | ✓ |
| Per-ayah Arabic text | ✓ | ✓ |
| Per-ayah transliteration | ✓ | — |
| Per-ayah translation | ✓ | ✓ |
| Per-ayah audio playback | ✓ | ✓ |
| Per-ayah bookmark button | ✓ | ✓ |
| Bookmark sync to Quran.Foundation | ✓ | ✓ |
| Tafsir display | ✓ | — |
| QF reading session tracking | ✓ | ✓ |
| QF streak reporting (activity-day) | ✓ | — |
| Auto-scroll to playing verse | ✓ | — |
| Reciter selection | ✓ | — |
| Chapter info (revelation type, verse count) | ✓ | — |

---

## Community

| Feature | Web | Mobile |
|---|:---:|:---:|
| View community posts | ✓ | ✓ |
| Create post (reflection / question) | ✓ | ✓ |
| Post type badge (Reflection / Question) | ✓ | ✓ |
| Timestamp display | ✓ | ✓ |
| Firestore real-time listener | ✓ | ✓ |

---

## Chatbot (Ask AI)

| Feature | Web | Mobile |
|---|:---:|:---:|
| Islamic Q&A chatbot | ✓ | ✓ |
| Groq-powered (fast inference) | ✓ | ✓ |
| Streaming responses | ✓ | — |
| Conversation history (multi-turn) | ✓ | ✓ |
| System prompt (Islamic context) | ✓ | ✓ |

---

## Dawah

| Feature | Web | Mobile |
|---|:---:|:---:|
| Preset topic pills | ✓ | ✓ |
| Custom topic text input | ✓ | — |
| Quran ayah search for topic | ✓ | ✓ |
| AI-generated Quranic summary | ✓ | — |
| Cross-scripture comparison (Bible, Gita, Torah) | ✓ | — |
| Ummah-focused reasoning section | ✓ | — |
| Session state persistence (sessionStorage) | ✓ | — |
| Ayah bookmark button | ✓ | ✓ |

---

## Perspective / Explore

| Feature | Web | Mobile |
|---|:---:|:---:|
| AI perspective generation for any topic | ✓ | ✓ |
| Quran verse grounding | ✓ | ✓ |
| Islamic lens summary | ✓ | ✓ |

---

## Profile

| Feature | Web | Mobile |
|---|:---:|:---:|
| Display name | — | ✓ |
| Level & XP progress bar | ✓ | ✓ |
| Streak count | ✓ | ✓ |
| 4-stat grid (sessions, ayahs, days, hasanat) | — | ✓ |
| Achievement badges (6) | — | ✓ |
| Bookmarks list | — | ✓ |
| QF connection status + connect button | — | ✓ |
| Sign out | ✓ | ✓ |

---

## Gamification

| Feature | Web | Mobile |
|---|:---:|:---:|
| XP system | ✓ | ✓ |
| Level up (1–10+) | ✓ | ✓ |
| Hasanat (spiritual points) | ✓ | ✓ |
| Daily streak (Firestore-tracked) | ✓ | ✓ |
| Streak badge UI | ✓ | ✓ |
| Daily task completion tracking | ✓ | ✓ |
| Achievement badges (6 milestones) | — | ✓ |
| Level gallery page | ✓ | — |

---

## Technical Infrastructure

| Feature | Web | Mobile |
|---|:---:|:---:|
| Server-side Firebase Admin SDK | ✓ | — |
| Base64 service account (no `\n` issues) | ✓ | — |
| QF Content API proxy routes | ✓ | ✓ |
| Firestore security rules | ✓ | ✓ |
| PKCE OAuth (no client secret exposure) | ✓ | ✓ |
| Deep link scheme (`deenquest://`) | — | ✓ |
| Glass morphism UI theme | ✓ | — |
| Neumorphic button UI | — | ✓ |
