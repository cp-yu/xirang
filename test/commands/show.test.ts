import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { runCLI } from '../helpers/run-cli.js';
import { minimalModel, writeChangeDelta, writeProjectModel } from '../helpers/model-fixture.js';

describe('top-level show command', () => {
  const projectRoot = process.cwd();
  const testDir = path.join(projectRoot, 'test-show-command-tmp');
  const changesDir = path.join(testDir, '.xirang', 'changes');

  beforeEach(async () => {
    await fs.mkdir(changesDir, { recursive: true });
    await writeProjectModel(testDir, minimalModel());

    const changeContent = `# Change: Demo\n\n## Why\nBecause reasons.\n\n## What Changes\nAdd authentication capability.\n`;
    const changeDir = await writeChangeDelta(testDir, 'demo', {
      'elements/auth.md': '---\noperation: ADDED\nentity: element-declaration\nidentity: auth\nkind: capability\nparent: root\ntitle: Auth\ndefinition: Authentication capability.\n---\n',
    });
    await fs.writeFile(path.join(changeDir, 'proposal.md'), changeContent, 'utf-8');
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('prints hint and non-zero exit when no args and non-interactive', async () => {
    const result = await runCLI(['show'], {
      cwd: testDir,
      env: { XIRANG_INTERACTIVE: '0' },
    });
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain('Nothing to show.');
    expect(result.stderr).toContain('xirang show <change>');
    expect(result.stderr).not.toContain('xirang change show');
  });

  it('auto-detects change id and supports --json', async () => {
    const result = await runCLI(['show', 'demo', '--json'], { cwd: testDir });
    expect(result.exitCode).toBe(0);
    const json = JSON.parse(result.stdout);
    expect(json).toEqual({
      id: 'demo',
      title: 'Demo',
      valid: true,
      summary: { total: 1, ADDED: 1, MODIFIED: 0, REMOVED: 0 },
      entries: [{ kind: 'element-declaration', identity: 'auth', operation: 'ADDED' }],
      diagnostics: [],
    });
  });

  it('returns invalid compiler diagnostics through top-level show JSON', async () => {
    await writeChangeDelta(testDir, 'invalid', {
      'elements/ghost.md': '---\noperation: REMOVED\nentity: element-declaration\nidentity: ghost\n---\n',
    });
    await fs.writeFile(path.join(changesDir, 'invalid', 'proposal.md'), '## Why\nInvalid compiler fixture.\n');

    const result = await runCLI(['show', 'invalid', '--json'], { cwd: testDir });

    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      id: 'invalid',
      valid: false,
      diagnostics: [expect.objectContaining({ code: 'REMOVED_IDENTITY_MISSING' })],
      entries: expect.any(Array),
    });
  });

  it('ignores legacy proposal and change-local specs as semantic sources', async () => {
    const changeDir = await writeChangeDelta(testDir, 'legacy-noise', {
      'elements/session.md': '---\noperation: ADDED\nentity: element-declaration\nidentity: session\nkind: capability\nparent: root\ntitle: Session\ndefinition: Session capability.\n---\n',
    });
    await fs.writeFile(path.join(changeDir, 'proposal.md'), [
      '## Why',
      'Verify legacy text is non-normative.',
      '',
      '## ADDED Requirements',
      '### Requirement: Proposal-only legacy behavior',
    ].join('\n'));
    const legacySpec = path.join(changeDir, 'specs', 'legacy', 'spec.md');
    await fs.mkdir(path.dirname(legacySpec), { recursive: true });
    await fs.writeFile(legacySpec, '## ADDED Requirements\n\n### Requirement: Spec-only legacy behavior\n');

    const shown = await runCLI(['show', 'legacy-noise', '--json'], { cwd: testDir });
    expect(shown.exitCode).toBe(0);
    expect(JSON.parse(shown.stdout)).toMatchObject({
      summary: { total: 1, ADDED: 1, MODIFIED: 0, REMOVED: 0 },
      entries: [{ kind: 'element-declaration', identity: 'session', operation: 'ADDED' }],
    });

    const listed = await runCLI(['list', '--json'], { cwd: testDir });
    expect(listed.exitCode).toBe(0);
    const item = JSON.parse(listed.stdout).changes.find((change: { name: string }) => change.name === 'legacy-noise');
    expect(item).toMatchObject({ name: 'legacy-noise', deltaCount: 1 });
  });

  it('does not register the removed change command group', async () => {
    const result = await runCLI(['change', 'list'], { cwd: testDir });

    expect(result.exitCode).not.toBe(0);
    expect(`${result.stdout}\n${result.stderr}`).toContain("unknown command 'change'");
  });

  it('prints nearest matches when not found', async () => {
    const result = await runCLI(['show', 'unknown-item'], { cwd: testDir });
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("Unknown item 'unknown-item'");
    expect(result.stderr).toContain('Did you mean:');
  });
});
