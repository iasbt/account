import { useNavigate } from 'react-router-dom'

export default function UserHome() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 text-center">
        <div className="text-xl font-semibold">User Home</div>
        <button
          type="button"
          onClick={() => navigate('/login', { replace: true })}
          className="mt-6 w-full rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-300/40 hover:text-cyan-200"
        >
          Logout
        </button>
      </div>
    </div>
  )
}
