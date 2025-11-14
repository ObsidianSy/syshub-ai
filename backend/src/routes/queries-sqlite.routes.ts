import { Router } from 'express';
import { z } from 'zod';
import db from '../config/sqlite.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// POST /api/queries - Criar nova query
router.post('/', async (req: AuthRequest, res) => {
  try {
    console.log('📝 POST /api/queries - body:', req.body);
    console.log('📝 POST /api/queries - user:', req.user);
    
    const querySchema = z.object({
      question: z.string().min(1, 'Pergunta é obrigatória'),
      systemId: z.string().optional(),
      systemName: z.string().optional(),
    });

    const { question, systemId, systemName } = querySchema.parse(req.body);
    const userId = req.user?.id;

    const result = db.prepare(`
      INSERT INTO queries (user_id, question, system_id, system_name, status)
      VALUES (?, ?, ?, ?, 'pending')
    `).run(userId, question, systemId || null, systemName || null);

    console.log('📝 Insert result:', result);
    console.log('📝 lastInsertRowid:', result.lastInsertRowid);

    const query = db.prepare('SELECT * FROM queries WHERE rowid = ?').get(result.lastInsertRowid);

    console.log('📝 Query criada:', query);

    res.status(201).json(query);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Erro ao criar query:', error);
    res.status(500).json({ error: 'Erro ao criar query' });
  }
});

// GET /api/queries - Listar queries do usuário
router.get('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const { status, favorite, limit = 20, offset = 0 } = req.query;

    let sql = 'SELECT * FROM queries WHERE user_id = ?';
    const params: any[] = [userId];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (favorite === 'true') {
      sql += ' AND is_favorite = 1';
    }

    sql += ' ORDER BY created_at DESC';
    sql += ` LIMIT ${limit} OFFSET ${offset}`;

    const queries = db.prepare(sql).all(...params);

    const total = db.prepare(
      'SELECT COUNT(*) as count FROM queries WHERE user_id = ?'
    ).get(userId) as { count: number };

    res.json({
      queries,
      total: total.count,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error) {
    console.error('Erro ao listar queries:', error);
    res.status(500).json({ error: 'Erro ao listar queries' });
  }
});

// GET /api/queries/:id - Buscar query específica
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const query = db.prepare(
      'SELECT * FROM queries WHERE id = ? AND user_id = ?'
    ).get(id, userId);

    if (!query) {
      return res.status(404).json({ error: 'Query não encontrada' });
    }

    res.json(query);
  } catch (error) {
    console.error('Erro ao buscar query:', error);
    res.status(500).json({ error: 'Erro ao buscar query' });
  }
});

// PUT /api/queries/:id - Atualizar query
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const updateSchema = z.object({
      response: z.string().optional(),
      status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
      error_message: z.string().optional(),
      execution_time_ms: z.number().optional(),
      tokens_used: z.number().optional(),
      is_favorite: z.boolean().optional(),
    });

    const data = updateSchema.parse(req.body);
    const { id } = req.params;
    const userId = req.user?.id;

    const fields: string[] = [];
    const values: any[] = [];

    if (data.response !== undefined) {
      fields.push('response = ?');
      values.push(data.response);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }
    if (data.error_message !== undefined) {
      fields.push('error_message = ?');
      values.push(data.error_message);
    }
    if (data.execution_time_ms !== undefined) {
      fields.push('execution_time_ms = ?');
      values.push(data.execution_time_ms);
    }
    if (data.tokens_used !== undefined) {
      fields.push('tokens_used = ?');
      values.push(data.tokens_used);
    }
    if (data.is_favorite !== undefined) {
      fields.push('is_favorite = ?');
      values.push(data.is_favorite ? 1 : 0);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    values.push(id, userId);

    const result = db.prepare(`
      UPDATE queries
      SET ${fields.join(', ')}
      WHERE id = ? AND user_id = ?
    `).run(...values);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Query não encontrada' });
    }

    const query = db.prepare('SELECT * FROM queries WHERE id = ?').get(id);

    res.json(query);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Erro ao atualizar query:', error);
    res.status(500).json({ error: 'Erro ao atualizar query' });
  }
});

// DELETE /api/queries/:id - Deletar query
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const result = db.prepare(
      'DELETE FROM queries WHERE id = ? AND user_id = ?'
    ).run(id, userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Query não encontrada' });
    }

    res.json({ success: true, id });
  } catch (error) {
    console.error('Erro ao deletar query:', error);
    res.status(500).json({ error: 'Erro ao deletar query' });
  }
});

// GET /api/queries/stats - Estatísticas do usuário
router.get('/user/stats', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;

    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_queries,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_queries,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_queries,
        SUM(CASE WHEN is_favorite = 1 THEN 1 ELSE 0 END) as favorite_queries,
        AVG(CASE WHEN execution_time_ms > 0 THEN execution_time_ms ELSE NULL END) as avg_execution_time,
        SUM(COALESCE(tokens_used, 0)) as total_tokens
      FROM queries
      WHERE user_id = ?
    `).get(userId);

    res.json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

export default router;
