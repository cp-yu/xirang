import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { spawn } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { setJsonOutput } from '../../../src/utils/output.js';

vi.mock('node:child_process', () => ({ spawn: vi.fn() }));
import {
  CLI_RUNTIME_PACKAGES,
  isLikeC4DistStale,
  resolveLikeC4Command,
  runLikeC4,
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
  vi.restoreAllMocks();
  setJsonOutput(false);
  await Promise.all(dirs.splice(0).map(dir => fs.rm(dir, { recursive: true, force: true })));
});

describe('export process output', () => {
  it.each([0, 1])('separates child diagnostics from results and honors exit code %s', async code => {
    vi.stubEnv('XIRANG_LIKEC4_STALE_CHECK', '0');
    setJsonOutput(true);
    const stdout = vi.spyOn(console, 'log').mockImplementation(() => {});
    const stderr = vi.spyOn(console, 'error').mockImplementation(() => {});
    const child = Object.assign(new EventEmitter(), { stdout: new PassThrough(), stderr: new PassThrough() });
    vi.mocked(spawn).mockReturnValue(child as unknown as ReturnType<typeof spawn>);
    const result = runLikeC4(['export', 'png', '/model']);
    child.stdout.write('warning from renderer');
    child.stderr.write('\nrenderer details');
    child.emit('close', code);
    if (code) await expect(result).rejects.toThrow('LikeC4 exited with code 1');
    else await result;
    expect(stdout).not.toHaveBeenCalled();
    expect(stderr.mock.calls.map(([message]) => JSON.parse(message))).toEqual([
      { code: 'LIKEC4_DIAGNOSTIC', message: 'warning from renderer' },
      { code: 'LIKEC4_DIAGNOSTIC', message: 'renderer details' },
    ]);
    expect(vi.mocked(spawn).mock.calls.at(-1)?.[1]).toEqual(expect.arrayContaining(['--log-level', 'warning']));
  });
});

describe('embedded viewer output', () => {
  it.each([false, true])('returns resolved addresses and streams diagnostics while running (json=%s)', async json => {
    vi.stubEnv('XIRANG_LIKEC4_STALE_CHECK', '0');
    setJsonOutput(json);
    const stdout = vi.spyOn(console, 'log').mockImplementation(() => {});
    const stderr = vi.spyOn(console, 'error').mockImplementation(() => {});
    const child = Object.assign(new EventEmitter(), { stdout: new PassThrough(), stderr: new PassThrough() });
    vi.mocked(spawn).mockReturnValue(child as unknown as ReturnType<typeof spawn>);
    const result = runLikeC4(['start', '/model'], { json });
    const urls = { local: ['http://localhost:61895/'], network: ['http://192.0.2.1:61895/'] };
    child.emit('message', { type: 'xirang-server-ready', urls });
    child.stderr.write('model warning\n');
    expect(stdout.mock.calls.map(([message]) => json ? JSON.parse(message) : message)).toEqual(
      json ? [{ urls }] : [...urls.local, ...urls.network],
    );
    expect(json ? JSON.parse(stderr.mock.calls[0][0]) : stderr.mock.calls[0][0]).toEqual(
      json ? { code: 'LIKEC4_DIAGNOSTIC', message: 'model warning' } : 'model warning',
    );
    expect(vi.mocked(spawn).mock.calls.at(-1)?.[1]).toEqual(expect.arrayContaining(['--log-level', 'warning']));
    expect(vi.mocked(spawn).mock.calls.at(-1)?.[2]).toEqual({ stdio: ['ignore', 'pipe', 'pipe', 'ipc'] });
    child.emit('close', 0);
    await result;
  });

  it('keeps successful cache validation silent and preserves child failures', async () => {
    vi.stubEnv('XIRANG_LIKEC4_STALE_CHECK', '0');
    const stdout = vi.spyOn(console, 'log').mockImplementation(() => {});
    const stderr = vi.spyOn(console, 'error').mockImplementation(() => {});
    const child = Object.assign(new EventEmitter(), { stdout: new PassThrough(), stderr: new PassThrough() });
    vi.mocked(spawn).mockReturnValue(child as unknown as ReturnType<typeof spawn>);
    const success = runLikeC4(['validate', '/model', '--no-layout']);
    child.emit('close', 0);
    await success;
    expect(stdout).not.toHaveBeenCalled();
    expect(stderr).not.toHaveBeenCalled();
    const failure = runLikeC4(['validate', '/model', '--no-layout']);
    child.stderr.write('invalid model');
    child.emit('close', 1);
    await expect(failure).rejects.toThrow('LikeC4 exited with code 1');
    expect(stderr).toHaveBeenCalledWith('invalid model');
    expect(stdout).not.toHaveBeenCalled();
  });
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
  it('uses the deployed dist when workspace sources are absent from a production install', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-likec4-production-layout-'));
    dirs.push(root);
    const packagesRoot = path.join(root, 'packages');
    const distBin = path.join(packagesRoot, 'likec4', 'bin', 'likec4.mjs');
    await fs.mkdir(path.dirname(distBin), { recursive: true });
    await fs.mkdir(path.join(packagesRoot, 'likec4', 'dist'), { recursive: true });
    await fs.writeFile(distBin, '#!/usr/bin/env node\n');

    const layout: LikeC4Layout = {
      packagesRoot,
      distBin,
      tsxCli: path.join(root, 'node_modules', 'tsx', 'dist', 'cli.mjs'),
      cliSource: path.join(packagesRoot, 'likec4', 'src', 'cli', 'index.ts'),
    };

    expect(resolveLikeC4Command(['serve', '/tmp/x'], layout)).toEqual({
      argv: [distBin, 'serve', '/tmp/x'],
      mode: 'dist',
    });
  });

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
