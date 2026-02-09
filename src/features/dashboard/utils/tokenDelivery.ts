import type { Session } from '@supabase/supabase-js'

type StorageLike = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

export type ExchangeEntry = {
  accessToken: string
  refreshToken: string
  expiresAt: number | null
  targetOrigin: string
  createdAt: number
  ttlMs: number
}

export type ExchangeRedirectResult = {
  url: string
  code: string
  entry: ExchangeEntry
}

const createExchangeCode = (override?: string) => {
  if (override) return override
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export const buildFragmentRedirect = (redirectUrl: string, session: Session) => {
  const accessToken = encodeURIComponent(session.access_token)
  const refreshToken = encodeURIComponent(session.refresh_token)
  return `${redirectUrl}#access_token=${accessToken}&refresh_token=${refreshToken}&type=recovery`
}

export const buildExchangeRedirect = ({
  redirectUrl,
  session,
  accountOrigin,
  storage,
  ttlMs = 120000,
  now = Date.now(),
  code,
}: {
  redirectUrl: string
  session: Session
  accountOrigin: string
  storage: StorageLike
  ttlMs?: number
  now?: number
  code?: string
}): ExchangeRedirectResult | null => {
  try {
    const targetOrigin = new URL(redirectUrl).origin
    const exchangeCode = createExchangeCode(code)
    const entry: ExchangeEntry = {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresAt: session.expires_at ? session.expires_at * 1000 : null,
      targetOrigin,
      createdAt: now,
      ttlMs,
    }
    storage.setItem(`sso_exchange:${exchangeCode}`, JSON.stringify(entry))
    const url = new URL(redirectUrl)
    url.searchParams.set('sso_code', exchangeCode)
    url.searchParams.set('sso_origin', accountOrigin)
    return { url: url.toString(), code: exchangeCode, entry }
  } catch {
    return null
  }
}

export const readExchangeEntry = (
  storage: StorageLike,
  code: string
): ExchangeEntry | null => {
  try {
    const raw = storage.getItem(`sso_exchange:${code}`)
    if (!raw) return null
    return JSON.parse(raw) as ExchangeEntry
  } catch {
    return null
  }
}

export const clearExchangeEntry = (storage: StorageLike, code: string) => {
  try {
    storage.removeItem(`sso_exchange:${code}`)
  } catch {
    return
  }
}
