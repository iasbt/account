create table public.profiles (
  id uuid not null primary key,
  email text,
  role text default 'user',
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  deleted_at timestamp with time zone
);

create table public.applications (
  id text primary key,
  code text unique not null,
  name text not null,
  icon_url text,
  redirect_url text not null,
  auth_mode text default 'sso',
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  deleted_at timestamp with time zone
);

create table public.user_app_access (
  id uuid primary key,
  user_id uuid not null references public.profiles (id),
  app_id text not null references public.applications (id),
  app_name text not null,
  last_accessed_at timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  deleted_at timestamp with time zone
);
