import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAuthStore } from '../../../store/useAuthStore'
import type { Application } from '../../../types/database.types'
import {
  buildExchangeRedirect,
  buildFragmentRedirect,
} from '../utils/tokenDelivery'

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
        const { error: insertError } = await supabase
          .from('user_app_access')
          .insert({
            user_id: user.id,
            app_id: app.id,
            app_name: app.name,
            last_accessed_at: new Date().toISOString(),
          })

        if (insertError) {
          console.error('Failed to insert user_app_access:', insertError)
        }
      }

      const { data } = await supabase.auth.getSession()
      const session = data.session

      if (!session) {
        window.location.href = '/login'
        return
      }

      if (app.auth_mode === 'fragment') {
        window.location.href = buildFragmentRedirect(app.redirect_url, session)
        return
      }

      if (app.auth_mode === 'cookie') {
        const exchange = buildExchangeRedirect({
          redirectUrl: app.redirect_url,
          session,
          accountOrigin: window.location.origin,
          storage: window.sessionStorage,
        })
        if (exchange) {
          window.location.href = exchange.url
          return
        }
        window.location.href = buildFragmentRedirect(app.redirect_url, session)
        return
      }

      window.location.href = app.redirect_url
    },
    [user]
  )

  return { apps: state.apps, loading: state.loading, error: state.error, launchApp }
}
