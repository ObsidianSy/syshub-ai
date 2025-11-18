import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface ConversationDocument {
  id: string;
  name: string;
  type: string; // 'image' | 'pdf' | 'text' | 'document' | 'other'
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: string;
  conversationId: string;
  metadata?: any;
}

/**
 * Lista todos os documentos de uma conversa
 */
export const getConversationDocuments = async (
  conversationId: string
): Promise<ConversationDocument[]> => {
  const token = localStorage.getItem('authToken');
  
  const response = await axios.get(
    `${API_BASE_URL}/api/conversations/${conversationId}/documents`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data.documents;
};

/**
 * Faz upload de um documento para uma conversa
 */
export const uploadConversationDocument = async (
  conversationId: string,
  file: File
): Promise<ConversationDocument> => {
  const token = localStorage.getItem('authToken');
  
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post(
    `${API_BASE_URL}/api/conversations/${conversationId}/documents`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data.document;
};

/**
 * Deleta um documento de uma conversa
 */
export const deleteConversationDocument = async (
  conversationId: string,
  documentId: string
): Promise<void> => {
  const token = localStorage.getItem('authToken');
  
  await axios.delete(
    `${API_BASE_URL}/api/conversations/${conversationId}/documents/${documentId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

/**
 * Faz download de um documento
 */
export const downloadConversationDocument = (
  conversationId: string,
  documentId: string,
  filename: string
) => {
  const token = localStorage.getItem('authToken');
  const url = `${API_BASE_URL}/api/conversations/${conversationId}/documents/${documentId}/download`;

  // Criar link temporário para download
  const link = document.createElement('a');
  link.href = `${url}?token=${token}`;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
