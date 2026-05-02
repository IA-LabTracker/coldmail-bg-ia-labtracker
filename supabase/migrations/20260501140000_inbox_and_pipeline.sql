-- ============================================================
-- INBOX + PIPELINE — 2 features novas
-- Date: 2026-05-01
--
-- Feature 1 — Reply Inbox:
--   reply_actions guarda APENAS o que o user fez na inbox
--   (arquivar, override de intent). A classificação automática
--   é derivada client-side a partir de emails.reply_we_got
--   via lib/replyClassifier.ts (mais fácil de iterar/testar
--   do que regex em SQL).
--
-- Feature 2 — Pipeline value tracking:
--   colunas deal_status / deal_value / deal_closed_at /
--   deal_lost_reason em emails + RPC pipeline_metrics() que
--   agrega por campanha (reply rate, win rate, pipeline value,
--   closed-won value).
-- ============================================================

-- ─── Feature 1: Reply Inbox ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reply_actions (
  email_id uuid PRIMARY KEY REFERENCES public.emails(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  intent_override text CHECK (intent_override IN ('positive','objection','negative','ooo','unsubscribe','other')),
  is_archived boolean NOT NULL DEFAULT false,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reply_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY reply_actions_select_own ON public.reply_actions
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY reply_actions_insert_own ON public.reply_actions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY reply_actions_update_own ON public.reply_actions
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY reply_actions_delete_own ON public.reply_actions
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE INDEX IF NOT EXISTS reply_actions_user_archived_idx
  ON public.reply_actions (user_id, is_archived);

DROP TRIGGER IF EXISTS reply_actions_updated_at ON public.reply_actions;
CREATE TRIGGER reply_actions_updated_at
  BEFORE UPDATE ON public.reply_actions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Partial index para a query da inbox. Ordenação por updated_at é
-- segura cronologicamente (time_we_got_reply é text não comparável).
CREATE INDEX IF NOT EXISTS emails_user_replied_idx
  ON public.emails (user_id, updated_at DESC)
  WHERE status = 'replied';

-- ─── Feature 2: Pipeline value tracking ─────────────────────
ALTER TABLE public.emails
  ADD COLUMN IF NOT EXISTS deal_status text
    CHECK (deal_status IN ('open','won','lost')),
  ADD COLUMN IF NOT EXISTS deal_value numeric(12,2),
  ADD COLUMN IF NOT EXISTS deal_closed_at timestamptz,
  ADD COLUMN IF NOT EXISTS deal_lost_reason text;

CREATE INDEX IF NOT EXISTS emails_user_deal_status_idx
  ON public.emails (user_id, deal_status)
  WHERE deal_status IS NOT NULL;

CREATE OR REPLACE FUNCTION public.pipeline_metrics()
RETURNS TABLE (
  campaign_name      text,
  total_leads        bigint,
  replied            bigint,
  open_deals         bigint,
  won_deals          bigint,
  lost_deals         bigint,
  pipeline_value     numeric,
  closed_won_value   numeric,
  reply_rate         numeric,
  win_rate           numeric
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT
    COALESCE(NULLIF(e.campaign_name, ''), '(no campaign)') AS campaign_name,
    pg_catalog.count(*) AS total_leads,
    pg_catalog.count(*) FILTER (WHERE e.status = 'replied') AS replied,
    pg_catalog.count(*) FILTER (WHERE e.deal_status = 'open') AS open_deals,
    pg_catalog.count(*) FILTER (WHERE e.deal_status = 'won')  AS won_deals,
    pg_catalog.count(*) FILTER (WHERE e.deal_status = 'lost') AS lost_deals,
    COALESCE(pg_catalog.sum(e.deal_value) FILTER (WHERE e.deal_status = 'open'), 0) AS pipeline_value,
    COALESCE(pg_catalog.sum(e.deal_value) FILTER (WHERE e.deal_status = 'won'),  0) AS closed_won_value,
    CASE
      WHEN pg_catalog.count(*) FILTER (WHERE e.status IN ('sent','replied','opened','bounced')) = 0
        THEN 0::numeric
      ELSE pg_catalog.round(
        pg_catalog.count(*) FILTER (WHERE e.status = 'replied')::numeric
        / pg_catalog.count(*) FILTER (WHERE e.status IN ('sent','replied','opened','bounced')) * 100,
        2
      )
    END AS reply_rate,
    CASE
      WHEN pg_catalog.count(*) FILTER (WHERE e.deal_status IN ('won','lost')) = 0
        THEN 0::numeric
      ELSE pg_catalog.round(
        pg_catalog.count(*) FILTER (WHERE e.deal_status = 'won')::numeric
        / pg_catalog.count(*) FILTER (WHERE e.deal_status IN ('won','lost')) * 100,
        2
      )
    END AS win_rate
  FROM public.emails e
  WHERE e.user_id = (SELECT auth.uid())
  GROUP BY COALESCE(NULLIF(e.campaign_name, ''), '(no campaign)')
  ORDER BY closed_won_value DESC, pipeline_value DESC;
$$;

GRANT EXECUTE ON FUNCTION public.pipeline_metrics() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.pipeline_metrics() FROM anon, PUBLIC;
