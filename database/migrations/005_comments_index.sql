
-- Optimize project comment history queries.
CREATE INDEX IF NOT EXISTS comments_project_created
ON comments (project_id, created_at DESC);

INSERT INTO schema_migrations(version, applied_at)
VALUES ('005', 0)
ON CONFLICT DO NOTHING;
