import { expect, test } from '@playwright/test'

test('browses Model View and hides the Change panel on landing cards', async ({ page }) => {
  // Selecting a change source through the landing card keeps the runtime selection
  // across SPA navigation, so the static cards render with a change active.
  await page.goto('/')
  await page.getByText('browser-change', { exact: true }).first().click()
  await expect(page).toHaveURL(/\/view\/model\//)
  const panel = page.locator('[data-xirang-architecture-overlay][data-xirang-architecture-mode]')
  await expect(panel).toBeVisible({ timeout: 20_000 })

  // Wait for the history bridge to commit the source to the URL, then jump back to the
  // landing page through the history stack without a full reload. A reload would reset the
  // runtime to the semantic model and defeat the static-context check.
  await expect(page).toHaveURL(/source=change%3Abrowser-change/)
  await page.evaluate(() => window.history.go(-2))
  await expect(page.locator('.likec4-static-view').first()).toBeVisible({ timeout: 20_000 })

  // Static cards must not show the floating Change panel (nor the focus breadcrumb).
  await expect(page.locator('[data-xirang-architecture-overlay]:visible')).toHaveCount(0)
  await expect(page.locator('[data-xirang-focus-breadcrumb]:visible')).toHaveCount(0)
})

test('browses Model View and exports without the Change panel', async ({ page }) => {
  // The export page renders the diagram in static mode; the floating Change panel and
  // breadcrumb must never appear in the exported image.
  await page.goto('/export/model')
  await expect(page.locator('.likec4-static-view').first()).toBeVisible({ timeout: 20_000 })
  await expect(page.locator('[data-xirang-architecture-overlay]').first()).toBeAttached()
  await expect(page.locator('[data-xirang-architecture-overlay]:visible')).toHaveCount(0)
  await expect(page.locator('[data-xirang-focus-breadcrumb]:visible')).toHaveCount(0)
})

test('browses Model View and drags the Change panel', async ({ page, context }) => {
  await page.goto('/view/model/')
  await expect(page.locator('.react-flow__pane')).toBeVisible({ timeout: 20_000 })
  await page.getByRole('button', { name: 'Untitled View' }).click()
  const dropdown = page.locator('[data-likec4-breadcrumbs-dropdown]')
  await expect(dropdown).toBeVisible()
  await dropdown.getByLabel('View source').selectOption('change:browser-change')

  const panel = page.locator('[data-xirang-architecture-overlay][data-xirang-architecture-mode]')
  await expect(panel).toBeVisible()

  // Wait for the initial fitView animation to settle before capturing the viewport transform.
  const viewport = page.locator('.react-flow__viewport')
  const waitForStableTransform = async () => {
    let last: string | null = null
    for (let i = 0; i < 30; i++) {
      const current = await viewport.getAttribute('style')
      if (current && current === last) return current
      last = current
      await page.waitForTimeout(100)
    }
    return last
  }
  const viewportTransformBefore = await waitForStableTransform()

  // Dragging the panel header moves the panel without panning the diagram.
  const handle = panel.getByText(/^Change \//)
  const handleBox = await handle.boundingBox()
  const before = await panel.boundingBox()
  await page.mouse.move(handleBox!.x + handleBox!.width / 2, handleBox!.y + handleBox!.height / 2)
  await page.mouse.down()
  await page.mouse.move(
    handleBox!.x + handleBox!.width / 2 + 120,
    handleBox!.y + handleBox!.height / 2 + 80,
    { steps: 12 },
  )
  await page.mouse.up()

  await expect.poll(async () => (await panel.boundingBox())?.x).toBeGreaterThan(before!.x + 40)
  await expect.poll(async () => (await panel.boundingBox())?.y).toBeGreaterThan(before!.y + 40)
  const viewportTransformAfter = await waitForStableTransform()
  expect(viewportTransformAfter).toBe(viewportTransformBefore)

  // A real touch drag must also move the panel (touch-action must not let the
  // browser cancel the gesture mid-drag).
  const cdp = await context.newCDPSession(page)
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })
  const beforeTouch = await panel.boundingBox()
  const touchHandle = await handle.boundingBox()
  const tx = Math.round(touchHandle!.x + touchHandle!.width / 2)
  const ty = Math.round(touchHandle!.y + touchHandle!.height / 2)
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: tx, y: ty, id: 1, radiusX: 2, radiusY: 2, force: 1 }],
  })
  for (let i = 1; i <= 10; i++) {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: tx + 12 * i, y: ty + 8 * i, id: 1, radiusX: 2, radiusY: 2, force: 1 }],
    })
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await expect.poll(async () => (await panel.boundingBox())?.x).toBeGreaterThan(beforeTouch!.x + 40)
  await expect.poll(async () => (await panel.boundingBox())?.y).toBeGreaterThan(beforeTouch!.y + 40)

  // The panel drag handle carries a visible grip icon as the drag affordance.
  await expect(panel.locator('[data-xirang-drag-handle] svg')).toHaveCount(1)

  // The focus breadcrumb is draggable too, so it can be moved out of the way.
  const breadcrumb = page.locator('[data-xirang-focus-breadcrumb]')
  await expect(breadcrumb).toBeVisible()
  await expect(breadcrumb.locator('svg')).toHaveCount(1)
  const breadcrumbBefore = await breadcrumb.boundingBox()
  await page.mouse.move(breadcrumbBefore!.x + 8, breadcrumbBefore!.y + breadcrumbBefore!.height / 2)
  await page.mouse.down()
  await page.mouse.move(
    breadcrumbBefore!.x + 8 + 80,
    breadcrumbBefore!.y + breadcrumbBefore!.height / 2 + 60,
    { steps: 8 },
  )
  await page.mouse.up()
  await expect.poll(async () => (await breadcrumb.boundingBox())?.x).toBeGreaterThan(breadcrumbBefore!.x + 30)
  await expect.poll(async () => (await breadcrumb.boundingBox())?.y).toBeGreaterThan(breadcrumbBefore!.y + 30)
})
