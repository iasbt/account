-- Update allowed_origins for Toolbox
UPDATE applications
SET allowed_origins = array_cat(allowed_origins, ARRAY['http://119.91.71.30:3001/auth/callback', 'http://localhost:3001/auth/callback'])
WHERE app_id = 'toolbox' AND NOT ('http://119.91.71.30:3001/auth/callback' = ANY(allowed_origins));

-- Update allowed_origins for Life OS
UPDATE applications
SET allowed_origins = array_cat(allowed_origins, ARRAY['https://life.iasbt.com/auth/callback', 'http://119.91.71.30:3002/auth/callback', 'http://localhost:3002/auth/callback'])
WHERE app_id = 'life_os' AND NOT ('https://life.iasbt.com/auth/callback' = ANY(allowed_origins));

-- Update allowed_origins for LifeOS (Duplicate app_id?)
UPDATE applications
SET allowed_origins = array_cat(allowed_origins, ARRAY['https://life.iasbt.com/auth/callback', 'http://119.91.71.30:3002/auth/callback'])
WHERE app_id = 'lifeos' AND NOT ('https://life.iasbt.com/auth/callback' = ANY(allowed_origins));
