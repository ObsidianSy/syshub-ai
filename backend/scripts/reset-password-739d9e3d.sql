-- Reset password for user with id 739d9e3d-5e7a-411f-947e-74d74e1ab816
-- This sets the password to: senha123
-- The bcrypt hash for senha123 used here is:
-- $2a$10$C3rI/N8p5kfe7Fy5/CALQeEfMiYmmGoSeqF6/gXgKNgdRcQ6QyD8S

BEGIN;
-- Ensure the correct schema is used. If your tables are in schema `postgres`, keep it.
-- If tables are in `docker` schema instead, change 'postgres' to 'docker' below.
SET LOCAL search_path = postgres, public;

UPDATE users
  SET password_hash = '$2a$10$C3rI/N8p5kfe7Fy5/CALQeEfMiYmmGoSeqF6/gXgKNgdRcQ6QyD8S', updated_at = now()
  WHERE id = '739d9e3d-5e7a-411f-947e-74d74e1ab816'
    OR lower(email) = lower('deltagarr@gmail.com');

-- Verify update
SELECT id, email, created_at, updated_at FROM users WHERE id = '739d9e3d-5e7a-411f-947e-74d74e1ab816';

COMMIT;

-- Example usage (bash):
-- docker exec -i docker_iagente psql -U postgres -d docker -f /path/to/reset-password-739d9e3d.sql

-- Or inline (bash):
-- docker exec -i docker_iagente psql -U postgres -d docker -c "BEGIN; SET LOCAL search_path = postgres, public; UPDATE users SET password_hash = '\"$2a$10$C3rI/N8p5kfe7Fy5/CALQeEfMiYmmGoSeqF6/gXgKNgdRcQ6QyD8S\'', updated_at = now() WHERE id = '739d9e3d-5e7a-411f-947e-74d74e1ab816' OR lower(email) = lower('deltagarr@gmail.com'); SELECT id, email, created_at, updated_at FROM users WHERE id = '739d9e3d-5e7a-411f-947e-74d74e1ab816'; COMMIT;"
