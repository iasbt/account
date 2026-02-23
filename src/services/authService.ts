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

interface SsoTokenResponse {
  token: string;
  email: string;
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

  async sendVerificationCode(email: string): Promise<void> {
    return apiClient.post<void>('/auth/send-code', { email });
  },

  async getSsoToken(): Promise<SsoTokenResponse> {
    return apiClient.get<SsoTokenResponse>('/auth/sso-token');
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post<{ success: boolean; message: string }>('/auth/change-password', { oldPassword, newPassword });
  },

  async resetPassword(email: string, code: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post<{ success: boolean; message: string }>('/auth/reset-password', { email, code, newPassword });
  }
};
