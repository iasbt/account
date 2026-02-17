import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, User, Save, Loader2, Camera, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'

export default function ProfilePage() {
  const { user, updateProfile } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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
        // email: formData.email // 暂时不开放修改邮箱，需验证逻辑
      })
      setSuccess('个人资料更新成功')
    } catch (err: any) {
      setError(err.message || '更新失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-12 text-slate-100 font-sans selection:bg-cyan-500/30">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center gap-4">
          <Link 
            to="/" 
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 transition hover:bg-white/10 hover:text-cyan-400"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">个人中心</h1>
            <p className="text-sm text-slate-400">管理您的账号信息</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-slate-900/50 p-8 shadow-xl backdrop-blur-xl">
          <div className="mb-8 flex flex-col items-center sm:flex-row sm:items-start sm:gap-8">
            <div className="relative group mb-4 sm:mb-0">
              <div className="h-24 w-24 overflow-hidden rounded-full ring-4 ring-white/10">
                {formData.avatar ? (
                  <img src={formData.avatar} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-800 text-2xl font-bold text-slate-400">
                    {formData.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              {/* 头像上传预留位置，目前手动输入 URL */}
            </div>
            
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl font-bold text-white">{user.displayName || user.name}</h2>
              <p className="text-sm text-slate-400">@{user.name}</p>
              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-400 border border-cyan-500/20">
                <User className="h-3 w-3" />
                <span>普通用户</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            {success && (
              <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-400">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="col-span-2 sm:col-span-1">
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  用户名 (不可修改)
                </label>
                <input
                  type="text"
                  value={formData.name}
                  disabled
                  className="block w-full cursor-not-allowed rounded-lg border border-white/5 bg-white/5 px-4 py-2.5 text-slate-400 sm:text-sm"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  电子邮箱 (不可修改)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="block w-full cursor-not-allowed rounded-lg border border-white/5 bg-white/5 px-4 py-2.5 text-slate-400 sm:text-sm"
                />
              </div>

              <div className="col-span-2">
                <label htmlFor="displayName" className="mb-2 block text-sm font-medium text-slate-300">
                  显示名称
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-5 w-5 text-slate-500" />
                  <input
                    id="displayName"
                    name="displayName"
                    type="text"
                    value={formData.displayName}
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2.5 pl-10 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 sm:text-sm transition-colors"
                    placeholder="设置您的昵称"
                  />
                </div>
              </div>

              <div className="col-span-2">
                <label htmlFor="avatar" className="mb-2 block text-sm font-medium text-slate-300">
                  头像链接
                </label>
                <div className="relative">
                  <Camera className="absolute left-3 top-2.5 h-5 w-5 text-slate-500" />
                  <input
                    id="avatar"
                    name="avatar"
                    type="url"
                    value={formData.avatar}
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2.5 pl-10 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 sm:text-sm transition-colors"
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">请输入图片的 URL 地址</p>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 sm:w-auto"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {loading ? '保存中...' : '保存更改'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
