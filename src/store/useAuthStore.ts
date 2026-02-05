import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import type { Profile } from '../types/database.types'

type AuthState = {
  user: User | null
  role: Profile['role'] | null
  session: Session | null
  loading: boolean
  setUser: (user: User | null) => void
  setRole: (role: Profile['role'] | null) => void
  setSession: (session: Session | null) => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  session: null,
  loading: true,
  setUser: (user) => set({ user }),
  setRole: (role) => set({ role }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),
}))
