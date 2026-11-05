-- New email verification challenges (safe for existing accounts).
CREATE TABLE IF NOT EXISTS auth_challenges(
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('register','reset')),
  code_hash TEXT NOT NULL,
  expires_at BIGINT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  sent_at BIGINT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  salt TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL DEFAULT '',
  UNIQUE(email,kind)
);
CREATE INDEX IF NOT EXISTS auth_challenges_expiration ON auth_challenges(expires_at);
INSERT INTO schema_migrations(version,applied_at) VALUES ('006',0) ON CONFLICT DO NOTHING;
