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
