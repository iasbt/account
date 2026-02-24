
-- Ensure legacy_users table exists with correct schema
CREATE TABLE IF NOT EXISTS public.legacy_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if they don't exist (idempotent for existing table)
DO $$
BEGIN
    -- Check for is_admin
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='legacy_users' AND column_name='is_admin') THEN
        ALTER TABLE public.legacy_users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
    END IF;

    -- Check for password_hash (in case it was named password or something else, though we can't easily rename without data loss risk, we assume standard schema)
    -- If 'password' exists but 'password_hash' doesn't, we might need manual intervention, but for now we ensure password_hash exists.
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='legacy_users' AND column_name='password_hash') THEN
        -- If password column exists, maybe we should rename it? Or just add password_hash?
        -- Let's just add it to be safe for new registrations. Old users might need migration if they used 'password'.
        ALTER TABLE public.legacy_users ADD COLUMN password_hash VARCHAR(255);
    END IF;
    
    -- Ensure username exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='legacy_users' AND column_name='username') THEN
        ALTER TABLE public.legacy_users ADD COLUMN username VARCHAR(255);
        -- Note: We can't easily add NOT NULL constraint to existing column without default value if table has rows.
    END IF;
END $$;
