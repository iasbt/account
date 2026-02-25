import { useState } from 'react'
import { UserCircle } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { apiClient } from '../services/apiClient'

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
    
    // 优先尝试 SSO 跳转 (支持跨域)
    if (from) {
      redirectUrl = from
    }
    
    try {
      await loginWithPassword(account, password)
      
      // Get the updated user state to check role
      const user = useAuthStore.getState().user

      // 登录成功后的跳转逻辑
      if (redirectUrl) {
        // 尝试通过 SSO 接口获取带 Token 的跳转链接
        try {
          // 注意：这里需要手动拼接到 URL，因为 apiClient.get 期望 endpoint 是 path
          // 而 searchParams 可能包含特殊字符，最好通过 query string 传递
          // 但是 apiClient.get 签名只接受 endpoint 和 options
          // 我们可以这样构造 endpoint: `/sso/issue?target=${encodeURIComponent(redirectUrl)}`
          
          const endpoint = `/sso/issue?target=${encodeURIComponent(redirectUrl)}`
          const res = await apiClient.get<{ url: string }>(endpoint)
          
          if (res.url) {
            window.location.href = res.url
            return
          }
        } catch (ssoErr) {
          console.warn('SSO Redirect Failed, falling back to local redirect check:', ssoErr)
          
          // Fallback: 如果 SSO 失败，尝试本地跳转 (仅允许同源)
          try {
            const url = new URL(redirectUrl, window.location.origin)
            if (url.origin === window.location.origin) {
              window.location.href = url.toString()
              return
            }
          } catch {}
        }
      } 
      
      // Default redirect if no external redirect happened
      if (user?.isAdmin) {
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
              <div className="text-[13px] text-red-500 bg-red-50 p-3 rounded-lg border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-[44px] bg-[#0071e3] hover:bg-[#0077ed] text-white text-[15px] font-medium rounded-xl transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                '登录'
              )}
            </button>
            
            <div className="flex items-center justify-between pt-1">
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
