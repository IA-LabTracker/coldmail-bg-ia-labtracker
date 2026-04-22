-- ============================================
-- Migration: Add topped_out_at to sender_warmups
-- Purpose: Track when a warm-up first reached its daily_limit target.
--          Enables one-time "cruise" notifications (toast/email).
-- ============================================

ALTER TABLE sender_warmups
  ADD COLUMN IF NOT EXISTS topped_out_at timestamptz;

COMMENT ON COLUMN sender_warmups.topped_out_at IS
  'Timestamp when this warm-up first reached daily_limit. Used for idempotent notifications; cleared on resetProgress.';
