import { useNavigate } from 'react-router-dom'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const stats = [
    { label: '总注册用户数', value: '12,480' },
    { label: '今日新增', value: '126' },
    { label: '在线用户', value: '834' },
  ]
  const users = [
    { id: 'u_0001', email: 'alice@example.com', role: 'Admin', status: '正常', registeredAt: '2025-11-02 09:13' },
    { id: 'u_0002', email: 'bob@example.com', role: 'User', status: '正常', registeredAt: '2025-12-15 18:44' },
    { id: 'u_0003', email: 'carol@example.com', role: 'User', status: '封禁', registeredAt: '2026-01-08 07:28' },
    { id: 'u_0004', email: 'dave@example.com', role: 'Admin', status: '正常', registeredAt: '2026-01-19 20:01' },
    { id: 'u_0005', email: 'erin@example.com', role: 'User', status: '正常', registeredAt: '2026-02-01 12:37' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex">
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="px-6 py-6 text-lg font-semibold">管理后台</div>
        <nav className="flex-1 space-y-1 px-4">
          {['控制台', '用户列表', '角色权限', '审计日志'].map((item) => (
            <div
              key={item}
              className="rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              {item}
            </div>
          ))}
        </nav>
        <div className="px-4 pb-6">
          <button
            type="button"
            onClick={() => navigate('/admin', { replace: true })}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 hover:border-gray-500"
          >
            退出后台
          </button>
        </div>
      </aside>

      <main className="flex-1 bg-gray-50 px-8 py-8 space-y-8">
        <div className="text-2xl font-semibold">控制台</div>
        <section className="grid gap-4 md:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl bg-white p-5 shadow"
            >
              <div className="text-sm text-gray-500">{stat.label}</div>
              <div className="mt-2 text-2xl font-semibold">{stat.value}</div>
            </div>
          ))}
        </section>

        <section className="rounded-xl bg-white p-5 shadow">
          <div className="text-lg font-semibold">用户列表</div>
          <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-4 py-2 font-medium">ID</th>
                  <th className="px-4 py-2 font-medium">邮箱/账号</th>
                  <th className="px-4 py-2 font-medium">角色</th>
                  <th className="px-4 py-2 font-medium">状态</th>
                  <th className="px-4 py-2 font-medium">注册时间</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-gray-200">
                    <td className="px-4 py-2">{u.id}</td>
                    <td className="px-4 py-2">{u.email}</td>
                    <td className="px-4 py-2">{u.role}</td>
                    <td className="px-4 py-2">{u.status}</td>
                    <td className="px-4 py-2 text-gray-500">{u.registeredAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}
