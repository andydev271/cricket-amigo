import { analyzePoseVideo, type PoseVideoFrame } from "expo-mediapipe-pose";

import type { Clip } from "../lib/clips";
import { runPack, usableFrames } from "./engine";
import { getPack } from "./packs_remote";
import type { AnalysisResult } from "./types";

const SAMPLING_FPS = 8;
const MAX_FRAMES = 240;

export interface AnalysisProgress {
  /** 0-1 */
  progress: number;
  framesRead: number;
}

/**
 * Run the coaching pack for a clip's discipline over the whole video.
 * All inference is on-device — frames never leave the phone.
 */
export async function analyzeClip(
  clip: Clip,
  onProgress?: (p: AnalysisProgress) => void,
): Promise<AnalysisResult> {
  const pack = getPack(clip.discipline);
  const sampled: PoseVideoFrame[] = [];

  for await (const frame of analyzePoseVideo(clip.uri, {
    samplingFps: SAMPLING_FPS,
    maxFrames: MAX_FRAMES,
    modelVariant: "lite",
    onProgress: (p: { completedFrames: number; totalFrames: number }) =>
      onProgress?.({
        progress: p.completedFrames / Math.max(1, p.totalFrames),
        framesRead: p.completedFrames,
      }),
  })) {
    sampled.push(frame);
  }

  const usable = usableFrames(sampled);
  return runPack(usable, pack, sampled.length, clip.durationMs);
}
