// API Configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Token management
export const getToken = (): string | null => {
  const t = localStorage.getItem('authToken');
  // debug
  // console.log('api.getToken ->', !!t);
  return t;
};

export const setToken = (token: string): void => {
  localStorage.setItem('authToken', token);
  // debug
  console.log('api.setToken stored token:', token ? token.substring(0, 10) + '...' : null);
};

export const removeToken = (): void => {
  localStorage.removeItem('authToken');
};

// API Client
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: 'Erro desconhecido',
      }));
      const msg = error && error.error !== undefined
        ? (typeof error.error === 'string' ? error.error : JSON.stringify(error.error))
        : `HTTP ${response.status}`;
      throw new Error(msg);
    }

    const text = await response.text();
    if (!text || text.trim() === '') {
      return {} as T;
    }
    return JSON.parse(text);
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_URL);
