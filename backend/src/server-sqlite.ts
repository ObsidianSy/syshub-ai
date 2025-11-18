import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './config/sqlite.js';
import authRoutes from './routes/auth-sqlite.routes.js';
import usersRoutes from './routes/users-sqlite.routes.js';
import conversationsRoutes from './routes/conversations-sqlite.routes.js';
import systemsRoutes from './routes/systems-sqlite.routes.js';
import queriesRoutes from './routes/queries-sqlite.routes.js';
import agentRoutes from './routes/agent-sqlite.routes.js';
import adminRoutes from './routes/admin.routes.js';
import debugDbRoutes from './routes/debug-db.routes.js';
import agentManagementRoutes from './routes/agent-management.routes.js';
import conversationDocumentsRoutes from './routes/conversation-documents.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
console.log(`🚀 Startup env PORT=${process.env.PORT} (effective ${PORT}) NODE_ENV=${process.env.NODE_ENV}`);

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({
  origin: true, // Permitir todas as origens em produção
  credentials: true,
}));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: 'SQLite (development)',
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/conversations', conversationsRoutes);
app.use('/api/conversations', conversationDocumentsRoutes); // Documents routes
app.use('/api/systems', systemsRoutes);
app.use('/api/queries', queriesRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/agent', agentManagementRoutes); // New: Agent management APIs
app.use('/api/admin', adminRoutes); // Admin utilities (reset password)
app.use('/api', debugDbRoutes); // DB debug routes (read-only)

// Diagnóstico SEMPRE disponível (antes do static)
app.get('/__diag', (req, res) => {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  try {
    const fs = require('fs');
    const files = fs.readdirSync(frontendPath);
    res.json({
      frontendPath,
      files,
      hasIndex: files.includes('index.html'),
      env: { 
        PORT: process.env.PORT, 
        NODE_ENV: process.env.NODE_ENV,
        PWD: process.cwd()
      }
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message, stack: e.stack });
  }
});

// Servir arquivos estáticos do frontend (em produção)
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  console.log(`📂 Serving frontend from: ${frontendPath}`);
  
  // Static files DEPOIS das rotas específicas
  app.use(express.static(frontendPath, { index: false }));
  
  // SPA fallback - catch-all para tudo que não for /api ou /__diag
  app.get('*', (req, res) => {
    const indexPath = path.join(frontendPath, 'index.html');
    console.log(`📄 Serving index.html for ${req.path} from: ${indexPath}`);
    res.sendFile(indexPath);
  });
} else {
  app.get('/', (req, res) => {
    res.json({ message: 'API is running. Frontend should be served separately in development.' });
  });
}

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Erro:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Erro interno do servidor',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  console.log(`🌐 Health: http://localhost:${PORT}/health`);
  console.log(`📊 Database: SQLite (development mode)`);
  console.log(`\n👤 Admin criado:`);
  console.log(`   Email: deltagarr@gmail.com`);
  console.log(`   Senha: senha123`);
});
