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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 80;

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
app.use('/api/systems', systemsRoutes);
app.use('/api/queries', queriesRoutes);
app.use('/api/agent', agentRoutes);

// Servir arquivos estáticos do frontend (em produção)
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));
  
  // SPA fallback - todas as rotas não-API retornam o index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
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
