import type { DiagramView } from '@likec4/core/types'
import { describe, expect, it } from 'vitest'
import { isXirangContractDiagnostic, type XirangRuntimeVariant } from './SpecLoaderContext'
import { getArchitectureOverlayModel } from '../likec4diagram/DiagramUI'
import { materializeXirangArchitectureView } from './architectureView'

/** Formal nodes are keyed by the derived local name; identity travels in `metadata.elementId`. */
const node = (fqn: string, elementId: string, title: string, x: number) => ({
  id: fqn,
  modelRef: fqn,
  metadata: { elementId },
  parent: elementId === 'project.root' ? null : 'projectRoot',
  level: elementId === 'project.root' ? 0 : 1,
  children: [],
  inEdges: [],
  outEdges: [],
  title,
  shape: 'rectangle',
  color: 'primary',
  style: { opacity: 15, size: 'md' },
  kind: 'el',
  x,
  y: 40,
  width: 320,
  height: 180,
})

const formal = {
  _type: 'element',
  _stage: 'layouted',
  id: 'index',
  title: 'Index',
  hash: 'formal',
  bounds: { x: 0, y: 0, width: 1200, height: 400 },
  nodes: [
    node('projectRoot', 'project.root', 'Project', 0),
    node('projectRoot.alpha', 'alpha.id', 'Alpha', 360),
    node('projectRoot.beta', 'beta.id', 'Beta', 720),
  ],
  edges: [],
} as unknown as DiagramView

const declaration = (identity: string, title: string, definition: string, parent: string | null) => ({
  declaration: { identity, kind: 'capability', parent, title, definition, summary: definition, description: definition },
})

const variant: XirangRuntimeVariant = {
  id: 'change:test',
  label: 'test',
  kind: 'change',
  change: 'test',
  valid: true,
  changeFingerprint: 'fingerprint',
  diagnostics: [],
  architecture: {
    elements: [
      declaration('project.root', 'Project', 'Project', null),
      declaration('alpha.id', 'Alpha target', 'Changed', 'project.root'),
      declaration('gamma.id', 'Gamma', 'Added', 'project.root'),
    ],
    relationships: [{ source: 'alpha.id', kind: 'invokes', target: 'gamma.id' }],
  },
  diff: {
    summary: { total: 4, ADDED: 2, MODIFIED: 1, REMOVED: 1 },
    entries: [
      { kind: 'element-declaration', identity: 'alpha.id', operation: 'MODIFIED' },
      { kind: 'element-declaration', identity: 'gamma.id', operation: 'ADDED' },
      {
        kind: 'element-declaration',
        identity: 'beta.id',
        operation: 'REMOVED',
        before: {
          identity: 'beta.id',
          kind: 'capability',
          parent: 'project.root',
          title: 'Beta',
          definition: 'Removed',
          summary: 'Removed',
          description: 'Removed',
        },
      },
      {
        kind: 'relationship',
        identity: 'alpha.id|invokes|gamma.id',
        operation: 'ADDED',
        after: { source: 'alpha.id', kind: 'invokes', target: 'gamma.id' },
      },
      { kind: 'requirement', identity: 'alpha.id#Login', operation: 'MODIFIED' },
    ],
  },
}

function summarize(view: DiagramView) {
  return {
    nodes: view.nodes.map(item => item.id),
    parents: view.nodes.map(item => [item.id, item.parent]),
    children: view.nodes.map(item => [item.id, item.children]),
    edges: view.edges.map(item => item.id),
    colors: view.nodes.map(item => [item.id, item.color]),
  }
}

describe('materializeXirangArchitectureView', () => {
  it('separates Contract diagnostics from structural ones by identity, not by storage path', () => {
    expect(isXirangContractDiagnostic({ identity: 'auth.id#Login' })).toBe(true)
    expect(isXirangContractDiagnostic({ identity: 'auth.id#Login#MFA' })).toBe(true)
    expect(isXirangContractDiagnostic({ identity: 'auth.id' })).toBe(false)
    expect(isXirangContractDiagnostic({})).toBe(false)
    const withContractError: XirangRuntimeVariant = {
      ...variant,
      diagnostics: [{
        level: 'ERROR',
        code: 'UNSUPPORTED_CONTRACT_CONTENT',
        path: 'elements/auth.id.md',
        message: 'Bad Requirement',
        identity: 'auth.id#Login',
      }],
    }
    expect(getArchitectureOverlayModel(withContractError).diagnostics).toEqual([])
  })

  it('counts only structural entries in the overlay summary', () => {
    const overlay = getArchitectureOverlayModel(variant)

    expect(overlay.counts).toEqual({ ADDED: 2, MODIFIED: 1, REMOVED: 1 })
    expect(overlay.changed).toEqual(['alpha.id', 'beta.id', 'gamma.id'])
  })

  it('renders the selected complete target graph keyed by identity', () => {
    const target = materializeXirangArchitectureView(formal, variant, 'full')

    expect(target.nodes.map(item => item.id)).toEqual(['project.root', 'alpha.id', 'gamma.id'])
    expect(target.nodes.find(item => item.id === 'alpha.id')).toMatchObject({ title: 'Alpha target', color: 'amber' })
    expect(target.nodes.find(item => item.id === 'gamma.id')).toMatchObject({ color: 'green' })
    expect(target.edges).toEqual([expect.objectContaining({ source: 'alpha.id', target: 'gamma.id', color: 'green' })])
  })

  it('uses the shared excerpt for nodes and preserves the full Definition for details', () => {
    const fullDefinition = `First   paragraph ${'😀'.repeat(121)}.\n\nSecond paragraph remains complete.`
    const projected: XirangRuntimeVariant = {
      ...variant,
      architecture: {
        ...variant.architecture!,
        elements: [
          declaration('project.root', 'Project', 'Project', null),
          {
            declaration: {
              identity: 'alpha.id',
              kind: 'capability',
              parent: 'project.root',
              title: 'Alpha target',
              definition: fullDefinition,
              summary: `First paragraph ${'😀'.repeat(104)}...`,
              description: fullDefinition,
            },
          },
        ],
      },
    }

    const target = materializeXirangArchitectureView(formal, projected, 'full')
    expect(target.nodes.find(item => item.id === 'alpha.id')).toMatchObject({
      description: { txt: `First paragraph ${'😀'.repeat(104)}...` },
      metadata: { elementId: 'alpha.id', definition: fullDefinition },
    })
  })

  it('keeps only changed graph, endpoints, and ancestor context in Diff only mode', () => {
    const target = materializeXirangArchitectureView(formal, variant, 'diff')

    expect(target.nodes.map(item => item.id)).toEqual(['project.root', 'alpha.id', 'gamma.id', 'beta.id'])
    expect(target.nodes.find(item => item.id === 'beta.id')).toMatchObject({ color: 'red', parent: 'project.root' })
    expect(target.edges).toHaveLength(1)
  })

  it('stays stable when every derived local name changes but identities do not', () => {
    const regenerated = {
      ...formal,
      nodes: formal.nodes.map((item, index) => ({
        ...item,
        id: `renamed_${index}`,
        modelRef: `renamed_${index}`,
        parent: item.parent === null ? null : 'renamed_0',
      })),
    } as unknown as DiagramView

    for (const mode of ['full', 'diff'] as const) {
      expect(summarize(materializeXirangArchitectureView(regenerated, variant, mode)))
        .toEqual(summarize(materializeXirangArchitectureView(formal, variant, mode)))
    }
  })

  it('inherits geometry from the formal node carrying the same elementId', () => {
    const target = materializeXirangArchitectureView(formal, variant, 'full')

    expect(target.nodes.find(item => item.id === 'alpha.id')).toMatchObject({ x: 360, y: 40, width: 320, height: 180 })
  })

  it('falls back to the grid without diagnostics when no formal node carries the identity', () => {
    const withoutMetadata = {
      ...formal,
      nodes: formal.nodes.map(({ metadata: _metadata, ...rest }) => rest),
    } as unknown as DiagramView

    const target = materializeXirangArchitectureView(withoutMetadata, variant, 'full')

    expect(target.nodes.map(item => [item.id, item.x, item.y]))
      .toEqual([['project.root', 40, 40], ['alpha.id', 400, 40], ['gamma.id', 760, 40]])
    expect(getArchitectureOverlayModel(variant).diagnostics).toEqual([])
  })

  it('preserves node and edge order when building adjacency', () => {
    const ordered: XirangRuntimeVariant = {
      ...variant,
      architecture: {
        elements: [
          ...variant.architecture!.elements,
          declaration('delta.id', 'Delta', 'Delta', 'project.root'),
          declaration('epsilon.id', 'Epsilon', 'Disconnected', 'project.root'),
        ],
        relationships: [
          { source: 'gamma.id', kind: 'first', target: 'alpha.id' },
          { source: 'alpha.id', kind: 'second', target: 'gamma.id' },
          { source: 'delta.id', kind: 'third', target: 'alpha.id' },
          { source: 'missing.id', kind: 'omitted', target: 'alpha.id' },
        ],
      },
    }
    const target = materializeXirangArchitectureView(formal, ordered, 'full')
    const root = target.nodes.find(item => item.id === 'project.root')!
    const alpha = target.nodes.find(item => item.id === 'alpha.id')!
    const epsilon = target.nodes.find(item => item.id === 'epsilon.id')!

    expect(root.children).toEqual(['alpha.id', 'gamma.id', 'delta.id', 'epsilon.id'])
    expect(alpha.inEdges).toEqual([target.edges[0]!.id, target.edges[2]!.id])
    expect(alpha.outEdges).toEqual([target.edges[1]!.id])
    expect(epsilon).toMatchObject({ inEdges: [], outEdges: [], children: [] })
    expect(target.edges).toHaveLength(3)
  })
})
