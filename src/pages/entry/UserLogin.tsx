import { useNavigate } from 'react-router-dom'

export default function UserLogin() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded bg-white p-8 shadow-md">
        <div className="text-xl font-semibold text-center">用户登录</div>
        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            navigate('/user/home', { replace: true })
          }}
        >
          <div className="space-y-2">
            <label className="text-sm text-gray-600">邮箱</label>
            <input
              type="email"
              autoComplete="email"
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-gray-600">密码</label>
            <input
              type="password"
              autoComplete="current-password"
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
              placeholder="请输入密码"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
          >
            登录
          </button>
        </form>
      </div>
    </div>
  )
}
