import { describe, expect, it } from 'vitest'
import { markdownToContractHtml, markdownToHtml } from './to-html'

describe('Contract Markdown navigation', () => {
  it('marks rendered links in order, excluding code, images and generated footnote links', () => {
    const html = markdownToContractHtml('[inline](case.md) [reference][r] ` [code](x.md) ` ![image](x.png) [^note]\n\n[r]: next.md\n\n[^note]: note\n\n[after](after.md)')
    expect(html).toContain('href="case.md" data-xirang-link="0"')
    expect(html).toContain('href="next.md" data-xirang-link="1"')
    expect(html).toContain('href="after.md" data-xirang-link="2"')
    expect(html.match(/data-xirang-link=/g)).toHaveLength(3)
  })

  it('keeps Markdown occurrence indices when used footnotes render after later body links', () => {
    const html = markdownToContractHtml('[^unused]: [unused](missing.md)\n\n[^used]: [note](note.md)\n\n[body](body.md) [^used]')
    expect(html).toContain('href="note.md" data-xirang-link="0"')
    expect(html).toContain('href="body.md" data-xirang-link="1"')
    expect(html).not.toContain('href="missing.md"')
  })

  it('creates unique Chinese and duplicate heading targets while retaining sanitization', () => {
    const html = markdownToContractHtml('# 时间依据\n\n## Same *title*!\n\n## Same title!\n\n## Same title-1\n\n<script>bad()</script>\n\n[bad](javascript:alert)')
    for (const slug of ['时间依据', 'same-title', 'same-title-1', 'same-title-1-1']) {
      expect(html).toContain(`data-xirang-heading="${slug}"`)
    }
    expect(html).not.toContain('<script')
    expect(html).not.toContain('href="javascript:')
    expect(markdownToHtml('# Plain')).toBe('<h1>Plain</h1>')
  })
})
