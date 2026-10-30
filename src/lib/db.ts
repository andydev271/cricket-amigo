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
