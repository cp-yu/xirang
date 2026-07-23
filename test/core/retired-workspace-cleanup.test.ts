import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { cleanupLegacyArtifacts, detectLegacyArtifacts } from '../../src/core/legacy-cleanup.js';
import { SetupCommand } from '../../src/core/setup.js';

describe('retired OPSX workspace cleanup', () => {
  let root: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'opsx-retired-workspace-'));
    await fs.mkdir(path.join(root, '.opsx'), { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it('detects only the explicit retired workspace list', async () => {
    for (const name of ['bootstrap', 'bootstrap-history', 'migration-candidate', 'bootstrap-notes']) {
      await fs.mkdir(path.join(root, '.opsx', name), { recursive: true });
    }

    const detection = await detectLegacyArtifacts(root);

    expect(detection.retiredWorkspaces).toEqual([
      '.opsx/bootstrap',
      '.opsx/bootstrap-history',
      '.opsx/migration-candidate',
    ]);
    expect(detection.retiredWorkspaces).not.toContain('.opsx/bootstrap-notes');
  });

  it('requires explicit confirmation before setup moves a retired workspace', async () => {
    const retired = path.join(root, '.opsx', 'bootstrap');
    await fs.mkdir(retired, { recursive: true });
    await fs.writeFile(path.join(retired, 'state.yaml'), 'state\n');

    const setup = new SetupCommand({ tools: 'none', interactive: false });
    await expect(setup.execute(root)).rejects.toThrow(/cleanup confirmation/);
    await expect(fs.readFile(path.join(retired, 'state.yaml'), 'utf8')).resolves.toBe('state\n');
  });

  it('moves retired workspaces into one history entry with a manifest', async () => {
    await fs.mkdir(path.join(root, '.opsx', 'bootstrap'), { recursive: true });
    await fs.writeFile(path.join(root, '.opsx', 'bootstrap', 'state.yaml'), 'state\n');
    await fs.mkdir(path.join(root, '.opsx', 'migration-candidate'), { recursive: true });
    await fs.writeFile(path.join(root, '.opsx', 'migration-candidate', 'model.c4'), 'model {}\n');

    const detection = await detectLegacyArtifacts(root);
    const result = await cleanupLegacyArtifacts(root, detection);

    expect(result.archivedWorkspaces).toEqual([
      '.opsx/bootstrap',
      '.opsx/migration-candidate',
    ]);
    const legacyEntries = await fs.readdir(path.join(root, '.opsx', 'history'));
    expect(legacyEntries).toHaveLength(1);
    const history = path.join(root, '.opsx', 'history', legacyEntries[0]);
    expect(await fs.readFile(path.join(history, 'bootstrap', 'state.yaml'), 'utf8')).toBe('state\n');
    expect(await fs.readFile(path.join(history, 'migration-candidate', 'model.c4'), 'utf8')).toBe('model {}\n');
    const manifest = await fs.readFile(path.join(history, 'manifest.yaml'), 'utf8');
    expect(manifest).toContain('source: .opsx/bootstrap');
    expect(manifest).toContain('source: .opsx/migration-candidate');
  });
});
