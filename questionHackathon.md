# 📄 Quran Hackathon — Official Requirements & Context

---

# 🏆 1. Hackathon Overview

This hackathon challenges participants to:

> Build technology that **strengthens people's connection with the Quran** and helps maintain that connection beyond Ramadan.

Participants may build:

* Web apps
* Mobile apps
* AI-powered tools
* Developer tools or platforms

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

Every project MUST integrate:

## 3.1 Content APIs (Required)

At least one (recommended: multiple) of the following:

* Quran APIs (verses, chapters)
* Audio APIs (recitations)
* Tafsir APIs (explanations)
* Translation APIs
* Post APIs (lessons & reflections)

These APIs provide **read-only access to Quranic content** including verses, translations, and recitations. ([api-docs.quran.foundation][1])

---

## 3.2 User APIs (Required)

At least one of the following:

* Bookmarks
* Collections
* Streak Tracking
* Activity & Goals APIs
* Post APIs (user-generated reflections)

These APIs manage **user-specific data** such as progress, saved content, and activity. ([api-docs.quran.foundation][1])

---

# 🔗 4. Quran Foundation API System

## 4.1 Content APIs Capabilities

The Content APIs provide access to:

* Quran chapters and verses
* Translations in multiple languages
* Audio recitations
* Tafsir (classical and modern commentary)
* Search functionality

They are designed for **seamless app integration and scalable usage**. ([api-docs.quran.foundation][2])

---

## 4.2 Authentication Requirements (IMPORTANT)

Content APIs require:

* OAuth2 Client Credentials flow
* Secure backend token handling
* Required headers:

  * `x-auth-token`
  * `x-client-id`

Key rules:

* Store credentials on backend only
* Cache tokens (valid ~1 hour)
* Retry on authentication failure once ([api-docs.quran.foundation][3])

---

## 4.3 User APIs Capabilities

User-related APIs enable:

* User preferences
* Bookmarks
* Reading sessions
* Goals and streaks
* Collections and notes

These APIs are used to create **personalized Quran experiences**. ([api-docs.quran.foundation][2])

---

# 🤖 5. Quran MCP (Model Context Protocol)

## 5.1 What is Quran MCP

Quran MCP is a **Model Context Protocol server** that allows AI systems to access Quran data in a structured and reliable way.

It ensures:

* Accurate Quran text retrieval
* Verified translations and tafsir
* Proper citation and grounding

([GitHub][4])

---

## 5.2 MCP Capabilities

* Quran text (multiple recitations)
* 50+ translations
* Tafsir from multiple scholars
* Full-text search
* Word-level analysis (morphology)

---

## 5.3 Purpose in AI Systems

MCP solves a critical issue:

> AI models should not rely on memory for Quranic content but must fetch verified data dynamically. ([GitHub][4])

---

# ⚙️ 6. Allowed Technology Scope

Participants can use:

* Any frontend framework (React, Next.js, Flutter, etc.)
* Any backend system
* AI models (LLMs, assistants)
* External APIs (as long as Quran Foundation APIs are used)

---

# 🧪 7. Judging Criteria (100 Points)

## 7.1 Impact on Quran Engagement (30 pts)

* Does the solution help users connect deeply with the Quran?

## 7.2 Product Quality & UX (20 pts)

* Design quality
* Usability
* Accessibility

## 7.3 Technical Execution (20 pts)

* Code quality
* Stability
* Performance

## 7.4 Innovation & Creativity (15 pts)

* Originality of idea
* Unique approach

## 7.5 Effective Use of APIs (15 pts)

* Depth and correctness of API integration

---

# 📅 8. Timeline

* Development Period: Ramadan → Shawwal
* Submission Deadline: End of Shawwal (April 20, 2026)
* Judging: 1–2 weeks after submission
* Winners: Top 7 projects

---

# 📤 9. Submission Requirements

Each submission must include:

* Project title
* Team member names
* Short description
* Detailed explanation
* Live demo or working app
* GitHub repository (optional but recommended)
* 2–3 minute demo video
* API usage explanation

---

# 🧠 10. Key Technical Expectations

* Proper use of Quran Foundation APIs
* Secure API integration (OAuth2 where required)
* Reliable and accurate Quran data usage
* Avoid misrepresentation or incorrect citations
* Use verified sources (API/MCP instead of hardcoded text)

---

# 🚨 11. Constraints & Best Practices

* Do NOT hardcode Quran text manually
* Always fetch from APIs or MCP
* Ensure correct attribution of verses and tafsir
* Maintain respectful and accurate representation
* Avoid misleading or incorrect interpretations

---

# 🔗 12. Important Resources

* Hackathon Page
  https://launch.provisioncapital.com/quran-hackathon

* Quran MCP
  https://mcp.quran.ai/

* API Documentation
  https://api-docs.quran.foundation/

---

# 📌 Final Note

The primary goal of this hackathon is not just technical implementation, but to build meaningful tools that:

> Strengthen long-term engagement with the Quran through technology.

[1]: https://api-docs.quran.foundation/docs/tutorials/faq?utm_source=chatgpt.com "Frequently Asked Questions"
[2]: https://api-docs.quran.foundation/?utm_source=chatgpt.com "Quran Foundation API Docs"
[3]: https://api-docs.quran.foundation/docs/quickstart/?utm_source=chatgpt.com "Quran Foundation Content APIs OAuth2 Quickstart"
[4]: https://github.com/quran/quran-mcp?utm_source=chatgpt.com "quran-mcp"
