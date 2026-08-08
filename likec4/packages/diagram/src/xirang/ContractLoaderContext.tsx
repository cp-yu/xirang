import type { DiagramView } from '@likec4/core/types'
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react'

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

export interface XirangElementKind {
  identity: string
  nodePresentation?: { shape?: string; color?: string; border?: string }
}

export interface XirangRelationship {
  source: string
  kind: string
  target: string
}

export interface XirangRelationshipKind {
  identity: string
  presentation?: { color?: string; line?: string; head?: string; tail?: string }
}

/** The part of the Semantic Model IR the Browser consumes; identity is the only reference. */
export interface XirangSemanticModel {
  elements: XirangModelElement[]
  relationships: XirangRelationship[]
  elementKinds?: XirangElementKind[]
  relationshipKinds?: XirangRelationshipKind[]
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
  source: 'semantic-model' | 'change-derived-view' | 'candidate' | 'candidate-diff'
  change?: string
  valid: boolean
  semanticModelFingerprint?: string
  changeFingerprint?: string
  sourceFingerprint?: string
  partitionFingerprints?: Record<string, string>
  architecture?: XirangSemanticModel
  /** element identity → Contract markdown; absent key means the Element has no Contract. */
  contracts?: Record<string, string>
  /** Resolved Authored View boundary, present only for View Selection descriptors. */
  selection?: string[]
  roots?: string[]
  virtualRoot?: boolean
  diff?: {
    summary: { total: number } & Record<XirangDiffOperation, number>
    entries: XirangDiffEntry[]
  }
  /** Official layouted projection for the current Browser controller state. */
  projection?: DiagramView
  projectionKey?: string
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
    : source.sourceFingerprint ?? source.changeFingerprint ?? source.id
}

export interface XirangAuthoredViewDescriptor {
  title: string
  selection: string[]
  roots: string[]
  virtualRoot: boolean
}

export interface XirangChangeSource extends Omit<XirangViewSource, 'id' | 'source'> {
  change: string
}

export interface XirangRuntimeManifest {
  version: 4
  modelFingerprint: string
  model: XirangViewSource
  authoredViews: Record<string, XirangAuthoredViewDescriptor>
  candidate?: XirangViewSource
  candidateDiff?: XirangViewSource
  changes: Record<string, XirangChangeSource>
}

export interface XirangContractLoader {
  /** `null` when the Element has no Contract; one Element carries at most one Contract. */
  load(project: string, element: string, signal: AbortSignal, source?: string): Promise<XirangContractContent | null>
  manifest?(signal: AbortSignal): Promise<XirangRuntimeManifest>
  subscribeManifest?(listener: () => void): () => void
}

const XirangContractLoaderContext = createContext<XirangContractLoader | null>(null)

export interface XirangViewSourceContextValue {
  sources: readonly XirangViewSource[]
  selected: XirangViewSource
  select(id: string): void
  /** User-chosen diff display mode; effective mode is clamped per source. */
  mode: XirangViewMode
  setMode(mode: XirangViewMode): void
  applyBrowserProjection(selection: {
    viewId: string
    change: string | null
    mode: XirangViewMode
    showDiff: boolean
    projectionKey: string
    view: DiagramView
  }): void
}

/** Diff display mode of a Xirang source. */
export type XirangViewMode = 'full' | 'diff'

/**
 * Effective diff display mode for a source: candidate-diff is locked to `diff`,
 * candidate to `full`; only other sources honor the user-chosen mode.
 */
export function resolveEffectiveMode(
  source: XirangViewSource['source'],
  mode: XirangViewMode,
): XirangViewMode {
  if (source === 'candidate-diff') return 'diff'
  if (source === 'candidate') return 'full'
  return mode
}

const modelViewSource: XirangViewSource = {
  id: 'model',
  label: 'Model View',
  source: 'semantic-model',
  valid: true,
  diagnostics: [],
}

function manifestToSources(m: XirangRuntimeManifest): XirangViewSource[] {
  const authored = Object.entries(m.authoredViews).map(([id, view]) => ({
    ...m.model,
    id,
    label: view.title,
    selection: view.selection,
    roots: view.roots,
    virtualRoot: view.virtualRoot,
  }))
  return [
    m.model,
    ...authored,
    ...(m.candidate ? [m.candidate] : []),
    ...(m.candidateDiff ? [m.candidateDiff] : []),
  ]
}

const XirangViewSourceContext = createContext<XirangViewSourceContextValue>({
  sources: [modelViewSource],
  selected: modelViewSource,
  select: () => undefined,
  mode: 'full',
  setMode: () => undefined,
  applyBrowserProjection: () => undefined,
})

export function XirangContractLoaderProvider({
  loader,
  initialManifest,
  children,
}: PropsWithChildren<{ loader: XirangContractLoader; initialManifest?: XirangRuntimeManifest }>) {
  const embeddedManifest = (globalThis as typeof globalThis & { __OPSX_RUNTIME__?: unknown }).__OPSX_RUNTIME__
  const initialRuntime = initialManifest
    ?? (embeddedManifest
      && typeof embeddedManifest === 'object'
      && (embeddedManifest as { version?: unknown }).version === 4
      && 'model' in embeddedManifest
      && 'authoredViews' in embeddedManifest
      && 'changes' in embeddedManifest
      ? embeddedManifest as XirangRuntimeManifest
      : null)
  const initialSources = initialRuntime ? manifestToSources(initialRuntime) : [modelViewSource]
  const [manifest, setManifest] = useState<XirangRuntimeManifest | null>(initialRuntime)
  const [sources, setSources] = useState<readonly XirangViewSource[]>(initialSources)
  const [selectedId, setSelectedId] = useState('model')
  const [mode, setMode] = useState<XirangViewMode>('full')
  const [browserProjection, setBrowserProjection] = useState<{
    viewId: string
    change: string | null
    showDiff: boolean
    projectionKey: string
    view: DiagramView
  } | null>(null)

  useEffect(() => {
    if (!loader.manifest) return
    let controller = new AbortController()
    const load = () => {
      controller.abort()
      const request = new AbortController()
      controller = request
      loader.manifest!(request.signal).then(manifest => {
        if (request.signal.aborted) return
        const next = manifestToSources(manifest)
        setManifest(manifest)
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

  const applyBrowserProjection = useCallback((selection: {
    viewId: string
    change: string | null
    mode: XirangViewMode
    showDiff: boolean
    projectionKey: string
    view: DiagramView
  }) => {
    setSelectedId(selection.viewId)
    setMode(selection.mode)
    setBrowserProjection(selection)
  }, [])

  const value = useMemo<XirangViewSourceContextValue>(() => {
    const base = sources.find(source => source.id === selectedId) ?? sources[0] ?? modelViewSource
    let selected = base
    if (browserProjection && browserProjection.viewId === base.id) {
      const change = browserProjection.change ? manifest?.changes[browserProjection.change] : undefined
      const selectedChange = change && !browserProjection.showDiff
        ? (({ diff: _diff, ...rest }) => rest)(change)
        : change
      selected = {
        ...(selectedChange ?? base),
        id: base.id,
        label: base.label,
        source: change ? 'change-derived-view' : base.source,
        ...(change ? { change: change.change } : {}),
        projection: browserProjection.view,
        projectionKey: browserProjection.projectionKey,
      }
    }
    return {
      sources,
      selected,
      select: setSelectedId,
      mode,
      setMode,
      applyBrowserProjection,
    }
  }, [applyBrowserProjection, browserProjection, manifest, mode, selectedId, sources])

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
