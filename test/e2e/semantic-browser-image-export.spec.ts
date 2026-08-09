import { expect, test, type Page } from '@playwright/test'

async function visibleNodeIds(page: Page): Promise<string[]> {
  return page.locator('.react-flow__node:visible').evaluateAll(nodes =>
    nodes
      .map(node => node.getAttribute('data-xirang-identity') ?? node.getAttribute('data-id') ?? '')
      .filter(Boolean)
      .sort()
  )
}

async function exportPngAndCapturePopup(page: Page): Promise<{
  snapshot: Record<string, unknown> | null
  popupNodes: string[] | null
}> {
  await page.getByRole('button', { name: 'Export', exact: true }).click()
  const popupPromise = page.waitForEvent('popup', { timeout: 5000 }).catch(() => null)
  await page.getByRole('menuitem', { name: 'Export as .png' }).click()
  const popup = await popupPromise
  const snapshot = await page.evaluate(() => {
    const raw = sessionStorage.getItem('xirang:export-snapshot')
    return raw ? JSON.parse(raw) : null
  })
  let popupNodes: string[] | null = null
  if (popup) {
    // The popup auto-downloads and closes itself; capture the rendered nodes before that.
    try {
      await expect.poll(async () => popup.locator('.react-flow__node:visible').count(), { timeout: 5000 })
        .toBeGreaterThan(0)
      popupNodes = await popup.locator('.react-flow__node:visible').evaluateAll(nodes =>
        nodes.map(node => node.getAttribute('data-xirang-identity') ?? node.getAttribute('data-id') ?? '').filter(Boolean).sort()
      )
    } catch {
      popupNodes = null
    }
    await popup.close().catch(() => undefined)
  }
  return { snapshot, popupNodes }
}


test('exports the current focus and expand-in-place state', async ({ page }) => {
  await page.goto('/view/model/')
  await expect(page.locator('.react-flow__pane')).toBeVisible({ timeout: 20_000 })

  // Focus into perspective.browser, then expand capability.drill in place.
  await page.goto('/view/model/?focus=perspective.browser')
  await expect(page).toHaveURL(/focus=perspective\.browser/)
  const perspective = page.locator('.react-flow__node[data-xirang-identity="perspective.browser"]')
  await expect(perspective).toBeVisible()

  const drill = page.locator('.react-flow__node[data-xirang-identity="capability.drill"]')
  await expect(drill).toBeVisible()
  await drill.click({ modifiers: ['Control'] })
  await expect(page.locator('.react-flow__node[data-xirang-identity="capability.leaf"]')).toBeVisible()
  await expect.poll(async () => visibleNodeIds(page), { timeout: 10_000 })
    .toEqual(['capability.drill', 'capability.leaf', 'capability.peer', 'perspective.browser'])
  const onScreen = await visibleNodeIds(page)

  // The Header export carries the current state into the export tab via sessionStorage;
  // the actual export tab must render the on-screen node set (WYSIWYG).
  const { snapshot, popupNodes } = await exportPngAndCapturePopup(page)
  expect(snapshot).toMatchObject({
    view: 'model',
    change: null,
    mode: 'full',
    focus: 'perspective.browser',
  })
  expect(snapshot?.expanded).toContain('capability.drill')
  expect(popupNodes).toEqual(onScreen)
})

test('exports a change source in diff mode', async ({ page }) => {
  await page.goto('/view/model/')
  await expect(page.locator('.react-flow__pane')).toBeVisible({ timeout: 20_000 })

  await page.getByLabel('Change Selection').selectOption('browser-change')
  await page.getByLabel('Presentation Mode').selectOption('diff-only')
  await expect(page.locator('[data-xirang-architecture-mode]')).toHaveAttribute('data-xirang-architecture-mode', 'diff')

  const { snapshot, popupNodes } = await exportPngAndCapturePopup(page)
  expect(snapshot).toMatchObject({
    view: 'model',
    change: 'browser-change',
    mode: 'diff',
  })
  expect(popupNodes).toContain('capability.added-parent')
})

test('exports without a snapshot', async ({ page }) => {
  await page.goto('/export/model/?download=false')
  await expect(page.locator('.react-flow__pane')).toBeVisible({ timeout: 20_000 })
  await expect.poll(async () => (await visibleNodeIds(page)).length, { timeout: 10_000 }).toBeGreaterThan(0)
  await expect(page.locator('[data-testid="export-page"]')).toBeVisible()
})

test('exports the complete model structure for file formats', async ({ page }) => {
  await page.goto('/view/model/')
  await expect(page.locator('.react-flow__pane')).toBeVisible({ timeout: 20_000 })

  // Focus and expand in place, then verify file-format exports stay global (declared scope).
  await page.goto('/view/model/?focus=perspective.browser')
  await expect(page).toHaveURL(/focus=perspective\.browser/)
  await page.locator('.react-flow__node[data-xirang-identity="capability.drill"]').click({ modifiers: ['Control'] })
  await expect(page.locator('.react-flow__node[data-xirang-identity="capability.leaf"]')).toBeVisible()

  // dot exports the complete compiled model view, independent of focus/expansion.
  await page.goto('/view/model/dot')
  const dotSource = page.locator('pre').first()
  await expect(dotSource).toContainText('root.browser.drill.leaf', { timeout: 20_000 })
  await expect(dotSource).toContainText('root.long')

  // The hierarchy tree still shows the complete model hierarchy.
  await page.goto('/view/model/tree')
  const treeBody = page.locator('body')
  await expect(treeBody).toContainText('Leaf Capability', { timeout: 20_000 })
  await expect(treeBody).toContainText('Long Contract')
})
