import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import db from '../config/sqlite.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticateToken);

// Middleware para verificar se é admin
const requireAdmin = (req: AuthRequest, res: any, next: any) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
  }
  next();
};

// GET /api/users/me
router.get('/me', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const user = db.prepare(`
      SELECT id, email, full_name, role, avatar_url, is_active, last_login, created_at
      FROM users WHERE id = ?
    `).get(userId);

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(user);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

// GET /api/users - Listar todos (admin)
router.get('/', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const users = db.prepare(`
      SELECT id, email, full_name, role, is_active, created_at
      FROM users
      ORDER BY created_at DESC
    `).all();

    res.json(users);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ error: 'Erro ao listar usuários' });
  }
});

// POST /api/users - Criar usuário (admin)
const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(1),
  role: z.enum(['admin', 'user', 'viewer']).default('user'),
});

router.post('/', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const data = createUserSchema.parse(req.body);
    
    // Verificar se email já existe
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(data.email);
    if (existing) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    const passwordHash = bcrypt.hashSync(data.password, 10);
    
    const result = db.prepare(`
      INSERT INTO users (email, password_hash, full_name, role, is_active)
      VALUES (?, ?, ?, ?, 1)
    `).run(data.email, passwordHash, data.fullName, data.role);

    const newUser = db.prepare(`
      SELECT id, email, full_name, role, is_active, created_at
      FROM users WHERE id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(newUser);
  } catch (error: any) {
    console.error('Erro ao criar usuário:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

// DELETE /api/users/:id - Deletar usuário (admin)
router.delete('/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Impedir que admin delete a si mesmo
    if (id === req.user?.id) {
      return res.status(400).json({ error: 'Você não pode excluir sua própria conta' });
    }

    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(id);

    res.json({ message: 'Usuário excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    res.status(500).json({ error: 'Erro ao excluir usuário' });
  }
});

export default router;
