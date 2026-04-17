-- ============================================
-- Migration: Create email_templates table
-- Purpose: Allow users to manage multiple named email templates,
--          each optionally scoped to a dispatch platform.
-- ============================================

-- 1. Create the email_templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Identity
  name text NOT NULL,
  description text NOT NULL DEFAULT '',

  -- Content
  subject text NOT NULL DEFAULT '',
  body_html text NOT NULL DEFAULT '',

  -- Targeting
  platform text NOT NULL DEFAULT 'any',  -- 'any' | 'smartlead' | 'resend' | 'zapmail' | 'linkedin' | future platforms
  is_default boolean NOT NULL DEFAULT false,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Unique name per user
ALTER TABLE email_templates
  ADD CONSTRAINT email_templates_user_name_unique UNIQUE (user_id, name);

-- 3. Only one default template per user per platform (partial unique index)
CREATE UNIQUE INDEX email_templates_one_default_per_platform
  ON email_templates (user_id, platform)
  WHERE is_default = true;

-- 4. Index for platform lookups
CREATE INDEX email_templates_platform_idx
  ON email_templates (user_id, platform);

-- 5. RLS policies
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own email templates"
  ON email_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email templates"
  ON email_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own email templates"
  ON email_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own email templates"
  ON email_templates FOR DELETE
  USING (auth.uid() = user_id);
