# 🚀 GUIA RÁPIDO DE INICIALIZAÇÃO

## ⚠️ IMPORTANTE: Pré-requisitos

Antes de iniciar, certifique-se que você tem:

1. **Docker Desktop** instalado E RODANDO
   - [Download aqui](https://www.docker.com/products/docker-desktop/)
   - **ABRA O DOCKER DESKTOP ANTES DE CONTINUAR!**
   - Aguarde o ícone ficar verde na barra de tarefas

2. **Node.js 18+** instalado
   - Verifique: `node --version`

---

## 🎯 SETUP INICIAL (primeira vez)

### Opção 1: Automático (Recomendado)
```powershell
.\setup.bat
```

### Opção 2: Manual
```powershell
# 1. Instalar dependências
npm install
cd backend
npm install
cd ..

# 2. ABRIR DOCKER DESKTOP (se ainda não abriu)

# 3. Iniciar PostgreSQL
docker-compose up -d

# 4. Aguardar 10 segundos
Start-Sleep -Seconds 10
```

---

## 🏃 RODAR O PROJETO

```powershell
npm run dev
```

Isso inicia:
- ✅ Backend na porta 3001
- ✅ Frontend na porta 5173

---

## 🌐 ACESSAR

1. Abra: http://localhost:5173
2. **Crie uma conta**
3. Faça login
4. Comece a fazer perguntas!

---

## ✅ CHECKLIST

- [ ] Docker Desktop aberto e rodando?
- [ ] `docker ps` mostra `syshub_postgres`?
- [ ] Backend iniciou sem erros?
- [ ] Frontend carregou?
- [ ] Criou uma conta?

---

## 🐛 PROBLEMAS?

### Backend não conecta
```powershell
# Abrir Docker Desktop e aguardar
docker-compose up -d
npm run dev
```

### Porta 5432 em uso
```powershell
docker stop docker_iagente
docker-compose up -d
```

---

## 🔗 URLs

| Serviço | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:3001/api |
| Health | http://localhost:3001/health |

---

## 🤖 Webhook N8N (opcional)

Edite `.env`:
```env
VITE_N8N_WEBHOOK_URL=https://seu-n8n.com/webhook/syshub
```

---

**IMPORTANTE:** Sempre abra o Docker Desktop antes de rodar `npm run dev`!
