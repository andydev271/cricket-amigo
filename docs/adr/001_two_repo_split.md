# ADR 001 — Two-repo split (mobile + backend)

Date: 2026-10-30 · Status: accepted

## Context
Plan originally specified a monorepo (`apps/mobile` + `api/`). User decided separate repos are cleaner: `cricket-amigo` (Expo) and `cricket-amigo-backend` (Laravel API).

## Decision
Two repos. Mobile repo holds product docs (`docs/`), the plan, and app code. Backend repo is a pure Laravel app (`cricketamigo.test` Kettle vhost, MySQL `cricket_amigo`).

## Consequences
- App→API contract via `src/lib/api.ts` typed client + `app.json extra.apiUrl`
- Shared docs live in the mobile repo (`docs/PROGRESS.md`, `docs/FEATURES.md`)
- Both repos versioned independently; no git submodules
