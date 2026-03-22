-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- Auto-update function for updated_at
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- Users Table
-- ==========================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trigger_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- Jira Connections
-- ==========================================
CREATE TABLE jira_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    jira_url VARCHAR(255) NOT NULL,
    jira_email VARCHAR(255) NOT NULL,
    api_token TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_jira_url UNIQUE (user_id, jira_url)
);

CREATE TRIGGER trigger_jira_connections_updated_at
BEFORE UPDATE ON jira_connections
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- Datasets
-- ==========================================
CREATE TABLE datasets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size_bytes BIGINT,
    row_count INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- Chat Sessions
-- ==========================================
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trigger_chat_sessions_updated_at
BEFORE UPDATE ON chat_sessions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- Chat Messages
-- ==========================================
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- Cached Jira Tasks
-- ==========================================
CREATE TABLE cached_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jira_connection_id UUID NOT NULL REFERENCES jira_connections(id) ON DELETE CASCADE,
    jira_issue_key VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    status VARCHAR(50),
    priority VARCHAR(50),
    assignee_name VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_connection_issue UNIQUE (jira_connection_id, jira_issue_key)
);

CREATE TRIGGER trigger_cached_tasks_updated_at
BEFORE UPDATE ON cached_tasks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- Indexes
-- ==========================================
CREATE INDEX idx_jira_connections_user_id 
ON jira_connections(user_id);

CREATE INDEX idx_datasets_user_id 
ON datasets(user_id);

CREATE INDEX idx_chat_sessions_user_id 
ON chat_sessions(user_id);

CREATE INDEX idx_chat_messages_session_id 
ON chat_messages(session_id);

CREATE INDEX idx_cached_tasks_jira_connection_id 
ON cached_tasks(jira_connection_id);

CREATE INDEX idx_cached_tasks_issue_key 
ON cached_tasks(jira_issue_key);