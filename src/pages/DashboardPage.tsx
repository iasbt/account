import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, ExternalLink, UserCircle, Database, Server, LayoutGrid } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { dashboardService } from '../services/dashboardService'
import { authService } from '../services/authService'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [dbStats, setDbStats] = useState<{ userCount: number } | null>(null)

  useEffect(() => {
    // 获取数据库状态
    dashboardService.getStats().then(stats => {
      setDbStats(stats)
    }).catch(err => {
      console.error('Failed to fetch DB stats:', err)
    })
  }, [])

  const apps = [
    {
      id: 'account',
      name: '个人中心',
      description: '管理您的个人信息和安全设置。',
      icon: <UserCircle className="h-6 w-6 text-accent-blue" />,
      url: '/profile'
    }
  ]

  const handleSignOut = () => {
    setLoading(true)
    logout()
    navigate('/login')
  }

  const handleLaunch = async (app: { url: string; sso?: boolean }) => {
    if (app.sso && app.url.startsWith('http')) {
      try {
        const data = await authService.getSsoToken()
        if (data?.token) {
          const email = encodeURIComponent(data.email || user?.email || '')
          const tokenValue = encodeURIComponent(data.token)
          const target = `${app.url}?token=${tokenValue}&email=${email}`
          window.open(target, '_blank')
          return
        }
      } catch (error) {
        console.error('SSO Token Error:', error)
      }
    }
    if (app.url.startsWith('http')) {
      window.open(app.url, '_blank')
    } else {
      navigate(app.url)
    }
  }

  return (
    <div className="min-h-screen bg-background-light font-sans text-text-primary">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-border-subtle px-6 py-4">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 overflow-hidden rounded-full bg-background-light border border-border-light flex items-center justify-center">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.displayName} className="h-full w-full object-cover" />
              ) : (
                <span className="text-sm font-medium text-text-secondary">
                  {user?.name?.substring(0, 2).toUpperCase() || 'UA'}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-sm font-semibold text-text-primary">{user?.displayName || user?.name}</h1>
              <p className="text-xs text-text-secondary">IASBT ID</p>
            </div>
          </div>
          
          <button
            onClick={handleSignOut}
            disabled={loading}
            className="flex items-center gap-2 rounded-full bg-background-light px-4 py-2 text-sm font-medium text-text-primary hover:bg-border-subtle transition-colors active:scale-95 disabled:opacity-50"
          >
            <LogOut className="h-4 w-4 text-text-secondary" />
            <span>退出登录</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-[1280px] px-6 py-12">
        {/* Admin Portal Entry (Only for Admins) */}
        {user?.isAdmin && (
          <div className="mb-12 rounded-3xl bg-white p-8 shadow-apple-card border border-border-subtle flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-text-primary mb-1">管理控制台</h3>
              <p className="text-text-secondary">访问系统管理工具和用户控制。</p>
            </div>
            <button
              onClick={() => navigate('/admin')}
              className="px-6 py-3 rounded-full bg-black text-white font-medium hover:bg-gray-800 transition-colors shadow-lg shadow-black/10"
            >
              进入控制台
            </button>
          </div>
        )}

        <div className="mb-10">
          <h2 className="text-3xl font-semibold tracking-tight text-text-primary mb-2">应用</h2>
          <p className="text-lg text-text-secondary">启动您的已连接服务。</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {apps.map((app) => (
            <div
              key={app.id}
              onClick={() => handleLaunch(app)}
              className="group cursor-pointer rounded-3xl bg-white p-6 shadow-apple-card border border-border-subtle transition-all duration-300 hover:shadow-apple-hover hover:scale-[1.02]"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="h-14 w-14 rounded-2xl bg-background-light flex items-center justify-center">
                  {app.icon}
                </div>
                <div className="h-8 w-8 rounded-full bg-background-light flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ExternalLink className="h-4 w-4 text-text-secondary" />
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-text-primary mb-2">{app.name}</h3>
                <p className="text-sm leading-relaxed text-text-secondary">
                  {app.description}
                </p>
              </div>
            </div>
          ))}
          
          {/* Coming Soon Placeholder */}
          <div className="rounded-3xl border-2 border-dashed border-border-light p-6 flex flex-col items-center justify-center text-center h-full min-h-[200px]">
            <div className="h-12 w-12 rounded-full bg-background-light flex items-center justify-center mb-4">
              <LayoutGrid className="h-6 w-6 text-text-tertiary" />
            </div>
            <h3 className="text-sm font-medium text-text-secondary">更多功能敬请期待</h3>
          </div>
        </div>

        {/* System Status Section */}
        <div className="mt-16 pt-12 border-t border-border-light">
          <h3 className="text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
            <Server className="h-5 w-5 text-text-secondary" />
            系统状态
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="rounded-2xl bg-white p-6 border border-border-subtle shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-green-50">
                    <Database className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">数据库</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`h-2 w-2 rounded-full ${dbStats ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></div>
                      <p className="text-lg font-semibold text-text-primary">
                        {dbStats ? '运行正常' : '检查中...'}
                      </p>
                    </div>
                  </div>
                </div>
             </div>
             
             {dbStats && (
               <div className="rounded-2xl bg-white p-6 border border-border-subtle shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-blue-50">
                      <UserCircle className="h-6 w-6 text-accent-blue" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">总用户数</p>
                      <p className="text-lg font-semibold text-text-primary mt-1">
                        {dbStats.userCount?.toLocaleString() ?? '-'}
                      </p>
                    </div>
                  </div>
               </div>
             )}
          </div>
        </div>
      </main>
    </div>
  )
}
