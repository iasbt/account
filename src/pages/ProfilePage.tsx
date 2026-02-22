import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, User, Save, Loader2, Camera, AlertCircle, CheckCircle, Lock } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { authService } from '../services/authService'

export default function ProfilePage() {
  const { user, updateProfile } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Password Change State
  const [pwdLoading, setPwdLoading] = useState(false)
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null)
  const [pwdError, setPwdError] = useState<string | null>(null)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [formData, setFormData] = useState({
    displayName: '',
    avatar: '',
    email: '',
    name: ''
  })

  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || '',
        avatar: user.avatar || '',
        email: user.email || '',
        name: user.name || ''
      })
    }
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError(null)
    setSuccess(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await updateProfile({
        displayName: formData.displayName,
        avatar: formData.avatar,
      })
      setSuccess('个人资料更新成功')
    } catch (err: unknown) {
      const message = err instanceof Error && err.message ? err.message : '更新失败'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setPwdError('两次输入的密码不一致')
      return
    }
    if (newPassword.length < 6) {
      setPwdError('新密码长度至少需要 6 位')
      return
    }

    setPwdLoading(true)
    setPwdError(null)
    setPwdSuccess(null)

    try {
      await authService.changePassword(oldPassword, newPassword)
      setPwdSuccess('密码修改成功')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: unknown) {
      const message = err instanceof Error && err.message ? err.message : '修改失败，请检查旧密码'
      setPwdError(message)
    } finally {
      setPwdLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background-light font-sans text-text-primary">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-border-subtle px-6 py-4">
        <div className="mx-auto flex max-w-[800px] items-center gap-4">
          <Link 
            to="/" 
            className="flex h-10 w-10 items-center justify-center rounded-full bg-background-light border border-border-light transition hover:bg-border-subtle text-text-secondary"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-text-primary">个人设置</h1>
            <p className="text-sm text-text-secondary">管理您的账号信息</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[800px] px-6 py-12 space-y-8">
        {/* Profile Card */}
        <div className="rounded-3xl bg-white p-8 shadow-apple-card border border-border-subtle">
          
          {/* Profile Header */}
          <div className="mb-10 flex flex-col items-center sm:flex-row sm:items-center sm:gap-8">
            <div className="relative group mb-4 sm:mb-0">
              <div className="h-24 w-24 overflow-hidden rounded-full border border-border-light bg-background-light">
                {formData.avatar ? (
                  <img src={formData.avatar} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-text-tertiary">
                    {formData.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-bold text-text-primary mb-1">{user.displayName || user.name}</h2>
              <p className="text-text-secondary mb-3">@{user.name}</p>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-accent-blue border border-blue-100">
                <User className="h-3 w-3" />
                <span>普通用户</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 max-w-xl">
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            {success && (
              <div className="flex items-center gap-2 rounded-xl border border-green-100 bg-green-50 p-4 text-sm text-green-600">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="col-span-2 sm:col-span-1">
                <label className="mb-2 block text-sm font-medium text-text-secondary">
                  用户名 (不可修改)
                </label>
                <input
                  type="text"
                  value={formData.name}
                  disabled
                  className="w-full h-12 rounded-xl border border-border-light bg-background-light px-4 text-text-tertiary cursor-not-allowed"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="mb-2 block text-sm font-medium text-text-secondary">
                  电子邮箱 (不可修改)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full h-12 rounded-xl border border-border-light bg-background-light px-4 text-text-tertiary cursor-not-allowed"
                />
              </div>

              <div className="col-span-2">
                <label htmlFor="displayName" className="mb-2 block text-sm font-medium text-text-primary">
                  显示名称
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 h-5 w-5 text-text-tertiary" />
                  <input
                    id="displayName"
                    name="displayName"
                    type="text"
                    value={formData.displayName}
                    onChange={handleChange}
                    className="w-full h-12 rounded-xl border border-border-light bg-white px-4 pl-12 text-text-primary placeholder-text-tertiary focus:border-accent-blue focus:ring-1 focus:ring-accent-blue focus:outline-none transition-all"
                    placeholder="您的昵称"
                  />
                </div>
              </div>

              <div className="col-span-2">
                <label htmlFor="avatar" className="mb-2 block text-sm font-medium text-text-primary">
                  头像链接
                </label>
                <div className="relative">
                  <Camera className="absolute left-4 top-3.5 h-5 w-5 text-text-tertiary" />
                  <input
                    id="avatar"
                    name="avatar"
                    type="url"
                    value={formData.avatar}
                    onChange={handleChange}
                    className="w-full h-12 rounded-xl border border-border-light bg-white px-4 pl-12 text-text-primary placeholder-text-tertiary focus:border-accent-blue focus:ring-1 focus:ring-accent-blue focus:outline-none transition-all"
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
                <p className="mt-2 text-xs text-text-secondary">请输入头像图片的直链地址。</p>
              </div>
            </div>

            <div className="pt-4 border-t border-border-subtle">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-full bg-accent-blue px-8 py-3 text-sm font-medium text-white transition-all hover:bg-accent-hover active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {loading ? '保存中...' : '保存更改'}
              </button>
            </div>
          </form>
        </div>

        {/* Security Card */}
        <div className="rounded-3xl bg-white p-8 shadow-apple-card border border-border-subtle">
          <div className="mb-8">
            <h3 className="text-xl font-bold text-text-primary mb-1 flex items-center gap-2">
              <Lock className="h-5 w-5 text-accent-blue" />
              账号安全
            </h3>
            <p className="text-text-secondary">修改您的登录密码</p>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-6 max-w-xl">
            {pwdError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{pwdError}</span>
              </div>
            )}
            
            {pwdSuccess && (
              <div className="flex items-center gap-2 rounded-xl border border-green-100 bg-green-50 p-4 text-sm text-green-600">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>{pwdSuccess}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">当前密码</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full h-12 rounded-xl border border-border-light bg-white px-4 text-text-primary placeholder-text-tertiary focus:border-accent-blue focus:ring-1 focus:ring-accent-blue focus:outline-none transition-all"
                  placeholder="请输入当前密码"
                  required
                />
              </div>
              
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">新密码</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-12 rounded-xl border border-border-light bg-white px-4 text-text-primary placeholder-text-tertiary focus:border-accent-blue focus:ring-1 focus:ring-accent-blue focus:outline-none transition-all"
                  placeholder="至少 6 位字符"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">确认新密码</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-12 rounded-xl border border-border-light bg-white px-4 text-text-primary placeholder-text-tertiary focus:border-accent-blue focus:ring-1 focus:ring-accent-blue focus:outline-none transition-all"
                  placeholder="再次输入新密码"
                  required
                />
              </div>
            </div>

            <div className="pt-4 border-t border-border-subtle">
              <button
                type="submit"
                disabled={pwdLoading}
                className="flex items-center justify-center gap-2 rounded-full bg-white border border-border-light px-8 py-3 text-sm font-medium text-text-primary transition-all hover:bg-background-light active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pwdLoading ? '处理中...' : '修改密码'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
