import { createHash } from 'node:crypto'
import type { LayoutedView } from '@likec4/core/types'
import { XirangContractError, assertXirangManifest, type XirangRuntimeManifestSnapshot } from './xirang-contract-handler'
import { ProjectionCache } from './projection-cache'

export interface ProjectionRequest {
  viewId: 'model' | string
  change: string | null
  mode: 'complete' | 'complete-with-diff' | 'diff-only'
  focus: string | null
  expanded: string[]
  expectedFingerprint: string
}

export interface ProjectionResponse {
  projectionKey: string
  view: LayoutedView
  diagnostics: string[]
}

/** Stable fingerprint-scoped key for the runtime projection cache. */
export function computeProjectionKey(request: ProjectionRequest): string {
  const payload = JSON.stringify({
    viewId: request.viewId,
    change: request.change,
    mode: request.mode,
    focus: request.focus ?? null,
    expanded: [...request.expanded].sort(),
    expectedFingerprint: request.expectedFingerprint,
  })
  return createHash('sha256').update(payload).digest('hex').slice(0, 32)
}

export type ParseProjectionResult =
  | { ok: true; request: ProjectionRequest }
  | { ok: false; statusCode: number; message: string }

export function parseProjectionRequest(raw: unknown): ParseProjectionResult {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, statusCode: 400, message: 'Request body must be a JSON object' }
  }
  const body = raw as Record<string, unknown>
  const viewId = body['viewId']
  const change = body['change']
  const mode = body['mode']
  const expectedFingerprint = body['expectedFingerprint']

  if (typeof viewId !== 'string' || viewId === '') {
    return { ok: false, statusCode: 400, message: 'Missing or invalid viewId' }
  }
  if (change !== undefined && change !== null && (typeof change !== 'string' || change === '')) {
    return { ok: false, statusCode: 400, message: 'change must be a non-empty string or null' }
  }
  if (mode !== 'complete' && mode !== 'complete-with-diff' && mode !== 'diff-only') {
    return { ok: false, statusCode: 400, message: 'mode must be complete, complete-with-diff, or diff-only' }
  }
  if (typeof expectedFingerprint !== 'string' || expectedFingerprint === '') {
    return { ok: false, statusCode: 400, message: 'Missing or invalid expectedFingerprint' }
  }

  const focus = typeof body['focus'] === 'string' ? body['focus'] : null
  const expanded = Array.isArray(body['expanded']) && (body['expanded'] as unknown[]).every((x: unknown) => typeof x === 'string')
    ? (body['expanded'] as string[])
    : []

  return { ok: true, request: { viewId, change: typeof change === 'string' ? change : null, mode, focus, expanded, expectedFingerprint } }
}

/** Validates fingerprint against the manifest; throws `XirangContractError(409)` on mismatch. */
export function assertFingerprintFresh(request: ProjectionRequest, manifest: XirangRuntimeManifestSnapshot): void {
  if (request.expectedFingerprint !== manifest.modelFingerprint) {
    throw new XirangContractError(409, JSON.stringify({
      error: 'stale',
      message: 'Model fingerprint changed; retry with the current fingerprint',
      currentFingerprint: manifest.modelFingerprint,
    }))
  }
}

/**
 * Handles `POST /__xirang/projection`. The `views` argument and `readManifest` are injected so
 * the pure functions are unit-testable without an HTTP server.
 */
/**
 * Carries semantic relationship triples beside LikeC4's official edge geometry. The browser may
 * split and decorate these edges, but never needs to infer identity from an opaque generated id.
 */
function attachRelationshipMetadata(
  view: LayoutedView,
  model: { findRelationship(id: string, type: 'model'): { source: { id: string }; target: { id: string }; kind?: string | null; title?: string | null } | null } | undefined,
  paths: Record<string, string>,
  diffEntries: ReadonlyArray<{ kind: string; identity: string; operation: 'ADDED' | 'MODIFIED' | 'REMOVED' }> = [],
): LayoutedView {
  if (!model) return view
  const reverse = new Map(Object.entries(paths).map(([identity, path]) => [path, identity]))
  const relationshipOperations = new Map<string, 'ADDED' | 'MODIFIED' | 'REMOVED'>()
  for (const entry of diffEntries) {
    if (entry.kind === 'relationship' && !relationshipOperations.has(entry.identity)) {
      relationshipOperations.set(entry.identity, entry.operation)
    }
  }
  return {
    ...view,
    edges: view.edges.map(edge => {
      const relations = (edge as unknown as { relations?: string[] }).relations ?? []
      const triples = relations.flatMap(id => {
        const relationship = model.findRelationship(id, 'model')
        if (!relationship) return []
        const source = reverse.get(relationship.source.id)
        const target = reverse.get(relationship.target.id)
        const kind = relationship.title ?? relationship.kind ?? undefined
        return source && target && kind ? [`${source}|${kind}|${target}`] : []
      })
      const operation = triples
        .map(identity => relationshipOperations.get(identity))
        .find((value): value is 'ADDED' | 'MODIFIED' | 'REMOVED' => value !== undefined)
      if (triples.length === 0 && !operation) return edge
      return {
        ...edge,
        metadata: {
          ...((edge as unknown as { metadata?: Record<string, unknown> }).metadata ?? {}),
          xirangRelations: triples,
          ...(triples.length === 1 ? { xirangRelation: triples[0] } : {}),
          ...(operation ? { xirangOperation: operation } : {}),
        },
      }
    }),
  }
}

export async function handleProjection(
  request: ProjectionRequest,
  context: {
    readManifest: () => Promise<string>
    views: { diagrams(projectId?: string): Promise<LayoutedView[]> }
    loadSources?: (sources: Record<string, string>, fingerprint: string) => Promise<{
      diagrams(projectId?: string): Promise<LayoutedView[]>
      computedModel?: (projectId?: string) => Promise<{
        findRelationship(id: string, type: 'model'): {
          source: { id: string }
          target: { id: string }
          kind?: string | null
          title?: string | null
        } | null
      }>
      viewsService?: { adhocView(predicates: any[], projectId?: string): Promise<LayoutedView> }
    }>
    cache: ProjectionCache<ProjectionResponse>
    projectId: string
  },
): Promise<ProjectionResponse> {
  const manifestRaw = JSON.parse(await context.readManifest()) as unknown
  assertXirangManifest(manifestRaw)
  assertFingerprintFresh(request, manifestRaw)
  const activeFingerprints = new Set([
    manifestRaw.modelFingerprint,
    ...Object.values(manifestRaw.changes).flatMap(item => [
      ...(item.sourceFingerprint ? [item.sourceFingerprint] : []),
      ...(item.diffSourceFingerprint ? [item.diffSourceFingerprint] : []),
    ]),
    ...(manifestRaw.candidate?.sourceFingerprint ? [manifestRaw.candidate.sourceFingerprint] : []),
    ...(manifestRaw.candidateDiff?.sourceFingerprint ? [manifestRaw.candidateDiff.sourceFingerprint] : []),
  ])
  context.cache.retainFingerprints(activeFingerprints)

  const source = request.change
    ? manifestRaw.changes[request.change]
    : request.viewId === 'candidate'
    ? manifestRaw.candidate
    : request.viewId === 'candidate-diff'
    ? manifestRaw.candidateDiff
    : manifestRaw.model
  if (!source) {
    throw new XirangContractError(404, request.change ? `Change ${request.change} not found` : `View ${request.viewId} not found`)
  }

  const projectionSource = request.change && request.mode !== 'complete' && source.diffLikec4Sources
    ? {
        ...source,
        sourceFingerprint: source.diffSourceFingerprint ?? source.sourceFingerprint,
        architecture: source.diffArchitecture ?? source.architecture,
        likec4Sources: source.diffLikec4Sources,
        likec4ElementPaths: source.diffLikec4ElementPaths,
      }
    : source

  const projectionKey = computeProjectionKey({
    ...request,
    expectedFingerprint: source.sourceFingerprint ?? request.expectedFingerprint,
  })
  const cached = context.cache.get(projectionKey)
  if (cached) return cached

  const likec4 = projectionSource.likec4Sources && context.loadSources
    ? await context.loadSources(projectionSource.likec4Sources, projectionSource.sourceFingerprint ?? manifestRaw.modelFingerprint)
    : null
  const authoredView = request.viewId === 'model' ? undefined : manifestRaw.authoredViews[request.viewId]
  const authoredSelection = authoredView?.selection
  const architecture = projectionSource.architecture
  const paths = projectionSource.likec4ElementPaths ?? {}
  const authoredBoundary = authoredSelection ? new Set(authoredSelection) : undefined
  const childrenByParent = new Map<string, string[]>()
  for (const element of architecture?.elements ?? []) {
    if (authoredBoundary && !authoredBoundary.has(element.declaration.identity)) continue
    const parent = element.declaration.parent
    if (parent === null) continue
    const siblings = childrenByParent.get(parent)
    if (siblings) siblings.push(element.declaration.identity)
    else childrenByParent.set(parent, [element.declaration.identity])
  }
  const children = (identity: string) => childrenByParent.get(identity) ?? []
  const includeExpressions: Array<{ ref: { model: string }; selector?: 'children' | 'expanded' | 'descendants' }> = []
  if (request.viewId === 'candidate' || request.viewId === 'candidate-diff') {
    for (const element of architecture?.elements ?? []) {
      includeExpressions.push({ ref: { model: paths[element.declaration.identity] ?? element.declaration.identity } })
    }
  } else if (request.focus) {
    includeExpressions.push({ ref: { model: paths[request.focus] ?? request.focus } })
    includeExpressions.push({ ref: { model: paths[request.focus] ?? request.focus }, selector: 'children' })
    for (const expanded of request.expanded) {
      includeExpressions.push({ ref: { model: paths[expanded] ?? expanded }, selector: 'children' })
    }
  } else if (authoredView) {
    const visibleRoots = authoredView.virtualRoot
      ? authoredView.roots
      : authoredView.roots.length === 1
        ? children(authoredView.roots[0]!)
        : authoredView.roots
    for (const identity of visibleRoots) {
      includeExpressions.push({ ref: { model: paths[identity] ?? identity } })
    }
  } else {
    const roots = architecture?.elements
      .filter(element => element.declaration.parent === null)
      .map(element => element.declaration.identity) ?? []
    for (const root of roots) {
      const rootChildren = children(root)
      includeExpressions.push(...rootChildren.map(identity => ({ ref: { model: paths[identity] ?? identity } })))
    }
    for (const expanded of request.expanded) {
      includeExpressions.push({ ref: { model: paths[expanded] ?? expanded }, selector: 'children' })
    }
  }
  if (request.mode === 'diff-only' && request.change && source.diff) {
    const elementsByIdentity = new Map((architecture?.elements ?? []).map(element => [element.declaration.identity, element]))
    const boundary = new Set<string>()
    const collectBoundary = (identity: string) => {
      if (boundary.has(identity) || !elementsByIdentity.has(identity)) return
      boundary.add(identity)
      for (const child of children(identity)) collectBoundary(child)
    }
    if (request.focus) collectBoundary(request.focus)
    else if (authoredSelection) for (const identity of authoredSelection) boundary.add(identity)
    else for (const identity of elementsByIdentity.keys()) boundary.add(identity)

    const visible = new Set<string>()
    for (const entry of source.diff.entries) {
      if (entry.kind === 'element-declaration' && boundary.has(entry.identity)) visible.add(entry.identity)
      if (entry.kind === 'relationship') {
        const [sourceIdentity, , targetIdentity] = entry.identity.split('|')
        if (sourceIdentity && boundary.has(sourceIdentity)) visible.add(sourceIdentity)
        if (targetIdentity && boundary.has(targetIdentity)) visible.add(targetIdentity)
      }
      const host = entry.identity.split('#')[0]
      if (host && boundary.has(host) && (entry.kind === 'requirement' || entry.kind === 'scenario' || entry.kind === 'property')) visible.add(host)
    }
    for (const identity of [...visible]) {
      let parent = elementsByIdentity.get(identity)?.declaration.parent ?? null
      while (parent !== null && boundary.has(parent)) {
        visible.add(parent)
        parent = elementsByIdentity.get(parent)?.declaration.parent ?? null
      }
    }
    includeExpressions.length = 0
    for (const identity of visible) {
      if (elementsByIdentity.has(identity)) {
        const path = paths[identity]
        includeExpressions.push({ ref: { model: path === undefined ? identity : path } })
      }
    }
  }
  const adhocPredicates = includeExpressions.length > 0
    ? [{ include: includeExpressions }]
    : null
  const diagramId = request.viewId === 'candidate' || request.viewId === 'candidate-diff' ? 'model' : request.viewId
  const projectionView = adhocPredicates && likec4
    ? await likec4.viewsService!.adhocView(adhocPredicates, context.projectId)
    : await (likec4 ? likec4.diagrams(context.projectId) : context.views.diagrams(context.projectId))
      .then(diagrams => diagrams.find(v => v.id === diagramId))
  const enrichedProjectionView = projectionView && likec4
    ? attachRelationshipMetadata(projectionView, likec4.computedModel ? await likec4.computedModel(context.projectId) : undefined, paths, source.diff?.entries)
    : projectionView
  const view = enrichedProjectionView
    ? ({ ...enrichedProjectionView, id: diagramId as typeof enrichedProjectionView.id } as typeof enrichedProjectionView)
    : undefined
  if (!view) {
    throw new XirangContractError(404, `View ${request.viewId} not found in computed model`)
  }

  const response: ProjectionResponse = { projectionKey, view, diagnostics: [] }
  context.cache.set(projectionKey, source.sourceFingerprint ?? manifestRaw.modelFingerprint, response)
  return response
}
