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
    `).get(result.lastInsertRowid) as any;

    // Gerar token (7 dias = 604800 segundos)
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: 604800 }
    );

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      },
      token,
    });
  } catch (error) {
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

    const user: any = db.prepare(`
      SELECT * FROM users WHERE email = ? AND is_active = 1
    `).get(email);

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const validPassword = bcrypt.compareSync(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    db.prepare(`
      UPDATE users SET last_login = datetime('now') WHERE id = ?
    `).run(user.id);

    // Gerar token (7 dias = 604800 segundos)
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: 604800 }
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log('❌ Validation error:', error.errors);
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('❌ Erro no login:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

export default router;
