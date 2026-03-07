-- Phase 1: Create Schemas
CREATE SCHEMA IF NOT EXISTS gallery;
CREATE SCHEMA IF NOT EXISTS legacy_backup;

-- Phase 2: Migrate Business Tables
-- Images
ALTER TABLE IF EXISTS public.images SET SCHEMA gallery;
ALTER TABLE IF EXISTS public.categories SET SCHEMA gallery;
ALTER TABLE IF EXISTS public.tags SET SCHEMA gallery;
ALTER TABLE IF EXISTS public.image_tags SET SCHEMA gallery;
ALTER TABLE IF EXISTS public.user_preferences SET SCHEMA gallery;

-- Phase 3: Archive Legacy Tables (Supabase Auth/Storage remnants)
-- Note: We move tables that are NOT part of the new system but might contain useful data
-- Adjust this list based on actual tables found in `current_schema.sql` (if we had it)
-- For now, we assume standard Supabase tables might be in `auth` or `storage` schemas which are separate.
-- If they are in public, we move them.

-- Example: If there's a legacy `profiles` table that is replaced by `users` or Logto
-- ALTER TABLE IF EXISTS public.profiles SET SCHEMA legacy_backup;

-- Phase 4: Ensure Search Path
-- This is crucial for the application to find tables without schema prefix if we don't update code immediately,
-- BUT our plan is to update code to be explicit.
-- However, setting search_path is a good safety net.
ALTER DATABASE postgres SET search_path TO "$user", public, gallery;
