import { Router } from 'express';
import { z } from 'zod';
import db from '../config/sqlite.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// POST /api/conversations - Criar nova conversa
router.post('/', async (req: AuthRequest, res) => {
  try {
    const conversationSchema = z.object({
      title: z.string().optional(),
    });

    const { title } = conversationSchema.parse(req.body);
    const userId = req.user?.id;

    const result = db.prepare(`
      INSERT INTO conversations (user_id, title)
      VALUES (?, ?)
    `).run(userId, title || 'Nova conversa');

    const conversation = db.prepare(`
      SELECT * FROM conversations WHERE id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(conversation);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Erro ao criar conversa:', error);
    res.status(500).json({ error: 'Erro ao criar conversa' });
  }
});

// GET /api/conversations - Listar conversas do usuário
router.get('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const { active = 'true', limit = 20, offset = 0 } = req.query;

    let sql = `
      SELECT c.*, 
        (SELECT COUNT(*) FROM conversation_messages WHERE conversation_id = c.id) as message_count
      FROM conversations c
      WHERE c.user_id = ?
    `;
    const params: any[] = [userId];

    if (active === 'true') {
      sql += ' AND c.is_active = 1';
    }

    sql += ' ORDER BY c.last_message_at DESC, c.created_at DESC';
    sql += ` LIMIT ${limit} OFFSET ${offset}`;

    const conversations = db.prepare(sql).all(...params);

    const total = db.prepare(
      'SELECT COUNT(*) as count FROM conversations WHERE user_id = ? AND is_active = 1'
    ).get(userId) as { count: number };

    res.json({
      conversations,
      total: total.count,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error) {
    console.error('Erro ao listar conversas:', error);
    res.status(500).json({ error: 'Erro ao listar conversas' });
  }
});

// GET /api/conversations/:id - Buscar conversa específica com mensagens
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const conversation = db.prepare(
      'SELECT * FROM conversations WHERE id = ? AND user_id = ?'
    ).get(id, userId);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversa não encontrada' });
    }

    const messages = db.prepare(`
      SELECT * FROM conversation_messages
      WHERE conversation_id = ?
      ORDER BY created_at ASC
    `).all(id);

    res.json({
      ...conversation,
      messages,
    });
  } catch (error) {
    console.error('Erro ao buscar conversa:', error);
    res.status(500).json({ error: 'Erro ao buscar conversa' });
  }
});

// POST /api/conversations/:id/messages - Adicionar mensagem à conversa
router.post('/:id/messages', async (req: AuthRequest, res) => {
  try {
    const messageSchema = z.object({
      content: z.string().min(1, 'Conteúdo é obrigatório'),
      role: z.enum(['user', 'assistant', 'system']),
    });

    const { content, role } = messageSchema.parse(req.body);
    const { id } = req.params;
    const userId = req.user?.id;

    // Verificar se a conversa existe e pertence ao usuário
    const conversation = db.prepare(
      'SELECT id FROM conversations WHERE id = ? AND user_id = ?'
    ).get(id, userId);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversa não encontrada' });
    }

    // Inserir mensagem
    const result = db.prepare(`
      INSERT INTO conversation_messages (conversation_id, role, content)
      VALUES (?, ?, ?)
    `).run(id, role, content);

    // Atualizar timestamp da conversa
    db.prepare(`
      UPDATE conversations SET last_message_at = datetime('now') WHERE id = ?
    `).run(id);

    const message = db.prepare(
      'SELECT * FROM conversation_messages WHERE id = ?'
    ).get(result.lastInsertRowid);

    res.status(201).json(message);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Erro ao adicionar mensagem:', error);
    res.status(500).json({ error: 'Erro ao adicionar mensagem' });
  }
});

// PUT /api/conversations/:id - Atualizar conversa
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const updateSchema = z.object({
      title: z.string().optional(),
      is_active: z.boolean().optional(),
    });

    const data = updateSchema.parse(req.body);
    const { id } = req.params;
    const userId = req.user?.id;

    const fields: string[] = [];
    const values: any[] = [];

    if (data.title !== undefined) {
      fields.push('title = ?');
      values.push(data.title);
    }
    if (data.is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(data.is_active ? 1 : 0);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    values.push(id, userId);

    const result = db.prepare(`
      UPDATE conversations
      SET ${fields.join(', ')}
      WHERE id = ? AND user_id = ?
    `).run(...values);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Conversa não encontrada' });
    }

    const conversation = db.prepare(
      'SELECT * FROM conversations WHERE id = ?'
    ).get(id);

    res.json(conversation);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Erro ao atualizar conversa:', error);
    res.status(500).json({ error: 'Erro ao atualizar conversa' });
  }
});

// DELETE /api/conversations/:id - Deletar conversa
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const result = db.prepare(
      'DELETE FROM conversations WHERE id = ? AND user_id = ?'
    ).run(id, userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Conversa não encontrada' });
    }

    res.json({ success: true, id });
  } catch (error) {
    console.error('Erro ao deletar conversa:', error);
    res.status(500).json({ error: 'Erro ao deletar conversa' });
  }
});

export default router;
