import { expect, test, type Page } from '@playwright/test'

async function expectVisibleNodesDoNotOverlap(page: Page): Promise<void> {
  const boxes = await page.locator('.react-flow__node:visible').evaluateAll(nodes => nodes.map(node => {
    const rect = node.getBoundingClientRect()
    return { id: node.getAttribute('data-id'), left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom }
  }))
  for (let left = 0; left < boxes.length; left += 1) {
    for (let right = left + 1; right < boxes.length; right += 1) {
      const a = boxes[left]!
      const b = boxes[right]!
      const contains = (outer: typeof a, inner: typeof a) =>
        outer.left <= inner.left && outer.right >= inner.right && outer.top <= inner.top && outer.bottom >= inner.bottom
      expect(contains(a, b) || contains(b, a)
        || a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top,
        `${a.id} overlaps ${b.id}`).toBe(true)
    }
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto('/view/model/')
  await expect(page.locator('.react-flow__pane')).toBeVisible({ timeout: 20_000 })
})

test('browses Model View through nested focus and history', async ({ page }) => {
  const perspective = page.locator('.react-flow__node[data-id="perspective.browser"]')
  await expect(perspective).toBeVisible()
  await expect(page.locator('.react-flow__node')).not.toHaveCount(0)
  await expect(page.locator('body')).not.toContainText('untitled')
  await expectVisibleNodesDoNotOverlap(page)

  await page.screenshot({ path: test.info().outputPath('model-root.png'), fullPage: true })
  await perspective.click()
  const branch = page.locator('.react-flow__node[data-id="capability.drill"]')
  await expect(branch).toBeVisible()
  await expect(page).toHaveURL(/\/view\/model\//)

  await branch.click()
  const leaf = page.locator('.react-flow__node[data-id="capability.leaf"]')
  await expect(leaf).toBeVisible()
  await expectVisibleNodesDoNotOverlap(page)
  await page.screenshot({ path: test.info().outputPath('model-leaf.png'), fullPage: true })
  await expect(page.locator('[data-xirang-focus-breadcrumb]')).toContainText('Drill-down Capability')
  await expect(page.locator('.react-flow__edge')).not.toHaveCount(0)
  const relationship = page.getByRole('group', { name: /Relationship from Leaf Capability to Peer Capability/ })
  await relationship.click()
  await expect(page.locator('[data-xirang-relationship-details]')).toContainText('capability.leaf|invokes|capability.peer')
  await leaf.click()
  const openDetails = leaf.getByRole('button', { name: 'Open details' })
  await expect(openDetails).not.toHaveAttribute('inert', '')
  await openDetails.click({ force: true })
  const dialog = page.locator('dialog[open]')
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('Leaf Capability')
  await dialog.getByRole('tab', { name: 'Contracts' }).click()
  await expect(dialog.locator('[data-xirang-contract-content]')).toContainText('Leaf refinement context')
  await dialog.press('Escape')
  await expect(dialog).toHaveCount(0)

  await page.locator('[data-navigation-back]').click()
  await expect(branch).toBeVisible()
  await page.locator('[data-navigation-back]').click()
  await expect(perspective).toBeVisible()
})
