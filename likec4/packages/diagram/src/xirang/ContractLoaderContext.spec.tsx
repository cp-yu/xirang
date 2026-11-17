import type { DiagramView } from '@likec4/core/types'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { XirangChangeSource, XirangRuntimeManifest, XirangViewSource } from './ContractLoaderContext'
import {
  XirangContractLoaderProvider,
  useXirangViewSources,
  isKnownViewId,
  resolveEffectiveMode,
  resolveSelectedViewSource,
  xirangViewSourceRevision,
} from './ContractLoaderContext'

const modelSource: XirangViewSource = {
  id: 'full-model',
  label: 'Full Model',
  source: 'semantic-model',
  valid: true,
  sourceFingerprint: 'model-fp',
  diagnostics: [],
  architecture: {
    elements: [
      {
        declaration: {
          identity: 'project.root',
          kind: 'project',
          parent: null,
          title: 'Root',
          definition: 'Root',
          summary: 'Root',
          description: 'Root',
        },
      },
    ],
    relationships: [],
  },
}

const candidateSource: XirangViewSource = {
  id: 'candidate',
  label: 'Candidate View',
  source: 'candidate',
  valid: true,
  sourceFingerprint: 'candidate-fp',
  diagnostics: [],
  architecture: {
    elements: [
      {
        declaration: {
          identity: 'project.root',
          kind: 'project',
          parent: null,
          title: 'Root',
          definition: 'Root',
          summary: 'Root',
          description: 'Root',
        },
      },
      {
        declaration: {
          identity: 'new.element',
          kind: 'capability',
          parent: 'project.root',
          title: 'New Element',
          definition: 'Candidate-only element',
          summary: 'Candidate-only element',
          description: 'Candidate-only element',
        },
      },
    ],
    relationships: [],
  },
  diff: {
    summary: { total: 1, ADDED: 1, MODIFIED: 0, REMOVED: 0 },
    entries: [
      {
        kind: 'element-declaration',
        identity: 'new.element',
        operation: 'ADDED',
        after: { identity: 'new.element', kind: 'capability', parent: 'project.root', title: 'New Element', definition: 'Candidate-only element', summary: 'Candidate-only element', description: 'Candidate-only element' },
      },
    ],
  },
}

const changeSource: XirangChangeSource = {
  label: 'auth-change',
  change: 'auth-change',
  valid: true,
  sourceFingerprint: 'change-fp',
  diagnostics: [],
}

const v4ManifestWithCandidate: XirangRuntimeManifest = {
  version: 5,
  modelFingerprint: 'model-fp',
  model: modelSource,
  authoredViews: {},
  candidate: candidateSource,
  changes: {
    'auth-change': changeSource,
  },
}

const v4ManifestWithoutCandidate: XirangRuntimeManifest = {
  version: 5,
  modelFingerprint: 'model-fp',
  model: modelSource,
  authoredViews: {},
  changes: {
    'auth-change': changeSource,
  },
}

describe('keeps change input separate from view source identities', () => {
  it('lists Model without enumerating the Candidate or Changes as Views', () => {
    const { model, candidate, changes } = v4ManifestWithCandidate
    const sources = [model]

    expect(sources.map(source => source.id)).toEqual(['full-model'])
    expect(candidate?.id).toBe('candidate')
    expect(changes['auth-change']).not.toHaveProperty('id')
    expect(changes['auth-change']).not.toHaveProperty('source')
  })
})

describe('hides candidate sources when candidate is absent', () => {
  it('leaves Model as the only View source when manifest has no Candidate', () => {
    const { model, candidate, changes } = v4ManifestWithoutCandidate
    const sources = [model]

    expect(sources.map(source => source.id)).toEqual(['full-model'])
    expect(candidate).toBeUndefined()
    expect(Object.keys(changes)).toEqual(['auth-change'])
  })
})

describe('keeps the effective mode uniform across sources', () => {
  it('resolveEffectiveMode passes the chosen mode for every source', () => {
    expect(resolveEffectiveMode('candidate', 'full')).toBe('full')
    expect(resolveEffectiveMode('candidate', 'diff')).toBe('diff')
    expect(resolveEffectiveMode('semantic-model', 'full')).toBe('full')
    expect(resolveEffectiveMode('change-derived-view', 'diff')).toBe('diff')
    expect(resolveEffectiveMode('change-derived-view', 'full')).toBe('full')
  })

  it('candidate source carries the diff for the three-state mode', () => {
    expect(candidateSource.id).toBe('candidate')
    expect(candidateSource.source).toBe('candidate')
    expect(candidateSource.diff).toBeDefined()
  })
})

describe('falls back after candidate focus disappears', () => {
  it('revision changes when candidate is updated', () => {
    const beforeRevision = xirangViewSourceRevision(candidateSource)

    const updatedCandidate: XirangViewSource = {
      ...candidateSource,
      sourceFingerprint: 'candidate-fp-updated',
    }

    const afterRevision = xirangViewSourceRevision(updatedCandidate)
    expect(afterRevision).not.toBe(beforeRevision)
  })

  it('revision is deterministic for same source', () => {
    const revision1 = xirangViewSourceRevision(candidateSource)
    const revision2 = xirangViewSourceRevision(candidateSource)
    expect(revision1).toBe(revision2)
  })

  it('old source revision cannot override new source revision', () => {
    const oldRevision = xirangViewSourceRevision(candidateSource)
    const newCandidate: XirangViewSource = {
      ...candidateSource,
      sourceFingerprint: 'new-candidate-fp',
      architecture: {
        elements: [
          {
            declaration: {
              identity: 'project.root',
              kind: 'project',
              parent: null,
              title: 'Root',
              definition: 'Root',
              summary: 'Root',
              description: 'Root',
            },
          },
        ],
        relationships: [],
      },
    }
    const newRevision = xirangViewSourceRevision(newCandidate)
    expect(newRevision).not.toBe(oldRevision)
  })
})

const candidateOnlyProjection = { id: 'feedback-loop' } as DiagramView

const candidateWithAuthoredView: XirangViewSource = {
  ...candidateSource,
  authoredViews: {
    'feedback-loop': {
      title: 'Feedback Loop',
      selection: ['feedback-model'],
      roots: ['feedback-model'],
      virtualRoot: false,
    },
  },
}

const manifestWithCandidateView: XirangRuntimeManifest = {
  ...v4ManifestWithCandidate,
  candidate: candidateWithAuthoredView,
}

describe('applies projection for instance-local views', () => {
  it('attaches a candidate-only authored view projection even when that view is not in formal sources', () => {
    const selected = resolveSelectedViewSource({
      sources: [modelSource],
      selectedId: 'feedback-loop',
      manifest: manifestWithCandidateView,
      browserProjection: {
        viewId: 'feedback-loop',
        model: 'candidate',
        showDiff: false,
        projectionKey: 'k',
        view: candidateOnlyProjection,
      },
    })
    expect(selected.id).toBe('feedback-loop')
    expect(selected.label).toBe('Feedback Loop')
    expect(selected.projection).toBe(candidateOnlyProjection)
  })

  it('does not attach a stale projection when selectedId has moved on', () => {
    const selected = resolveSelectedViewSource({
      sources: [modelSource],
      selectedId: 'feedback-loop',
      manifest: manifestWithCandidateView,
      browserProjection: {
        viewId: 'full-model',
        model: 'candidate',
        showDiff: false,
        projectionKey: 'k',
        view: { id: 'full-model' } as DiagramView,
      },
    })
    expect(selected.projection).toBeUndefined()
    expect(selected.id).toBe('full-model')
  })
})

describe('keeps instance-local view ids across manifest refresh', () => {
  it('accepts a candidate-only authored view id', () => {
    expect(isKnownViewId(manifestWithCandidateView, 'feedback-loop')).toBe(true)
    expect(isKnownViewId(v4ManifestWithCandidate, 'feedback-loop')).toBe(false)
    expect(isKnownViewId(manifestWithCandidateView, 'full-model')).toBe(true)
  })
})

describe('Contract location refresh', () => {
  it('invalidates a source when only its Contract location fingerprint changed', () => {
    const source = { ...candidateSource, contractFingerprint: 'old-location' }
    expect(xirangViewSourceRevision({ ...source, contractFingerprint: 'new-location' }))
      .not.toBe(xirangViewSourceRevision(source))
  })
})


describe('embedded Contract runtime protocol', () => {
  it.each([[5, true], [4, false]] as const)('initializes embedded version %i only when current', (version, accepted) => {
    const contracts = { 'project.root': 'Preloaded Contract' }
    const contractLinks = { 'project.root': [{ href: '#heading', element: 'project.root', fragment: 'heading' }] }
    vi.stubGlobal('__OPSX_RUNTIME__', {
      ...v4ManifestWithoutCandidate,
      version,
      model: { ...modelSource, contracts, contractLinks },
    })
    function Probe() {
      const { selected } = useXirangViewSources()
      return <span>{JSON.stringify({ contracts: selected.contracts, links: selected.contractLinks })}</span>
    }
    try {
      const html = renderToStaticMarkup(
        <XirangContractLoaderProvider loader={{ load: async () => null }}><Probe /></XirangContractLoaderProvider>,
      )
      expect(html.includes('Preloaded Contract')).toBe(accepted)
      expect(html.includes('#heading')).toBe(accepted)
    } finally {
      vi.unstubAllGlobals()
    }
  })
})

describe('Contract navigation source isolation', () => {
  it('distinguishes fingerprint-equivalent Models selected in the same View', () => {
    const source = {
      ...modelSource,
      source: 'change-derived-view' as const,
      partitionFingerprints: { elements: 'same-elements', relationships: 'same-relationships' },
      contractFingerprint: 'same-locations',
    }
    const first = { ...source, change: 'change:link-source-a' }
    const second = { ...source, change: 'change:link-source-b' }
    expect(first.id).toBe(second.id)
    expect(xirangViewSourceRevision(first)).not.toBe(xirangViewSourceRevision(second))
    expect(xirangViewSourceRevision({ ...source, change: 'candidate' })).not.toBe(xirangViewSourceRevision(first))
    expect(xirangViewSourceRevision(modelSource)).not.toBe(xirangViewSourceRevision({ ...modelSource, source: 'change-derived-view', change: 'candidate' }))
  })
})
