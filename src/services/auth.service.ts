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
    
    if (!response.token) {
      throw new Error('Token não recebido do servidor');
    }
    
    if (!response.user || !response.user.id) {
      throw new Error('Dados do usuário inválidos');
    }
    
    setToken(response.token);
    console.log('✅ Token armazenado, usuário:', response.user.email);
    return response;
  },

  async verifyToken(): Promise<{ user: User }> {
    try {
      return await apiClient.post('/auth/verify');
    } catch (error) {
      console.error('Erro ao verificar token:', error);
      removeToken();
      throw error;
    }
  },

  logout(): void {
    removeToken();
    console.log('🚪 Logout realizado, token removido');
  },
};
