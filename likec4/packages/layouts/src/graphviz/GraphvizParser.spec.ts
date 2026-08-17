import { describe, expect, it } from 'vitest'
import { computedIndexView } from './__fixtures__'
import { parseGraphvizJson } from './GraphvizParser'
import type { GraphvizJson } from './types-dot'

describe('parseGraphvizJson', () => {
  it('skips edges without Graphviz spline geometry', () => {
    const graphvizJson = {
      name: 'adhoc',
      directed: true,
      strict: false,
      _draw_: [],
      bb: '0,0,100,100',
      compound: 'true',
      fontname: 'Arial',
      fontsize: '12',
      label: '',
      nodesep: '0.25',
      outputorder: 'breadthfirst',
      rankdir: 'TB',
      ranksep: '0.5',
      splines: 'spline',
      xdotversion: '1.7',
      _subgraph_cnt: 0,
      objects: computedIndexView.nodes.map((node, index) => ({
        _gvid: index,
        likec4_id: node.id,
        _draw_: [],
        height: '1',
        pos: `${index * 10},${index * 10}`,
        shape: 'rect',
        width: '1',
      })),
      edges: computedIndexView.edges.map((edge, index) => index === 0
        ? {
            _gvid: index,
            tail: 0,
            head: 1,
            likec4_id: edge.id,
            label: '',
            lp: '',
            fontname: 'Arial',
            fontsize: '12',
          }
        : index === 1
        ? {
            _gvid: index,
            tail: 0,
            head: 1,
            likec4_id: edge.id,
            label: '',
            lp: '',
            fontname: 'Arial',
            fontsize: '12',
            _draw_: [{ op: 'p', points: [[0, 0], [10, 10]] }],
          }
        : {
            _gvid: index,
            tail: 0,
            head: 1,
            likec4_id: edge.id,
            label: '',
            lp: '',
            fontname: 'Arial',
            fontsize: '12',
            _draw_: [{ op: 'b', points: [[0, 0], [10, 10]] }],
          }),
    } as unknown as GraphvizJson

    const diagram = parseGraphvizJson(graphvizJson, computedIndexView)

    expect(diagram.edges).toHaveLength(computedIndexView.edges.length - 2)
    expect(diagram.edges.every(edge => edge.points.length >= 2)).toBe(true)
  })
})
