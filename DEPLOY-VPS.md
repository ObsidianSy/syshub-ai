# 🚀 DEPLOY NA VPS - GUIA COMPLETO

## 📋 Pré-requisitos na VPS

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo apt install docker-compose -y

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Relogar para aplicar permissões
exit
```

---

## 📦 Arquivos de Produção

### Estrutura
```
syshub-ai/
├── Dockerfile                 # Build multi-stage da aplicação
├── .dockerignore             # Arquivos a ignorar no build
├── docker-compose.prod.yml   # Compose para produção
├── .env.production           # Template de variáveis
├── deploy.sh                 # Script automatizado de deploy
├── nginx/
│   ├── nginx.conf           # Config principal do Nginx
│   └── conf.d/
│       └── syshub.conf      # Config do site
```

---

## 🔧 Configuração Inicial

### 1. Clonar Repositório na VPS
```bash
cd ~
git clone https://github.com/seu-usuario/syshub-ai.git
cd syshub-ai
```

### 2. Configurar Variáveis de Ambiente
```bash
# Copiar template
cp .env.production .env

# Editar com valores reais
nano .env
```

**Valores importantes:**
```env
DB_PASSWORD=SuaSenhaForteAqui123!@#
JWT_SECRET=SeuSecretoJWTMuitoSeguroMin32Chars
VITE_API_URL=http://SEU_IP_VPS:3001/api
```

### 3. Gerar Senha Segura
```bash
# Gerar senha aleatória
openssl rand -base64 32
```

---

## 🚀 Deploy

### Método 1: Script Automático (Recomendado)
```bash
# Dar permissão
chmod +x deploy.sh

# Executar deploy
./deploy.sh
```

### Método 2: Manual
```bash
# Build e start
docker-compose -f docker-compose.prod.yml up -d --build

# Ver logs
docker-compose -f docker-compose.prod.yml logs -f
```

---

## 🌐 Nginx e Domínio

### Configurar Domínio (Opcional)

**1. Atualizar DNS:**
- Apontar domínio para IP da VPS
- Tipo A: `@` → `SEU_IP_VPS`
- Tipo A: `www` → `SEU_IP_VPS`

**2. Editar nginx config:**
```bash
nano nginx/conf.d/syshub.conf
```

Alterar linha:
```nginx
server_name seu-dominio.com www.seu-dominio.com;
```

**3. Configurar SSL com Let's Encrypt:**
```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obter certificado
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# Renovação automática já está configurada
```

**4. Descomentar bloco HTTPS no nginx/conf.d/syshub.conf**

---

## 📊 Verificação

### Health Checks
```bash
# Backend
curl http://localhost:3001/health

# Frontend (deve retornar HTML)
curl http://localhost

# Via IP externo
curl http://SEU_IP_VPS:3001/health
```

### Logs
```bash
# Todos os services
docker-compose -f docker-compose.prod.yml logs -f

# Apenas app
docker-compose -f docker-compose.prod.yml logs -f app

# Apenas postgres
docker-compose -f docker-compose.prod.yml logs -f postgres

# Apenas nginx
docker-compose -f docker-compose.prod.yml logs -f nginx
```

### Status
```bash
# Ver containers rodando
docker-compose -f docker-compose.prod.yml ps

# Detalhes
docker-compose -f docker-compose.prod.yml top
```

---

## 🔒 Segurança

### Firewall (UFW)
```bash
# Instalar
sudo apt install ufw -y

# Permitir SSH
sudo ufw allow 22/tcp

# Permitir HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Permitir porta backend (se necessário acesso direto)
sudo ufw allow 3001/tcp

# Ativar
sudo ufw enable

# Verificar status
sudo ufw status
```

### Trocar Senhas Padrão
```bash
# Gerar nova senha
openssl rand -base64 32

# Editar .env
nano .env

# Rebuild
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## 🔄 Atualização

### Atualizar código
```bash
# Pull do repositório
git pull origin main

# Rebuild e restart
./deploy.sh
```

### Atualizar apenas backend
```bash
docker-compose -f docker-compose.prod.yml build app
docker-compose -f docker-compose.prod.yml up -d app
```

---

## 💾 Backup

### Backup Manual do Banco
```bash
# Criar backup
docker exec syshub_postgres_prod pg_dump -U postgres syshub > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar backup
cat backup_20241113_120000.sql | docker exec -i syshub_postgres_prod psql -U postgres -d syshub
```

### Backup Automático (Cron)
```bash
# Editar crontab
crontab -e

# Adicionar linha (backup diário às 3h)
0 3 * * * cd ~/syshub-ai && docker exec syshub_postgres_prod pg_dump -U postgres syshub > backups/backup_$(date +\%Y\%m\%d).sql
```

---

## 🐛 Troubleshooting

### Porta já em uso
```bash
# Ver o que está usando a porta
sudo lsof -i :3001
sudo lsof -i :5432

# Matar processo
sudo kill -9 PID
```

### Containers não iniciam
```bash
# Logs detalhados
docker-compose -f docker-compose.prod.yml logs

# Verificar health
docker inspect syshub_postgres_prod | grep Health -A 10

# Restart forçado
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml up -d
```

### Build falha
```bash
# Limpar cache
docker system prune -a

# Build sem cache
docker-compose -f docker-compose.prod.yml build --no-cache
```

### Banco não cria tabelas
```bash
# Executar SQL manualmente
docker exec -i syshub_postgres_prod psql -U postgres -d syshub < database-schema.sql

# Verificar tabelas
docker exec syshub_postgres_prod psql -U postgres -d syshub -c "\dt"
```

---

## 📈 Monitoramento

### Recursos
```bash
# CPU e Memória dos containers
docker stats

# Espaço em disco
df -h

# Logs do sistema
journalctl -u docker -f
```

### Verificação de Saúde
```bash
# Script de monitoramento simples
cat > monitor.sh << 'EOF'
#!/bin/bash
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Backend OK"
else
    echo "❌ Backend DOWN - reiniciando..."
    docker-compose -f docker-compose.prod.yml restart app
fi
EOF

chmod +x monitor.sh

# Adicionar ao cron (verificar a cada 5 min)
crontab -e
# */5 * * * * ~/syshub-ai/monitor.sh >> ~/monitor.log 2>&1
```

---

## 🎯 Checklist de Deploy

- [ ] VPS com Docker e Docker Compose instalados
- [ ] Repositório clonado
- [ ] `.env` configurado com senhas seguras
- [ ] Firewall (UFW) configurado
- [ ] Deploy executado sem erros
- [ ] Health checks retornando OK
- [ ] Frontend acessível via navegador
- [ ] Backend API respondendo
- [ ] Tabelas criadas no banco
- [ ] Backup automático configurado
- [ ] Domínio configurado (se aplicável)
- [ ] SSL configurado (se aplicável)

---

## 📞 Comandos Rápidos

```bash
# Start
docker-compose -f docker-compose.prod.yml up -d

# Stop
docker-compose -f docker-compose.prod.yml down

# Restart
docker-compose -f docker-compose.prod.yml restart

# Logs
docker-compose -f docker-compose.prod.yml logs -f

# Status
docker-compose -f docker-compose.prod.yml ps

# Rebuild
docker-compose -f docker-compose.prod.yml up -d --build

# Limpar tudo
docker-compose -f docker-compose.prod.yml down -v
docker system prune -a
```

---

## 🌟 URLs Finais

Após deploy bem-sucedido:

- **Frontend:** `http://SEU_IP_VPS` ou `https://seu-dominio.com`
- **Backend API:** `http://SEU_IP_VPS:3001/api`
- **Health Check:** `http://SEU_IP_VPS:3001/health`

---

**Deploy concluído! 🎉**
