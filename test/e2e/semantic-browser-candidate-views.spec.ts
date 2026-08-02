import { expect, test, type Page } from '@playwright/test'

async function selectViewSource(page: Page, sourceId: string): Promise<void> {
  await page.getByRole('button', { name: 'Untitled View', exact: true }).click()
  const dropdown = page.locator('[data-likec4-breadcrumbs-dropdown]')
  await dropdown.getByLabel('View source').selectOption(sourceId)
}

test.beforeEach(async ({ page }) => {
  await page.goto('/view/model/')
  await expect(page.locator('.react-flow__pane')).toBeVisible({ timeout: 20_000 })
})

test('browses the complete candidate model', async ({ page }) => {
  const dropdown = page.locator('[data-likec4-breadcrumbs-dropdown]')

  await page.getByRole('button', { name: 'Untitled View', exact: true }).click()
  const viewSourceSelect = dropdown.getByLabel('View source')
  await expect(viewSourceSelect).toBeVisible()

  const options = await viewSourceSelect.locator('option').allTextContents()
  expect(options.some(o => o.includes('Candidate View'))).toBe(true)
  expect(options.some(o => o.includes('Candidate Diff View'))).toBe(true)

  await viewSourceSelect.selectOption('candidate')

  await page.waitForSelector('.react-flow__pane', { timeout: 10_000 })
  const nodes = page.locator('.react-flow__node:visible')
  await expect(nodes).not.toHaveCount(0)

  const newCandidateNode = page.locator('.react-flow__node[data-id="capability.new-in-candidate"]')
  await page.locator('.react-flow__node[data-id="perspective.browser"]').click({ modifiers: ['Control'] })
  await expect(newCandidateNode).toBeVisible({ timeout: 10_000 })

  const candidateNodeCount = await nodes.count()
  expect(candidateNodeCount).toBeGreaterThan(0)

  await page.screenshot({ path: test.info().outputPath('candidate-model-view.png'), fullPage: true })
})

test('reviews candidate changes in diff only mode', async ({ page }) => {
  await page.getByRole('button', { name: 'Untitled View', exact: true }).click()
  const dropdown = page.locator('[data-likec4-breadcrumbs-dropdown]')
  await dropdown.getByLabel('View source').selectOption('candidate-diff')

  await page.waitForSelector('.react-flow__pane', { timeout: 10_000 })

  const nodes = page.locator('.react-flow__node:visible')
  await expect(nodes).not.toHaveCount(0)

  const addedNode = page.locator('.react-flow__node[data-xirang-operation="ADDED"]')
  await expect(addedNode).toBeVisible({ timeout: 10_000 })

  const fullContextButton = page.locator('button:has-text("Full context")')
  await expect(fullContextButton).toHaveCount(0)

  await page.screenshot({ path: test.info().outputPath('candidate-diff-view.png'), fullPage: true })
})

test('keeps invalid candidate sources diagnosable', async ({ page }) => {
  await page.getByRole('button', { name: 'Untitled View', exact: true }).click()
  const dropdown = page.locator('[data-likec4-breadcrumbs-dropdown]')
  const viewSourceSelect = dropdown.getByLabel('View source')

  const options = await viewSourceSelect.locator('option').allTextContents()
  expect(options.some(o => o.includes('Model View'))).toBe(true)

  const candidateOption = options.find(o => o.includes('Candidate View'))
  expect(candidateOption).toBeDefined()
  const candidateDiffOption = options.find(o => o.includes('Candidate Diff View'))
  expect(candidateDiffOption).toBeDefined()

  await page.screenshot({ path: test.info().outputPath('candidate-selector-visible.png'), fullPage: true })
})

test('shows candidate cards on the landing page', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Candidate View')).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText('Candidate Diff View')).toBeVisible({ timeout: 20_000 })
})
