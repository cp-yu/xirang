import { describe, expect, it } from 'vitest'
import type { XirangChangeSource, XirangRuntimeManifest, XirangViewSource } from './ContractLoaderContext'
import { resolveEffectiveMode, xirangViewSourceRevision } from './ContractLoaderContext'

const modelSource: XirangViewSource = {
  id: 'model',
  label: 'Model View',
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
  version: 4,
  modelFingerprint: 'model-fp',
  model: modelSource,
  authoredViews: {},
  candidate: candidateSource,
  changes: {
    'auth-change': changeSource,
  },
}

const v4ManifestWithoutCandidate: XirangRuntimeManifest = {
  version: 4,
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

    expect(sources.map(source => source.id)).toEqual(['model'])
    expect(candidate?.id).toBe('candidate')
    expect(changes['auth-change']).not.toHaveProperty('id')
    expect(changes['auth-change']).not.toHaveProperty('source')
  })
})

describe('hides candidate sources when candidate is absent', () => {
  it('leaves Model as the only View source when manifest has no Candidate', () => {
    const { model, candidate, changes } = v4ManifestWithoutCandidate
    const sources = [model]

    expect(sources.map(source => source.id)).toEqual(['model'])
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
