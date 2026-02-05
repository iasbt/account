import { useState } from 'react'
import { LogOut, Shield } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { AppGrid } from '../features/dashboard/components/AppGrid'
import { useAuth } from '../features/auth/hooks/useAuth'
import { useAuthStore } from '../store/useAuthStore'

export default function DashboardPage() {
  const { signOut } = useAuth()
  const loading = useAuthStore((state) => state.loading)
  const role = useAuthStore((state) => state.role)
  const [error, setError] = useState('')
  const location = useLocation()
  const showUnauthorized = Boolean(
    (location.state as { unauthorized?: boolean } | null)?.unauthorized
  )

  const handleSignOut = async () => {
    setError('')
    const result = await signOut()
    if (result.error) {
      setError(result.error.message)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300">
            UA
          </div>
          <div>
            <div className="text-sm font-semibold">Unified Account</div>
            <div className="text-xs text-slate-400">应用启动台</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {role === 'admin' && (
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 rounded-lg border border-cyan-300/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-200 transition hover:border-cyan-300/50 hover:text-cyan-100"
            >
              <Shield className="h-4 w-4" />
              Admin Console
            </Link>
          )}
          <button
            type="button"
            disabled={loading}
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-200 transition hover:border-cyan-300/40 hover:text-cyan-200 disabled:cursor-not-allowed disabled:text-slate-500"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-8">
        <div>
          <div className="text-lg font-semibold">可用应用</div>
          <div className="text-sm text-slate-400">选择一个应用开始使用</div>
        </div>
        {showUnauthorized && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
            无权访问
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}
        <AppGrid />
      </main>
    </div>
  )
}
