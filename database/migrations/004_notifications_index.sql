
-- Optimize user notification history queries.
CREATE INDEX IF NOT EXISTS notifications_user_created
ON notifications (user_id, created_at DESC);

INSERT INTO schema_migrations(version, applied_at)
VALUES ('004', 0)
ON CONFLICT DO NOTHING;
