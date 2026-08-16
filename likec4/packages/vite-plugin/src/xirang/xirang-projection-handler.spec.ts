import { describe, expect, it, vi } from 'vitest'
import {
  assertFingerprintFresh,
  computeProjectionKey,
  handleProjection,
  parseProjectionRequest,
  type ProjectionRequest,
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
  const base = { viewId: 'model', change: null, mode: 'complete' as const, focus: null, expanded: [], expectedFingerprint: FINGERPRINT }

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
      computeProjectionKey({ ...base, expectedFingerprint: 'other-fingerprint' }),
    ])
    expect(keys.size).toBe(6)
  })
})

describe('assertFingerprintFresh', () => {
  it('passes when fingerprints match', () => {
    const manifest = JSON.parse(makeManifest()) as { version: 4; modelFingerprint: string; model: {}; authoredViews: {}; changes: {} }
    expect(() => assertFingerprintFresh(
      { viewId: 'model', change: null, mode: 'complete', focus: null, expanded: [], expectedFingerprint: FINGERPRINT },
      manifest,
    )).not.toThrow()
  })

  it('throws XirangContractError(409) on mismatch with structured diagnostic', () => {
    const manifest = JSON.parse(makeManifest('new-fp')) as { version: 4; modelFingerprint: string; model: {}; authoredViews: {}; changes: {} }
    let caught: unknown
    try {
      assertFingerprintFresh(
        { viewId: 'model', change: null, mode: 'complete', focus: null, expanded: [], expectedFingerprint: 'old-fp' },
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
    change: null,
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

  it('loads a Change target through its root-lowered LikeC4 sources', async () => {
    const diagrams = vi.fn(async () => [fakeView('model')])
    const loadSources = vi.fn(async () => ({ diagrams }))
    const request = { ...validRequest, change: 'next' }
    const result = await handleProjection(request, {
      readManifest: async () => JSON.stringify({
        version: 4,
        modelFingerprint: FINGERPRINT,
        model: { contracts: {} },
        authoredViews: {},
        changes: { next: { likec4Sources: { 'model.c4': 'model {}' } } },
      }),
      views: { diagrams: vi.fn(async () => []) },
      loadSources,
      cache: new ProjectionCache(50),
      projectId: 'xirang',
    })

    expect(result.view.id).toBe('model')
    expect(loadSources).toHaveBeenCalledWith({ 'model.c4': 'model {}' }, expect.any(String))
    expect(diagrams).toHaveBeenCalledWith('xirang')
  })

  it('loads the before-after union source for diff-capable Change modes', async () => {
    const diagrams = vi.fn(async () => [fakeView('model')])
    const loadSources = vi.fn(async () => ({ diagrams }))
    await handleProjection({ ...validRequest, change: 'next', mode: 'complete-with-diff' }, {
      readManifest: async () => JSON.stringify({
        version: 4,
        modelFingerprint: FINGERPRINT,
        model: { contracts: {} },
        authoredViews: {},
        changes: {
          next: {
            sourceFingerprint: 'change-fingerprint',
            diffSourceFingerprint: 'union-fingerprint',
            likec4Sources: { 'model.c4': 'after' },
            diffLikec4Sources: { 'model.c4': 'union' },
          },
        },
      }),
      views: { diagrams: vi.fn(async () => []) },
      loadSources,
      cache: new ProjectionCache(50),
      projectId: 'xirang',
    })

    expect(loadSources).toHaveBeenCalledWith({ 'model.c4': 'union' }, 'union-fingerprint')
  })

  it('selects mode-specific Change sources and diff-only identities', async () => {
    const adhocView = vi.fn(async (_predicates: any[], _projectId?: string) => fakeView('next'))
    const loadSources = vi.fn(async (_sources: Record<string, string>, _fingerprint: string) => ({
      diagrams: async () => [],
      viewsService: { adhocView },
    }))
    const manifest = {
      version: 4,
      modelFingerprint: FINGERPRINT,
      model: { contracts: {} },
      authoredViews: {},
      changes: {
        next: {
          sourceFingerprint: 'after-fingerprint',
          diffSourceFingerprint: 'union-fingerprint',
          architecture: { elements: [
            { declaration: { identity: 'root', parent: null } },
            { declaration: { identity: 'added', parent: 'root' } },
            { declaration: { identity: 'removed', parent: 'root' } },
          ] },
          diffArchitecture: { elements: [
            { declaration: { identity: 'root', parent: null } },
            { declaration: { identity: 'added', parent: 'root' } },
            { declaration: { identity: 'removed', parent: 'root' } },
          ] },
          diff: { entries: [{ kind: 'element-declaration', identity: 'removed' }] },
          likec4Sources: { 'model.c4': 'after' },
          likec4ElementPaths: { root: 'root', added: 'root.added', removed: 'root.removed' },
          diffLikec4Sources: { 'model.c4': 'union' },
          diffLikec4ElementPaths: { root: 'root', added: 'root.added', removed: 'root.removed' },
        },
      },
    }
    const make = (mode: ProjectionRequest['mode']) => handleProjection({ ...validRequest, change: 'next', mode }, {
      readManifest: async () => JSON.stringify(manifest),
      views: { diagrams: async () => [] },
      loadSources,
      cache: new ProjectionCache(50),
      projectId: 'xirang',
    })

    await make('complete')
    await make('complete-with-diff')
    await make('diff-only')

    expect(loadSources.mock.calls.map(call => call[0])).toEqual([
      { 'model.c4': 'after' },
      { 'model.c4': 'union' },
      { 'model.c4': 'union' },
    ])
    const diffOnlyPredicates = adhocView.mock.calls[2]?.[0] as Array<{ include?: Array<{ ref: { model: string } }> }>
    expect(diffOnlyPredicates[0]?.include?.map(item => item.ref.model)).toContain('root.removed')
    expect(diffOnlyPredicates[0]?.include?.map(item => item.ref.model)).not.toContain('root.added')
  })

  it('uses the same root projection for Model and equivalent Authored selections', async () => {
    const adhocView = vi.fn(async (_predicates: any[], _projectId?: string) => fakeView('adhoc'))
    const manifest = {
      version: 4,
      modelFingerprint: FINGERPRINT,
      model: {
        sourceFingerprint: FINGERPRINT,
        architecture: { elements: [
          { declaration: { identity: 'root', parent: null } },
          { declaration: { identity: 'a', parent: 'root' } },
          { declaration: { identity: 'b', parent: 'root' } },
        ] },
        likec4Sources: { 'model.c4': 'model {}' },
        likec4ElementPaths: { root: 'root', a: 'root.a', b: 'root.b' },
      },
      authoredViews: {
        equivalent: { title: 'Equivalent', selection: ['root', 'a', 'b'], roots: ['root'], virtualRoot: false },
      },
      changes: {},
    }
    const context = {
      readManifest: async () => JSON.stringify(manifest),
      views: { diagrams: async () => [] },
      loadSources: async () => ({ diagrams: async () => [], viewsService: { adhocView } }),
      cache: new ProjectionCache<Awaited<ReturnType<typeof handleProjection>>>(50),
      projectId: 'xirang',
    }

    await handleProjection(validRequest, context)
    await handleProjection({ ...validRequest, viewId: 'equivalent' }, context)

    expect(adhocView.mock.calls[0]?.[0]).toEqual(adhocView.mock.calls[1]?.[0])
  })

  it('expands in place inside an Authored view through expanded children selectors', async () => {
    const adhocView = vi.fn(async (_predicates: any[], _projectId?: string) => fakeView('adhoc'))
    const manifest = {
      version: 4,
      modelFingerprint: FINGERPRINT,
      model: {
        sourceFingerprint: FINGERPRINT,
        architecture: { elements: [
          { declaration: { identity: 'root', parent: null } },
          { declaration: { identity: 'a', parent: 'root' } },
          { declaration: { identity: 'a.child', parent: 'a' } },
          { declaration: { identity: 'b', parent: 'root' } },
        ] },
        likec4Sources: { 'model.c4': 'model {}' },
        likec4ElementPaths: { root: 'root', a: 'root.a', 'a.child': 'root.a.child', b: 'root.b' },
      },
      authoredViews: {
        scoped: { title: 'Scoped', selection: ['root', 'a', 'a.child', 'b'], roots: ['root'], virtualRoot: false },
      },
      changes: {},
    }
    const context = {
      readManifest: async () => JSON.stringify(manifest),
      views: { diagrams: async () => [] },
      loadSources: async () => ({ diagrams: async () => [], viewsService: { adhocView } }),
      cache: new ProjectionCache<Awaited<ReturnType<typeof handleProjection>>>(50),
      projectId: 'xirang',
    }

    await handleProjection({ ...validRequest, viewId: 'scoped', expanded: ['a'] }, context)

    const predicates = adhocView.mock.calls[0]?.[0] as Array<{ include?: Array<{ ref: { model: string }; selector?: string }> }>
    const include = predicates[0]?.include ?? []
    expect(include.map(item => `${item.ref.model}${item.selector ? `:${item.selector}` : ''}`))
      .toEqual(['root.a', 'root.b', 'root.a:children'])
  })

  it('carries every relation from an aggregated official edge as stable Xirang triples', async () => {
    const view = {
      ...fakeView('model'),
      edges: [{ id: 'edge', source: 'root_a', target: 'root_b', relations: ['rel-1', 'rel-2'] }],
    } as unknown as LayoutedView
    const context = makeContext()
    context.readManifest = async () => JSON.stringify({
      version: 4,
      modelFingerprint: FINGERPRINT,
      model: {
        sourceFingerprint: FINGERPRINT,
        contracts: {},
        likec4Sources: { 'model.c4': 'model {}' },
        likec4ElementPaths: { 'root.a': 'root_a', 'root.b': 'root_b' },
      },
      authoredViews: {},
      changes: {},
    })
    const result = await handleProjection(validRequest, {
      ...context,
      loadSources: async () => ({
        diagrams: async () => [view],
        parsedModel: async () => ({
          relationships: () => [
            { id: 'rel-1', source: 'root_a', target: 'root_b', title: 'invokes', kind: 'calls' },
            { id: 'rel-2', source: 'root_a', target: 'root_b', title: 'observes', kind: 'reads' },
          ],
        }),
      }),
    })

    expect((result.view.edges[0] as unknown as { metadata: { xirangRelations: string[] } }).metadata.xirangRelations)
      .toEqual(['root.a|invokes|root.b', 'root.a|observes|root.b'])
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

describe('handleProjection Candidate sources', () => {
  const baseRequest = {
    viewId: 'candidate' as const,
    change: null,
    mode: 'complete' as const,
    focus: null,
    expanded: [],
    expectedFingerprint: FINGERPRINT,
  }

  const architecture = {
    elements: [
      { declaration: { identity: 'root', parent: null } },
      { declaration: { identity: 'a', parent: 'root' } },
      { declaration: { identity: 'a.child', parent: 'a' } },
      { declaration: { identity: 'b', parent: 'root' } },
      { declaration: { identity: 'c', parent: 'root' } },
    ],
  }
  const paths = { root: 'root', a: 'root.a', 'a.child': 'root.a.child', b: 'root.b', c: 'root.c' }

  function makeCandidateContext(diff?: { entries: unknown[] }) {
    const adhocView = vi.fn(async (_predicates: unknown[], _projectId?: string) => fakeView('model'))
    const manifest = {
      version: 4,
      modelFingerprint: FINGERPRINT,
      model: { contracts: {} },
      authoredViews: {},
      changes: {},
      candidate: {
        sourceFingerprint: 'candidate-fp',
        architecture,
        likec4Sources: { 'model.c4': 'model {}' },
        likec4ElementPaths: paths,
      },
      ...(diff
        ? {
            candidateDiff: {
              sourceFingerprint: 'candidate-diff-fp',
              architecture,
              likec4Sources: { 'model.c4': 'model {}' },
              likec4ElementPaths: paths,
              diff,
            },
          }
        : {}),
    }
    return {
      readManifest: async () => JSON.stringify(manifest),
      views: { diagrams: async () => [] },
      loadSources: async () => ({ diagrams: async () => [], viewsService: { adhocView } }),
      cache: new ProjectionCache<Awaited<ReturnType<typeof handleProjection>>>(50),
      projectId: 'xirang',
      adhocView,
    }
  }

  const includeRefs = (adhocView: ReturnType<typeof vi.fn>) => {
    const predicates = adhocView.mock.calls[0]?.[0] as Array<{ include?: Array<{ ref: { model: string }; selector?: string }> }>
    return (predicates[0]?.include ?? []).map(item => `${item.ref.model}${item.selector ? `:${item.selector}` : ''}`)
  }

  it('projects the Candidate root children as the collapsed baseline', async () => {
    const context = makeCandidateContext()
    await handleProjection(baseRequest, context)
    expect(includeRefs(context.adhocView)).toEqual(['root.a', 'root.b', 'root.c'])
  })

  it('expands the Candidate baseline through expanded children selectors', async () => {
    const context = makeCandidateContext()
    await handleProjection({ ...baseRequest, expanded: ['a'] }, context)
    expect(includeRefs(context.adhocView)).toEqual(['root.a', 'root.b', 'root.c', 'root.a:children'])
  })

  it('focuses a Candidate element to its children context', async () => {
    const context = makeCandidateContext()
    await handleProjection({ ...baseRequest, focus: 'a' }, context)
    expect(includeRefs(context.adhocView)).toEqual(['root.a', 'root.a:children'])
  })

  it('projects root children in Candidate Diff with hierarchical baseline', async () => {
    const context = makeCandidateContext({
      entries: [
        { kind: 'element-declaration', identity: 'a.child' },
        { kind: 'relationship', identity: 'a|invokes|b' },
      ],
    })
    await handleProjection({ ...baseRequest, viewId: 'candidate-diff', mode: 'diff-only' }, context)
    // Candidate Diff uses the same hierarchical baseline as Candidate View: root children by default.
    expect(new Set(includeRefs(context.adhocView))).toEqual(new Set(['root.a', 'root.b', 'root.c']))
  })

  it('keeps contract-only Candidate Diff hosts hidden until their parent is expanded', async () => {
    const context = makeCandidateContext({
      entries: [
        { kind: 'requirement', identity: 'a.child#Some Requirement' },
      ],
    })
    await handleProjection({ ...baseRequest, viewId: 'candidate-diff', mode: 'diff-only' }, context)
    // Hierarchical baseline: root children only, contract-only changed deep elements require expansion.
    expect(new Set(includeRefs(context.adhocView))).toEqual(new Set(['root.a', 'root.b', 'root.c']))
  })

  it('scopes the Candidate Diff to the focused subtree with hierarchical baseline', async () => {
    const context = makeCandidateContext({
      entries: [
        { kind: 'element-declaration', identity: 'a.child' },
        { kind: 'element-declaration', identity: 'c' },
      ],
    })
    await handleProjection({ ...baseRequest, viewId: 'candidate-diff', mode: 'diff-only', focus: 'a' }, context)
    // Focus + children: focus element itself plus direct children (not all descendants).
    expect(new Set(includeRefs(context.adhocView))).toEqual(new Set(['root.a', 'root.a:children']))
  })

  it('falls back to the root-children baseline when the Candidate Diff is empty', async () => {
    const context = makeCandidateContext({ entries: [] })
    await handleProjection({ ...baseRequest, viewId: 'candidate-diff', mode: 'diff-only' }, context)
    expect(includeRefs(context.adhocView)).toEqual(['root.a', 'root.b', 'root.c'])
  })

  it('loads the before-after union sources for Candidate Diff removed ghosts', async () => {
    const adhocView = vi.fn(async (_predicates: unknown[], _projectId?: string) => fakeView('model'))
    const loadSources = vi.fn(async () => ({ diagrams: async () => [], viewsService: { adhocView } }))
    const context = {
      readManifest: async () => JSON.stringify({
        version: 4,
        modelFingerprint: FINGERPRINT,
        model: { contracts: {} },
        authoredViews: {},
        changes: {},
        candidateDiff: {
          sourceFingerprint: 'candidate-diff-fp',
          diffSourceFingerprint: 'union-fp',
          architecture,
          diffArchitecture: { elements: [
            { declaration: { identity: 'root', parent: null } },
            { declaration: { identity: 'removed', parent: 'root' } },
            ...architecture.elements,
          ] },
          likec4Sources: { 'model.c4': 'target' },
          likec4ElementPaths: paths,
          diffLikec4Sources: { 'model.c4': 'union' },
          diffLikec4ElementPaths: { ...paths, removed: 'root.removed' },
          diff: { entries: [{ kind: 'element-declaration', identity: 'removed' }] },
        },
      }),
      views: { diagrams: async () => [] },
      loadSources,
      cache: new ProjectionCache<Awaited<ReturnType<typeof handleProjection>>>(50),
      projectId: 'xirang',
    }
    await handleProjection({ ...baseRequest, viewId: 'candidate-diff', mode: 'diff-only' }, context)

    expect(loadSources).toHaveBeenCalledWith({ 'model.c4': 'union' }, 'union-fp')
    const predicates = adhocView.mock.calls[0]?.[0] as Array<{ include?: Array<{ ref: { model: string } }> }>
    const include = (predicates[0]?.include ?? []).map(item => item.ref.model)
    // Hierarchical baseline from diffArchitecture (union): root children include the REMOVED ghost
    // because 'removed' is a direct child of 'root' in the union architecture.
    expect(include).toContain('root.removed')
    expect(new Set(include)).toEqual(new Set(['root.a', 'root.b', 'root.c', 'root.removed']))
  })

  it('falls back to candidate-only target sources when the union layout fails', async () => {
    const unionAdhocView = vi.fn(async (_predicates: unknown[], _projectId?: string) => {
      throw new Error('Error during layout: adhoc')
    })
    const targetAdhocView = vi.fn(async (_predicates: unknown[], _projectId?: string) => fakeView('model'))
    const loadSources = vi.fn()
      .mockResolvedValueOnce({ diagrams: async () => [], viewsService: { adhocView: unionAdhocView } })
      .mockResolvedValueOnce({ diagrams: async () => [], viewsService: { adhocView: targetAdhocView } })
    const context = {
      readManifest: async () => JSON.stringify({
        version: 4,
        modelFingerprint: FINGERPRINT,
        model: { contracts: {} },
        authoredViews: {},
        changes: {},
        candidateDiff: {
          sourceFingerprint: 'candidate-diff-fp',
          diffSourceFingerprint: 'union-fp',
          architecture,
          diffArchitecture: { elements: [
            { declaration: { identity: 'root', parent: null } },
            ...architecture.elements,
          ] },
          likec4Sources: { 'model.c4': 'target' },
          likec4ElementPaths: paths,
          diffLikec4Sources: { 'model.c4': 'union' },
          diffLikec4ElementPaths: { ...paths },
          diff: { entries: [{ kind: 'element-declaration', identity: 'a.child' }] },
        },
      }),
      views: { diagrams: async () => [] },
      loadSources,
      cache: new ProjectionCache<Awaited<ReturnType<typeof handleProjection>>>(50),
      projectId: 'xirang',
    }
    const result = await handleProjection({ ...baseRequest, viewId: 'candidate-diff', mode: 'diff-only' }, context)

    expect(result.view.id).toBe('model')
    expect(loadSources).toHaveBeenCalledTimes(2)
    expect(unionAdhocView).toHaveBeenCalledTimes(1)
    expect(targetAdhocView).toHaveBeenCalledTimes(1)
    const predicates = targetAdhocView.mock.calls[0]?.[0] as Array<{ include?: Array<{ ref: { model: string } }> }>
    const include = (predicates[0]?.include ?? []).map(item => item.ref.model)
    expect(new Set(include)).toEqual(new Set(['root', 'root.a', 'root.a.child']))
  })
})

describe('official LikeC4 pipeline integration', () => {
  it('lays out Model and equivalent Authored roots identically', { timeout: 120_000 }, async () => {
    const sources = {
      'likec4.config.json': '{"name":"xirang","implicitViews":false,"defaultLandscapeView":false}',
      'specification.c4': 'specification {\n  element project\n  element capability\n}\n',
      'model.c4': [
        'model {',
        "  root = project 'Root' 'Root' {",
        "    a = capability 'A' 'A'",
        "    group = capability 'Group' 'Group' {",
        "      child = capability 'Child' 'Child'",
        '    }',
        '  }',
        '}',
        '',
      ].join('\n'),
      'relations.c4': 'model {}\n',
      'views.c4': 'views {\n  view model { include * }\n  view equivalent { include * }\n}\n',
    }
    const manifest = {
      version: 4,
      modelFingerprint: FINGERPRINT,
      model: {
        sourceFingerprint: FINGERPRINT,
        architecture: { elements: [
          { declaration: { identity: 'root', parent: null } },
          { declaration: { identity: 'a', parent: 'root' } },
          { declaration: { identity: 'group', parent: 'root' } },
          { declaration: { identity: 'child', parent: 'group' } },
        ] },
        likec4Sources: sources,
        likec4ElementPaths: { root: 'root', a: 'root.a', group: 'root.group', child: 'root.group.child' },
      },
      authoredViews: {
        equivalent: { title: 'Equivalent', selection: ['root', 'a', 'group', 'child'], roots: ['root'], virtualRoot: false },
      },
      changes: {},
    }
    const makeContext = () => ({
      readManifest: async () => JSON.stringify(manifest),
      views: { diagrams: async () => [] },
      loadSources: async (input: Record<string, string>) => (await import('@likec4/language-services/node')).fromSources(input),
      cache: new ProjectionCache<Awaited<ReturnType<typeof handleProjection>>>(50),
      projectId: 'xirang',
    })
    const request = { viewId: 'model' as const, change: null, mode: 'complete' as const, focus: null, expanded: [], expectedFingerprint: FINGERPRINT }
    const [model, authored] = await Promise.all([
      handleProjection(request, makeContext()),
      handleProjection({ ...request, viewId: 'equivalent' }, makeContext()),
    ])

    expect(authored.view.nodes).toEqual(model.view.nodes)
  })

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

  it('lays out a virtualRoot Authored selection through official Graphviz without a synthetic Element', { timeout: 120_000 }, async () => {
    const sources = {
      'likec4.config.json': '{"name":"xirang","implicitViews":false,"defaultLandscapeView":false}',
      'specification.c4': 'specification {\n  element project\n  element capability\n}\n',
      'model.c4': [
        'model {',
        "  a = project 'Alpha' 'Alpha project' {",
        "    metadata { elementId 'alpha' }",
        '  }',
        "  b = capability 'Beta' 'Beta capability' {",
        "    metadata { elementId 'beta' }",
        '  }',
        '}',
        '',
      ].join('\n'),
      'relations.c4': 'model {}\n',
      'views.c4': 'views {\n  view model { include * }\n}\n',
    }
    const manifest = {
      version: 4,
      modelFingerprint: FINGERPRINT,
      model: {
        sourceFingerprint: FINGERPRINT,
        architecture: { elements: [
          { declaration: { identity: 'alpha', parent: null } },
          { declaration: { identity: 'beta', parent: null } },
        ] },
        likec4Sources: sources,
        likec4ElementPaths: { alpha: 'a', beta: 'b' },
      },
      authoredViews: {
        multi: { title: 'Multi', selection: ['alpha', 'beta'], roots: ['alpha', 'beta'], virtualRoot: true },
      },
      changes: {},
    }
    const context = {
      readManifest: async () => JSON.stringify(manifest),
      views: { diagrams: async () => [] },
      loadSources: async (input: Record<string, string>) => (await import('@likec4/language-services/node')).fromSources(input),
      cache: new ProjectionCache<Awaited<ReturnType<typeof handleProjection>>>(50),
      projectId: 'xirang',
    }
    const result = await handleProjection(
      { viewId: 'multi', change: null, mode: 'complete', focus: null, expanded: [], expectedFingerprint: FINGERPRINT },
      context,
    )

    expect(result.view.id).toBe('multi')
    const modelRefs = result.view.nodes.map(node => node.modelRef)
    // Both independent roots are laid out by Graphviz and no synthetic virtual-root Element appears.
    expect(new Set(modelRefs)).toEqual(new Set(['a', 'b']))
    for (const node of result.view.nodes) {
      expect(node.x, `${node.id} must have x`).toBeTypeOf('number')
      expect(node.y, `${node.id} must have y`).toBeTypeOf('number')
      expect(node.width, `${node.id} must have width`).toBeGreaterThan(0)
      expect(node.height, `${node.id} must have height`).toBeGreaterThan(0)
    }
  })

  it('attaches stable triples from the parsed model without a super-linear computedModel', { timeout: 120_000 }, async () => {
    const sources = {
      'likec4.config.json': '{"name":"xirang","implicitViews":false,"defaultLandscapeView":false}',
      'specification.c4': 'specification {\n  element project\n  element capability\n  relationship invokes\n}\n',
      'model.c4': [
        'model {',
        "  a = project 'Alpha' 'Alpha project' {",
        "    metadata { elementId 'alpha' }",
        '  }',
        "  b = capability 'Beta' 'Beta capability' {",
        "    metadata { elementId 'beta' }",
        '  }',
        '}',
        '',
      ].join('\n'),
      'relations.c4': "model {\n  a -[invokes]-> b 'invokes'\n}\n",
      'views.c4': 'views {\n  view model { include * }\n}\n',
    }
    const manifest = {
      version: 4,
      modelFingerprint: FINGERPRINT,
      model: {
        sourceFingerprint: FINGERPRINT,
        architecture: { elements: [
          { declaration: { identity: 'alpha', parent: null } },
          { declaration: { identity: 'beta', parent: null } },
        ] },
        likec4Sources: sources,
        likec4ElementPaths: { alpha: 'a', beta: 'b' },
      },
      authoredViews: {},
      changes: {},
    }
    const context = {
      readManifest: async () => JSON.stringify(manifest),
      views: { diagrams: async () => [] },
      loadSources: async (input: Record<string, string>) => (await import('@likec4/language-services/node')).fromSources(input),
      cache: new ProjectionCache<Awaited<ReturnType<typeof handleProjection>>>(50),
      projectId: 'xirang',
    }
    const result = await handleProjection(
      { viewId: 'model', change: null, mode: 'complete', focus: null, expanded: [], expectedFingerprint: FINGERPRINT },
      context,
    )

    const edge = result.view.edges.find(candidate => candidate.source === 'a' && candidate.target === 'b')
    expect(edge).toBeDefined()
    expect((edge as unknown as { metadata?: { xirangRelations?: string[] } }).metadata?.xirangRelations)
      .toEqual(['alpha|invokes|beta'])
  })
})
