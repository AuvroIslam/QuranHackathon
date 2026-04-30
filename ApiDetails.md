# Quran Foundation API — Credentials & Environment Details

---

## Environments

### Pre-Production (Testing) ✅ Currently Active
| Field | Value |
|-------|-------|
| Client ID | see `.env.local` → `QF_CLIENT_ID` |
| Client Secret | see `.env.local` → `QF_CLIENT_SECRET` |
| OAuth Endpoint | `https://prelive-oauth2.quran.foundation` |
| User API Base | `https://apis-prelive.quran.foundation` |
| Content API Base | `https://apis.quran.foundation/content/api/v4` |

- All scopes available by default
- Callback URLs registered (confirmed by Basit Minhas, Apr 19)
- Limited dataset but full feature set for testing

### Production (Live) ⚠️ Pending Scope Approval
| Field | Value |
|-------|-------|
| Client ID | see `.env.local` → `QF_CONTENT_CLIENT_ID` |
| Client Secret | see `.env.local` → `QF_CONTENT_CLIENT_SECRET` |
| OAuth Endpoint | `https://oauth2.quran.foundation` |
| User API Base | `https://apis.quran.foundation` |
| Content API Base | `https://apis.quran.foundation/content/api/v4` |

- Full Quran content available
- **NO user/auth features** until production scope approval
- To unlock: submit production callback URL to developers@quran.com

---

## Environment Variables (`.env.local`)

```env
# Pre-production OAuth (user features) — credentials in .env.local only
QF_CLIENT_ID=<pre-prod client id>
QF_CLIENT_SECRET=<pre-prod client secret>
QF_OAUTH_BASE_URL=https://prelive-oauth2.quran.foundation
QF_USER_API_BASE_URL=https://apis-prelive.quran.foundation
NEXT_PUBLIC_QF_CLIENT_ID=<pre-prod client id>
NEXT_PUBLIC_QF_OAUTH_BASE_URL=https://prelive-oauth2.quran.foundation

# Production content (no user features yet) — credentials in .env.local only
QF_CONTENT_CLIENT_ID=<prod client id>
QF_CONTENT_CLIENT_SECRET=<prod client secret>
QF_API_URL=https://api.quran.com/api/v4
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

**Scopes used:**
```
openid offline_access bookmark.read bookmark.create bookmark.delete
reading_session.read reading_session.create
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
| `GET /verses/random` | Random verse |
| `GET /quran/translations/20` | English translation (Saheeh Int'l) |
| `GET /recitations/7/by_chapter/{id}` | Audio files (Mishary Alafasy) |
| `GET /tafsirs/169/by_chapter/{id}` | Ibn Kathir tafsir |
| `GET /search?q=...` | Full-text verse search |

### User APIs (Pre-production)
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/v1/bookmarks` | GET | Fetch user's bookmarks |
| `/auth/v1/bookmarks` | POST | Add ayah bookmark |
| `/auth/v1/bookmarks/{id}` | DELETE | Remove bookmark by ID |
| `/auth/v1/reading-sessions` | POST | Sync current listening position |

### Quran MCP
| Tool | Purpose |
|------|---------|
| `search_quran` | Semantic search for AI grounding (Dawah page) |
| `fetch_quran` | Fetch specific verse text |
| `fetch_translation` | Fetch translation |
| `fetch_tafsir` | Fetch tafsir |

---

## Switching to Production

When production scope is approved:

1. Update Vercel env vars:
   - `QF_CLIENT_ID` → production client ID
   - `QF_CLIENT_SECRET` → production secret
   - `QF_OAUTH_BASE_URL` → `https://oauth2.quran.foundation`
   - `QF_USER_API_BASE_URL` → `https://apis.quran.foundation`
   - `NEXT_PUBLIC_QF_CLIENT_ID` → production client ID
   - `NEXT_PUBLIC_QF_OAUTH_BASE_URL` → `https://oauth2.quran.foundation`

2. Register production callback URL with QF:
   `https://quran-hackathon-omega.vercel.app/auth/qf-callback`

3. No code changes needed — all URLs are env-driven.
