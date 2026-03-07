import type { ReactElement } from 'react'
import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useLogto } from '@logto/react'
import DashboardPage from './pages/DashboardPage'
import AdminPanel from './pages/AdminPanel'
import StyleGuide from './pages/StyleGuide'
import NotFoundPage from './pages/NotFoundPage'
import TermsPage from './pages/TermsPage'
import PrivacyPage from './pages/PrivacyPage'
import ProfilePage from './pages/ProfilePage'
import CallbackPage from './pages/CallbackPage'
import { useLogtoUser } from './lib/logtoUser'
import { apiClient, adminApiClient } from './services/apiClient'

function RequireAuth({ children }: { children: ReactElement }) {
  const { isAuthenticated, isLoading } = useLogto()
  const location = useLocation()

  if (isLoading) return null
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return children
}

function RequireAdmin({ children }: { children: ReactElement }) {
  const { isAuthenticated, isLoading } = useLogto()
  const user = useLogtoUser()
  const location = useLocation()

  if (isLoading) return null
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  if (!user?.isAdmin) {
    return <Navigate to="/" replace />
  }
  return children
}

function LogtoEntry() {
  const { signIn, isAuthenticated, isLoading } = useLogto()
  const location = useLocation()

  useEffect(() => {
    if (isLoading || isAuthenticated) return
    const redirectUri = window.location.origin + '/callback'
    void signIn(redirectUri)
  }, [isLoading, isAuthenticated, signIn])

  if (isAuthenticated) {
    const target = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/'
    return <Navigate to={target} replace />
  }

  return (
    <div className="min-h-screen flex items-center justify-center text-text-secondary">
      正在跳转到 Logto 登录...
    </div>
  )
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

export default function App() {
  const { isAuthenticated, getAccessToken } = useLogto()

  useEffect(() => {
    let cancelled = false
    if (!isAuthenticated) {
      apiClient.setToken(null)
      adminApiClient.setToken(null)
      return
    }
    const sync = async () => {
      const token = await getAccessToken()
      if (cancelled) return
      apiClient.setToken(token || null)
      adminApiClient.setToken(token || null)
    }
    sync()
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, getAccessToken])

  return (
    <Routes>
      <Route path="/design-system" element={<UserLayout><StyleGuide /></UserLayout>} />
      <Route path="/login" element={<UserLayout><LogtoEntry /></UserLayout>} />
      <Route path="/callback" element={<UserLayout><CallbackPage /></UserLayout>} />
      <Route path="/terms" element={<UserLayout><TermsPage /></UserLayout>} />
      <Route path="/privacy" element={<UserLayout><PrivacyPage /></UserLayout>} />

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

      <Route path="*" element={<UserLayout><NotFoundPage /></UserLayout>} />
    </Routes>
  )
}
