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

  it('projects complete source-file model text and existing plan files for review', async () => {
    await writeProjectModel(testDir, minimalModel({
      relationshipKinds: [{ identity: 'invokes' }],
      elements: [{ identity: 'old', kind: 'capability', parent: 'root' }],
    }));
    const changeDir = await writeChangeDelta(testDir, 'review', {
      'elements/auth.md': '---\noperation: ADDED\nentity: element-declaration\nidentity: auth\nkind: capability\nparent: root\ntitle: Auth\ndefinition: Authentication capability.\n---\n',
      'elements/old.md': '---\noperation: REMOVED\nentity: element-declaration\nidentity: old\n---\n',
      'relationships/custom-file.yaml': 'relationships:\n  - operation: ADDED\n    source: root\n    kind: invokes\n    target: auth\n  - operation: ADDED\n    source: auth\n    kind: invokes\n    target: root\n',
    });
    await fs.writeFile(path.join(changeDir, 'proposal.md'), '# Change: Review\n');
    await fs.writeFile(path.join(changeDir, 'design.md'), 'Decision text.\n');

    const result = await runCLI(['show', 'review', '--review', '--json'], { cwd: testDir });
    expect(result.exitCode).toBe(0);
    const json = JSON.parse(result.stdout);
    expect(json).toMatchObject({ id: 'review', valid: true });
    expect(json.sources).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'elements/auth.md', before: '', after: expect.stringContaining('identity: auth'), entries: expect.arrayContaining([
        expect.objectContaining({ identity: 'auth', operation: 'ADDED' }),
      ]) }),
      expect.objectContaining({ path: 'elements/old.md', before: expect.stringContaining('identity: old'), after: '', entries: expect.arrayContaining([
        expect.objectContaining({ identity: 'old', operation: 'REMOVED' }),
      ]) }),
      expect.objectContaining({ path: 'relationships/custom-file.yaml', after: expect.stringContaining('target: auth'), entries: expect.arrayContaining([
        expect.objectContaining({ identity: expect.any(String) }),
      ]) }),
    ]));
    const relationships = json.sources.find((source: { path: string }) => source.path === 'relationships/custom-file.yaml');
    expect(relationships.entries).toHaveLength(2);
    expect(relationships.after.match(/source: auth/g)).toHaveLength(1);
    expect(relationships.entries[0]).not.toHaveProperty('after');
    expect(json.plans).toEqual([
      { path: 'proposal.md', content: '# Change: Review\n' },
      { path: 'design.md', content: 'Decision text.\n' },
    ]);
  });

  it('keeps unchanged Sections in one complete source-level projection', async () => {
    await writeProjectModel(testDir, minimalModel({ elements: [{ identity: 'item', sections:
      '## Specification\n\n### Section: Edited\n\nItem SHALL keep old text.\n\n### Section: Context\n\nItem SHALL keep context.' }] }));
    const directory = await writeChangeDelta(testDir, 'complete', {
      'elements/custom.md': '---\nentity: element-declaration\nidentity: item\nkind: capability\nparent: root\ntitle: Item\ndefinition: Updated definition.\noperation: MODIFIED\n---\n\n## MODIFIED Sections\n\n### Section: Edited\n\nItem SHALL use new text.\n',
    });
    await fs.writeFile(path.join(directory, 'proposal.md'), '# Change: Complete\n');
    const result = await runCLI(['show', 'complete', '--review', '--json'], { cwd: testDir });
    const sources = JSON.parse(result.stdout).sources;
    expect(sources).toHaveLength(1);
    expect(sources[0].entries).toHaveLength(2);
    expect(sources[0].after.match(/identity: item/g)).toHaveLength(1);
    expect(sources[0].after).toContain('Item SHALL use new text.');
    expect(sources[0].before).toContain('Item SHALL keep old text.');
    expect(sources[0].before).toContain('Item SHALL keep context.');
    expect(sources[0].after).toContain('Item SHALL keep context.');
  });

  it('does not expose partial model content for invalid review projections', async () => {
    const changeDir = await writeChangeDelta(testDir, 'invalid-review', {
      'elements/ghost.md': '---\noperation: REMOVED\nentity: element-declaration\nidentity: ghost\n---\n',
    });
    await fs.writeFile(path.join(changeDir, 'proposal.md'), '## Why\nInvalid.\n');
    const result = await runCLI(['show', 'invalid-review', '--review', '--json'], { cwd: testDir });
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe('');
    expect(JSON.parse(result.stderr).issues.length).toBeGreaterThan(0);
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
    });
  });

  it('returns invalid compiler diagnostics through top-level show JSON', async () => {
    await writeChangeDelta(testDir, 'invalid', {
      'elements/ghost.md': '---\noperation: REMOVED\nentity: element-declaration\nidentity: ghost\n---\n',
    });
    await fs.writeFile(path.join(changesDir, 'invalid', 'proposal.md'), '## Why\nInvalid compiler fixture.\n');

    const result = await runCLI(['show', 'invalid', '--json'], { cwd: testDir });

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe('');
    expect(JSON.parse(result.stderr).issues).toContainEqual(expect.objectContaining({ code: 'REMOVED_IDENTITY_MISSING' }));
  });

  it('ignores legacy proposal and change-local specs as semantic sources', async () => {
    const changeDir = await writeChangeDelta(testDir, 'legacy-noise', {
      'elements/session.md': '---\noperation: ADDED\nentity: element-declaration\nidentity: session\nkind: capability\nparent: root\ntitle: Session\ndefinition: Session capability.\n---\n',
    });
    await fs.writeFile(path.join(changeDir, 'proposal.md'), [
      '## Why',
      'Verify legacy text is non-normative.',
      '',
      '## ADDED Sections',
      '### Section: Proposal-only legacy behavior',
    ].join('\n'));
    const legacySpec = path.join(changeDir, 'specs', 'legacy', 'spec.md');
    await fs.mkdir(path.dirname(legacySpec), { recursive: true });
    await fs.writeFile(legacySpec, '## ADDED Sections\n\n### Section: Spec-only legacy behavior\n');

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
