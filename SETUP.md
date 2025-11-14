# 🚀 SysHub AI - Setup Completo

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Estrutura do Projeto](#estrutura-do-projeto)
3. [Configuração do Banco de Dados](#configuração-do-banco-de-dados)
4. [Instalação do Backend](#instalação-do-backend)
5. [Instalação do Frontend](#instalação-do-frontend)
6. [Executando o Projeto](#executando-o-projeto)
7. [API Endpoints](#api-endpoints)
8. [Integração com N8N](#integração-com-n8n)

---

## 🎯 Visão Geral

**SysHub AI** é uma Central de Sistemas Inteligente que permite aos usuários fazer perguntas em linguagem natural sobre múltiplos sistemas e receber respostas processadas por um agente de IA.

### Tecnologias Utilizadas

**Backend:**
- Node.js + TypeScript
- Express.js
- PostgreSQL (Docker)
- JWT Authentication
- Zod (validação)

**Frontend:**
- React + TypeScript
- Vite
- TailwindCSS + Shadcn/ui
- React Query
- React Router

---

## 📁 Estrutura do Projeto

```
syshub-ai/
├── backend/                 # API REST Node.js
│   ├── src/
│   │   ├── config/         # Configurações (database, etc)
│   │   ├── middleware/     # Middlewares (auth, etc)
│   │   ├── routes/         # Rotas da API
│   │   └── server.ts       # Servidor principal
│   ├── database/
│   │   └── schema.sql      # Schema completo do banco
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
├── src/                     # Frontend React
│   ├── components/         # Componentes React
│   ├── services/           # Services para API
│   ├── pages/              # Páginas
│   └── lib/                # Utilitários
├── .env                     # Variáveis frontend
└── package.json
```

---

## 🗄️ Configuração do Banco de Dados

### 1. Verificar PostgreSQL Docker

Seu PostgreSQL já está rodando no Docker. Verifique se está ativo:

```powershell
docker ps
```

### 2. Criar Banco de Dados (se necessário)

Se quiser criar um banco específico para o projeto:

```powershell
docker exec -it docker_iagente psql -U postgres
```

No prompt do PostgreSQL:
```sql
CREATE DATABASE syshub;
\c syshub
```

### 3. Executar Schema SQL

**IMPORTANTE:** Execute o arquivo `backend/database/schema.sql` para criar todas as tabelas:

```powershell
# No diretório raiz do projeto
docker exec -i docker_iagente psql -U postgres -d docker < backend/database/schema.sql
```

OU se criou um banco separado:

```powershell
docker exec -i docker_iagente psql -U postgres -d syshub < backend/database/schema.sql
```

Este comando criará:
- ✅ 12 tabelas (users, systems, queries, conversations, etc)
- ✅ Índices para performance
- ✅ Triggers automáticos
- ✅ Views úteis
- ✅ Dados iniciais (6 sistemas mockados)

---

## ⚙️ Instalação do Backend

### 1. Navegar para pasta backend

```powershell
cd backend
```

### 2. Instalar dependências

```powershell
npm install
```

### 3. Configurar .env

O arquivo `backend/.env` já está configurado com suas credenciais do Docker:

```env
DB_HOST=docker_iagente
DB_PORT=5432
DB_NAME=docker
DB_USER=postgres
DB_PASSWORD=1f038611d68fcd99a319

PORT=3001
NODE_ENV=development

JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_please
JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:5173
```

**⚠️ IMPORTANTE:** Troque o `JWT_SECRET` por uma chave segura em produção!

### 4. Testar conexão com banco

```powershell
npm run dev
```

Se tudo estiver correto, você verá:
```
✅ Conexão com PostgreSQL estabelecida
🚀 Servidor rodando na porta 3001
```

---

## 🎨 Instalação do Frontend

### 1. Voltar para raiz do projeto

```powershell
cd ..
```

### 2. Instalar dependências

```powershell
npm install
```

### 3. Verificar .env

O arquivo `.env` na raiz já está configurado:

```env
# PostgreSQL Docker Configuration
DB_HOST=docker_iagente
DB_PORT=5432
DB_NAME=docker
DB_USER=postgres
DB_PASSWORD=1f038611d68fcd99a319

# Frontend Configuration
VITE_API_URL=http://localhost:3001/api
VITE_N8N_WEBHOOK_URL=
```

---

## 🚀 Executando o Projeto

### Terminal 1: Backend

```powershell
cd backend
npm run dev
```

Servidor rodando em: `http://localhost:3001`
Health check: `http://localhost:3001/health`

### Terminal 2: Frontend

```powershell
# Na raiz do projeto
npm run dev
```

Frontend rodando em: `http://localhost:5173`

---

## 📡 API Endpoints

### Autenticação

```
POST   /api/auth/register      # Criar conta
POST   /api/auth/login         # Login
POST   /api/auth/verify        # Verificar token
```

### Sistemas

```
GET    /api/systems            # Listar sistemas
GET    /api/systems/:id        # Buscar por ID
GET    /api/systems/slug/:slug # Buscar por slug
GET    /api/systems/:id/stats  # Estatísticas
POST   /api/systems            # Criar (admin)
PUT    /api/systems/:id        # Atualizar (admin)
DELETE /api/systems/:id        # Desativar (admin)
```

### Queries (Perguntas)

```
POST   /api/queries                 # Criar query
GET    /api/queries                 # Listar queries
GET    /api/queries/:id             # Buscar query
PUT    /api/queries/:id             # Atualizar resposta
POST   /api/queries/:id/favorite    # Favoritar
DELETE /api/queries/:id             # Deletar
GET    /api/queries/stats/overview  # Estatísticas
```

### Conversas

```
POST   /api/conversations                    # Criar conversa
GET    /api/conversations                    # Listar conversas
GET    /api/conversations/:id                # Buscar conversa
POST   /api/conversations/:id/messages       # Adicionar mensagem
PUT    /api/conversations/:id                # Atualizar
DELETE /api/conversations/:id                # Deletar
```

### Usuários

```
GET    /api/users/me          # Perfil do usuário
GET    /api/users/me/stats    # Estatísticas
GET    /api/users/me/activity # Atividade recente
PUT    /api/users/me          # Atualizar perfil
```

---

## 🤖 Integração com N8N

### Como funciona

1. Usuário faz uma pergunta no frontend
2. Frontend envia para o backend
3. Backend pode enviar para N8N webhook (opcional)
4. N8N processa com IA e retorna resposta
5. Backend salva resposta no banco
6. Frontend exibe para usuário

### Configurar Webhook N8N

1. Crie um workflow no N8N
2. Adicione um nó Webhook
3. Copie a URL do webhook
4. Cole no `.env`:

```env
VITE_N8N_WEBHOOK_URL=https://seu-n8n.com/webhook/seu-id
```

### Payload enviado para N8N

```json
{
  "user_question": "Qual o estoque de produtos?",
  "available_systems": [
    {
      "id": "...",
      "name": "Opus One – Estoque",
      "slug": "opus-one-estoque",
      "category": "Estoque",
      "status": "online"
    }
  ],
  "conversation_history": [],
  "metadata": {
    "source": "Central de Sistemas",
    "ui_version": "v1"
  }
}
```

### Resposta esperada do N8N

```json
{
  "answer": "O sistema possui 1.234 produtos em estoque...",
  "system_used": "Opus One – Estoque",
  "confidence": 0.95,
  "metadata": {}
}
```

---

## 🔐 Autenticação

### Criar primeiro usuário

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@syshub.com",
    "password": "senha123",
    "fullName": "Administrador"
  }'
```

Resposta:
```json
{
  "user": {
    "id": "...",
    "email": "admin@syshub.com",
    "fullName": "Administrador",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Usar token nas requisições

```bash
curl -X GET http://localhost:3001/api/systems \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

---

## 📊 Estrutura do Banco de Dados

### Tabelas Principais

1. **users** - Usuários do sistema
2. **systems** - Sistemas disponíveis para consulta
3. **queries** - Perguntas feitas pelos usuários
4. **conversations** - Conversas com o agente
5. **conversation_messages** - Mensagens das conversas
6. **query_history** - Histórico de ações nas queries
7. **system_logs** - Logs de acesso aos sistemas
8. **system_documentation** - Documentação dos sistemas
9. **favorites** - Favoritos dos usuários
10. **notifications** - Notificações do sistema
11. **agent_config** - Configuração do agente IA
12. **api_keys** - Chaves de API para integração

### Views (Relatórios)

- `system_query_stats` - Estatísticas de queries por sistema
- `user_activity` - Atividade recente dos usuários

---

## 🛠️ Scripts Úteis

### Backend

```powershell
cd backend
npm run dev      # Desenvolvimento com hot reload
npm run build    # Build para produção
npm run start    # Executar build de produção
```

### Frontend

```powershell
npm run dev      # Desenvolvimento
npm run build    # Build para produção
npm run preview  # Preview do build
```

### Database

```powershell
# Backup do banco
docker exec docker_iagente pg_dump -U postgres docker > backup.sql

# Restaurar backup
docker exec -i docker_iagente psql -U postgres docker < backup.sql

# Acessar PostgreSQL
docker exec -it docker_iagente psql -U postgres -d docker
```

---

## 🐛 Troubleshooting

### Backend não conecta no PostgreSQL

```powershell
# Verificar se o container está rodando
docker ps

# Ver logs do PostgreSQL
docker logs docker_iagente

# Testar conexão manual
docker exec -it docker_iagente psql -U postgres
```

### Frontend não conecta no Backend

1. Verificar se backend está rodando na porta 3001
2. Conferir variável `VITE_API_URL` no `.env`
3. Verificar CORS no backend

### Erro "table does not exist"

Execute novamente o schema SQL:
```powershell
docker exec -i docker_iagente psql -U postgres -d docker < backend/database/schema.sql
```

---

## 📝 Próximos Passos

1. ✅ Banco de dados configurado
2. ✅ Backend funcionando
3. ✅ Frontend funcionando
4. ⏳ Integrar com N8N (opcional)
5. ⏳ Adicionar mais funcionalidades
6. ⏳ Deploy em produção

---

## 📞 Suporte

Se tiver dúvidas:
1. Verifique os logs do backend e frontend
2. Confira se todas as tabelas foram criadas
3. Teste os endpoints manualmente com curl/Postman

**Bom desenvolvimento! 🚀**
