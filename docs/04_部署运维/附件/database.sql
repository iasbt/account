create extension if not exists "pgcrypto";

create table public.users (
  id text primary key,
  name varchar(255) not null,
  email varchar(255) unique not null,
  password varchar(255) not null,
  avatar_url varchar(255),
  is_admin boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.legacy_users (
  id uuid primary key default gen_random_uuid(),
  username varchar(255) unique not null,
  email varchar(255) unique not null,
  password_hash varchar(255) not null,
  is_admin boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  app_id varchar(50) unique not null,
  name varchar(100) not null,
  allowed_origins text[] not null,
  secret varchar(255) not null,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.email_providers (
  id serial primary key,
  name varchar(50) not null,
  host varchar(255) not null,
  port integer not null,
  secure boolean default true,
  auth_user varchar(255),
  auth_pass_encrypted text,
  from_name varchar(100),
  from_email varchar(255),
  is_active boolean default false,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create table public.email_templates (
  id serial primary key,
  type varchar(50) unique not null,
  subject varchar(255) not null,
  content text not null,
  variables jsonb default '[]'::jsonb,
  updated_at timestamp with time zone default now()
);

create table public.email_logs (
  id uuid primary key default gen_random_uuid(),
  recipient varchar(255) not null,
  template_type varchar(50) not null,
  subject varchar(255),
  status varchar(20) not null,
  error_message text,
  retry_count integer default 0,
  provider_id integer references email_providers(id),
  sent_at timestamp,
  created_at timestamp default now()
);
