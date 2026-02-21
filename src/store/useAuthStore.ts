import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AuthUser {
  id: string
  name: string
  displayName: string
  avatar: string
  email: string
  isAdmin?: boolean
}

interface AuthState {
  token: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  login: () => Promise<void>
  loginWithPassword: (account: string, password: string) => Promise<void>
  sendVerificationCode: (dest: string) => Promise<void>
  register: (data: { name: string; email: string; password: string; displayName?: string; code?: string }) => Promise<void>
  updateProfile: (data: Partial<AuthUser>) => Promise<void>
  logout: () => void
  handleCallback: (code: string) => Promise<void>
}

const notConfigured = () => {
  throw new Error('认证服务未配置')
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      login: async () => notConfigured(),
      loginWithPassword: async () => notConfigured(),
      sendVerificationCode: async () => notConfigured(),
      register: async () => notConfigured(),
      updateProfile: async (data) => {
        const { user } = get()
        if (!user) {
          throw new Error('未登录')
        }
        set({ user: { ...user, ...data } as AuthUser })
      },
      logout: () => {
        set({ token: null, user: null, isAuthenticated: false })
      },
      handleCallback: async () => notConfigured(),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
