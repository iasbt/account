import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types/database.types'

type AuthState = {
  user: User | null
  role: Profile['role'] | null
  session: Session | null
  loading: boolean
  initialized: boolean
  initialize: () => Promise<void>
  syncSession: (
    session: Session | null,
    options?: { silent?: boolean }
  ) => Promise<void>
  refreshSession: () => Promise<void>
  signOut: (options?: { broadcast?: boolean }) => Promise<void>
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
  initialized: false,
  initialize: async () => {
    set({ loading: true })
    try {
      const sessionResult = await supabase.auth.getSession()
      const session = sessionResult.data.session

      if (!session) {
        set({ user: null, session: null, role: null })
        return
      }

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Profile query timeout')), 2000)
      )

      const profileQuery = supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      const profileResult = await Promise.race([
        profileQuery,
        timeoutPromise,
      ]).catch((error) => ({
        data: null,
        error,
      }))

      const profileData = (
        profileResult as { data: { role?: Profile['role'] } | null }
      ).data
      const role = (profileData?.role ?? 'user') as Profile['role']
      set({
        session,
        user: session.user,
        role,
      })
    } catch (error) {
      console.error('Auth Init Error:', error)
      set({ user: null, session: null, role: null })
    } finally {
      set({ loading: false, initialized: true })
    }
  },
  syncSession: async (session, options) => {
    const silent = options?.silent
    if (!silent) {
      set({ loading: true })
    }
    try {
      if (!session) {
        set({ user: null, session: null, role: null })
        return
      }

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Profile query timeout')), 2000)
      )

      const profileQuery = supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      const profileResult = await Promise.race([
        profileQuery,
        timeoutPromise,
      ]).catch((error) => ({
        data: null,
        error,
      }))

      const profileData = (
        profileResult as { data: { role?: Profile['role'] } | null }
      ).data
      const role = (profileData?.role ?? 'user') as Profile['role']

      set({
        session,
        user: session.user,
        role,
      })
    } catch (error) {
      console.error('Auth Init Error:', error)
      set({ user: null, session: null, role: null })
    } finally {
      if (!silent) {
        set({ loading: false })
      }
    }
  },
  refreshSession: async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession()
      if (error) {
        set({ user: null, session: null, role: null })
        return
      }
      await useAuthStore.getState().syncSession(data.session, { silent: true })
    } catch (error) {
      console.error('Auth Refresh Error:', error)
      set({ user: null, session: null, role: null })
    }
  },
  signOut: async (options) => {
    const shouldBroadcast = options?.broadcast !== false
    if (shouldBroadcast) {
      try {
        if (typeof BroadcastChannel !== 'undefined') {
          const channel = new BroadcastChannel('account-auth')
          channel.postMessage({ type: 'signout' })
          channel.close()
        }
        localStorage.setItem('account.signout', String(Date.now()))
      } catch (error) {
        console.error(error)
      }
    }
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error(error)
    } finally {
      set({ user: null, session: null, role: null, loading: false })
      try {
        localStorage.clear()
        sessionStorage.clear()
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
