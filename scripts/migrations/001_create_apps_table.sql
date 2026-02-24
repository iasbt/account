-- Drop tables if they exist to ensure fresh state for V11 schema
DROP TABLE IF EXISTS public.applications;
DROP TABLE IF EXISTS public.app_audit_logs;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Applications Table
CREATE TABLE public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    version VARCHAR(20) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('active', 'degraded', 'loading')),
    config JSONB NOT NULL,
    health_score INT DEFAULT 100,
    last_reload_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast status lookup
CREATE INDEX IF NOT EXISTS idx_apps_status ON public.applications(status);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS public.app_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_name VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('REGISTER', 'UPDATE', 'ROLLBACK', 'DEGRADE', 'UNLOAD')),
    details JSONB,
    trace_id VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
