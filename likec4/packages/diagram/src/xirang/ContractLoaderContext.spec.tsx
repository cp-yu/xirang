import { describe, expect, it } from 'vitest'
import type { XirangRuntimeManifest, XirangViewSource } from './ContractLoaderContext'
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
}

const candidateDiffSource: XirangViewSource = {
  id: 'candidate-diff',
  label: 'Candidate Diff View',
  source: 'candidate-diff',
  valid: true,
  sourceFingerprint: 'candidate-diff-fp',
  diagnostics: [],
  architecture: candidateSource.architecture!,
  diff: {
    summary: { total: 1, ADDED: 1, MODIFIED: 0, REMOVED: 0 },
    entries: [
      {
        kind: 'element-declaration',
        identity: 'new.element',
        operation: 'ADDED',
        after: candidateSource.architecture?.elements[1]?.declaration,
      },
    ],
  },
}

const changeSource: XirangViewSource = {
  id: 'change:auth-change',
  label: 'auth-change',
  source: 'change-derived-view',
  change: 'auth-change',
  valid: true,
  sourceFingerprint: 'change-fp',
  diagnostics: [],
}

const v3ManifestWithCandidate: XirangRuntimeManifest = {
  version: 3,
  semanticModel: modelSource,
  candidate: candidateSource,
  candidateDiff: candidateDiffSource,
  changes: {
    'auth-change': changeSource,
  },
}

const v3ManifestWithoutCandidate: XirangRuntimeManifest = {
  version: 3,
  semanticModel: modelSource,
  changes: {
    'auth-change': changeSource,
  },
}

describe('lists model candidate candidate diff and change sources', () => {
  it('includes candidate and candidateDiff in correct order when present', () => {
    const { semanticModel, candidate, candidateDiff, changes } = v3ManifestWithCandidate

    // Expected source order: Model, Candidate, Candidate Diff, Changes
    const sources = [
      semanticModel,
      ...(candidate ? [candidate] : []),
      ...(candidateDiff ? [candidateDiff] : []),
      ...Object.values(changes),
    ]

    expect(sources[0]!.id).toBe('model')
    expect(sources[0]!.source).toBe('semantic-model')
    expect(sources[1]!.id).toBe('candidate')
    expect(sources[1]!.source).toBe('candidate')
    expect(sources[2]!.id).toBe('candidate-diff')
    expect(sources[2]!.source).toBe('candidate-diff')
    expect(sources[3]!.id).toBe('change:auth-change')
    expect(sources[3]!.source).toBe('change-derived-view')
  })
})

describe('hides candidate sources when candidate is absent', () => {
  it('omits candidate and candidateDiff from sources when manifest has none', () => {
    const { semanticModel, changes } = v3ManifestWithoutCandidate

    const sources = [
      semanticModel,
      ...Object.values(changes),
    ]

    expect(sources.every(s => s.source !== 'candidate')).toBe(true)
    expect(sources.every(s => s.source !== 'candidate-diff')).toBe(true)
    expect(sources).toHaveLength(2)
    expect(sources[0]!.id).toBe('model')
    expect(sources[1]!.id).toBe('change:auth-change')
  })
})

describe('locks candidate diff to diff only mode', () => {
  it('resolveEffectiveMode locks candidate-diff to diff and candidate to full', () => {
    expect(resolveEffectiveMode('candidate-diff', 'full')).toBe('diff')
    expect(resolveEffectiveMode('candidate', 'diff')).toBe('full')
  })

  it('resolveEffectiveMode passes the chosen mode for model and change-derived', () => {
    expect(resolveEffectiveMode('semantic-model', 'full')).toBe('full')
    expect(resolveEffectiveMode('change-derived-view', 'diff')).toBe('diff')
    expect(resolveEffectiveMode('change-derived-view', 'full')).toBe('full')
  })

  it('candidate-diff source has distinct id and source identifying it as diff-only', () => {
    expect(candidateDiffSource.id).toBe('candidate-diff')
    expect(candidateDiffSource.source).toBe('candidate-diff')
    expect(candidateDiffSource.diff).toBeDefined()
    expect(candidateSource.diff).toBeUndefined()
  })

  it('candidate source is identifiable as full-mode only', () => {
    expect(candidateSource.id).toBe('candidate')
    expect(candidateSource.source).toBe('candidate')
    expect(candidateSource.diff).toBeUndefined()
  })

  it('candidate and candidate-diff are separate sources with separate identities', () => {
    expect(candidateSource.id).not.toBe(candidateDiffSource.id)
    expect(candidateSource.source).not.toBe(candidateDiffSource.source)
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
