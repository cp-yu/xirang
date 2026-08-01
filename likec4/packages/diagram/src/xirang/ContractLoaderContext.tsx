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

export interface XirangViewDiagnostic {
  level: 'ERROR' | 'WARNING'
  code: string
  path: string
  message: string
  identity?: string
}

export interface XirangViewSource {
  id: string
  label: string
  source: 'semantic-model' | 'change-derived-view'
  change?: string
  valid: boolean
  semanticModelFingerprint?: string
  changeFingerprint?: string
  partitionFingerprints?: Record<string, string>
  architecture?: XirangSemanticModel
  /** element identity → Contract markdown; absent key means the Element has no Contract. */
  contracts?: Record<string, string>
  diff?: {
    summary: { total: number } & Record<XirangDiffOperation, number>
    entries: XirangDiffEntry[]
  }
  diagnostics: XirangViewDiagnostic[]
  /** Change plan files (design.md, proposal.md, tasks.md). */
  changePlan?: Record<string, string>
}

/**
 * Contract diagnostics are the ones bound to a Requirement or Scenario identity. The `elements/`
 * partition carries Declaration and Contract alike, so a storage prefix cannot separate them.
 */
export function isXirangContractDiagnostic(diagnostic: Pick<XirangViewDiagnostic, 'identity'>): boolean {
  return diagnostic.identity !== undefined && diagnostic.identity.includes('#')
}

/** Stable refresh key for a Semantic Model or Change-derived View source. */
export function xirangViewSourceRevision(source: XirangViewSource): string {
  const fingerprints = source.partitionFingerprints
  return fingerprints
    ? Object.keys(fingerprints).sort().map(partition => fingerprints[partition]).join('|')
    : source.changeFingerprint ?? source.id
}

export interface XirangRuntimeManifest {
  version: 2
  semanticModel: XirangViewSource
  changes: Record<string, XirangViewSource>
}

export interface XirangContractLoader {
  /** `null` when the Element has no Contract; one Element carries at most one Contract. */
  load(project: string, element: string, signal: AbortSignal, change?: string): Promise<XirangContractContent | null>
  manifest?(signal: AbortSignal): Promise<XirangRuntimeManifest>
  subscribeManifest?(listener: () => void): () => void
}

const XirangContractLoaderContext = createContext<XirangContractLoader | null>(null)

export interface XirangViewSourceContextValue {
  sources: readonly XirangViewSource[]
  selected: XirangViewSource
  select(id: string): void
}

const modelViewSource: XirangViewSource = {
  id: 'model',
  label: 'Model View',
  source: 'semantic-model',
  valid: true,
  diagnostics: [],
}

const XirangViewSourceContext = createContext<XirangViewSourceContextValue>({
  sources: [modelViewSource],
  selected: modelViewSource,
  select: () => undefined,
})

export function XirangContractLoaderProvider({
  loader,
  initialManifest,
  children,
}: PropsWithChildren<{ loader: XirangContractLoader; initialManifest?: XirangRuntimeManifest }>) {
  const embeddedManifest = (globalThis as typeof globalThis & { __OPSX_RUNTIME__?: XirangRuntimeManifest }).__OPSX_RUNTIME__
  const initialSources = initialManifest
    ? [initialManifest.semanticModel, ...Object.values(initialManifest.changes)]
    : embeddedManifest
    ? [embeddedManifest.semanticModel, ...Object.values(embeddedManifest.changes)]
    : [modelViewSource]
  const [sources, setSources] = useState<readonly XirangViewSource[]>(initialSources)
  const [selectedId, setSelectedId] = useState('model')

  useEffect(() => {
    if (!loader.manifest) return
    let controller = new AbortController()
    const load = () => {
      controller.abort()
      const request = new AbortController()
      controller = request
      loader.manifest!(request.signal).then(manifest => {
        if (request.signal.aborted) return
        const next = [manifest.semanticModel, ...Object.values(manifest.changes)]
        setSources(next)
        setSelectedId(current => next.some(source => source.id === current) ? current : 'model')
      }).catch(() => undefined)
    }
    load()
    const unsubscribe = loader.subscribeManifest?.(load)
    return () => {
      controller.abort()
      unsubscribe?.()
    }
  }, [loader])

  const value = useMemo<XirangViewSourceContextValue>(() => ({
    sources,
    selected: sources.find(source => source.id === selectedId) ?? sources[0] ?? modelViewSource,
    select: setSelectedId,
  }), [selectedId, sources])

  return (
    <XirangContractLoaderContext.Provider value={loader}>
      <XirangViewSourceContext.Provider value={value}>
        {children}
      </XirangViewSourceContext.Provider>
    </XirangContractLoaderContext.Provider>
  )
}

export function useXirangContractLoader(): XirangContractLoader | null {
  return useContext(XirangContractLoaderContext)
}

export function useXirangViewSources(): XirangViewSourceContextValue {
  return useContext(XirangViewSourceContext)
}
