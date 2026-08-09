import { expect, test, type Locator } from '@playwright/test'

/** Kind presentation is rendered on the node container via data-likec4-* attributes. */
async function expectNodePresentation(
  node: Locator,
  shape: string,
  color: string,
): Promise<void> {
  await expect(node.locator(`[data-likec4-shape="${shape}"]`).first()).toBeVisible()
  await expect(node.locator(`[data-likec4-color="${color}"]`).first()).toBeVisible()
}

test.beforeEach(async ({ page }) => {
  await page.goto('/view/model/')
  await expect(page.locator('.react-flow__pane')).toBeVisible({ timeout: 20_000 })
})

test('applies kind presentation in model view', async ({ page }) => {
  const perspective = page.locator('.react-flow__node[data-xirang-identity="perspective.browser"]')
  await expect(perspective).toBeVisible()
  await expectNodePresentation(perspective, 'document', 'indigo')
})

test('keeps operation color above kind color in diff', async ({ page }) => {
  await page.getByLabel('Change Selection').selectOption('browser-change')
  await expect(page).toHaveURL(/change=browser-change/)

  const added = page.locator('.react-flow__node[data-xirang-identity="capability.added-parent"]')
  await expect(added).toBeVisible({ timeout: 10_000 })
  await expect(added).toHaveAttribute('data-xirang-operation', 'ADDED')
  await expect(added.locator('[data-likec4-shape="component"]').first()).toBeVisible()
})
