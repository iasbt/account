import { Link } from 'react-router-dom'
import { ArrowLeft, User, Shield, LogOut } from 'lucide-react'
import { useLogto } from '@logto/react'
import { useLogtoUser } from '../lib/logtoUser'

export default function ProfilePage() {
  const { signOut } = useLogto()
  const user = useLogtoUser()

  if (!user) return null

  return (
    <div className="min-h-screen bg-background-light font-sans text-text-primary">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-border-subtle px-6 py-4">
        <div className="mx-auto flex max-w-[800px] items-center gap-4">
          <Link
            to="/"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-background-light border border-border-light transition hover:bg-border-subtle text-text-secondary"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-text-primary">个人设置</h1>
            <p className="text-sm text-text-secondary">通过 Logto 管理账号信息</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[800px] px-6 py-12 space-y-8">
        <div className="rounded-3xl bg-white p-8 shadow-apple-card border border-border-subtle">
          <div className="mb-10 flex flex-col items-center sm:flex-row sm:items-center sm:gap-8">
            <div className="relative group mb-4 sm:mb-0">
              <div className="h-24 w-24 overflow-hidden rounded-full border border-border-light bg-background-light">
                {user.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-text-tertiary">
                    {user.name?.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-bold text-text-primary mb-1">{user.name || user.email}</h2>
              <p className="text-text-secondary mb-3">{user.email || 'Logto 用户'}</p>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-accent-blue border border-blue-100">
                <User className="h-3 w-3" />
                <span>{user.isAdmin ? '管理员' : '普通用户'}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="col-span-2 sm:col-span-1">
              <div className="text-sm font-medium text-text-secondary mb-2">用户 ID</div>
              <div className="rounded-xl border border-border-light bg-background-light px-4 py-3 text-text-primary break-all">{user.id}</div>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <div className="text-sm font-medium text-text-secondary mb-2">角色</div>
              <div className="rounded-xl border border-border-light bg-background-light px-4 py-3 text-text-primary">
                {user.roles.length ? user.roles.join(', ') : '未配置'}
              </div>
            </div>
            <div className="col-span-2">
              <div className="text-sm font-medium text-text-secondary mb-2">组织角色</div>
              <div className="rounded-xl border border-border-light bg-background-light px-4 py-3 text-text-primary">
                {user.organizationRoles.length ? user.organizationRoles.join(', ') : '未配置'}
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={() => void signOut(window.location.origin + '/')}
              className="flex items-center justify-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              <LogOut className="h-4 w-4" />
              退出登录
            </button>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Shield className="h-4 w-4" />
              账号资料由 Logto 管理
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
