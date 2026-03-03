-- D1 schema (SQLite)
CREATE TABLE IF NOT EXISTS foods (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT DEFAULT '',
  protein_dm REAL DEFAULT 0,
  fat_dm REAL DEFAULT 0,
  carb_dm REAL DEFAULT 0,
  ingredients_json TEXT DEFAULT '[]',
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_foods_updated ON foods(updated_at DESC);
