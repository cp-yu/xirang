import { describe, expect, it, vi } from 'vitest'
import {
  assertFingerprintFresh,
  computeProjectionKey,
  handleProjection,
  parseProjectionRequest,
} from './xirang-projection-handler'
import { ProjectionCache } from './projection-cache'
import { XirangContractError } from './xirang-contract-handler'
import type { LayoutedView } from '@likec4/core/types'

const FINGERPRINT = 'abc123def456'

function makeManifest(fingerprint = FINGERPRINT) {
  return JSON.stringify({
    version: 4,
    modelFingerprint: fingerprint,
    model: { contracts: {} },
    authoredViews: {},
    changes: {},
  })
}

function fakeView(id: string): LayoutedView {
  return { id, nodes: [], edges: [], bounds: { x: 0, y: 0, width: 100, height: 100 } } as unknown as LayoutedView
}

describe('parseProjectionRequest', () => {
  it('accepts a valid request body', () => {
    const result = parseProjectionRequest({
      viewId: 'model',
      mode: 'complete',
      focus: null,
      expanded: ['domain-a'],
      expectedFingerprint: FINGERPRINT,
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.request.viewId).toBe('model')
    expect(result.request.mode).toBe('complete')
    expect(result.request.expanded).toEqual(['domain-a'])
  })

  it('rejects a non-object body', () => {
    for (const body of [null, 'string', 42, []]) {
      const result = parseProjectionRequest(body)
      expect(result.ok, String(body)).toBe(false)
      if (result.ok) return
      expect(result.statusCode).toBe(400)
    }
  })

  it('rejects an invalid mode', () => {
    const result = parseProjectionRequest({ viewId: 'model', mode: 'invalid', expectedFingerprint: FINGERPRINT })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.message).toContain('mode')
  })

  it('rejects a missing fingerprint', () => {
    const result = parseProjectionRequest({ viewId: 'model', mode: 'complete' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.message).toContain('expectedFingerprint')
  })
})

describe('computeProjectionKey', () => {
  const base = { viewId: 'model', mode: 'complete' as const, focus: null, expanded: [], expectedFingerprint: FINGERPRINT }

  it('is deterministic for the same request', () => {
    expect(computeProjectionKey(base)).toBe(computeProjectionKey(base))
  })

  it('is insensitive to expanded order', () => {
    expect(computeProjectionKey({ ...base, expanded: ['a', 'b', 'c'] }))
      .toBe(computeProjectionKey({ ...base, expanded: ['c', 'b', 'a'] }))
  })

  it('differs for each dimension change', () => {
    const keys = new Set([
      computeProjectionKey(base),
      computeProjectionKey({ ...base, viewId: 'overview' }),
      computeProjectionKey({ ...base, mode: 'complete-with-diff' }),
      computeProjectionKey({ ...base, focus: 'domain-a' }),
      computeProjectionKey({ ...base, expanded: ['domain-a'] }),
    ])
    expect(keys.size).toBe(5)
  })
})

describe('assertFingerprintFresh', () => {
  it('passes when fingerprints match', () => {
    const manifest = JSON.parse(makeManifest()) as { version: 4; modelFingerprint: string; model: {}; authoredViews: {}; changes: {} }
    expect(() => assertFingerprintFresh(
      { viewId: 'model', mode: 'complete', focus: null, expanded: [], expectedFingerprint: FINGERPRINT },
      manifest,
    )).not.toThrow()
  })

  it('throws XirangContractError(409) on mismatch with structured diagnostic', () => {
    const manifest = JSON.parse(makeManifest('new-fp')) as { version: 4; modelFingerprint: string; model: {}; authoredViews: {}; changes: {} }
    let caught: unknown
    try {
      assertFingerprintFresh(
        { viewId: 'model', mode: 'complete', focus: null, expanded: [], expectedFingerprint: 'old-fp' },
        manifest,
      )
    } catch (err) {
      caught = err
    }
    expect(caught).toBeInstanceOf(XirangContractError)
    const error = caught as XirangContractError
    expect(error.statusCode).toBe(409)
    const body = JSON.parse(error.message) as { error: string; currentFingerprint: string }
    expect(body.error).toBe('stale')
    expect(body.currentFingerprint).toBe('new-fp')
  })
})

describe('handleProjection', () => {
  const validRequest = {
    viewId: 'model',
    mode: 'complete' as const,
    focus: null,
    expanded: [],
    expectedFingerprint: FINGERPRINT,
  }

  function makeContext(overrides: { views?: { diagrams: () => Promise<LayoutedView[]> } } = {}) {
    return {
      readManifest: async () => makeManifest(),
      views: overrides.views ?? { diagrams: async (_projectId?: string) => [fakeView('model')] },
      cache: new ProjectionCache<ReturnType<typeof handleProjection> extends Promise<infer T> ? T : never>(50),
      projectId: 'xirang',
    }
  }

  it('returns a projection with a stable key and the layouted view', async () => {
    const result = await handleProjection(validRequest, makeContext())
    expect(result.projectionKey).toBeTruthy()
    expect(result.view.id).toBe('model')
    expect(result.diagnostics).toEqual([])
  })

  it('rejects a stale fingerprint without calling the views service', async () => {
    const diagrams = vi.fn<() => Promise<LayoutedView[]>>()
    const ctx = makeContext({ views: { diagrams } })
    ctx.readManifest = async () => makeManifest('current-fp')

    await expect(handleProjection(
      { ...validRequest, expectedFingerprint: 'old-fp' },
      ctx,
    )).rejects.toBeInstanceOf(XirangContractError)
    expect(diagrams).not.toHaveBeenCalled()
  })

  it('returns a cached response without re-calling the views service on repeat', async () => {
    const diagrams = vi.fn<() => Promise<LayoutedView[]>>().mockResolvedValue([fakeView('model')])
    const ctx = makeContext({ views: { diagrams } })

    await handleProjection(validRequest, ctx)
    await handleProjection(validRequest, ctx)

    expect(diagrams).toHaveBeenCalledTimes(1)
  })

  it('throws 404 when the requested view is not in the computed model', async () => {
    const ctx = makeContext({ views: { diagrams: async () => [fakeView('model')] } })
    await expect(handleProjection(
      { ...validRequest, viewId: 'nonexistent' },
      ctx,
    )).rejects.toMatchObject({ statusCode: 404 })
  })

  it('delegates to the views service for each unique request', async () => {
    const diagrams = vi.fn<() => Promise<LayoutedView[]>>()
      .mockResolvedValue([fakeView('model'), fakeView('overview')])
    const ctx = makeContext({ views: { diagrams } })

    const modelResult = await handleProjection({ ...validRequest, viewId: 'model' }, ctx)
    const overviewResult = await handleProjection({ ...validRequest, viewId: 'overview' }, ctx)

    expect(modelResult.view.id).toBe('model')
    expect(overviewResult.view.id).toBe('overview')
    // Both were computed (different keys), but only two calls
    expect(diagrams).toHaveBeenCalledTimes(2)
  })
})

describe('official LikeC4 pipeline integration', () => {
  it('diagrams() returns a layouted view with Graphviz geometry', { timeout: 120_000 }, async () => {
    const { fromSources } = await import('@likec4/language-services/node')
    const likec4 = await fromSources({
      'likec4.config.json': '{"name":"xirang","implicitViews":false,"defaultLandscapeView":false}',
      'specification.c4': 'specification {\n  element project\n  element capability\n}\n',
      'model.c4': [
        "model {",
        "  a = project 'Alpha' 'Alpha project' {",
        "    metadata { elementId 'alpha' }",
        "  }",
        "  b = capability 'Beta' 'Beta capability' {",
        "    metadata { elementId 'beta' }",
        "  }",
        "}",
        "",
      ].join('\n'),
      'relations.c4': 'model {}\n',
      'views.c4': 'views {\n  view model {\n    include *\n  }\n}\n',
    })

    const diagrams = await likec4.diagrams()

    const modelView = diagrams.find(v => v.id === 'model')
    expect(modelView).toBeDefined()
    // Every node must have layout geometry from Graphviz.
    for (const node of modelView!.nodes) {
      expect(node.x, `${node.id} must have x`).toBeTypeOf('number')
      expect(node.y, `${node.id} must have y`).toBeTypeOf('number')
      expect(node.width, `${node.id} must have width`).toBeGreaterThan(0)
      expect(node.height, `${node.id} must have height`).toBeGreaterThan(0)
    }
    // The handler calls diagrams() on the same base; geometry cannot come from a custom renderer.
    expect(modelView!.nodes.some(n => n.x !== 0 || n.y !== 0)).toBe(true)
    await likec4.dispose()
  })
})
