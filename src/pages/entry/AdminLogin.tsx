import { useNavigate } from 'react-router-dom'

export default function AdminLogin() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded bg-white p-8 shadow-md">
        <div className="text-xl font-semibold text-center">管理员后台</div>
        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            navigate('/admin/dashboard', { replace: true })
          }}
        >
          <div className="space-y-2">
            <label className="text-sm text-gray-600">账号</label>
            <input
              type="email"
              autoComplete="username"
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
              placeholder="admin@example.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-gray-600">密码</label>
            <input
              type="password"
              autoComplete="current-password"
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
              placeholder="请输入密码"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            登录
          </button>
        </form>
      </div>
    </div>
  )
}
