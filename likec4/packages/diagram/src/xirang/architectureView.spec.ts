import type { DiagramView } from '@likec4/core/types'
import { describe, expect, it } from 'vitest'
import { isXirangContractDiagnostic, type XirangViewSource } from './ContractLoaderContext'
import { getArchitectureOverlayModel } from '../likec4diagram/DiagramUI'
import { materializeXirangArchitectureView } from './architectureView'

/** Model View nodes use derived local names; semantic identity travels in `metadata.elementId`. */
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

const modelView = {
  _type: 'element',
  _stage: 'layouted',
  id: 'index',
  title: 'Index',
  hash: 'modelView',
  bounds: { x: 0, y: 0, width: 1200, height: 400 },
  nodes: [
    node('projectRoot', 'project.root', 'Project', 0),
    node('projectRoot.alpha', 'alpha.id', 'Alpha', 360),
    node('projectRoot.beta', 'beta.id', 'Beta', 720),
  ],
  edges: [],
} as unknown as DiagramView

const declaration = (identity: string, title: string, definition: string, parent: string | null, kind = 'capability') => ({
  declaration: { identity, kind, parent, title, definition, summary: definition, description: definition },
})

const viewSource: XirangViewSource = {
  id: 'change:test',
  label: 'test',
  source: 'change-derived-view',
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

function rgb(color: string): [number, number, number] {
  return [1, 3, 5].map(offset => Number.parseInt(color.slice(offset, offset + 2), 16)) as [number, number, number]
}

function contrastWithWhite(color: string): number {
  const channels = rgb(color).map(value => value / 255)
    .map(value => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
  const luminance = 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!
  return 1.05 / (luminance + 0.05)
}

function colorDistance(left: string, right: string): number {
  const a = rgb(left)
  const b = rgb(right)
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
}

describe('materializeXirangArchitectureView', () => {

  it('styles sibling Perspectives distinctly without affecting ordinary descendants', () => {
    const source: XirangViewSource = {
      ...viewSource,
      architecture: {
        elements: [
          declaration('project.root', 'Project', 'Project', null, 'project'),
          ...Array.from({ length: 9 }, (_, index) =>
            declaration(`perspective.${index}`, `Perspective ${index}`, `Perspective ${index}`, 'project.root', 'perspective')),
          declaration('capability.a', 'Capability', 'Capability', 'perspective.0'),
        ],
        relationships: [],
      },
    }

    const root = materializeXirangArchitectureView(modelView, source, 'full')
    const perspectiveNodes = root.nodes.filter(node => node.id.startsWith('perspective.'))
    const colors = perspectiveNodes.map(node => node.color as string)
    expect(new Set(colors).size).toBe(9)
    expect(colors.every(color => contrastWithWhite(color) >= 4.5)).toBe(true)
    expect(Math.min(...colors.flatMap((color, index) => colors.slice(index + 1).map(other => colorDistance(color, other))))).toBeGreaterThanOrEqual(35)
    expect(perspectiveNodes.every(node => node.shape === 'component')).toBe(true)

    const child = materializeXirangArchitectureView(modelView, source, 'full', 'perspective.0')
      .nodes.find(node => node.id === 'capability.a')!
    expect(child).toMatchObject({ shape: 'rectangle', color: 'primary' })
  })

  it('projects focus and direct children without changing the View identity', () => {
    const focused: XirangViewSource = {
      ...viewSource,
      architecture: {
        elements: [
          declaration('project.root', 'Project', 'Project', null),
          declaration('alpha.id', 'Alpha', 'Alpha', 'project.root'),
          declaration('gamma.id', 'Gamma', 'Gamma', 'project.root'),
          declaration('alpha.deep', 'Alpha Deep', 'Alpha Deep', 'alpha.id'),
          declaration('gamma.deep', 'Gamma Deep', 'Gamma Deep', 'gamma.id'),
        ],
        relationships: [],
      },
    }

    const target = materializeXirangArchitectureView(modelView, focused, 'full', 'alpha.id')

    expect(target.id).toBe(modelView.id)
    expect(target.nodes.map(node => node.id)).toEqual(['alpha.id', 'alpha.deep'])
  })

  it('aggregates descendant relationships and retains their original triples', () => {
    const focused: XirangViewSource = {
      ...viewSource,
      architecture: {
        elements: [
          declaration('project.root', 'Project', 'Project', null),
          declaration('alpha.id', 'Alpha', 'Alpha', 'project.root'),
          declaration('gamma.id', 'Gamma', 'Gamma', 'project.root'),
          declaration('alpha.deep', 'Alpha Deep', 'Alpha Deep', 'alpha.id'),
          declaration('gamma.deep', 'Gamma Deep', 'Gamma Deep', 'gamma.id'),
        ],
        relationships: [
          { source: 'alpha.deep', kind: 'invokes', target: 'gamma.deep' },
          { source: 'alpha.deep', kind: 'covers', target: 'gamma.deep' },
          { source: 'alpha.deep', kind: 'invokes', target: 'alpha.id' },
          { source: 'missing', kind: 'external', target: 'gamma.deep' },
        ],
      },
    }

    const modelWithRelations = {
      ...modelView,
      nodes: [
        ...modelView.nodes,
        node('projectRoot.alpha.deep', 'alpha.deep', 'Alpha Deep', 400),
        node('projectRoot.gamma.deep', 'gamma.deep', 'Gamma Deep', 760),
      ],
      edges: [
        { source: 'projectRoot.alpha.deep', target: 'projectRoot.gamma.deep', label: 'covers', relations: ['rel-covers'] },
        { source: 'projectRoot.alpha.deep', target: 'projectRoot.gamma.deep', label: 'invokes', relations: ['rel-invokes'] },
      ],
    } as unknown as DiagramView
    const target = materializeXirangArchitectureView(modelWithRelations, focused, 'full', 'project.root')

    expect(target.edges).toHaveLength(1)
    expect(target.edges[0]?.points).toHaveLength(4)
    expect(target.edges[0]?.controlPoints).toHaveLength(1)
    expect(target.edges[0]).toMatchObject({
      source: 'alpha.id',
      target: 'gamma.id',
      label: 'covers, invokes',
      relations: ['rel-covers', 'rel-invokes'],
    })
  })

  it('preserves target-only Relationship triples when no current LikeC4 relation ID exists', () => {
    const target = materializeXirangArchitectureView(modelView, viewSource, 'full', 'project.root')
    const edge = target.edges[0] as typeof target.edges[number] & { xirangRelations?: string[] }

    expect(edge.relations).toEqual([])
    expect(edge.xirangRelations).toEqual(['alpha.id|invokes|gamma.id'])
  })

  it('projects contract-only Changes from the target Project Root', () => {
    const source: XirangViewSource = {
      ...viewSource,
      diff: {
        summary: { total: 1, ADDED: 0, MODIFIED: 1, REMOVED: 0 },
        entries: [{ kind: 'requirement', identity: 'alpha.id#Contract', operation: 'MODIFIED' }],
      },
    }

    const target = materializeXirangArchitectureView(modelView, source, 'full')
    expect(target.nodes.map(node => node.id)).toEqual(['project.root', 'alpha.id', 'gamma.id'])
    expect(target.hash).toContain(':xirang:')
  })

  it('falls back along the previous ancestor path when focus disappears', () => {
    const target = materializeXirangArchitectureView(
      modelView,
      viewSource,
      'full',
      'removed.deep',
      ['removed.deep', 'alpha.id', 'project.root'],
    )

    expect(target.nodes.map(node => node.id)).toEqual(['alpha.id'])
  })

  it('separates Contract diagnostics from structural ones by identity, not by storage path', () => {
    expect(isXirangContractDiagnostic({ identity: 'auth.id#Login' })).toBe(true)
    expect(isXirangContractDiagnostic({ identity: 'auth.id#Login#MFA' })).toBe(true)
    expect(isXirangContractDiagnostic({ identity: 'auth.id' })).toBe(false)
    expect(isXirangContractDiagnostic({})).toBe(false)
    const withContractError: XirangViewSource = {
      ...viewSource,
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
    const overlay = getArchitectureOverlayModel(viewSource)

    expect(overlay.counts).toEqual({ ADDED: 2, MODIFIED: 1, REMOVED: 1 })
    expect(overlay.changed).toEqual(['alpha.id', 'beta.id', 'gamma.id'])
  })

  it('renders the selected complete target graph keyed by identity', () => {
    const target = materializeXirangArchitectureView(modelView, viewSource, 'full')

    expect(target.nodes.map(item => item.id)).toEqual(['project.root', 'alpha.id', 'gamma.id'])
    expect(target.nodes.find(item => item.id === 'alpha.id')).toMatchObject({ title: 'Alpha target', color: 'amber' })
    expect(target.nodes.find(item => item.id === 'gamma.id')).toMatchObject({ color: 'green' })
    expect(target.edges).toEqual([expect.objectContaining({ source: 'alpha.id', target: 'gamma.id', color: 'green' })])
  })

  it('uses the shared excerpt for nodes and preserves the full Definition for details', () => {
    const fullDefinition = `First   paragraph ${'😀'.repeat(121)}.\n\nSecond paragraph remains complete.`
    const projected: XirangViewSource = {
      ...viewSource,
      architecture: {
        ...viewSource.architecture!,
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

    const target = materializeXirangArchitectureView(modelView, projected, 'full')
    expect(target.nodes.find(item => item.id === 'alpha.id')).toMatchObject({
      description: { txt: `First paragraph ${'😀'.repeat(104)}...` },
      metadata: { elementId: 'alpha.id', definition: fullDefinition },
    })
  })

  it('keeps only changed graph, endpoints, and ancestor context in Diff only mode', () => {
    const target = materializeXirangArchitectureView(modelView, viewSource, 'diff')

    expect(target.nodes.map(item => item.id)).toEqual(['project.root', 'alpha.id', 'gamma.id', 'beta.id'])
    expect(target.nodes.find(item => item.id === 'beta.id')).toMatchObject({ color: 'red', parent: 'project.root' })
    expect(target.edges).toHaveLength(1)
  })

  it('stays stable when every derived local name changes but identities do not', () => {
    const regenerated = {
      ...modelView,
      nodes: modelView.nodes.map((item, index) => ({
        ...item,
        id: `renamed_${index}`,
        modelRef: `renamed_${index}`,
        parent: item.parent === null ? null : 'renamed_0',
      })),
    } as unknown as DiagramView

    for (const mode of ['full', 'diff'] as const) {
      expect(summarize(materializeXirangArchitectureView(regenerated, viewSource, mode)))
        .toEqual(summarize(materializeXirangArchitectureView(modelView, viewSource, mode)))
    }
  })

  it('uses deterministic projection geometry independent from complete-model coordinates', () => {
    const target = materializeXirangArchitectureView(modelView, viewSource, 'full')

    expect(target.nodes.find(item => item.id === 'alpha.id')).toMatchObject({ x: 400, y: 40, width: 320, height: 180 })
  })

  it('falls back to the grid without diagnostics when no modelView node carries the identity', () => {
    const withoutMetadata = {
      ...modelView,
      nodes: modelView.nodes.map(({ metadata: _metadata, ...rest }) => rest),
    } as unknown as DiagramView

    const target = materializeXirangArchitectureView(withoutMetadata, viewSource, 'full')

    expect(target.nodes.map(item => [item.id, item.x, item.y]))
      .toEqual([['project.root', 40, 40], ['alpha.id', 400, 40], ['gamma.id', 760, 40]])
    expect(getArchitectureOverlayModel(viewSource).diagnostics).toEqual([])
  })

  it('preserves node and edge order when building adjacency', () => {
    const ordered: XirangViewSource = {
      ...viewSource,
      architecture: {
        elements: [
          ...viewSource.architecture!.elements,
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
    const target = materializeXirangArchitectureView(modelView, ordered, 'full')
    const root = target.nodes.find(item => item.id === 'project.root')!
    const alpha = target.nodes.find(item => item.id === 'alpha.id')!
    const epsilon = target.nodes.find(item => item.id === 'epsilon.id')!

    expect(root.children).toEqual(['alpha.id', 'gamma.id', 'delta.id', 'epsilon.id'])
    expect(alpha.inEdges).toEqual([
      'xirang:delta.id|third|alpha.id',
      'xirang:gamma.id|first|alpha.id',
    ])
    expect(alpha.outEdges).toEqual(['xirang:alpha.id|second|gamma.id'])
    expect(epsilon).toMatchObject({ inEdges: [], outEdges: [], children: [] })
    expect(target.edges).toHaveLength(3)
  })
})
