import { useState } from 'react'
import { UserCircle } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const navigate = useNavigate()
  const loginWithPassword = useAuthStore((state) => state.loginWithPassword)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [searchParams] = useSearchParams()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    // 捕获来源 URL，以便登录后自动跳回
    const from = searchParams.get('from') || searchParams.get('redirect')
    
    try {
      await loginWithPassword(account, password)
      
      // Get the updated user state to check role
      const user = useAuthStore.getState().user

      // 登录成功后的跳转逻辑
      if (from) {
        window.location.href = from
      } else if (user?.isAdmin) {
        // 管理员默认进入后台管理系统 (Admin Box)
        navigate('/admin')
      } else {
        // 普通用户进入应用仪表盘 (User Box)
        navigate('/')
      }
    } catch (err: unknown) {
      const message = err instanceof Error && err.message ? err.message : '登录失败，请检查账号密码'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo Area */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-xl shadow-cyan-500/20">
            <UserCircle className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400">
            统一身份认证
          </h1>
          <p className="text-center text-sm text-slate-400">
            IASBT Unified Account Center
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <input
              type="text"
              placeholder="用户名 / 邮箱"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              className="w-full rounded-xl bg-slate-900/50 border border-slate-800 px-4 py-3.5 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-500/50 focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all"
              required
            />
            <input
              type="password"
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl bg-slate-900/50 border border-slate-800 px-4 py-3.5 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-500/50 focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all"
              required
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full group relative flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-cyan-900/20 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
               <span className="animate-pulse">正在验证...</span>
            ) : (
              <>
                <span>登录</span>
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </>
            )}
          </button>
        </form>

        {/* 注册链接 */}
        <div className="mt-6 flex items-center justify-center gap-2 text-sm">
          <span className="text-slate-500">还没有账号？</span>
          <Link
            to="/register"
            className="font-medium text-cyan-500 hover:text-cyan-400 hover:underline underline-offset-4 transition-colors"
          >
            立即注册
          </Link>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-slate-600">
            Protected by IASBT Security • RBAC Enabled
          </p>
        </div>
      </div>
    </div>
  )
}
