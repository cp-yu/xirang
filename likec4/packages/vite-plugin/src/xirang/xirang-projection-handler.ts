import { createHash } from 'node:crypto'
import type { LayoutedView } from '@likec4/core/types'
import { XirangContractError, assertXirangManifest, type XirangRuntimeManifestSnapshot } from './xirang-contract-handler'
import { ProjectionCache } from './projection-cache'

export interface ProjectionRequest {
  viewId: 'model' | string
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
    mode: request.mode,
    focus: request.focus ?? null,
    expanded: [...request.expanded].sort(),
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
  const mode = body['mode']
  const expectedFingerprint = body['expectedFingerprint']

  if (typeof viewId !== 'string' || viewId === '') {
    return { ok: false, statusCode: 400, message: 'Missing or invalid viewId' }
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

  return { ok: true, request: { viewId, mode, focus, expanded, expectedFingerprint } }
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
export async function handleProjection(
  request: ProjectionRequest,
  context: {
    readManifest: () => Promise<string>
    views: { diagrams(projectId?: string): Promise<LayoutedView[]> }
    cache: ProjectionCache<ProjectionResponse>
    projectId: string
  },
): Promise<ProjectionResponse> {
  const manifestRaw = JSON.parse(await context.readManifest()) as unknown
  assertXirangManifest(manifestRaw)
  assertFingerprintFresh(request, manifestRaw)

  const projectionKey = computeProjectionKey(request)
  const cached = context.cache.get(projectionKey)
  if (cached) return cached

  const diagrams = await context.views.diagrams(context.projectId)
  const view = diagrams.find(v => v.id === request.viewId)
  if (!view) {
    throw new XirangContractError(404, `View ${request.viewId} not found in computed model`)
  }

  const response: ProjectionResponse = { projectionKey, view, diagnostics: [] }
  context.cache.set(projectionKey, manifestRaw.modelFingerprint, response)
  return response
}
