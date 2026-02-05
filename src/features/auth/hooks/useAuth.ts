import { supabase } from '../../../lib/supabase'
import { useAuthStore } from '../../../store/useAuthStore'

type AuthResult<T> = {
  data: T | null
  error: Error | null
}

export function useAuth() {
  const setLoading = useAuthStore((state) => state.setLoading)

  const signInWithEmail = async (
    email: string,
    password: string
  ): Promise<AuthResult<Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>['data']>> => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      const normalizedError =
        error instanceof Error ? error : new Error('登录失败')
      return { data: null, error: normalizedError }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (
    email: string,
    password: string
  ): Promise<AuthResult<Awaited<ReturnType<typeof supabase.auth.signUp>>['data']>> => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      const normalizedError =
        error instanceof Error ? error : new Error('注册失败')
      return { data: null, error: normalizedError }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async (): Promise<AuthResult<boolean>> => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { data: true, error: null }
    } catch (error) {
      const normalizedError =
        error instanceof Error ? error : new Error('登出失败')
      return { data: null, error: normalizedError }
    } finally {
      setLoading(false)
    }
  }

  return { signInWithEmail, signUp, signOut }
}
