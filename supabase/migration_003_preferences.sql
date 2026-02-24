-- Add preferences JSONB column to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN user_profiles.preferences IS 'User preferences for AI assistance: goals, experience_level, injection_comfort, preferred_injection_time, notes';
