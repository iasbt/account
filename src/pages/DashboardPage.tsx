import { useState } from 'react'
import { LogOut, ExternalLink, Image, UserCircle } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { casdoorConfig } from '../lib/casdoor'
import { hasPermission } from '../lib/rbac'

export default function DashboardPage() {
  const { user, logout } = useAuthStore()
  const [loading, setLoading] = useState(false)

  const apps = [
    {
      id: 'gallery',
      name: '相册图库',
      description: 'MT Photos 智能相册',
      icon: <Image className="h-full w-full text-cyan-400" />,
      url: 'http://iasbt.cloud'
    },
    {
      id: 'account',
      name: '个人中心',
      description: '管理您的账号资料',
      icon: <UserCircle className="h-full w-full text-blue-400" />,
      url: 'http://119.91.71.30:8080/account'
    }
  ]

  // 如果是管理员，显示后台管理入口
  if (hasPermission(user, 'manage:system')) {
    apps.push({
      id: 'admin',
      name: '系统管理',
      description: 'Casdoor 身份认证管理后台',
      icon: <UserCircle className="h-full w-full text-purple-400" />, // 使用不同颜色区分
      url: 'http://119.91.71.30:8080/routers'
    })
  }

  const handleSignOut = () => {
    setLoading(true)
    logout()
    window.location.href = `${casdoorConfig.serverUrl}/logout`
  }

  const handleLaunch = (url: string) => {
    window.open(url, '_blank')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/30">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-white/5 bg-slate-950/80 backdrop-blur-md px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-white/10 transition hover:ring-cyan-500/50">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.displayName} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-slate-800 text-xs font-bold text-slate-400">
                  {user?.name?.substring(0, 2).toUpperCase() || 'UA'}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-100">{user?.displayName || user?.name}</h1>
              <p className="text-xs text-slate-400">统一身份认证中心</p>
            </div>
          </div>
          
          <button
            onClick={handleSignOut}
            disabled={loading}
            className="group flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 active:scale-95 disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
            <span>退出登录</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-10">
          <h2 className="text-2xl font-bold tracking-tight text-white">应用启动台</h2>
          <p className="mt-2 text-slate-400">选择您要访问的服务</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {apps.map((app) => (
            <div
              key={app.id}
              onClick={() => handleLaunch(app.url)}
              className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/5 bg-slate-900/50 p-6 transition-all duration-300 hover:border-cyan-500/30 hover:bg-slate-800/80 hover:shadow-2xl hover:shadow-cyan-900/10 hover:-translate-y-1"
            >
              <div className="flex items-start justify-between">
                <div className="h-14 w-14 rounded-2xl bg-slate-950 p-3 shadow-inner ring-1 ring-white/5 flex items-center justify-center">
                  {app.icon}
                </div>
                <ExternalLink className="h-5 w-5 text-slate-600 transition-colors group-hover:text-cyan-400" />
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-slate-100 group-hover:text-cyan-100">{app.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400 group-hover:text-slate-300">
                  {app.description}
                </p>
              </div>

              {/* Decorative gradient blob */}
              <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-cyan-500/10 blur-3xl transition-all duration-500 group-hover:bg-cyan-500/20" />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
