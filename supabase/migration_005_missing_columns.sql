-- Migration 005: Add missing columns for preferences and archived protocols
-- Run this in your Supabase SQL Editor if columns don't exist yet

-- Add preferences JSONB column to user_profiles (from migration_003, re-applied safely)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT NULL;

-- Add archived column to peptides for protocol archiving
ALTER TABLE peptides
ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;
