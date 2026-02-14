/*
 Add RLS policies for linkedin_accounts table.
 
 The table was created manually with RLS enabled but no policies,
 which meant ALL operations were denied for non-service-role clients.
 
 These policies allow authenticated users to read their own records.
 INSERT/UPDATE are done server-side via service_role (webhook callback + sync),
 so we only need SELECT policies for the frontend.
 */
-- Allow authenticated users to read their own linkedin account events
CREATE POLICY "Users can read own linkedin_accounts" ON linkedin_accounts FOR
SELECT
  TO authenticated USING (client_id = auth.uid() :: text);