import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, KeyRound, CheckCircle, AlertCircle } from 'lucide-react'
import { authService } from '../services/authService'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const email = searchParams.get('email')
  const code = searchParams.get('code')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!email || !code) {
      setError('无效的重置链接，请检查链接是否完整。')
    }
  }, [email, code])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !code) return

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }
    if (password.length < 6) {
      setError('密码长度至少需要 6 位')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await authService.resetPassword(email, code, password)
      setSuccess(true)
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err: unknown) {
      const message = err instanceof Error && err.message ? err.message : '重置失败'
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
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-black text-white shadow-lg">
            <KeyRound className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary mb-1">
            重置密码
          </h1>
          <p className="text-sm text-text-secondary font-normal">
            设置您的新登录密码
          </p>
        </div>

        {/* Card */}
        <div className="bg-white p-8 rounded-2xl shadow-apple-card border border-border-subtle">
          {!success ? (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1">
                <input
                  type="text"
                  value={email || ''}
                  disabled
                  className="w-full h-10 rounded-lg border border-border-light bg-background-light px-3 text-[15px] text-text-tertiary cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <input
                  type="password"
                  required
                  className="w-full h-10 rounded-lg border border-border-light bg-white px-3 text-[15px] text-text-primary placeholder-text-tertiary focus:border-accent-blue focus:ring-1 focus:ring-accent-blue focus:outline-none transition-all"
                  placeholder="新密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <input
                  type="password"
                  required
                  className="w-full h-10 rounded-lg border border-border-light bg-white px-3 text-[15px] text-text-primary placeholder-text-tertiary focus:border-accent-blue focus:ring-1 focus:ring-accent-blue focus:outline-none transition-all"
                  placeholder="确认新密码"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 text-red-600 text-xs">
                  <div className="mt-0.5">⚠️</div>
                  <p>{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !!error}
                className="w-full h-10 flex items-center justify-center rounded-full bg-accent-blue text-white text-[15px] font-medium hover:bg-accent-hover active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm mt-2"
              >
                {loading ? '提交中...' : '重置密码'}
              </button>
            </form>
          ) : (
            <div className="text-center py-4">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-600">
                <CheckCircle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-medium text-text-primary mb-2">密码重置成功</h3>
              <p className="text-sm text-text-secondary mb-6">
                您的密码已更新，正在跳转至登录页...
              </p>
              <Link 
                to="/login"
                className="text-accent-blue text-sm font-medium hover:underline"
              >
                立即登录
              </Link>
            </div>
          )}

          {!success && (
            <div className="mt-6 pt-6 border-t border-border-subtle text-center">
              <Link 
                to="/login" 
                className="inline-flex items-center gap-1 text-xs text-accent-blue hover:underline font-medium"
              >
                <ArrowLeft className="h-3 w-3" />
                返回登录
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
