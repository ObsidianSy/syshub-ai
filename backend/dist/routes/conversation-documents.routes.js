import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import db from "../config/sqlite.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
const router = Router();
// Todas as rotas requerem autenticação
router.use(authenticateToken);
// Configurar multer para upload de arquivos
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), "uploads", "conversations");
        await fs.mkdir(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});
const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
    },
    fileFilter: (req, file, cb) => {
        // Permitir imagens, PDFs e documentos
        const allowedMimes = [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
            "application/pdf",
            "text/plain",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error("Tipo de arquivo não permitido"));
        }
    },
});
// Helper para determinar tipo de arquivo
const getFileType = (mimetype) => {
    if (mimetype.startsWith("image/"))
        return "image";
    if (mimetype === "application/pdf")
        return "pdf";
    if (mimetype.startsWith("text/"))
        return "text";
    if (mimetype.includes("word") ||
        mimetype.includes("document") ||
        mimetype.includes("msword"))
        return "document";
    return "other";
};
/**
 * GET /api/conversations/:conversationId/documents
 * Lista todos os documentos de uma conversa
 */
router.get("/:conversationId/documents", async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user?.id;
        // Verificar se a conversa pertence ao usuário
        const conversationCheck = db.prepare("SELECT user_id FROM conversations WHERE id = ?").get(conversationId);
        if (!conversationCheck) {
            return res.status(404).json({ error: "Conversa não encontrada" });
        }
        if (conversationCheck.user_id !== userId) {
            return res.status(403).json({ error: "Acesso negado" });
        }
        // Buscar documentos
        const documents = db.prepare(`SELECT 
        id, 
        filename,
        original_filename,
        file_type,
        mime_type,
        file_size,
        storage_path,
        file_data,
        metadata,
        created_at
      FROM conversation_documents 
      WHERE conversation_id = ?
      ORDER BY created_at DESC`).all(conversationId);
        // Adicionar URL de acesso
        const documentsWithUrls = documents.map((doc) => ({
            id: doc.id,
            name: doc.original_filename,
            type: doc.file_type,
            mimeType: doc.mime_type,
            size: doc.file_size,
            url: doc.file_data
                ? `data:${doc.mime_type};base64,${doc.file_data}`
                : `/api/conversations/${conversationId}/documents/${doc.id}/download`,
            uploadedAt: doc.created_at,
            conversationId,
            metadata: doc.metadata ? JSON.parse(doc.metadata) : null,
        }));
        res.json({ documents: documentsWithUrls });
    }
    catch (error) {
        console.error("Erro ao listar documentos:", error);
        res.status(500).json({ error: "Erro ao listar documentos" });
    }
});
/**
 * POST /api/conversations/:conversationId/documents
 * Faz upload de um documento
 */
router.post("/:conversationId/documents", upload.single("file"), async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user?.id;
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: "Nenhum arquivo enviado" });
        }
        // Verificar se a conversa pertence ao usuário
        const conversationCheck = db.prepare("SELECT user_id FROM conversations WHERE id = ?").get(conversationId);
        if (!conversationCheck) {
            return res.status(404).json({ error: "Conversa não encontrada" });
        }
        if (conversationCheck.user_id !== userId) {
            return res.status(403).json({ error: "Acesso negado" });
        }
        const documentId = uuidv4();
        const fileType = getFileType(file.mimetype);
        // Se arquivo for pequeno (<1MB), armazenar como base64
        let fileData = null;
        let storagePath = file.path;
        if (file.size < 1024 * 1024) {
            const fileBuffer = await fs.readFile(file.path);
            fileData = fileBuffer.toString("base64");
            // Remover arquivo físico se armazenado como base64
            await fs.unlink(file.path);
            storagePath = null;
        }
        // Metadados extras
        const metadata = {
            uploadIp: req.ip,
            userAgent: req.headers["user-agent"],
        };
        // Inserir no banco
        db.prepare(`INSERT INTO conversation_documents (
        id, 
        conversation_id, 
        user_id, 
        filename, 
        original_filename, 
        file_type, 
        mime_type, 
        file_size, 
        storage_path,
        file_data,
        metadata,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`).run(documentId, conversationId, userId, file.filename, file.originalname, fileType, file.mimetype, file.size, storagePath, fileData, JSON.stringify(metadata));
        // Retornar documento criado
        const document = {
            id: documentId,
            name: file.originalname,
            type: fileType,
            mimeType: file.mimetype,
            size: file.size,
            url: fileData
                ? `data:${file.mimetype};base64,${fileData}`
                : `/api/conversations/${conversationId}/documents/${documentId}/download`,
            uploadedAt: new Date().toISOString(),
            conversationId,
        };
        res.status(201).json({ document });
    }
    catch (error) {
        console.error("Erro ao fazer upload:", error);
        res.status(500).json({ error: "Erro ao fazer upload do arquivo" });
    }
});
/**
 * GET /api/conversations/:conversationId/documents/:documentId/download
 * Faz download de um documento
 */
router.get("/:conversationId/documents/:documentId/download", async (req, res) => {
    try {
        const { conversationId, documentId } = req.params;
        const userId = req.user?.id;
        // Verificar acesso
        const conversationCheck = db.prepare("SELECT user_id FROM conversations WHERE id = ?").get(conversationId);
        if (!conversationCheck || conversationCheck.user_id !== userId) {
            return res.status(403).json({ error: "Acesso negado" });
        }
        // Buscar documento
        const document = db.prepare(`SELECT 
        filename,
        original_filename,
        mime_type,
        storage_path,
        file_data
      FROM conversation_documents 
      WHERE id = ? AND conversation_id = ?`).get(documentId, conversationId);
        if (!document) {
            return res.status(404).json({ error: "Documento não encontrado" });
        }
        // Se tiver file_data (base64), retornar direto
        if (document.file_data) {
            const buffer = Buffer.from(document.file_data, "base64");
            res.setHeader("Content-Type", document.mime_type);
            res.setHeader("Content-Disposition", `attachment; filename="${document.original_filename}"`);
            return res.send(buffer);
        }
        // Se tiver storage_path, ler do filesystem
        if (document.storage_path) {
            res.setHeader("Content-Type", document.mime_type);
            res.setHeader("Content-Disposition", `attachment; filename="${document.original_filename}"`);
            return res.sendFile(path.resolve(document.storage_path));
        }
        res.status(404).json({ error: "Arquivo não encontrado" });
    }
    catch (error) {
        console.error("Erro ao fazer download:", error);
        res.status(500).json({ error: "Erro ao fazer download" });
    }
});
/**
 * DELETE /api/conversations/:conversationId/documents/:documentId
 * Deleta um documento
 */
router.delete("/:conversationId/documents/:documentId", async (req, res) => {
    try {
        const { conversationId, documentId } = req.params;
        const userId = req.user?.id;
        // Verificar acesso
        const conversationCheck = db.prepare("SELECT user_id FROM conversations WHERE id = ?").get(conversationId);
        if (!conversationCheck || conversationCheck.user_id !== userId) {
            return res.status(403).json({ error: "Acesso negado" });
        }
        // Buscar documento
        const document = db.prepare("SELECT storage_path FROM conversation_documents WHERE id = ? AND conversation_id = ?").get(documentId, conversationId);
        if (!document) {
            return res.status(404).json({ error: "Documento não encontrado" });
        }
        // Deletar arquivo físico se existir
        if (document.storage_path) {
            try {
                await fs.unlink(document.storage_path);
            }
            catch (err) {
                console.error("Erro ao deletar arquivo físico:", err);
            }
        }
        // Deletar do banco
        db.prepare("DELETE FROM conversation_documents WHERE id = ? AND conversation_id = ?").run(documentId, conversationId);
        res.json({ success: true, message: "Documento deletado com sucesso" });
    }
    catch (error) {
        console.error("Erro ao deletar documento:", error);
        res.status(500).json({ error: "Erro ao deletar documento" });
    }
});
export default router;
//# sourceMappingURL=conversation-documents.routes.js.map