import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { useAdminStore } from '../store/useAdminStore'
import { useNavigate } from 'react-router-dom'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const login = useAdminStore((state) => state.login)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      await login(account, password)
      navigate('/admin')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '登录失败，请稍后重试'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background-light text-text-primary flex items-center justify-center p-4 font-sans antialiased">
      <div className="w-full max-w-[360px]">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-black text-white shadow-lg">
            <ShieldCheck className="h-7 w-7" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary mb-1">
            管理后台
          </h1>
          <p className="text-sm text-text-secondary">
            IASBT 管理控制中心
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white p-6 rounded-2xl shadow-apple-card border border-border-subtle">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-1">
                <input
                  type="text"
                  placeholder="管理员账号"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  autoComplete="username"
                  className="w-full h-10 rounded-lg border border-border-light bg-white px-3 text-[15px] text-text-primary placeholder-text-tertiary focus:border-accent-blue focus:ring-1 focus:ring-accent-blue focus:outline-none transition-all"
                  required
                />
              </div>
              <div className="space-y-1">
                <input
                  type="password"
                  placeholder="密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full h-10 rounded-lg border border-border-light bg-white px-3 text-[15px] text-text-primary placeholder-text-tertiary focus:border-accent-blue focus:ring-1 focus:ring-accent-blue focus:outline-none transition-all"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 text-red-600 text-xs">
                <div className="mt-0.5">⚠️</div>
                <p>{error}</p>
              </div>
            )}

            <div className="pt-1">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 flex items-center justify-center rounded-full bg-black text-white text-[15px] font-medium hover:bg-gray-800 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    验证中...
                  </span>
                ) : (
                  '登录控制台'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
