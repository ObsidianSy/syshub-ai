import { apiClient } from './api';

export interface Query {
  id: string;
  user_id: string;
  question: string;
  system_id?: string;
  system_name?: string;
  response?: string;
  response_metadata?: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  execution_time_ms?: number;
  tokens_used?: number;
  is_favorite: boolean;
  created_at: string;
  completed_at?: string;
}

export interface QueryStats {
  total_queries: number;
  completed_queries: number;
  failed_queries: number;
  favorite_queries: number;
  avg_execution_time: number;
  total_tokens: number;
}

export const queriesService = {
  async create(data: {
    question: string;
    systemId?: string;
    systemName?: string;
  }): Promise<Query> {
    return apiClient.post('/queries', data);
  },

  async getAll(params?: {
    status?: string;
    favorite?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ queries: Query[]; total: number; limit: number; offset: number }> {
    const queryParams = new URLSearchParams(params as any).toString();
    return apiClient.get(`/queries${queryParams ? `?${queryParams}` : ''}`);
  },

  async getById(id: string): Promise<Query> {
    return apiClient.get(`/queries/${id}`);
  },

  async update(
    id: string,
    data: {
      response?: string;
      status?: 'pending' | 'processing' | 'completed' | 'failed';
      errorMessage?: string;
      executionTimeMs?: number;
      tokensUsed?: number;
      responseMetadata?: any;
    }
  ): Promise<Query> {
    return apiClient.put(`/queries/${id}`, data);
  },

  async updateResponse(
    id: string,
    response: string,
    status: 'completed' | 'failed' = 'completed'
  ): Promise<Query> {
    return apiClient.put(`/queries/${id}`, { response, status });
  },

  async toggleFavorite(id: string): Promise<Query> {
    return apiClient.post(`/queries/${id}/favorite`, {});
  },

  async delete(id: string): Promise<{ message: string }> {
    return apiClient.delete(`/queries/${id}`);
  },

  async getStats(): Promise<QueryStats> {
    return apiClient.get('/queries/stats/overview');
  },
};
