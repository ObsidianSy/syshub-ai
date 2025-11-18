import { Router } from 'express';
import { z } from 'zod';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
const router = Router();
// GET /api/systems - Listar todos os sistemas
router.get('/', async (req, res) => {
    try {
        const { category, status, search } = req.query;
        let sql = 'SELECT * FROM systems WHERE is_active = true';
        const params = [];
        let paramCount = 1;
        if (category) {
            sql += ` AND category = $${paramCount}`;
            params.push(category);
            paramCount++;
        }
        if (status) {
            sql += ` AND status = $${paramCount}`;
            params.push(status);
            paramCount++;
        }
        if (search) {
            sql += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
            params.push(`%${search}%`);
            paramCount++;
        }
        sql += ' ORDER BY order_index ASC, name ASC';
        const result = await query(sql, params);
        res.json({
            systems: result.rows,
            total: result.rows.length,
        });
    }
    catch (error) {
        console.error('Erro ao buscar sistemas:', error);
        res.status(500).json({ error: 'Erro ao buscar sistemas' });
    }
});
// GET /api/systems/:id - Buscar sistema por ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query('SELECT * FROM systems WHERE id = $1 AND is_active = true', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Sistema não encontrado' });
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Erro ao buscar sistema:', error);
        res.status(500).json({ error: 'Erro ao buscar sistema' });
    }
});
// GET /api/systems/slug/:slug - Buscar sistema por slug
router.get('/slug/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const result = await query('SELECT * FROM systems WHERE slug = $1 AND is_active = true', [slug]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Sistema não encontrado' });
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Erro ao buscar sistema:', error);
        res.status(500).json({ error: 'Erro ao buscar sistema' });
    }
});
// GET /api/systems/:id/stats - Estatísticas de uso do sistema
router.get('/:id/stats', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(`SELECT 
        COUNT(q.id) as total_queries,
        COUNT(CASE WHEN q.status = 'completed' THEN 1 END) as completed_queries,
        COUNT(CASE WHEN q.status = 'failed' THEN 1 END) as failed_queries,
        AVG(q.execution_time_ms) as avg_execution_time,
        MAX(q.created_at) as last_query_at
       FROM queries q
       WHERE q.system_id = $1`, [id]);
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
});
// POST /api/systems - Criar novo sistema (Admin only)
router.post('/', authenticateToken, async (req, res) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Acesso negado' });
        }
        const systemSchema = z.object({
            name: z.string().min(2),
            slug: z.string().min(2),
            category: z.enum(['Estoque', 'Financeiro', 'ERP Fábrica', 'Calculadoras', 'Integração', 'Outro']),
            status: z.enum(['online', 'teste', 'depreciado', 'offline']).default('online'),
            description: z.string().optional(),
            icon: z.string().optional(),
            version: z.string().optional(),
        });
        const data = systemSchema.parse(req.body);
        const result = await query(`INSERT INTO systems (name, slug, category, status, description, icon, version)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`, [data.name, data.slug, data.category, data.status, data.description, data.icon, data.version]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error('Erro ao criar sistema:', error);
        res.status(500).json({ error: 'Erro ao criar sistema' });
    }
});
// PUT /api/systems/:id - Atualizar sistema (Admin only)
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Acesso negado' });
        }
        const { id } = req.params;
        const { name, category, status, description, icon, version } = req.body;
        const result = await query(`UPDATE systems 
       SET name = COALESCE($1, name),
           category = COALESCE($2, category),
           status = COALESCE($3, status),
           description = COALESCE($4, description),
           icon = COALESCE($5, icon),
           version = COALESCE($6, version)
       WHERE id = $7
       RETURNING *`, [name, category, status, description, icon, version, id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Sistema não encontrado' });
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Erro ao atualizar sistema:', error);
        res.status(500).json({ error: 'Erro ao atualizar sistema' });
    }
});
// DELETE /api/systems/:id - Desativar sistema (Admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Acesso negado' });
        }
        const { id } = req.params;
        const result = await query('UPDATE systems SET is_active = false WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Sistema não encontrado' });
        }
        res.json({ message: 'Sistema desativado com sucesso' });
    }
    catch (error) {
        console.error('Erro ao desativar sistema:', error);
        res.status(500).json({ error: 'Erro ao desativar sistema' });
    }
});
export default router;
//# sourceMappingURL=systems.routes.js.map