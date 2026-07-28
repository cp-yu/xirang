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

  it('reports deterministic formal dependencies by stable identity without writing', async () => {
    const before = await fs.readFile(path.join(modelRoot, 'elements', 'old.id.md'), 'utf8');
    const byId = await runCLI(['arch', 'plan-remove', 'old.id', '--json'], { cwd: root });

    expect(byId.exitCode).toBe(0);
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

  it('classifies explicitly removed dependencies as Handled and keeps the rest unresolved', async () => {
    await writeChangeDelta(root, 'replace-old', {
      'elements/new.id.md': '---\noperation: ADDED\nentity: element-declaration\nidentity: new.id\nkind: capability\nparent: project.root\ntitle: New\ndefinition: New summary\n---\n',
      'relationships/invokes.yaml': 'relationships:\n  - operation: REMOVED\n    source: consumer.id\n    kind: invokes\n    target: old.id\n',
    });

    const result = await runCLI(['arch', 'plan-remove', 'old.id', '--change', 'replace-old', '--json'], { cwd: root });

    expect(result.exitCode).toBe(0);
    const json = JSON.parse(result.stdout);
    expect(json.handled).toEqual([
      expect.objectContaining({ type: 'relationship', identity: 'relationship:consumer.id|invokes|old.id' }),
    ]);
    expect(json.unresolved).toEqual([
      expect.objectContaining({ type: 'descendant', identity: 'element:child.id' }),
    ]);
    expect(json.requiredCount).toBe(1);
  });
});
