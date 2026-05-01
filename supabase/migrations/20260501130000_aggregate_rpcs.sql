-- ============================================================
-- AGGREGATE RPCS — replace "fetch all rows + count in JS" patterns
-- Date: 2026-05-01
--
-- Both functions are SECURITY INVOKER (default), so RLS on `emails`
-- still applies — the explicit `auth.uid()` filter is just to help
-- the planner choose the right index.
-- search_path is pinned for safety; refs schema-qualified.
-- ============================================================

-- 1) Per-sender email stats — used by /sender-emails page.
--    Replaces a "select id,status,sender_email_id from emails" of
--    every row, aggregated in JS, with one grouped query that uses
--    the (user_id, sender_email_id) composite index (index-only scan).
CREATE OR REPLACE FUNCTION public.sender_email_stats()
RETURNS TABLE (
  sender_email_id uuid,
  total bigint,
  sent bigint,
  replied bigint,
  bounced bigint,
  opened bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT
    e.sender_email_id,
    pg_catalog.count(*)                                                   AS total,
    pg_catalog.count(*) FILTER (WHERE e.status = 'sent')                  AS sent,
    pg_catalog.count(*) FILTER (WHERE e.status = 'replied')               AS replied,
    pg_catalog.count(*) FILTER (WHERE e.status = 'bounced')               AS bounced,
    pg_catalog.count(*) FILTER (WHERE e.status = 'opened')                AS opened
  FROM public.emails e
  WHERE e.user_id = (SELECT auth.uid())
    AND e.sender_email_id IS NOT NULL
  GROUP BY e.sender_email_id;
$$;

-- 2) Distinct campaign names — used by /import for the suggestions list.
--    Replaces fetching every campaign_name string just to dedupe in JS.
CREATE OR REPLACE FUNCTION public.user_campaign_names()
RETURNS TABLE (campaign_name text)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT DISTINCT e.campaign_name
  FROM public.emails e
  WHERE e.user_id = (SELECT auth.uid())
    AND e.campaign_name IS NOT NULL
    AND e.campaign_name <> ''
  ORDER BY e.campaign_name;
$$;

GRANT EXECUTE ON FUNCTION public.sender_email_stats()    TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_campaign_names()   TO authenticated;
REVOKE EXECUTE ON FUNCTION public.sender_email_stats()   FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.user_campaign_names()  FROM anon, PUBLIC;
