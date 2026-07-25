import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react'

export interface XirangSpecContent {
  path: string
  md: string
}

export type XirangDiffOperation = 'ADDED' | 'MODIFIED' | 'REMOVED'

export interface XirangDiffEntry {
  scope: 'specs' | 'architecture'
  kind: 'requirement' | 'scenario' | 'element' | 'relationship' | 'elementKind' | 'relationshipKind' | 'property'
  identity: string
  operation: XirangDiffOperation
  before?: unknown
  after?: unknown
  children?: XirangDiffEntry[]
}

export interface XirangArchitectureElement {
  id: string
  fqn: string
  kind: string
  title: string
  summary: string
  parent: string | null
  children: string[]
  metadata: Record<string, string | string[]>
}

export interface XirangArchitectureRelation {
  source: string
  kind: string
  target: string
  title?: string
  metadata?: Record<string, string | string[]>
}

export interface XirangArchitectureModel {
  languageVersion: string | null
  elements: XirangArchitectureElement[]
  relations: XirangArchitectureRelation[]
}

export interface XirangVariantDiagnostic {
  level: 'ERROR' | 'WARNING'
  code: string
  path: string
  message: string
}

export interface XirangRuntimeVariant {
  id: string
  label: string
  kind: 'formal' | 'change'
  change?: string
  valid: boolean
  formalFingerprint?: string
  changeFingerprint?: string
  architectureFingerprint?: string
  specsFingerprint?: string
  architecture?: XirangArchitectureModel
  diff?: {
    summary: {
      total: number
      specs: Record<XirangDiffOperation, number>
      architecture: Record<XirangDiffOperation, number>
    }
    entries: XirangDiffEntry[]
  }
  diagnostics: XirangVariantDiagnostic[]
}

export function isXirangSpecDiagnostic(path: string): boolean {
  const normalized = path.replaceAll('\\', '/')
  return normalized.startsWith('specs/') || normalized.startsWith('.xirang/specs/') || normalized.includes('/specs/')
}

export interface XirangRuntimeManifest {
  version: 1
  variants: XirangRuntimeVariant[]
}

export interface XirangSpecLoader {
  list(project: string, element: string, signal: AbortSignal, variant?: string): Promise<readonly string[]>
  load(project: string, element: string, path: string, signal: AbortSignal, variant?: string): Promise<XirangSpecContent>
  variants?(signal: AbortSignal): Promise<XirangRuntimeManifest>
  subscribe?(listener: (path: string) => void): () => void
  subscribeVariants?(listener: () => void): () => void
}

const XirangSpecLoaderContext = createContext<XirangSpecLoader | null>(null)

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

export function XirangSpecLoaderProvider({
  loader,
  initialManifest,
  children,
}: PropsWithChildren<{ loader: XirangSpecLoader; initialManifest?: XirangRuntimeManifest }>) {
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
    <XirangSpecLoaderContext.Provider value={loader}>
      <XirangVariantContext.Provider value={value}>
        {children}
      </XirangVariantContext.Provider>
    </XirangSpecLoaderContext.Provider>
  )
}

export function useXirangSpecLoader(): XirangSpecLoader | null {
  return useContext(XirangSpecLoaderContext)
}

export function useXirangVariants(): XirangVariantContextValue {
  return useContext(XirangVariantContext)
}
