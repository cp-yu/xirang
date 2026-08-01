import { RichText } from '@likec4/core'
import { MantineProvider } from '@mantine/core'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { XirangViewSource } from '../../xirang/ContractLoaderContext'
import { ElementDefinitionProperties, visibleElementDetailTabs } from './ElementDetailsCard'

describe('visibleElementDetailTabs', () => {
  it('keeps ADDED elements on Xirang-backed tabs only', () => {
    expect(visibleElementDetailTabs({
      isAddedElement: true,
      hasContract: true,
      hasDiff: true,
    })).toEqual(['Properties', 'Contracts', 'Diff'])
  })

  it('retains the standard LikeC4 tabs for model-backed elements', () => {
    expect(visibleElementDetailTabs({
      isAddedElement: false,
      hasContract: false,
      hasDiff: false,
    })).toEqual(['Properties', 'Relationships', 'Views', 'Structure', 'Deployments'])
  })
})

describe('ElementDefinitionProperties', () => {
  it('renders declaration fields from the selected Change architecture', () => {
    const definition = '完整的第一段 Definition，描述概念身份。\n\n第二段保留范围边界与 Unicode 🚀。'
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
            summary: 'excerpt',
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
        />
      </MantineProvider>,
    )

    expect(html).toContain('kind')
    expect(html).toContain('capability')
    expect(html).toContain('parent')
    expect(html).toContain('project.root')
    expect(html).toContain('title')
    expect(html).toContain('Alpha')
    expect(html).toContain('definition')
    expect(html).toContain(definition)
    expect(html).not.toContain('summary')
    expect(html).not.toContain('description')
  })

  it('falls back to model properties when no architecture is available', () => {
    const selected: XirangViewSource = {
      id: 'model',
      label: 'Model View',
      source: 'semantic-model',
      valid: true,
      diagnostics: [],
    } as XirangViewSource

    const html = renderToStaticMarkup(
      <MantineProvider>
        <ElementDefinitionProperties
          selected={selected}
          stableElementId="unknown.id"
        />
      </MantineProvider>,
    )

    expect(html).toContain('kind')
    expect(html).toContain('definition')
    expect(html).not.toContain('summary')
  })
})
