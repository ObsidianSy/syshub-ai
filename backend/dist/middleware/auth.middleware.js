import jwt from 'jsonwebtoken';
import db from '../config/sqlite.js';
import { query } from '../config/database.js';
export const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        console.log('❌ Token não fornecido');
        return res.status(401).json({ error: 'Token não fornecido' });
    }
    try {
        // Debug logs for development
        console.log('🔐 authenticateToken: token (start):', token ? token.substring(0, 20) + '...' : null);
        const secret = process.env.JWT_SECRET || 'default-secret';
        const decoded = jwt.verify(token, secret);
        console.log('🔐 authenticateToken: decoded:', { id: decoded.id, email: decoded.email, role: decoded.role });
        // Garantir que o ID seja string
        const userId = String(decoded.id);
        // Verificar se o usuário existe no banco de dados
        let userExists = null;
        if (process.env.DB_HOST) {
            // PostgreSQL mode
            try {
                const result = await query('SELECT id, email, role, is_active FROM users WHERE id = $1', [userId]);
                userExists = result.rows[0];
            }
            catch (e) {
                console.error('Erro consultando PostgreSQL na autenticação:', e);
                userExists = null;
            }
        }
        else {
            // SQLite fallback
            userExists = db.prepare('SELECT id, email, role, is_active FROM users WHERE id = ?').get(userId);
        }
        if (!userExists) {
            console.log('❌ Usuário não encontrado no banco:', userId);
            console.log('❌ Tipo do ID decodificado:', typeof decoded.id);
            return res.status(401).json({ error: 'Usuário não encontrado. Faça login novamente.' });
        }
        if (!userExists.is_active) {
            console.log('❌ Usuário inativo:', userId);
            return res.status(401).json({ error: 'Usuário inativo. Entre em contato com o administrador.' });
        }
        console.log('✅ Usuário autenticado:', { id: userExists.id, email: userExists.email, role: userExists.role });
        req.user = {
            id: String(userExists.id),
            email: userExists.email,
            role: userExists.role,
        };
        next();
    }
    catch (error) {
        console.log('❌ Erro ao validar token:', error);
        return res.status(403).json({ error: 'Token inválido' });
    }
};
export const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Acesso negado' });
        }
        next();
    };
};
//# sourceMappingURL=auth.middleware.js.map