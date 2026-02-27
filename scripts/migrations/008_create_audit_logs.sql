-- Create security_logs table for audit trail
CREATE TABLE IF NOT EXISTS security_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID, -- Can be NULL for failed login attempts
    event_type VARCHAR(50) NOT NULL, -- LOGIN_SUCCESS, LOGIN_FAIL, REGISTER, SSO_AUTH, LOGOUT
    ip_address VARCHAR(45),
    user_agent TEXT,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster querying by user or time
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON security_logs(event_type);
