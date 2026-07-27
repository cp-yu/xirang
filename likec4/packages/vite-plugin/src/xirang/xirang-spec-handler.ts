export interface XirangContractContent {
  element: string
  md: string
}

export interface XirangRuntimeVariantSnapshot {
  id?: string
  contracts?: Record<string, string>
}

export class XirangSpecError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
  ) {
    super(message)
  }
}

export function assertXirangProject(project: string, projects: readonly { id: string }[]): void {
  if (!projects.some(candidate => candidate.id === project)) {
    throw new XirangSpecError(404, 'Project not found')
  }
}

/**
 * Contracts are a root-owned projection carried by the change manifest. The requested element
 * identity is only ever a map key, so no request input can reach the file system.
 * Returns `null` when the Element carries no Contract.
 */
export function readXirangContract(
  variants: readonly XirangRuntimeVariantSnapshot[] | undefined,
  variantId: string | null,
  element: string,
): XirangContractContent | null {
  const id = variantId ?? 'formal'
  const variant = variants?.find(candidate => candidate.id === id)
  if (!variant) {
    throw new XirangSpecError(404, 'Variant not found')
  }
  const { contracts } = variant
  if (!contracts || !Object.hasOwn(contracts, element)) {
    return null
  }
  const md = contracts[element]
  return typeof md === 'string' ? { element, md } : null
}
