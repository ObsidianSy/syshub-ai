-- Reset password script for SysHub AI
-- Usage: run on the postgres database as a safe, explicit operation
-- NOTE: replace the EMAIL and HASH placeholders below before running

BEGIN;
-- Force schema lookup to the expected schema where your tables live
-- If your tables are in the schema `postgres`, use that; otherwise adjust accordingly
SET LOCAL search_path = postgres, public;

-- Update the user password (bcrypt hash expected in password_hash column)
-- Replace 'EMAIL_ADDRESS' with your user email and 'BCRYPT_HASH' with the generated hash
UPDATE users
  SET password_hash = 'BCRYPT_HASH', updated_at = now()
  WHERE lower(email) = lower('EMAIL_ADDRESS');

-- Verify update
SELECT id, email, created_at, updated_at FROM users WHERE lower(email) = lower('EMAIL_ADDRESS');

COMMIT;

-- Example output should show the user row and updated_at changed to now()
-- If no rows updated, check the email value, schema, and whether the users table exists in the selected schema
