import { apiClient } from './api';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  avatar_url?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
}

export interface UserStats {
  total_queries: number;
  completed_queries: number;
  favorite_queries: number;
  total_conversations: number;
  avg_execution_time: number;
  total_tokens_used: number;
}

export interface UserActivity {
  type: 'query' | 'conversation';
  id: string;
  title: string;
  created_at: string;
  system_name?: string;
}

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'user' | 'viewer';
  isActive: boolean;
  createdAt: string;
}

export const usersService = {
  async getProfile(): Promise<UserProfile> {
    return apiClient.get('/users/me');
  },

  async getStats(): Promise<UserStats> {
    return apiClient.get('/users/me/stats');
  },

  async getActivity(limit = 10): Promise<UserActivity[]> {
    return apiClient.get(`/users/me/activity?limit=${limit}`);
  },

  async updateProfile(data: {
    fullName?: string;
    avatarUrl?: string;
  }): Promise<UserProfile> {
    return apiClient.put('/users/me', data);
  },

  async getAllUsers(): Promise<AdminUser[]> {
    return apiClient.get('/users');
  },

  async createUser(data: {
    email: string;
    password: string;
    fullName: string;
    role: 'admin' | 'user' | 'viewer';
  }): Promise<AdminUser> {
    return apiClient.post('/users', data);
  },

  async deleteUser(userId: string): Promise<void> {
    return apiClient.delete(`/users/${userId}`);
  },
};
