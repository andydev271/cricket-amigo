import * as SQLite from "expo-sqlite";

export const db = SQLite.openDatabaseSync("cricket-amigo.db");

db.execSync(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS clips (
    id TEXT PRIMARY KEY,
    discipline TEXT NOT NULL,
    session_id TEXT NOT NULL,
    rep_number INTEGER NOT NULL DEFAULT 1,
    uri TEXT NOT NULL,
    thumbnail_uri TEXT,
    duration_ms INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'recorded',
    notes TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_clips_created ON clips(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_clips_session ON clips(session_id);
`);

// Schema migrations — PRAGMA user_version gates each step.
const version = db.getFirstSync<{ user_version: number }>(
  "PRAGMA user_version",
);
if ((version?.user_version ?? 0) < 2) {
  db.execSync(`
    ALTER TABLE clips ADD COLUMN analysis_json TEXT;
    PRAGMA user_version = 2;
  `);
}
if ((version?.user_version ?? 0) < 3) {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS packs (
      discipline TEXT PRIMARY KEY,
      version INTEGER NOT NULL,
      json TEXT NOT NULL
    );
    PRAGMA user_version = 3;
  `);
}
