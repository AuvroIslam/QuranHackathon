# Quran Foundation API — Credentials & Environment Details

---

## Environments

### Production (Live) ✅ Active — Confirmed by Basit Minhas, Apr 30 2026
| Field | Value |
|-------|-------|
| Client ID | see `.env.local` → `QF_CLIENT_ID` |
| Client Secret | see `.env.local` → `QF_CLIENT_SECRET` |
| OAuth Endpoint | `https://oauth2.quran.foundation` |
| User API Base | `https://apis.quran.foundation` |
| Content API Base | `https://apis.quran.foundation/content/api/v4` |

- Full Quran content + all user/auth features enabled
- User auth scopes granted: `bookmark`, `reading_session`, `activity_day`, `goal`, `collection`
- Same client ID used for both content (client_credentials) and user (PKCE) flows
- Callback URL registered: `https://quran-hackathon-omega.vercel.app/auth/qf-callback`

### Pre-Production (Testing) — archived, no longer in use
| Field | Value |
|-------|-------|
| OAuth Endpoint | `https://prelive-oauth2.quran.foundation` |
| User API Base | `https://apis-prelive.quran.foundation` |

- Credentials still in possession but app is now fully on production

---

## Environment Variables (`.env.local` + Vercel)

```env
# Production OAuth (user + content — same client)
QF_CLIENT_ID=<prod client id>
QF_CLIENT_SECRET=<prod client secret>
NEXT_PUBLIC_QF_CLIENT_ID=<prod client id>
QF_OAUTH_BASE_URL=https://oauth2.quran.foundation
NEXT_PUBLIC_QF_OAUTH_BASE_URL=https://oauth2.quran.foundation

# Content API (same production credentials)
QF_CONTENT_CLIENT_ID=<prod client id>
QF_CONTENT_CLIENT_SECRET=<prod client secret>

# QF_USER_API_BASE_URL is NOT set — all user API routes default to https://apis.quran.foundation
```

---

## OAuth2 Flow (User APIs)

**Type:** Authorization Code + PKCE (browser-safe, no secret exposed)

```
1. Browser generates PKCE verifier + challenge + state
2. Redirect user to: {NEXT_PUBLIC_QF_OAUTH_BASE_URL}/oauth2/auth
   Params: response_type=code, client_id, redirect_uri, scope, state,
           code_challenge, code_challenge_method=S256
3. User authenticates on Quran.com login page
4. Callback to /auth/qf-callback with ?code=...&state=...
5. Frontend sends code + code_verifier + redirect_uri to /api/qf/token
6. Backend exchanges with: {QF_OAUTH_BASE_URL}/oauth2/token
   (uses Basic auth with client_id:client_secret)
7. access_token stored in sessionStorage
```

**Scopes (parent scopes only — child scopes cause errors):**
```
openid offline_access bookmark reading_session activity_day goal collection
```

**Required API Headers:**
```
x-auth-token: <access_token>
x-client-id: <client_id>
Content-Type: application/json
```

---

## Content API Authentication

**Type:** Client Credentials (server-side only, never exposed to browser)

```
POST https://oauth2.quran.foundation/oauth2/token
Authorization: Basic base64(client_id:client_secret)
Content-Type: application/x-www-form-urlencoded
Body: grant_type=client_credentials
```

Token cached server-side (~1 hour validity). Public fallback (`api.quran.com/api/v4`) used when authenticated endpoint fails.

---

## API Endpoints Used

### Content APIs
| Endpoint | Purpose |
|----------|---------|
| `GET /chapters` | List all 114 surahs |
| `GET /verses/by_chapter/{id}` | Verses for a surah |
| `GET /verses/by_key/{key}` | Single verse by key (e.g. 2:255) |
| `GET /recitations/7/by_chapter/{id}` | Audio files (Mishary Alafasy) |
| `GET /tafsirs/169/by_ayah/{key}` | Ibn Kathir tafsir |
| `GET /search?q=...` | Full-text verse search |

### User APIs (Production)
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/v1/bookmarks` | GET | Fetch user's bookmarks |
| `/auth/v1/bookmarks` | POST | Add ayah bookmark |
| `/auth/v1/bookmarks` | DELETE | Remove bookmark |
| `/auth/v1/reading-sessions` | POST | Sync current listening position |
| `/auth/v1/goals` | GET | Fetch user's daily verse goal |
| `/auth/v1/goals` | POST | Set daily verse goal |

### Quran MCP
| Tool | Purpose |
|------|---------|
| `search_quran` | Semantic search for AI grounding |
| `fetch_quran` | Fetch specific verse text |
| `fetch_translation` | Fetch translation |
| `fetch_tafsir` | Fetch tafsir |

---

## Scope Change Notes (Apr 30 2026)

QF uses **parent scopes only** — requesting child scopes (e.g. `bookmark.read`) causes auth errors.

| Old (broken) | New (correct) |
|---|---|
| `bookmark.read`, `bookmark.create`, `bookmark.delete` | `bookmark` |
| `reading_session.read`, `reading_session.create` | `reading_session` |
| `activity_days.write` | `activity_day` |
| `goals.read`, `goals.write` | `goal` |
| `collections.read`, `collections.write` | `collection` |

---

## Vercel Deployment Checklist

Ensure these are set in Vercel project settings → Environment Variables:

- [ ] `QF_CLIENT_ID` → production client ID
- [ ] `QF_CLIENT_SECRET` → production client secret
- [ ] `QF_CONTENT_CLIENT_ID` → same as above
- [ ] `QF_CONTENT_CLIENT_SECRET` → same as above
- [ ] `NEXT_PUBLIC_QF_CLIENT_ID` → production client ID
- [ ] `QF_OAUTH_BASE_URL` → `https://oauth2.quran.foundation`
- [ ] `NEXT_PUBLIC_QF_OAUTH_BASE_URL` → `https://oauth2.quran.foundation`
- [ ] `QF_USER_API_BASE_URL` → **delete this var** (routes default to production)
