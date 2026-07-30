export interface XirangContractContent {
  element: string
  md: string
}

export interface XirangContractSourceSnapshot {
  contracts?: Record<string, string>
}

export interface XirangRuntimeManifestSnapshot {
  semanticModel: XirangContractSourceSnapshot
  changes: Record<string, XirangContractSourceSnapshot>
}

export class XirangContractError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
  ) {
    super(message)
  }
}

export function readXirangContractChange(searchParams: URLSearchParams): string | null {
  if (searchParams.has('variant')) {
    throw new XirangContractError(400, 'Unsupported query parameter: variant')
  }
  return searchParams.get('change')
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
  change: string | null,
  element: string,
): XirangContractContent | null {
  if (!manifest) {
    throw new XirangContractError(404, change ? 'Change not found' : 'Semantic Model not found')
  }
  const source = change === null ? manifest.semanticModel : manifest.changes[change]
  if (!source) {
    throw new XirangContractError(404, 'Change not found')
  }
  const { contracts } = source
  if (!contracts || !Object.hasOwn(contracts, element)) {
    return null
  }
  const md = contracts[element]
  return typeof md === 'string' ? { element, md } : null
}
