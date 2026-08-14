import { RichText } from '@likec4/core'
import { MantineProvider } from '@mantine/core'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { XirangViewSource } from '../../xirang/ContractLoaderContext'
import { ElementDefinitionProperties, resolveElementDetails, visibleElementDetailTabs } from './ElementDetailsCard'

describe('visibleElementDetailTabs', () => {
  it('keeps projection-only elements on Xirang-backed tabs only', () => {
    expect(visibleElementDetailTabs({
      isProjectionElement: true,
      hasContract: true,
      hasDiff: true,
    })).toEqual(['Properties', 'Contracts', 'Diff'])
  })

  it('retains the standard LikeC4 tabs for model-backed elements', () => {
    expect(visibleElementDetailTabs({
      isProjectionElement: false,
      hasContract: false,
      hasDiff: false,
    })).toEqual(['Properties', 'Relationships', 'Views', 'Structure', 'Deployments'])
  })
})

describe('resolveElementDetails', () => {
  const elements = [{
    declaration: {
      identity: 'alpha.id',
      kind: 'capability',
      parent: 'project.root',
      title: 'Alpha',
      definition: '',
      summary: '',
      description: '',
    },
  }]

  it('解析投影节点 metadata 中的语义 identity 而非 LikeC4 FQN', () => {
    const result = resolveElementDetails({
      fqn: 'root.project.alpha_id',
      nodeMetadata: { elementId: 'alpha.id' },
      elementMetadata: null,
      elementId: null,
      hasBaseModelElement: false,
      architectureElements: elements,
    })
    expect(result.stableElementId).toBe('alpha.id')
    expect(result.declaration?.title).toBe('Alpha')
    expect(result.isProjectionElement).toBe(true)
  })

  it('详情 actor 传入的 identity 优先级最高', () => {
    const result = resolveElementDetails({
      fqn: 'root.project.alpha_id',
      identity: 'alpha.id',
      nodeMetadata: { elementId: 'stale.id' },
      elementMetadata: null,
      elementId: null,
      hasBaseModelElement: false,
      architectureElements: elements,
    })
    expect(result.stableElementId).toBe('alpha.id')
    expect(result.isProjectionElement).toBe(true)
  })

  it('xirangIdentity 优先于 elementId', () => {
    const result = resolveElementDetails({
      fqn: 'root.project.alpha_id',
      nodeMetadata: { xirangIdentity: 'alpha.id', elementId: 'other.id' },
      elementMetadata: null,
      elementId: null,
      hasBaseModelElement: false,
      architectureElements: elements,
    })
    expect(result.stableElementId).toBe('alpha.id')
  })

  it('无节点 metadata 时回退 element metadata', () => {
    const result = resolveElementDetails({
      fqn: 'root.project.alpha_id',
      nodeMetadata: null,
      elementMetadata: { elementId: 'alpha.id' },
      elementId: 'model.id',
      hasBaseModelElement: true,
      architectureElements: elements,
    })
    expect(result.stableElementId).toBe('alpha.id')
    expect(result.isProjectionElement).toBe(false)
  })

  it('无任何 metadata 时回退 elementId，再回退 fqn', () => {
    const withElementId = resolveElementDetails({
      fqn: 'root.project.alpha_id',
      nodeMetadata: null,
      elementMetadata: null,
      elementId: 'model.id',
      hasBaseModelElement: true,
      architectureElements: elements,
    })
    expect(withElementId.stableElementId).toBe('model.id')
    const withFqn = resolveElementDetails({
      fqn: 'root.project.alpha_id',
      nodeMetadata: null,
      elementMetadata: null,
      elementId: null,
      hasBaseModelElement: false,
      architectureElements: elements,
    })
    expect(withFqn.stableElementId).toBe('root.project.alpha_id')
  })

  it('元素在 base model 中时不取 architecture declaration', () => {
    const result = resolveElementDetails({
      fqn: 'root.project.alpha_id',
      nodeMetadata: { elementId: 'alpha.id' },
      elementMetadata: null,
      elementId: 'model.id',
      hasBaseModelElement: true,
      architectureElements: elements,
    })
    expect(result.declaration).toBeNull()
    expect(result.isProjectionElement).toBe(false)
  })

  it('不在 base model 且无 declaration 时不是投影元素', () => {
    const result = resolveElementDetails({
      fqn: 'root.project.alpha_id',
      nodeMetadata: { elementId: 'missing.id' },
      elementMetadata: null,
      elementId: null,
      hasBaseModelElement: false,
      architectureElements: elements,
    })
    expect(result.declaration).toBeNull()
    expect(result.isProjectionElement).toBe(false)
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
