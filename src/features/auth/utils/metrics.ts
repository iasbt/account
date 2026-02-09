type MetricEntry = {
  count: number
  total: number
}

type MetricsStore = Record<string, MetricEntry>

const readMetrics = (storage: Storage, storeKey: string): MetricsStore => {
  try {
    const raw = storage.getItem(storeKey)
    if (!raw) return {}
    return JSON.parse(raw) as MetricsStore
  } catch {
    return {}
  }
}

const writeMetrics = (storage: Storage, storeKey: string, metrics: MetricsStore) => {
  try {
    storage.setItem(storeKey, JSON.stringify(metrics))
  } catch {
    return
  }
}

export const recordMetric = (
  storage: Storage,
  key: string,
  value = 0,
  storeKey = 'sso_metrics'
) => {
  const metrics = readMetrics(storage, storeKey)
  const current = metrics[key] ?? { count: 0, total: 0 }
  metrics[key] = {
    count: current.count + 1,
    total: current.total + value,
  }
  writeMetrics(storage, storeKey, metrics)
}
