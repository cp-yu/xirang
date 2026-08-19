import { expect, test } from '@playwright/test'

test('exports a hierarchy tree in text, markdown and json', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/view/full-model/tree')

  const formatControl = page.locator('[aria-label="Tree format"]')
  const code = page.locator('pre').first()

  // Default text format renders the box-drawing tree rooted at the view's root element.
  await expect(code).toContainText('Xirang Contract Browser', { timeout: 20_000 })
  await expect(code).toContainText('├──')
  await expect(code).toContainText('└──')

  // Markdown renders a nested list.
  await formatControl.getByText('Markdown', { exact: true }).click()
  await expect(page).toHaveURL(/format=markdown/)
  await expect(code).toContainText('- Xirang Contract Browser')

  // JSON always carries the full fields.
  await formatControl.getByText('JSON', { exact: true }).click()
  await expect(page).toHaveURL(/format=json/)
  await expect(code).toContainText('"fqn": "project.root"')
  await expect(code).toContainText('"kind": "project"')
  await expect(code).toContainText('"children"')

  // Selected fields appear in text lines in title, fqn order.
  await formatControl.getByText('Text', { exact: true }).click()
  await page.getByText('FQN', { exact: true }).click()
  await expect(code).toContainText('[project.root]')

  // Copy writes the current content to the clipboard.
  await page.getByRole('button', { name: 'Copy' }).click()
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('[project.root]')
})
