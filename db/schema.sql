-- D1 schema (SQLite)
-- 키블핏 v2 (보증성분/급여연령 기반)

CREATE TABLE IF NOT EXISTS foods (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT DEFAULT '',
  life_stage TEXT DEFAULT '',

  -- Guaranteed Analysis (as-fed %)
  crude_protein REAL DEFAULT 0,
  crude_fat REAL DEFAULT 0,
  calcium REAL DEFAULT 0,
  phosphorus REAL DEFAULT 0,
  ash REAL DEFAULT 0,
  crude_fiber REAL DEFAULT 0,
  moisture REAL DEFAULT 0,

  ingredients_json TEXT DEFAULT '[]',
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_foods_updated ON foods(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_foods_brand ON foods(brand);
CREATE INDEX IF NOT EXISTS idx_foods_life_stage ON foods(life_stage);
