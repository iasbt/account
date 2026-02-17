import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { UserPlus, Mail, Lock, User, AlertCircle, Loader2, ArrowLeft } from 'lucide-react'
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
    let timer: any
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(timer)
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
      // alert('验证码已发送，请查收邮件')
    } catch (err: any) {
      setError(err.message || '验证码发送失败')
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
        displayName: formData.name, // 默认使用用户名作为显示名
        code: formData.code
      })
      // 注册成功跳转登录
      navigate('/login', { state: { message: '注册成功，请登录' } })
    } catch (err: any) {
      setError(err.message || '注册失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white">创建新账号</h2>
          <p className="mt-2 text-sm text-slate-400">
            加入 IASBT 统一生态系统
          </p>
        </div>

        <div className="relative rounded-2xl border border-white/5 bg-slate-900/50 p-8 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="mt-2 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="sr-only">用户名</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="block w-full rounded-lg border border-white/10 bg-white/5 py-3 pl-10 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 sm:text-sm"
                  placeholder="用户名 (登录账号)"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="sr-only">电子邮箱</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="block w-full rounded-lg border border-white/10 bg-white/5 py-3 pl-10 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 sm:text-sm"
                  placeholder="电子邮箱"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="code" className="sr-only">验证码</label>
              <div className="relative flex gap-2">
                <div className="relative flex-grow">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                  id="code"
                  name="code"
                  type="text"
                  required
                  className="block w-full rounded-lg border border-white/10 bg-white/5 py-3 pl-10 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 sm:text-sm"
                  placeholder="邮箱验证码"
                  value={formData.code}
                  onChange={handleChange}
                />
              </div>
              <button
                type="button"
                onClick={handleSendCode}
                disabled={countdown > 0 || loading}
                className="min-w-[100px] rounded-lg border border-cyan-500/50 bg-cyan-500/10 px-4 text-sm font-medium text-cyan-400 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-cyan-500/10"
              >
                {countdown > 0 ? `${countdown}s` : '获取验证码'}
              </button>
            </div>
            </div>

            <div>
              <label htmlFor="password" className="sr-only">密码</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="block w-full rounded-lg border border-white/10 bg-white/5 py-3 pl-10 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 sm:text-sm"
                  placeholder="设置密码 (至少6位)"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="sr-only">确认密码</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="block w-full rounded-lg border border-white/10 bg-white/5 py-3 pl-10 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 sm:text-sm"
                  placeholder="确认密码"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-lg bg-cyan-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <UserPlus className="mr-2 h-5 w-5" />
              )}
              {loading ? '正在创建...' : '立即注册'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-cyan-400">
              <ArrowLeft className="h-4 w-4" />
              返回登录
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
