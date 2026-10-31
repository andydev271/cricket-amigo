import type { LandmarkName } from "expo-mediapipe-pose";
import type { Discipline } from "../lib/clips";

export type PhaseKey = "setup" | "action" | "contact" | "recovery";

/** How a single metric is measured on one frame. */
export type Measure =
  | { kind: "angle"; a: LandmarkName; vertex: LandmarkName; end: LandmarkName }
  /** Normalized vertical position of a landmark; higher = taller (1 - y). */
  | { kind: "height"; landmark: LandmarkName }
  /** 2D euclidean distance between landmarks, normalized image coords. */
  | { kind: "distance"; a: LandmarkName; b: LandmarkName }
  /** |a[axis] - b[axis]| — directional offset (e.g. forward lean in x). */
  | { kind: "offset"; a: LandmarkName; b: LandmarkName; axis: "x" | "y" }
  /** distance(numA,numB) / distance(denA,denB) — self-normalizing vs body size. */
  | {
      kind: "ratio";
      numA: LandmarkName;
      numB: LandmarkName;
      denA: LandmarkName;
      denB: LandmarkName;
    }
  /** Raw coordinate — use with `variance` aggregate for stability checks. */
  | { kind: "position"; landmark: LandmarkName; axis: "x" | "y" };

export interface PackMetric {
  key: string;
  phase: PhaseKey;
  measure: Measure;
  aggregate: "min" | "max" | "mean" | "variance";
  unit: "deg" | "norm";
}

export interface PackCheck {
  metric: string;
  op: "lt" | "gt" | "between" | "outside";
  value: number | [number, number];
  severity: "tip" | "warn";
  /** i18n key under analysis.feedback.* */
  code: string;
}

export interface CoachingPack {
  version: number;
  discipline: Discipline;
  /** Phase windows as [start, end] fractions of the clip. */
  phases: Record<PhaseKey, [number, number]>;
  metrics: PackMetric[];
  checks: PackCheck[];
}

export interface MetricResult {
  key: string;
  phase: PhaseKey;
  value: number | null;
  unit: "deg" | "norm";
  /** share of phase frames that produced a usable measurement */
  coverage: number;
}

export interface FeedbackItem {
  code: string;
  severity: "tip" | "warn";
  metric: string;
  value: number;
}

export interface AnalysisResult {
  packVersion: number;
  discipline: Discipline;
  analyzedAt: number;
  framesSampled: number;
  framesUsable: number;
  /** 0-1: share of sampled frames with a confident full pose */
  poseCoverage: number;
  metrics: MetricResult[];
  feedback: FeedbackItem[];
}
