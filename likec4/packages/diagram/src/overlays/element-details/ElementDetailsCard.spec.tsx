import { RichText } from '@likec4/core'
import { MantineProvider } from '@mantine/core'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { XirangViewSource } from '../../xirang/ContractLoaderContext'
import { ElementDefinitionProperties } from './ElementDetailsCard'

describe('ElementDefinitionProperties', () => {
  it('renders the selected Change excerpt and complete multi-paragraph Definition', () => {
    const definition = '完整的第一段 Definition，描述概念身份。\n\n第二段保留范围边界与 Unicode 🚀。'
    const excerpt = '完整的第一段 Definition，描述概念身份。'
    const selected: XirangViewSource = {
      id: 'change:test',
      label: 'test',
      source: 'change-derived-view',
      change: 'test',
      valid: true,
      diagnostics: [],
      architecture: {
        elements: [{
          declaration: {
            identity: 'alpha.id',
            kind: 'capability',
            parent: 'project.root',
            title: 'Alpha',
            definition,
            summary: excerpt,
            description: definition,
          },
        }],
        relationships: [],
      },
    }

    const html = renderToStaticMarkup(
      <MantineProvider>
        <ElementDefinitionProperties
          selected={selected}
          stableElementId="alpha.id"
          modelSummary={RichText.from('stale model summary')}
          modelDescription={RichText.from('stale model description')}
        />
      </MantineProvider>,
    )

    expect(html).toContain(excerpt)
    expect(html).toContain(definition)
    expect(html).not.toContain('stale model')
  })
})
