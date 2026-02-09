export type RedirectDecision = {
  destination: { kind: 'external' | 'internal'; url: string } | null
  error: string | null
}

export const isAllowedRedirect = (
  target: string,
  allowedHosts: string[],
  baseOrigin: string
) => {
  try {
    const resolved = new URL(target, baseOrigin)
    if (resolved.origin === baseOrigin) {
      return true
    }
    return (
      allowedHosts.includes(resolved.host) ||
      allowedHosts.includes(resolved.hostname)
    )
  } catch {
    return false
  }
}

export const normalizeFromPath = (fromPath?: string | null) => {
  if (!fromPath || fromPath === '/login') {
    return '/'
  }
  return fromPath
}

export const resolveReferrerRedirect = ({
  referrer,
  allowedHosts,
  baseOrigin,
  callbackPath = '/auth/callback',
}: {
  referrer?: string | null
  allowedHosts: string[]
  baseOrigin: string
  callbackPath?: string
}): string | null => {
  if (!referrer) {
    return null
  }

  try {
    const resolved = new URL(referrer)
    if (resolved.origin === baseOrigin) {
      return null
    }

    if (
      !allowedHosts.includes(resolved.host) &&
      !allowedHosts.includes(resolved.hostname)
    ) {
      return null
    }

    const callbackUrl = new URL(callbackPath, resolved.origin)
    return callbackUrl.toString()
  } catch {
    return null
  }
}

export const resolvePostLoginDestination = ({
  redirectUrl,
  allowedHosts,
  baseOrigin,
  fromPath,
  referrerOrigin,
}: {
  redirectUrl: string | null
  allowedHosts: string[]
  baseOrigin: string
  fromPath?: string | null
  referrerOrigin?: string | null
}): RedirectDecision => {
  const normalizedFromPath = normalizeFromPath(fromPath)

  if (redirectUrl) {
    const looksRelative =
      !redirectUrl.startsWith('http://') && !redirectUrl.startsWith('https://')
    if (looksRelative && referrerOrigin) {
      try {
        const referrerHost = new URL(referrerOrigin).host
        if (
          allowedHosts.includes(referrerHost) ||
          allowedHosts.includes(new URL(referrerOrigin).hostname)
        ) {
          const resolved = new URL(redirectUrl, referrerOrigin)
          return {
            destination: { kind: 'external', url: resolved.toString() },
            error: null,
          }
        }
      } catch {
        return { destination: null, error: '回跳地址不允许' }
      }
    }

    if (!isAllowedRedirect(redirectUrl, allowedHosts, baseOrigin)) {
      return { destination: null, error: '回跳地址不允许' }
    }

    const resolved = new URL(redirectUrl, baseOrigin)
    if (resolved.origin === baseOrigin) {
      const url = `${resolved.pathname}${resolved.search}${resolved.hash}` || '/'
      return { destination: { kind: 'internal', url }, error: null }
    }

    return { destination: { kind: 'external', url: resolved.toString() }, error: null }
  }

  return { destination: { kind: 'internal', url: normalizedFromPath }, error: null }
}
