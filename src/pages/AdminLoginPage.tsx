import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { useNavigate } from 'react-router-dom'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const loginAdmin = useAuthStore((state) => state.loginAdmin)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      await loginAdmin(account, password)
      navigate('/admin')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '登录失败，请稍后重试'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-500 to-cyan-500 shadow-xl shadow-blue-500/20">
            <ShieldCheck className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            管理员入口
          </h1>
          <p className="text-center text-sm text-gray-500">
            IASBT Admin Control Center
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <input
              type="text"
              placeholder="管理员邮箱"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              autoComplete="username"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500/60 focus:outline-none focus:ring-1 focus:ring-blue-500/40 transition-all"
              required
            />
            <input
              type="password"
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500/60 focus:outline-none focus:ring-1 focus:ring-blue-500/40 transition-all"
              required
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full group relative flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-200/40 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="animate-pulse">正在验证...</span>
            ) : (
              <>
                <span>登录管理台</span>
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
