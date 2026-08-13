import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { NodeDiffBadge } from './nodes'

describe('NodeDiffBadge', () => {
  it('渲染非零计数徽章，三色区分并并排呈现', () => {
    const html = renderToStaticMarkup(<NodeDiffBadge counts={{ added: 2, modified: 1, removed: 1 }} />)

    expect(html).toContain('data-xirang-node-diff')
    expect(html).toContain('>+2<')
    expect(html).toContain('>~1<')
    expect(html).toContain('>−1<')
    expect(html).toContain('aria-label="2 Added requirements"')
    expect(html).toContain('aria-label="1 Modified requirements"')
    expect(html).toContain('aria-label="1 Removed requirements"')
    expect(html).toContain('2f9e44')
    expect(html).toContain('ff9f0a')
    expect(html).toContain('e03131')
  })

  it('仅渲染非零项，全零或缺失时渲染 null', () => {
    expect(renderToStaticMarkup(<NodeDiffBadge counts={{ added: 0, modified: 0, removed: 0 }} />)).toBe('')
    expect(renderToStaticMarkup(<NodeDiffBadge counts={undefined} />)).toBe('')
    const single = renderToStaticMarkup(<NodeDiffBadge counts={{ added: 1, modified: 0, removed: 0 }} />)
    expect(single).toContain('>+1<')
    expect(single).not.toContain('~')
    expect(single).not.toContain('−')
  })
})
