import { Router } from 'express';
import { z } from 'zod';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
const router = Router();
// Todas as rotas requerem autenticação
router.use(authenticateToken);
// POST /api/queries - Criar nova query
router.post('/', async (req, res) => {
    try {
        const querySchema = z.object({
            question: z.string().min(1, 'Pergunta é obrigatória'),
            systemId: z.string().uuid().optional(),
            systemName: z.string().optional(),
        });
        const { question, systemId, systemName } = querySchema.parse(req.body);
        const userId = req.user?.id;
        const result = await query(`INSERT INTO queries (user_id, question, system_id, system_name, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING *`, [userId, question, systemId, systemName]);
        const newQuery = result.rows[0];
        // Log no histórico
        await query(`INSERT INTO query_history (query_id, user_id, action, metadata)
       VALUES ($1, $2, 'created', $3)`, [newQuery.id, userId, JSON.stringify({ question })]);
        res.status(201).json(newQuery);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error('Erro ao criar query:', error);
        res.status(500).json({ error: 'Erro ao criar query' });
    }
});
// GET /api/queries - Listar queries do usuário
router.get('/', async (req, res) => {
    try {
        const userId = req.user?.id;
        const { status, favorite, limit = 50, offset = 0 } = req.query;
        let sql = `
      SELECT q.*, s.name as system_name_full, s.icon as system_icon
      FROM queries q
      LEFT JOIN systems s ON q.system_id = s.id
      WHERE q.user_id = $1
    `;
        const params = [userId];
        let paramCount = 2;
        if (status) {
            sql += ` AND q.status = $${paramCount}`;
            params.push(status);
            paramCount++;
        }
        if (favorite === 'true') {
            sql += ` AND q.is_favorite = true`;
        }
        sql += ` ORDER BY q.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(Number(limit), Number(offset));
        const result = await query(sql, params);
        // Contar total
        const countResult = await query('SELECT COUNT(*) FROM queries WHERE user_id = $1', [userId]);
        res.json({
            queries: result.rows,
            total: Number.parseInt(countResult.rows[0].count),
            limit: Number(limit),
            offset: Number(offset),
        });
    }
    catch (error) {
        console.error('Erro ao buscar queries:', error);
        res.status(500).json({ error: 'Erro ao buscar queries' });
    }
});
// GET /api/queries/:id - Buscar query específica
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const result = await query(`SELECT q.*, s.name as system_name_full, s.icon as system_icon
       FROM queries q
       LEFT JOIN systems s ON q.system_id = s.id
       WHERE q.id = $1 AND q.user_id = $2`, [id, userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Query não encontrada' });
        }
        // Log de visualização
        await query(`INSERT INTO query_history (query_id, user_id, action)
       VALUES ($1, $2, 'viewed')`, [id, userId]);
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Erro ao buscar query:', error);
        res.status(500).json({ error: 'Erro ao buscar query' });
    }
});
// PUT /api/queries/:id - Atualizar query (resposta do agente)
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const updateSchema = z.object({
            response: z.string().optional(),
            status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
            errorMessage: z.string().optional(),
            executionTimeMs: z.number().optional(),
            tokensUsed: z.number().optional(),
            responseMetadata: z.any().optional(),
        });
        const data = updateSchema.parse(req.body);
        const result = await query(`UPDATE queries
       SET response = COALESCE($1, response),
           status = COALESCE($2, status),
           error_message = COALESCE($3, error_message),
           execution_time_ms = COALESCE($4, execution_time_ms),
           tokens_used = COALESCE($5, tokens_used),
           response_metadata = COALESCE($6, response_metadata),
           completed_at = CASE WHEN $2 IN ('completed', 'failed') THEN CURRENT_TIMESTAMP ELSE completed_at END
       WHERE id = $7 AND user_id = $8
       RETURNING *`, [
            data.response,
            data.status,
            data.errorMessage,
            data.executionTimeMs,
            data.tokensUsed,
            data.responseMetadata ? JSON.stringify(data.responseMetadata) : null,
            id,
            userId,
        ]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Query não encontrada' });
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error('Erro ao atualizar query:', error);
        res.status(500).json({ error: 'Erro ao atualizar query' });
    }
});
// POST /api/queries/:id/favorite - Marcar/desmarcar como favorito
router.post('/:id/favorite', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const result = await query(`UPDATE queries
       SET is_favorite = NOT is_favorite
       WHERE id = $1 AND user_id = $2
       RETURNING *`, [id, userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Query não encontrada' });
        }
        const isFavorite = result.rows[0].is_favorite;
        // Log no histórico
        await query(`INSERT INTO query_history (query_id, user_id, action)
       VALUES ($1, $2, $3)`, [id, userId, isFavorite ? 'favorited' : 'unfavorited']);
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Erro ao favoritar query:', error);
        res.status(500).json({ error: 'Erro ao favoritar query' });
    }
});
// DELETE /api/queries/:id - Deletar query
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const result = await query('DELETE FROM queries WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Query não encontrada' });
        }
        res.json({ message: 'Query deletada com sucesso' });
    }
    catch (error) {
        console.error('Erro ao deletar query:', error);
        res.status(500).json({ error: 'Erro ao deletar query' });
    }
});
// GET /api/queries/stats/overview - Estatísticas gerais do usuário
router.get('/stats/overview', async (req, res) => {
    try {
        const userId = req.user?.id;
        const result = await query(`SELECT 
        COUNT(*) as total_queries,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_queries,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_queries,
        COUNT(CASE WHEN is_favorite = true THEN 1 END) as favorite_queries,
        AVG(execution_time_ms) as avg_execution_time,
        SUM(tokens_used) as total_tokens
       FROM queries
       WHERE user_id = $1`, [userId]);
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
});
export default router;
//# sourceMappingURL=queries.routes.js.map