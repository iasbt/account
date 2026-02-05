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
  const setUser = useAuthStore((state) => state.setUser)
  const setRole = useAuthStore((state) => state.setRole)
  const setSession = useAuthStore((state) => state.setSession)
  const setLoading = useAuthStore((state) => state.setLoading)

  useEffect(() => {
    let active = true

    const fetchRole = async (userId: string) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()
      if (error) {
        console.error('Failed to load profile role:', error)
        return null
      }
      return data?.role ?? null
    }

    const init = async () => {
      setLoading(true)
      const { data } = await supabase.auth.getSession()
      if (active) {
        setSession(data.session)
        setUser(data.session?.user ?? null)
        if (data.session?.user) {
          const role = await fetchRole(data.session.user.id)
          if (active) {
            setRole(role)
          }
        } else {
          setRole(null)
        }
        if (active) {
          setLoading(false)
        }
      }
    }

    init()

    const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return
      setLoading(true)
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        const role = await fetchRole(session.user.id)
        if (active) {
          setRole(role)
        }
      } else {
        setRole(null)
      }
      if (active) {
        setLoading(false)
      }
    })

    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [setLoading, setRole, setSession, setUser])

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
