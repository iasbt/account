
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

export interface EmailProvider {
  id: number
  name: string
  type: 'smtp' | 'ses' | 'sendgrid' | 'resend'
  host: string
  port: number
  secure: boolean
  auth_user: string
  from_name: string
  from_email: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface EmailLog {
  id: number
  recipient: string
  subject: string
  template_id?: string
  status: 'pending' | 'sent' | 'failed'
  error?: string
  provider_id?: number
  message_id?: string
  sent_at?: string
  created_at: string
}

export interface EmailStats {
  total: number
  sent: number
  failed: number
  pending: number
  success_rate: number
  trend: { hour: string; sent: number; failed: number }[]
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
  },

  // Email Provider Management
  getEmailProviders: async () => {
    return adminApiClient.get<EmailProvider[]>('/admin/email/providers')
  },

  createEmailProvider: async (data: Partial<EmailProvider>) => {
    return adminApiClient.post<{ success: boolean; provider: EmailProvider }>('/admin/email/providers', data)
  },

  updateEmailProvider: async (id: number, data: Partial<EmailProvider>) => {
    return adminApiClient.put<{ success: boolean; provider: EmailProvider }>(`/admin/email/providers/${id}`, data)
  },

  deleteEmailProvider: async (id: number) => {
    return adminApiClient.delete<{ success: boolean; message: string }>(`/admin/email/providers/${id}`)
  },

  setActiveProvider: async (id: number) => {
    return adminApiClient.post<{ success: boolean; message: string }>(`/admin/email/providers/${id}/enable`, {})
  },

  testProvider: async (id: number, email: string) => {
    return adminApiClient.post<{ success: boolean; message: string }>(`/admin/email/providers/${id}/test`, { email })
  },

  // Email Logs & Stats
  getEmailLogs: async (page = 1, limit = 20) => {
    return adminApiClient.get<{ logs: EmailLog[]; total: number; page: number; totalPages: number }>(`/admin/email/logs?page=${page}&limit=${limit}`)
  },

  getEmailStats: async () => {
    return adminApiClient.get<{ stats: EmailStats }>('/admin/email/stats')
  }
}
