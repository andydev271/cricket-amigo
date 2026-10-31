import {
    getWorldJointAngle,
    type LandmarkName,
    type PoseVideoFrame,
} from "expo-mediapipe-pose";

import type { Discipline } from "../lib/clips";
import type {
    AnalysisResult,
    CoachingPack,
    Measure,
    MetricResult,
} from "./types";

type Point = { x: number; y: number; z: number; visibility?: number };
type Frame = {
  timestampMs: number;
  landmarks: Point[];
  worldLandmarks: Point[];
};

const MIN_VISIBILITY = 0.55;
const MIN_FRAME_CONFIDENCE = 0.5;
const IDX = new Map<LandmarkName, number>(
  // LANDMARK_NAMES order is the MediaPipe index order.
  (
    [
      "nose",
      "leftEyeInner",
      "leftEye",
      "leftEyeOuter",
      "rightEyeInner",
      "rightEye",
      "rightEyeOuter",
      "leftEar",
      "rightEar",
      "mouthLeft",
      "mouthRight",
      "leftShoulder",
      "rightShoulder",
      "leftElbow",
      "rightElbow",
      "leftWrist",
      "rightWrist",
      "leftPinky",
      "rightPinky",
      "leftIndex",
      "rightIndex",
      "leftThumb",
      "rightThumb",
      "leftHip",
      "rightHip",
      "leftKnee",
      "rightKnee",
      "leftAnkle",
      "rightAnkle",
      "leftHeel",
      "rightHeel",
      "leftFootIndex",
      "rightFootIndex",
    ] as const
  ).map((n, i) => [n, i]),
);

const lm = (f: Frame, name: LandmarkName): Point | undefined => {
  const p = f.landmarks[IDX.get(name)!];
  return p && (p.visibility ?? 1) >= MIN_VISIBILITY ? p : undefined;
};

const dist2d = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

/** Measure one frame; null when the needed landmarks aren't confident. */
function measureFrame(f: Frame, m: Measure): number | null {
  switch (m.kind) {
    case "angle": {
      // World landmarks (meters, 3D) — rotation-tolerant joint angles.
      const r = getWorldJointAngle(
        { worldLandmarks: f.worldLandmarks },
        m.a,
        m.vertex,
        m.end,
        { minVisibility: MIN_VISIBILITY },
      );
      return r.status === "available" ? r.value : null;
    }
    case "height": {
      const p = lm(f, m.landmark);
      return p ? 1 - p.y : null;
    }
    case "distance": {
      const a = lm(f, m.a);
      const b = lm(f, m.b);
      return a && b ? dist2d(a, b) : null;
    }
    case "offset": {
      const a = lm(f, m.a);
      const b = lm(f, m.b);
      return a && b ? Math.abs(a[m.axis] - b[m.axis]) : null;
    }
    case "ratio": {
      const na = lm(f, m.numA);
      const nb = lm(f, m.numB);
      const da = lm(f, m.denA);
      const db = lm(f, m.denB);
      if (!na || !nb || !da || !db) return null;
      const den = dist2d(da, db);
      return den > 1e-4 ? dist2d(na, nb) / den : null;
    }
    case "position": {
      const p = lm(f, m.landmark);
      return p ? p[m.axis] : null;
    }
  }
}

const variance = (xs: number[]) => {
  if (xs.length < 2) return 0;
  const mean = xs.reduce((s, v) => s + v, 0) / xs.length;
  return xs.reduce((s, v) => s + (v - mean) ** 2, 0) / xs.length;
};

function aggregate(xs: number[], how: "min" | "max" | "mean" | "variance") {
  if (xs.length === 0) return null;
  switch (how) {
    case "min":
      return Math.min(...xs);
    case "max":
      return Math.max(...xs);
    case "mean":
      return xs.reduce((s, v) => s + v, 0) / xs.length;
    case "variance":
      return variance(xs);
  }
}

/** Convert raw analyzePoseVideo frames into usable Frame[]. */
export function usableFrames(frames: PoseVideoFrame[]): Frame[] {
  const out: Frame[] = [];
  for (const f of frames) {
    const landmarks = f.detection?.landmarks ?? [];
    const worldLandmarks = f.detection?.worldLandmarks ?? [];
    if (landmarks.length < 33) continue;
    const confidence =
      landmarks.reduce(
        (s: number, l: { visibility?: number }) => s + (l.visibility ?? 1),
        0,
      ) / landmarks.length;
    if (confidence < MIN_FRAME_CONFIDENCE) continue;
    out.push({
      timestampMs: f.timestampMs,
      landmarks: landmarks as Point[],
      worldLandmarks: (worldLandmarks.length
        ? worldLandmarks
        : landmarks) as Point[],
    });
  }
  return out;
}

export function runPack(
  frames: Frame[],
  pack: CoachingPack,
  framesSampled: number,
  clipDurationMs: number,
): AnalysisResult {
  const t0 = frames[0]?.timestampMs ?? 0;
  const span = Math.max(
    1,
    (frames[frames.length - 1]?.timestampMs ?? clipDurationMs) - t0,
  );

  const metrics: MetricResult[] = pack.metrics.map((metric) => {
    const [from, to] = pack.phases[metric.phase];
    const window = frames.filter(
      (f) =>
        f.timestampMs >= t0 + from * span && f.timestampMs <= t0 + to * span,
    );
    const samples = window
      .map((f) => measureFrame(f, metric.measure))
      .filter((v): v is number => v !== null);

    return {
      key: metric.key,
      phase: metric.phase,
      value: aggregate(samples, metric.aggregate),
      unit: metric.unit,
      coverage: window.length ? samples.length / window.length : 0,
    };
  });

  const byKey = new Map(metrics.map((m) => [m.key, m.value]));
  const feedback = pack.checks.flatMap((c) => {
    const v = byKey.get(c.metric);
    if (v === null || v === undefined) return [];
    const hit =
      c.op === "lt"
        ? v < (c.value as number)
        : c.op === "gt"
          ? v > (c.value as number)
          : c.op === "between"
            ? v >= (c.value as [number, number])[0] &&
              v <= (c.value as [number, number])[1]
            : v < (c.value as [number, number])[0] ||
              v > (c.value as [number, number])[1];
    return hit
      ? [{ code: c.code, severity: c.severity, metric: c.metric, value: v }]
      : [];
  });

  return {
    packVersion: pack.version,
    discipline: pack.discipline as Discipline,
    analyzedAt: Date.now(),
    framesSampled,
    framesUsable: frames.length,
    poseCoverage: framesSampled ? frames.length / framesSampled : 0,
    metrics,
    feedback,
  };
}
