import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ChangeCommand } from '../../../src/commands/change.js';
import path from 'path';
import { promises as fs } from 'fs';
import os from 'os';
import { minimalModel, writeChangeDelta, writeProjectModel } from '../../helpers/model-fixture.js';

describe('ChangeCommand.show/validate', () => {
  let cmd: ChangeCommand;
  let changeName: string;
  let tempRoot: string;
  let originalCwd: string;

  beforeAll(async () => {
    cmd = new ChangeCommand();
    originalCwd = process.cwd();
    tempRoot = path.join(os.tmpdir(), `opsx-change-command-${Date.now()}`);
    await writeProjectModel(tempRoot, minimalModel());
    const changesDir = await writeChangeDelta(tempRoot, 'sample-change', {
      'elements/auth.md': '---\noperation: ADDED\nentity: element-declaration\nidentity: auth\nkind: capability\nparent: root\ntitle: Auth\ndefinition: Authentication capability.\n---\n',
    });
    const proposal = `# Change: Sample Change\n\n## Why\nConsistency in tests.\n\n## What Changes\nAdd authentication capability.`;
    await fs.writeFile(path.join(changesDir, 'proposal.md'), proposal, 'utf-8');
    const brokenDir = await writeChangeDelta(tempRoot, 'broken-change', {
      'elements/root.md': '---\noperation: ADDED\nentity: element-declaration\nidentity: root\nkind: project\nparent: null\ntitle: Duplicate root\ndefinition: Duplicate root.\n---\n',
    });
    await fs.writeFile(path.join(brokenDir, 'proposal.md'), proposal, 'utf-8');
    process.chdir(tempRoot);
    changeName = 'sample-change';
  });

  afterAll(async () => {
    process.chdir(originalCwd);
    await fs.rm(tempRoot, { recursive: true, force: true });
  });

  it('show --json prints the compiler-derived change view', async () => {
    const logs: string[] = [];
    const origLog = console.log;
    try {
      console.log = (msg?: any, ...args: any[]) => {
        logs.push([msg, ...args].filter(Boolean).join(' '));
      };

      await cmd.show(changeName, { json: true });

      const parsed = JSON.parse(logs.join('\n'));
      expect(parsed).toEqual({
        id: 'sample-change',
        title: 'Sample Change',
        valid: true,
        summary: { total: 1, ADDED: 1, MODIFIED: 0, REMOVED: 0 },
        entries: [{ kind: 'element-declaration', identity: 'auth', operation: 'ADDED' }],
        diagnostics: [],
      });
      expect(parsed).not.toHaveProperty('deltas');
    } finally {
      console.log = origLog;
    }
  });

  it('error when no change specified: prints available IDs', async () => {
    const logsErr: string[] = [];
    const origErr = console.error;
    try {
      console.error = (msg?: any, ...args: any[]) => {
        logsErr.push([msg, ...args].filter(Boolean).join(' '));
      };
      await cmd.show(undefined as unknown as string, { json: false } as any);
      // Should have set exit code and printed hint
      expect(process.exitCode).toBe(1);
      const errOut = logsErr.join('\n');
      expect(errOut).toMatch(/No change specified/);
      expect(errOut).toMatch(/Available IDs/);
    } finally {
      console.error = origErr;
      process.exitCode = 0;
    }
  });

  it('show --json returns compiler diagnostics for an invalid change', async () => {
    const logs: string[] = [];
    const origLog = console.log;
    try {
      console.log = (msg?: any, ...args: any[]) => {
        logs.push([msg, ...args].filter(Boolean).join(' '));
      };

      await cmd.show('broken-change', { json: true });

      const parsed = JSON.parse(logs.join('\n'));
      expect(parsed.valid).toBe(false);
      expect(parsed.diagnostics).toEqual(expect.arrayContaining([
        expect.objectContaining({ code: 'ADDED_IDENTITY_EXISTS', identity: 'root' }),
      ]));
    } finally {
      console.log = origLog;
    }
  });

  it('validate --strict --json returns a report with valid boolean', async () => {
    const logs: string[] = [];
    const origLog = console.log;
    try {
      console.log = (msg?: any, ...args: any[]) => {
        logs.push([msg, ...args].filter(Boolean).join(' '));
      };

      await cmd.validate(changeName, { strict: true, json: true });

      const output = logs.join('\n');
      const parsed = JSON.parse(output);
      expect(parsed).toHaveProperty('valid');
      expect(parsed).toHaveProperty('issues');
      expect(Array.isArray(parsed.issues)).toBe(true);
    } finally {
      console.log = origLog;
    }
  });
});
