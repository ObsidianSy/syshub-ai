# 🚀 SETUP COMPLETO - ATUALIZADO

## 📦 Pré-requisitos

- Node.js 18+ instalado
- Docker Desktop rodando

---

## 🎯 SETUP RÁPIDO (3 Passos)

### 1️⃣ **Instalar Dependências**

```powershell
# Raiz do projeto
npm install

# Backend
cd backend
npm install
cd ..
```

### 2️⃣ **Subir PostgreSQL com Docker**

```powershell
# Inicia o container PostgreSQL (cria tabelas automaticamente)
docker-compose up -d
```

✅ Isso vai:
- Criar container PostgreSQL
- Criar banco `syshub`
- Executar `database-schema.sql` automaticamente
- Criar todas as 12 tabelas
- Inserir dados iniciais

**Verificar se está rodando:**
```powershell
docker ps
```

### 3️⃣ **Rodar Backend + Frontend**

```powershell
# Um único comando roda os dois!
npm run dev
```

✅ Isso inicia:
- Backend em `http://localhost:3001`
- Frontend em `http://localhost:5173`

---

## 📋 Scripts NPM Disponíveis

```powershell
npm run dev          # Roda backend + frontend juntos
npm run dev:backend  # Roda só o backend
npm run dev:frontend # Roda só o frontend
npm run dev:db       # Sobe o PostgreSQL
npm run dev:all      # Sobe DB + backend + frontend
```

---

## 🗄️ Banco de Dados

### Conexão Automática

O Docker Compose já configura tudo:
- **Host:** localhost
- **Porta:** 5432
- **Database:** syshub
- **User:** postgres
- **Password:** syshub2024

### Verificar Tabelas

```powershell
# Acessar PostgreSQL
docker exec -it syshub_postgres psql -U postgres -d syshub

# Listar tabelas
\dt

# Ver dados dos sistemas
SELECT * FROM systems;

# Sair
\q
```

### Recriar Banco (se necessário)

```powershell
# Parar container
docker-compose down

# Remover volume (apaga dados)
docker volume rm syshub-ai_postgres_data

# Subir novamente (recria tudo)
docker-compose up -d
```

---

## 🔧 Variáveis de Ambiente

### Frontend (.env na raiz)
```env
VITE_API_URL=http://localhost:3001/api
VITE_N8N_WEBHOOK_URL=
```

### Backend (backend/.env)
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=syshub
DB_USER=postgres
DB_PASSWORD=syshub2024

PORT=3001
JWT_SECRET=syshub_super_secret_key_change_in_production_2024
CORS_ORIGIN=http://localhost:5173
```

---

## 🧪 Testar API

### 1. Criar Usuário
```powershell
curl -X POST http://localhost:3001/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"admin@test.com\",\"password\":\"123456\",\"fullName\":\"Admin\"}'
```

### 2. Fazer Login
```powershell
curl -X POST http://localhost:3001/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"admin@test.com\",\"password\":\"123456\"}'
```

### 3. Listar Sistemas
```powershell
# Copie o token do login
curl http://localhost:3001/api/systems `
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

---

## 📁 Estrutura de Arquivos

```
syshub-ai/
├── docker-compose.yml       ✅ NOVO! Configuração Docker
├── database-schema.sql      ✅ NOVO! SQL limpo sem erros
├── package.json             ✅ Atualizado com scripts
├── .env                     ✅ Frontend config
│
├── backend/
│   ├── .env                 ✅ Backend config
│   ├── src/                 ✅ Código API
│   └── package.json         ✅ Dependências
│
└── src/                     ✅ Frontend React
```

---

## 🐛 Troubleshooting

### Erro: "Port 5432 already in use"

Você já tem outro PostgreSQL rodando:

**Opção 1:** Parar seu PostgreSQL atual
```powershell
# Se for serviço Windows
Stop-Service postgresql-x64-15

# Ou parar container antigo
docker stop docker_iagente
```

**Opção 2:** Usar porta diferente no docker-compose.yml
```yaml
ports:
  - "5433:5432"  # Muda para 5433
```

E atualizar `backend/.env`:
```env
DB_PORT=5433
```

### Backend não conecta no PostgreSQL

```powershell
# Ver logs do container
docker logs syshub_postgres

# Verificar se está rodando
docker ps | grep syshub

# Testar conexão
docker exec -it syshub_postgres psql -U postgres -d syshub -c "SELECT 1"
```

### Tabelas não foram criadas

```powershell
# Executar SQL manualmente
docker exec -i syshub_postgres psql -U postgres -d syshub < database-schema.sql
```

### Frontend não conecta no Backend

1. Verificar se backend está rodando: http://localhost:3001/health
2. Conferir `VITE_API_URL` no `.env`
3. Verificar CORS no `backend/.env`

---

## 🔥 Comandos Úteis

### Docker

```powershell
# Subir containers
docker-compose up -d

# Ver logs em tempo real
docker-compose logs -f

# Parar containers
docker-compose down

# Restart
docker-compose restart

# Remover tudo (incluindo dados)
docker-compose down -v
```

### Desenvolvimento

```powershell
# Instalar tudo
npm install && cd backend && npm install && cd ..

# Rodar tudo
npm run dev

# Build frontend
npm run build

# Build backend
cd backend && npm run build
```

### Banco de Dados

```powershell
# Backup
docker exec syshub_postgres pg_dump -U postgres syshub > backup.sql

# Restaurar
docker exec -i syshub_postgres psql -U postgres syshub < backup.sql

# Reset completo
docker-compose down -v && docker-compose up -d
```

---

## ✅ Checklist de Setup

- [ ] Node.js instalado
- [ ] Docker Desktop rodando
- [ ] `npm install` na raiz
- [ ] `npm install` no backend
- [ ] `docker-compose up -d` executado
- [ ] Tabelas criadas (verificar com `\dt`)
- [ ] Backend rodando em 3001
- [ ] Frontend rodando em 5173
- [ ] Consegue fazer login na API

---

## 🎉 Pronto!

Agora você tem:
- ✅ PostgreSQL rodando no Docker
- ✅ 12 tabelas criadas automaticamente
- ✅ Backend API funcionando
- ✅ Frontend React funcionando
- ✅ Um único comando para rodar tudo: `npm run dev`

**Próximos passos:**
1. Abrir http://localhost:5173
2. Criar sua conta
3. Começar a usar! 🚀
