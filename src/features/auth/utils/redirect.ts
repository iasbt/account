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

export const resolvePostLoginDestination = ({
  redirectUrl,
  allowedHosts,
  baseOrigin,
  fromPath,
}: {
  redirectUrl: string | null
  allowedHosts: string[]
  baseOrigin: string
  fromPath?: string | null
}): RedirectDecision => {
  const normalizedFromPath = normalizeFromPath(fromPath)

  if (redirectUrl) {
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
