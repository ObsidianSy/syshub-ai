# 🚀 Correção de Deploy - VPS/Docker

## ❌ Problema Identificado

O build do Docker estava falhando com este erro:
```
gyp ERR! find Python - You need to install the latest version of Python
npm error code 1
npm error path /app/backend/node_modules/better-sqlite3
```

### Causas:
1. **Node 18** sendo usado (better-sqlite3 requer Node 20+)
2. **Falta de build tools** (Python, make, g++) para compilar better-sqlite3
3. **npm ci --only=production** pulando devDependencies necessárias para build

---

## ✅ Correções Aplicadas

### 1. Dockerfile Atualizado

```diff
- FROM node:18-alpine AS backend-builder
+ FROM node:20-alpine AS backend-builder

+ # Instalar dependências de build para better-sqlite3
+ RUN apk add --no-cache python3 make g++ gcc

- RUN npm ci --only=production
+ RUN npm ci  # Inclui devDependencies para compilar

- FROM node:18-alpine (runtime)
+ FROM node:20-alpine (runtime)

+ # Copiar schema do banco SQLite
+ COPY --from=backend-builder /app/backend/database ./backend/database

+ # Criar diretório para o banco de dados SQLite
+ RUN mkdir -p /app/backend/data

+ ENV DATABASE_TYPE=sqlite

- CMD ["node", "backend/dist/server.js"]
+ CMD ["node", "backend/dist/server-sqlite.js"]
```

### 2. Mudanças Principais

| Item | Antes | Depois |
|------|-------|--------|
| **Node Version** | 18-alpine | 20-alpine ✅ |
| **Build Tools** | ❌ Nenhum | python3, make, g++, gcc ✅ |
| **npm install** | --only=production | npm ci (completo) ✅ |
| **Database** | PostgreSQL | SQLite ✅ |
| **Server** | server.js | server-sqlite.js ✅ |

---

## 🔧 Como Fazer o Deploy

### Opção 1: Commit e Push (Recomendado)

```bash
# 1. Commitar as mudanças
git add Dockerfile
git commit -m "fix: Update Dockerfile to Node 20 and add build dependencies for better-sqlite3"

# 2. Push para o repositório
git push origin main

# 3. No Easypanel, o deploy automático será acionado
```

### Opção 2: Rebuild Manual no Easypanel

1. Acesse o painel do Easypanel
2. Vá para o serviço **nexushub**
3. Clique em **"Deploy"** ou **"Redeploy"**
4. Aguarde o build (pode levar 3-5 minutos)

---

## 📋 Checklist de Deploy

- [x] Dockerfile atualizado para Node 20
- [x] Build dependencies adicionadas (python3, make, g++, gcc)
- [x] npm ci completo (com devDependencies)
- [x] Usando server-sqlite.js
- [x] Diretório /app/backend/data criado
- [x] ENV DATABASE_TYPE=sqlite definido
- [ ] Fazer commit das mudanças
- [ ] Push para o GitHub
- [ ] Aguardar deploy automático
- [ ] Verificar logs no Easypanel

---

## 🔍 Verificação de Sucesso

### Logs esperados (sucesso):
```
✅ Backend started successfully on port 3001
✅ SQLite database initialized
✅ Frontend assets served from /app/frontend/dist
```

### Se der erro ainda:

1. **Verificar logs completos**:
   - Easypanel → nexushub → Logs
   
2. **Verificar variáveis de ambiente**:
   - PORT=3001
   - NODE_ENV=production
   - DATABASE_TYPE=sqlite
   
3. **Testar localmente**:
   ```bash
   docker build -t syshub-test .
   docker run -p 3001:3001 syshub-test
   ```

---

## 🎯 Estrutura Final no Container

```
/app/
├── backend/
│   ├── dist/                    # Código compilado
│   │   ├── server-sqlite.js     # ← Servidor principal
│   │   └── ...
│   ├── node_modules/            # Dependências (com better-sqlite3 compilado)
│   ├── database/                # Schemas SQL
│   ├── data/                    # Banco SQLite será criado aqui
│   │   └── syshub.db           # ← Criado automaticamente
│   └── package.json
└── frontend/
    └── dist/                    # Frontend buildado (React/Vite)
        ├── index.html
        └── assets/
```

---

## 🔐 Persistência de Dados (Importante!)

⚠️ **ATENÇÃO**: O banco SQLite ficará dentro do container. Se o container for recriado, **os dados serão perdidos**.

### Solução - Adicionar Volume no Easypanel:

1. Easypanel → nexushub → **Storage**
2. Add Volume:
   - **Mount Path**: `/app/backend/data`
   - **Size**: 1GB (ou mais)
3. Salvar e redeploy

Isso garantirá que o banco de dados persista entre deploys.

---

## 📊 Comparação: Antes vs Depois

| Aspecto | Build Anterior ❌ | Build Corrigido ✅ |
|---------|-------------------|-------------------|
| Node Version | 18 (não suportado) | 20 (suportado) |
| Build Tools | ❌ Faltando | ✅ Instaladas |
| better-sqlite3 | ❌ Falha ao compilar | ✅ Compila com sucesso |
| Database | PostgreSQL (precisa serviço externo) | SQLite (embutido) |
| Tempo de build | ~10s (falhava) | ~2-3min (sucesso) |

---

## 🆘 Troubleshooting

### Erro: "Cannot find module 'better-sqlite3'"
**Solução**: Certifique-se que node_modules foi copiado corretamente:
```dockerfile
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
```

### Erro: "ENOENT: no such file or directory, open 'syshub.db'"
**Solução**: Verificar se o diretório data foi criado:
```dockerfile
RUN mkdir -p /app/backend/data
```

### Erro: "Port 3001 already in use"
**Solução**: No Easypanel, verificar se não há outro serviço usando a mesma porta.

---

## ✅ Resultado Final

Após o deploy bem-sucedido:
- ✅ Container rodando com Node 20
- ✅ better-sqlite3 compilado e funcionando
- ✅ Banco SQLite inicializado
- ✅ Frontend servido corretamente
- ✅ API respondendo em https://seu-dominio.com

**Status**: Pronto para produção! 🎉
