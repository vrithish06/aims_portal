-- Create sessions table for express-session with connect-pg-simple
CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR NOT NULL COLLATE "default",
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL
);

-- Create index on session ID for faster lookups
CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);

-- Create index on session ID
CREATE INDEX IF NOT EXISTS IDX_session_sid ON sessions(sid);

-- Add primary key constraint
ALTER TABLE sessions ADD CONSTRAINT session_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE;

-- Optional: Add a comment to the table
COMMENT ON TABLE sessions IS 'Session store for express-session with connect-pg-simple';