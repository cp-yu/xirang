import { expect, test, type Page } from '@playwright/test'

/** Browser-side predicate body, shared by the on-screen and auto-fit assertions. */
const nodeInViewport = `(node) => {
  const rect = node.getBoundingClientRect()
  return rect.right > 0 && rect.left < window.innerWidth && rect.bottom > 0 && rect.top < window.innerHeight
}`

async function openCandidate(page: Page, label: 'Candidate View' | 'Candidate Diff View'): Promise<void> {
  await page.goto('/')
  await page.getByText(label, { exact: true }).click()
  const identity = label === 'Candidate View' ? 'candidate' : 'candidate-diff'
  await expect(page).toHaveURL(new RegExp(`view=${identity}`))
  await expect(page.locator('.react-flow__pane')).toBeVisible({ timeout: 20_000 })
}

test.beforeEach(async ({ page }) => {
  await page.goto('/view/model/')
  await expect(page.locator('.react-flow__pane')).toBeVisible({ timeout: 20_000 })
})

test('browses the complete candidate model', async ({ page }) => {
  await openCandidate(page, 'Candidate View')
  await expect(page.locator('[data-xirang-controller]')).toHaveCount(0)
  const nodes = page.locator('.react-flow__node:visible')
  await expect(nodes).not.toHaveCount(0)

  await expect(page.getByRole('group', { name: /Browser Perspective\. Node kind: perspective/ })).toBeVisible()
  await expect(page.getByRole('group', { name: /New Candidate Capability\. Node kind: capability/ })).toBeVisible()
})

test('reviews candidate changes in diff only mode', async ({ page }) => {
  await openCandidate(page, 'Candidate Diff View')
  await expect(page.locator('[data-xirang-controller]')).toHaveCount(0)
  await expect(page.locator('.react-flow__node:visible')).not.toHaveCount(0)
  await expect(page.locator('.react-flow__node[data-xirang-operation="ADDED"]')).toBeVisible({ timeout: 10_000 })
  await expect(page.getByRole('button', { name: 'Full context' })).toHaveCount(0)
})

test('keeps invalid candidate sources diagnosable', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Candidate View', { exact: true })).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText('Candidate Diff View', { exact: true })).toBeVisible({ timeout: 20_000 })
})

test('shows candidate cards on the landing page', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Candidate View')).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText('Candidate Diff View')).toBeVisible({ timeout: 20_000 })
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
