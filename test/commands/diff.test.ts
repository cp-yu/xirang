import { promises as fs } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { runCLI } from '../helpers/run-cli.js';
import { writeChangeDelta, writeProjectModel } from '../helpers/model-fixture.js';

const FORMAL_CONTRACT = '## Requirements\n\n### Requirement: Existing behavior\nThe system SHALL return the existing result.\n\n#### Scenario: Existing scenario\n- **WHEN** the behavior runs\n- **THEN** the existing result is returned';

const ELEMENT_DELTA = '---\noperation: MODIFIED\nentity: element-declaration\nidentity: existing.id\nkind: capability\nparent: project.root\ntitle: Existing\nsummary: Changed summary\n---\n\n'
  + '## MODIFIED Requirements\n\n### Requirement: Existing behavior\nThe system SHALL return the changed result.\n\n'
  + '#### Scenario: Existing scenario\n- **WHEN** the behavior runs\n- **THEN** the changed result is returned\n';

describe('diff command', () => {
  const root = path.join(process.cwd(), 'test-diff-command-tmp');
  const changeDir = path.join(root, '.xirang', 'changes', 'change-a');

  beforeEach(async () => {
    await writeProjectModel(root, {
      elementKinds: [
        { identity: 'project', root: true, children: ['capability'] },
        { identity: 'capability', parents: ['project'] },
      ],
      relationshipKinds: [{ identity: 'invokes' }],
      elements: [
        { identity: 'project.root', kind: 'project', parent: null, title: 'Root', summary: 'Root summary' },
        { identity: 'existing.id', parent: 'project.root', title: 'Existing', summary: 'Existing summary', requirements: FORMAL_CONTRACT },
      ],
      views: [{ identity: 'index' }],
    });
    await writeChangeDelta(root, 'change-a', { 'elements/existing.id.md': ELEMENT_DELTA });
  });

  afterEach(async () => fs.rm(root, { recursive: true, force: true }));

  it('keeps the Diff IR free of partitions and filters text output by entity type', async () => {
    const jsonResult = await runCLI(['diff', '--change', 'change-a', '--json'], { cwd: root });
    const requirementOnly = await runCLI(['diff', '--change', 'change-a', '--entity', 'requirement'], { cwd: root });
    const declarationOnly = await runCLI(['diff', '--change', 'change-a', '--entity', 'element-declaration'], { cwd: root });

    expect(jsonResult.stderr).toBe('');
    expect(jsonResult.exitCode).toBe(0);
    const json = JSON.parse(jsonResult.stdout);
    expect(json).toMatchObject({ schemaVersion: '1', change: 'change-a', valid: true });
    expect(json.entries).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'requirement', identity: 'existing.id#Existing behavior' }),
      expect.objectContaining({ kind: 'element-declaration', identity: 'existing.id' }),
    ]));
    for (const entry of json.entries) expect(entry).not.toHaveProperty('scope');
    expect(Object.keys(json.summary).sort()).toEqual(['ADDED', 'MODIFIED', 'REMOVED', 'total']);

    expect(requirementOnly.stdout).toContain('requirement existing.id#Existing behavior');
    expect(requirementOnly.stdout).not.toContain('element-declaration existing.id');
    expect(declarationOnly.stdout).toContain('element-declaration existing.id');
    expect(declarationOnly.stdout).not.toContain('requirement existing.id#Existing behavior');
    expect(await fs.readdir(changeDir)).not.toContain('effective-change.md');
  });

  it('accepts comma-separated entity types and rejects unknown ones', async () => {
    const both = await runCLI(['diff', '--change', 'change-a', '--entity', 'element-declaration,requirement'], { cwd: root });
    expect(both.stdout).toContain('element-declaration existing.id');
    expect(both.stdout).toContain('requirement existing.id#Existing behavior');

    const unknown = await runCLI(['diff', '--change', 'change-a', '--entity', 'specs'], { cwd: root });
    expect(unknown.exitCode).toBe(1);
    expect(unknown.stderr).toContain("Unknown diff entity 'specs'");
    expect(unknown.stderr).toContain('element-declaration');

    const removedScope = await runCLI(['diff', '--change', 'change-a', '--scope', 'specs'], { cwd: root });
    expect(removedScope.exitCode).toBe(1);
    expect(removedScope.stderr).toContain("unknown option '--scope'");
  });

  it('reports Authored View differences', async () => {
    await writeChangeDelta(root, 'view-change', {
      'views/detail.md': '---\noperation: ADDED\nentity: authored-view\nidentity: detail\ninclude: "*"\n---\n',
      'views/index.md': '---\noperation: REMOVED\nentity: authored-view\nidentity: index\n---\n',
    });

    const result = await runCLI(['diff', '--change', 'view-change', '--json'], { cwd: root });
    const entries = JSON.parse(result.stdout).entries;

    expect(entries).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'authored-view', identity: 'detail', operation: 'ADDED' }),
      expect.objectContaining({ kind: 'authored-view', identity: 'index', operation: 'REMOVED' }),
    ]));

    const filtered = await runCLI(['diff', '--change', 'view-change', '--entity', 'authored-view'], { cwd: root });
    expect(filtered.stdout).toContain('authored-view detail');
  });

  it('writes deterministic reports and replaces stale success with a failed report', async () => {
    const first = await runCLI(['diff', '--change', 'change-a', '--write'], { cwd: root });
    const reportPath = path.join(changeDir, 'effective-change.md');
    expect(first.stderr).toBe('');
    const firstReport = await fs.readFile(reportPath, 'utf8');
    const second = await runCLI(['diff', '--change', 'change-a', '--write'], { cwd: root });
    const secondReport = await fs.readFile(reportPath, 'utf8');

    expect(first.exitCode).toBe(0);
    expect(second.exitCode).toBe(0);
    expect(secondReport).toBe(firstReport);
    expect(firstReport).toContain('Status: Passed');
    expect(firstReport).not.toContain('generatedAt');

    await fs.writeFile(path.join(changeDir, 'elements', 'ghost.md'),
      '---\noperation: MODIFIED\nentity: element-declaration\nidentity: ghost\nkind: capability\nparent: project.root\ntitle: Ghost\nsummary: Ghost\n---\n');
    const failed = await runCLI(['diff', '--change', 'change-a', '--write'], { cwd: root });
    const failedReport = await fs.readFile(reportPath, 'utf8');

    expect(failed.exitCode).toBe(1);
    expect(failedReport).toContain('Status: Failed');
    expect(failedReport).not.toBe(firstReport);
    expect(failedReport).toContain('MODIFIED_IDENTITY_MISSING');
  });
});
