-- Peptide Pal: Database Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)

-- Peptides table: stores each peptide in your regimen
create table if not exists peptides (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  default_dose_mcg numeric not null,
  frequency_description text not null default '',
  notes text,
  created_at timestamptz not null default now()
);

-- Injections table: logs each injection event
create table if not exists injections (
  id uuid primary key default gen_random_uuid(),
  peptide_id uuid not null references peptides(id) on delete cascade,
  dose_mcg numeric not null,
  injection_site text not null,
  injection_time timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);

-- Index for fast lookups of recent injections per peptide
create index if not exists idx_injections_peptide_time
  on injections (peptide_id, injection_time desc);

-- Enable Row Level Security (optional, for future auth)
alter table peptides enable row level security;
alter table injections enable row level security;

-- Permissive policies for now (no auth required)
-- Replace these with user-scoped policies when you add authentication
create policy "Allow all access to peptides" on peptides
  for all using (true) with check (true);

create policy "Allow all access to injections" on injections
  for all using (true) with check (true);
