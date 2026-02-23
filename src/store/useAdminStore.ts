import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { adminService } from '../services/adminService'
import { adminApiClient } from '../services/apiClient'
import type { AuthUser } from '../types/auth'

interface AdminState {
  token: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  login: (account: string, password: string) => Promise<void>
  logout: () => void
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      login: async (account, password) => {
        const data = await adminService.login(account, password)
        if (data.token) {
          adminApiClient.setToken(data.token)
          set({
            token: data.token,
            user: data.user,
            isAuthenticated: true
          })
        }
      },
      logout: () => {
        adminApiClient.setToken(null)
        set({ token: null, user: null, isAuthenticated: false })
      },
    }),
    {
      name: 'admin-auth-storage', // Separate storage key
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          adminApiClient.setToken(state.token)
        }
      }
    }
  )
)
