import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ViewCommand, type ViewLauncher } from '../../src/core/view.js';
import { validateArchitecture } from '../../src/utils/architecture-validator.js';
import { readLikeC4Architecture } from '../../src/utils/likec4-reader.js';

const browserFixtureRoot = path.resolve(import.meta.dirname, '..', 'fixtures', 'spec-browser');

describe('ViewCommand', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'opsx-view-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('starts the embedded LikeC4 view for an OPSX project', async () => {
    const architectureDir = path.join(tempDir, '.opsx', 'architecture');
    await fs.mkdir(architectureDir, { recursive: true });
    const launch = vi.fn<ViewLauncher>().mockResolvedValue(undefined);

    await new ViewCommand(launch).execute(tempDir);

    expect(launch).toHaveBeenCalledOnce();
    expect(launch).toHaveBeenCalledWith({
      projectRoot: tempDir,
      architectureDir,
      port: undefined,
      specRegistryFile: expect.stringContaining('opsx-spec-registry.json'),
    });
  });

  it('passes a custom port to the embedded server', async () => {
    const architectureDir = path.join(tempDir, '.opsx', 'architecture');
    await fs.mkdir(architectureDir, { recursive: true });
    const launch = vi.fn<ViewLauncher>().mockResolvedValue(undefined);

    await new ViewCommand(launch).execute(tempDir, { port: 4321 });

    expect(launch).toHaveBeenCalledWith({
      projectRoot: tempDir,
      architectureDir,
      port: 4321,
      specRegistryFile: expect.stringContaining('opsx-spec-registry.json'),
    });
  });

  it('discovers the nearest OPSX project from a nested directory', async () => {
    const outerArchitecture = path.join(tempDir, '.opsx', 'architecture');
    const innerRoot = path.join(tempDir, 'packages', 'feature');
    const innerArchitecture = path.join(innerRoot, '.opsx', 'architecture');
    const nestedDir = path.join(innerRoot, 'src', 'nested');
    await fs.mkdir(outerArchitecture, { recursive: true });
    await fs.mkdir(innerArchitecture, { recursive: true });
    await fs.mkdir(nestedDir, { recursive: true });
    const launch = vi.fn<ViewLauncher>().mockResolvedValue(undefined);

    await new ViewCommand(launch).execute(nestedDir);

    expect(launch).toHaveBeenCalledWith({
      projectRoot: innerRoot,
      architectureDir: innerArchitecture,
      port: undefined,
      specRegistryFile: expect.stringContaining('opsx-spec-registry.json'),
    });
  });

  it('passes a sorted immutable Spec registry snapshot to the server lifecycle', async () => {
    const architectureDir = path.join(tempDir, '.opsx', 'architecture');
    await fs.mkdir(architectureDir, { recursive: true });
    await fs.mkdir(path.join(tempDir, '.opsx', 'specs', 'zeta'), { recursive: true });
    await fs.mkdir(path.join(tempDir, '.opsx', 'specs', 'alpha'), { recursive: true });
    await fs.writeFile(path.join(tempDir, '.opsx', 'specs', 'zeta', 'spec.md'), '---\nelement: payment.authorize\n---\n');
    await fs.writeFile(path.join(tempDir, '.opsx', 'specs', 'alpha', 'spec.md'), '---\nelement: payment.authorize\n---\n');
    let snapshot: unknown;
    const launch: ViewLauncher = async options => {
      snapshot = JSON.parse(await fs.readFile(options.specRegistryFile, 'utf8'));
    };

    await new ViewCommand(launch).execute(tempDir);

    expect(snapshot).toEqual({
      version: 1,
      elements: {
        'payment.authorize': [
          '.opsx/specs/alpha/spec.md',
          '.opsx/specs/zeta/spec.md',
        ],
      },
    });
  });

  it('fails without launching when no OPSX project exists', async () => {
    const launch = vi.fn<ViewLauncher>().mockResolvedValue(undefined);

    await expect(new ViewCommand(launch).execute(tempDir)).rejects.toThrow(
      '未找到 OPSX 项目',
    );
    expect(launch).not.toHaveBeenCalled();
  });

  it('uses a complete v1 Semantic Model for the browser fixture', async () => {
    const architecture = await readLikeC4Architecture(browserFixtureRoot);
    const validation = await validateArchitecture(browserFixtureRoot, architecture);

    expect(architecture.profile).toBe('v1');
    expect(architecture.elements).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'project.root',
        kind: 'project',
        parent: null,
        children: ['browser.long', 'browser.multi', 'browser.none', 'browser.single'],
      }),
      expect.objectContaining({ id: 'browser.none', kind: 'capability', parent: 'project.root' }),
      expect.objectContaining({ id: 'browser.single', kind: 'capability', parent: 'project.root' }),
      expect.objectContaining({ id: 'browser.multi', kind: 'capability', parent: 'project.root' }),
      expect.objectContaining({ id: 'browser.long', kind: 'capability', parent: 'project.root' }),
    ]));
    expect(validation).toEqual({ success: true, errors: [], warnings: [] });
  });
});
