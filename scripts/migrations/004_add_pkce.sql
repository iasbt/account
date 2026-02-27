ALTER TABLE oauth_codes ADD COLUMN IF NOT EXISTS code_challenge TEXT;
ALTER TABLE oauth_codes ADD COLUMN IF NOT EXISTS code_challenge_method VARCHAR(10) DEFAULT 'S256';
