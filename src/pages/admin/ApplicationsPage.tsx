import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { Plus, Pencil, Trash2, Image as ImageIcon } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Application } from '../../types/database.types'
import { Modal } from '../../components/ui/Modal'
import { Tabs } from '../../components/ui/Tabs'
import { CodeBlock } from '../../components/ui/CodeBlock'

type StoreState = {
  apps: Application[]
  loading: boolean
  error: string
}

let storeState: StoreState = {
  apps: [],
  loading: true,
  error: '',
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

const loadApps = async () => {
  setStoreState({ loading: true, error: '' })
  const { data, error } = await supabase
    .from('applications')
    .select('id, code, name, icon_url, redirect_url, auth_mode')
    .order('name', { ascending: true })

  if (error) {
    setStoreState({ error: error.message, apps: [] })
  } else {
    setStoreState({ apps: (data ?? []) as Application[] })
  }
  setStoreState({ loading: false })
}

const ensureLoaded = () => {
  if (!fetchPromise) {
    fetchPromise = loadApps().finally(() => {
      fetchPromise = null
    })
  }
}

const tabItems = [
  { id: 'env', label: '.env' },
  { id: 'callback', label: 'AuthCallback.tsx' },
  { id: 'router', label: 'Router' },
]

type FormState = {
  name: string
  code: string
  port: string
  iconUrl: string
  redirectUrl: string
  authMode: 'fragment' | 'cookie'
}

const getInitialFormState = (): FormState => ({
  name: '',
  code: '',
  port: '5173',
  iconUrl: '',
  redirectUrl: '',
  authMode: 'fragment',
})

export default function ApplicationsPage() {
  const { apps, loading, error } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getSnapshot
  )
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [formState, setFormState] = useState<FormState>(getInitialFormState)
  const [editingApp, setEditingApp] = useState<Application | null>(null)
  const [activeTab, setActiveTab] = useState('env')
  const [submitError, setSubmitError] = useState('')
  const [createdApp, setCreatedApp] = useState<Application | null>(null)

  useEffect(() => {
    ensureLoaded()
  }, [])

  const redirectUrl = useMemo(() => {
    const portValue = formState.port.trim()
    if (!portValue) return ''
    return `http://localhost:${portValue}/auth/callback`
  }, [formState.port])

  const resetForm = useCallback(() => {
    setFormState(getInitialFormState())
    setSubmitError('')
  }, [])

  const handleOpenAdd = () => {
    resetForm()
    setCreatedApp(null)
    setIsWizardOpen(false)
    setIsAddOpen(true)
  }

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitError('')

    const payload = {
      name: formState.name.trim(),
      code: formState.code.trim(),
      icon_url: formState.iconUrl.trim() || null,
      redirect_url: redirectUrl,
      auth_mode: formState.authMode,
    }

    if (!payload.name || !payload.code || !payload.redirect_url) {
      setSubmitError('请完整填写应用信息')
      return
    }

    const { data, error } = await supabase
      .from('applications')
      .insert(payload)
      .select('id, code, name, icon_url, redirect_url, auth_mode')
      .single()

    if (error) {
      setSubmitError(error.message)
      return
    }

    setCreatedApp(data as Application)
    setIsWizardOpen(true)
    await loadApps()
  }

  const handleEditOpen = (app: Application) => {
    setEditingApp(app)
    setFormState({
      name: app.name,
      code: app.code,
      port: '',
      iconUrl: app.icon_url ?? '',
      redirectUrl: app.redirect_url,
      authMode: app.auth_mode === 'cookie' ? 'cookie' : 'fragment',
    })
    setSubmitError('')
    setIsEditOpen(true)
  }

  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingApp) return
    setSubmitError('')

    const payload = {
      name: formState.name.trim(),
      code: formState.code.trim(),
      icon_url: formState.iconUrl.trim() || null,
      redirect_url: formState.redirectUrl.trim(),
      auth_mode: formState.authMode,
    }

    const { error } = await supabase
      .from('applications')
      .update(payload)
      .eq('id', editingApp.id)

    if (error) {
      setSubmitError(error.message)
      return
    }

    setIsEditOpen(false)
    setEditingApp(null)
    await loadApps()
  }

  const handleDelete = async (app: Application) => {
    const confirmed = window.confirm(`确认删除 ${app.name} 吗？`)
    if (!confirmed) return
    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', app.id)
    if (error) {
      setSubmitError(error.message)
      return
    }
    await loadApps()
  }

  const envSnippet = useMemo(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''
    const accountUrl = window.location.origin
    return `VITE_SUPABASE_URL=${supabaseUrl}\nVITE_SUPABASE_KEY=${supabaseKey}\nVITE_ACCOUNT_URL=${accountUrl}`
  }, [])

  const authCallbackSnippet = useMemo(() => {
    return `import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
)

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    const params = new URLSearchParams(hash)
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')

    if (!accessToken || !refreshToken) {
      navigate('/')
      return
    }

    supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .finally(() => navigate('/'))
  }, [navigate])

  return null
}`
  }, [])

  const routerSnippet = useMemo(() => {
    return `import AuthCallback from './pages/AuthCallback'

<Routes>
  <Route path="/auth/callback" element={<AuthCallback />} />
</Routes>`
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-semibold">Applications</div>
          <div className="text-sm text-slate-400">
            管理应用接入信息并生成接入指南
          </div>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 rounded-lg border border-cyan-300/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-200 transition hover:border-cyan-300/50"
        >
          <Plus className="h-4 w-4" />
          Add Application
        </button>
      </div>

      {submitError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {submitError}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900/70 text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Icon</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Redirect URL</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
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
            {!loading && apps.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-slate-400"
                >
                  暂无应用，请先创建
                </td>
              </tr>
            )}
            {!loading &&
              apps.map((app) => (
                <tr key={app.id} className="border-t border-white/5">
                  <td className="px-4 py-3">
                    {app.icon_url ? (
                      <img
                        src={app.icon_url}
                        alt={app.name}
                        className="h-9 w-9 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900/60 text-slate-400">
                        <ImageIcon className="h-4 w-4" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-100">{app.name}</td>
                  <td className="px-4 py-3 text-slate-400">{app.code}</td>
                  <td className="px-4 py-3 text-slate-400">
                    {app.redirect_url}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditOpen(app)}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900/50 px-2 py-1 text-xs text-slate-300 hover:text-slate-100"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(app)}
                        className="inline-flex items-center gap-1 rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs text-red-300 hover:text-red-200"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={isAddOpen}
        title={isWizardOpen ? 'Integration Wizard' : 'Add Application'}
        onClose={() => {
          setIsAddOpen(false)
          setIsWizardOpen(false)
          setCreatedApp(null)
        }}
      >
        {!isWizardOpen && (
          <form className="space-y-4" onSubmit={handleCreate}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-300">
                <span>App Name</span>
                <input
                  value={formState.name}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
                  placeholder="Life OS"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-300">
                <span>App Code</span>
                <input
                  value={formState.code}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      code: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
                  placeholder="life-os"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-300">
                <span>Port</span>
                <input
                  value={formState.port}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      port: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
                  placeholder="5175"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-300">
                <span>Icon URL</span>
                <input
                  value={formState.iconUrl}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      iconUrl: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
                  placeholder="https://"
                />
              </label>
            </div>
            <label className="space-y-2 text-sm text-slate-300">
              <span>Redirect URL</span>
              <input
                value={redirectUrl}
                readOnly
                className="w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-400"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-300">
              <span>Auth Mode</span>
              <select
                value={formState.authMode}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    authMode: event.target.value as FormState['authMode'],
                  }))
                }
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
              >
                <option value="fragment">fragment</option>
                <option value="cookie">cookie</option>
              </select>
            </label>
            {submitError && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {submitError}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm text-slate-300 hover:text-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-cyan-500/20 px-4 py-2 text-sm text-cyan-200 hover:bg-cyan-500/30"
              >
                Create
              </button>
            </div>
          </form>
        )}

        {isWizardOpen && createdApp && (
          <div className="space-y-4">
            <div className="text-lg font-semibold">
              🚀 {createdApp.name} Created Successfully!
            </div>
            <Tabs items={tabItems} value={activeTab} onChange={setActiveTab} />
            {activeTab === 'env' && (
              <CodeBlock code={envSnippet} language=".env" />
            )}
            {activeTab === 'callback' && (
              <CodeBlock code={authCallbackSnippet} language="tsx" />
            )}
            {activeTab === 'router' && (
              <CodeBlock code={routerSnippet} language="tsx" />
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={isEditOpen}
        title="Edit Application"
        onClose={() => {
          setIsEditOpen(false)
          setEditingApp(null)
        }}
      >
        <form className="space-y-4" onSubmit={handleUpdate}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-300">
              <span>App Name</span>
              <input
                value={formState.name}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-300">
              <span>App Code</span>
              <input
                value={formState.code}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    code: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-300">
              <span>Redirect URL</span>
              <input
                value={formState.redirectUrl}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    redirectUrl: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-300">
              <span>Icon URL</span>
              <input
                value={formState.iconUrl}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    iconUrl: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
              />
            </label>
          </div>
          <label className="space-y-2 text-sm text-slate-300">
            <span>Auth Mode</span>
            <select
              value={formState.authMode}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  authMode: event.target.value as FormState['authMode'],
                }))
              }
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
            >
              <option value="fragment">fragment</option>
              <option value="cookie">cookie</option>
            </select>
          </label>
          {submitError && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {submitError}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm text-slate-300 hover:text-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-cyan-500/20 px-4 py-2 text-sm text-cyan-200 hover:bg-cyan-500/30"
            >
              Save
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
