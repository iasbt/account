import { useEffect } from 'react'
import type { ReactElement } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { supabase } from './lib/supabase'
import LoginForm from './features/auth/components/LoginForm'
import { useAuthStore } from './store/useAuthStore'
import DashboardPage from './pages/DashboardPage'
import AdminGuard from './components/auth/AdminGuard'
import AdminLayout from './layouts/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import ApplicationsPage from './pages/admin/ApplicationsPage'
import UsersPage from './pages/admin/UsersPage'
import SsoExchangePage from './pages/SsoExchangePage'

function FullScreenLoader() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-200">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  )
}

function RequireAuth({ children }: { children: ReactElement }) {
  const { user, loading } = useAuthStore()
  const location = useLocation()

  if (loading) {
    return <FullScreenLoader />
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}

function PublicOnly({ children }: { children: ReactElement }) {
  const { user, loading } = useAuthStore()

  if (loading) {
    return <FullScreenLoader />
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return children
}

export default function App() {
  const initialize = useAuthStore((state) => state.initialize)
  const syncSession = useAuthStore((state) => state.syncSession)
  const refreshSession = useAuthStore((state) => state.refreshSession)
  const signOut = useAuthStore((state) => state.signOut)

  useEffect(() => {
    let active = true

    const init = async () => {
      await initialize()
    }

    init()

    const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return
      await syncSession(session)
    })

    const channel =
      typeof BroadcastChannel !== 'undefined'
        ? new BroadcastChannel('account-auth')
        : null

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'signout') {
        signOut({ broadcast: false })
      }
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'account.signout' && event.newValue) {
        signOut({ broadcast: false })
      }
    }

    const handleFocus = () => {
      refreshSession()
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshSession()
      }
    }

    if (channel) {
      channel.addEventListener('message', handleMessage)
    }
    window.addEventListener('storage', handleStorage)
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibility)

    const refreshTimer = window.setInterval(() => {
      refreshSession()
    }, 10 * 60 * 1000)

    return () => {
      active = false
      data.subscription.unsubscribe()
      if (channel) {
        channel.removeEventListener('message', handleMessage)
        channel.close()
      }
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.clearInterval(refreshTimer)
    }
  }, [initialize, syncSession, refreshSession, signOut])

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnly>
            <LoginForm />
          </PublicOnly>
        }
      />
      <Route
        path="/"
        element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        }
      />
      <Route path="/sso/exchange" element={<SsoExchangePage />} />
      <Route element={<AdminGuard />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="apps" element={<ApplicationsPage />} />
          <Route path="users" element={<UsersPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
