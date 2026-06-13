CREATE TABLE IF NOT EXISTS eras (
  id          SERIAL PRIMARY KEY,
  slug        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  year_start  INT NOT NULL,
  year_end    INT,
  blurb       TEXT NOT NULL DEFAULT '',
  accent      TEXT NOT NULL DEFAULT '#f5b81c',
  sort        INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS items (
  id            SERIAL PRIMARY KEY,
  slug          TEXT UNIQUE NOT NULL,
  era_slug      TEXT NOT NULL REFERENCES eras(slug) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  media_type    TEXT NOT NULL CHECK (media_type IN ('comics', 'movies', 'tv', 'games')),
  release_date  DATE,
  year_display  TEXT NOT NULL,
  is_milestone  BOOLEAN NOT NULL DEFAULT FALSE,
  is_exhibit    BOOLEAN NOT NULL DEFAULT FALSE,
  image_url     TEXT,
  impact        TEXT NOT NULL DEFAULT '',
  story         TEXT NOT NULL DEFAULT '',
  fun_facts     JSONB NOT NULL DEFAULT '[]',
  source_url    TEXT,
  sort          INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS items_era_idx ON items (era_slug);
CREATE INDEX IF NOT EXISTS items_media_idx ON items (media_type);
