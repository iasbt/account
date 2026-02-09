import { describe, it, expect } from 'vitest'
import type { Session } from '@supabase/supabase-js'
import {
  buildExchangeRedirect,
  buildFragmentRedirect,
  readExchangeEntry,
} from './tokenDelivery'

const createStorage = () => {
  const store = new Map<string, string>()
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
  }
}

describe('buildFragmentRedirect', () => {
  it('builds fragment url with tokens', () => {
    const session = {
      access_token: 'access',
      refresh_token: 'refresh',
      expires_at: 123,
      token_type: 'bearer',
      user: null,
    } as unknown as Session
    const url = buildFragmentRedirect('https://app.test/auth/callback', session)
    expect(url).toContain('#access_token=access')
    expect(url).toContain('refresh_token=refresh')
  })
})

describe('buildExchangeRedirect', () => {
  it('stores exchange entry and returns url', () => {
    const storage = createStorage()
    const session = {
      access_token: 'access',
      refresh_token: 'refresh',
      expires_at: 123,
      token_type: 'bearer',
      user: null,
    } as unknown as Session
    const result = buildExchangeRedirect({
      redirectUrl: 'https://app.test/auth/callback',
      session,
      accountOrigin: 'https://account.test',
      storage,
      now: 1000,
      code: 'code-123',
    })
    expect(result?.url).toContain('sso_code=code-123')
    expect(result?.url).toContain('sso_origin=https%3A%2F%2Faccount.test')
    const entry = readExchangeEntry(storage, 'code-123')
    expect(entry?.targetOrigin).toBe('https://app.test')
    expect(entry?.accessToken).toBe('access')
  })
})
