# 🐳 Docker Setup - SysHub AI

## O Que Foi Configurado

✅ **docker-compose.yml** criado
- PostgreSQL 15 Alpine (leve e rápido)
- Porta 5432 exposta
- Volume persistente para dados
- Health check configurado
- Auto-init com database-schema.sql

✅ **database-schema.sql** criado
- SQL limpo sem comandos `\echo`
- 12 tabelas completas
- Índices e triggers
- Dados iniciais (6 sistemas)

✅ **Scripts de Setup**
- `setup.bat` (Windows)
- `setup.sh` (Linux/Mac)

---

## 🚀 Setup Automático

### Windows
```powershell
.\setup.bat
```

### Linux/Mac
```bash
chmod +x setup.sh
./setup.sh
```

---

## 🔧 Setup Manual

### 1. Instalar Dependências
```powershell
npm install
cd backend && npm install && cd ..
```

### 2. Subir PostgreSQL
```powershell
docker-compose up -d
```

### 3. Verificar se está rodando
```powershell
docker ps
```

Você deve ver:
```
CONTAINER ID   IMAGE                 STATUS         PORTS
abc123def456   postgres:15-alpine    Up 30 seconds  0.0.0.0:5432->5432/tcp
```

### 4. Verificar tabelas
```powershell
docker exec -it syshub_postgres psql -U postgres -d syshub -c "\dt"
```

Você deve ver as 12 tabelas:
```
 users
 systems
 queries
 conversations
 conversation_messages
 query_history
 system_logs
 system_documentation
 favorites
 notifications
 agent_config
 api_keys
```

---

## 📊 Comandos Docker Úteis

### Ver logs
```powershell
docker-compose logs -f postgres
```

### Parar
```powershell
docker-compose down
```

### Restart
```powershell
docker-compose restart
```

### Remover tudo (incluindo dados)
```powershell
docker-compose down -v
```

### Recrear do zero
```powershell
docker-compose down -v
docker-compose up -d
```

---

## 🗄️ Acessar PostgreSQL

### Via Docker
```powershell
docker exec -it syshub_postgres psql -U postgres -d syshub
```

### Comandos PostgreSQL úteis
```sql
-- Listar tabelas
\dt

-- Descrever tabela
\d users

-- Ver sistemas
SELECT * FROM systems;

-- Contar usuários
SELECT COUNT(*) FROM users;

-- Sair
\q
```

---

## 🔧 Configuração do Container

### Credenciais
- **Database:** syshub
- **User:** postgres
- **Password:** syshub2024
- **Port:** 5432

### Volumes
- Dados persistem em: `syshub-ai_postgres_data`
- Backup automático: Não (configure se necessário)

### Health Check
- Intervalo: 10s
- Timeout: 5s
- Retries: 5

---

## 🐛 Troubleshooting

### Porta 5432 já em uso

**Solução 1:** Parar PostgreSQL existente
```powershell
docker stop docker_iagente
# ou
Stop-Service postgresql-x64-15
```

**Solução 2:** Mudar porta no docker-compose.yml
```yaml
ports:
  - "5433:5432"
```

E atualizar `backend/.env`:
```env
DB_PORT=5433
```

### Container não inicia

```powershell
# Ver logs
docker-compose logs postgres

# Verificar Docker
docker info

# Reiniciar Docker Desktop
```

### Tabelas não foram criadas

```powershell
# Executar SQL manualmente
docker exec -i syshub_postgres psql -U postgres -d syshub < database-schema.sql

# Ou entrar no container e executar
docker exec -it syshub_postgres bash
psql -U postgres -d syshub -f /docker-entrypoint-initdb.d/init.sql
```

### Erro de permissão no volume

```powershell
# Windows: Certifique-se de que Docker tem acesso ao drive
# Abra Docker Desktop > Settings > Resources > File Sharing
# Adicione o drive do projeto

# Linux/Mac: Ajustar permissões
sudo chown -R $USER:$USER .
```

---

## 💾 Backup e Restore

### Backup
```powershell
# Backup completo
docker exec syshub_postgres pg_dump -U postgres syshub > backup.sql

# Backup com data
docker exec syshub_postgres pg_dump -U postgres syshub > backup-$(date +%Y%m%d).sql
```

### Restore
```powershell
# Restore
docker exec -i syshub_postgres psql -U postgres syshub < backup.sql

# Restore limpo (drop e recria)
docker exec syshub_postgres dropdb -U postgres syshub
docker exec syshub_postgres createdb -U postgres syshub
docker exec -i syshub_postgres psql -U postgres syshub < backup.sql
```

---

## 📈 Monitoramento

### Ver uso de recursos
```powershell
docker stats syshub_postgres
```

### Ver conexões ativas
```sql
SELECT COUNT(*) FROM pg_stat_activity WHERE datname = 'syshub';
```

### Ver tamanho do banco
```sql
SELECT pg_size_pretty(pg_database_size('syshub'));
```

---

## 🔒 Segurança

### Produção

Para produção, ajuste:

1. **Senha forte** no docker-compose.yml
```yaml
POSTGRES_PASSWORD: use_uma_senha_forte_aqui
```

2. **Não exponha porta** (remova ports)
```yaml
# Comente esta linha:
# ports:
#   - "5432:5432"
```

3. **Use secrets**
```yaml
secrets:
  postgres_password:
    file: ./postgres_password.txt
```

4. **Backup automático**
Configure cron job ou serviço de backup

---

## ✅ Checklist

- [ ] Docker Desktop instalado e rodando
- [ ] `docker-compose up -d` executado
- [ ] Container `syshub_postgres` rodando
- [ ] 12 tabelas criadas (verificar com `\dt`)
- [ ] 6 sistemas inseridos (verificar `SELECT * FROM systems`)
- [ ] Backend conecta (testar com `npm run dev:backend`)

---

**Tudo pronto para desenvolvimento! 🚀**
