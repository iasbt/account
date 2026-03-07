
-- Create Refresh Tokens Table for Rotation Strategy
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    revoked BOOLEAN DEFAULT FALSE,
    replaced_by_token_hash TEXT, -- For rotation detection
    client_id TEXT -- Optional: Track which client issued this token
);

-- Ensure columns exist if table already existed (idempotency)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'refresh_tokens' AND column_name = 'token_hash') THEN
        ALTER TABLE refresh_tokens ADD COLUMN token_hash TEXT NOT NULL DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'refresh_tokens' AND column_name = 'replaced_by_token_hash') THEN
        ALTER TABLE refresh_tokens ADD COLUMN replaced_by_token_hash TEXT;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
