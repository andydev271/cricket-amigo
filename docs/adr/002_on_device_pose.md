# ADR 002 — On-device pose analysis with coaching packs

**Status:** accepted (2026-10-31) · **Supersedes:** nothing · **Related:** plan §6.2

## Context

Core differentiator: free AI technique feedback on recorded reps. Constraints:
$0 infra, works offline at the nets, pt-BR output, must beat "no analysis"
(CricHeroes) and paid coach-in-loop apps.

## Decision

- **Pose:** `expo-mediapipe-pose` — MediaPipe pose landmarker, model bundled in
  the package, runs natively on-device. `analyzePoseVideo(uri)` samples frames
  post-hoc (8fps, ≤240 frames) — no live-camera rewrite needed for Phase 2.
- **Rules as data:** coaching packs are versioned JSON — measure definitions +
  phase windows (clip fractions: setup/action/contact/recovery) + threshold
  checks → localized feedback codes. Canonical source: `config/coaching_packs.php`
  served at `GET /api/coaching-packs`; app caches newer packs in SQLite and
  prefers them → rule tuning ships OTA, no app release.
- **Angles use world landmarks** (metric 3D estimate) via the lib's
  `getWorldJointAngle` — more rotation-tolerant than 2D image angles.

## Honest limits (documented in plan + feedback copy)

- Monocular 2D video: no true 3D rotation, no bat/ball tracking (user marks
  contact in a later iteration; custom bat/ball detector is a Phase 2+ option)
- Single-view framing: side-dependent metrics (e.g., elbow flex) assume the
  recorded side; thresholds marked v1 pending golden-clip calibration
- `expo-mediapipe-pose` peers `expo@^57` while we're on 58 — installed with
  `--legacy-peer-deps`; first `expo prebuild` is the compatibility checkpoint

## Alternatives considered

- **WebView + @mediapipe/tasks-vision** — works in Expo Go, but ~10× slower JS
  inference and a fragile file:// frame pipeline; rejected (native lib exists
  and we need dev builds anyway for RTMP/camera work).
- **@thinksys/react-native-mediapipe** — vision-camera frame processors only;
  would force replacing expo-camera for live, and can't analyze recorded files.
- **Cloud keyframes (Gemini etc.)** — kept as a future optional upgrade behind
  a flag; violates the $0/offline constraint as the primary path.

## Consequences

- First compile-verified pipeline; accuracy gate is the device spike checklist
  in PROGRESS.md (golden clips → threshold calibration).
- Pack JSON schema is now a public contract — changes need version bumps.
