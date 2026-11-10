-- Shortly schema. Runs once, when the db_data volume is empty.

CREATE TABLE IF NOT EXISTS urls (
    id           SERIAL PRIMARY KEY,
    short_code   VARCHAR(20) NOT NULL UNIQUE,
    original_url TEXT        NOT NULL CHECK (char_length(original_url) <= 2048),
    clicks       INTEGER     NOT NULL DEFAULT 0 CHECK (clicks >= 0),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- UNIQUE already indexes short_code; this index serves the newest-first list.
CREATE INDEX IF NOT EXISTS idx_urls_created_at ON urls (created_at DESC);

-- Dummy sample data (no personal data).
INSERT INTO urls (short_code, original_url, clicks) VALUES
    ('docker', 'https://docs.docker.com/compose/', 3),
    ('pgdocs', 'https://www.postgresql.org/docs/16/index.html', 1)
ON CONFLICT (short_code) DO NOTHING;
