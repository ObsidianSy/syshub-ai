import { apiClient } from './api';

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  is_active: boolean;
  last_message_at: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
}

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  system_id?: string;
  system_name?: string;
  system_icon?: string;
  metadata?: any;
  created_at: string;
}

export const conversationsService = {
  async create(title?: string): Promise<Conversation> {
    return apiClient.post('/conversations', { title });
  },

  async getAll(params?: {
    active?: boolean | 'all';
    limit?: number;
    offset?: number;
  }): Promise<{ conversations: Conversation[]; total: number }> {
    const queryParams = new URLSearchParams(params as any).toString();
    return apiClient.get(`/conversations${queryParams ? `?${queryParams}` : ''}`);
  },

  async getById(id: string): Promise<{
    conversation: Conversation;
    messages: ConversationMessage[];
  }> {
    return apiClient.get(`/conversations/${id}`);
  },

  async addMessage(
    conversationId: string,
    data: {
      role: 'user' | 'assistant' | 'system';
      content: string;
      systemId?: string;
      metadata?: any;
    }
  ): Promise<ConversationMessage> {
    return apiClient.post(`/conversations/${conversationId}/messages`, data);
  },

  async update(
    id: string,
    data: {
      title?: string;
      isActive?: boolean;
    }
  ): Promise<Conversation> {
    return apiClient.put(`/conversations/${id}`, data);
  },

  async delete(id: string): Promise<{ message: string }> {
    return apiClient.delete(`/conversations/${id}`);
  },
};
