import type { ComputedElementView } from '@likec4/core'
import { Builder } from '@likec4/core/builder'

/**
 * Cluster with six leaves and a nested cluster, plus a node outside, with edges in, out and inside
 */
export function wrapView(): ComputedElementView {
  const builder = Builder
    .specification({ elements: { el: {} } })
    .model(({ el, rel }, _) =>
      _(
        el('c'),
        el('c.n1'),
        el('c.n2'),
        el('c.n3'),
        el('c.n4'),
        el('c.n5'),
        el('c.n6'),
        el('c.s'),
        el('c.s.x'),
        el('c.s.y'),
        el('c.s.z'),
        el('out'),
        rel('out', 'c.n1'),
        rel('c.n2', 'out'),
        rel('c.s.x', 'c.n1'),
      )
    )
    .views(({ view, $include, $rules }, _) =>
      _(
        view('wide', 'wide', $rules($include('out'), $include('c'), $include('c.*'), $include('c.s.*'))),
      )
    )
  return builder.toLikeC4Model().view('wide').$view as ComputedElementView
}
