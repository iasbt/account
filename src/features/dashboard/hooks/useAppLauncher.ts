import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAuthStore } from '../../../store/useAuthStore'
import type { Application } from '../../../types/database.types'

type AppLauncherState = {
  apps: Application[]
  loading: boolean
  error: string
  launchApp: (app: Application) => Promise<void>
}

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

const fetchApps = async () => {
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

const ensureFetched = () => {
  if (!fetchPromise) {
    fetchPromise = fetchApps().finally(() => {
      fetchPromise = null
    })
  }
}

export function useAppLauncher(): AppLauncherState {
  const user = useAuthStore((state) => state.user)
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  useEffect(() => {
    ensureFetched()
  }, [])

  const launchApp = useCallback(
    async (app: Application) => {
      if (user) {
        // ✅ 核心修复：字段名修正为 app_id
        const { error: upsertError } = await supabase
          .from('user_app_access')
          .upsert({
            user_id: user.id,
            app_id: app.id, // 这里之前是 application_id (错误)，现已修正为 app_id
            last_accessed_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id, app_id'
          })

        if (upsertError) {
          console.error('Failed to upsert user_app_access:', upsertError)
        }
      }

      const { data } = await supabase.auth.getSession()
      const session = data.session

      if (!session) {
        window.location.href = '/login'
        return
      }

      if (app.auth_mode === 'fragment') {
        const accessToken = encodeURIComponent(session.access_token)
        const refreshToken = encodeURIComponent(session.refresh_token)
        const targetUrl = `${app.redirect_url}#access_token=${accessToken}&refresh_token=${refreshToken}&type=recovery`
        window.location.href = targetUrl
        return
      }

      window.location.href = app.redirect_url
    },
    [user]
  )

  return { apps: state.apps, loading: state.loading, error: state.error, launchApp }
}