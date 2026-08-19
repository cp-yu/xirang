import { describe, expect, it, vi } from 'vitest'
import { HttpProjectionLoader, XirangProjectionError } from './HttpProjectionLoader'

const request = {
  viewId: 'full-model',
  model: 'change:auth' as const,
  mode: 'complete-with-diff' as const,
  focus: null,
  expanded: ['root.api'],
  expectedFingerprint: 'fp',
}

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), { status, headers: { 'content-type': 'application/json' } })
}

describe('HttpProjectionLoader', () => {
  it('posts the complete controller descriptor', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(json({ projectionKey: 'key', view: { id: 'model' }, diagnostics: [] }))
    const loader = new HttpProjectionLoader(fetcher)
    const controller = new AbortController()
    await expect(loader.load(request, controller.signal)).resolves.toMatchObject({ projectionKey: 'key' })
    const [url, options] = fetcher.mock.calls[0]!
    expect(url).toBe('/__xirang/projection')
    expect(options).toMatchObject({ method: 'POST', signal: controller.signal })
    expect(JSON.parse(String(options?.body))).toEqual(request)
  })

  it('preserves structured stale diagnostics', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(json({
      error: 'stale',
      currentFingerprint: 'new-fp',
    }, 409))
    const loader = new HttpProjectionLoader(fetcher)
    await expect(loader.load(request, new AbortController().signal)).rejects.toMatchObject({
      status: 409,
      diagnostic: { error: 'stale', currentFingerprint: 'new-fp' },
    } satisfies Partial<XirangProjectionError>)
  })

  it('rejects malformed successful responses', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(json({ view: {} }))
    const loader = new HttpProjectionLoader(fetcher)
    await expect(loader.load(request, new AbortController().signal)).rejects.toThrow('Invalid projection response')
  })
})
