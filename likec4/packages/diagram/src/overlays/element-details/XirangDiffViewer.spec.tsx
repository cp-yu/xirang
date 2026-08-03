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

  it('renders candidate requirement and scenarios as one diff', () => {
    const beforeContract = `## Requirements

Old requirement text.

### Scenario: Basic usage

Old scenario description.`

    const afterContract = `## Requirements

New requirement text.

### Scenario: Basic usage

New scenario description.

### Scenario: Advanced usage

Another scenario.`

    const html = renderToStaticMarkup(
      <MantineProvider>
        <XirangDiffViewer
          before={beforeContract}
          after={afterContract}
        />
      </MantineProvider>,
    )

    // XirangDiffViewer wraps ReactDiffViewer which renders a split diff structure
    expect(html).toContain('data-xirang-split-diff')
    expect(html).toContain('Before')
    expect(html).toContain('After')
    // The component accepts both before and after as single strings,
    // which is the desired behavior for merged Contract diffs
    expect(html).toContain('<tbody>')
  })
})
