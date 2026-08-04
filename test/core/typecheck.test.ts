import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const tscPath = require.resolve('typescript/bin/tsc')

/**
 * Core build gate: `node build.js` compiles `src/**` with `tsc`; vitest (esbuild) strips types
 * without checking them, so a broken core typecheck only surfaces when someone runs `pnpm build`
 * (e.g. after touching likec4). This test reproduces the build's type-check step so regressions
 * like the `nodePresentation` structural mismatch fail the default suite instead.
 */
describe('core TypeScript build gate', () => {
  it('compiles src/** with tsc --noEmit without type errors', () => {
    const result = spawnSync(
      process.execPath,
      [tscPath, '--noEmit', '-p', path.join(projectRoot, 'tsconfig.json')],
      { cwd: projectRoot, encoding: 'utf8' },
    )
    const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim()
    expect(result.status, output || 'tsc did not run').toBe(0)
    expect(output).not.toMatch(/error TS/)
  }, 120_000)
})
