import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { UserPlus, ArrowLeft } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register, sendVerificationCode } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    code: ''
  })

  // 倒计时逻辑
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)
    }
    return () => {
      if (timer) {
        clearInterval(timer)
      }
    }
  }, [countdown])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError(null)
  }

  const handleSendCode = async () => {
    if (!formData.email) {
      setError('请输入电子邮箱')
      return
    }
    if (countdown > 0) return

    setLoading(true)
    setError(null)
    try {
      await sendVerificationCode(formData.email)
      setCountdown(60) // 60秒倒计时
    } catch (err: unknown) {
      const message = err instanceof Error && err.message ? err.message : '验证码发送失败'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    if (formData.password.length < 6) {
      setError('密码长度至少需要 6 位')
      return
    }

    if (!formData.code) {
      setError('请输入验证码')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        code: formData.code
      })
      // 注册成功跳转登录
      navigate('/login', { state: { message: '注册成功，请登录' } })
    } catch (err: unknown) {
      const message = err instanceof Error && err.message ? err.message : '注册失败，请稍后重试'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background-light text-text-primary flex flex-col items-center justify-center p-4 font-sans antialiased">
      <div className="w-full max-w-[400px]">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary mb-1">
            创建账号
          </h1>
          <p className="text-sm text-text-secondary font-normal">
            加入 IASBT 生态系统
          </p>
        </div>

        {/* Card */}
        <div className="bg-white p-8 rounded-2xl shadow-apple-card border border-border-subtle">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-3">
              <div className="space-y-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="w-full h-10 rounded-lg border border-border-light bg-white px-3 text-[15px] text-text-primary placeholder-text-tertiary focus:border-accent-blue focus:ring-1 focus:ring-accent-blue focus:outline-none transition-all"
                  placeholder="用户名"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full h-10 rounded-lg border border-border-light bg-white px-3 text-[15px] text-text-primary placeholder-text-tertiary focus:border-accent-blue focus:ring-1 focus:ring-accent-blue focus:outline-none transition-all"
                  placeholder="电子邮箱"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="flex gap-2">
                <input
                  id="code"
                  name="code"
                  type="text"
                  required
                  className="flex-1 h-10 rounded-lg border border-border-light bg-white px-3 text-[15px] text-text-primary placeholder-text-tertiary focus:border-accent-blue focus:ring-1 focus:ring-accent-blue focus:outline-none transition-all"
                  placeholder="验证码"
                  value={formData.code}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={countdown > 0 || loading}
                  className="h-10 px-4 rounded-lg border border-accent-blue text-accent-blue text-xs font-medium hover:bg-blue-50 active:bg-blue-100 disabled:opacity-50 disabled:border-border-light disabled:text-text-tertiary disabled:bg-transparent transition-colors"
                >
                  {countdown > 0 ? `${countdown}s` : '获取验证码'}
                </button>
              </div>

              <div className="space-y-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="w-full h-10 rounded-lg border border-border-light bg-white px-3 text-[15px] text-text-primary placeholder-text-tertiary focus:border-accent-blue focus:ring-1 focus:ring-accent-blue focus:outline-none transition-all"
                  placeholder="密码 (至少6位)"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="w-full h-10 rounded-lg border border-border-light bg-white px-3 text-[15px] text-text-primary placeholder-text-tertiary focus:border-accent-blue focus:ring-1 focus:ring-accent-blue focus:outline-none transition-all"
                  placeholder="确认密码"
                  value={formData.confirmPassword}
                  onChange={handleChange}
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
                disabled={loading}
                className="w-full h-10 flex items-center justify-center rounded-full bg-accent-blue text-white text-[15px] font-medium hover:bg-accent-hover active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    正在创建...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    注册
                  </span>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-border-subtle text-center">
            <Link 
              to="/login" 
              className="inline-flex items-center gap-1 text-xs text-accent-blue hover:underline font-medium"
            >
              <ArrowLeft className="h-3 w-3" />
              返回登录
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-[10px] text-text-tertiary">
            注册即代表您同意我们的服务条款和隐私政策。
          </p>
        </div>
      </div>
    </div>
  )
}
