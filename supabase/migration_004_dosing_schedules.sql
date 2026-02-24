-- Dosing schedules table: stores AI-generated weekly dosing plans
CREATE TABLE IF NOT EXISTS dosing_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  peptide_id uuid NOT NULL REFERENCES peptides(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  time_of_day text NOT NULL CHECK (time_of_day IN ('morning', 'afternoon', 'evening')),
  dose_mcg numeric NOT NULL CHECK (dose_mcg > 0),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- RLS policies
ALTER TABLE dosing_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own schedules"
  ON dosing_schedules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own schedules"
  ON dosing_schedules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own schedules"
  ON dosing_schedules FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_dosing_schedules_user ON dosing_schedules(user_id);
CREATE INDEX idx_dosing_schedules_day ON dosing_schedules(user_id, day_of_week);
