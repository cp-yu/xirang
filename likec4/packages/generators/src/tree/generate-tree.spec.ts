import { describe, expect, test } from 'vitest'
import { buildViewTree, renderTreeMarkdown, renderTreeText, treeToJson } from './generate-tree'

const nodes = [
  { id: 'root', title: 'Root', kind: 'element', parent: null, children: ['a', 'b', 'item10', 'item2'] },
  { id: 'a', title: 'Alpha', kind: 'element', parent: 'root', children: [] },
  { id: 'b', title: 'Beta', kind: 'component', parent: 'root', children: ['gamma'] },
  { id: 'gamma', title: 'Gamma', kind: 'element', parent: 'b', children: [] },
  { id: 'item2', title: 'Item 2', kind: 'element', parent: 'root', children: [] },
  { id: 'item10', title: 'Item 10', kind: 'element', parent: 'root', children: [] },
] as const

const roots = buildViewTree({ nodes })

describe('buildViewTree', () => {
  test('keeps a single root with naturally sorted descendants', () => {
    expect(roots.map(node => node.id)).toEqual(['root'])
    expect(roots[0]!.children.map(node => node.id)).toEqual(['a', 'b', 'item2', 'item10'])
    expect(roots[0]!.children[1]!.children.map(node => node.id)).toEqual(['gamma'])
  })

  test('promotes nodes whose parent is missing to roots', () => {
    const forest = buildViewTree({
      nodes: [
        { id: 'orphan', title: 'Orphan', kind: 'element', parent: 'gone', children: [] },
      ],
    })
    expect(forest.map(node => node.id)).toEqual(['orphan'])
  })

  test('uses metadata.elementId as fqn when present', () => {
    const forest = buildViewTree({
      nodes: [
        { id: 'root', title: 'Root', kind: 'element', parent: null, children: ['child'], metadata: { elementId: 'project.root' } },
        { id: 'child', title: 'Child', kind: 'element', parent: 'root', children: [], metadata: { elementId: 'project.root.child' } },
      ],
    })
    expect(renderTreeText(forest, ['title', 'fqn'])).toBe([
      '└── Root [project.root]',
      '    └── Child [project.root.child]',
    ].join('\n'))
    expect(treeToJson(forest)[0]!.fqn).toBe('project.root')
  })
})

describe('renderTreeText', () => {
  test('renders a box-drawing tree with default title field', () => {
    expect(renderTreeText(roots)).toBe([
      '└── Root',
      '    ├── Alpha',
      '    ├── Beta',
      '    │   └── Gamma',
      '    ├── Item 2',
      '    └── Item 10',
    ].join('\n'))
  })

  test('renders selected fields in title, fqn, kind order', () => {
    expect(renderTreeText(roots, ['title', 'fqn', 'kind'])).toBe([
      '└── Root [root] (element)',
      '    ├── Alpha [a] (element)',
      '    ├── Beta [b] (component)',
      '    │   └── Gamma [gamma] (element)',
      '    ├── Item 2 [item2] (element)',
      '    └── Item 10 [item10] (element)',
    ].join('\n'))
  })

  test('renders only the selected field', () => {
    expect(renderTreeText(roots, ['fqn'])).toBe([
      '└── [root]',
      '    ├── [a]',
      '    ├── [b]',
      '    │   └── [gamma]',
      '    ├── [item2]',
      '    └── [item10]',
    ].join('\n'))
  })

  test('falls back to title when no field is selected', () => {
    expect(renderTreeText(roots, [])).toBe(renderTreeText(roots))
  })
})

describe('renderTreeMarkdown', () => {
  test('renders a nested list with two-space indentation', () => {
    expect(renderTreeMarkdown(roots, ['title', 'kind'])).toBe([
      '- Root (element)',
      '  - Alpha (element)',
      '  - Beta (component)',
      '    - Gamma (element)',
      '  - Item 2 (element)',
      '  - Item 10 (element)',
    ].join('\n'))
  })
})

describe('treeToJson', () => {
  test('always carries fqn, title, kind and children', () => {
    expect(treeToJson(roots)).toEqual([
      {
        fqn: 'root',
        title: 'Root',
        kind: 'element',
        children: [
          { fqn: 'a', title: 'Alpha', kind: 'element', children: [] },
          { fqn: 'b', title: 'Beta', kind: 'component', children: [
            { fqn: 'gamma', title: 'Gamma', kind: 'element', children: [] },
          ] },
          { fqn: 'item2', title: 'Item 2', kind: 'element', children: [] },
          { fqn: 'item10', title: 'Item 10', kind: 'element', children: [] },
        ],
      },
    ])
  })
})
