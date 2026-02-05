import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { Shield, User as UserIcon } from 'lucide-react'
import { supabase } from '../../lib/supabase'

type UserRow = {
  id: string
  role: 'admin' | 'user' | string
  email?: string | null
  avatar_url?: string | null
  created_at?: string | null
}

type StoreState = {
  users: UserRow[]
  loading: boolean
  error: string
  warning: string
}

let storeState: StoreState = {
  users: [],
  loading: true,
  error: '',
  warning: '',
}

const listeners = new Set<() => void>()
let fetchPromise: Promise<void> | null = null

const setStoreState = (partial: Partial<StoreState>) => {
  storeState = { ...storeState, ...partial }
  listeners.forEach((listener) => listener())
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const getSnapshot = () => storeState

const fetchUsers = async () => {
  setStoreState({ loading: true, error: '', warning: '' })
  const fullSelect = 'id, role, email, created_at, avatar_url'
  const fallbackSelect = 'id, role'

  const { data, error } = await supabase.from('profiles').select(fullSelect)

  if (error) {
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('profiles')
      .select(fallbackSelect)
    if (fallbackError) {
      setStoreState({ error: fallbackError.message, users: [] })
    } else {
      setStoreState({
        users: (fallbackData ?? []) as UserRow[],
        warning: 'profiles 表缺少 email/created_at/avatar_url，仅展示 ID 与 Role',
      })
    }
    setStoreState({ loading: false })
    return
  }

  setStoreState({ users: (data ?? []) as UserRow[], loading: false })
}

const ensureLoaded = () => {
  if (!fetchPromise) {
    fetchPromise = fetchUsers().finally(() => {
      fetchPromise = null
    })
  }
}

export default function UsersPage() {
  const { users, loading, error, warning } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getSnapshot
  )
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    ensureLoaded()
  }, [])

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      if (a.role === b.role) return a.id.localeCompare(b.id)
      return a.role === 'admin' ? -1 : 1
    })
  }, [users])

  const handleRoleChange = async (userId: string, role: UserRow['role']) => {
    setActionError('')
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId)
    if (updateError) {
      setActionError(updateError.message)
      return
    }
    await fetchUsers()
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-2xl font-semibold">Users</div>
        <div className="text-sm text-slate-400">管理用户角色权限</div>
      </div>

      {warning && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          {warning}
        </div>
      )}

      {(error || actionError) && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error || actionError}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900/70 text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Avatar</th>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Created At</th>
              <th className="px-4 py-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-slate-400"
                >
                  Loading...
                </td>
              </tr>
            )}
            {!loading && sortedUsers.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-slate-400"
                >
                  暂无用户
                </td>
              </tr>
            )}
            {!loading &&
              sortedUsers.map((user) => {
                const isAdmin = user.role === 'admin'
                const createdAt = user.created_at
                  ? new Date(user.created_at).toLocaleString()
                  : '-'
                return (
                  <tr key={user.id} className="border-t border-white/5">
                    <td className="px-4 py-3">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.email ?? user.id}
                          className="h-9 w-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/60 text-slate-400">
                          <UserIcon className="h-4 w-4" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-100">
                        {user.email ?? user.id}
                      </div>
                      {user.email && (
                        <div className="text-xs text-slate-500">{user.id}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          isAdmin
                            ? 'inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-200'
                            : 'inline-flex items-center rounded-full border border-slate-700 bg-slate-900/70 px-2 py-0.5 text-xs text-slate-300'
                        }
                      >
                        {isAdmin && <Shield className="h-3 w-3" />}
                        {isAdmin ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{createdAt}</td>
                    <td className="px-4 py-3 text-right">
                      <select
                        value={user.role}
                        onChange={(event) =>
                          handleRoleChange(user.id, event.target.value)
                        }
                        className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 focus:border-cyan-400 focus:outline-none"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
