import { describe, it, expect } from 'vitest'
import { recordMetric } from './metrics'

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
    clear: () => {
      store.clear()
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size
    },
  } as Storage
}

describe('recordMetric', () => {
  it('increments count and total', () => {
    const storage = createStorage()
    recordMetric(storage, 'login_duration_ms', 120)
    recordMetric(storage, 'login_duration_ms', 80)
    const raw = storage.getItem('sso_metrics')
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw ?? '{}')
    expect(parsed.login_duration_ms.count).toBe(2)
    expect(parsed.login_duration_ms.total).toBe(200)
  })
})
