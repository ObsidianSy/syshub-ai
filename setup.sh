#!/bin/bash

echo "===================================="
echo " SysHub AI - Instalação Completa"
echo "===================================="
echo ""

echo "[1/4] Instalando dependências do frontend..."
npm install
if [ $? -ne 0 ]; then
    echo "ERRO: Falha ao instalar dependências do frontend"
    exit 1
fi

echo ""
echo "[2/4] Instalando dependências do backend..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "ERRO: Falha ao instalar dependências do backend"
    cd ..
    exit 1
fi
cd ..

echo ""
echo "[3/4] Subindo PostgreSQL com Docker..."
docker-compose up -d
if [ $? -ne 0 ]; then
    echo "ERRO: Falha ao iniciar Docker"
    echo "Certifique-se de que o Docker Desktop está rodando"
    exit 1
fi

echo ""
echo "[4/4] Aguardando PostgreSQL inicializar..."
sleep 10

echo ""
echo "===================================="
echo " Instalação Concluída!"
echo "===================================="
echo ""
echo "Backend: http://localhost:3001"
echo "Frontend: http://localhost:5173"
echo ""
echo "Para iniciar os servidores, execute:"
echo "  npm run dev"
echo ""
