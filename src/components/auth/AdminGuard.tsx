import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '../../store/useAuthStore'
import { supabase } from '../../lib/supabase'

export default function AdminGuard() {
  const { user, role, loading, setRole } = useAuthStore()
  const location = useLocation()
  const [verifying, setVerifying] = useState(false)
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    let active = true
    if (!user || role === 'admin' || verified || verifying) return undefined

    const run = async () => {
      setVerifying(true)
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      if (!active) return
      if (data?.role) {
        setRole(data.role)
      }
      setVerified(true)
      setVerifying(false)
    }

    run()

    return () => {
      active = false
    }
  }, [user, role, verified, verifying, setRole])

  if (loading || verifying) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-200">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (role !== 'admin') {
    return <Navigate to="/" replace state={{ unauthorized: true }} />
  }

  return <Outlet />
}
