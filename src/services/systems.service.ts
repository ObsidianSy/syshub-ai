import { apiClient } from './api';

export interface System {
  id: string;
  name: string;
  slug: string;
  category: string;
  status: 'online' | 'teste' | 'depreciado' | 'offline';
  description: string;
  icon?: string;
  version?: string;
  order_index?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SystemStats {
  total_queries: number;
  completed_queries: number;
  failed_queries: number;
  avg_execution_time: number;
  last_query_at: string;
}

export const systemsService = {
  async getAll(params?: {
    category?: string;
    status?: string;
    search?: string;
  }): Promise<{ systems: System[]; total: number }> {
    const queryParams = new URLSearchParams(params as any).toString();
    return apiClient.get(`/systems${queryParams ? `?${queryParams}` : ''}`);
  },

  async getById(id: string): Promise<System> {
    return apiClient.get(`/systems/${id}`);
  },

  async getBySlug(slug: string): Promise<System> {
    return apiClient.get(`/systems/slug/${slug}`);
  },

  async getStats(id: string): Promise<SystemStats> {
    return apiClient.get(`/systems/${id}/stats`);
  },

  async create(data: Partial<System>): Promise<System> {
    return apiClient.post('/systems', data);
  },

  async update(id: string, data: Partial<System>): Promise<System> {
    return apiClient.put(`/systems/${id}`, data);
  },

  async delete(id: string): Promise<{ message: string }> {
    return apiClient.delete(`/systems/${id}`);
  },
};
