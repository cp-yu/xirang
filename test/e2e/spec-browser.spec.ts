import { expect, test, type Locator, type Page } from '@playwright/test'
import { promises as fs } from 'node:fs'
import path from 'node:path'

const fixtureRoot = path.resolve('test/fixtures/spec-browser')

async function openDetails(page: Page, id: string): Promise<Locator> {
  const node = page.locator(`.react-flow__node[data-id="projectRoot.${id}"]`)
  await expect(node).toBeVisible({ timeout: 20_000 })
  await node.click()
  await node.click()
  const dialog = page.locator('dialog[open]')
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
  await expect(singlePanel.getByText('.opsx/specs/single/spec.md')).toBeVisible()
  await expect(singlePanel.getByRole('heading', { name: 'Single Spec' })).toBeVisible()
  await expect(dialog.getByRole('combobox', { name: 'Select Spec' })).toHaveCount(0)
  await closeDetails(dialog)

  dialog = await openDetails(page, 'multi')
  await dialog.getByRole('tab', { name: 'Specs' }).click()
  const selector = dialog.getByRole('combobox', { name: 'Select Spec' })
  await expect(selector).toHaveValue('.opsx/specs/multiple-first/spec.md')
  await expect(dialog.getByRole('heading', { name: 'First Spec' })).toBeVisible()
  await selector.selectOption('.opsx/specs/multiple-second/spec.md')
  await expect(dialog.getByRole('heading', { name: 'Second Spec' })).toBeVisible()
  await closeDetails(dialog)

  dialog = await openDetails(page, 'long')
  await dialog.getByRole('tab', { name: 'Specs' }).click()
  const specsPanel = dialog.locator('[data-opsx-specs]')
  await expect(specsPanel.getByRole('heading', { name: 'Long Spec' })).toBeVisible()
  const specContent = specsPanel.locator('[data-opsx-spec-content]')
  expect(await specContent.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true)
  await closeDetails(dialog)

  const specFile = path.join(fixtureRoot, '.opsx/specs/single/spec.md')
  const original = await fs.readFile(specFile, 'utf8')
  try {
    dialog = await openDetails(page, 'single')
    await dialog.getByRole('tab', { name: 'Specs' }).click()
    await expect(dialog.getByRole('heading', { name: 'Single Spec' })).toBeVisible()
    await fs.writeFile(specFile, '# Single Spec Updated\n\nFresh content.\n')
    await expect(dialog.getByRole('heading', { name: 'Single Spec Updated' })).toBeVisible({ timeout: 10_000 })
    await expect(dialog.getByText('Fresh content.')).toBeVisible()
  } finally {
    await fs.writeFile(specFile, original)
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
