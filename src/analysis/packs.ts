import type { Discipline } from "../lib/clips";
import type { CoachingPack, PhaseKey } from "./types";

/**
 * Coaching packs v1 — thresholds are initial calibrations and MUST be tuned
 * against golden clips before trusting them (see docs: needs real-device
 * validation). Packs are versioned; the API can ship newer versions OTA later.
 *
 * All metrics are 2D-landmark approximations — honest limits: no bat/ball
 * tracking, single-angle view, no true 3D rotation.
 */

const PHASES: Record<PhaseKey, [number, number]> = {
  setup: [0, 0.3],
  action: [0.3, 0.7],
  contact: [0.6, 0.8],
  recovery: [0.8, 1],
};

const ELBOW = (side: "left" | "right") => ({
  a: `${side}Shoulder` as const,
  vertex: `${side}Elbow` as const,
  end: `${side}Wrist` as const,
});

const KNEE = (side: "left" | "right") => ({
  a: `${side}Hip` as const,
  vertex: `${side}Knee` as const,
  end: `${side}Ankle` as const,
});

export const COACHING_PACKS: Record<Discipline, CoachingPack> = {
  batting: {
    version: 1,
    discipline: "batting",
    phases: PHASES,
    metrics: [
      {
        key: "stance_width",
        phase: "setup",
        // ankle-to-ankle vs standing height (shoulder→ankle) — works from
        // either front or side view since both distances are euclidean.
        measure: {
          kind: "ratio",
          numA: "leftAnkle",
          numB: "rightAnkle",
          denA: "leftShoulder",
          denB: "leftAnkle",
        },
        aggregate: "mean",
        unit: "norm",
      },
      {
        key: "back_knee_flex",
        phase: "action",
        measure: { kind: "angle", ...KNEE("right") },
        aggregate: "min",
        unit: "deg",
      },
      {
        key: "head_stability",
        phase: "contact",
        measure: { kind: "position", landmark: "nose", axis: "x" },
        aggregate: "variance",
        unit: "norm",
      },
      {
        key: "elbow_extension",
        phase: "contact",
        measure: { kind: "angle", ...ELBOW("left") },
        aggregate: "max",
        unit: "deg",
      },
    ],
    checks: [
      {
        metric: "stance_width",
        op: "outside",
        value: [0.12, 0.5],
        severity: "tip",
        code: "batting.stance",
      },
      {
        metric: "head_stability",
        op: "gt",
        value: 0.002,
        severity: "warn",
        code: "batting.head",
      },
      {
        metric: "elbow_extension",
        op: "lt",
        value: 150,
        severity: "tip",
        code: "batting.elbow",
      },
      {
        metric: "back_knee_flex",
        op: "gt",
        value: 175,
        severity: "tip",
        code: "batting.knee",
      },
    ],
  },

  bowling: {
    version: 1,
    discipline: "bowling",
    phases: PHASES,
    metrics: [
      {
        key: "elbow_flex_min",
        phase: "action",
        measure: { kind: "angle", ...ELBOW("right") },
        aggregate: "min",
        unit: "deg",
      },
      {
        key: "release_height",
        phase: "contact",
        measure: { kind: "height", landmark: "rightWrist" },
        aggregate: "max",
        unit: "norm",
      },
      {
        key: "front_brace",
        phase: "contact",
        measure: { kind: "angle", ...KNEE("left") },
        aggregate: "max",
        unit: "deg",
      },
      {
        key: "head_stability",
        phase: "action",
        measure: { kind: "position", landmark: "nose", axis: "x" },
        aggregate: "variance",
        unit: "norm",
      },
    ],
    checks: [
      {
        metric: "elbow_flex_min",
        op: "lt",
        value: 165,
        severity: "warn",
        code: "bowling.elbow",
      },
      {
        metric: "release_height",
        op: "lt",
        value: 0.72,
        severity: "tip",
        code: "bowling.release",
      },
      {
        metric: "front_brace",
        op: "lt",
        value: 165,
        severity: "tip",
        code: "bowling.brace",
      },
      {
        metric: "head_stability",
        op: "gt",
        value: 0.004,
        severity: "tip",
        code: "bowling.head",
      },
    ],
  },

  fielding: {
    version: 1,
    discipline: "fielding",
    phases: PHASES,
    metrics: [
      {
        key: "pickup_depth",
        phase: "contact",
        measure: { kind: "angle", ...KNEE("left") },
        aggregate: "min",
        unit: "deg",
      },
      {
        key: "ready_crouch",
        phase: "setup",
        measure: { kind: "angle", ...KNEE("left") },
        aggregate: "mean",
        unit: "deg",
      },
      {
        key: "throw_extension",
        phase: "recovery",
        measure: { kind: "angle", ...ELBOW("right") },
        aggregate: "max",
        unit: "deg",
      },
      {
        key: "head_over_ball",
        phase: "contact",
        // nose-to-hip horizontal offset — leaning over the pickup (side view)
        measure: { kind: "offset", a: "nose", b: "leftHip", axis: "x" },
        aggregate: "max",
        unit: "norm",
      },
    ],
    checks: [
      {
        metric: "ready_crouch",
        op: "gt",
        value: 160,
        severity: "tip",
        code: "fielding.ready",
      },
      {
        metric: "pickup_depth",
        op: "gt",
        value: 150,
        severity: "warn",
        code: "fielding.bend",
      },
      {
        metric: "throw_extension",
        op: "lt",
        value: 140,
        severity: "tip",
        code: "fielding.throw",
      },
      {
        metric: "head_over_ball",
        op: "lt",
        value: 0.05,
        severity: "tip",
        code: "fielding.over",
      },
    ],
  },

  keeping: {
    version: 1,
    discipline: "keeping",
    phases: PHASES,
    metrics: [
      {
        key: "crouch_depth",
        phase: "setup",
        measure: { kind: "angle", ...KNEE("left") },
        aggregate: "mean",
        unit: "deg",
      },
      {
        key: "gloves_height",
        phase: "contact",
        measure: { kind: "height", landmark: "leftWrist" },
        aggregate: "min",
        unit: "norm",
      },
      {
        key: "head_stability",
        phase: "contact",
        measure: { kind: "position", landmark: "nose", axis: "x" },
        aggregate: "variance",
        unit: "norm",
      },
    ],
    checks: [
      {
        metric: "crouch_depth",
        op: "gt",
        value: 150,
        severity: "warn",
        code: "keeping.crouch",
      },
      {
        metric: "head_stability",
        op: "gt",
        value: 0.003,
        severity: "tip",
        code: "keeping.rise",
      },
      {
        metric: "gloves_height",
        op: "gt",
        value: 0.55,
        severity: "tip",
        code: "keeping.gloves",
      },
    ],
  },
};
