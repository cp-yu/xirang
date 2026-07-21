import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ViewCommand, type ViewLauncher } from '../../src/core/view.js';

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
    });
  });

  it('fails without launching when no OPSX project exists', async () => {
    const launch = vi.fn<ViewLauncher>().mockResolvedValue(undefined);

    await expect(new ViewCommand(launch).execute(tempDir)).rejects.toThrow(
      '未找到 OPSX 项目',
    );
    expect(launch).not.toHaveBeenCalled();
  });
});
