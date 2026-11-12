import { expect, test, type Page } from '@playwright/test'

const CHANGE_DIFF = '/view/full-model/?model=change:browser-change&mode=complete-with-diff'

const viewportZoom = (page: Page) =>
  page.locator('.react-flow__viewport').evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).a)

async function waitForViewportSettled(page: Page): Promise<void> {
  await expect.poll(async () => {
    const before = await page.locator('.react-flow__viewport').evaluate(el => getComputedStyle(el).transform)
    await page.waitForTimeout(80)
    return await page.locator('.react-flow__viewport').evaluate(el => getComputedStyle(el).transform) === before
  }, { timeout: 10_000 }).toBe(true)
}

/** Narrow screens start with the Change panel collapsed so it does not cover the canvas. */
async function expandChangePanel(page: Page): Promise<void> {
  const toggle = page.locator('[data-xirang-change-panel-toggle]')
  if (await toggle.getAttribute('aria-expanded') === 'false') await toggle.click()
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
}

test('lists changed Elements and locates one outside the current focus', async ({ page }) => {
  await page.goto(CHANGE_DIFF)
  await waitForViewportSettled(page)
  await expandChangePanel(page)

  const list = page.locator('[data-xirang-changed-elements]')
  await expect(list.locator('[data-xirang-changed-element="capability.added-parent"]')).toBeVisible()
  await expect(list.locator('[data-xirang-changed-element="capability.leaf"]')).toBeVisible()
  await expect(list.locator('[data-xirang-changed-element="capability.peer"]')).toBeVisible()
  await expect(page.locator('.react-flow__node[data-xirang-identity="capability.leaf"]')).toHaveCount(0)

  await list.locator('[data-xirang-changed-element="capability.leaf"]').click()

  const leaf = page.locator('.react-flow__node[data-xirang-identity="capability.leaf"]')
  await expect(leaf).toBeVisible({ timeout: 15_000 })
  await expect.poll(async () => {
    const box = await leaf.boundingBox()
    const viewport = page.viewportSize()
    if (!box || !viewport) return false
    const centerX = box.x + box.width / 2
    const centerY = box.y + box.height / 2
    return centerX > 0 && centerX < viewport.width && centerY > 0 && centerY < viewport.height
  }, { timeout: 10_000 }).toBe(true)
})

test('shows every Acceptance Case inside a Section diff', async ({ page }) => {
  await page.goto(CHANGE_DIFF)
  await waitForViewportSettled(page)
  await expandChangePanel(page)

  await page.locator('[data-xirang-changed-element-details="capability.added-parent"]').click()
  await page.locator('[role=tab]', { hasText: 'Diff' }).first().click()

  const diffTab = page.locator('[data-xirang-diff-tab]')
  await expect(diffTab.locator('[data-xirang-acceptance-case-title]', { hasText: 'Diff is visible' })).toBeVisible()
  await expect(diffTab).toContainText('the Browser renders its target declaration and Contract diff')
  await expect(diffTab.locator('[data-xirang-acceptance-case-title]', { hasText: 'Trailing diff remains reachable' }))
    .toHaveCount(1)
})

test('shows only names when zoomed out and names with summaries when zoomed in', async ({ page }) => {
  await page.goto('/view/full-model/')
  await waitForViewportSettled(page)
  await page.keyboard.press('Shift+Digit5')
  await waitForViewportSettled(page)

  const leafTitles = page.locator('.react-flow__node-element [data-likec4-node-title]')
  const leafDescriptions = page.locator('.react-flow__node-element [data-likec4-node-description]')
  await expect(leafTitles.first()).toBeVisible()

  const box = await page.locator('.react-flow__pane').boundingBox()
  await page.mouse.move((box?.x ?? 0) + (box?.width ?? 0) / 2, (box?.y ?? 0) + (box?.height ?? 0) / 2)
  await page.keyboard.down('Control')
  for (let step = 0; step < 12; step += 1) await page.mouse.wheel(0, 200)
  await page.keyboard.up('Control')
  await waitForViewportSettled(page)

  const zoom = await viewportZoom(page)
  expect(zoom).toBeLessThan(0.5)
  await expect(leafDescriptions).toHaveCount(0)
  const fits = await leafTitles.evaluateAll((titles, z) => titles.map(title => {
    const node = title.closest('.react-flow__node')!.getBoundingClientRect()
    const rect = title.getBoundingClientRect()
    return {
      screenFontSize: parseFloat(getComputedStyle(title).fontSize) * (z as number),
      inside: rect.left >= node.left - 1 && rect.right <= node.right + 1 && rect.top >= node.top - 1
        && rect.bottom <= node.bottom + 1,
    }
  }), zoom)
  expect(fits.length).toBeGreaterThan(0)
  for (const fit of fits) {
    expect(fit.inside).toBe(true)
    expect(fit.screenFontSize).toBeGreaterThan(19.2 * zoom)
  }

  await page.keyboard.down('Control')
  for (let step = 0; step < 12; step += 1) await page.mouse.wheel(0, -200)
  await page.keyboard.up('Control')
  await waitForViewportSettled(page)
  expect(await viewportZoom(page)).toBeGreaterThan(0.6)
  await expect.poll(() => leafDescriptions.count()).toBeGreaterThan(0)
})
