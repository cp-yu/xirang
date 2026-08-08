export interface XirangContractContent {
  element: string
  md: string
}

export interface XirangContractSourceSnapshot {
  sourceFingerprint?: string
  diffSourceFingerprint?: string
  diff?: { entries: Array<{ kind: string; identity: string; operation: 'ADDED' | 'MODIFIED' | 'REMOVED' }> }
  architecture?: { elements: Array<{ declaration: { identity: string; parent: string | null } }> }
  diffArchitecture?: { elements: Array<{ declaration: { identity: string; parent: string | null } }> }
  contracts?: Record<string, string>
  likec4Sources?: Record<string, string>
  likec4ElementPaths?: Record<string, string>
  diffLikec4Sources?: Record<string, string>
  diffLikec4ElementPaths?: Record<string, string>
}

/**
 * One View Selection boundary, already resolved by Xirang.
 *
 * `selection` is the resolved descendants closure with `exclude` applied, so the view server turns
 * it straight into LikeC4 include predicates and never re-derives closure or exclude precedence.
 */
export interface XirangAuthoredViewSnapshot {
  title: string
  selection: string[]
  roots: string[]
  virtualRoot: boolean
}

export interface XirangRuntimeManifestSnapshot {
  version: 4
  modelFingerprint: string
  model: XirangContractSourceSnapshot
  authoredViews: Record<string, XirangAuthoredViewSnapshot>
  candidate?: XirangContractSourceSnapshot
  candidateDiff?: XirangContractSourceSnapshot
  changes: Record<string, XirangContractSourceSnapshot>
}

/** The runtime manifest is versioned; older snapshots are rejected, never downgraded. */
export function assertXirangManifest(payload: unknown): asserts payload is XirangRuntimeManifestSnapshot {
  if (!payload || typeof payload !== 'object'
    || (payload as { version?: unknown }).version !== 4
    || !(payload as { model?: unknown }).model
    || typeof (payload as { authoredViews?: unknown }).authoredViews !== 'object'
    || typeof (payload as { changes?: unknown }).changes !== 'object'
    || typeof (payload as { modelFingerprint?: unknown }).modelFingerprint !== 'string') {
    throw new XirangContractError(500, 'Invalid runtime manifest: expected version 4 with model, authoredViews, changes, and modelFingerprint')
  }
}

export class XirangContractError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
  ) {
    super(message)
  }
}

export type XirangContractSource =
  | { type: 'candidate' }
  | { type: 'candidate-diff' }
  | { type: 'change'; name: string }
  | null

export function parseXirangContractSource(searchParams: URLSearchParams): XirangContractSource {
  if (searchParams.has('variant')) {
    throw new XirangContractError(400, 'Unsupported query parameter: variant')
  }

  const source = searchParams.get('source')
  const change = searchParams.get('change')
  
  if (source && change) {
    throw new XirangContractError(400, 'Cannot specify both source and change')
  }
  
  if (!source) {
    return null
  }
  
  if (source === 'candidate') {
    return { type: 'candidate' }
  }
  
  if (source === 'candidate-diff') {
    return { type: 'candidate-diff' }
  }
  
  if (source.startsWith('change:')) {
    const name = source.slice(7)
    return { type: 'change', name }
  }
  
  throw new XirangContractError(400, 'Invalid source identity')
}

export function assertXirangProject(project: string, projects: readonly { id: string }[]): void {
  if (!projects.some(candidate => candidate.id === project)) {
    throw new XirangContractError(404, 'Project not found')
  }
}

/**
 * Contracts are a root-owned projection carried by the change manifest. The requested element
 * identity is only ever a map key, so no request input can reach the file system.
 * Returns `null` when the Element carries no Contract.
 */
export function readXirangContract(
  manifest: XirangRuntimeManifestSnapshot | undefined,
  source: XirangContractSource,
  element: string,
): XirangContractContent | null {
  if (!manifest) {
    throw new XirangContractError(404, source ? 'Source not found' : 'Semantic Model not found')
  }
  
  let contractSource: XirangContractSourceSnapshot | undefined
  
  if (source === null) {
    contractSource = manifest.model
  } else if (source.type === 'candidate') {
    contractSource = manifest.candidate
    if (!contractSource) {
      throw new XirangContractError(404, 'Candidate not found')
    }
  } else if (source.type === 'candidate-diff') {
    contractSource = manifest.candidateDiff
    if (!contractSource) {
      throw new XirangContractError(404, 'Candidate diff not found')
    }
  } else if (source.type === 'change') {
    contractSource = manifest.changes[source.name]
    if (!contractSource) {
      throw new XirangContractError(404, 'Change not found')
    }
  }
  
  if (!contractSource) {
    throw new XirangContractError(404, 'Source not found')
  }
  
  const { contracts } = contractSource
  if (!contracts || !Object.hasOwn(contracts, element)) {
    return null
  }
  const md = contracts[element]
  return typeof md === 'string' ? { element, md } : null
}
