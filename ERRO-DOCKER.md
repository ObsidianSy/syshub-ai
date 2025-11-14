# ⚠️ ERRO: Docker Desktop Não Está Rodando!

## 🔴 Problema Detectado

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

Isso significa que o PostgreSQL não está rodando porque o **Docker Desktop está fechado**.

---

## ✅ SOLUÇÃO (3 passos simples)

### 1️⃣ Abrir Docker Desktop

**Windows:**
1. Procure "Docker Desktop" no menu iniciar
2. Clique para abrir
3. **AGUARDE** o ícone na barra de tarefas ficar **verde** ✅
4. Pode levar 30-60 segundos

**Ou via PowerShell:**
```powershell
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
```

---

### 2️⃣ Aguardar Docker Iniciar

Você saberá que está pronto quando:
- ✅ Ícone do Docker na bandeja do sistema está **verde**
- ✅ Ao passar o mouse aparece "Docker Desktop is running"

---

### 3️⃣ Iniciar PostgreSQL

```powershell
# No diretório do projeto (syshub-ai)
docker-compose up -d
```

Você verá:
```
Creating syshub_postgres ... done
```

---

### 4️⃣ Verificar se Está Rodando

```powershell
docker ps
```

Deve aparecer:
```
CONTAINER ID   IMAGE                NAMES
xxxxx          postgres:15-alpine   syshub_postgres
```

---

### 5️⃣ Rodar Aplicação Novamente

```powershell
npm run dev
```

Agora deve funcionar! ✅

---

## 🚀 FLUXO CORRETO

**SEMPRE que for rodar o projeto:**

```powershell
# 1. Abrir Docker Desktop (se não estiver aberto)
# 2. Aguardar ficar verde
# 3. Iniciar PostgreSQL
docker-compose up -d

# 4. Aguardar 10 segundos
Start-Sleep -Seconds 10

# 5. Rodar aplicação
npm run dev
```

---

## 🔧 Script Automático

Se quiser automatizar, crie um arquivo `start.bat`:

```batch
@echo off
echo 🚀 Iniciando SysHub AI...
echo.

echo 📦 Verificando Docker...
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Docker Desktop não está rodando!
    echo 🔄 Abrindo Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo ⏳ Aguardando Docker iniciar (60 segundos)...
    timeout /t 60 /nobreak >nul
)

echo ✅ Docker está rodando!
echo.

echo 🐘 Iniciando PostgreSQL...
docker-compose up -d

echo ⏳ Aguardando banco inicializar (10 segundos)...
timeout /t 10 /nobreak >nul

echo 🚀 Iniciando aplicação...
npm run dev
```

Depois é só rodar:
```powershell
.\start.bat
```

---

## 🐛 Outros Problemas?

### Docker Desktop não instala
[Download aqui](https://www.docker.com/products/docker-desktop/)

### Porta 5432 já em uso
```powershell
# Ver o que está usando
netstat -ano | findstr :5432

# Parar PostgreSQL local (se tiver)
Stop-Service postgresql-x64-*
```

### Container não inicia
```powershell
# Ver logs
docker-compose logs postgres

# Reiniciar do zero
docker-compose down -v
docker-compose up -d
```

---

## 📝 Checklist

Antes de rodar `npm run dev`:

- [ ] Docker Desktop instalado?
- [ ] Docker Desktop está **aberto**?
- [ ] Ícone do Docker está **verde**?
- [ ] `docker ps` funciona sem erro?
- [ ] `docker-compose up -d` executado?
- [ ] Container `syshub_postgres` está rodando?

---

**🎯 Resumo: SEMPRE abra o Docker Desktop antes de rodar o projeto!**
