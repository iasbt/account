import type { ReactElement } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import AdminLoginPage from './pages/AdminLoginPage'
import RegisterPage from './pages/RegisterPage'
import ProfilePage from './pages/ProfilePage'
import { useAuthStore } from './store/useAuthStore'
import DashboardPage from './pages/DashboardPage'
import AdminPanel from './pages/AdminPanel'
import StyleGuide from './pages/StyleGuide'
import NotFoundPage from './pages/NotFoundPage'
import TermsPage from './pages/TermsPage'
import PrivacyPage from './pages/PrivacyPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'

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
    <div className="min-h-screen bg-background-light text-text-primary font-sans antialiased">
      {children}
    </div>
  )
}

function AdminLayout({ children }: { children: ReactElement }) {
  return (
    <div className="min-h-screen bg-background-light text-text-primary font-sans antialiased">
      {children}
    </div>
  )
}

// --- 主应用 ---

export default function App() {
  return (
    <Routes>
      {/* 公开路由 */}
      <Route path="/design-system" element={<StyleGuide />} />
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
      
      <Route
        path="/forgot-password"
        element={
          <PublicOnlyUser>
            <UserLayout>
              <ForgotPasswordPage />
            </UserLayout>
          </PublicOnlyUser>
        }
      />
      
      <Route
        path="/reset-password"
        element={
          <PublicOnlyUser>
            <UserLayout>
              <ResetPasswordPage />
            </UserLayout>
          </PublicOnlyUser>
        }
      />
      
      <Route path="/terms" element={<UserLayout><TermsPage /></UserLayout>} />
      <Route path="/privacy" element={<UserLayout><PrivacyPage /></UserLayout>} />

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
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
