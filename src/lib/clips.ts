import { Directory, File, Paths } from "expo-file-system";
import { clipVideo } from "expo-video-clipper";
import { getThumbnailAsync } from "expo-video-thumbnails";

import { db } from "./db";

export type Discipline = "batting" | "bowling" | "fielding" | "keeping";

export type ClipStatus = "recorded" | "trimmed" | "analyzed";

export interface Clip {
  id: string;
  discipline: Discipline;
  sessionId: string;
  repNumber: number;
  uri: string;
  thumbnailUri: string | null;
  durationMs: number;
  status: ClipStatus;
  notes: string | null;
  createdAt: number;
  updatedAt: number;
}

interface ClipRow {
  id: string;
  discipline: string;
  session_id: string;
  rep_number: number;
  uri: string;
  thumbnail_uri: string | null;
  duration_ms: number;
  status: string;
  notes: string | null;
  created_at: number;
  updated_at: number;
}

const rowToClip = (r: ClipRow): Clip => ({
  id: r.id,
  discipline: r.discipline as Discipline,
  sessionId: r.session_id,
  repNumber: r.rep_number,
  uri: r.uri,
  thumbnailUri: r.thumbnail_uri,
  durationMs: r.duration_ms,
  status: r.status as ClipStatus,
  notes: r.notes,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export const clipsDir = (): Directory => {
  const dir = new Directory(Paths.document, "clips");
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
};

export const thumbsDir = (): Directory => {
  const dir = new Directory(Paths.document, "thumbs");
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
};

const newId = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

/** Move a camera-temp recording into the library and persist its row. */
export async function saveClip(input: {
  tempUri: string;
  discipline: Discipline;
  sessionId: string;
  repNumber: number;
  durationMs: number;
}): Promise<Clip> {
  const id = newId();
  const dest = new File(clipsDir(), `${id}.mp4`);
  new File(input.tempUri).moveSync(dest);

  let thumbUri: string | null = null;
  try {
    const thumb = await getThumbnailAsync(dest.uri, { time: 400 });
    const thumbDest = new File(thumbsDir(), `${id}.jpg`);
    new File(thumb.uri).moveSync(thumbDest);
    thumbUri = thumbDest.uri;
  } catch {
    // thumbnails are best-effort — clip still saves without one
  }

  const now = Date.now();
  db.runSync(
    `INSERT INTO clips (id, discipline, session_id, rep_number, uri, thumbnail_uri, duration_ms, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'recorded', ?, ?)`,
    [
      id,
      input.discipline,
      input.sessionId,
      input.repNumber,
      dest.uri,
      thumbUri,
      input.durationMs,
      now,
      now,
    ],
  );

  return getClip(id)!;
}

export function listClips(discipline?: Discipline): Clip[] {
  const rows = discipline
    ? db.getAllSync<ClipRow>(
        "SELECT * FROM clips WHERE discipline = ? ORDER BY created_at DESC",
        [discipline],
      )
    : db.getAllSync<ClipRow>("SELECT * FROM clips ORDER BY created_at DESC");
  return rows.map(rowToClip);
}

export function getClip(id: string): Clip | null {
  const row = db.getFirstSync<ClipRow>("SELECT * FROM clips WHERE id = ?", [
    id,
  ]);
  return row ? rowToClip(row) : null;
}

/** Clip count per session for the rep counter. */
export function sessionRepCount(sessionId: string): number {
  const row = db.getFirstSync<{ n: number }>(
    "SELECT COUNT(*) AS n FROM clips WHERE session_id = ?",
    [sessionId],
  );
  return row?.n ?? 0;
}

/** Trim into a NEW clip in the same session; original is kept. */
export async function trimClip(
  clip: Clip,
  startSec: number,
  endSec: number,
): Promise<Clip> {
  const id = newId();
  const outPath = await clipVideo({
    source: clip.uri,
    startTime: startSec,
    endTime: endSec,
  });

  const dest = new File(clipsDir(), `${id}.mp4`);
  new File(outPath).moveSync(dest);

  let thumbUri: string | null = null;
  try {
    const thumb = await getThumbnailAsync(dest.uri, { time: 200 });
    const thumbDest = new File(thumbsDir(), `${id}.jpg`);
    new File(thumb.uri).moveSync(thumbDest);
    thumbUri = thumbDest.uri;
  } catch {
    // best-effort
  }

  const now = Date.now();
  db.runSync(
    `INSERT INTO clips (id, discipline, session_id, rep_number, uri, thumbnail_uri, duration_ms, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'trimmed', ?, ?)`,
    [
      id,
      clip.discipline,
      clip.sessionId,
      clip.repNumber,
      dest.uri,
      thumbUri,
      Math.round((endSec - startSec) * 1000),
      now,
      now,
    ],
  );

  return getClip(id)!;
}

export function updateClipNotes(id: string, notes: string): void {
  db.runSync("UPDATE clips SET notes = ?, updated_at = ? WHERE id = ?", [
    notes,
    Date.now(),
    id,
  ]);
}

/** Persist an analysis result; marks the clip analyzed. */
export function saveAnalysis(id: string, result: unknown): void {
  db.runSync(
    "UPDATE clips SET analysis_json = ?, status = 'analyzed', updated_at = ? WHERE id = ?",
    [JSON.stringify(result), Date.now(), id],
  );
}

export function getAnalysis<T>(id: string): T | null {
  const row = db.getFirstSync<{ analysis_json: string | null }>(
    "SELECT analysis_json FROM clips WHERE id = ?",
    [id],
  );
  return row?.analysis_json ? (JSON.parse(row.analysis_json) as T) : null;
}

/** Remove DB row + video + thumbnail. */
export function deleteClip(id: string): void {
  const clip = getClip(id);
  if (!clip) return;

  for (const uri of [clip.uri, clip.thumbnailUri]) {
    if (!uri) continue;
    try {
      new File(uri).delete();
    } catch {
      // file may already be gone
    }
  }
  db.runSync("DELETE FROM clips WHERE id = ?", [id]);
}
