import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('Xirang SPA bootstrap', () => {
  it('delegates manifest lifecycle to the Contract loader provider', async () => {
    const source = await readFile(new URL('./main.tsx', import.meta.url), 'utf8')

    expect(source).not.toContain('contractLoader.variants')
    expect(source).toContain('<XirangContractLoaderProvider loader={contractLoader}>')
  })
})
