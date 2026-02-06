import { useNavigate } from 'react-router-dom'

export default function UserLogin() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 text-center">
        <div className="text-xl font-semibold">User Login</div>
        <button
          type="button"
          onClick={() => navigate('/user/home', { replace: true })}
          className="mt-6 w-full rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
        >
          Login
        </button>
      </div>
    </div>
  )
}
