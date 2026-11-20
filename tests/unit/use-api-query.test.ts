import { beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { clearQueryCache, useApiQuery } from '~/composables/useApiQuery'

const flush = () => new Promise((r) => setTimeout(r, 0))

describe('useApiQuery', () => {
  beforeEach(() => clearQueryCache())

  it('de-duplicates identical requests (one fetch for many widgets)', async () => {
    const fetcher = vi.fn(() => Promise.resolve(42))
    const scope = effectScope()
    const results = scope.run(() => [
      useApiQuery(() => 'same', fetcher),
      useApiQuery(() => 'same', fetcher),
      useApiQuery(() => 'same', fetcher),
    ])!
    await flush()
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(results.map((r) => r.data.value)).toEqual([42, 42, 42])
    scope.stop()
  })

  it('re-fetches when the key changes and ignores stale responses', async () => {
    const key = ref('a')
    const resolvers: Record<string, (v: string) => void> = {}
    const fetcher = vi.fn(() => new Promise<string>((resolve) => (resolvers[key.value] = resolve)))
    const scope = effectScope()
    const q = scope.run(() => useApiQuery(() => key.value, fetcher))!

    key.value = 'b'
    await nextTick()
    resolvers.b!('B')
    await flush()
    resolvers.a!('A') // slow old response arrives last
    await flush()

    expect(q.data.value).toBe('B')
    expect(q.pending.value).toBe(false)
    scope.stop()
  })

  it('exposes errors and does not cache failures', async () => {
    let fail = true
    const fetcher = vi.fn(() => (fail ? Promise.reject(new Error('boom')) : Promise.resolve('ok')))
    const scope = effectScope()
    const q = scope.run(() => useApiQuery(() => 'k', fetcher))!
    await flush()
    expect(q.error.value?.message).toBe('boom')

    fail = false
    await q.refresh()
    expect(q.data.value).toBe('ok')
    expect(q.error.value).toBeNull()
    scope.stop()
  })

  it('does nothing while the key is null (disabled query)', async () => {
    const fetcher = vi.fn(() => Promise.resolve(1))
    const scope = effectScope()
    scope.run(() => useApiQuery(() => null, fetcher))
    await flush()
    expect(fetcher).not.toHaveBeenCalled()
    scope.stop()
  })
})
