import { expect, test, type Page } from '@playwright/test'

/** Browser-side predicate body, shared by the on-screen and auto-fit assertions. */
const nodeInViewport = `(node) => {
  const rect = node.getBoundingClientRect()
  return rect.right > 0 && rect.left < window.innerWidth && rect.bottom > 0 && rect.top < window.innerHeight
}`

async function openCandidate(page: Page): Promise<void> {
  await page.goto('/')
  await page.getByText('Candidate View', { exact: true }).click()
  await expect(page).toHaveURL(/change=candidate/)
  await expect(page.locator('.react-flow__pane')).toBeVisible({ timeout: 20_000 })
}

test.beforeEach(async ({ page }) => {
  await page.goto('/view/model/')
  await expect(page.locator('.react-flow__pane')).toBeVisible({ timeout:20_000 })
})

test('browses the complete candidate model through the collapsed baseline', async ({ page }) => {
  await openCandidate(page)
  // Candidate is a Change Selection with two presentation modes.
  await expect(page.locator('[data-xirang-controller]')).toBeVisible()
  await expect(page.getByLabel('Change Selection')).toHaveValue('candidate')
  await expect(page.getByLabel('Presentation Mode')).toHaveValue('complete')
  await expect(page.getByLabel('Presentation Mode').locator('option')).toHaveText(['Complete', 'Diff only'])
  const nodes = page.locator('.react-flow__node:visible')
  await expect(nodes).not.toHaveCount(0)

  // Collapsed baseline: root children only, deep elements require drill-down or expansion.
  const browser = page.locator('.react-flow__node[data-xirang-identity="perspective.browser"]')
  await expect(browser).toBeVisible()
  await expect(page.locator('.react-flow__node[data-xirang-identity="long"]')).toBeVisible()
  await expect(page.locator('.react-flow__node[data-xirang-identity="capability.drill"]')).toHaveCount(0)
  await expect(page.locator('.react-flow__node[data-xirang-identity="capability.new-in-candidate"]')).toHaveCount(0)
  await expect(page.locator('[data-xirang-focus-breadcrumb]')).toBeVisible()

  // Multiple relationships between one visible pair stay merged on a single edge with the
  // LikeC4 aggregated label.
  await expect(page.getByRole('group', { name: /Label: \[\.\.\.\]/ })).toBeVisible()

  // Complete mode drops every diff mark on the Candidate target projection.
  await expect(page.locator('[data-xirang-node-diff]')).toHaveCount(0)

  // Drill-down inside the same Candidate selection reveals the nested level.
  await browser.dblclick()
  await expect(page).toHaveURL(/change=candidate/)
  await expect(page).toHaveURL(/focus=perspective\.browser/)
  await expect(page.locator('.react-flow__node[data-xirang-identity="capability.drill"]')).toBeVisible()
  await expect(page.locator('.react-flow__node[data-xirang-identity="capability.new-in-candidate"]')).toBeVisible()
  await page.screenshot({ path: test.info().outputPath('candidate-complete-drill.png'), fullPage: true })
})

test('reviews candidate changes in diff-only mode with removed ghosts', async ({ page }) => {
  await openCandidate(page)
  await page.getByLabel('Presentation Mode').selectOption('diff-only')

  // Diff-driven visible set: changed elements, their ancestors and relationship endpoints.
  const assistant = page.locator('.react-flow__node[data-xirang-identity="capability.assistant"]')
  await expect(assistant).toBeVisible()
  await expect(assistant).toHaveAttribute('data-xirang-operation', 'REMOVED')

  const added = page.locator('.react-flow__node[data-xirang-identity="capability.new-in-candidate"]')
  await expect(added).toBeVisible()
  await expect(added).toHaveAttribute('data-xirang-operation', 'ADDED')

  // Elements without diff involvement stay out of the diff-only projection.
  await expect(page.locator('.react-flow__node[data-xirang-identity="none"]')).toHaveCount(0)
  await expect(page.locator('.react-flow__node[data-xirang-identity="capability.peer"]')).toHaveCount(0)

  // The assistant→leaf REMOVED relationship keeps its single-char badge.
  await expect(page.locator('[data-xirang-edge-diff][aria-label="Relationship REMOVED"]')).toBeVisible()
  // The single→long ADDED pair stays merged with its +2 count badge.
  await expect(page.locator('[data-xirang-edge-diff-badges]')).toBeVisible()
  await expect(page.locator('[data-xirang-edge-diff-badges]')).toContainText('+2')

  // Collapsed Metamodel panel: three summary points, exclusive expansion, entry diff modal.
  if ((page.viewportSize()?.width ?? 0) >= 768) {
    const groups = page.locator('[data-xirang-metamodel-group]')
    await expect(groups).toHaveCount(3)
    await expect(page.locator('[data-xirang-metamodel-group="element-kind"]')).toContainText('+4')
    await expect(page.locator('[data-xirang-metamodel-group="relationship-kind"]')).toContainText('+1')
    await expect(page.locator('[data-xirang-metamodel-group="authored-view"]')).toContainText('−2')
    await page.locator('[data-xirang-metamodel-group="element-kind"]').click()
    const moduleEntry = page.locator('button').filter({ hasText: /^\+ element-kind module$/ })
    await expect(moduleEntry).toBeVisible()
    // Expansion is exclusive per group.
    await page.locator('[data-xirang-metamodel-group="relationship-kind"]').click()
    await expect(moduleEntry).toHaveCount(0)
    await page.locator('[data-xirang-metamodel-group="element-kind"]').click()
    await moduleEntry.click()
    await expect(page.locator('[data-xirang-metamodel-diff] .mantine-Modal-content')).toBeVisible()
    await page.keyboard.press('Escape')
  }

  await page.screenshot({ path: test.info().outputPath('candidate-review-diff-only.png'), fullPage: true })
})

test('shows the candidate card on the landing page and opens the two-state default URL', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Candidate View', { exact: true })).toBeVisible({ timeout: 20_000 })
  await page.getByText('Candidate View', { exact: true }).click()

  await expect(page).toHaveURL(/change=candidate/)
  await expect(page).not.toHaveURL(/mode=/)
  await expect(page.locator('.react-flow__pane')).toBeVisible({ timeout: 20_000 })
  await expect(page.getByLabel('Change Selection')).toHaveValue('candidate')
  await expect(page.getByLabel('Presentation Mode')).toHaveValue('complete')
})

test('deep links change=candidate and round-trips the presentation mode', async ({ page }) => {
  // Canonical default-state URL: mode omitted means complete.
  await page.goto('/view/model/?change=candidate')
  await expect(page.locator('.react-flow__pane')).toBeVisible({ timeout: 20_000 })
  await expect(page.getByLabel('Change Selection')).toHaveValue('candidate')
  await expect(page.getByLabel('Presentation Mode')).toHaveValue('complete')

  // A mode change is written back to the URL.
  await page.getByLabel('Presentation Mode').selectOption('diff-only')
  await expect(page).toHaveURL(/mode=diff-only/)

  // Reload restores the explicit mode.
  await page.reload()
  await expect(page.locator('.react-flow__pane')).toBeVisible({ timeout: 20_000 })
  await expect(page.getByLabel('Presentation Mode')).toHaveValue('diff-only')

  // Old complete-with-diff bookmarks clamp to complete without sending that mode to projection.
  await page.goto('/view/model/?change=candidate&mode=complete-with-diff')
  await expect(page.locator('.react-flow__pane')).toBeVisible({ timeout: 20_000 })
  await expect(page.getByLabel('Presentation Mode')).toHaveValue('complete')
  await expect(page.locator('[data-xirang-node-diff]')).toHaveCount(0)
})

test('opens an active change from the landing page', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Active Changes')).toBeVisible({ timeout: 20_000 })
  await page.getByText('browser-change', { exact: true }).click()

  await expect(page).toHaveURL(/change=browser-change/)
  await expect(page).toHaveURL(/mode=diff-only/)
  await expect(page.locator('.react-flow__pane')).toBeVisible({ timeout: 20_000 })
  const removed = page.locator('.react-flow__node[data-xirang-identity="capability.peer"]')
  await expect(removed).toBeVisible()
  await expect(removed).toHaveAttribute('data-xirang-operation', 'REMOVED')

  // The projection viewport must stay on-screen: a regression anchored the
  // viewport transition on the root identity and shifted the canvas ~18k px
  // away, leaving every node off-screen (blank board).
  const onScreen = await page.evaluate(`
    [...document.querySelectorAll('.react-flow__node')].some(${nodeInViewport})
  `)
  expect(onScreen).toBe(true)

  // Change inspection panel is hidden below the sm breakpoint (mobile).
  if ((page.viewportSize()?.width ?? 0) >= 768) {
    await expect(page.getByText(/Change · Model View/)).toBeVisible()
  }

  // The quick-entry projection auto-fits: every node sits inside the viewport.
  await expect.poll(() => page.evaluate(`
    (() => {
      const nodes = [...document.querySelectorAll('.react-flow__node')]
      return nodes.length > 0 && nodes.every(${nodeInViewport})
    })()
  `), { timeout: 10_000 }).toBe(true)
})
