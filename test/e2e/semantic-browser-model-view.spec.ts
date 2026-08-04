import { expect, test, type Locator, type Page } from '@playwright/test'

async function assertDiffViewerLayout(viewer: Locator): Promise<void> {
  const table = viewer.locator('table').first()
  const metrics = await table.evaluate(element => {
    const container = element.parentElement
    const rect = element.getBoundingClientRect()
    return {
      minWidth: getComputedStyle(element).minWidth,
      width: rect.width,
      containerWidth: container?.getBoundingClientRect().width ?? 0,
    }
  })
  expect(metrics.minWidth).not.toBe('1000px')
  expect(metrics.width).toBeLessThanOrEqual(metrics.containerWidth + 1)
  await expect(viewer.locator('pre').filter({ hasText: 'Before' }).first()).toHaveCSS('margin', '0px')
  await expect(viewer.locator('pre').filter({ hasText: 'After' }).first()).toHaveCSS('margin', '0px')
}

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
  await perspective.dblclick()
  const branch = page.locator('.react-flow__node[data-id="capability.drill"]')
  await expect(branch).toBeVisible()
  await expect(page).toHaveURL(/\/view\/model\//)
  await expect(page).toHaveURL(/focus=perspective\.browser/)

  await branch.dblclick()
  const leaf = page.locator('.react-flow__node[data-id="capability.leaf"]')
  await expect(leaf).toBeVisible()
  await expectVisibleNodesDoNotOverlap(page)
  await page.screenshot({ path: test.info().outputPath('model-leaf.png'), fullPage: true })
  await expect(page.locator('[data-xirang-focus-breadcrumb]')).toContainText('Drill-down Capability')
  await expect(page).toHaveURL(/focus=capability\.drill/)

  // Drill-down steps are browser history steps: back/forward restore focus and breadcrumb.
  await page.evaluate(() => window.history.back())
  await expect(page).toHaveURL(/focus=perspective\.browser/)
  await expect(page.locator('[data-xirang-focus-breadcrumb]')).toContainText('Browser Perspective')
  await page.evaluate(() => window.history.back())
  await expect(page).toHaveURL(/\/view\/model\//)
  await expect(page).not.toHaveURL(/focus=/)
  await expect(perspective).toBeVisible()
  await page.evaluate(() => window.history.forward())
  await expect(page).toHaveURL(/focus=perspective\.browser/)
  await expect(branch).toBeVisible()
  await page.evaluate(() => window.history.forward())
  await expect(page).toHaveURL(/focus=capability\.drill/)
  await expect(leaf).toBeVisible()

  await expect(page.locator('.react-flow__edge')).not.toHaveCount(0)
  const relationship = page.getByRole('group', { name: /Relationship from Leaf Capability to Peer Capability/ })
  await relationship.click()
  const relationshipDetails = page.locator('[data-xirang-relationship-details]')
  await expect(relationshipDetails).toContainText('capability.leaf|invokes|capability.peer')
  await relationshipDetails.getByRole('button').click()
  await expect(relationshipDetails).not.toBeVisible()
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

test('handles ADDED projection interactions and split diffs', async ({ page }) => {
  await page.getByRole('button', { name: 'Untitled View' }).click()
  await page.locator('[data-likec4-breadcrumbs-dropdown]')
    .getByLabel('View source')
    .selectOption('change:browser-change')

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
  let parent = page.locator('.react-flow__node[data-id="capability.added-parent"]')
  const child = page.locator('.react-flow__node[data-id="capability.added-child"]')
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

  parent = page.locator('.react-flow__node[data-id="capability.added-parent"]')
  const collapse = parent.getByRole('button', { name: 'Collapse children' })
  await expect(collapse).not.toHaveAttribute('inert', '')
  await collapse.click()
  await expect(child).toHaveCount(0)
  await page.waitForTimeout(600)

  parent = page.locator('.react-flow__node[data-id="capability.added-parent"]')
  if (test.info().project.name === 'mobile') {
    const openDetails = parent.getByRole('button', { name: 'Open details' })
    await expect(openDetails).not.toHaveAttribute('inert', '')
    await openDetails.click()
  } else {
    await parent.dblclick()
  }
  const dialog = page.locator('dialog[open]')
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('Added Parent Capability')
  await expect(dialog.getByRole('tab', { name: 'Properties' })).toBeVisible()
  await expect(dialog.getByRole('tab', { name: 'Contracts' })).toBeVisible()
  await expect(dialog.getByRole('tab', { name: 'Diff' })).toBeVisible()
  await expect(dialog.getByRole('tab', { name: 'Relationships' })).toHaveCount(0)
  await expect(dialog.getByRole('tab', { name: 'Structure' })).toHaveCount(0)
  await expect(dialog.getByRole('tab', { name: 'Deployments' })).toHaveCount(0)

  await dialog.getByRole('tab', { name: 'Diff' }).click()
  const splitDiff = dialog.locator('[data-xirang-split-diff]').first()
  await expect(splitDiff).toContainText('Before')
  await expect(splitDiff).toContainText('After')
  await expect(dialog.locator('[data-xirang-diff-tab]')).toContainText('Added Parent Capability')
  expect(await dialog.locator('[data-xirang-diff-tab]').evaluate(element => getComputedStyle(element).overflowY)).toBe('auto')
  await expect(splitDiff.locator('tbody tr')).not.toHaveCount(0)
  expect(await splitDiff.locator('colgroup col').count()).toBe(6)
  await assertDiffViewerLayout(splitDiff)
  if (test.info().project.name === 'mobile') {
    await splitDiff.evaluate((element) => {
      element.scrollLeft = element.scrollWidth
    })
    expect(await splitDiff.evaluate(element => element.scrollLeft)).toBeGreaterThan(0)
  }
  await page.screenshot({ path: test.info().outputPath('added-details-diff.png'), fullPage: true })
  const lastContractLine = dialog.locator('ins').filter({ hasText: 'The added parent SHALL keep later' }).last()
  await lastContractLine.scrollIntoViewIfNeeded()
  await expect(lastContractLine).toBeInViewport()
  await page.screenshot({ path: test.info().outputPath('added-details-diff-scrolled.png'), fullPage: true })

  await dialog.getByRole('button', { name: 'Close element details' }).click()
  await expect(dialog).toHaveCount(0)

  await page.getByRole('button', { name: '+ element-kind test-component' }).click()
  const metamodelDialog = page.locator('[role="dialog"]:visible')
  const metamodelDiff = metamodelDialog.locator('[data-xirang-split-diff]').first()
  await expect(metamodelDiff).toBeVisible()
  await assertDiffViewerLayout(metamodelDiff)
  await metamodelDialog.press('Escape')
  await expect(metamodelDialog).not.toBeVisible()
})

test('expands in place with ctrl+click and collapses with Shift+0', async ({ page }) => {
  const perspective = page.locator('.react-flow__node[data-id="perspective.browser"]')
  await expect(perspective).toBeVisible()
  const branch = page.locator('.react-flow__node[data-id="capability.drill"]')
  await expect(branch).toHaveCount(0)

  // Ctrl+click expands in place: the focus stays at the root while a deeper level becomes visible.
  await perspective.click({ modifiers: ['Control'] })
  await expect(branch).toBeVisible()
  await expect(page.locator('[data-xirang-focus-breadcrumb]')).not.toContainText('Drill-down Capability')
  await expectVisibleNodesDoNotOverlap(page)
  await page.screenshot({ path: test.info().outputPath('model-expanded.png'), fullPage: true })

  // Shift+2 keeps two levels visible, Shift+0 collapses everything back.
  await page.locator('.react-flow__pane').press('Shift+Digit0')
  await expect(branch).toHaveCount(0)
  await expect(perspective).toBeVisible()
})
