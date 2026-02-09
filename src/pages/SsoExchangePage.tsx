import { useEffect, useMemo, useRef } from 'react'
import {
  clearExchangeEntry,
  readExchangeEntry,
} from '../features/dashboard/utils/tokenDelivery'
import { recordMetric } from '../features/auth/utils/metrics'

const postExchangeMessage = (
  targetOrigin: string,
  payload: { type: string; code: string; session?: unknown; reason?: string }
) => {
  window.parent.postMessage(payload, targetOrigin)
}

export default function SsoExchangePage() {
  const sentRef = useRef(false)

  const params = useMemo(() => {
    const search = new URLSearchParams(window.location.search)
    return {
      code: search.get('code'),
      targetOrigin: search.get('target_origin'),
    }
  }, [])

  useEffect(() => {
    if (sentRef.current) return
    const code = params.code
    const targetOrigin = params.targetOrigin

    if (!code || !targetOrigin) {
      recordMetric(localStorage, 'exchange_error')
      return
    }

    const entry = readExchangeEntry(window.sessionStorage, code)
    if (!entry) {
      recordMetric(localStorage, 'exchange_error')
      postExchangeMessage(targetOrigin, {
        type: 'sso_exchange_error',
        code,
        reason: 'not_found',
      })
      sentRef.current = true
      return
    }

    if (entry.targetOrigin !== targetOrigin) {
      clearExchangeEntry(window.sessionStorage, code)
      recordMetric(localStorage, 'exchange_error')
      postExchangeMessage(targetOrigin, {
        type: 'sso_exchange_error',
        code,
        reason: 'origin_mismatch',
      })
      sentRef.current = true
      return
    }

    if (Date.now() - entry.createdAt > entry.ttlMs) {
      clearExchangeEntry(window.sessionStorage, code)
      recordMetric(localStorage, 'exchange_error')
      postExchangeMessage(targetOrigin, {
        type: 'sso_exchange_error',
        code,
        reason: 'expired',
      })
      sentRef.current = true
      return
    }

    clearExchangeEntry(window.sessionStorage, code)
    recordMetric(localStorage, 'exchange_success')
    postExchangeMessage(targetOrigin, {
      type: 'sso_exchange_success',
      code,
      session: {
        accessToken: entry.accessToken,
        refreshToken: entry.refreshToken,
        expiresAt: entry.expiresAt,
      },
    })
    sentRef.current = true
  }, [params.code, params.targetOrigin])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center text-sm">
      处理中
    </div>
  )
}
