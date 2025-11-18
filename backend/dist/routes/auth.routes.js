import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { query } from '../config/database.js';
const router = Router();
// Schemas de validação
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
        let { email, password, fullName } = registerSchema.parse(req.body);
        email = String(email).trim().toLowerCase();
        // Verificar se usuário já existe
        const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Email já cadastrado' });
        }
        // Hash da senha
        const passwordHash = await bcrypt.hash(password, 10);
        // Criar usuário
        const result = await query(`INSERT INTO users (email, password_hash, full_name)
       VALUES ($1, $2, $3)
       RETURNING id, email, full_name, role, created_at`, [email, passwordHash, fullName]);
        const user = result.rows[0];
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
        let { email, password } = loginSchema.parse(req.body);
        email = String(email).trim();
        // Buscar usuário
        let result = await query('SELECT * FROM users WHERE email = $1 AND is_active = true', [email]);
        console.log('🔍 Query result:', {
            found: result.rows.length > 0,
            email,
            rowCount: result.rows.length
        });
        if (result.rows.length === 0) {
            console.log('⚠️ Usuario nao encontrado por email exato. Tentando busca case-insensitive.');
            // fallback case-insensitive search
            result = await query('SELECT * FROM users WHERE lower(email) = lower($1) AND is_active = true', [email]);
            console.log('🔍 Case-insensitive query result:', {
                found: result.rows.length > 0,
                email,
                rowCount: result.rows.length
            });
            if (result.rows.length === 0) {
                console.log('❌ Usuário não encontrado (even case-insensitive):', email);
                return res.status(401).json({ error: 'Credenciais inválidas' });
            }
        }
        const user = result.rows[0];
        console.log('✅ Usuário encontrado:', {
            id: user.id,
            email: user.email,
            role: user.role,
            hasPasswordHash: !!user.password_hash
        });
        // Verificar senha
        const validPassword = await bcrypt.compare(password, user.password_hash);
        console.log('🔐 Password check:', { valid: validPassword });
        if (!validPassword) {
            console.log('❌ Senha inválida para:', email);
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }
        // Atualizar último login
        await query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);
        // Gerar token (7 dias = 604800 segundos)
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'default-secret', { expiresIn: 604800 });
        console.log('✅ Login successful:', { id: user.id, email: user.email });
        res.json({
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                role: user.role,
                avatarUrl: user.avatar_url,
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
        // Buscar usuário atualizado
        const result = await query('SELECT id, email, full_name, role, avatar_url FROM users WHERE id = $1 AND is_active = true', [decoded.id]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Usuário não encontrado' });
        }
        const user = result.rows[0];
        res.json({
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                role: user.role,
                avatarUrl: user.avatar_url,
            },
        });
    }
    catch (error) {
        res.status(401).json({ error: 'Token inválido' });
    }
});
// GET /api/auth/debug-users (temporário para debug)
router.get('/debug-users', async (req, res) => {
    try {
        const result = await query('SELECT id, email, full_name, role, is_active, created_at FROM users LIMIT 10', []);
        res.json({
            count: result.rows.length,
            users: result.rows
        });
    }
    catch (error) {
        console.error('Erro ao listar usuários:', error);
        res.status(500).json({ error: 'Erro ao listar usuários' });
    }
});
export default router;
//# sourceMappingURL=auth.routes.js.map