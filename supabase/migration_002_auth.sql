-- Migration 002: Add authentication, user profiles, and reconstitution support
-- Run this in your Supabase SQL Editor AFTER migration.sql

-- 1. User profiles table (stores syringe size and onboarding state)
create table if not exists user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  syringe_size_ml numeric not null default 0.5,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  unique(user_id)
);

alter table user_profiles enable row level security;

create policy "Users can read own profile" on user_profiles
  for select using (user_id = auth.uid());

create policy "Users can insert own profile" on user_profiles
  for insert with check (user_id = auth.uid());

create policy "Users can update own profile" on user_profiles
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 2. Add user_id and reconstitution columns to peptides
alter table peptides add column if not exists user_id uuid references auth.users(id);
alter table peptides add column if not exists vial_size_mg numeric;
alter table peptides add column if not exists reconstitution_volume_ml numeric;

-- 3. Add user_id to injections
alter table injections add column if not exists user_id uuid references auth.users(id);

-- 4. Drop old permissive policies and create user-scoped ones
drop policy if exists "Allow all access to peptides" on peptides;
drop policy if exists "Allow all access to injections" on injections;

create policy "Users can manage own peptides" on peptides
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users can manage own injections" on injections
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 5. Index for user-scoped queries
create index if not exists idx_peptides_user on peptides (user_id);
create index if not exists idx_injections_user on injections (user_id);
