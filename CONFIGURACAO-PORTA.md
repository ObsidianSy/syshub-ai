# 🔧 Configuração de Porta no Easypanel

## ✅ Correções Aplicadas

### 1. Backend agora serve o Frontend
- ✅ Frontend buildado é servido como arquivos estáticos
- ✅ SPA fallback configurado (todas rotas → index.html)
- ✅ CORS aberto para produção

### 2. Porta alterada para 80
- ✅ PORT=80 (padrão web)
- ✅ EXPOSE 80 no Dockerfile
- ✅ Healthcheck atualizado

---

## 🔧 Configuração no Easypanel

### Opção 1: Se o Easypanel usa Traefik/Nginx (Recomendado)

**No painel do Easypanel:**

1. Vá em **nexushub** → **Domains**
2. Configure o domínio (ex: nexushub.seudominio.com)
3. Em **Port**, coloque: **80**
4. Salvar e aguardar

### Opção 2: Configurar manualmente a porta

Se o Easypanel permite configurar a variável de ambiente:

1. **nexushub** → **Environment Variables**
2. Adicione/edite:
   ```
   PORT=80
   ```
3. **Redeploy**

---

## 📊 Como Funciona Agora

```
Usuário → https://seu-dominio.com
         ↓
    [Traefik/Nginx do Easypanel]
         ↓
    Container na porta 80
         ↓
    ┌─────────────────────┐
    │  Express Server     │
    │  Porta: 80          │
    ├─────────────────────┤
    │ /api/*    → Backend │
    │ /*        → Frontend│
    └─────────────────────┘
```

### Rotas:
- `https://seu-dominio.com/` → **Frontend React**
- `https://seu-dominio.com/api/health` → **Backend API**
- `https://seu-dominio.com/api/auth/login` → **Backend API**

---

## 🔍 Verificação

### 1. Deploy bem-sucedido
```
✅ Backend started successfully on port 80
✅ Frontend assets served from /app/frontend/dist
✅ SQLite database initialized
```

### 2. Teste de Health
```bash
curl https://seu-dominio.com/api/health
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "timestamp": "2024-...",
  "database": "SQLite (development)"
}
```

### 3. Frontend carregando
Acesse `https://seu-dominio.com` no navegador:
- ✅ Deve carregar a interface do SysHub
- ✅ Sem erro "Service is not reachable"

---

## 🆘 Se ainda não funcionar

### Problema: "Service is not reachable"

#### Solução 1: Verificar configuração de porta no Easypanel
1. **nexushub** → **Settings** → **Port**
2. Certifique-se que está configurado para **80**
3. Se tiver um campo "Internal Port", coloque **80** também

#### Solução 2: Verificar logs
1. **nexushub** → **Logs**
2. Procure por:
   ```
   ✅ Servidor rodando na porta 80
   ```
3. Se ver porta diferente, ajuste a variável PORT

#### Solução 3: Verificar domínio
1. **nexushub** → **Domains**
2. Certifique-se que o domínio está configurado
3. Se usar subdomínio, verifique o DNS

---

## 🎯 Alternativa: Se Easypanel força porta específica

Alguns painéis como Coolify/Dokku forçam porta 3000 ou 8080.

**Nesse caso, ajuste no Easypanel:**

1. Encontre a configuração de **Internal Port** ou **Container Port**
2. Configure para **3000** ou **8080** (o que o painel usar)
3. Atualize a variável de ambiente:
   ```
   PORT=3000  (ou 8080)
   ```
4. Redeploy

---

## ✅ Status Atual

- [x] Dockerfile atualizado (porta 80)
- [x] Backend serve frontend estático
- [x] SPA fallback configurado
- [x] CORS aberto para produção
- [x] Commit e push realizados
- [ ] Aguardar deploy no Easypanel
- [ ] Configurar porta no painel
- [ ] Testar acesso via domínio

---

## 📝 Commit

**Hash**: `b93dd22`  
**Mensagem**: "fix: Serve frontend static files and change default port to 80"

Deploy automático deve estar rodando agora! 🚀

---

## 🎨 Estrutura Final

```
Container (porta 80)
├── GET /               → Frontend (React SPA)
├── GET /login          → Frontend (React Router)
├── GET /admin/users    → Frontend (React Router)
├── GET /api/health     → Backend API
├── POST /api/auth/login → Backend API
├── GET /api/systems    → Backend API
└── POST /api/queries   → Backend API
```

**Tudo em um único container, uma única porta!** ✨
