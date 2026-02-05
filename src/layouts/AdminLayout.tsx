import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Layers, Users, ArrowLeft } from 'lucide-react'

const navItems = [
  { label: 'Dashboard', to: '/admin', icon: LayoutDashboard },
  { label: 'Applications', to: '/admin/apps', icon: Layers },
  { label: 'Users', to: '/admin/users', icon: Users },
]

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <aside className="w-64 border-r border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="flex items-center gap-3 px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300">
            AC
          </div>
          <div>
            <div className="text-sm font-semibold">Admin Console</div>
            <div className="text-xs text-slate-400">Unified Account</div>
          </div>
        </div>
        <nav className="px-4 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/admin'}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition',
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-200 border border-cyan-400/20'
                      : 'text-slate-300 hover:bg-slate-900/60 hover:text-slate-100 border border-transparent',
                  ].join(' ')
                }
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>
        <div className="mt-auto px-4 pb-6 pt-6">
          <NavLink
            to="/"
            className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-200 transition hover:border-cyan-300/40 hover:text-cyan-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </NavLink>
        </div>
      </aside>
      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
