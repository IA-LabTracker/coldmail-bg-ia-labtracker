-- ============================================================
-- SECURITY HARDENING: lock down broken RLS policies
-- Date: 2026-05-01
--
-- Production state had:
--   - emails: USING (true) for SELECT/INSERT/UPDATE/DELETE
--     -> any authenticated user could read/modify ANY user's leads
--   - settings: duplicate "Allow all *" policies on `public` role
--     -> webhook URLs and credentials leaked across tenants
--   - email_warmup_interactions: RLS enabled but NO policies
--   - missing INSERT/UPDATE/DELETE policies on linkedin_accounts,
--     linkedin_messages, profiles, subscriptions
--   - all auth.uid() unwrapped (re-evaluated per row)
--
-- This migration replaces every policy with the
-- correct user-scoped form, wraps auth.uid() in (select ...)
-- to make the planner cache it once per query, and adds the
-- missing operations.
-- ============================================================

-- 1) emails ---------------------------------------------------
DROP POLICY IF EXISTS emails_allow_select_authenticated ON public.emails;
DROP POLICY IF EXISTS emails_allow_insert_authenticated ON public.emails;
DROP POLICY IF EXISTS emails_allow_update_authenticated ON public.emails;
DROP POLICY IF EXISTS emails_allow_delete_authenticated ON public.emails;

CREATE POLICY emails_select_own ON public.emails
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY emails_insert_own ON public.emails
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY emails_update_own ON public.emails
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY emails_delete_own ON public.emails
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- 2) settings -------------------------------------------------
DROP POLICY IF EXISTS "Allow all select on settings" ON public.settings;
DROP POLICY IF EXISTS "Allow all insert on settings" ON public.settings;
DROP POLICY IF EXISTS "Allow all update on settings" ON public.settings;
DROP POLICY IF EXISTS "Allow all delete on settings" ON public.settings;
DROP POLICY IF EXISTS "Users can read own settings" ON public.settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON public.settings;
DROP POLICY IF EXISTS "Users can update own settings" ON public.settings;
DROP POLICY IF EXISTS "Users can delete own settings" ON public.settings;

CREATE POLICY settings_select_own ON public.settings
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY settings_insert_own ON public.settings
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY settings_update_own ON public.settings
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY settings_delete_own ON public.settings
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- 3) email_warmup_interactions -------------------------------
-- Table has no user_id column; ownership is via sender being one
-- of the user's sender_emails. Receiver is also matched to allow
-- viewing inbound interactions to a user's mailbox.
DROP POLICY IF EXISTS warmup_interactions_select_own ON public.email_warmup_interactions;
DROP POLICY IF EXISTS warmup_interactions_insert_own ON public.email_warmup_interactions;

CREATE POLICY warmup_interactions_select_own ON public.email_warmup_interactions
  FOR SELECT TO authenticated
  USING (
    sender IN (
      SELECT email_address FROM public.sender_emails
      WHERE user_id = (SELECT auth.uid())
    )
    OR receiver IN (
      SELECT email_address FROM public.sender_emails
      WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY warmup_interactions_insert_own ON public.email_warmup_interactions
  FOR INSERT TO authenticated
  WITH CHECK (
    sender IN (
      SELECT email_address FROM public.sender_emails
      WHERE user_id = (SELECT auth.uid())
    )
  );
-- Update/delete intentionally omitted: N8N writes via service role.

-- 4) linkedin_accounts ----------------------------------------
DROP POLICY IF EXISTS "Users can read own linkedin_accounts" ON public.linkedin_accounts;
DROP POLICY IF EXISTS "Users can insert own linkedin_accounts" ON public.linkedin_accounts;
DROP POLICY IF EXISTS "Users can update own linkedin_accounts" ON public.linkedin_accounts;
DROP POLICY IF EXISTS "Users can delete own linkedin_accounts" ON public.linkedin_accounts;

CREATE POLICY linkedin_accounts_select_own ON public.linkedin_accounts
  FOR SELECT TO authenticated
  USING (client_id = ((SELECT auth.uid()))::text);

CREATE POLICY linkedin_accounts_insert_own ON public.linkedin_accounts
  FOR INSERT TO authenticated
  WITH CHECK (client_id = ((SELECT auth.uid()))::text);

CREATE POLICY linkedin_accounts_update_own ON public.linkedin_accounts
  FOR UPDATE TO authenticated
  USING (client_id = ((SELECT auth.uid()))::text)
  WITH CHECK (client_id = ((SELECT auth.uid()))::text);

CREATE POLICY linkedin_accounts_delete_own ON public.linkedin_accounts
  FOR DELETE TO authenticated
  USING (client_id = ((SELECT auth.uid()))::text);

-- 5) linkedin_messages ----------------------------------------
DROP POLICY IF EXISTS "Users can read own linkedin_messages" ON public.linkedin_messages;
DROP POLICY IF EXISTS "Users can insert own linkedin_messages" ON public.linkedin_messages;
DROP POLICY IF EXISTS "Users can update own linkedin_messages" ON public.linkedin_messages;
DROP POLICY IF EXISTS "Users can delete own linkedin_messages" ON public.linkedin_messages;

CREATE POLICY linkedin_messages_select_own ON public.linkedin_messages
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY linkedin_messages_insert_own ON public.linkedin_messages
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY linkedin_messages_update_own ON public.linkedin_messages
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY linkedin_messages_delete_own ON public.linkedin_messages
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- 6) profiles -------------------------------------------------
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;

CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()));

CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY profiles_delete_own ON public.profiles
  FOR DELETE TO authenticated
  USING (id = (SELECT auth.uid()));

-- 7) subscriptions --------------------------------------------
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can delete own subscription" ON public.subscriptions;

CREATE POLICY subscriptions_select_own ON public.subscriptions
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY subscriptions_insert_own ON public.subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY subscriptions_update_own ON public.subscriptions
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- 8) sender_emails / sender_warmups / schedules / email_templates
-- Existing semantics preserved; only wraps auth.uid() in (select ...).

DROP POLICY IF EXISTS "Users can view own sender emails" ON public.sender_emails;
DROP POLICY IF EXISTS "Users can insert own sender emails" ON public.sender_emails;
DROP POLICY IF EXISTS "Users can update own sender emails" ON public.sender_emails;
DROP POLICY IF EXISTS "Users can delete own sender emails" ON public.sender_emails;

CREATE POLICY sender_emails_select_own ON public.sender_emails
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY sender_emails_insert_own ON public.sender_emails
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY sender_emails_update_own ON public.sender_emails
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY sender_emails_delete_own ON public.sender_emails
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view own sender warmups" ON public.sender_warmups;
DROP POLICY IF EXISTS "Users can insert own sender warmups" ON public.sender_warmups;
DROP POLICY IF EXISTS "Users can update own sender warmups" ON public.sender_warmups;
DROP POLICY IF EXISTS "Users can delete own sender warmups" ON public.sender_warmups;

CREATE POLICY sender_warmups_select_own ON public.sender_warmups
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY sender_warmups_insert_own ON public.sender_warmups
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY sender_warmups_update_own ON public.sender_warmups
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY sender_warmups_delete_own ON public.sender_warmups
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can read own schedules" ON public.schedules;
DROP POLICY IF EXISTS "Users can insert own schedules" ON public.schedules;
DROP POLICY IF EXISTS "Users can update own schedules" ON public.schedules;
DROP POLICY IF EXISTS "Users can delete own schedules" ON public.schedules;

CREATE POLICY schedules_select_own ON public.schedules
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY schedules_insert_own ON public.schedules
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY schedules_update_own ON public.schedules
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY schedules_delete_own ON public.schedules
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view own email templates" ON public.email_templates;
DROP POLICY IF EXISTS "Users can insert own email templates" ON public.email_templates;
DROP POLICY IF EXISTS "Users can update own email templates" ON public.email_templates;
DROP POLICY IF EXISTS "Users can delete own email templates" ON public.email_templates;

CREATE POLICY email_templates_select_own ON public.email_templates
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY email_templates_insert_own ON public.email_templates
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY email_templates_update_own ON public.email_templates
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY email_templates_delete_own ON public.email_templates
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));
