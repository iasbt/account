import { useAuthStore } from '../../store/useAuthStore'

export default function UserHome() {
  const user = useAuthStore((s) => s.user)
  const role = useAuthStore((s) => s.role)
  const session = useAuthStore((s) => s.session)

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="text-lg font-semibold">Unified Account (IAM)</div>
          <div className="text-sm text-gray-700">{user?.email ?? session?.user?.email ?? '-'}</div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-8 space-y-8">
        <section className="rounded-2xl bg-blue-50 px-6 py-6">
          <div className="text-xl font-semibold">账户概览</div>
          <div className="mt-1 text-sm text-gray-600">身份与会话信息</div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="text-lg font-semibold">身份信息</div>
            <div className="mt-4 space-y-2 text-sm text-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Email</span>
                <span>{user?.email ?? session?.user?.email ?? '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">UID</span>
                <span className="font-mono">{user?.id ?? session?.user?.id ?? '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">角色</span>
                <span className="uppercase">{role ?? '-'}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-lg font-semibold">会话状态</div>
              <div className="mt-2 text-sm text-green-600 font-medium">Session Active</div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => useAuthStore.getState().signOut()}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  退出登录
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
