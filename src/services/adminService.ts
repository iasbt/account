import { apiClient } from './apiClient'

export interface AdminUser {
  id: string
  email: string
  username: string
  created_at: string
}

export interface AdminUsersResponse {
  success: boolean
  users: AdminUser[]
}

export const adminService = {
  getUsers: async () => {
    return apiClient.get<AdminUsersResponse>('/admin/users')
  },
  
  deleteUser: async (id: string) => {
    return apiClient.delete<{ success: boolean; message: string }>(`/admin/users/${id}`)
  },

  updateUser: async (id: string, data: Partial<AdminUser>) => {
    return apiClient.put<{ success: boolean; message: string; user: AdminUser }>(`/admin/users/${id}`, data)
  },

  resetUserPassword: async (id: string) => {
    return apiClient.post<{ success: boolean; message: string }>(`/admin/users/${id}/reset-password`, {})
  }
}
