import { promises as fs } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { applySemanticDelta, parseSemanticDelta } from '../../../src/core/model/delta.js';
import { parseSemanticModel, parseSemanticModelFiles, readModelTree } from '../../../src/core/model/parser.js';
import { serializeSemanticModel } from '../../../src/core/model/serializer.js';
import { writeMinimal } from '../../../src/core/model/sync-writer.js';
import { validateSemanticModel } from '../../../src/core/model/validator.js';
import type { SemanticModel } from '../../../src/core/model/types.js';
import { PERSPECTIVE_KIND } from '../../../src/core/templates/model-skeleton.js';
import { createModelRoot } from './fixtures.js';

const CAP_A = [
  '---',
  'entity: element-declaration',
  'identity: cap.a',
  'kind: capability',
  'parent: root',
  'title: A',
  'definition: First capability',
  '---',
  '',
  '## Requirements',
  '',
  '### Requirement: First',
  '',
  'SHALL come first.',
  '',
  '#### Scenario: One',
  '',
  '- THEN one',
  '',
  '#### Scenario: Two',
  '',
  '- THEN two',
  '',
  '### Requirement: Second',
  '',
  'SHALL come second.',
  '',
  '#### Scenario: Second case',
  '',
  '- THEN second',
  '',
].join('\n');

const MODEL: Record<string, string> = {
  'metamodel/project.md': '---\nentity: element-kind\nidentity: project\ncontract: optional\nroot: true\n---\n\nThe project root kind.\n',
  'metamodel/domain.md': '---\nentity: element-kind\nidentity: domain\ncontract: optional\n---\n',
  'metamodel/capability.md': '---\nentity: element-kind\nidentity: capability\ncontract: required\nparents:\n  - project\n---\n\nA capability of the project.\n',
  'metamodel/perspective.md': `---\nentity: element-kind\nidentity: perspective\ncontract: optional\n---\n\n${PERSPECTIVE_KIND.body}\n`,
  'metamodel/invokes.md': '---\nentity: relationship-kind\nidentity: invokes\nsourceKinds:\n  - capability\ntargetKinds:\n  - capability\n---\n',
  'elements/root.md': '---\nentity: element-declaration\nidentity: root\nkind: project\nparent: null\ntitle: Root\ndefinition: Project root\n---\n',
  'elements/cap.a.md': CAP_A,
  'elements/cap.b.md': '---\nentity: element-declaration\nidentity: cap.b\nkind: capability\nparent: root\ntitle: B\ndefinition: Second capability\n---\n\n## Requirements\n\n### Requirement: Only\n\nSHALL hold.\n\n#### Scenario: Only case\n\n- THEN it holds\n',
  'relationships/invokes.yaml': 'relationships:\n  - source: cap.a\n    kind: invokes\n    target: cap.b\n',
  'views/overview.md': '---\nentity: authored-view\nidentity: overview\ninclude: "*"\ntitle: Overview\n---\n',
};

const DELTA: Record<string, string> = {
  'elements/cap.a.md': [
    '---',
    'operation: MODIFIED',
    'entity: element-declaration',
    'identity: cap.a',
    'kind: capability',
    'parent: root',
    'title: A renamed',
    'definition: First capability',
    '---',
    '',
    '## ADDED Requirements',
    '',
    '### Requirement: Third',
    '',
    'SHALL come third.',
    '',
    '#### Scenario: Third case',
    '',
    '- THEN third',
    '',
    '## REMOVED Requirements',
    '',
    '### Requirement: Second',
    '',
  ].join('\n'),
  'elements/cap.c.md': [
    '---',
    'operation: ADDED',
    'entity: element-declaration',
    'identity: cap.c',
    'kind: capability',
    'parent: root',
    'title: C',
    'definition: Third capability',
    '---',
    '',
    '## ADDED Requirements',
    '',
    '### Requirement: Fresh',
    '',
    'SHALL hold.',
    '',
    '#### Scenario: Fresh case',
    '',
    '- THEN it holds',
    '',
  ].join('\n'),
  'relationships/invokes.yaml': 'relationships:\n  - operation: ADDED\n    source: cap.b\n    kind: invokes\n    target: cap.c\n',
};

async function applyTree(root: string, tree: Map<string, Buffer>): Promise<void> {
  const before = await readModelTree(root);
  for (const file of before.keys()) if (!tree.has(file)) await fs.rm(path.join(root, ...file.split('/')));
  for (const [file, bytes] of tree) {
    const target = path.join(root, ...file.split('/'));
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, bytes);
  }
}

/** Sorts collections and set-semantic list fields; keeps Requirement and Scenario order. */
function normalizeForComparison(model: SemanticModel): SemanticModel {
  const sortStrings = (values?: string[]): string[] | undefined => values && [...values].sort();
  const byIdentity = <T extends { identity: string }>(items: T[]): T[] =>
    [...items].sort((left, right) => (left.identity < right.identity ? -1 : 1));
  return {
    elements: [...model.elements].sort((left, right) =>
      (left.declaration.identity < right.declaration.identity ? -1 : 1)),
    elementKinds: byIdentity(model.elementKinds).map(kind => ({
      ...kind,
      ...(kind.parents ? { parents: sortStrings(kind.parents)! } : {}),
      ...(kind.children ? { children: sortStrings(kind.children)! } : {}),
    })),
    relationshipKinds: byIdentity(model.relationshipKinds).map(kind => ({
      ...kind,
      ...(kind.sourceKinds ? { sourceKinds: sortStrings(kind.sourceKinds)! } : {}),
      ...(kind.targetKinds ? { targetKinds: sortStrings(kind.targetKinds)! } : {}),
    })),
    relationships: [...model.relationships].sort((left, right) =>
      (`${left.source}${left.kind}${left.target}` < `${right.source}${right.kind}${right.target}` ? -1 : 1)),
    views: byIdentity(model.views).map(view => ({
      ...view,
      ...(Array.isArray(view.include) ? { include: sortStrings(view.include)! } : {}),
    })),
  };
}

describe('kernel pipeline end to end', () => {
  it('parses, applies, validates, rewrites minimally and reparses consistently', async () => {
    const root = await createModelRoot(MODEL);
    const changeRoot = await createModelRoot(DELTA);

    const previous = await parseSemanticModel(root);
    expect(previous.diagnostics).toEqual([]);
    expect(validateSemanticModel(previous.model)).toEqual([]);

    const change = await parseSemanticDelta(changeRoot);
    expect(change.diagnostics).toEqual([]);

    const applied = applySemanticDelta(previous.model, change.delta);
    expect(applied.diagnostics).toEqual([]);
    expect([...applied.touched].sort()).toEqual([
      'cap.a', 'cap.c', 'cap.b\u0000invokes\u0000cap.c',
    ].sort());
    expect(validateSemanticModel(applied.expected)).toEqual([]);

    const before = await readModelTree(root);
    const tree = await writeMinimal(root, previous, applied.expected);
    const rewritten = [...new Set([...before.keys(), ...tree.keys()])].sort()
      .filter(file => !(before.get(file)?.equals(tree.get(file) ?? Buffer.alloc(0)) ?? false));
    expect(rewritten).toEqual(['elements/cap.a.md', 'elements/cap.c.md', 'relationships/invokes.yaml']);
    expect(tree.get('metamodel/capability.md')!.equals(before.get('metamodel/capability.md')!)).toBe(true);
    expect(tree.get('views/overview.md')!.equals(before.get('views/overview.md')!)).toBe(true);

    await applyTree(root, tree);
    const reparsed = await parseSemanticModel(root);
    expect(reparsed.diagnostics).toEqual([]);
    expect(normalizeForComparison(reparsed.model)).toEqual(normalizeForComparison(applied.expected));

    const capA = reparsed.model.elements.find(item => item.declaration.identity === 'cap.a')!;
    expect(capA.declaration.title).toBe('A renamed');
    expect(capA.requirements.map(item => item.name)).toEqual(['First', 'Third']);

    // Re-applying nothing rewrites nothing.
    const stable = await writeMinimal(root, reparsed, reparsed.model);
    for (const [file, bytes] of await readModelTree(root)) expect(stable.get(file)!.equals(bytes)).toBe(true);
  });

  it('treats cross-unit collection order and file placement as non-semantic', async () => {
    const canonical = await parseSemanticModel(await createModelRoot(MODEL));
    const scrambled = await parseSemanticModel(await createModelRoot({
      'views/zzz-first.md': MODEL['views/overview.md'],
      'elements/9-b.md': MODEL['elements/cap.b.md'],
      'elements/nested/deep/0-a.md': MODEL['elements/cap.a.md'],
      'elements/root-unit.md': MODEL['elements/root.md'],
      'metamodel/zzz-capability.md': MODEL['metamodel/capability.md'],
      'metamodel/domain-kind.md': MODEL['metamodel/domain.md'],
      'metamodel/perspective-kind.md': MODEL['metamodel/perspective.md'],
      'metamodel/aaa-project.md': MODEL['metamodel/project.md'],
      'metamodel/invokes-kind.md': MODEL['metamodel/invokes.md'],
      'relationships/everything.yaml': MODEL['relationships/invokes.yaml'],
    }));

    expect(scrambled.diagnostics).toEqual([]);
    expect(normalizeForComparison(scrambled.model)).toEqual(normalizeForComparison(canonical.model));
    expect([...serializeSemanticModel(scrambled.model)]).toEqual([...serializeSemanticModel(canonical.model)]);
  });

  it('treats set-semantic list field order as non-semantic', async () => {
    const swapped = await parseSemanticModel(await createModelRoot({
      ...MODEL,
      'metamodel/invokes.md': '---\nentity: relationship-kind\nidentity: invokes\nsourceKinds:\n  - capability\n  - project\ntargetKinds:\n  - capability\n---\n',
    }));
    const reversed = await parseSemanticModel(await createModelRoot({
      ...MODEL,
      'metamodel/invokes.md': '---\nentity: relationship-kind\nidentity: invokes\nsourceKinds:\n  - project\n  - capability\ntargetKinds:\n  - capability\n---\n',
    }));
    expect(reversed.model).not.toEqual(swapped.model);
    expect(normalizeForComparison(reversed.model)).toEqual(normalizeForComparison(swapped.model));
  });

  it('treats Requirement order and Scenario order inside a unit as semantic', async () => {
    const swappedRequirements = await parseSemanticModel(await createModelRoot({
      ...MODEL,
      'elements/cap.a.md': CAP_A
        .replace('### Requirement: First', '### Requirement: TEMP')
        .replace('### Requirement: Second', '### Requirement: First')
        .replace('### Requirement: TEMP', '### Requirement: Second'),
    }));
    const base = await parseSemanticModel(await createModelRoot(MODEL));
    expect(normalizeForComparison(swappedRequirements.model)).not.toEqual(normalizeForComparison(base.model));

    const swappedScenarios = await parseSemanticModel(await createModelRoot({
      ...MODEL,
      'elements/cap.a.md': CAP_A
        .replace('#### Scenario: One\n\n- THEN one', '#### Scenario: TEMP\n\n- THEN one')
        .replace('#### Scenario: Two\n\n- THEN two', '#### Scenario: One\n\n- THEN one')
        .replace('#### Scenario: TEMP\n\n- THEN one', '#### Scenario: Two\n\n- THEN two'),
    }));
    const scenarioNames = swappedScenarios.model.elements
      .find(item => item.declaration.identity === 'cap.a')!.requirements[0].scenarios.map(item => item.name);
    expect(scenarioNames).toEqual(['Two', 'One']);
    expect(normalizeForComparison(swappedScenarios.model)).not.toEqual(normalizeForComparison(base.model));
  });

  it('compares prose verbatim apart from line endings and end-of-file whitespace', async () => {
    const base = await parseSemanticModel(await createModelRoot(MODEL));
    const cosmetic = await parseSemanticModel(await createModelRoot({
      ...MODEL,
      'elements/cap.a.md': `${CAP_A.replace(/\n/g, '\r\n')}\r\n\r\n   \r\n`,
    }));
    expect(cosmetic.model).toEqual(base.model);

    const interior = await parseSemanticModel(await createModelRoot({
      ...MODEL,
      'elements/cap.a.md': CAP_A.replace('SHALL come first.', 'SHALL  come first.'),
    }));
    expect(interior.model).not.toEqual(base.model);
  });
});
