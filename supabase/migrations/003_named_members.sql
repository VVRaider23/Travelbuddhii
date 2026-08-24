-- ─── Migration 003: Named Members ────────────────────────────────────────────
--
-- Expenses and settlements were showing "User a3f9c1" because nothing ever
-- stored a human name. Names live on trip_members rather than a global profile
-- table so the same person can be "Vibudh" in a work trip and "VV" with friends,
-- and because the TripMember interface in src/store/tripStore.ts was already
-- written to expect exactly these three fields.

ALTER TABLE trip_members ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE trip_members ADD COLUMN IF NOT EXISTS avatar_url   text;
ALTER TABLE trip_members ADD COLUMN IF NOT EXISTS upi_id       text;

-- Backfill everyone who already joined, using whatever the identity provider
-- gave us. Google OAuth fills full_name and avatar_url; phone OTP sign-ups have
-- neither, so those fall back to the email local part and stay null-named if
-- there is no email either. Those people get prompted to name themselves.
UPDATE trip_members tm
SET display_name = COALESCE(
      NULLIF(u.raw_user_meta_data->>'full_name', ''),
      NULLIF(u.raw_user_meta_data->>'name', ''),
      NULLIF(split_part(COALESCE(u.email, ''), '@', 1), '')
    ),
    avatar_url = NULLIF(u.raw_user_meta_data->>'avatar_url', '')
FROM auth.users u
WHERE u.id = tm.user_id
  AND tm.display_name IS NULL;

-- Members may edit their own row. Every write in the app currently goes through
-- the service-role client, so this policy is not what enforces the rule today;
-- it is here so the table is not the one exception with no UPDATE policy.
DROP POLICY IF EXISTS "members_update_self" ON trip_members;
CREATE POLICY "members_update_self" ON trip_members FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
