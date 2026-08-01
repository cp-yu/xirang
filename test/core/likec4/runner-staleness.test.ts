import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CLI_RUNTIME_PACKAGES,
  isLikeC4DistStale,
  resolveLikeC4Command,
  type LikeC4Layout,
} from '../../../src/commands/arch/runner.js';

const MINUTE = 60_000;

async function fixture(seed: { srcNewer?: boolean; skipDist?: boolean; generatedNewer?: boolean }): Promise<{ root: string; layout: LikeC4Layout }> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-likec4-layout-'));
  const packagesRoot = path.join(root, 'packages');
  const now = Date.now();
  for (const pkg of CLI_RUNTIME_PACKAGES) {
    const srcDir = path.join(packagesRoot, pkg, 'src');
    const distDir = path.join(packagesRoot, pkg, 'dist');
    await fs.mkdir(srcDir, { recursive: true });
    await fs.mkdir(distDir, { recursive: true });
    const srcFile = path.join(srcDir, 'index.ts');
    const distFile = path.join(distDir, 'index.js');
    await fs.writeFile(srcFile, `export const ${pkg} = true;\n`);
    if (!seed.skipDist) {
      await fs.writeFile(distFile, `export const ${pkg} = true;\n`);
      await fs.utimes(srcFile, new Date(now - 2 * MINUTE), new Date(now - 2 * MINUTE));
      await fs.utimes(distFile, new Date(now - MINUTE), new Date(now - MINUTE));
    } else {
      await fs.utimes(srcFile, new Date(now - MINUTE), new Date(now - MINUTE));
    }
    if (seed.generatedNewer && pkg === 'layouts') {
      // Turbo `generate` outputs live under src/ and are rewritten independently of dist.
      const generated = path.join(srcDir, 'prompt.generated.ts');
      await fs.writeFile(generated, 'export const prompt = "";\n');
      await fs.utimes(generated, new Date(now), new Date(now));
    }
  }
  if (seed.srcNewer) {
    // The newest source file is newer than every dist artifact.
    await fs.utimes(
      path.join(packagesRoot, 'language-server', 'src', 'index.ts'),
      new Date(now),
      new Date(now),
    );
  }
  return { root, layout: { packagesRoot, distBin: '/bin/likec4.mjs', tsxCli: '/tsx/cli.mjs', cliSource: '/cli/index.ts' } };
}

const dirs: string[] = [];

afterEach(async () => {
  vi.unstubAllEnvs();
  await Promise.all(dirs.splice(0).map(dir => fs.rm(dir, { recursive: true, force: true })));
});

describe('isLikeC4DistStale', () => {
  it('is false when every dist artifact is newer than its sources', async () => {
    const { root, layout } = await fixture({});
    dirs.push(root);
    expect(isLikeC4DistStale(layout)).toBe(false);
  });

  it('is true when a source is newer than its dist artifacts', async () => {
    const { root, layout } = await fixture({ srcNewer: true });
    dirs.push(root);
    expect(isLikeC4DistStale(layout)).toBe(true);
  });

  it('is true when a dist directory is missing', async () => {
    const { root, layout } = await fixture({ skipDist: true });
    dirs.push(root);
    expect(isLikeC4DistStale(layout)).toBe(true);
  });

  it('ignores generated files under src (turbo `generate` outputs)', async () => {
    const { root, layout } = await fixture({ generatedNewer: true });
    dirs.push(root);
    expect(isLikeC4DistStale(layout)).toBe(false);
  });
});

describe('resolveLikeC4Command', () => {
  it('runs the built dist when it is in sync with the sources', async () => {
    const { root, layout } = await fixture({});
    dirs.push(root);
    expect(resolveLikeC4Command(['validate', '/tmp/x'], layout)).toEqual({
      argv: ['/bin/likec4.mjs', 'validate', '/tmp/x'],
      mode: 'dist',
    });
  });

  it('runs from source via tsx when dist is stale', async () => {
    const { root, layout } = await fixture({ srcNewer: true });
    dirs.push(root);
    expect(resolveLikeC4Command(['export', 'json', '/tmp/x'], layout)).toEqual({
      argv: ['/tsx/cli.mjs', '--conditions=sources', '/cli/index.ts', 'export', 'json', '/tmp/x'],
      mode: 'source',
    });
  });

  it('always uses dist when the staleness check is disabled via env var', async () => {
    vi.stubEnv('XIRANG_LIKEC4_STALE_CHECK', '0');
    const { root, layout } = await fixture({ srcNewer: true });
    dirs.push(root);
    expect(resolveLikeC4Command(['validate', '/tmp/x'], layout)).toEqual({
      argv: ['/bin/likec4.mjs', 'validate', '/tmp/x'],
      mode: 'dist',
    });
  });
});
