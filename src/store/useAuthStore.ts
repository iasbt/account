import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types/database.types'

type AuthState = {
  user: User | null
  role: Profile['role'] | null
  session: Session | null
  loading: boolean
  initialize: () => Promise<void>
  syncSession: (session: Session | null) => Promise<void>
  signOut: () => Promise<void>
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
  initialize: async () => {
    set({ loading: true })
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        set({ user: null, session: null, role: null })
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      const role = (profile?.role ?? 'user') as Profile['role']

      set({
        session,
        user: session.user,
        role,
      })
    } catch (error) {
      console.error('Auth Init Error:', error)
      set({ user: null, session: null, role: null })
    } finally {
      set({ loading: false })
    }
  },
  syncSession: async (session) => {
    set({ loading: true })
    try {
      if (!session) {
        set({ user: null, session: null, role: null })
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      const role = (profile?.role ?? 'user') as Profile['role']

      set({
        session,
        user: session.user,
        role,
      })
    } catch (error) {
      console.error('Auth Init Error:', error)
      set({ user: null, session: null, role: null })
    } finally {
      set({ loading: false })
    }
  },
  signOut: async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error(error)
    } finally {
      set({ user: null, session: null, role: null, loading: false })
      try {
        localStorage.clear()
      } catch (error) {
        console.error(error)
      }
      window.location.href = '/login'
    }
  },
  setUser: (user) => set({ user }),
  setRole: (role) => set({ role }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),
}))
