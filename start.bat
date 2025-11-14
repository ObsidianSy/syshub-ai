@echo off
echo.
echo ========================================
echo   SYSHUB AI - INICIALIZACAO COMPLETA
echo ========================================
echo.

REM Verificar se Docker esta rodando
echo [1/5] Verificando Docker...
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo *** DOCKER DESKTOP NAO ESTA RODANDO! ***
    echo.
    echo Por favor:
    echo 1. Abra o Docker Desktop manualmente
    echo 2. Aguarde o icone ficar VERDE na barra de tarefas
    echo 3. Execute este script novamente
    echo.
    pause
    exit /b 1
)

echo OK - Docker esta rodando!
echo.

REM Iniciar PostgreSQL
echo [2/5] Iniciando PostgreSQL...
docker-compose up -d
if %errorlevel% neq 0 (
    echo ERRO ao iniciar PostgreSQL!
    pause
    exit /b 1
)

echo OK - PostgreSQL iniciado!
echo.

REM Aguardar banco inicializar
echo [3/5] Aguardando banco de dados inicializar...
timeout /t 10 /nobreak >nul
echo OK - Banco pronto!
echo.

REM Verificar container
echo [4/5] Verificando container...
docker ps | findstr syshub_postgres >nul
if %errorlevel% neq 0 (
    echo ERRO - Container nao encontrado!
    docker-compose logs postgres
    pause
    exit /b 1
)

echo OK - Container rodando!
echo.

REM Iniciar aplicacao
echo [5/5] Iniciando aplicacao...
echo.
echo ========================================
echo   FRONTEND: http://localhost:5173
echo   BACKEND:  http://localhost:3001
echo ========================================
echo.
echo Pressione Ctrl+C para parar
echo.

npm run dev
