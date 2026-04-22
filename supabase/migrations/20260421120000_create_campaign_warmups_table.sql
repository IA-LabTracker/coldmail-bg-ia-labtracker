-- ============================================
-- Migration: Create campaign_warmups table
-- Purpose: Track warm-up state per campaign so users can toggle
--          gradual sending ramp-up on/off and the dispatcher can
--          read today's allowed volume.
-- ============================================

CREATE TABLE IF NOT EXISTS campaign_warmups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Campaign reference (emails.campaign_name is the natural key in this app)
  campaign_name text NOT NULL,

  -- State
  enabled boolean NOT NULL DEFAULT false,

  -- Ramp-up schedule
  start_volume integer NOT NULL DEFAULT 5,        -- emails/day on day 1
  increment_per_day integer NOT NULL DEFAULT 5,   -- +N emails/day until daily_limit
  daily_limit integer NOT NULL DEFAULT 50,        -- target emails/day

  -- Progress tracking
  started_at timestamptz,                         -- set when first enabled; null if never started
  paused_at timestamptz,                          -- set when toggled off

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- One warm-up record per (user, campaign_name)
ALTER TABLE campaign_warmups
  ADD CONSTRAINT campaign_warmups_user_campaign_unique UNIQUE (user_id, campaign_name);

CREATE INDEX campaign_warmups_user_enabled_idx
  ON campaign_warmups (user_id, enabled);

-- Sanity constraints
ALTER TABLE campaign_warmups
  ADD CONSTRAINT campaign_warmups_start_volume_positive CHECK (start_volume > 0),
  ADD CONSTRAINT campaign_warmups_increment_non_negative CHECK (increment_per_day >= 0),
  ADD CONSTRAINT campaign_warmups_daily_limit_gte_start CHECK (daily_limit >= start_volume);

-- RLS
ALTER TABLE campaign_warmups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own campaign warmups"
  ON campaign_warmups FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own campaign warmups"
  ON campaign_warmups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own campaign warmups"
  ON campaign_warmups FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own campaign warmups"
  ON campaign_warmups FOR DELETE
  USING (auth.uid() = user_id);
