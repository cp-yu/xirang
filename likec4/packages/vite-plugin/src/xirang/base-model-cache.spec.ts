import { describe, expect, it, vi } from 'vitest'
import { BaseModelCache } from './base-model-cache'

describe('BaseModelCache', () => {
  it('deduplicates concurrent creation for one source fingerprint', async () => {
    const factory = vi.fn(async () => ({ dispose: vi.fn() }))
    const cache = new BaseModelCache(factory)

    const [first, second] = await Promise.all([
      cache.get('fp-a', { 'model.c4': 'model {}' }),
      cache.get('fp-a', { 'model.c4': 'model {}' }),
    ])

    expect(first).toBe(second)
    expect(factory).toHaveBeenCalledOnce()
  })

  it('drops failed creations so a repaired source can retry', async () => {
    const factory = vi.fn()
      .mockRejectedValueOnce(new Error('invalid'))
      .mockResolvedValueOnce({ dispose: vi.fn() })
    const cache = new BaseModelCache(factory)

    await expect(cache.get('fp-a', {})).rejects.toThrow('invalid')
    await expect(cache.get('fp-a', {})).resolves.toBeDefined()
    expect(factory).toHaveBeenCalledTimes(2)
  })

  it('disposes models whose fingerprints are no longer active', async () => {
    const disposeA = vi.fn()
    const disposeB = vi.fn()
    const factory = vi.fn()
      .mockResolvedValueOnce({ dispose: disposeA })
      .mockResolvedValueOnce({ dispose: disposeB })
    const cache = new BaseModelCache(factory)
    await cache.get('fp-a', {})
    await cache.get('fp-b', {})

    await cache.retainFingerprints(new Set(['fp-b']))

    expect(disposeA).toHaveBeenCalledOnce()
    expect(disposeB).not.toHaveBeenCalled()
  })
})
