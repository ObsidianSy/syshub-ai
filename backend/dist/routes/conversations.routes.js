import { Router } from 'express';
import { z } from 'zod';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
const router = Router();
// Todas as rotas requerem autenticação
router.use(authenticateToken);
// POST /api/conversations - Criar nova conversa
router.post('/', async (req, res) => {
    try {
        const conversationSchema = z.object({
            title: z.string().optional(),
        });
        const { title } = conversationSchema.parse(req.body);
        const userId = req.user?.id;
        const result = await query(`INSERT INTO conversations (user_id, title)
       VALUES ($1, $2)
       RETURNING *`, [userId, title || 'Nova conversa']);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error('Erro ao criar conversa:', error);
        res.status(500).json({ error: 'Erro ao criar conversa' });
    }
});
// GET /api/conversations - Listar conversas do usuário
router.get('/', async (req, res) => {
    try {
        const userId = req.user?.id;
        const { active = 'true', limit = 20, offset = 0 } = req.query;
        let sql = `
      SELECT c.*, 
        (SELECT COUNT(*) FROM conversation_messages WHERE conversation_id = c.id) as message_count
      FROM conversations c
      WHERE c.user_id = $1
    `;
        const params = [userId];
        let paramCount = 2;
        if (active !== 'all') {
            sql += ` AND c.is_active = $${paramCount}`;
            params.push(active === 'true');
            paramCount++;
        }
        sql += ` ORDER BY c.last_message_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(Number(limit), Number(offset));
        const result = await query(sql, params);
        res.json({
            conversations: result.rows,
            total: result.rows.length,
        });
    }
    catch (error) {
        console.error('Erro ao buscar conversas:', error);
        res.status(500).json({ error: 'Erro ao buscar conversas' });
    }
});
// GET /api/conversations/:id - Buscar conversa específica com mensagens
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const conversationResult = await query('SELECT * FROM conversations WHERE id = $1 AND user_id = $2', [id, userId]);
        if (conversationResult.rows.length === 0) {
            return res.status(404).json({ error: 'Conversa não encontrada' });
        }
        const messagesResult = await query(`SELECT m.*, s.name as system_name, s.icon as system_icon
       FROM conversation_messages m
       LEFT JOIN systems s ON m.system_id = s.id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at ASC`, [id]);
        res.json({
            conversation: conversationResult.rows[0],
            messages: messagesResult.rows,
        });
    }
    catch (error) {
        console.error('Erro ao buscar conversa:', error);
        res.status(500).json({ error: 'Erro ao buscar conversa' });
    }
});
// POST /api/conversations/:id/messages - Adicionar mensagem à conversa
router.post('/:id/messages', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const messageSchema = z.object({
            role: z.enum(['user', 'assistant', 'system']),
            content: z.string().min(1),
            systemId: z.string().uuid().optional(),
            metadata: z.any().optional(),
        });
        const { role, content, systemId, metadata } = messageSchema.parse(req.body);
        // Verificar se a conversa pertence ao usuário
        const conversationCheck = await query('SELECT id FROM conversations WHERE id = $1 AND user_id = $2', [id, userId]);
        if (conversationCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Conversa não encontrada' });
        }
        const result = await query(`INSERT INTO conversation_messages (conversation_id, role, content, system_id, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`, [id, role, content, systemId, metadata ? JSON.stringify(metadata) : null]);
        // Atualizar last_message_at da conversa
        await query('UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error('Erro ao adicionar mensagem:', error);
        res.status(500).json({ error: 'Erro ao adicionar mensagem' });
    }
});
// PUT /api/conversations/:id - Atualizar conversa
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const updateSchema = z.object({
            title: z.string().optional(),
            isActive: z.boolean().optional(),
        });
        const { title, isActive } = updateSchema.parse(req.body);
        const result = await query(`UPDATE conversations
       SET title = COALESCE($1, title),
           is_active = COALESCE($2, is_active)
       WHERE id = $3 AND user_id = $4
       RETURNING *`, [title, isActive, id, userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Conversa não encontrada' });
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error('Erro ao atualizar conversa:', error);
        res.status(500).json({ error: 'Erro ao atualizar conversa' });
    }
});
// DELETE /api/conversations/:id - Deletar conversa
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const result = await query('DELETE FROM conversations WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Conversa não encontrada' });
        }
        res.json({ message: 'Conversa deletada com sucesso' });
    }
    catch (error) {
        console.error('Erro ao deletar conversa:', error);
        res.status(500).json({ error: 'Erro ao deletar conversa' });
    }
});
export default router;
//# sourceMappingURL=conversations.routes.js.map