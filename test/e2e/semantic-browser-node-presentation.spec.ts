import { expect, test, type Locator, type Page } from '@playwright/test'

async function selectViewSource(page: Page, sourceId: string): Promise<void> {
  await page.getByRole('button', { name: 'Untitled View', exact: true }).click()
  const dropdown = page.locator('[data-likec4-breadcrumbs-dropdown]')
  await dropdown.getByLabel('View source').selectOption(sourceId)
}

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
  const perspective = page.locator('.react-flow__node[data-id="perspective.browser"]')
  await expect(perspective).toBeVisible()
  await expectNodePresentation(perspective, 'document', 'indigo')

  // A Kind without nodePresentation keeps the renderer default.
  const plain = page.locator('.react-flow__node[data-id="project.root"]')
  await expect(plain).toBeVisible()
  await expect(plain.locator('[data-likec4-shape="document"]')).toHaveCount(0)
})

test('keeps operation color above kind color in diff', async ({ page }) => {
  await selectViewSource(page, 'change:browser-change')
  await expect(page).toHaveURL(/source=change%3Abrowser-change/)
  await page.getByRole('button', { name: 'Diff only' }).click()
  await expect(page).toHaveURL(/mode=diff/)

  // ADDED capability leaf keeps the Kind shape/border but the operation color wins.
  const added = page.locator('.react-flow__node[data-id="capability.added-child"]')
  await expect(added).toBeVisible({ timeout: 10_000 })
  await expectNodePresentation(added, 'component', 'green')

  // MODIFIED keeps shape but shows the operation color instead of the Kind color.
  const modified = page.locator('.react-flow__node[data-id="capability.leaf"]')
  await expect(modified).toBeVisible({ timeout: 10_000 })
  await expectNodePresentation(modified, 'component', 'amber')
})
