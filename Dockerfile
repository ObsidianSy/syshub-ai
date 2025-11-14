# =====================================================
# SYSHUB AI - DOCKERFILE MULTI-STAGE PARA PRODUÇÃO
# =====================================================

# ================== STAGE 1: Backend Build ==================
FROM node:18-alpine AS backend-builder

WORKDIR /app/backend

# Copiar package files do backend
COPY backend/package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código do backend
COPY backend/ ./

# Compilar TypeScript
RUN npm run build

# ================== STAGE 2: Frontend Build ==================
FROM node:18-alpine AS frontend-builder

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
FROM node:18-alpine

WORKDIR /app

# Instalar apenas dependências de produção
RUN apk add --no-cache tini curl

# Copiar backend compilado
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder /app/backend/package.json ./backend/

# Copiar frontend buildado
COPY --from=frontend-builder /app/dist ./frontend/dist

# Variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3001

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Expor porta do backend
EXPOSE 3001

# Usar tini para gerenciar processos
ENTRYPOINT ["/sbin/tini", "--"]

# Comando para rodar o backend
CMD ["node", "backend/dist/server.js"]
