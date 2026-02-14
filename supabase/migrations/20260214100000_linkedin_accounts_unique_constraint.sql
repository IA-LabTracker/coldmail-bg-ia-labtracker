/*
 Fix linkedin_accounts table:
 1. Remove duplicate rows (keep only the latest per account_id)
 2. Fix rows where client_id has LinkedIn display name instead of UUID
 3. Add UNIQUE constraint on account_id so upsert works correctly
    (one row per LinkedIn account, status gets updated in-place)
 */

-- Step 1: Delete duplicate rows, keeping only the most recent per account_id
DELETE FROM linkedin_accounts
WHERE id NOT IN (
  SELECT DISTINCT ON (account_id) id
  FROM linkedin_accounts
  ORDER BY account_id, data_conecction DESC
);

-- Step 2: Fix rows where client_id is not a valid UUID (e.g. "Patrick Almeida")
-- These were caused by fetchClientIdFromUnipile returning the LinkedIn display name.
-- Try to reassign them to the user who has a valid UUID in the same table.
UPDATE linkedin_accounts AS bad
SET client_id = good.client_id
FROM (
  SELECT DISTINCT client_id
  FROM linkedin_accounts
  WHERE client_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  LIMIT 1
) AS good
WHERE bad.client_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Step 3: Add unique constraint on account_id
ALTER TABLE linkedin_accounts ADD CONSTRAINT linkedin_accounts_account_id_key UNIQUE (account_id);
