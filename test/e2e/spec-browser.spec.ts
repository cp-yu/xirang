import { expect, test, type Locator, type Page } from '@playwright/test'
import { promises as fs } from 'node:fs'
import path from 'node:path'

const fixtureRoot = path.resolve('test/fixtures/spec-browser')

async function openDetails(page: Page, id: string): Promise<Locator> {
  const node = page.locator(`.react-flow__node[data-id="projectRoot.${id}"]`)
  await expect(node).toBeVisible({ timeout: 20_000 })
  await node.click()
  const dialog = page.locator('dialog[open]')
  if (await dialog.count() === 0) await node.click()
  await expect(dialog).toBeVisible()
  return dialog
}

async function closeDetails(dialog: Locator): Promise<void> {
  await dialog.press('Escape')
  await expect(dialog).toHaveCount(0)
}

test.beforeEach(async ({ page }) => {
  await page.goto('/view/index/')
  await expect(page.locator('.react-flow__pane')).toBeVisible({ timeout: 20_000 })
})

test('browses absent, single, multiple, long, and hot-reloaded Specs', async ({ page }) => {
  let dialog = await openDetails(page, 'none')
  await expect(dialog.getByRole('tab', { name: 'Specs' })).toHaveCount(0)
  await closeDetails(dialog)

  dialog = await openDetails(page, 'single')
  await dialog.getByRole('tab', { name: 'Specs' }).click()
  const singlePanel = dialog.getByRole('tabpanel', { name: 'Specs' })
  await expect(singlePanel.getByText('.xirang/specs/single/spec.md')).toBeVisible()
  await expect(singlePanel.getByRole('heading', { name: 'Single Spec', exact: true })).toBeVisible()
  await expect(dialog.getByRole('combobox', { name: 'Select Spec' })).toHaveCount(0)
  await closeDetails(dialog)

  dialog = await openDetails(page, 'multi')
  await dialog.getByRole('tab', { name: 'Specs' }).click()
  const selector = dialog.getByRole('combobox', { name: 'Select Spec' })
  await expect(selector).toHaveValue('.xirang/specs/multiple-first/spec.md')
  await expect(dialog.getByRole('heading', { name: 'First Spec' })).toBeVisible()
  await selector.selectOption('.xirang/specs/multiple-second/spec.md')
  await expect(dialog.getByRole('heading', { name: 'Second Spec' })).toBeVisible()
  await closeDetails(dialog)

  dialog = await openDetails(page, 'long')
  await dialog.getByRole('tab', { name: 'Specs' }).click()
  const specsPanel = dialog.locator('[data-opsx-specs]')
  await expect(specsPanel.getByRole('heading', { name: 'Long Spec' })).toBeVisible()
  const specContent = specsPanel.locator('[data-opsx-spec-content]')
  expect(await specContent.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true)
  await closeDetails(dialog)

  const specFile = path.join(fixtureRoot, '.xirang/specs/single/spec.md')
  const original = await fs.readFile(specFile, 'utf8')
  try {
    dialog = await openDetails(page, 'single')
    await dialog.getByRole('tab', { name: 'Specs' }).click()
    await expect(dialog.getByRole('heading', { name: 'Single Spec', exact: true })).toBeVisible()
    await fs.writeFile(specFile, '# Single Spec Updated\n\nFresh content.\n')
    await expect(dialog.getByRole('heading', { name: 'Single Spec Updated' })).toBeVisible({ timeout: 10_000 })
    await expect(dialog.getByText('Fresh content.')).toBeVisible()
  } finally {
    await fs.writeFile(specFile, original)
  }
})

test('switches isolated active changes, renders semantic diff, and preserves graph layout on Spec HMR', async ({ page }) => {
  const manifest = await page.request.get('/__opsx/changes')
  expect(manifest.ok()).toBe(true)
  expect((await manifest.json()).variants.map((variant: { id: string }) => variant.id)).toEqual([
    'formal', 'change:architecture-change', 'change:browser-change',
  ])

  await page.getByRole('button', { name: 'Xirang Spec Browser' }).click()
  const variantSelector = page.getByRole('combobox', { name: 'Semantic model variant' })
  await expect(variantSelector).toHaveValue('formal')
  await variantSelector.selectOption('change:architecture-change')
  const overlay = page.locator('[data-opsx-architecture-overlay]')
  await expect(overlay).toBeVisible()
  await expect(overlay).toContainText('~1')
  await expect(page.locator('.react-flow__node').getByText('Single Spec Changed')).toBeVisible()
  const fullNodeCount = await page.locator('.react-flow__node[data-id]').count()
  await overlay.getByRole('button', { name: 'Diff only' }).click()
  await expect(overlay).toHaveAttribute('data-opsx-architecture-mode', 'diff')
  await expect(overlay).toHaveAttribute('data-opsx-changed-count', '1')
  await expect.poll(() => page.locator('.react-flow__node[data-id]').count()).toBeLessThan(fullNodeCount)

  const renderedHash = await overlay.getAttribute('data-opsx-rendered-view-hash')
  const architectureSpec = path.join(fixtureRoot, '.xirang/changes/architecture-change/specs/single/spec.md')
  const architectureSpecOriginal = await fs.readFile(architectureSpec, 'utf8')
  try {
    const architectureDialog = await openDetails(page, 'single')
    await architectureDialog.getByRole('tab', { name: 'Specs' }).click()
    await expect(architectureDialog.getByText(/architecture-change target content/).last()).toBeVisible()
    await fs.writeFile(architectureSpec, architectureSpecOriginal.replace('architecture-change target content', 'architecture Spec HMR content'))
    await expect(architectureDialog.getByText(/architecture Spec HMR content/).last()).toBeVisible({ timeout: 10_000 })
    await expect(overlay).toHaveAttribute('data-opsx-rendered-view-hash', renderedHash!)
    await closeDetails(architectureDialog)
  } finally {
    await fs.writeFile(architectureSpec, architectureSpecOriginal)
  }

  await overlay.getByRole('combobox', { name: 'Active change variant' }).selectOption('change:browser-change')
  await expect(overlay).toContainText('No semantic graph change')

  const nodeIdsBefore = await page.locator('.react-flow__node[data-id]').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-id')))
  await page.evaluate(() => { (globalThis as any).__opsxHmrMarker = 'preserved' })
  const changeSpec = path.join(fixtureRoot, '.xirang/changes/browser-change/specs/single/spec.md')
  const original = await fs.readFile(changeSpec, 'utf8')
  try {
    const dialog = await openDetails(page, 'single')
    await dialog.getByRole('tab', { name: 'Specs' }).click()
    const diff = dialog.locator('[data-opsx-structured-diff]')
    await expect(diff.getByText('MODIFIED', { exact: true }).first()).toBeVisible()
    await expect(diff.getByText('ADDED', { exact: true })).toBeVisible()
    await expect(diff.getByText('Change diff path')).toBeVisible()
    await expect(diff.locator('del').first()).toBeVisible()
    await expect(diff.locator('ins').first()).toBeVisible()

    await fs.writeFile(changeSpec, original.replace('refreshed target content', 'hot-refreshed target content'))
    await expect(diff.getByText(/hot-refreshed target content/).first()).toBeVisible({ timeout: 10_000 })
    expect(await page.evaluate(() => (globalThis as any).__opsxHmrMarker)).toBe('preserved')
    const nodeIdsAfter = await page.locator('.react-flow__node[data-id]').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-id')))
    expect(nodeIdsAfter).toEqual(nodeIdsBefore)
  } finally {
    await fs.writeFile(changeSpec, original)
  }
})

test('keeps tabs, selector, and content inside a mobile dialog', async ({ page }) => {
  const dialog = await openDetails(page, 'multi')
  await dialog.getByRole('tab', { name: 'Specs' }).click()
  const selector = dialog.getByRole('combobox', { name: 'Select Spec' })
  await expect(selector).toBeVisible()
  await expect(dialog.getByRole('heading', { name: 'First Spec' })).toBeVisible()

  const bounds = await dialog.evaluate(element => {
    const dialogRect = element.getBoundingClientRect()
    const tabs = element.querySelector('[role="tablist"]')?.getBoundingClientRect()
    const select = element.querySelector('select')?.getBoundingClientRect()
    return {
      dialog: { left: dialogRect.left, right: dialogRect.right, top: dialogRect.top, bottom: dialogRect.bottom },
      tabs: tabs && { left: tabs.left, right: tabs.right, bottom: tabs.bottom },
      select: select && { left: select.left, right: select.right, top: select.top },
      viewport: { width: window.innerWidth, height: window.innerHeight },
    }
  })

  expect(bounds.dialog.left).toBeGreaterThanOrEqual(0)
  expect(bounds.dialog.right).toBeLessThanOrEqual(bounds.viewport.width)
  expect(bounds.dialog.top).toBeGreaterThanOrEqual(0)
  expect(bounds.dialog.bottom).toBeLessThanOrEqual(bounds.viewport.height)
  expect(bounds.tabs).not.toBeNull()
  expect(bounds.select).not.toBeNull()
  expect(bounds.tabs!.left).toBeGreaterThanOrEqual(bounds.dialog.left)
  expect(bounds.tabs!.right).toBeLessThanOrEqual(bounds.dialog.right)
  expect(bounds.select!.left).toBeGreaterThanOrEqual(bounds.dialog.left)
  expect(bounds.select!.right).toBeLessThanOrEqual(bounds.dialog.right)
  expect(bounds.select!.top).toBeGreaterThanOrEqual(bounds.tabs!.bottom)
})
