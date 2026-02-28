-- Supabase schema for Roast My Resume

create type user_plan as enum ('free', 'pro', 'lifetime');

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text,
  username text,
  created_at timestamptz not null default now(),
  plan user_plan not null default 'free',
  stripe_customer_id text
);

create unique index if not exists users_username_key on public.users (username) where (username is not null);

-- If you already have public.users, run this to add new columns:
-- alter table public.users add column if not exists full_name text;
-- alter table public.users add column if not exists username text;
-- create unique index if not exists users_username_key on public.users (username) where (username is not null);

create table if not exists public.roasts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  resume_text text not null,
  result_json jsonb,
  score integer,
  status text not null default 'processing'
);

create index if not exists roasts_user_id_idx on public.roasts (user_id);

