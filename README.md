# Cricket Amigo

Cricket training + match-day app — record batting/bowling/fielding/keeping, get free on-device AI coaching, score matches ball-by-ball, stream live, and play with your club. Built with Expo (React Native) — Android + iOS.

**Backend:** [`cricket-amigo-backend`](../cricket-amigo-backend) — Laravel 13 API on `https://cricketamigo.test` (Kettle vhost).

## Stack

- Expo SDK 58 · RN 0.88 (new arch) · expo-router (typed routes) · TypeScript strict
- NativeWind v4 + Tailwind · i18next (`en`, `pt-BR`) · zustand · React Query · expo-secure-store

## Develop

```bash
npm install
npx expo start            # Metro
# dev build (native modules need it — not Expo Go):
npx expo run:android      # or run:ios
```

API URL is set in `app.json → extra.apiUrl` (default `https://cricketamigo.test`).

## Docs

- `docs/PROGRESS.md` — phase tracker (source of truth for what's shipped)
- `docs/FEATURES.md` — feature map + flags
- `docs/adr/` — architecture decisions
