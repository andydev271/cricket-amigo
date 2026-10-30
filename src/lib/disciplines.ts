import type { Discipline } from "./clips";

export interface DisciplineGuide {
  /** i18n key under `record.tips.*` returning a string[] of positioning tips */
  tipsKey: `record.tips.${Discipline}`;
  /** Hard cap per rep, seconds — protects storage and keeps reps atomic */
  maxRepSeconds: number;
  /** i18n key for the framing hint shown over the camera */
  frameKey: `record.frame.${Discipline}`;
}

export const DISCIPLINE_GUIDES: Record<Discipline, DisciplineGuide> = {
  batting: {
    tipsKey: "record.tips.batting",
    maxRepSeconds: 20,
    frameKey: "record.frame.batting",
  },
  bowling: {
    tipsKey: "record.tips.bowling",
    maxRepSeconds: 25,
    frameKey: "record.frame.bowling",
  },
  fielding: {
    tipsKey: "record.tips.fielding",
    maxRepSeconds: 20,
    frameKey: "record.frame.fielding",
  },
  keeping: {
    tipsKey: "record.tips.keeping",
    maxRepSeconds: 20,
    frameKey: "record.frame.keeping",
  },
};

export const DISCIPLINES: Discipline[] = [
  "batting",
  "bowling",
  "fielding",
  "keeping",
];
