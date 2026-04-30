# 📄 Quran Hackathon — Official Requirements & Context

---

# 🏆 1. Hackathon Overview

This hackathon challenges participants to:

> Build technology that **strengthens people's connection with the Quran** and helps maintain that connection beyond Ramadan.

**Organized & Sponsored by:** Provision Launch + Quran Foundation

Participants may build:

* Web apps
* Mobile apps
* AI-powered tools
* Developer tools or platforms

Teams: up to 4 members. Open worldwide to developers, designers, students, entrepreneurs, vibe coders, product managers, researchers, OSS contributors.

---

# 🎯 2. Core Problem Statement

Millions of people reconnect with the Quran during Ramadan, but struggle to maintain that connection afterward.

The goal is to create solutions that:

* Improve accessibility
* Deepen understanding
* Build consistent habits
* Enable new ways of engagement

---

# 📦 3. Mandatory Technical Requirements

Every project MUST integrate **at least one from each category**:

## 3.1 Content APIs (Required)

At least one of the following (or Quran MCP):

* Quran APIs (verses, chapters)
* Audio APIs (recitations)
* Tafsir APIs (explanations)
* Translation APIs
* Post APIs (lessons & reflections)

## 3.2 User APIs (Required)

At least one of the following:

* Bookmarks
* Collections
* Streak Tracking
* Activity & Goals APIs
* Post APIs (user-generated reflections)

---

# 🔗 4. Quran Foundation API System

## 4.1 Content APIs

Access to: Quran chapters/verses, translations (50+), audio recitations, tafsir (classical & modern), full-text search.

## 4.2 Authentication

Content APIs: OAuth2 Client Credentials flow (server-side only).
User APIs: OAuth2 Authorization Code + PKCE flow.

Required headers for all User API calls:
- `x-auth-token` — JWT access token
- `x-client-id` — your client ID

## 4.3 User APIs

Enable: bookmarks, reading sessions, goals, streaks, collections, notes, preferences.

---

# 🤖 5. Quran MCP (Model Context Protocol)

Server: `https://mcp.quran.ai`  
Protocol: JSON-RPC over streamable HTTP / SSE

Capabilities:
* Quran text (multiple recitations)
* 50+ translations
* Tafsir from multiple scholars
* Full-text semantic search
* Word-level analysis (morphology)

> AI models must fetch verified Quran data dynamically via MCP — not rely on training memory.

---

# ⚙️ 6. Allowed Technology Scope

* Any frontend framework (React, Next.js, Flutter, etc.)
* Any backend system
* AI models (LLMs, assistants)
* External APIs (as long as QF APIs are used)

---

# 🧪 7. Judging Criteria (100 Points)

## 7.1 Impact on Quran Engagement — 30 pts
How well does the application help users connect more deeply with the Quran?

## 7.2 Product Quality & UX — 20 pts
Design quality, usability, and accessibility.

## 7.3 Technical Execution — 20 pts
Code quality, stability, and overall functionality.

## 7.4 Innovation & Creativity — 15 pts
Originality of concept and fresh approaches.

## 7.5 Effective Use of APIs — 15 pts
Quality and depth of Quran Foundation API integration.

**Tiebreaker:** Higher Impact score wins.

---

# 💰 8. Prize Pool — $10,000

| Place | Prize |
|-------|-------|
| 1st | $3,000 |
| 2nd | $2,500 |
| 3rd | $1,750 |
| 4th | $1,250 |
| 5th | $750 |
| 6th | $500 |
| 7th | $250 |

---

# 📅 9. Timeline

| Phase | Date |
|-------|------|
| Launch | Ramadan 2026 |
| Development | Ramadan — Shawwal 1447 |
| **Submission Deadline** | **May 20, 2026 (Early Dhu al-Hijjah 1447)** |
| Judging | 1–2 weeks after deadline |
| Winners Announced | After judging |

---

# 📤 10. Submission Requirements

Each submission must include:

* Project title
* Team member names
* Short description
* Detailed explanation of the idea
* Live demo or working app link
* GitHub repository (if available)
* 2–3 minute demo video
* API usage description

Submit at: https://launch.provisioncapital.com/quran-hackathon

---

# 🧠 11. Key Technical Expectations

* Proper use of Quran Foundation APIs
* Secure API integration (OAuth2 where required)
* Reliable and accurate Quran data usage
* Avoid misrepresentation or incorrect citations
* Use verified sources (API/MCP instead of hardcoded text)

---

# 🚨 12. Constraints & Best Practices

* Do NOT hardcode Quran text manually
* Always fetch from APIs or MCP
* Ensure correct attribution of verses and tafsir
* Maintain respectful and accurate representation
* Avoid misleading or incorrect interpretations

---

# 🔗 13. Important Resources

* Hackathon Page: https://launch.provisioncapital.com/quran-hackathon
* API Documentation: https://api-docs.quran.foundation/
* Quran MCP: https://mcp.quran.ai/
* Hackathon Support: Hackathon@quran.com
* Developer Support: developers@quran.com

---

# 📌 Final Note

The primary goal is not just technical implementation, but to build meaningful tools that:

> Strengthen long-term engagement with the Quran through technology.
