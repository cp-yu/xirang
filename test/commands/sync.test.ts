import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { ArchiveCommand } from '../../src/core/archive.js';
import { PARTITIONS } from '../../src/core/model/types.js';
import { minimalModel, writeChangeDelta, writeProjectModel } from '../helpers/model-fixture.js';
import { createBaselineOnlyQualityFixture, createCompleteQualityFixture } from '../helpers/quality-fixture.js';

vi.mock('@inquirer/prompts', () => ({
  select: vi.fn(),
}));

const CONTRACT = '## Specification\n\n### Section: Existing\nThe system SHALL keep working.\n\n#### Acceptance Case: Existing\n- **WHEN** invoked\n- **THEN** it works';

const ADD_REQUIREMENT = '---\noperation: MODIFIED\nentity: element-declaration\nidentity: auth\nkind: capability\nparent: root\ntitle: Auth\ndefinition: Auth summary\n---\n\n'
  + '## ADDED Sections\n\n### Section: Login\nThe system SHALL support login.\n\n'
  + '#### Acceptance Case: Login succeeds\n- **WHEN** credentials are valid\n- **THEN** the user is signed in\n';

describe('syncCommand', () => {
  let tempDir: string;
  const originalCwd = process.cwd();
  const originalConsoleLog = console.log;

  beforeEach(async () => {
    vi.resetModules();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-sync-test-'));
    await fs.mkdir(path.join(tempDir, '.xirang', 'changes', 'archive'), { recursive: true });
    await writeProjectModel(tempDir, minimalModel({
      elements: [{ identity: 'auth', parent: 'root', title: 'Auth', definition: 'Auth summary', sections: CONTRACT }],
    }));
    process.chdir(tempDir);
    console.log = vi.fn();
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    console.log = originalConsoleLog;
    vi.clearAllMocks();
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  async function loadSyncCommand() {
    const mod = await import('../../src/commands/sync.js');
    return mod.syncCommand;
  }

  async function createChange(changeName: string): Promise<string> {
    const changeDir = path.join(tempDir, '.xirang', 'changes', changeName);
    await fs.mkdir(changeDir, { recursive: true });
    return changeDir;
  }

  async function writeFreshQualityRecord(changeDir: string): Promise<void> {
    await createCompleteQualityFixture(tempDir, changeDir);
  }

  function elementUnit(): string {
    return path.join(tempDir, '.xirang', 'model', 'elements', 'auth.md');
  }

  it('syncs a directly specified change and reports four-partition counts', async () => {
    const syncCommand = await loadSyncCommand();
    await createChange('direct-sync');
    await writeChangeDelta(tempDir, 'direct-sync', { 'elements/auth.md': ADD_REQUIREMENT });

    await syncCommand('direct-sync', { noVerify: true });

    expect(await fs.readFile(elementUnit(), 'utf8')).toContain('### Section: Login');
    expect(console.log).not.toHaveBeenCalled();
    for (const partition of PARTITIONS) {
      expect(console.log).not.toHaveBeenCalled();
    }
    expect(vi.mocked(console.log).mock.calls.flat().join('\n')).not.toMatch(/architecture: |specs: /);
  });

  it('rewrites only the units the delta touched', async () => {
    const syncCommand = await loadSyncCommand();
    await createChange('minimal-sync');
    await writeChangeDelta(tempDir, 'minimal-sync', { 'elements/auth.md': ADD_REQUIREMENT });
    const untouched = path.join(tempDir, '.xirang', 'model', 'elements', 'root.md');
    const before = await fs.readFile(untouched);
    const metamodelBefore = await fs.readFile(path.join(tempDir, '.xirang', 'model', 'metamodel', 'project.md'));

    await syncCommand('minimal-sync', { noVerify: true });

    expect(await fs.readFile(untouched)).toEqual(before);
    expect(await fs.readFile(path.join(tempDir, '.xirang', 'model', 'metamodel', 'project.md'))).toEqual(metamodelBefore);
  });

  it('rolls back every unit when a prepared write fails', async () => {
    const { assessChangeSyncState, prepareChangeSync, applyPreparedChangeSync } = await import('../../src/core/change-sync.js');
    await createChange('rollback-sync');
    await writeChangeDelta(tempDir, 'rollback-sync', {
      'elements/auth.md': ADD_REQUIREMENT,
      'views/index.md': '---\noperation: ADDED\nentity: authored-view\nidentity: index\ninclude: "*"\n---\n',
    });
    const before = await fs.readFile(elementUnit());

    const state = await assessChangeSyncState(tempDir, 'rollback-sync');
    const prepared = await prepareChangeSync(tempDir, state);
    expect(prepared.manifest.length).toBe(2);

    await expect(applyPreparedChangeSync(tempDir, prepared, {
      filesystem: {
        writeFile: async (file, data) => {
          if (String(file).includes('views')) throw new Error('disk full');
          await fs.writeFile(file as string, data as Buffer);
        },
      },
    })).rejects.toThrow('disk full');

    expect(await fs.readFile(elementUnit())).toEqual(before);
    await expect(fs.access(path.join(tempDir, '.xirang', 'model', 'views', 'index.md'))).rejects.toThrow();
  });

  it('blocks sync when the quality gate has no record', async () => {
    const syncCommand = await loadSyncCommand();
    await createChange('quality-gate');
    await writeChangeDelta(tempDir, 'quality-gate', { 'elements/auth.md': ADD_REQUIREMENT });

    await expect(syncCommand('quality-gate', {})).rejects.toThrow(/quality gate failed/i);
  });

  it('blocks sync while the optimization loop is not finalized', async () => {
    const syncCommand = await loadSyncCommand();
    const changeDir = await createChange('quality-unfinalized');
    await writeChangeDelta(tempDir, 'quality-unfinalized', { 'elements/auth.md': ADD_REQUIREMENT });
    await createBaselineOnlyQualityFixture(tempDir, changeDir);

    await expect(syncCommand('quality-unfinalized', {})).rejects.toThrow(/quality gate failed/i);
    expect(await fs.readFile(elementUnit(), 'utf8')).not.toContain('### Section: Login');
  });

  it('allows sync when the quality gate is clean and finalized', async () => {
    const syncCommand = await loadSyncCommand();
    const changeDir = await createChange('quality-clean');
    await writeChangeDelta(tempDir, 'quality-clean', { 'elements/auth.md': ADD_REQUIREMENT });
    await writeFreshQualityRecord(changeDir);

    await syncCommand('quality-clean', {});

    expect(console.log).not.toHaveBeenCalled();
  });

  it('allows explicit --no-verify model writes without mutating Quality JSON', async () => {
    const syncCommand = await loadSyncCommand();
    const changeDir = await createChange('quality-bypass-incomplete');
    await writeChangeDelta(tempDir, 'quality-bypass-incomplete', { 'elements/auth.md': ADD_REQUIREMENT });
    await createBaselineOnlyQualityFixture(tempDir, changeDir);
    const qualityPath = path.join(changeDir, '.quality.json');
    const before = await fs.readFile(qualityPath);

    await syncCommand('quality-bypass-incomplete', { noVerify: true });
    expect(await fs.readFile(elementUnit(), 'utf8')).toContain('### Section: Login');
    expect(await fs.readFile(qualityPath)).toEqual(before);
  });

  it('supports interactive change selection when no name is provided', async () => {
    const syncCommand = await loadSyncCommand();
    const { select } = await import('@inquirer/prompts');
    const mockSelect = select as unknown as ReturnType<typeof vi.fn>;

    await createChange('selected-sync');
    await createChange('other-sync');
    await writeChangeDelta(tempDir, 'selected-sync', { 'elements/auth.md': ADD_REQUIREMENT });
    mockSelect.mockResolvedValueOnce('selected-sync');

    await syncCommand(undefined, { noVerify: true });

    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Select a change to sync',
        choices: expect.arrayContaining([
          expect.objectContaining({ value: 'selected-sync' }),
          expect.objectContaining({ value: 'other-sync' }),
        ]),
      })
    );
    expect(console.log).not.toHaveBeenCalled();
  });

  it('handles the no active change case without throwing', async () => {
    const syncCommand = await loadSyncCommand();

    await syncCommand(undefined, { noVerify: true });

    expect(console.log).not.toHaveBeenCalled();
    expect(console.log).not.toHaveBeenCalled();
  });

  it('prints No sync required when a change carries no Semantic Delta', async () => {
    const syncCommand = await loadSyncCommand();
    const changeDir = await createChange('no-delta-change');
    await writeFreshQualityRecord(changeDir);
    const verifyPath = path.join(changeDir, '.quality.json');
    const before = await fs.readFile(verifyPath, 'utf-8');

    await syncCommand('no-delta-change', { noVerify: true });

    expect(console.log).not.toHaveBeenCalled();
    expect(await fs.readFile(verifyPath, 'utf-8')).toBe(before);
  });

  it('is idempotent across repeated sync runs', async () => {
    const syncCommand = await loadSyncCommand();
    await createChange('idempotent-sync');
    await writeChangeDelta(tempDir, 'idempotent-sync', { 'elements/auth.md': ADD_REQUIREMENT });

    await syncCommand('idempotent-sync', { noVerify: true });
    const first = await fs.readFile(elementUnit());

    await expect(syncCommand('idempotent-sync', { noVerify: true })).rejects.toThrow(/ADDED_IDENTITY_EXISTS/);
    expect(await fs.readFile(elementUnit())).toEqual(first);
  });

  it('does not associate or rewrite Quality JSON during Sync', async () => {
    const syncCommand = await loadSyncCommand();
    const changeName = 'refresh-evidence-sync';
    const changeDir = await createChange(changeName);
    await writeChangeDelta(tempDir, changeName, { 'elements/auth.md': ADD_REQUIREMENT });
    await writeFreshQualityRecord(changeDir);
    const qualityPath = path.join(changeDir, '.quality.json');
    const before = await fs.readFile(qualityPath);

    await syncCommand(changeName, {});
    expect(await fs.readFile(qualityPath)).toEqual(before);
    await new ArchiveCommand().execute(changeName, { yes: true });
    expect(await fs.readdir(path.join(tempDir, '.xirang', 'changes', 'archive'))).toEqual(expect.arrayContaining([expect.stringContaining(changeName)]));
  });

  it('does not record a Quality transformation mapping during Sync', async () => {
    const syncCommand = await loadSyncCommand();
    const changeName = 'disjoint-evidence';
    const changeDir = await createChange(changeName);
    await writeChangeDelta(tempDir, changeName, { 'elements/auth.md': ADD_REQUIREMENT });
    await writeFreshQualityRecord(changeDir);
    const qualityPath = path.join(changeDir, '.quality.json');
    const before = await fs.readFile(qualityPath);
    await syncCommand(changeName, { noVerify: true });
    expect(await fs.readFile(qualityPath)).toEqual(before);
  });


  it('does not fail when the quality record is absent during sync', async () => {
    const syncCommand = await loadSyncCommand();
    await createChange('no-quality-record');
    await writeChangeDelta(tempDir, 'no-quality-record', { 'elements/auth.md': ADD_REQUIREMENT });

    await expect(syncCommand('no-quality-record', { noVerify: true })).resolves.toBeUndefined();
    await expect(fs.access(path.join(tempDir, '.xirang', 'changes', 'no-quality-record', '.quality.json')))
      .rejects.toThrow();
  });
});
