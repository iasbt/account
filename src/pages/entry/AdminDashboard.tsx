import { useNavigate } from 'react-router-dom'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const stats = [
    { label: '总用户数', value: '12,480' },
    { label: '图片总量', value: '84,120' },
    { label: '存储用量', value: '2.4 TB' },
  ]
  const activities = [
    { id: 'U-202401', user: 'lihua', status: '已通过', time: '10:12' },
    { id: 'U-202402', user: 'chen', status: '待审核', time: '10:34' },
    { id: 'U-202403', user: 'maria', status: '已通过', time: '11:02' },
    { id: 'U-202404', user: 'alex', status: '已拒绝', time: '11:25' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex">
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="px-6 py-6 text-lg font-semibold">管理后台</div>
        <nav className="flex-1 space-y-1 px-4">
          {['概览', '用户管理', '内容审核', '设置'].map((item) => (
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
        <div className="text-2xl font-semibold">概览</div>
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
          <div className="text-lg font-semibold">最近上传记录</div>
          <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-4 py-2 font-medium">ID</th>
                  <th className="px-4 py-2 font-medium">用户名</th>
                  <th className="px-4 py-2 font-medium">状态</th>
                  <th className="px-4 py-2 font-medium">时间</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((item) => (
                  <tr key={item.id} className="border-t border-gray-200">
                    <td className="px-4 py-2">{item.id}</td>
                    <td className="px-4 py-2">{item.user}</td>
                    <td className="px-4 py-2">{item.status}</td>
                    <td className="px-4 py-2 text-gray-500">{item.time}</td>
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
