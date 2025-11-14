import { Router } from 'express';
import { z } from 'zod';
import db from '../config/sqlite.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();

// GET /api/systems - Listar todos os sistemas
router.get('/', async (req, res) => {
  try {
    const { category, status, search } = req.query;

    let sql = 'SELECT * FROM systems WHERE 1=1';
    const params: any[] = [];

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      sql += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY name ASC';

    const systems = db.prepare(sql).all(...params);
    const total = systems.length;

    res.json({ systems, total });
  } catch (error) {
    console.error('Erro ao listar sistemas:', error);
    res.status(500).json({ error: 'Erro ao listar sistemas' });
  }
});

// GET /api/systems/:id - Buscar sistema por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const system = db.prepare('SELECT * FROM systems WHERE id = ?').get(id);

    if (!system) {
      return res.status(404).json({ error: 'Sistema não encontrado' });
    }

    res.json(system);
  } catch (error) {
    console.error('Erro ao buscar sistema:', error);
    res.status(500).json({ error: 'Erro ao buscar sistema' });
  }
});

// GET /api/systems/slug/:slug - Buscar sistema por slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const system = db.prepare('SELECT * FROM systems WHERE slug = ?').get(slug);

    if (!system) {
      return res.status(404).json({ error: 'Sistema não encontrado' });
    }

    res.json(system);
  } catch (error) {
    console.error('Erro ao buscar sistema:', error);
    res.status(500).json({ error: 'Erro ao buscar sistema' });
  }
});

// GET /api/systems/:id/stats - Estatísticas do sistema
router.get('/:id/stats', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const system = db.prepare('SELECT id FROM systems WHERE id = ?').get(id);
    if (!system) {
      return res.status(404).json({ error: 'Sistema não encontrado' });
    }

    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_queries,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_queries,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_queries,
        AVG(CASE WHEN execution_time_ms > 0 THEN execution_time_ms ELSE NULL END) as avg_execution_time,
        MAX(created_at) as last_query_at
      FROM queries
      WHERE system_id = ?
    `).get(id);

    res.json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

// POST /api/systems - Criar novo sistema (admin only)
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const systemSchema = z.object({
      name: z.string().min(1, 'Nome é obrigatório'),
      slug: z.string().min(1, 'Slug é obrigatório'),
      category: z.string().min(1, 'Categoria é obrigatória'),
      status: z.enum(['online', 'teste', 'depreciado', 'offline']).default('online'),
      description: z.string().optional(),
      icon: z.string().optional(),
      version: z.string().optional(),
    });

    const data = systemSchema.parse(req.body);

    const result = db.prepare(`
      INSERT INTO systems (name, slug, category, status, description, icon, version)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(data.name, data.slug, data.category, data.status, data.description || null, data.icon || null, data.version || null);

    const system = db.prepare('SELECT * FROM systems WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json(system);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Erro ao criar sistema:', error);
    res.status(500).json({ error: 'Erro ao criar sistema' });
  }
});

// PUT /api/systems/:id - Atualizar sistema (admin only)
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const updateSchema = z.object({
      name: z.string().optional(),
      category: z.string().optional(),
      status: z.enum(['online', 'teste', 'depreciado', 'offline']).optional(),
      description: z.string().optional(),
      icon: z.string().optional(),
      version: z.string().optional(),
    });

    const data = updateSchema.parse(req.body);
    const { id } = req.params;

    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.category !== undefined) {
      fields.push('category = ?');
      values.push(data.category);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }
    if (data.description !== undefined) {
      fields.push('description = ?');
      values.push(data.description);
    }
    if (data.icon !== undefined) {
      fields.push('icon = ?');
      values.push(data.icon);
    }
    if (data.version !== undefined) {
      fields.push('version = ?');
      values.push(data.version);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    values.push(id);

    const result = db.prepare(`
      UPDATE systems
      SET ${fields.join(', ')}
      WHERE id = ?
    `).run(...values);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Sistema não encontrado' });
    }

    const system = db.prepare('SELECT * FROM systems WHERE id = ?').get(id);

    res.json(system);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Erro ao atualizar sistema:', error);
    res.status(500).json({ error: 'Erro ao atualizar sistema' });
  }
});

// DELETE /api/systems/:id - Deletar sistema (admin only)
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const { id } = req.params;

    const result = db.prepare('DELETE FROM systems WHERE id = ?').run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Sistema não encontrado' });
    }

    res.json({ success: true, id });
  } catch (error) {
    console.error('Erro ao deletar sistema:', error);
    res.status(500).json({ error: 'Erro ao deletar sistema' });
  }
});

export default router;
