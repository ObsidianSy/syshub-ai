# 🚀 SysHub AI - Central de Sistemas Inteligente

> Sistema de chat com IA para consultar múltiplos sistemas através de linguagem natural

## 📋 Sobre o Projeto

**SysHub AI** é uma plataforma que centraliza o acesso a diferentes sistemas empresariais através de um agente de IA. Os usuários fazem perguntas em linguagem natural e o agente identifica qual sistema consultar e retorna as informações necessárias.

### ✨ Características

- 🤖 **Agente IA** - Processa perguntas em linguagem natural
- 🖥️ **Multi-sistemas** - Conecta em múltiplos sistemas simultaneamente
- 💬 **Conversas** - Mantém contexto de conversas anteriores
- ⭐ **Favoritos** - Salve queries importantes
- 📊 **Estatísticas** - Dashboard com métricas de uso
- 🔐 **Autenticação** - Sistema completo de login/registro
- 📱 **Responsivo** - Interface adaptável para mobile

## 🛠️ Tecnologias

### Frontend
- React 18 + TypeScript
- Vite
- TailwindCSS + Shadcn/ui
- React Query
- React Router

### Backend
- Node.js + TypeScript
- Express.js
- PostgreSQL
- JWT Authentication
- Zod (validação)

## ⚡ Quick Start

### 1. Criar Banco de Dados
```powershell
docker exec -i docker_iagente psql -U postgres -d docker < CREATE_TABLES.sql
```

### 2. Backend
```powershell
cd backend
npm install
npm run dev
```

### 3. Frontend
```powershell
npm install
npm run dev
```

## 📚 Documentação

- **[QUICKSTART.md](QUICKSTART.md)** - Início rápido (3 passos)
- **[SETUP.md](SETUP.md)** - Guia completo de instalação
- **[BACKEND_COMPLETO.md](BACKEND_COMPLETO.md)** - Documentação do backend
- **[backend/README.md](backend/README.md)** - API endpoints

## 🗄️ Estrutura do Banco

O sistema possui **12 tabelas PostgreSQL**:

- `users` - Usuários autenticados
- `systems` - Sistemas disponíveis
- `queries` - Perguntas e respostas
- `conversations` - Conversas contínuas
- `conversation_messages` - Mensagens
- `query_history` - Auditoria
- `system_logs` - Logs de acesso
- `system_documentation` - Docs técnicas
- `favorites` - Favoritos dos usuários
- `notifications` - Notificações
- `agent_config` - Config do agente IA
- `api_keys` - Chaves de integração

## 🔧 Configuração

### Backend (.env em `backend/`)
```env
DB_HOST=docker_iagente
DB_PORT=5432
DB_NAME=docker
DB_USER=postgres
DB_PASSWORD=sua_senha

PORT=3001
JWT_SECRET=sua_chave_secreta
CORS_ORIGIN=http://localhost:5173
```

### Frontend (.env na raiz)
```env
VITE_API_URL=http://localhost:3001/api
VITE_N8N_WEBHOOK_URL=
```

## 🌐 API Endpoints

### Autenticação
- `POST /api/auth/register` - Criar conta
- `POST /api/auth/login` - Login
- `POST /api/auth/verify` - Verificar token

### Sistemas
- `GET /api/systems` - Listar sistemas
- `GET /api/systems/:id` - Buscar por ID
- `POST /api/systems` - Criar (admin)

### Queries
- `POST /api/queries` - Criar query
- `GET /api/queries` - Listar queries
- `POST /api/queries/:id/favorite` - Favoritar

### Conversas
- `POST /api/conversations` - Nova conversa
- `POST /api/conversations/:id/messages` - Enviar mensagem

[Ver documentação completa da API](backend/README.md)

## 🤖 Integração com N8N

O sistema pode se integrar com N8N para processamento de IA:

1. Configure um workflow no N8N
2. Adicione a URL do webhook no `.env`
3. O agente enviará as queries para processamento

## 📊 Funcionalidades

- ✅ Login/Registro com JWT
- ✅ CRUD de sistemas
- ✅ Criar e gerenciar queries
- ✅ Conversas com histórico
- ✅ Sistema de favoritos
- ✅ Estatísticas de uso
- ✅ Auditoria de ações
- ✅ Notificações
- ✅ Documentação de sistemas
- ✅ API Keys para integrações

## 🧪 Testar API

```bash
# Criar usuário
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456","fullName":"Test"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'

# Listar sistemas (com token)
curl http://localhost:3001/api/systems \
  -H "Authorization: Bearer SEU_TOKEN"
```

## 📁 Estrutura do Projeto

```
syshub-ai/
├── backend/              # API Node.js
│   ├── src/
│   │   ├── config/      # Configurações
│   │   ├── middleware/  # Auth, etc
│   │   ├── routes/      # Rotas API
│   │   └── server.ts    # Servidor
│   └── database/
│       └── schema.sql   # Schema SQL
├── src/                  # Frontend React
│   ├── components/      # Componentes UI
│   ├── services/        # API services
│   ├── types/           # TypeScript types
│   └── pages/           # Páginas
├── CREATE_TABLES.sql     # SQL completo
└── *.md                  # Documentação
```

## 🔒 Segurança

- Autenticação JWT
- Senhas com bcrypt
- Helmet (security headers)
- CORS configurável
- Validação de inputs
- Role-based access control

## 🐛 Troubleshooting

Ver [SETUP.md](SETUP.md) seção "Troubleshooting"

## 📝 Licença

Este projeto é privado.

## 🤝 Contribuindo

1. Clone o repositório
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Add nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

---

**Desenvolvido com ❤️ para ObsidianSy**
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/4720e6f8-fbcd-4e30-9ad7-504c2b85a6ea) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
