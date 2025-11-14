@echo off
echo ====================================
echo  SysHub AI - Instalacao Completa
echo ====================================
echo.

echo [1/4] Instalando dependencias do frontend...
call npm install
if %errorlevel% neq 0 (
    echo ERRO: Falha ao instalar dependencias do frontend
    pause
    exit /b %errorlevel%
)

echo.
echo [2/4] Instalando dependencias do backend...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ERRO: Falha ao instalar dependencias do backend
    cd ..
    pause
    exit /b %errorlevel%
)
cd ..

echo.
echo [3/4] Subindo PostgreSQL com Docker...
docker-compose up -d
if %errorlevel% neq 0 (
    echo ERRO: Falha ao iniciar Docker
    echo Certifique-se de que o Docker Desktop esta rodando
    pause
    exit /b %errorlevel%
)

echo.
echo [4/4] Aguardando PostgreSQL inicializar...
timeout /t 10 /nobreak

echo.
echo ====================================
echo  Instalacao Concluida!
echo ====================================
echo.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173
echo.
echo Para iniciar os servidores, execute:
echo   npm run dev
echo.
pause
