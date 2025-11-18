# Variáveis de Ambiente para Easypanel

Adicione estas variáveis no painel do Easypanel:

## Banco de Dados PostgreSQL
```
DB_HOST=docker_iagente
DB_PORT=5432
DB_NAME=docker
DB_USER=postgres
DB_PASSWORD=sua_senha_aqui
DB_SCHEMA=docker
```

## Aplicação
```
NODE_ENV=production
PORT=3001
JWT_SECRET=seu_jwt_secret_aqui
ADMIN_RESET_TOKEN=seu_token_secreto_para_reset
```

## Webhooks (opcional)
```
N8N_WEBHOOK_URL=sua_url_n8n_aqui
```

## CORS (opcional)
```
CORS_ORIGIN=*
```

---

## ⚠️ IMPORTANTE: DB_SCHEMA

A variável **DB_SCHEMA=docker** é CRÍTICA porque as tabelas estão no schema "docker", não no schema "public" padrão do PostgreSQL.

Sem essa variável, o servidor vai buscar as tabelas no lugar errado e vai dar erro:
```
error: relation "users" does not exist
```

## Como adicionar no Easypanel:

1. Acesse seu projeto no Easypanel
2. Vá em **Environment Variables**
3. Adicione cada variável acima
4. Clique em **Deploy** para reiniciar com as novas variáveis

---

## Reset de senha (modo seguro)

Caso prefira usar o endpoint de reset em vez de executar SQL manualmente, defina `ADMIN_RESET_TOKEN` como acima e então rode:

```bash
curl -X POST https://docker-nexushub.q4xusi.easypanel.host/api/admin/reset-password \
	-H "Content-Type: application/json" \
	-H "x-admin-token: $ADMIN_RESET_TOKEN" \
	-d '{"email":"deltagarr@gmail.com","password":"senha123"}'
```

Se for usar SQL direto, em um host com `psql` disponível você pode executar:

```bash
docker exec -i docker_iagente psql -U postgres -d docker -c "UPDATE users SET password_hash = '$2a$10$C3rI/N8p5kfe7Fy5/CALQeEfMiYmmGoSeqF6/gXgKNgdRcQ6QyD8S', updated_at = now() WHERE email = 'deltagarr@gmail.com';"
```
