-- HI AI Chat: private, persistent general conversations (not tied to projects).
CREATE TABLE IF NOT EXISTS chat_threads(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,title TEXT NOT NULL,created_at BIGINT NOT NULL,updated_at BIGINT NOT NULL);
CREATE INDEX IF NOT EXISTS chat_threads_owner ON chat_threads(user_id,updated_at);
CREATE TABLE IF NOT EXISTS chat_messages(id TEXT PRIMARY KEY,thread_id TEXT NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,role TEXT NOT NULL CHECK(role IN ('user','assistant')),content TEXT NOT NULL,created_at BIGINT NOT NULL);
CREATE INDEX IF NOT EXISTS chat_messages_thread ON chat_messages(thread_id,created_at);
INSERT INTO schema_migrations(version,applied_at) VALUES ('002',0) ON CONFLICT DO NOTHING;
