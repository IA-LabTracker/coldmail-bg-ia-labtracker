-- ============================================
-- Migration: Replace campaign_warmups with sender_warmups
-- Purpose: Warm-up reputation belongs to the sender inbox, not to
--          a campaign. Drop the by-campaign table (safe: 0 rows)
--          and create a richer by-sender table with:
--          * business-days-only option (skip weekends)
--          * auto-pause on bounce-rate threshold
--          * auto-pause audit trail
-- ============================================

DROP TABLE IF EXISTS campaign_warmups;

CREATE TABLE IF NOT EXISTS sender_warmups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sender_email_id uuid REFERENCES sender_emails(id) ON DELETE CASCADE NOT NULL,

  -- State
  enabled boolean NOT NULL DEFAULT false,

  -- Ramp-up schedule
  start_volume integer NOT NULL DEFAULT 5,
  increment_per_day integer NOT NULL DEFAULT 5,
  daily_limit integer NOT NULL DEFAULT 50,

  -- Scheduling options
  business_days_only boolean NOT NULL DEFAULT true,

  -- Auto-pause rules
  bounce_threshold_pct numeric(5,2),          -- e.g., 5.00 = 5%. NULL disables.
  bounce_window_hours integer NOT NULL DEFAULT 24,

  -- Progress tracking
  started_at timestamptz,
  paused_at timestamptz,
  auto_paused_at timestamptz,
  auto_paused_reason text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- One warm-up per (user, sender)
ALTER TABLE sender_warmups
  ADD CONSTRAINT sender_warmups_user_sender_unique UNIQUE (user_id, sender_email_id);

CREATE INDEX sender_warmups_user_enabled_idx
  ON sender_warmups (user_id, enabled);

-- Sanity constraints
ALTER TABLE sender_warmups
  ADD CONSTRAINT sender_warmups_start_volume_positive CHECK (start_volume > 0),
  ADD CONSTRAINT sender_warmups_increment_non_negative CHECK (increment_per_day >= 0),
  ADD CONSTRAINT sender_warmups_daily_limit_gte_start CHECK (daily_limit >= start_volume),
  ADD CONSTRAINT sender_warmups_bounce_threshold_valid CHECK (
    bounce_threshold_pct IS NULL OR (bounce_threshold_pct > 0 AND bounce_threshold_pct <= 100)
  ),
  ADD CONSTRAINT sender_warmups_bounce_window_positive CHECK (bounce_window_hours > 0);

-- RLS
ALTER TABLE sender_warmups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sender warmups"
  ON sender_warmups FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sender warmups"
  ON sender_warmups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sender warmups"
  ON sender_warmups FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sender warmups"
  ON sender_warmups FOR DELETE
  USING (auth.uid() = user_id);
