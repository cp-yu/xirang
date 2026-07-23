import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react'

export interface OpsxSpecContent {
  path: string
  md: string
}

export type OpsxDiffOperation = 'ADDED' | 'MODIFIED' | 'REMOVED'

export interface OpsxDiffEntry {
  scope: 'specs' | 'architecture'
  kind: 'requirement' | 'scenario' | 'element' | 'relationship' | 'elementKind' | 'relationshipKind' | 'property'
  identity: string
  operation: OpsxDiffOperation
  before?: unknown
  after?: unknown
  children?: OpsxDiffEntry[]
}

export interface OpsxArchitectureElement {
  id: string
  fqn: string
  kind: string
  title: string
  summary: string
  parent: string | null
  children: string[]
  metadata: Record<string, string | string[]>
}

export interface OpsxArchitectureRelation {
  source: string
  kind: string
  target: string
  title?: string
  metadata?: Record<string, string | string[]>
}

export interface OpsxArchitectureModel {
  languageVersion: string | null
  elements: OpsxArchitectureElement[]
  relations: OpsxArchitectureRelation[]
}

export interface OpsxVariantDiagnostic {
  level: 'ERROR' | 'WARNING'
  code: string
  path: string
  message: string
}

export interface OpsxRuntimeVariant {
  id: string
  label: string
  kind: 'formal' | 'change'
  change?: string
  valid: boolean
  formalFingerprint?: string
  changeFingerprint?: string
  architectureFingerprint?: string
  specsFingerprint?: string
  architecture?: OpsxArchitectureModel
  diff?: {
    summary: {
      total: number
      specs: Record<OpsxDiffOperation, number>
      architecture: Record<OpsxDiffOperation, number>
    }
    entries: OpsxDiffEntry[]
  }
  diagnostics: OpsxVariantDiagnostic[]
}

export function isOpsxSpecDiagnostic(path: string): boolean {
  const normalized = path.replaceAll('\\', '/')
  return normalized.startsWith('specs/') || normalized.startsWith('.opsx/specs/') || normalized.includes('/specs/')
}

export interface OpsxRuntimeManifest {
  version: 1
  variants: OpsxRuntimeVariant[]
}

export interface OpsxSpecLoader {
  list(project: string, element: string, signal: AbortSignal, variant?: string): Promise<readonly string[]>
  load(project: string, element: string, path: string, signal: AbortSignal, variant?: string): Promise<OpsxSpecContent>
  variants?(signal: AbortSignal): Promise<OpsxRuntimeManifest>
  subscribe?(listener: (path: string) => void): () => void
  subscribeVariants?(listener: () => void): () => void
}

const OpsxSpecLoaderContext = createContext<OpsxSpecLoader | null>(null)

export interface OpsxVariantContextValue {
  variants: readonly OpsxRuntimeVariant[]
  selected: OpsxRuntimeVariant
  select(id: string): void
}

const formalVariant: OpsxRuntimeVariant = {
  id: 'formal',
  label: 'Current / Formal Architecture',
  kind: 'formal',
  valid: true,
  diagnostics: [],
}

const OpsxVariantContext = createContext<OpsxVariantContextValue>({
  variants: [formalVariant],
  selected: formalVariant,
  select: () => undefined,
})

export function OpsxSpecLoaderProvider({
  loader,
  initialManifest,
  children,
}: PropsWithChildren<{ loader: OpsxSpecLoader; initialManifest?: OpsxRuntimeManifest }>) {
  const embeddedManifest = (globalThis as typeof globalThis & { __OPSX_RUNTIME__?: OpsxRuntimeManifest }).__OPSX_RUNTIME__
  const initialVariants = initialManifest?.variants.length
    ? initialManifest.variants
    : embeddedManifest?.variants.length
    ? embeddedManifest.variants
    : [formalVariant]
  const [variants, setVariants] = useState<readonly OpsxRuntimeVariant[]>(initialVariants)
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

  const value = useMemo<OpsxVariantContextValue>(() => ({
    variants,
    selected: variants.find(variant => variant.id === selectedId) ?? variants[0] ?? formalVariant,
    select: setSelectedId,
  }), [selectedId, variants])

  return (
    <OpsxSpecLoaderContext.Provider value={loader}>
      <OpsxVariantContext.Provider value={value}>
        {children}
      </OpsxVariantContext.Provider>
    </OpsxSpecLoaderContext.Provider>
  )
}

export function useOpsxSpecLoader(): OpsxSpecLoader | null {
  return useContext(OpsxSpecLoaderContext)
}

export function useOpsxVariants(): OpsxVariantContextValue {
  return useContext(OpsxVariantContext)
}
