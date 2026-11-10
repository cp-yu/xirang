import { promises as fs } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { runCLI } from '../helpers/run-cli.js';
import { writeChangeDelta, writeProjectModel } from '../helpers/model-fixture.js';

describe('arch plan-remove command', () => {
  const root = path.join(process.cwd(), 'test-arch-plan-remove-tmp');
  const modelRoot = path.join(root, '.xirang', 'model');

  beforeEach(async () => {
    await writeProjectModel(root, {
      elementKinds: [
        { identity: 'project', root: true, children: ['capability'] },
        { identity: 'capability', parents: ['project', 'capability'] },
      ],
      relationshipKinds: [{ identity: 'invokes' }],
      elements: [
        { identity: 'project.root', kind: 'project', parent: null, title: 'Root', definition: 'Root summary' },
        { identity: 'old.id', parent: 'project.root', title: 'Old', definition: 'Old summary' },
        { identity: 'child.id', parent: 'old.id', title: 'Child', definition: 'Child summary' },
        { identity: 'consumer.id', parent: 'project.root', title: 'Consumer', definition: 'Consumer summary' },
      ],
      relationships: [{ source: 'consumer.id', kind: 'invokes', target: 'old.id' }],
    });
  });

  afterEach(async () => fs.rm(root, { recursive: true, force: true }));

  it.each([false, true])('reports deterministic formal dependencies and diagnostics without writing (warning=%s)', async warning => {
    if (warning) await fs.rename(path.join(modelRoot, 'metamodel/project.md'), path.join(modelRoot, 'views/project.md'));
    const before = await fs.readFile(path.join(modelRoot, 'elements', 'old.id.md'), 'utf8');
    const byId = await runCLI(['arch', 'plan-remove', 'old.id', '--json'], { cwd: root });

    expect(byId.exitCode).toBe(0);
    if (warning) {
      expect(JSON.parse(byId.stderr)).toMatchObject({ code: 'ENTITY_PARTITION_MISMATCH', message: expect.stringContaining('views/project.md') });
    } else expect(byId.stderr).toBe('');
    expect(byId.stdout).not.toContain('ENTITY_PARTITION_MISMATCH');
    const idResult = JSON.parse(byId.stdout);
    expect(idResult.subject).toEqual({ id: 'old.id', title: 'Old' });
    expect(idResult.subject).not.toHaveProperty('fqn');
    expect(idResult.unresolved).toEqual([
      { type: 'descendant', identity: 'element:child.id', detail: 'child.id remains contained by old.id' },
      { type: 'relationship', identity: 'relationship:consumer.id|invokes|old.id', detail: 'consumer.id -[invokes]-> old.id' },
    ]);
    expect(idResult.unresolved.map((item: { type: string }) => item.type))
      .not.toEqual(expect.arrayContaining(['spec-binding', 'reference']));
    expect(idResult.requiredCount).toBe(idResult.unresolved.length);
    expect(await fs.readFile(path.join(modelRoot, 'elements', 'old.id.md'), 'utf8')).toBe(before);
  });

  it('returns nonzero for an unknown identity', async () => {
    const result = await runCLI(['arch', 'plan-remove', 'ghost.id', '--json'], { cwd: root });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Element not found: ghost.id');
  });

  it('reports compilation errors on stderr with a failing exit status in either encoding', async () => {
    await writeChangeDelta(root, 'invalid-parent', {
      'elements/new.id.md': '---\noperation: ADDED\nentity: element-declaration\nidentity: new.id\nkind: capability\nparent: ghost.id\ntitle: New\ndefinition: New summary\n---\n',
    });
    for (const json of [false, true]) {
      const result = await runCLI(['arch', 'plan-remove', 'old.id', '--change', 'invalid-parent', ...(json ? ['--json'] : [])], { cwd: root });
      expect(result.exitCode).toBe(1);
      expect(result.stdout).not.toContain('MISSING_PARENT');
      const message = json ? JSON.parse(result.stderr).message : result.stderr;
      expect(message).toContain('MISSING_PARENT');
      expect(message).toContain('invalid-parent');
      expect(message).toContain('ghost.id');
    }
  });

  it.each([false, true])('classifies removed dependencies and separates real diagnostics (warning=%s)', async warning => {
    if (warning) await fs.rename(path.join(modelRoot, 'metamodel/project.md'), path.join(modelRoot, 'views/project.md'));
    await writeChangeDelta(root, 'replace-old', {
      'elements/new.id.md': '---\noperation: ADDED\nentity: element-declaration\nidentity: new.id\nkind: capability\nparent: project.root\ntitle: New\ndefinition: New summary\n---\n',
      'relationships/invokes.yaml': 'relationships:\n  - operation: REMOVED\n    source: consumer.id\n    kind: invokes\n    target: old.id\n',
    });

    for (const jsonMode of [false, true]) {
      const result = await runCLI(['arch', 'plan-remove', 'old.id', '--change', 'replace-old', ...(jsonMode ? ['--json'] : [])], { cwd: root });
      expect(result.exitCode).toBe(0);
      if (jsonMode) {
        const json = JSON.parse(result.stdout);
        expect(json.handled).toEqual([
          expect.objectContaining({ type: 'relationship', identity: 'relationship:consumer.id|invokes|old.id' }),
        ]);
        expect(json.unresolved).toEqual([
          expect.objectContaining({ type: 'descendant', identity: 'element:child.id' }),
        ]);
        expect(json.requiredCount).toBe(1);
      } else {
        expect(result.stdout).toContain('Required before target can validate: 1');
        expect(result.stdout).toContain('relationship:consumer.id|invokes|old.id');
        expect(result.stdout).toContain('element:child.id');
      }
      expect(result.stdout).not.toContain('ENTITY_PARTITION_MISMATCH');
      if (warning) {
        const message = jsonMode ? JSON.parse(result.stderr).message : result.stderr;
        expect(message).toContain('replace-old');
        expect(message).toContain('views/project.md');
        expect(message).toContain('ENTITY_PARTITION_MISMATCH');
      } else expect(result.stderr).toBe('');
    }
  });
});
