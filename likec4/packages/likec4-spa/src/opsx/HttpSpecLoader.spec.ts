import { afterEach, describe, expect, it, vi } from 'vitest'
import { HttpSpecLoader, type OpsxHotChannel } from './HttpSpecLoader'

describe('HttpSpecLoader', () => {
  afterEach(() => vi.restoreAllMocks())

  it('loads the sorted registry projection for a stable element ID', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      specs: ['.opsx/specs/a/spec.md', '.opsx/specs/z/spec.md'],
    }), { status: 200, headers: { 'content-type': 'application/json' } }))
    const loader = new HttpSpecLoader(fetcher)
    const controller = new AbortController()

    await expect(loader.list('default', 'payment.authorize', controller.signal)).resolves.toEqual([
      '.opsx/specs/a/spec.md',
      '.opsx/specs/z/spec.md',
    ])
    const [url] = fetcher.mock.calls[0]!
    const parsed = new URL(String(url), 'http://localhost')
    expect(parsed.pathname).toBe('/__opsx/specs')
    expect(parsed.searchParams.get('element')).toBe('payment.authorize')
  })

  it('loads one Spec through the OPSX HTTP API with encoded query parameters', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      path: '.opsx/specs/api/spec.md',
      md: '# API',
    }), { status: 200, headers: { 'content-type': 'application/json' } }))
    const loader = new HttpSpecLoader(fetcher)
    const controller = new AbortController()

    await expect(loader.load('default', 'core.api', '.opsx/specs/api/spec.md', controller.signal)).resolves.toEqual({
      path: '.opsx/specs/api/spec.md',
      md: '# API',
    })

    const [url, options] = fetcher.mock.calls[0]!
    const parsed = new URL(String(url), 'http://localhost')
    expect(parsed.pathname).toBe('/__opsx/spec')
    expect(parsed.searchParams.get('project')).toBe('default')
    expect(parsed.searchParams.get('element')).toBe('core.api')
    expect(parsed.searchParams.get('path')).toBe('.opsx/specs/api/spec.md')
    expect(options).toMatchObject({ signal: controller.signal })
  })

  it('calls browser fetch with the global receiver', async () => {
    let receiver: unknown
    const fetcher = function(this: unknown) {
      receiver = this
      return Promise.resolve(new Response(JSON.stringify({
        path: '.opsx/specs/api/spec.md',
        md: '# API',
      }), { status: 200, headers: { 'content-type': 'application/json' } }))
    } as typeof fetch
    const loader = new HttpSpecLoader(fetcher)

    await loader.load('default', 'core.api', '.opsx/specs/api/spec.md', new AbortController().signal)

    expect(receiver).toBe(globalThis)
  })

  it('reports server errors without discarding the selected path', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(
      JSON.stringify({ error: 'Spec not found' }),
      { status: 404, headers: { 'content-type': 'application/json' } },
    ))
    const loader = new HttpSpecLoader(fetcher)

    await expect(loader.load(
      'default',
      'core.api',
      '.opsx/specs/missing/spec.md',
      new AbortController().signal,
    )).rejects.toThrow('Spec not found')
  })

  it('notifies subscribers only for exact Spec change paths', () => {
    const listeners = new Map<string, (payload: { path: string }) => void>()
    const hot: OpsxHotChannel = {
      on: (event, listener) => listeners.set(event, listener),
      off: (event) => listeners.delete(event),
    }
    const loader = new HttpSpecLoader(fetch, hot)
    const subscriber = vi.fn()
    const unsubscribe = loader.subscribe(subscriber)

    listeners.get('opsx:spec-changed')?.({ path: '.opsx/specs/api/spec.md' })
    expect(subscriber).toHaveBeenCalledWith('.opsx/specs/api/spec.md')

    unsubscribe()
    expect(listeners.has('opsx:spec-changed')).toBe(false)
  })
})
