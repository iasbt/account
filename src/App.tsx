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

    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [initialize, syncSession])

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
