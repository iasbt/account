import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<
    Array<{ id: string; email?: string | null; role?: string | null; created_at?: string | null }>
  >([])
  const [error, setError] = useState<string>('')

  useEffect(() => {
    let mounted = true
    const fetch = async () => {
      setLoading(true)
      setError('')
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, role, created_at')
      if (error) {
        if (!mounted) return
        setError(error.message ?? '加载失败')
        setRows([])
        setLoading(false)
        return
      }
      if (!mounted) return
      setRows((data ?? []) as typeof rows)
      setLoading(false)
    }
    fetch()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex">
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="px-6 py-6 text-lg font-semibold">管理后台</div>
        <nav className="flex-1 space-y-1 px-4">
          {['User Management', 'System Audit'].map((item) => (
            <div
              key={item}
              className="rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              {item}
            </div>
          ))}
        </nav>
      </aside>

      <main className="flex-1 bg-gray-50 px-8 py-8 space-y-8">
        <div className="text-2xl font-semibold">User List (Database Records)</div>
        <section className="rounded-xl bg-white p-5 shadow">
          <div className="text-lg font-semibold">profiles</div>
          {loading && (
            <div className="mt-4 flex items-center gap-3 text-sm text-gray-600">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-l-transparent" />
              <span>Loading...</span>
            </div>
          )}
          {!loading && error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          {!loading && !error && rows.length === 0 && (
            <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
              暂无数据
            </div>
          )}
          <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-4 py-2 font-medium">ID</th>
                  <th className="px-4 py-2 font-medium">Email</th>
                  <th className="px-4 py-2 font-medium">Role</th>
                  <th className="px-4 py-2 font-medium">Created At</th>
                </tr>
              </thead>
              <tbody>
                {!loading &&
                  !error &&
                  rows.map((r) => (
                    <tr key={r.id} className="border-t border-gray-200">
                      <td className="px-4 py-2">{r.id}</td>
                      <td className="px-4 py-2">{r.email ?? '-'}</td>
                      <td className="px-4 py-2">{r.role ?? '-'}</td>
                      <td className="px-4 py-2 text-gray-500">{r.created_at ?? '-'}</td>
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
