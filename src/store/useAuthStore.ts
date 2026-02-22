import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authService } from '../services/authService'
import { apiClient } from '../services/apiClient'
import type { AuthUser } from '../types/auth'

export type { AuthUser }

interface AuthState {
  token: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  login: () => Promise<void>
  loginWithPassword: (account: string, password: string) => Promise<void>
  loginAdmin: (account: string, password: string) => Promise<void>
  sendVerificationCode: (dest: string) => Promise<void>
  register: (data: { name: string; email: string; password: string; code?: string }) => Promise<void>
  updateProfile: (data: Partial<AuthUser>) => Promise<void>
  logout: () => void
  handleCallback: (code: string) => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      login: async () => {
        const { user } = get()
        if (!user) {
          throw new Error('未登录')
        }
      },
      loginWithPassword: async (account, password) => {
        const data = await authService.login(account, password)
        if (data.token) {
          apiClient.setToken(data.token)
          set({
            token: data.token,
            user: data.user,
            isAuthenticated: true
          })
        }
      },
      loginAdmin: async (account, password) => {
        const data = await authService.adminLogin(account, password)
        if (data.token) {
          apiClient.setToken(data.token)
          set({
            token: data.token,
            user: data.user,
            isAuthenticated: true
          })
        }
      },
      sendVerificationCode: async (dest) => {
        await authService.sendVerificationCode(dest)
      },
      register: async (data) => {
        const response = await authService.register(data)
        if (response.user) {
          const token = response.token || null
          if (token) {
            apiClient.setToken(token)
          }
          set({
            token,
            user: response.user,
            isAuthenticated: true
          })
        }
      },
      updateProfile: async (data) => {
        const { user } = get()
        if (!user) {
          throw new Error('未登录')
        }
        set({ user: { ...user, ...data } as AuthUser })
      },
      logout: () => {
        apiClient.setToken(null)
        set({ token: null, user: null, isAuthenticated: false })
      },
      handleCallback: async () => {
        throw new Error('暂不支持回调登录')
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          apiClient.setToken(state.token)
        }
      }
    }
  )
)
