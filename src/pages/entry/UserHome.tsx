import { useNavigate } from 'react-router-dom'

export default function UserHome() {
  const navigate = useNavigate()
  const user = {
    nickname: '示例用户',
    uid: 'u_0012398',
    email: 'user@example.com',
    registeredAt: '2025-08-12 14:23',
  }
  const logs = [
    { time: '2026-02-06 10:12', ip: '203.0.113.42' },
    { time: '2026-02-05 21:48', ip: '198.51.100.17' },
    { time: '2026-02-04 08:02', ip: '192.0.2.33' },
    { time: '2026-02-03 22:19', ip: '203.0.113.10' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="text-lg font-semibold">Unified Account</div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gray-200" />
            <button
              type="button"
              onClick={() => navigate('/login', { replace: true })}
              className="text-sm font-semibold text-red-500 hover:text-red-600"
            >
              退出
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-8 space-y-8">
        <section className="rounded-2xl bg-blue-50 px-6 py-6">
          <div className="text-xl font-semibold">账户概览</div>
          <div className="mt-1 text-sm text-gray-600">管理你的个人信息与安全设置</div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gray-200" />
              <div>
                <div className="text-lg font-semibold">{user.nickname}</div>
                <div className="text-sm text-gray-500">{user.email}</div>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm text-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">UID</span>
                <span className="font-mono">{user.uid}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">注册时间</span>
                <span>{user.registeredAt}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-lg font-semibold">安全设置</div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:border-green-500 hover:text-green-600"
                >
                  修改密码
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:border-blue-500 hover:text-blue-600"
                >
                  绑定邮箱
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:border-purple-500 hover:text-purple-600"
                >
                  启用两步验证
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-lg font-semibold">登录日志</div>
              <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="px-4 py-2 font-medium">最近登录时间</th>
                      <th className="px-4 py-2 font-medium">IP 地址</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((item, idx) => (
                      <tr key={idx} className="border-t border-gray-200">
                        <td className="px-4 py-2">{item.time}</td>
                        <td className="px-4 py-2">{item.ip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
