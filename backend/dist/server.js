import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { testConnection } from './config/database.js';
// Routes
import authRoutes from './routes/auth.routes.js';
import systemRoutes from './routes/systems.routes.js';
import queryRoutes from './routes/queries.routes.js';
import conversationRoutes from './routes/conversations.routes.js';
import userRoutes from './routes/users.routes.js';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;
// Middlewares
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});
// Diagnostics route (limited info, no secrets)
app.get('/__diag', (req, res) => {
    res.json({
        env: {
            NODE_ENV: process.env.NODE_ENV,
            DB_HOST: process.env.DB_HOST || null,
            DB_NAME: process.env.DB_NAME || null,
            DB_USER: process.env.DB_USER || null,
            PORT: process.env.PORT || 3001,
        },
        uptime: process.uptime(),
    });
});
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/systems', systemRoutes);
app.use('/api/queries', queryRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/users', userRoutes);
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Erro interno do servidor',
            status: err.status || 500,
        },
    });
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Rota não encontrada' });
});
// Start server
const startServer = async () => {
    try {
        // Test database connection
        const dbConnected = await testConnection();
        if (!dbConnected) {
            console.error('❌ Não foi possível conectar ao banco de dados');
            process.exit(1);
        }
        // Log which DB type is being used for clarity
        if (process.env.DB_HOST) {
            console.log(`🗄️ Using PostgreSQL at ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
        }
        else {
            console.log('🗄️ Using SQLite (no DB_HOST environment variable provided)');
        }
        app.listen(PORT, () => {
            console.log(`🚀 Servidor rodando na porta ${PORT}`);
            console.log(`🌐 Ambiente: ${process.env.NODE_ENV || 'development'}`);
            console.log(`📊 Health check: http://localhost:${PORT}/health`);
        });
    }
    catch (error) {
        console.error('❌ Erro ao iniciar servidor:', error);
        process.exit(1);
    }
};
startServer();
export default app;
//# sourceMappingURL=server.js.map