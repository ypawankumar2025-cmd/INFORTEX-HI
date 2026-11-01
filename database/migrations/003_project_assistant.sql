
-- Project-aware AI conversations. Separate from personal general chat; project scoped.
CREATE TABLE IF NOT EXISTS project_chat_threads(id TEXT PRIMARY KEY,project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,title TEXT NOT NULL,created_at BIGINT NOT NULL,updated_at BIGINT NOT NULL);
CREATE INDEX IF NOT EXISTS project_chat_threads_owner ON project_chat_threads(project_id,user_id,updated_at);
CREATE TABLE IF NOT EXISTS project_chat_messages(id TEXT PRIMARY KEY,thread_id TEXT NOT NULL REFERENCES project_chat_threads(id) ON DELETE CASCADE,role TEXT NOT NULL CHECK(role IN ('user','assistant')),content TEXT NOT NULL,created_at BIGINT NOT NULL);
CREATE INDEX IF NOT EXISTS project_chat_messages_thread ON project_chat_messages(thread_id,created_at);
INSERT INTO schema_migrations(version,applied_at) VALUES ('003',0) ON CONFLICT DO NOTHING;
