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
  }
}
