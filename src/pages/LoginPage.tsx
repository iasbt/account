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
    let redirectUrl: string | null = null
    if (from) {
      try {
        const url = new URL(from, window.location.origin)
        if (url.origin === window.location.origin) {
          redirectUrl = url.toString()
        }
      } catch {
        redirectUrl = null
      }
    }
    
    try {
      await loginWithPassword(account, password)
      
      // Get the updated user state to check role
      const user = useAuthStore.getState().user

      // 登录成功后的跳转逻辑
      if (redirectUrl) {
        window.location.href = redirectUrl
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
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col items-center justify-center p-4 font-sans antialiased text-[#1d1d1f]">
      <div className="w-full max-w-[360px]">
        {/* Header Area */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-white shadow-xl">
            <UserCircle className="h-8 w-8" strokeWidth={1.5} />
          </div>
          <h1 className="text-[28px] font-bold tracking-tight text-[#1d1d1f] mb-2">
            登录
          </h1>
          <p className="text-[15px] text-[#86868b] font-normal">
            使用您的 IASBT 账号
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white p-8 rounded-[20px] shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-[#e5e5e5]">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-4">
              <div className="space-y-1">
                <input
                  type="text"
                  placeholder="用户名或邮箱"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  autoComplete="username"
                  className="w-full h-[44px] rounded-xl border border-[#d2d2d7] bg-white px-4 text-[15px] text-[#1d1d1f] placeholder-[#86868b] focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 focus:outline-none transition-all duration-200"
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
                  className="w-full h-[44px] rounded-xl border border-[#d2d2d7] bg-white px-4 text-[15px] text-[#1d1d1f] placeholder-[#86868b] focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 focus:outline-none transition-all duration-200"
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

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-[44px] flex items-center justify-center rounded-full bg-[#0071e3] text-white text-[15px] font-medium hover:bg-[#0077ed] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    登录中...
                  </span>
                ) : (
                  '登录'
                )}
              </button>
            </div>
          </form>

          {/* Links */}
          <div className="mt-6 pt-6 border-t border-[#e5e5e5] flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-[13px]">
              <span className="text-[#86868b]">还没有账号？</span>
              <Link
                to="/register"
                className="text-[#0071e3] hover:underline font-medium"
              >
                立即注册
              </Link>
            </div>
            <Link
              to="/forgot-password" 
              className="text-[13px] text-[#86868b] hover:text-[#0071e3] hover:underline transition-colors"
            >
              忘记密码？
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 text-center space-y-3">
          <p className="text-[11px] text-[#86868b]">
            Copyright © 2024 IASBT. All rights reserved.
          </p>
          <div className="flex items-center justify-center gap-4 text-[11px] text-[#86868b]">
            <a href="#" className="hover:underline hover:text-[#1d1d1f] transition-colors">隐私政策</a>
            <span className="text-[#d2d2d7]">|</span>
            <a href="#" className="hover:underline hover:text-[#1d1d1f] transition-colors">使用条款</a>
          </div>
        </div>
      </div>
    </div>
  )
}
