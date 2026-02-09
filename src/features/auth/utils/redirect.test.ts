import { describe, it, expect } from 'vitest'
import {
  isAllowedRedirect,
  normalizeFromPath,
  resolvePostLoginDestination,
  resolveReferrerRedirect,
} from './redirect'

describe('isAllowedRedirect', () => {
  const baseOrigin = 'https://account.test'

  it('allows same-origin redirect', () => {
    expect(isAllowedRedirect('/admin', ['app.test'], baseOrigin)).toBe(true)
  })

  it('allows allowlist hostname', () => {
    expect(
      isAllowedRedirect('https://app.test/auth/callback', ['app.test'], baseOrigin)
    ).toBe(true)
  })

  it('allows allowlist host with port', () => {
    expect(
      isAllowedRedirect('http://localhost:5173/auth/callback', ['localhost:5173'], baseOrigin)
    ).toBe(true)
  })
})

describe('normalizeFromPath', () => {
  it('defaults to root when empty or login', () => {
    expect(normalizeFromPath()).toBe('/')
    expect(normalizeFromPath('/login')).toBe('/')
  })

  it('keeps valid path', () => {
    expect(normalizeFromPath('/admin')).toBe('/admin')
  })
})

describe('resolvePostLoginDestination', () => {
  const baseOrigin = 'https://account.test'
  const allowedHosts = ['app.test']

  it('returns external destination when allowed', () => {
    const result = resolvePostLoginDestination({
      redirectUrl: 'https://app.test/auth/callback',
      allowedHosts,
      baseOrigin,
      fromPath: '/dashboard',
    })
    expect(result.error).toBeNull()
    expect(result.destination?.kind).toBe('external')
  })

  it('returns internal destination for same-origin redirect', () => {
    const result = resolvePostLoginDestination({
      redirectUrl: '/admin?tab=users',
      allowedHosts,
      baseOrigin,
      fromPath: '/dashboard',
    })
    expect(result.error).toBeNull()
    expect(result.destination).toEqual({
      kind: 'internal',
      url: '/admin?tab=users',
    })
  })

  it('resolves relative redirect against referrer origin', () => {
    const result = resolvePostLoginDestination({
      redirectUrl: '/auth/callback',
      allowedHosts,
      baseOrigin,
      fromPath: '/dashboard',
      referrerOrigin: 'https://app.test',
    })
    expect(result.error).toBeNull()
    expect(result.destination).toEqual({
      kind: 'external',
      url: 'https://app.test/auth/callback',
    })
  })

  it('returns error for disallowed redirect', () => {
    const result = resolvePostLoginDestination({
      redirectUrl: 'https://evil.test/callback',
      allowedHosts,
      baseOrigin,
      fromPath: '/dashboard',
    })
    expect(result.error).toBe('回跳地址不允许')
    expect(result.destination).toBeNull()
  })

  it('falls back to fromPath when no redirect', () => {
    const result = resolvePostLoginDestination({
      redirectUrl: null,
      allowedHosts,
      baseOrigin,
      fromPath: '/apps',
    })
    expect(result.error).toBeNull()
    expect(result.destination).toEqual({ kind: 'internal', url: '/apps' })
  })
})

describe('resolveReferrerRedirect', () => {
  const baseOrigin = 'https://account.test'
  const allowedHosts = ['app.test', 'app.test:8080']

  it('returns callback path for allowed referrer origin', () => {
    const result = resolveReferrerRedirect({
      referrer: 'https://app.test/sso/login',
      allowedHosts,
      baseOrigin,
    })
    expect(result).toBe('https://app.test/auth/callback')
  })

  it('returns null for same-origin referrer', () => {
    const result = resolveReferrerRedirect({
      referrer: 'https://account.test/login',
      allowedHosts,
      baseOrigin,
    })
    expect(result).toBeNull()
  })

  it('returns null for disallowed referrer', () => {
    const result = resolveReferrerRedirect({
      referrer: 'https://evil.test/login',
      allowedHosts,
      baseOrigin,
    })
    expect(result).toBeNull()
  })
})
