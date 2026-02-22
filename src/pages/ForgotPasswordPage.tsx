import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, KeyRound, Mail } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // TODO: Add actual API call in store
  // const forgotPassword = useAuthStore(state => state.forgotPassword)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    // 模拟 API 调用
    setTimeout(() => {
      setLoading(false)
      if (email.includes('@')) {
        setSuccess(true)
      } else {
        setError('请输入有效的电子邮箱地址')
      }
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-background-light text-text-primary flex flex-col items-center justify-center p-4 font-sans antialiased">
      <div className="w-full max-w-[400px]">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-black text-white shadow-lg">
            <KeyRound className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary mb-1">
            找回密码
          </h1>
          <p className="text-sm text-text-secondary font-normal">
            请输入您的注册邮箱以接收重置链接
          </p>
        </div>

        {/* Card */}
        <div className="bg-white p-8 rounded-2xl shadow-apple-card border border-border-subtle">
          {!success ? (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1">
                <label htmlFor="email" className="block text-xs font-medium text-text-secondary ml-1 mb-1">
                  电子邮箱
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-text-tertiary" />
                  <input
                    id="email"
                    type="email"
                    required
                    className="w-full h-10 rounded-lg border border-border-light bg-white pl-10 pr-3 text-[15px] text-text-primary placeholder-text-tertiary focus:border-accent-blue focus:ring-1 focus:ring-accent-blue focus:outline-none transition-all"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 text-red-600 text-xs">
                  <div className="mt-0.5">⚠️</div>
                  <p>{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-10 flex items-center justify-center rounded-full bg-accent-blue text-white text-[15px] font-medium hover:bg-accent-hover active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm mt-2"
              >
                {loading ? '发送中...' : '发送重置链接'}
              </button>
            </form>
          ) : (
            <div className="text-center py-4">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-600">
                <Mail className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-medium text-text-primary mb-2">邮件已发送</h3>
              <p className="text-sm text-text-secondary mb-6">
                如果该邮箱存在，我们将发送一条包含密码重置说明的邮件，请查收。
              </p>
              <button 
                onClick={() => setSuccess(false)}
                className="text-accent-blue text-sm font-medium hover:underline"
              >
                尝试其他邮箱
              </button>
            </div>
          )}

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
      </div>
    </div>
  )
}
