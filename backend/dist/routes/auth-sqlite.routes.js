import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import db from '../config/sqlite.js';
const router = Router();
const registerSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
    fullName: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
});
const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'Senha é obrigatória'),
});
// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { email, password, fullName } = registerSchema.parse(req.body);
        const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existingUser) {
            return res.status(400).json({ error: 'Email já cadastrado' });
        }
        const passwordHash = bcrypt.hashSync(password, 10);
        const result = db.prepare(`
      INSERT INTO users (email, password_hash, full_name)
      VALUES (?, ?, ?)
    `).run(email, passwordHash, fullName);
        const user = db.prepare(`
      SELECT id, email, full_name, role, created_at
      FROM users WHERE id = ?
    `).get(result.lastInsertRowid);
        // Gerar token (7 dias = 604800 segundos)
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'default-secret', { expiresIn: 604800 });
        res.status(201).json({
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                role: user.role,
            },
            token,
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error('Erro no registro:', error);
        res.status(500).json({ error: 'Erro ao criar usuário' });
    }
});
// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        console.log('📥 Login attempt:', {
            body: req.body,
            email: req.body.email,
            hasPassword: !!req.body.password,
            passwordLength: req.body.password?.length
        });
        const { email, password } = loginSchema.parse(req.body);
        const user = db.prepare(`
      SELECT * FROM users WHERE email = ? AND is_active = 1
    `).get(email);
        if (!user) {
            console.log('❌ Usuário não encontrado:', email);
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }
        console.log('✅ Usuário encontrado:', { id: user.id, email: user.email, role: user.role });
        const validPassword = bcrypt.compareSync(password, user.password_hash);
        if (!validPassword) {
            console.log('❌ Senha inválida para usuário:', email);
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }
        db.prepare(`
      UPDATE users SET last_login = datetime('now') WHERE id = ?
    `).run(user.id);
        // Gerar token (7 dias = 604800 segundos)
        // Garantir que o ID seja string
        const userId = String(user.id);
        const token = jwt.sign({ id: userId, email: user.email, role: user.role }, process.env.JWT_SECRET || 'default-secret', { expiresIn: 604800 });
        console.log('✅ Token gerado para usuário:', { id: userId, email: user.email });
        res.json({
            user: {
                id: userId,
                email: user.email,
                fullName: user.full_name,
                role: user.role,
            },
            token,
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            console.log('❌ Validation error:', error.errors);
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error('❌ Erro no login:', error);
        res.status(500).json({ error: 'Erro ao fazer login' });
    }
});
// POST /api/auth/verify
router.post('/verify', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Token não fornecido' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
        const user = db.prepare('SELECT id, email, full_name, role, avatar_url, is_active FROM users WHERE id = ?').get(String(decoded.id));
        if (!user || user.is_active !== 1) {
            return res.status(401).json({ error: 'Usuário não encontrado' });
        }
        res.json({
            user: {
                id: String(user.id),
                email: user.email,
                fullName: user.full_name,
                role: user.role,
                avatarUrl: user.avatar_url,
            },
        });
    }
    catch (error) {
        return res.status(401).json({ error: 'Token inválido' });
    }
});
export default router;
//# sourceMappingURL=auth-sqlite.routes.js.map