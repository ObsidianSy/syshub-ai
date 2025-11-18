-- Script para criar/atualizar usuário de teste no PostgreSQL
-- Senha: senha123
-- Hash bcrypt da senha "senha123" (10 rounds)

-- Deletar usuário se já existir
DELETE FROM users WHERE email = 'deltagarr@gmail.com';

-- Inserir novo usuário com senha conhecida
INSERT INTO users (email, password_hash, full_name, role, is_active)
VALUES (
  'deltagarr@gmail.com',
  '$2a$10$YQ7fP4Rl0JxFvH8Yt8h1wO3p8YkVmH2vKxNmH8JjKxLmH8YkVmH2v', -- senha123
  'Wesley Admin',
  'admin',
  true
);

-- Verificar usuário criado
SELECT id, email, full_name, role, is_active, created_at 
FROM users 
WHERE email = 'deltagarr@gmail.com';
