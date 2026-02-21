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

const getAuthBaseUrl = () => {
  const raw = import.meta.env.VITE_AUTH_BASE_URL || ''
  return raw.replace(/\/$/, '')
}

const postJson = async (endpoint: string, body: Record<string, unknown>) => {
  const baseUrl = getAuthBaseUrl()
  const url = `${baseUrl}${endpoint}`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = data?.message || '请求失败'
    throw new Error(message)
  }
  return data
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
        const data = await postJson('/api/auth/login', { account, password })
        set({
          user: data.user,
          isAuthenticated: true
        })
      },
      sendVerificationCode: async (dest) => {
        await postJson('/api/auth/send-code', { email: dest })
      },
      register: async (data) => {
        const payload = {
          name: data.name,
          email: data.email,
          password: data.password,
          code: data.code
        }
        const response = await postJson('/api/auth/register', payload)
        if (response.user) {
          set({
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
    }
  )
)
