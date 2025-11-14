# 🚀 SysHub AI Backend

API REST em Node.js + TypeScript + PostgreSQL para a Central de Sistemas com IA.

## 📦 Tecnologias

- **Node.js** - Runtime JavaScript
- **TypeScript** - Tipagem estática
- **Express** - Framework web
- **PostgreSQL** - Banco de dados
- **JWT** - Autenticação
- **Zod** - Validação de schemas
- **Helmet** - Segurança HTTP
- **Morgan** - Logger HTTP

## 🏗️ Estrutura

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts        # Conexão PostgreSQL
│   ├── middleware/
│   │   └── auth.middleware.ts # Autenticação JWT
│   ├── routes/
│   │   ├── auth.routes.ts     # Login/registro
│   │   ├── systems.routes.ts  # Sistemas
│   │   ├── queries.routes.ts  # Queries
│   │   ├── conversations.routes.ts  # Conversas
│   │   └── users.routes.ts    # Usuários
│   └── server.ts              # Servidor principal
├── database/
│   └── schema.sql             # Schema completo
├── package.json
├── tsconfig.json
└── .env
```

## ⚙️ Instalação

```bash
npm install
```

## 🗄️ Configurar Banco de Dados

Execute o schema SQL no PostgreSQL:

```bash
docker exec -i docker_iagente psql -U postgres -d docker < database/schema.sql
```

## 🔧 Configuração

Crie o arquivo `.env`:

```env
DB_HOST=docker_iagente
DB_PORT=5432
DB_NAME=docker
DB_USER=postgres
DB_PASSWORD=sua_senha

PORT=3001
NODE_ENV=development

JWT_SECRET=sua_chave_secreta_aqui
JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:5173
```

## 🚀 Execução

### Desenvolvimento (com hot reload)
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Produção
```bash
npm start
```

## 📡 Endpoints

### Autenticação
- `POST /api/auth/register` - Criar conta
- `POST /api/auth/login` - Login
- `POST /api/auth/verify` - Verificar token

### Sistemas
- `GET /api/systems` - Listar sistemas
- `GET /api/systems/:id` - Buscar por ID
- `GET /api/systems/slug/:slug` - Buscar por slug
- `POST /api/systems` - Criar (admin)
- `PUT /api/systems/:id` - Atualizar (admin)
- `DELETE /api/systems/:id` - Desativar (admin)

### Queries
- `POST /api/queries` - Criar query
- `GET /api/queries` - Listar queries do usuário
- `GET /api/queries/:id` - Buscar query específica
- `PUT /api/queries/:id` - Atualizar query
- `POST /api/queries/:id/favorite` - Favoritar
- `DELETE /api/queries/:id` - Deletar

### Conversas
- `POST /api/conversations` - Criar conversa
- `GET /api/conversations` - Listar conversas
- `GET /api/conversations/:id` - Buscar conversa
- `POST /api/conversations/:id/messages` - Adicionar mensagem

### Usuários
- `GET /api/users/me` - Perfil do usuário
- `GET /api/users/me/stats` - Estatísticas
- `PUT /api/users/me` - Atualizar perfil

## 🔒 Autenticação

Todas as rotas (exceto `/auth/register` e `/auth/login`) requerem token JWT no header:

```
Authorization: Bearer SEU_TOKEN_AQUI
```

## 🧪 Testar API

### Criar usuário
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456","fullName":"Test User"}'
```

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'
```

### Listar sistemas (com token)
```bash
curl http://localhost:3001/api/systems \
  -H "Authorization: Bearer SEU_TOKEN"
```

## 📊 Health Check

```bash
curl http://localhost:3001/health
```

## 🛠️ Scripts

```json
{
  "dev": "tsx watch src/server.ts",      // Desenvolvimento
  "build": "tsc",                         // Build
  "start": "node dist/server.js"          // Produção
}
```

## 📝 Logs

O backend usa Morgan para logging HTTP. No console você verá:

```
GET /api/systems 200 45.234 ms - 1523
POST /api/auth/login 200 123.456 ms - 345
```

## 🔐 Segurança

- Helmet para headers de segurança
- CORS configurável
- JWT com expiração
- Senhas com bcrypt (10 rounds)
- Validação de inputs com Zod

## 🐛 Debug

### Erro de conexão PostgreSQL
```bash
# Verificar se container está rodando
docker ps | grep docker_iagente

# Ver logs
docker logs docker_iagente
```

### Ver tabelas criadas
```sql
docker exec -it docker_iagente psql -U postgres -d docker
\dt
```

---

**Desenvolvido para SysHub AI** 🚀
