# Cricket Amigo — Feature Map

What the product does, where it lives, and current flag state. Keep in sync with `config/cricketamigo.php` (backend flags) and this repo's screens.

## Core loop

| Feature                               | Status    | Flag                   | Where                                                  |
| ------------------------------------- | --------- | ---------------------- | ------------------------------------------------------ |
| Device instant-start (guest)          | ✅ live   | —                      | `POST /auth/device`, app bootstrap                     |
| Register / login (email+password)     | ✅ live   | —                      | `(auth)` group                                         |
| Social login (Google/Apple)           | 🔨 stub   | `features.auth_social` | `POST /auth/social/{provider}`                         |
| Onboarding (language→interests→role)  | ✅ live   | —                      | `(auth)/onboarding`                                    |
| i18n en + pt-BR                       | ✅ live   | `locales`              | `src/i18n`, `PUT /me/locale`                           |
| Profile + avatar + stats              | ✅ basic  | —                      | `profile/[id]`, `GET /users/{id}`                      |
| Friends (search/requests/suggestions) | ✅ live   | —                      | `friends/`, `/friends/*` API                           |
| Feature flags                         | ✅ live   | —                      | `GET /flags`                                           |
| App roles & permissions (Spatie)      | ✅ live   | —                      | `member`, `super-admin`; `is_admin` in payloads        |
| Super admin account                   | ✅ seeded | —                      | `admin@cricketamigo.com` (dev creds — rotate for prod) |
| Media library (Spatie)                | ✅ live   | —                      | avatars via `avatar` collection + `thumb` conversion   |
| Guided recording ×4 + per-rep clips   | ✅ live   | —                      | `record/[discipline]`, expo-camera                     |
| Local video library (SQLite)          | ✅ live   | —                      | `library/`, `src/lib/clips.ts`                         |
| Trim + share + save-to-gallery        | ✅ live   | —                      | `library/[id]`, expo-video-clipper                     |
| On-device AI coaching (pose packs)    | 🔶 alpha  | —                      | `src/analysis/*`, clip detail; calibrate on device     |
| Teams + roles + URL/QR invites        | ✅ live   | —                      | `teams/`, `join/[token]`                               |
| Credits ledger                        | ✅ live   | —                      | `credits/`, ledger API (SSV-ready refs)                |
| Cloud clip upload                     | ✅ live   | `cloud_upload`         | `POST /me/clips` (free_mode bypass)                    |

## Flagged-off until later phases

| Feature                                   | Target phase | Flag                     |
| ----------------------------------------- | ------------ | ------------------------ |
| Live pose camera overlay (PoseCameraView) | 2+           | `coaching_packs`         |
| Teams + URL/QR invites                    | 3            | —                        |
| Cloud video upload (R2)                   | 3+           | `cloud_upload`           |
| Credits ledger + rewarded ads             | 3            | `payments`/`ads.enabled` |
| Ball-by-ball scorer                       | 4            | —                        |
| YouTube live + local recording            | 4            | `streaming`              |
| Tournaments / leaderboards / boards       | 5            | `tournaments`            |
| Mini-games                                | 6            | `games`                  |
| Payments (IAP)                            | post-test    | `payments`               |

## Ad UX policy (permanent)

Never: interstitials, app-open, forced full-screen.
Allowed: top/bottom adaptive banners, inline native in feeds, dismissible bottom-third overlay on streams (~10 min), rewarded (opt-in only). Config lives in `flags.ads` — `free_mode` hides all surfaces.
