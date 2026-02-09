import { supabase } from '../../../lib/supabase'
import { useAuthStore } from '../../../store/useAuthStore'
import { recordMetric } from '../utils/metrics'

type AuthResult<T> = {
  data: T | null
  error: Error | null
}

export function useAuth() {
  const setLoading = useAuthStore((state) => state.setLoading)
  const storeSignOut = useAuthStore((state) => state.signOut)
  const user = useAuthStore((state) => state.user)

  const recordAudit = async (userId: string, appId: string, appName: string) => {
    try {
      await supabase.from('user_app_access').insert({
        user_id: userId,
        app_id: appId,
        app_name: appName,
        last_accessed_at: new Date().toISOString(),
      })
    } catch {
      return
    }
  }

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
      if (data?.session?.user?.id) {
        await recordAudit(data.session.user.id, 'account.login', 'Account Login')
        recordMetric(localStorage, 'login_success')
      }
      return { data, error: null }
    } catch (error) {
      const normalizedError =
        error instanceof Error ? error : new Error('登录失败')
      recordMetric(localStorage, 'login_failure')
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
      if (data?.session?.user?.id) {
        await recordAudit(data.session.user.id, 'account.signup', 'Account Signup')
        recordMetric(localStorage, 'signup_success')
      }
      return { data, error: null }
    } catch (error) {
      const normalizedError =
        error instanceof Error ? error : new Error('注册失败')
      recordMetric(localStorage, 'signup_failure')
      return { data: null, error: normalizedError }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async (): Promise<AuthResult<boolean>> => {
    try {
      if (user?.id) {
        await recordAudit(user.id, 'account.logout', 'Account Logout')
        recordMetric(localStorage, 'logout_count')
      }
      await storeSignOut()
      return { data: true, error: null }
    } catch (error) {
      const normalizedError =
        error instanceof Error ? error : new Error('登出失败')
      return { data: null, error: normalizedError }
    }
  }

  return { signInWithEmail, signUp, signOut }
}
