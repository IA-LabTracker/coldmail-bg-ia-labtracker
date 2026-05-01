-- ============================================================
-- INDEX CLEANUP + COMPOSITE INDEXES FOR HOT QUERIES
-- Date: 2026-05-01
--
-- - Drops 6 pairs of duplicate indexes (Supabase advisor flagged
--   them; ~50% wasted disk on the emails table).
-- - Replaces single-column indexes that are dominated by composite
--   (user_id, X) variants. Under RLS every read is filtered by
--   user_id first, so user_id-prefixed composites give us
--   index-only scans where the old single-column ones did not.
-- - Adds the FK indexes the perf advisor flagged.
-- ============================================================

-- 1) Drop duplicates.
DROP INDEX IF EXISTS public.idx_emails_user_id;
DROP INDEX IF EXISTS public.idx_emails_status;
DROP INDEX IF EXISTS public.idx_emails_lead_classification;
DROP INDEX IF EXISTS public.idx_emails_campaign_name;
DROP INDEX IF EXISTS public.idx_emails_date_sent;
DROP INDEX IF EXISTS public.idx_settings_user_id;
DROP INDEX IF EXISTS public.settings_user_id_idx;

-- 2) Drop single-column indexes superseded by user-prefixed composites.
DROP INDEX IF EXISTS public.emails_status_idx;
DROP INDEX IF EXISTS public.emails_lead_classification_idx;
DROP INDEX IF EXISTS public.emails_campaign_name_idx;

-- 3) Composite indexes for the hot read paths.
CREATE INDEX IF NOT EXISTS emails_user_created_idx
  ON public.emails (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS emails_user_status_idx
  ON public.emails (user_id, status);
CREATE INDEX IF NOT EXISTS emails_user_classification_idx
  ON public.emails (user_id, lead_classification);
CREATE INDEX IF NOT EXISTS emails_user_campaign_idx
  ON public.emails (user_id, campaign_name);
CREATE INDEX IF NOT EXISTS emails_user_date_sent_idx
  ON public.emails (user_id, date_sent DESC);
CREATE INDEX IF NOT EXISTS emails_user_sender_email_id_idx
  ON public.emails (user_id, sender_email_id);

-- 4) FK indexes flagged by the perf advisor.
CREATE INDEX IF NOT EXISTS schedules_sender_email_id_idx
  ON public.schedules (sender_email_id);
CREATE INDEX IF NOT EXISTS sender_warmups_sender_email_id_idx
  ON public.sender_warmups (sender_email_id);

-- 5) linkedin_messages composites.
CREATE INDEX IF NOT EXISTS linkedin_messages_user_created_idx
  ON public.linkedin_messages (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS linkedin_messages_user_status_idx
  ON public.linkedin_messages (user_id, status);

-- 6) email_warmup_interactions: indexed by sender for the warmup
--    hook joins (sender = users own addresses).
CREATE INDEX IF NOT EXISTS email_warmup_interactions_sender_created_idx
  ON public.email_warmup_interactions (sender, created_at DESC);
CREATE INDEX IF NOT EXISTS email_warmup_interactions_sender_type_idx
  ON public.email_warmup_interactions (sender, interaction_type);

-- 7) schedules composites.
DROP INDEX IF EXISTS public.schedules_status_idx;
DROP INDEX IF EXISTS public.schedules_next_run_at_idx;

CREATE INDEX IF NOT EXISTS schedules_user_status_idx
  ON public.schedules (user_id, status);
CREATE INDEX IF NOT EXISTS schedules_user_next_run_at_idx
  ON public.schedules (user_id, next_run_at);
