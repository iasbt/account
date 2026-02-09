import { useEffect, useMemo, useState } from 'react'
import { Loader2, LogIn, UserPlus } from 'lucide-react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  resolvePostLoginDestination,
  resolveReferrerRedirect,
} from '../utils/redirect'
import { recordMetric } from '../utils/metrics'
import { useAuthStore } from '../../../store/useAuthStore'

type Mode = 'login' | 'signup'

export default function LoginForm() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const loading = useAuthStore((state) => state.loading)
  const { signInWithEmail, signUp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const redirectUrl = searchParams.get('redirect')
  const allowlistRaw = import.meta.env.VITE_SSO_REDIRECT_ALLOWLIST ?? ''
  const allowedHosts = allowlistRaw
    .split(',')
    .map((item: string) => item.trim())
    .filter(Boolean)
  const fromState = (
    location.state as
      | { from?: { pathname?: string; search?: string; hash?: string } }
      | null
  )?.from
  const fromPath =
    fromState?.pathname && fromState.pathname !== '/login'
      ? `${fromState.pathname ?? ''}${fromState.search ?? ''}${fromState.hash ?? ''}`
      : '/'

  const referrerRedirect = useMemo(() => {
    return resolveReferrerRedirect({
      referrer: document.referrer,
      allowedHosts,
      baseOrigin: window.location.origin,
    })
  }, [allowedHosts])

  const referrerOrigin = useMemo(() => {
    if (!document.referrer) return null
    try {
      return new URL(document.referrer).origin
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    try {
      if (!sessionStorage.getItem('login_start_ts')) {
        sessionStorage.setItem('login_start_ts', String(Date.now()))
      }
    } catch {
      return
    }
  }, [])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!email || !password) {
      setError('请输入邮箱和密码')
      return
    }

    const result =
      mode === 'login'
        ? await signInWithEmail(email, password)
        : await signUp(email, password)

    if (result.error) {
      setError(result.error.message || '操作失败')
      return
    }

    const { destination, error: redirectError } = resolvePostLoginDestination({
      redirectUrl: redirectUrl ?? referrerRedirect,
      allowedHosts,
      baseOrigin: window.location.origin,
      fromPath,
      referrerOrigin,
    })

    if (redirectError) {
      recordMetric(localStorage, 'redirect_blocked')
      setError(redirectError)
      return
    }

    try {
      const start = sessionStorage.getItem('login_start_ts')
      if (start) {
        const duration = Date.now() - Number(start)
        recordMetric(localStorage, 'login_duration_ms', Math.max(0, duration))
        sessionStorage.removeItem('login_start_ts')
      }
    } catch {
      return
    }

    if (destination?.kind === 'external') {
      window.location.href = destination.url
      return
    }

    navigate(destination?.url ?? '/', { replace: true })
  }

  const isLogin = mode === 'login'

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 shadow-2xl shadow-black/30">
        <div className="p-8">
          <div className="flex items-center justify-center gap-2 text-xl font-semibold">
            {isLogin ? <LogIn className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
            <span>{isLogin ? '登录 Unified Account' : '注册 Unified Account'}</span>
          </div>
          <p className="mt-2 text-center text-sm text-slate-400">
            {isLogin ? '使用邮箱与密码进入统一身份认证中心' : '创建账号以访问所有应用'}
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm text-slate-300">邮箱</label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-300">密码</label>
              <input
                type="password"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
                placeholder="至少 6 位"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              <span className="flex items-center justify-center gap-2">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isLogin ? '登录' : '注册'}
              </span>
            </button>
          </form>

          {error && (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {error}
            </div>
          )}

          <div className="mt-6 text-center text-sm text-slate-400">
            {isLogin ? '没有账号？' : '已有账号？'}
            <button
              type="button"
              onClick={() => setMode(isLogin ? 'signup' : 'login')}
              className="ml-2 text-cyan-300 hover:text-cyan-200"
            >
              {isLogin ? '点击注册' : '点击登录'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
