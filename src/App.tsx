import type { ReactElement } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import AdminLoginPage from './pages/AdminLoginPage'
import RegisterPage from './pages/RegisterPage'
import ProfilePage from './pages/ProfilePage'
import { useAuthStore } from './store/useAuthStore'
import { useAdminStore } from './store/useAdminStore'
import DashboardPage from './pages/DashboardPage'
import AdminPanel from './pages/AdminPanel'
import StyleGuide from './pages/StyleGuide'
import NotFoundPage from './pages/NotFoundPage'
import TermsPage from './pages/TermsPage'
import PrivacyPage from './pages/PrivacyPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import SsoPage from './pages/SsoPage'
import LogoutPage from './pages/LogoutPage'

// --- 路由守卫 ---

function RequireAuth({ children }: { children: ReactElement }) {
  const { isAuthenticated } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}

function RequireAdmin({ children }: { children: ReactElement }) {
  const { isAuthenticated } = useAdminStore()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />
  }

  return children
}

function PublicOnlyUser({ children }: { children: ReactElement }) {
  const { isAuthenticated } = useAuthStore()
  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }
  return children
}

function PublicOnlyAdmin({ children }: { children: ReactElement }) {
  const { isAuthenticated } = useAdminStore()
  if (isAuthenticated) {
    return <Navigate to="/admin" replace />
  }
  return children
}

function UserLayout({ children }: { children: ReactElement }) {
  return (
    <div className="min-h-screen bg-background-light text-text-primary font-sans antialiased flex flex-col">
      <div className="flex-1">{children}</div>
      <footer className="border-t border-border-light bg-white/70 backdrop-blur px-6 py-4">
        <div className="mx-auto max-w-[1280px] text-center text-xs text-text-secondary space-y-2">
          <p>Copyright © 2024 IASBT. All rights reserved.</p>
          <a
            href="https://beian.miit.gov.cn/"
            target="_blank"
            rel="noreferrer"
            className="hover:underline"
          >
            蜀ICP备2026002156号-2
          </a>
        </div>
      </footer>
    </div>
  )
}

function AdminLayout({ children }: { children: ReactElement }) {
  return (
    <div className="min-h-screen bg-background-light text-text-primary font-sans antialiased flex flex-col">
      <div className="flex-1">{children}</div>
      <footer className="border-t border-border-light bg-white/70 backdrop-blur px-6 py-4">
        <div className="mx-auto max-w-[1280px] text-center text-xs text-text-secondary space-y-2">
          <p>Copyright © 2024 IASBT. All rights reserved.</p>
          <a
            href="https://beian.miit.gov.cn/"
            target="_blank"
            rel="noreferrer"
            className="hover:underline"
          >
            蜀ICP备2026002156号-2
          </a>
        </div>
      </footer>
    </div>
  )
}

// --- 主应用 ---

export default function App() {
  return (
    <Routes>
      {/* 公开路由 */}
      <Route path="/design-system" element={<UserLayout><StyleGuide /></UserLayout>} />
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
        path="/sso/issue"
        element={
          <RequireAuth>
            <UserLayout>
              <SsoPage />
            </UserLayout>
          </RequireAuth>
        }
      />

      <Route
        path="/oauth/authorize"
        element={
          <RequireAuth>
            <UserLayout>
              <SsoPage />
            </UserLayout>
          </RequireAuth>
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

      <Route path="/logout" element={<UserLayout><LogoutPage /></UserLayout>} />

      {/* 404 处理 */}
      <Route path="*" element={<UserLayout><NotFoundPage /></UserLayout>} />
    </Routes>
  )
}
