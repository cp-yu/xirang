import { MantineProvider } from '@mantine/core'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { XirangDiffViewer, XirangValueDiff } from './XirangDiffViewer'

const render = (node: React.ReactNode) => renderToStaticMarkup(<MantineProvider>{node}</MantineProvider>)

describe('XirangDiffViewer', () => {
  it('presents ADDED content in a single column without Before/After headers', () => {
    const html = render(<XirangDiffViewer before="" after={'第一行\n第二行'} />)

    expect(html).toContain('data-xirang-text-diff="added"')
    expect(html).toContain('第一行')
    expect(html).toContain('第二行')
    expect(html).not.toContain('Before')
    expect(html).not.toContain('Inline')
  })

  it('presents REMOVED content in a single struck-through column', () => {
    const html = render(<XirangDiffViewer before="旧内容" after="" />)

    expect(html).toContain('data-xirang-text-diff="removed"')
    expect(html).toContain('旧内容')
    expect(html).toContain('line-through')
  })

  it('presents MODIFIED content as an inline diff highlighting only the changed fragment, with a Split switch', () => {
    const html = render(<XirangDiffViewer before="The quick brown fox" after="The quick red fox" />)

    expect(html).toContain('data-xirang-text-diff="modified"')
    expect(html).toContain('data-xirang-diff-mode="inline"')
    expect(html).toContain('Split')
    expect(html).toMatch(/line-through[^>]*>brown</)
    expect(html).toMatch(/>red</)
    expect(html).not.toMatch(/>The quick</)
  })

  it('presents a Section with its Acceptance Cases as one diff', () => {
    const before = 'Old requirement.\n\n#### Acceptance Case: Basic\n\nOld scenario.'
    const after = 'New requirement.\n\n#### Acceptance Case: Basic\n\nOld scenario.\n\n#### Acceptance Case: Advanced\n\nAnother scenario.'
    const html = render(<XirangDiffViewer before={before} after={after} />)

    expect(html.match(/data-xirang-text-diff=/g)).toHaveLength(1)
    expect(html).toContain('Advanced')
    expect(html).toContain('Another scenario.')
  })

  it('presents Acceptance Case title lines as small headings without markdown hashes and keeps indented pseudo-code lines', () => {
    const body = 'Rule.\n\n#### Acceptance Case: Pseudo\n\nif (a > 0)\n    result = a + b'
    const html = render(<XirangDiffViewer before="" after={body} />)

    expect(html).toContain('data-xirang-acceptance-case-title')
    expect(html).toContain('>Pseudo<')
    expect(html).not.toContain('####')
    expect(html).toContain('    result = a + b')
    expect(html).toContain('monospace')
  })
})

describe('XirangValueDiff', () => {
  it('renders a changed short value as before → after on one line', () => {
    const html = render(<XirangValueDiff before="capability" after="service" />)

    expect(html).toContain('data-xirang-value-diff="modified"')
    expect(html).toMatch(/capability.*→.*service/)
  })
})
