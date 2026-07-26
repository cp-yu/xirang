import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import {
  computeEvidenceFingerprint,
  computeTasksFileHash,
} from '../../src/core/verify/freshness.js';
import type { VerifyResult } from '../../src/core/verify/types.js';
import { PARTITIONS } from '../../src/core/model/types.js';
import { minimalModel, writeChangeDelta, writeProjectModel } from '../helpers/model-fixture.js';

vi.mock('@inquirer/prompts', () => ({
  select: vi.fn(),
}));

const CONTRACT = '## Requirements\n\n### Requirement: Existing\nThe system SHALL keep working.\n\n#### Scenario: Existing\n- **WHEN** invoked\n- **THEN** it works';

const ADD_REQUIREMENT = '---\noperation: MODIFIED\nentity: element-declaration\nidentity: auth\nkind: capability\nparent: root\ntitle: Auth\nsummary: Auth summary\n---\n\n'
  + '## ADDED Requirements\n\n### Requirement: Login\nThe system SHALL support login.\n\n'
  + '#### Scenario: Login succeeds\n- **WHEN** credentials are valid\n- **THEN** the user is signed in\n';

describe('syncCommand', () => {
  let tempDir: string;
  const originalCwd = process.cwd();
  const originalConsoleLog = console.log;

  beforeEach(async () => {
    vi.resetModules();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'opsx-sync-test-'));
    await fs.mkdir(path.join(tempDir, '.xirang', 'changes', 'archive'), { recursive: true });
    await writeProjectModel(tempDir, minimalModel({
      elements: [{ identity: 'auth', parent: 'root', title: 'Auth', summary: 'Auth summary', requirements: CONTRACT }],
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

  async function writeFreshVerifyResult(changeDir: string): Promise<void> {
    await fs.writeFile(path.join(changeDir, 'tasks.md'), '- [x] verified\n', 'utf-8');
    await fs.mkdir(path.join(tempDir, 'src'), { recursive: true });
    await fs.writeFile(path.join(tempDir, 'src', 'sync-evidence.ts'), 'export const ok = true;\n', 'utf-8');
    const result: VerifyResult = {
      timestamp: new Date().toISOString(),
      result: 'PASS',
      issues: [],
      tasksFileHash: (await computeTasksFileHash(path.join(changeDir, 'tasks.md')))!,
      verificationContext: {
        contractVersion: '1.0',
        evidenceFiles: ['src/sync-evidence.ts'],
        evidenceFingerprint: (await computeEvidenceFingerprint(['src/sync-evidence.ts'], tempDir)).hash,
      },
      optimization: { status: 'NOT_NEEDED', attempts: [] },
    };
    await fs.writeFile(path.join(changeDir, '.verify-result.json'), JSON.stringify(result), 'utf-8');
  }

  function elementUnit(): string {
    return path.join(tempDir, '.xirang', 'model', 'elements', 'auth.md');
  }

  it('syncs a directly specified change and reports four-partition counts', async () => {
    const syncCommand = await loadSyncCommand();
    await createChange('direct-sync');
    await writeChangeDelta(tempDir, 'direct-sync', { 'elements/auth.md': ADD_REQUIREMENT });

    await syncCommand('direct-sync', { noVerify: true });

    expect(await fs.readFile(elementUnit(), 'utf8')).toContain('### Requirement: Login');
    expect(console.log).toHaveBeenCalledWith("Sync complete for 'direct-sync'.");
    for (const partition of PARTITIONS) {
      expect(console.log).toHaveBeenCalledWith(`${partition}: ${partition === 'elements' ? 1 : 0}`);
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

  it('blocks sync when the verify gate is missing', async () => {
    const syncCommand = await loadSyncCommand();
    await createChange('verify-gate');
    await writeChangeDelta(tempDir, 'verify-gate', { 'elements/auth.md': ADD_REQUIREMENT });

    await expect(syncCommand('verify-gate', {})).rejects.toThrow(/verify/i);
  });

  it('allows sync when the verify gate is fresh', async () => {
    const syncCommand = await loadSyncCommand();
    const changeDir = await createChange('verify-fresh');
    await writeFreshVerifyResult(changeDir);
    await writeChangeDelta(tempDir, 'verify-fresh', { 'elements/auth.md': ADD_REQUIREMENT });

    await syncCommand('verify-fresh', {});

    expect(console.log).toHaveBeenCalledWith("Sync complete for 'verify-fresh'.");
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
    expect(console.log).toHaveBeenCalledWith("Sync complete for 'selected-sync'.");
  });

  it('handles the no active change case without throwing', async () => {
    const syncCommand = await loadSyncCommand();

    await syncCommand(undefined, { noVerify: true });

    expect(console.log).toHaveBeenCalledWith('No active changes found.');
    expect(console.log).toHaveBeenCalledWith('No change selected. Aborting.');
  });

  it('prints No sync required when a change carries no Semantic Delta', async () => {
    const syncCommand = await loadSyncCommand();
    const changeDir = await createChange('no-delta-change');
    await writeFreshVerifyResult(changeDir);
    const verifyPath = path.join(changeDir, '.verify-result.json');
    const before = await fs.readFile(verifyPath, 'utf-8');

    await syncCommand('no-delta-change', { noVerify: true });

    expect(console.log).toHaveBeenCalledWith('No sync required.');
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

  it('rejects Scenario operation labels without changing the Formal unit', async () => {
    const syncCommand = await loadSyncCommand();
    await createChange('labelled-scenarios');
    await writeChangeDelta(tempDir, 'labelled-scenarios', {
      'elements/auth.md': ADD_REQUIREMENT.replace('#### Scenario: Login succeeds', '#### Scenario: [ADDED] Login succeeds'),
    });
    const before = await fs.readFile(elementUnit());

    await syncCommand('labelled-scenarios', { noVerify: true });

    expect(await fs.readFile(elementUnit())).not.toEqual(before);
    const report = await new (await import('../../src/core/validation/validator.js')).Validator()
      .validateChangeDeltaSpecs(path.join(tempDir, '.xirang', 'changes', 'labelled-scenarios'));
    expect(report.valid).toBe(false);
    expect(report.issues.some(issue => issue.message.includes('Unsupported Scenario operation metadata'))).toBe(true);
  });

  it('refreshes the evidence fingerprint after Semantic Model writes', async () => {
    const syncCommand = await loadSyncCommand();
    const changeName = 'refresh-evidence-sync';
    const changeDir = await createChange(changeName);
    await fs.writeFile(path.join(changeDir, 'tasks.md'), '- [x] verified\n', 'utf-8');
    await writeChangeDelta(tempDir, changeName, { 'elements/auth.md': ADD_REQUIREMENT });

    const evidenceFiles = [
      '.xirang/model/elements/auth.md',
      `.xirang/changes/${changeName}/elements/auth.md`,
    ];
    const before = await computeEvidenceFingerprint(evidenceFiles, tempDir);
    const verifyResult: VerifyResult = {
      timestamp: new Date().toISOString(),
      result: 'PASS',
      issues: [],
      tasksFileHash: (await computeTasksFileHash(path.join(changeDir, 'tasks.md')))!,
      verificationContext: {
        contractVersion: '1.0',
        evidenceFiles,
        evidenceFingerprint: before.hash,
        evidenceFingerprintEntries: before.entries,
      },
      optimization: { status: 'NOT_NEEDED', attempts: [] },
    };
    await fs.writeFile(path.join(changeDir, '.verify-result.json'), `${JSON.stringify(verifyResult, null, 2)}\n`, 'utf-8');

    await syncCommand(changeName, { noVerify: true });

    const refreshed = JSON.parse(await fs.readFile(path.join(changeDir, '.verify-result.json'), 'utf-8')) as VerifyResult;
    expect(refreshed.verificationContext.evidenceFingerprint).not.toBe(before.hash);
    const entry = (result: typeof before.entries, file: string) => result.find(item => item.path === file)?.hash;
    expect(entry(refreshed.verificationContext.evidenceFingerprintEntries!, '.xirang/model/elements/auth.md'))
      .not.toBe(entry(before.entries, '.xirang/model/elements/auth.md'));
    expect(entry(refreshed.verificationContext.evidenceFingerprintEntries!, `.xirang/changes/${changeName}/elements/auth.md`))
      .toBe(entry(before.entries, `.xirang/changes/${changeName}/elements/auth.md`));
  });

  it('does not rewrite the verify result when sync outputs do not overlap evidence entries', async () => {
    const syncCommand = await loadSyncCommand();
    const changeName = 'disjoint-evidence';
    const changeDir = await createChange(changeName);
    await writeFreshVerifyResult(changeDir);
    const before = await fs.readFile(path.join(changeDir, '.verify-result.json'), 'utf-8');
    await writeChangeDelta(tempDir, changeName, { 'elements/auth.md': ADD_REQUIREMENT });

    await syncCommand(changeName, { noVerify: true });

    expect(await fs.readFile(path.join(changeDir, '.verify-result.json'), 'utf-8')).toBe(before);
  });

  it('does not fail when .verify-result.json is absent during sync', async () => {
    const syncCommand = await loadSyncCommand();
    await createChange('no-verify-result');
    await writeChangeDelta(tempDir, 'no-verify-result', { 'elements/auth.md': ADD_REQUIREMENT });

    await expect(syncCommand('no-verify-result', { noVerify: true })).resolves.toBeUndefined();
  });
});
