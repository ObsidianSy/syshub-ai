import { apiClient, setToken, removeToken } from './api';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  avatarUrl?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const authService = {
  async register(email: string, password: string, fullName: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', {
      email,
      password,
      fullName,
    });
    setToken(response.token);
    return response;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    console.log('authService.login response:', response);
    setToken(response.token);
    return response;
  },

  async verifyToken(): Promise<{ user: User }> {
    return apiClient.post('/auth/verify');
  },

  logout(): void {
    removeToken();
  },
};
