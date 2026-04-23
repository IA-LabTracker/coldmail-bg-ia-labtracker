-- ============================================
-- Migration: Extend sender_emails.platform CHECK
-- Purpose: Allow 'google' and 'outlook' as dispatch platforms
--          in addition to the existing 'none' | 'smartlead' | 'resend' | 'zapmail'.
-- ============================================

ALTER TABLE sender_emails DROP CONSTRAINT IF EXISTS sender_emails_platform_check;

ALTER TABLE sender_emails ADD CONSTRAINT sender_emails_platform_check
  CHECK (platform = ANY (ARRAY['none','smartlead','resend','zapmail','google','outlook']));
