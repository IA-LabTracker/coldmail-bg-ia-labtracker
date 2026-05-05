-- ============================================================
-- Limpeza de índices comprovadamente não-usados pelo app + ANALYZE
-- Date: 2026-05-01
--
-- Após auditoria de pg_stat_user_indexes:
-- - linkedin_messages_top_skills_gin_idx: 0 scans desde a criação.
--   GIN é caro em inserts. App lê top_skills no detail modal, mas
--   nunca pesquisa por skill.
-- - sender_emails_provider_idx (user_id, provider): 0 scans. App
--   filtra exclusivamente por `platform`; o composite
--   idx_sender_emails_platform (user_id, platform) cobre as queries.
--
-- ANALYZE refresca estatísticas para o query planner (em ambiente
-- single-user a seletividade de user_id pode estar mal-estimada).
-- ============================================================

DROP INDEX IF EXISTS public.linkedin_messages_top_skills_gin_idx;
DROP INDEX IF EXISTS public.sender_emails_provider_idx;

ANALYZE public.emails;
ANALYZE public.email_warmup_interactions;
ANALYZE public.sender_emails;
ANALYZE public.sender_warmups;
ANALYZE public.schedules;
ANALYZE public.linkedin_messages;
ANALYZE public.linkedin_accounts;
ANALYZE public.email_templates;
ANALYZE public.reply_actions;
ANALYZE public.settings;
ANALYZE public.profiles;
ANALYZE public.subscriptions;
