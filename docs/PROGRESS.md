# Cricket Amigo — Build Progress

Tracks what phase we're in and what's shipped. Update this file every phase (and after meaningful commits).

**Repos:** `cricket-amigo` (Expo app) · `cricket-amigo-backend` (Laravel API)
**Local API:** `https://cricketamigo.test` (Kettle vhost, PHP 8.5, MySQL `cricket_amigo`)

## Phase status

| Phase | Name | Status | Notes |
|---|---|---|---|
| 0 | Foundation + Auth + Docs | ✅ done | Scaffolds, auth, onboarding, i18n, friends, flags — 2026-10-30 |
| 1 | Record + Library | ⬜ next | Guided recording ×4, per-rep capture, trim, SQLite library |
| 2 | AI Coaching | ⬜ | MediaPipe pipeline + coaching packs |
| 3 | Teams + Cloud + Credits | ⬜ | Invites URL/QR, credits ledger, AdMob (off) |
| 4 | Scorer + Live | ⬜ | Ball-by-ball, Reverb, YouTube RTMP + local record |
| 5 | Tournaments + Community | ⬜ | NRR tables, fixtures, leaderboards, boards |
| 6 | Games + Ads + Monetization | ⬜ | Trivia, Catch It, Picks, polite ads |
| 7 | Brazil launch | ⬜ | Play internal test, listings |

## Phase 0 — shipped 2026-10-30

### Backend (`cricket-amigo-backend`)
- Laravel 13.39 on PHP 8.5, MySQL `cricket_amigo`, Sanctum API tokens
- `POST /api/auth/device` — instant guest session per device
- `POST /api/auth/register|login` — email+password (login accepts username or email), device linking
- `POST /api/auth/social/{google|apple}` — contract ready (501 until client IDs)
- `GET|PUT /api/me`, `PUT /api/me/locale`, `POST /api/me/avatar`
- `GET /api/flags` — free_mode, feature flags, ad-UX policy config
- Friends: request/respond/list/suggestions + user search
- Pest 5 suite: 18 tests green

### Mobile (`cricket-amigo`)
- Expo SDK 58, RN 0.88 (new arch), expo-router typed routes, TS strict
- NativeWind v4 + Tailwind theme (pitch green #052e16 / gold accents)
- i18n: i18next + expo-localization, `en` + `pt-BR` (auto-detect + settings switch)
- Auth store (zustand + secure-store): device bootstrap → guest session
- Onboarding: language → interests → role → PUT /me
- Tabs: Train / Library / Score / Live / Play (stubs for phase screens)
- Friends screen: search + requests + add
- Settings: language switcher, profile link, logout
- Brand: cricket-ball icon set generated (icon, adaptive, splash, favicon)

## Known gaps / next decisions
- Social login needs Google/Apple client IDs (backend stubs exist)
- Vhost is HTTP+HTTPS; app points at https://cricketamigo.test via `app.json → extra.apiUrl` — self-signed cert means dev builds must trust it or use http/tunnel for devices. Consider `cloudflared` URL when testing on physical devices.
- `AGENTS.md`/`CLAUDE.md` in backend came with Laravel skeleton — review for useful conventions.
