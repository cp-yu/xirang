import { afterEach, describe, expect, it, vi } from 'vitest'
import { HttpSpecLoader, type XirangHotChannel } from './HttpSpecLoader'

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), { status, headers: { 'content-type': 'application/json' } })
}

describe('HttpSpecLoader', () => {
  afterEach(() => vi.restoreAllMocks())

  it('loads one Contract addressed by Element identity', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(json({ element: 'core.api', md: '# API' }))
    const loader = new HttpSpecLoader(fetcher)
    const controller = new AbortController()

    await expect(loader.load('default', 'core.api', controller.signal)).resolves.toEqual({
      element: 'core.api',
      md: '# API',
    })

    const [url, options] = fetcher.mock.calls[0]!
    const parsed = new URL(String(url), 'http://localhost')
    expect(parsed.pathname).toBe('/__xirang/spec')
    expect(parsed.searchParams.get('project')).toBe('default')
    expect(parsed.searchParams.get('element')).toBe('core.api')
    expect(parsed.searchParams.get('variant')).toBe('formal')
    expect(parsed.searchParams.has('path')).toBe(false)
    expect(options).toMatchObject({ signal: controller.signal })
  })

  it('calls browser fetch with the global receiver', async () => {
    let receiver: unknown
    const fetcher = function(this: unknown) {
      receiver = this
      return Promise.resolve(json({ element: 'core.api', md: '# API' }))
    } as typeof fetch
    const loader = new HttpSpecLoader(fetcher)

    await loader.load('default', 'core.api', new AbortController().signal)

    expect(receiver).toBe(globalThis)
  })

  it('reports an absent Contract as null instead of throwing', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(json({ error: 'Contract not found' }, 404))
    const loader = new HttpSpecLoader(fetcher)

    await expect(loader.load('default', 'core.missing', new AbortController().signal)).resolves.toBeNull()
  })

  it('propagates non-404 server errors with the server message', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(json({ error: 'Project not found' }, 500))
    const loader = new HttpSpecLoader(fetcher)

    await expect(loader.load('default', 'core.api', new AbortController().signal))
      .rejects.toThrow('Project not found')
  })

  it('rejects a malformed success payload', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(json({ md: '# API' }))
    const loader = new HttpSpecLoader(fetcher)

    await expect(loader.load('default', 'core.api', new AbortController().signal))
      .rejects.toThrow('Invalid Contract response')
  })

  it('subscribes to manifest changes only', () => {
    const listeners = new Map<string, (payload: unknown) => void>()
    const hot: XirangHotChannel = {
      on: (event, listener) => listeners.set(event, listener),
      off: (event) => listeners.delete(event),
    }
    const loader = new HttpSpecLoader(fetch, hot)
    const subscriber = vi.fn()
    const unsubscribe = loader.subscribeVariants(subscriber)

    listeners.get('xirang:change-manifest-changed')?.({})
    expect(subscriber).toHaveBeenCalledOnce()
    expect(listeners.has('xirang:spec-changed')).toBe(false)

    unsubscribe()
    expect(listeners.has('xirang:change-manifest-changed')).toBe(false)
  })
})
