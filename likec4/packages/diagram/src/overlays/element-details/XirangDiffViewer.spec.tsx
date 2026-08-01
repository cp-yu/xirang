import { MantineProvider } from '@mantine/core'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { XirangDiffViewer } from './XirangDiffViewer'

describe('XirangDiffViewer', () => {
  it('renders a GitHub-style split diff from before and after text', () => {
    const html = renderToStaticMarkup(
      <MantineProvider>
        <XirangDiffViewer
          before={'unchanged\nold value'}
          after={'unchanged\nnew value'}
        />
      </MantineProvider>,
    )

    expect(html).toContain('data-xirang-split-diff')
    expect(html).toContain('Before')
    expect(html).toContain('After')
    expect(html).toContain('<colgroup>')
    expect(html).toContain('min-width:640px')
  })
})
