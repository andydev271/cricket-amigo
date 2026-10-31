import { api } from "../lib/api";
import { db } from "../lib/db";
import type { Discipline } from "../lib/clips";
import { COACHING_PACKS } from "./packs";
import type { CoachingPack } from "./types";

/**
 * Coaching packs are versioned and served by the API (`GET /coaching-packs`).
 * When a remote pack is newer than the bundled copy we cache it in SQLite and
 * prefer it — coaching rules can then improve without an app release.
 */

const remoteCache = new Map<Discipline, CoachingPack>();

function loadCached(): void {
  const rows = db.getAllSync<{
    discipline: string;
    version: number;
    json: string;
  }>("SELECT * FROM packs");

  for (const row of rows) {
    try {
      const pack = JSON.parse(row.json) as CoachingPack;
      if (pack.version >= (COACHING_PACKS[row.discipline as Discipline]?.version ?? 0)) {
        remoteCache.set(row.discipline as Discipline, pack);
      }
    } catch {
      // corrupt cache row — ignore, bundled pack covers it
    }
  }
}

let loaded = false;

/** Fetch latest packs from the API; best-effort, safe offline. */
export async function syncPacks(): Promise<void> {
  if (!loaded) {
    loadCached();
    loaded = true;
  }
  try {
    const res = await fetch(`${api.baseUrl}/api/coaching-packs`);
    if (!res.ok) return;
    const { packs } = (await res.json()) as { packs: CoachingPack[] };
    for (const pack of packs) {
      db.runSync(
        `INSERT INTO packs (discipline, version, json) VALUES (?, ?, ?)
         ON CONFLICT(discipline) DO UPDATE SET version = excluded.version, json = excluded.json
         WHERE excluded.version > packs.version`,
        [pack.discipline, pack.version, JSON.stringify(pack)],
      );
      const current = remoteCache.get(pack.discipline);
      if (!current || pack.version > current.version) {
        if (pack.version >= COACHING_PACKS[pack.discipline].version) {
          remoteCache.set(pack.discipline, pack);
        }
      }
    }
  } catch {
    // offline — bundled/cached packs still work
  }
}

/** Newest known pack for a discipline (remote > bundled). */
export function getPack(discipline: Discipline): CoachingPack {
  return remoteCache.get(discipline) ?? COACHING_PACKS[discipline];
}
