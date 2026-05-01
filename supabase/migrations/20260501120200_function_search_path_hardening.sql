-- ============================================================
-- FUNCTION SECURITY HARDENING (search_path + RPC revokes)
-- Date: 2026-05-01
--
-- Pinning search_path='' on every plpgsql function blocks
-- search_path injection: an attacker who can create objects in a
-- schema that ends up in the role's search_path cannot shadow
-- built-ins from inside our functions. Bodies that referenced
-- unqualified names are re-defined in a follow-up migration.
--
-- The two trigger functions that run with SECURITY DEFINER are
-- meant to fire from auth.users triggers, NOT to be invoked via
-- /rest/v1/rpc. Revoking EXECUTE makes that explicit.
-- ============================================================

ALTER FUNCTION public.handle_updated_at() SET search_path = '';
ALTER FUNCTION public.update_updated_at() SET search_path = '';
ALTER FUNCTION public.update_updated_at_column() SET search_path = '';
ALTER FUNCTION public.handle_new_user() SET search_path = '';
ALTER FUNCTION public.handle_new_user_subscription() SET search_path = '';
ALTER FUNCTION public.update_lead_quality_score() SET search_path = '';
ALTER FUNCTION public.calculate_lead_quality_score(
  p_is_premium boolean,
  p_follower_count integer,
  p_connections_count integer,
  p_has_company boolean,
  p_skills_count integer
) SET search_path = '';

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_subscription() FROM anon, authenticated, PUBLIC;
