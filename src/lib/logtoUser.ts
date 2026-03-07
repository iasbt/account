import { useEffect, useState } from 'react'
import { useLogto } from '@logto/react'

export type LogtoUser = {
  id: string
  name?: string
  email?: string
  avatar?: string
  roles: string[]
  organizationRoles: string[]
  isAdmin: boolean
}

export const useLogtoUser = () => {
  const { isAuthenticated, getIdTokenClaims, fetchUserInfo } = useLogto()
  const [user, setUser] = useState<LogtoUser | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!isAuthenticated) {
      setUser(null)
      return
    }

    const load = async () => {
      const claims = await getIdTokenClaims()
      const userInfo = await fetchUserInfo().catch(() => null)
      if (cancelled) return

      const roles = Array.isArray(claims?.roles) ? claims.roles : []
      const organizationRoles = Array.isArray(claims?.organization_roles) ? claims.organization_roles : []
      const isAdmin = roles.includes('admin') || organizationRoles.some((role: string) => role.endsWith(':admin'))

      setUser({
        id: claims?.sub || '',
        name: claims?.name || userInfo?.name || undefined,
        email: claims?.email || userInfo?.email || undefined,
        avatar: claims?.picture || userInfo?.picture || undefined,
        roles,
        organizationRoles,
        isAdmin
      })
    }

    load()

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, getIdTokenClaims, fetchUserInfo])

  return user
}
