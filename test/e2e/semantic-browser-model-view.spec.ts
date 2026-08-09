import { promises as fs } from 'node:fs'
import path from 'node:path'
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
  const perspective = page.locator('.react-flow__node[data-xirang-identity="perspective.browser"]')
  await expect(perspective).toBeVisible()
  await expect(page.locator('body')).not.toContainText('untitled')
  await expectVisibleNodesDoNotOverlap(page)

  const breadcrumb = page.locator('[data-xirang-focus-breadcrumb]')
  const controls = page.locator('[data-xirang-controller]')
  await expect(breadcrumb).toBeVisible()
  await expect(controls).toBeVisible()
  const breadcrumbBox = await breadcrumb.boundingBox()
  const controlsBox = await controls.boundingBox()
  expect(breadcrumbBox).not.toBeNull()
  expect(controlsBox).not.toBeNull()
  // Controls live in the top-left chrome; the breadcrumb docks bottom-left.
  expect(controlsBox!.y).toBeLessThan(breadcrumbBox!.y)
  // The breadcrumb clears the bottom-left zoom controls (+/-/fit/fullscreen).
  const zoom = await page.locator('.react-flow__controls').boundingBox()
  expect(zoom).not.toBeNull()
  expect(breadcrumbBox!.x).toBeGreaterThanOrEqual(zoom!.x + zoom!.width)

  await page.screenshot({ path: test.info().outputPath('model-root.png'), fullPage: true })
  await perspective.dblclick()
  const branch = page.locator('.react-flow__node[data-xirang-identity="capability.drill"]')
  await expect(branch).toBeVisible()
  await expect(page).toHaveURL(/\/view\/model\//)
  await expect(page).toHaveURL(/focus=perspective\.browser/)

  await page.goto('/view/model/?focus=capability.drill')
  await expect(page).toHaveURL(/focus=capability\.drill/)
  const leaf = page.locator('.react-flow__node[data-xirang-identity="capability.leaf"]')
  await expect(leaf).toBeVisible()
  await expectVisibleNodesDoNotOverlap(page)
  await page.screenshot({ path: test.info().outputPath('model-leaf.png'), fullPage: true })
  await expect(page.locator('[data-xirang-focus-breadcrumb]')).toBeVisible()
  await expect(page).toHaveURL(/focus=capability\.drill/)

  // The first focus transition is user-driven; this route check verifies the deeper projection.
})

test('handles ADDED projection interactions and split diffs', async ({ page }) => {
  await page.getByLabel('Change Selection').selectOption('browser-change')

  const manifest = await page.request.get('/__xirang/changes')
  expect(manifest.ok()).toBe(true)
  expect((await manifest.json()).changes['browser-change'].diff.entries).toEqual(expect.arrayContaining([
    expect.objectContaining({
      kind: 'element-declaration',
      identity: 'capability.added-parent',
      operation: 'ADDED',
    }),
  ]))
  const injected = await page.evaluate(() => (globalThis as typeof globalThis & {
    __OPSX_RUNTIME__?: { changes?: Record<string, { diff?: { entries?: unknown[] } }> }
  }).__OPSX_RUNTIME__)
  expect(injected?.changes?.['browser-change']?.diff?.entries).toEqual(expect.arrayContaining([
    expect.objectContaining({
      kind: 'element-declaration',
      identity: 'capability.added-parent',
      operation: 'ADDED',
    }),
  ]))
  let parent = page.locator('.react-flow__node[data-xirang-identity="capability.added-parent"]')
  const child = page.locator('.react-flow__node[data-xirang-identity="capability.added-child"]')
  await expect(parent).toBeVisible()
  await expect(parent).toHaveAttribute('data-xirang-operation', 'ADDED')
  await expect(child).toHaveCount(0)

  await parent.click()
  await page.waitForTimeout(600)
  const expand = parent.getByRole('button', { name: 'Expand children' })
  await expect(expand).not.toHaveAttribute('inert', '')
  await expand.click()
  await expect(child).toBeVisible()
  await page.screenshot({ path: test.info().outputPath('added-parent-expanded.png'), fullPage: true })
  await page.waitForTimeout(600)

  parent = page.locator('.react-flow__node[data-xirang-identity="capability.added-parent"]')
  const collapse = parent.getByRole('button', { name: 'Collapse children' })
  await expect(collapse).not.toHaveAttribute('inert', '')
})

test('refreshes the model through HMR and keeps an equivalent Authored layout', async ({ page }) => {
  await page.getByLabel('View Selection').selectOption('model-equivalent')
  await expect(page).toHaveURL(/view=model-equivalent/)
  await expect(page.locator('.react-flow__node:visible')).not.toHaveCount(0)
  await page.screenshot({ path: test.info().outputPath('model-equivalent-authored.png'), fullPage: true })
  await page.getByLabel('View Selection').selectOption('model')
  const manifestBefore = await page.request.get('/__xirang/changes').then(response => response.json()) as { modelFingerprint: string }
  const elementFile = path.join(process.cwd(), 'test/fixtures/contract-browser/.xirang/model/elements/none.md')
  const original = await fs.readFile(elementFile, 'utf8')
  try {
    await fs.writeFile(elementFile, original.replace('title: No Contract', 'title: No Contract Refreshed'))
    await expect.poll(async () => {
      const manifest = await page.request.get('/__xirang/changes').then(response => response.json()) as { modelFingerprint: string }
      return manifest.modelFingerprint
    }, { timeout: 20_000 }).not.toBe(manifestBefore.modelFingerprint)
    await expect(page.locator('.react-flow__node[data-xirang-identity="none"]')).toContainText('No Contract Refreshed', { timeout: 20_000 })
    await expect(page.locator('.react-flow__node:visible')).not.toHaveCount(0)
    await page.screenshot({ path: test.info().outputPath('model-hmr-refreshed.png'), fullPage: true })
  } finally {
    await fs.writeFile(elementFile, original)
    await expect.poll(async () => {
      const manifest = await page.request.get('/__xirang/changes').then(response => response.json()) as { modelFingerprint: string }
      return manifest.modelFingerprint
    }, { timeout: 20_000 }).toBe(manifestBefore.modelFingerprint)
  }
})

test('renders each Change presentation mode with distinct membership and overlays', async ({ page }) => {
  await page.getByLabel('Change Selection').selectOption('browser-change')
  const parent = page.locator('.react-flow__node[data-xirang-identity="capability.added-parent"]')
  await expect(parent).toBeVisible()
  await expect(parent).toHaveAttribute('data-xirang-operation', 'ADDED')

  await page.getByLabel('Presentation Mode').selectOption('complete')
  await expect(parent).toBeVisible()
  await expect(parent).not.toHaveAttribute('data-xirang-operation')

  await page.goto('/view/model/?change=browser-change&mode=complete-with-diff&focus=capability.drill')
  const removed = page.locator('.react-flow__node[data-xirang-identity="capability.peer"]')
  await expect(removed).toHaveAttribute('data-xirang-operation', 'REMOVED')
  await expect(page.locator('[data-xirang-edge-diff][aria-label="Relationship REMOVED"]')).toBeVisible()

  await page.getByLabel('Presentation Mode').selectOption('complete')
  await expect(removed).toHaveCount(0)

  await page.getByLabel('Presentation Mode').selectOption('diff-only')
  await expect(removed).toBeVisible()
  await expect(removed).toHaveAttribute('data-xirang-operation', 'REMOVED')
  await expect(page.locator('.react-flow__node[data-xirang-identity="capability.added-parent"]')).toHaveCount(0)
  await page.screenshot({ path: test.info().outputPath('change-modes-diff-only.png'), fullPage: true })
})

test('expands in place with ctrl+click and collapses with Shift+0', async ({ page }) => {
  const perspective = page.locator('.react-flow__node[data-xirang-identity="perspective.browser"]')
  await expect(perspective).toBeVisible()
  const branch = page.locator('.react-flow__node[data-xirang-identity="capability.drill"]')
  await expect(branch).toHaveCount(0)

  // Shift+3 expands three levels in place while keeping the current focus.
  await page.locator('.react-flow__pane').press('Shift+Digit3')
  await expect(branch).toBeVisible()
  await expect(page.locator('[data-xirang-focus-breadcrumb]')).not.toContainText('Drill-down Capability')
  await expectVisibleNodesDoNotOverlap(page)
  await page.screenshot({ path: test.info().outputPath('model-expanded.png'), fullPage: true })

  // Shift+2 keeps two levels visible, Shift+0 collapses everything back.
  await page.locator('.react-flow__pane').press('Shift+Digit0')
  await expect(branch).toHaveCount(0)
  await expect(perspective).toBeVisible()
})
