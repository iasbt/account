-- OAuth 2.0 Authorization Codes
CREATE TABLE IF NOT EXISTS oauth_codes (
  code VARCHAR(255) PRIMARY KEY,
  client_id VARCHAR(50) NOT NULL REFERENCES applications(app_id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  redirect_uri TEXT NOT NULL,
  scope TEXT DEFAULT 'profile',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_oauth_codes_client_id ON oauth_codes(client_id);
CREATE INDEX IF NOT EXISTS idx_oauth_codes_user_id ON oauth_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_codes_expires_at ON oauth_codes(expires_at);
