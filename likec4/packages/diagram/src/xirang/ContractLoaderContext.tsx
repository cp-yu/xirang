import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react'

export interface XirangContractContent {
  element: string
  md: string
}

export type XirangDiffOperation = 'ADDED' | 'MODIFIED' | 'REMOVED'

/** Mirrors the kernel `DiffKind`: entity types plus the child-only `scenario` and `property`. */
export type XirangDiffKind =
  | 'element-declaration'
  | 'element-kind'
  | 'relationship-kind'
  | 'authored-view'
  | 'relationship'
  | 'requirement'
  | 'scenario'
  | 'property'

/** Entries are keyed by entity type and identity only; the storage partition never appears. */
export interface XirangDiffEntry {
  kind: XirangDiffKind
  identity: string
  operation: XirangDiffOperation
  before?: unknown
  after?: unknown
  children?: XirangDiffEntry[]
}

export interface XirangElementDeclaration {
  identity: string
  kind: string
  parent: string | null
  title: string
  definition: string
  summary: string
  description: string
}

export interface XirangModelElement {
  declaration: XirangElementDeclaration
}

export interface XirangRelationship {
  source: string
  kind: string
  target: string
}

/** The part of the Semantic Model IR the Browser consumes; identity is the only reference. */
export interface XirangSemanticModel {
  elements: XirangModelElement[]
  relationships: XirangRelationship[]
}

export interface XirangVariantDiagnostic {
  level: 'ERROR' | 'WARNING'
  code: string
  path: string
  message: string
  identity?: string
}

export interface XirangRuntimeVariant {
  id: string
  label: string
  kind: 'formal' | 'change'
  change?: string
  valid: boolean
  formalFingerprint?: string
  changeFingerprint?: string
  partitionFingerprints?: Record<string, string>
  architecture?: XirangSemanticModel
  /** element identity → Contract markdown; absent key means the Element has no Contract. */
  contracts?: Record<string, string>
  diff?: {
    summary: { total: number } & Record<XirangDiffOperation, number>
    entries: XirangDiffEntry[]
  }
  diagnostics: XirangVariantDiagnostic[]
}

/**
 * Contract diagnostics are the ones bound to a Requirement or Scenario identity. The `elements/`
 * partition carries Declaration and Contract alike, so a storage prefix cannot separate them.
 */
export function isXirangContractDiagnostic(diagnostic: Pick<XirangVariantDiagnostic, 'identity'>): boolean {
  return diagnostic.identity !== undefined && diagnostic.identity.includes('#')
}

/** Stable refresh key: it changes whenever any partition of the selected variant changes. */
export function xirangVariantRevision(variant: XirangRuntimeVariant): string {
  const fingerprints = variant.partitionFingerprints
  return fingerprints
    ? Object.keys(fingerprints).sort().map(partition => fingerprints[partition]).join('|')
    : variant.changeFingerprint ?? variant.id
}

export interface XirangRuntimeManifest {
  version: 1
  variants: XirangRuntimeVariant[]
}

export interface XirangContractLoader {
  /** `null` when the Element has no Contract; one Element carries at most one Contract. */
  load(project: string, element: string, signal: AbortSignal, variant?: string): Promise<XirangContractContent | null>
  variants?(signal: AbortSignal): Promise<XirangRuntimeManifest>
  subscribeVariants?(listener: () => void): () => void
}

const XirangContractLoaderContext = createContext<XirangContractLoader | null>(null)

export interface XirangVariantContextValue {
  variants: readonly XirangRuntimeVariant[]
  selected: XirangRuntimeVariant
  select(id: string): void
}

const formalVariant: XirangRuntimeVariant = {
  id: 'formal',
  label: 'Current / Formal Architecture',
  kind: 'formal',
  valid: true,
  diagnostics: [],
}

const XirangVariantContext = createContext<XirangVariantContextValue>({
  variants: [formalVariant],
  selected: formalVariant,
  select: () => undefined,
})

export function XirangContractLoaderProvider({
  loader,
  initialManifest,
  children,
}: PropsWithChildren<{ loader: XirangContractLoader; initialManifest?: XirangRuntimeManifest }>) {
  const embeddedManifest = (globalThis as typeof globalThis & { __OPSX_RUNTIME__?: XirangRuntimeManifest }).__OPSX_RUNTIME__
  const initialVariants = initialManifest?.variants.length
    ? initialManifest.variants
    : embeddedManifest?.variants.length
    ? embeddedManifest.variants
    : [formalVariant]
  const [variants, setVariants] = useState<readonly XirangRuntimeVariant[]>(initialVariants)
  const [selectedId, setSelectedId] = useState('formal')

  useEffect(() => {
    if (!loader.variants) return
    let controller = new AbortController()
    const load = () => {
      controller.abort()
      controller = new AbortController()
      loader.variants!(controller.signal).then(manifest => {
        if (controller.signal.aborted) return
        const next = manifest.variants.length > 0 ? manifest.variants : [formalVariant]
        setVariants(next)
        setSelectedId(current => next.some(variant => variant.id === current) ? current : 'formal')
      }).catch(() => undefined)
    }
    load()
    const unsubscribe = loader.subscribeVariants?.(load)
    return () => {
      controller.abort()
      unsubscribe?.()
    }
  }, [loader])

  const value = useMemo<XirangVariantContextValue>(() => ({
    variants,
    selected: variants.find(variant => variant.id === selectedId) ?? variants[0] ?? formalVariant,
    select: setSelectedId,
  }), [selectedId, variants])

  return (
    <XirangContractLoaderContext.Provider value={loader}>
      <XirangVariantContext.Provider value={value}>
        {children}
      </XirangVariantContext.Provider>
    </XirangContractLoaderContext.Provider>
  )
}

export function useXirangContractLoader(): XirangContractLoader | null {
  return useContext(XirangContractLoaderContext)
}

export function useXirangVariants(): XirangVariantContextValue {
  return useContext(XirangVariantContext)
}
