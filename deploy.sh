#!/bin/bash
# =====================================================
# SYSHUB AI - SCRIPT DE DEPLOY PARA VPS
# =====================================================

set -e

echo "🚀 SYSHUB AI - Deploy para Produção"
echo "===================================="

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar se .env existe
if [ ! -f .env ]; then
    echo -e "${RED}❌ Arquivo .env não encontrado!${NC}"
    echo "Copie .env.production para .env e configure:"
    echo "  cp .env.production .env"
    echo "  nano .env"
    exit 1
fi

echo -e "${YELLOW}📦 Parando containers antigos...${NC}"
docker-compose -f docker-compose.prod.yml down

echo -e "${YELLOW}🏗️  Buildando imagens...${NC}"
docker-compose -f docker-compose.prod.yml build --no-cache

echo -e "${YELLOW}🚀 Iniciando containers...${NC}"
docker-compose -f docker-compose.prod.yml up -d

echo -e "${YELLOW}⏳ Aguardando services ficarem saudáveis...${NC}"
sleep 10

# Verificar status
echo -e "${YELLOW}📊 Status dos containers:${NC}"
docker-compose -f docker-compose.prod.yml ps

# Verificar logs
echo -e "${YELLOW}📋 Últimos logs:${NC}"
docker-compose -f docker-compose.prod.yml logs --tail=20

echo ""
echo -e "${GREEN}✅ Deploy concluído!${NC}"
echo ""
echo "🔗 URLs:"
echo "  Frontend: http://SEU_IP_VPS"
echo "  Backend:  http://SEU_IP_VPS:3001"
echo "  Health:   http://SEU_IP_VPS:3001/health"
echo ""
echo "📊 Comandos úteis:"
echo "  Ver logs:       docker-compose -f docker-compose.prod.yml logs -f"
echo "  Restart:        docker-compose -f docker-compose.prod.yml restart"
echo "  Parar:          docker-compose -f docker-compose.prod.yml down"
echo "  Ver status:     docker-compose -f docker-compose.prod.yml ps"
echo ""
