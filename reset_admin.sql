DELETE FROM public.legacy_users;
INSERT INTO public.legacy_users (id, username, email, password_hash, is_admin, created_at, updated_at)
VALUES (gen_random_uuid(), 'admin', 'admin@example.com', '$2b$10$Gdnlg98N8nalacy/4/5CCO6gMFwey89GcdZzBBQLDledLhNGzxf52', TRUE, NOW(), NOW());
