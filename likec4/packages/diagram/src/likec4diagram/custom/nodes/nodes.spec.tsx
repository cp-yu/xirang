import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { diffOutlineStyle, sectionCountLabel } from './diffMarks'
import { NodeDiffBadge } from './nodes'

describe('NodeDiffBadge', () => {
  it('渲染非零 section 计数徽章，三色区分、并排呈现并带可读文案', () => {
    const html = renderToStaticMarkup(<NodeDiffBadge counts={{ added: 2, modified: 1, removed: 1 }} />)

    expect(html).toContain('data-xirang-node-diff')
    expect(html).toContain('>+2<')
    expect(html).toContain('>~1<')
    expect(html).toContain('>−1<')
    expect(html).toContain('aria-label="2 sections added"')
    expect(html).toContain('title="1 section modified"')
    expect(html).toContain('aria-label="1 section removed"')
    expect(html).toContain('2f9e44')
    expect(html).toContain('ff9f0a')
    expect(html).toContain('e03131')
  })

  it('仅渲染非零项，全零且无 operation 或缺失时渲染 null', () => {
    expect(renderToStaticMarkup(<NodeDiffBadge counts={{ added: 0, modified: 0, removed: 0 }} />)).toBe('')
    expect(renderToStaticMarkup(<NodeDiffBadge counts={undefined} />)).toBe('')
    const single = renderToStaticMarkup(<NodeDiffBadge counts={{ added: 1, modified: 0, removed: 0 }} />)
    expect(single).toContain('>+1<')
    expect(single).not.toContain('~')
    expect(single).not.toContain('−')
  })

  it('有 operation 时渲染 operation glyph 主徽章，颜色与文案按 operation 区分', () => {
    const added = renderToStaticMarkup(<NodeDiffBadge operation="ADDED" counts={undefined} />)
    expect(added).toContain('data-xirang-node-operation-badge="ADDED"')
    expect(added).toContain('>+<')
    expect(added).toContain('aria-label="Element added"')
    expect(added).toContain('2f9e44')

    const modified = renderToStaticMarkup(<NodeDiffBadge operation="MODIFIED" counts={undefined} />)
    expect(modified).toContain('>~<')
    expect(modified).toContain('ff9f0a')

    const removed = renderToStaticMarkup(<NodeDiffBadge operation="REMOVED" counts={undefined} />)
    expect(removed).toContain('>−<')
    expect(removed).toContain('title="Element removed"')
    expect(removed).toContain('e03131')
  })

  it('operation glyph 与 section 计数同时出现，glyph 在前', () => {
    const html = renderToStaticMarkup(
      <NodeDiffBadge operation="MODIFIED" counts={{ added: 2, modified: 0, removed: 0 }} />,
    )
    expect(html.indexOf('data-xirang-node-operation-badge')).toBeLessThan(html.indexOf('data-xirang-node-diff'))
    expect(html).toContain('aria-label="2 sections added"')
  })

  it('总览缩放时按 scale 反向放大徽章，scale 为 1 时不变换', () => {
    expect(renderToStaticMarkup(<NodeDiffBadge operation="ADDED" counts={undefined} scale={3} />))
      .toContain('transform:scale(3)')
    expect(renderToStaticMarkup(<NodeDiffBadge operation="ADDED" counts={undefined} scale={1} />))
      .not.toContain('transform')
  })
})

describe('diff mark helpers', () => {
  it('section 文案区分单复数', () => {
    expect(sectionCountLabel(1, 'added')).toBe('1 section added')
    expect(sectionCountLabel(3, 'removed')).toBe('3 sections removed')
  })

  it('描边颜色、样式随 operation 内联给出（不依赖可被覆盖的生成类），宽度与偏移随 scale 放大', () => {
    expect(diffOutlineStyle('MODIFIED', 1)).toEqual({
      outlineColor: '#ff9f0a',
      outlineStyle: 'solid',
      outlineWidth: '5px',
      outlineOffset: '2px',
    })
    expect(diffOutlineStyle('ADDED', 4)).toEqual({
      outlineColor: '#2f9e44',
      outlineStyle: 'dotted',
      outlineWidth: '12px',
      outlineOffset: '8px',
    })
    expect(diffOutlineStyle('REMOVED', 1)).toMatchObject({ outlineColor: '#e03131', outlineStyle: 'dashed' })
  })
})
