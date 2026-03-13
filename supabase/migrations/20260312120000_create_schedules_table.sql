/*
 # Create schedules table

 1. New Tables
 - `schedules` - Stores scheduling configuration for dispatch automation
   - core fields: id, user_id, name, type, status
   - schedule timing: scheduled_date, scheduled_time, recurring_days
   - selections + stats: lead_selections, total_leads, leads_sent
   - runtime tracking: next_run_at, last_run_at
   - timestamps: created_at, updated_at

 2. Indexes
 - user_id for filtering
 - status for quick filtering
 - next_run_at for scheduling queries

 3. Security
 - Enable RLS
 - Policies for authenticated users (read/write own rows only)

 4. Triggers
 - updated_at auto-update on UPDATE (uses existing update_updated_at_column)
*/

CREATE TABLE IF NOT EXISTS schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('one_time', 'recurring')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('active', 'paused', 'completed', 'draft')),
  scheduled_date date,
  scheduled_time time NOT NULL,
  recurring_days text[] NOT NULL DEFAULT '{}',
  lead_selections jsonb NOT NULL DEFAULT '[]',
  total_leads int NOT NULL DEFAULT 0,
  leads_sent int NOT NULL DEFAULT 0,
  next_run_at timestamptz,
  last_run_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS schedules_user_id_idx ON schedules(user_id);
CREATE INDEX IF NOT EXISTS schedules_status_idx ON schedules(status);
CREATE INDEX IF NOT EXISTS schedules_next_run_at_idx ON schedules(next_run_at);

ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own schedules" ON schedules FOR
SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own schedules" ON schedules FOR
INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own schedules" ON schedules FOR
UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own schedules" ON schedules FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS schedules_update_updated_at ON schedules;
CREATE TRIGGER schedules_update_updated_at BEFORE
UPDATE
  ON schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
