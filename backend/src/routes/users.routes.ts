import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { query } from '../config/database.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// GET /api/users/me - Buscar dados do usuário logado
router.get('/me', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;

    const result = await query(
      `SELECT id, email, full_name, role, avatar_url, is_active, last_login, created_at
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

// GET /api/users/me/stats - Estatísticas do usuário
router.get('/me/stats', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;

    const result = await query(
      `SELECT 
        (SELECT COUNT(*) FROM queries WHERE user_id = $1) as total_queries,
        (SELECT COUNT(*) FROM queries WHERE user_id = $1 AND status = 'completed') as completed_queries,
        (SELECT COUNT(*) FROM queries WHERE user_id = $1 AND is_favorite = true) as favorite_queries,
        (SELECT COUNT(*) FROM conversations WHERE user_id = $1) as total_conversations,
        (SELECT AVG(execution_time_ms) FROM queries WHERE user_id = $1 AND execution_time_ms IS NOT NULL) as avg_execution_time,
        (SELECT SUM(tokens_used) FROM queries WHERE user_id = $1 AND tokens_used IS NOT NULL) as total_tokens_used
      `,
      [userId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

// PUT /api/users/me - Atualizar dados do usuário
router.put('/me', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const { fullName, avatarUrl } = req.body;

    const result = await query(
      `UPDATE users
       SET full_name = COALESCE($1, full_name),
           avatar_url = COALESCE($2, avatar_url)
       WHERE id = $3
       RETURNING id, email, full_name, role, avatar_url`,
      [fullName, avatarUrl, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

// GET /api/users/me/activity - Atividade recente do usuário
router.get('/me/activity', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const { limit = 10 } = req.query;

    const result = await query(
      `SELECT 
        'query' as type,
        q.id,
        q.question as title,
        q.created_at,
        s.name as system_name
       FROM queries q
       LEFT JOIN systems s ON q.system_id = s.id
       WHERE q.user_id = $1
       UNION ALL
       SELECT 
        'conversation' as type,
        c.id,
        c.title,
        c.created_at,
        NULL as system_name
       FROM conversations c
       WHERE c.user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, Number(limit)]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar atividade:', error);
    res.status(500).json({ error: 'Erro ao buscar atividade' });
  }
});

// ============================================
// ROTAS ADMINISTRATIVAS (apenas admin)
// ============================================

// Middleware para verificar se é admin
const requireAdmin = (req: AuthRequest, res: any, next: any) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
  }
  next();
};

// GET /api/users - Listar todos os usuários (admin)
router.get('/', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT id, email, full_name as "fullName", role, is_active as "isActive", 
              last_login as "lastLogin", created_at as "createdAt"
       FROM users
       ORDER BY created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ error: 'Erro ao listar usuários' });
  }
});

// POST /api/users - Criar novo usuário (admin)
router.post('/', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const userSchema = z.object({
      email: z.string().email('Email inválido'),
      password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
      fullName: z.string().min(1, 'Nome é obrigatório'),
      role: z.enum(['admin', 'user', 'viewer']).default('user'),
    });

    const { email, password, fullName, role } = userSchema.parse(req.body);

    // Verificar se email já existe
    const existing = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 10);

    // Criar usuário
    const result = await query(
      `INSERT INTO users (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, full_name as "fullName", role, is_active as "isActive", created_at as "createdAt"`,
      [email, passwordHash, fullName, role]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

export default router;
