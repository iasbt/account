
import { adminApiClient } from './apiClient'
import type { AuthUser } from '../types/auth'

export interface AdminUser {
  id: string
  email: string
  username: string
  created_at: string
  is_admin?: boolean
}

export interface AdminUsersResponse {
  success: boolean
  users: AdminUser[]
}

export interface EmailTemplate {
  id: number
  type: string
  subject: string
  content: string
  variables: string[]
  updated_at: string
}

interface LoginResponse {
  token: string
  user: AuthUser
}

export interface SystemStatus {
  nodeVersion: string
  uptime: number
  memoryUsage: {
    rss: number
    heapTotal: number
    heapUsed: number
    external: number
  }
  dbConnection: string
  environment: string
  smtp: {
    host: string
    port: number
    user: string
  }
}

export const adminService = {
  login: async (account: string, password: string): Promise<LoginResponse> => {
    return adminApiClient.post<LoginResponse>('/admin/auth/login', { account, password });
  },

  getUsers: async () => {
    return adminApiClient.get<AdminUsersResponse>('/admin/users')
  },
  
  deleteUser: async (id: string) => {
    return adminApiClient.delete<{ success: boolean; message: string }>(`/admin/users/${id}`)
  },

  updateUser: async (id: string, data: Partial<AdminUser>) => {
    return adminApiClient.put<{ success: boolean; message: string; user: AdminUser }>(`/admin/users/${id}`, data)
  },

  resetUserPassword: async (id: string) => {
    return adminApiClient.post<{ success: boolean; message: string }>(`/admin/users/${id}/reset-password`, {})
  },

  getSystemStatus: async () => {
    return adminApiClient.get<{ success: boolean; status: SystemStatus }>('/admin/system/status')
  },

  sendTestEmail: async (email: string, type: string) => {
    return adminApiClient.post<{ success: boolean; message: string }>('/admin/email/test', { email, type })
  },

  getTemplates: async () => {
    return adminApiClient.get<EmailTemplate[]>('/admin/email/templates')
  },

  updateTemplate: async (type: string, data: { subject: string, content: string }) => {
    return adminApiClient.put<EmailTemplate>(`/admin/email/templates/${type}`, data)
  }
}
