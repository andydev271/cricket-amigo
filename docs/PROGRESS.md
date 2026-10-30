# Cricket Amigo — Build Progress

Tracks what phase we're in and what's shipped. Update this file every phase (and after meaningful commits).

**Repos:** `cricket-amigo` (Expo app) · `cricket-amigo-backend` (Laravel API)
**Local API:** `https://cricketamigo.test` (Kettle vhost, PHP 8.5, MySQL `cricket_amigo`)

## Phase status

| Phase | Name                       | Status  | Notes                                                                   |
| ----- | -------------------------- | ------- | ----------------------------------------------------------------------- |
| 0     | Foundation + Auth + Docs   | ✅ done | Scaffolds, auth, onboarding, i18n, friends, flags — 2026-10-30          |
| 1     | Record + Library           | ✅ done | Guided recording ×4, per-rep capture, trim, SQLite library — 2026-10-30 |
| 2     | AI Coaching                | ⬜      | MediaPipe pipeline + coaching packs                                     |
| 3     | Teams + Cloud + Credits    | ⬜      | Invites URL/QR, credits ledger, AdMob (off)                             |
| 4     | Scorer + Live              | ⬜      | Ball-by-ball, Reverb, YouTube RTMP + local record                       |
| 5     | Tournaments + Community    | ⬜      | NRR tables, fixtures, leaderboards, boards                              |
| 6     | Games + Ads + Monetization | ⬜      | Trivia, Catch It, Picks, polite ads                                     |
| 7     | Brazil launch              | ⬜      | Play internal test, listings                                            |

## Phase 0 — shipped 2026-10-30

### Backend (`cricket-amigo-backend`)

- Laravel 13.39 on PHP 8.5, MySQL `cricket_amigo`, Sanctum API tokens
- `POST /api/auth/device` — instant guest session per device
- `POST /api/auth/register|login` — email+password (login accepts username or email), device linking
- `POST /api/auth/social/{google|apple}` — contract ready (501 until client IDs)
- `GET|PUT /api/me`, `PUT /api/me/locale`, `POST /api/me/avatar`
- `GET /api/flags` — free_mode, feature flags, ad-UX policy config
- Friends: request/respond/list/suggestions + user search
- **Spatie Permission** (`^8`): `member` + `super-admin` roles, seeded permissions
  (`access admin`, `manage users/flags/tournaments`, `moderate content`);
  `Gate::before` grants super-admin everything; `member` auto-assigned on register/device
- **Super admin:** `admin@cricketamigo.com` / `Password@123#` (seeded — rotate before prod)
- **Spatie Media Library** (`^11`): `avatar` collection w/ `thumb` conversion;
  replaces `avatar_path` column; ready for images/PDF reports
- `users.roles` (JSON sport tags) renamed → `sport_roles` — Spatie owns `roles`
- Pest 5 suite: 23 tests, 72 assertions green

### Mobile (`cricket-amigo`)

- Expo SDK 58, RN 0.88 (new arch), expo-router typed routes, TS strict
- NativeWind v4 + Tailwind theme (pitch green #052e16 / gold accents)
- i18n: i18next + expo-localization, `en` + `pt-BR` (auto-detect + settings switch)
- Auth store (zustand + secure-store): device bootstrap → guest session
- Onboarding: language → interests → role → PUT /me (`sport_roles`)
- Tabs: Train / Library / Score / Live / Play (stubs for phase screens)
- Friends screen: search + requests + add
- Settings: language switcher, profile link, logout
- Brand: cricket-ball icon set generated (icon, adaptive, splash, favicon)

## Phase 1 — shipped 2026-10-30

### Mobile (`cricket-amigo`)

- **Guided recorder** `record/[discipline]`: expo-camera (back cam, video mode),
  permission flow (camera+mic), per-discipline framing hint + setup tips overlay,
  per-rep record/stop button, hard cap per rep (20–25s), elapsed countdown
- **Per-rep capture**: each rep auto-saves its own clip file (no splitting needed);
  session rep strip with thumbnails, tap → detail, ✕ → retake (deletes file+row)
- **Local clip store**: `expo-sqlite` `clips` table (discipline, session_id,
  rep_number, uri, thumbnail_uri, duration_ms, status, timestamps) — files in
  `Documents/clips/`, thumbs in `Documents/thumbs/` via new expo-file-system API
- **Library tab**: 2-col grid, discipline color tags, duration badges,
  refresh-on-focus; empty state → record CTA
- **Clip detail** `library/[id]`: expo-video player w/ native controls,
  mark-in/out trim → `expo-video-clipper` (AVFoundation/Media3) saves a NEW clip,
  share sheet (expo-sharing), save-to-gallery (expo-media-library), delete w/ confirm
- i18n: all record/library/clip UI in `en` + `pt-BR`
- Verified: `tsc --noEmit` clean, `expo export --platform ios` bundles all routes

## Known gaps / next decisions

- Social login needs Google/Apple client IDs (backend stubs exist)
- Vhost is HTTP+HTTPS; app points at https://cricketamigo.test via `app.json → extra.apiUrl` — self-signed cert means dev builds must trust it or use http/tunnel for devices. Consider `cloudflared` URL when testing on physical devices.
- `AGENTS.md`/`CLAUDE.md` in backend came with Laravel skeleton — review for useful conventions.
