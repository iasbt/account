import type { ReactElement } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import AdminLoginPage from './pages/AdminLoginPage'
import RegisterPage from './pages/RegisterPage'
import ProfilePage from './pages/ProfilePage'
import { useAuthStore } from './store/useAuthStore'
import DashboardPage from './pages/DashboardPage'
import AdminPanel from './pages/AdminPanel'

// --- 路由守卫 ---

function RequireAuth({ children }: { children: ReactElement }) {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (user?.isAdmin) {
    return <Navigate to="/admin" replace />
  }

  return children
}

function RequireAdmin({ children }: { children: ReactElement }) {
  const { user, isAuthenticated } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />
  }
  
  if (!user?.isAdmin) {
    return <Navigate to="/" replace />
  }

  return children
}

function PublicOnlyUser({ children }: { children: ReactElement }) {
  const { isAuthenticated, user } = useAuthStore()
  if (isAuthenticated && user?.isAdmin) {
    return <Navigate to="/admin" replace />
  }
  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }
  return children
}

function PublicOnlyAdmin({ children }: { children: ReactElement }) {
  const { isAuthenticated, user } = useAuthStore()
  if (isAuthenticated && user?.isAdmin) {
    return <Navigate to="/admin" replace />
  }
  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }
  return children
}

function UserLayout({ children }: { children: ReactElement }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {children}
    </div>
  )
}

function AdminLayout({ children }: { children: ReactElement }) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {children}
    </div>
  )
}

// --- 主应用 ---

export default function App() {
  return (
    <Routes>
      {/* 公开路由 */}
      <Route
        path="/login"
        element={
          <PublicOnlyUser>
            <UserLayout>
              <LoginPage />
            </UserLayout>
          </PublicOnlyUser>
        }
      />

      <Route
        path="/admin/login"
        element={
          <PublicOnlyAdmin>
            <AdminLayout>
              <AdminLoginPage />
            </AdminLayout>
          </PublicOnlyAdmin>
        }
      />
      
      <Route
        path="/register"
        element={
          <PublicOnlyUser>
            <UserLayout>
              <RegisterPage />
            </UserLayout>
          </PublicOnlyUser>
        }
      />
      

      {/* 受保护路由 */}
      <Route
        path="/"
        element={
          <RequireAuth>
            <UserLayout>
              <DashboardPage />
            </UserLayout>
          </RequireAuth>
        }
      />

      <Route
        path="/profile"
        element={
          <RequireAuth>
            <UserLayout>
              <ProfilePage />
            </UserLayout>
          </RequireAuth>
        }
      />

      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminLayout>
              <AdminPanel />
            </AdminLayout>
          </RequireAdmin>
        }
      />

      {/* 404 处理 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
