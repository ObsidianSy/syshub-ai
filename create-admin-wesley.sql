-- =====================================================
-- CRIAR USUÁRIO ADMIN WESLEY
-- =====================================================
-- Execute este arquivo com:
-- docker exec -i syshub_postgres psql -U postgres -d syshub < create-admin-wesley.sql
-- 
-- OU copie e cole o comando abaixo diretamente no terminal:

-- Hash bcrypt da senha 'senha123' (gerado com salt 10)
-- Senha: senha123

INSERT INTO users (email, password_hash, full_name, role, is_active)
VALUES (
  'deltagarr@gmail.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'Wesley',
  'admin',
  true
)
ON CONFLICT (email) 
DO UPDATE SET 
  password_hash = EXCLUDED.password_hash,
  full_name = EXCLUDED.full_name,
  role = 'admin',
  is_active = true
RETURNING id, email, full_name, role, created_at;

-- Verificar usuário criado
SELECT id, email, full_name, role, is_active, created_at 
FROM users 
WHERE email = 'deltagarr@gmail.com';
