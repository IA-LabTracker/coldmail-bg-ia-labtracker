-- ============================================
-- Migration: Create sender_emails table
-- Purpose: Allow users to manage multiple sender email accounts
--          with support for external email providers (Resend, Zapmail, SES, Mailgun, SMTP, etc.)
-- ============================================

-- 1. Create the sender_emails table
CREATE TABLE IF NOT EXISTS sender_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Identity
  email_address text NOT NULL,
  display_name text NOT NULL DEFAULT '',
  domain text NOT NULL DEFAULT '',            -- extracted domain (company.com), useful for grouping
  is_default boolean NOT NULL DEFAULT false,

  -- Provider integration
  provider text NOT NULL DEFAULT 'manual',    -- 'manual' | 'resend' | 'zapmail' | 'ses' | 'mailgun' | 'smtp' | etc.
  provider_id text DEFAULT NULL,              -- ID of this email/domain in the external provider
  status text NOT NULL DEFAULT 'active',      -- 'pending' | 'active' | 'error' | 'suspended'
  provider_metadata jsonb NOT NULL DEFAULT '{}', -- any provider-specific data (API responses, config, quotas, etc.)
  last_synced_at timestamptz DEFAULT NULL,    -- last time we checked status with the provider API

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Unique constraint: one email_address per user
ALTER TABLE sender_emails
  ADD CONSTRAINT sender_emails_user_email_unique UNIQUE (user_id, email_address);

-- 3. Only one default per user (partial unique index)
CREATE UNIQUE INDEX sender_emails_one_default_per_user
  ON sender_emails (user_id)
  WHERE is_default = true;

-- 4. Index for provider queries (list all emails from a provider)
CREATE INDEX sender_emails_provider_idx
  ON sender_emails (user_id, provider);

-- 5. Index for domain grouping
CREATE INDEX sender_emails_domain_idx
  ON sender_emails (user_id, domain);

-- 6. RLS policies
ALTER TABLE sender_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sender emails"
  ON sender_emails FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sender emails"
  ON sender_emails FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sender emails"
  ON sender_emails FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sender emails"
  ON sender_emails FOR DELETE
  USING (auth.uid() = user_id);

-- 7. Add sender_email_id column to schedules table
ALTER TABLE schedules
  ADD COLUMN IF NOT EXISTS sender_email_id uuid REFERENCES sender_emails(id) ON DELETE SET NULL;
