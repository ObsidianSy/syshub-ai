# =====================================================
# SYSHUB AI - DOCKERFILE MULTI-STAGE PARA PRODUÇÃO
# =====================================================

# ================== STAGE 1: Backend Build ==================
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend

# Instalar dependências de build para better-sqlite3
RUN apk add --no-cache python3 make g++ gcc

# Copiar package files do backend
COPY backend/package*.json ./

# Instalar dependências (incluindo devDependencies para build)
RUN npm ci

# Copiar código do backend
COPY backend/ ./

# Compilar TypeScript
RUN npm run build

# ================== STAGE 2: Frontend Build ==================
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copiar package files do frontend
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar código do frontend
COPY . ./

# Build do frontend (Vite)
RUN npm run build

# ================== STAGE 3: Production Runtime ==================
FROM node:20-alpine

WORKDIR /app

# Instalar dependências runtime para better-sqlite3
RUN apk add --no-cache tini curl

# Copiar backend compilado
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder /app/backend/package.json ./backend/

# Copiar schema do banco SQLite
COPY --from=backend-builder /app/backend/database ./backend/database

# Copiar frontend buildado
COPY --from=frontend-builder /app/dist ./frontend/dist

# Criar diretório para o banco de dados SQLite (fallback)
RUN mkdir -p /app/backend/data

# Variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3001

# Healthcheck - verificar se o servidor está respondendo
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Expor porta interna 3001 (Easypanel mapeará domínio → 3001)
EXPOSE 3001

# Usar tini para gerenciar processos
ENTRYPOINT ["/sbin/tini", "--"]

# Comando para rodar o backend
# Se DB_HOST estiver definido, usa PostgreSQL (server.js)
# Caso contrário, usa SQLite (server-sqlite.js)
CMD ["sh", "-c", "if [ -n \"$DB_HOST\" ]; then node backend/dist/server.js; else node backend/dist/server-sqlite.js; fi"]
