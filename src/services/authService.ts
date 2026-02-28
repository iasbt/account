import { apiClient } from './apiClient';
import type { AuthUser } from '../types/auth';

interface LoginResponse {
  token: string;
  user: AuthUser;
}

interface RegisterResponse {
  token?: string;
  user?: AuthUser;
  message?: string;
}

export const authService = {
  async login(account: string, password: string): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>('/auth/login', { account, password });
  },

  async register(data: { name: string; email: string; password: string; code?: string }): Promise<RegisterResponse> {
    return apiClient.post<RegisterResponse>('/auth/register', {
      name: data.name,
      email: data.email,
      password: data.password,
      code: data.code,
    });
  },

  async sendVerificationCode(email: string, type: 'register' | 'reset_password' | 'login' = 'register'): Promise<void> {
    return apiClient.post<void>('/auth/send-code', { email, type });
  },

  async authorize(params: {
    client_id: string;
    redirect_uri: string;
    response_type: 'code';
    scope?: string;
    state?: string;
    code_challenge?: string;
    code_challenge_method?: 'S256';
  }): Promise<{ redirect_url: string }> {
    return apiClient.post<{ redirect_url: string }>('/oauth/authorize', params);
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post<{ success: boolean; message: string }>('/auth/change-password', { oldPassword, newPassword });
  },

  async resetPassword(email: string, code: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post<{ success: boolean; message: string }>('/auth/reset-password', { email, code, newPassword });
  },

  async logout(): Promise<void> {
    return apiClient.post<void>('/auth/logout', {});
  }
};
