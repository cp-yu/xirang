import { describe, expect, it } from 'vitest';
import { applySemanticDelta } from '../../../src/core/model/delta.js';
import { parseSemanticModel, parseSemanticModelFiles, readModelTree } from '../../../src/core/model/parser.js';
import { writeMinimal } from '../../../src/core/model/sync-writer.js';
import { emptySemanticModel, relationshipIdentity } from '../../../src/core/model/types.js';
import { createSemanticDiff, semanticModelFingerprint } from '../../../src/core/semantic-diff.js';
import { createModelRoot } from './fixtures.js';

/** Hand-authored, deliberately non-canonical: extra blank lines and an unusual key order. */
const HAND_WRITTEN = [
  '---',
  'identity: cap.b',
  'entity: element-declaration',
  'definition: Hand written definition.',
  'kind: capability',
  'parent: root',
  'title: B',
  '---',
  '',
  '',
  '## Requirements',
  '',
  '### Requirement: Untouched',
  '',
  'SHALL stay byte identical.',
  '',
].join('\n');

const FILES: Record<string, string> = {
  'metamodel/project.md': '---\nentity: element-kind\nidentity: project\ncontract: optional\nroot: true\n---\n',
  'metamodel/capability.md': '---\nentity: element-kind\nidentity: capability\ncontract: optional\n---\n',
  'metamodel/invokes.md': '---\nentity: relationship-kind\nidentity: invokes\n---\n',
  'metamodel/uses.md': '---\nentity: relationship-kind\nidentity: uses\n---\n',
  'elements/root.md': '---\nentity: element-declaration\nidentity: root\nkind: project\nparent: null\ntitle: Root\ndefinition: Root project definition.\n---\n',
  'elements/cap.a.md': '---\nentity: element-declaration\nidentity: cap.a\nkind: capability\nparent: root\ntitle: A\ndefinition: Capability A definition.\n---\n',
  'elements/hand-written.md': HAND_WRITTEN,
  'relationships/invokes.yaml': 'relationships:\n  - source: cap.a\n    kind: invokes\n    target: cap.b\n',
  'relationships/uses.yaml': 'relationships:\n  - source: cap.b\n    kind: uses\n    target: cap.a\n',
  'views/overview.md': '---\nentity: authored-view\nidentity: overview\ninclude: "*"\n---\n',
};

async function prepare(): Promise<{ root: string }> {
  return { root: await createModelRoot(FILES) };
}

function changedPaths(before: Map<string, Buffer>, after: Map<string, Buffer>): string[] {
  return [...new Set([...before.keys(), ...after.keys()])].sort()
    .filter(file => !(before.get(file)?.equals(after.get(file) ?? Buffer.alloc(0)) ?? false));
}

describe('writeMinimal', () => {
  it('rewrites only the affected element unit', async () => {
    const { root } = await prepare();
    const previous = await parseSemanticModel(root);
    const applied = applySemanticDelta(previous.model, {
      entries: [{
        operation: 'MODIFIED',
        entity: 'element-declaration',
        identity: 'cap.a',
        target: { identity: 'cap.a', kind: 'capability', parent: 'root', title: 'A renamed', definition: 'A changed, complete definition.\n\nIts second paragraph remains intact.' },
      }],
    });

    const before = await readModelTree(root);
    const after = await writeMinimal(root, previous, applied.expected);
    expect(changedPaths(before, after)).toEqual(['elements/cap.a.md']);
    expect(after.get('elements/cap.a.md')!.toString('utf8')).toContain(
      'definition: "A changed, complete definition.\\n\\nIts second paragraph remains intact."',
    );
    for (const [file, bytes] of before) {
      if (file !== 'elements/cap.a.md') expect(after.get(file)!.equals(bytes)).toBe(true);
    }
  });

  it('keeps a hand-formatted untouched unit byte-for-byte', async () => {
    const { root } = await prepare();
    const previous = await parseSemanticModel(root);
    const applied = applySemanticDelta(previous.model, {
      entries: [{ operation: 'REMOVED', entity: 'authored-view', identity: 'overview' }],
    });
    const after = await writeMinimal(root, previous, applied.expected);

    expect(after.get('elements/hand-written.md')!.toString('utf8')).toBe(HAND_WRITTEN);
    expect(after.has('views/overview.md')).toBe(false);
    const before = await readModelTree(root);
    expect(changedPaths(before, after)).toEqual(['views/overview.md']);
  });

  it('rewrites only the container that owns the changed relationship', async () => {
    const { root } = await prepare();
    const previous = await parseSemanticModel(root);
    const added = { source: 'cap.b', kind: 'invokes', target: 'cap.a' };
    const applied = applySemanticDelta(previous.model, {
      entries: [{ operation: 'ADDED', entity: 'relationship', identity: relationshipIdentity(added), target: added }],
    });

    const before = await readModelTree(root);
    const after = await writeMinimal(root, previous, applied.expected);
    expect(changedPaths(before, after)).toEqual(['relationships/invokes.yaml']);
    expect(after.get('relationships/invokes.yaml')!.toString('utf8')).toBe([
      'relationships:',
      '  - source: cap.a', '    kind: invokes', '    target: cap.b',
      '  - source: cap.b', '    kind: invokes', '    target: cap.a',
      '',
    ].join('\n'));
  });

  it('honours the author placement of an existing unit instead of the default name', async () => {
    const root = await createModelRoot({ ...FILES, 'elements/nested/moved.md': FILES['elements/cap.a.md'] });
    const previous = await parseSemanticModel(root);
    const applied = applySemanticDelta(previous.model, {
      entries: [{
        operation: 'MODIFIED',
        entity: 'element-declaration',
        identity: 'cap.a',
        target: { identity: 'cap.a', kind: 'capability', parent: 'root', title: 'Renamed', definition: 'Capability A definition.' },
      }],
    });
    const after = await writeMinimal(root, previous, applied.expected);
    expect(after.has('elements/nested/moved.md')).toBe(true);
    expect([...after.keys()].filter(key => key.startsWith('elements/') && key.includes('cap.a'))).toEqual([]);
  });

  it('places a newly added unit at the default path', async () => {
    const { root } = await prepare();
    const previous = await parseSemanticModel(root);
    const applied = applySemanticDelta(previous.model, {
      entries: [{
        operation: 'ADDED',
        entity: 'element-declaration',
        identity: 'cap.c',
        target: { identity: 'cap.c', kind: 'capability', parent: 'root', title: 'C', definition: 'Capability C definition.' },
      }],
    });
    const after = await writeMinimal(root, previous, applied.expected);
    expect(after.has('elements/cap.c.md')).toBe(true);
  });

  it('produces a target tree that reparses to the expected model', async () => {
    const { root } = await prepare();
    const previous = await parseSemanticModel(root);
    const applied = applySemanticDelta(previous.model, {
      entries: [{
        operation: 'ADDED',
        entity: 'requirement',
        identity: 'cap.a#New rule',
        target: { name: 'New rule', body: 'SHALL hold.', scenarios: [] },
      }],
    });
    const after = await writeMinimal(root, previous, applied.expected);
    const reparsed = parseSemanticModelFiles([...after].map(([key, value]) => [key, value.toString('utf8')] as const));
    expect(reparsed.diagnostics).toEqual([]);
    expect(reparsed.model.elements.find(item => item.declaration.identity === 'cap.a')!.requirements)
      .toEqual([{ name: 'New rule', body: 'SHALL hold.', scenarios: [] }]);
  });
});

describe('difference output', () => {
  it('includes complete Definition changes in property diff and fingerprint', () => {
    const before = emptySemanticModel();
    before.elements.push({
      declaration: { identity: 'a', kind: 'k', parent: null, title: 'A', definition: 'Original definition.' },
      requirements: [],
    });
    const after = structuredClone(before);
    after.elements[0].declaration.definition = 'Changed first paragraph.\n\nChanged second paragraph.';

    const diff = createSemanticDiff(before, after, {
      valid: true, formalFingerprint: '', changeFingerprint: '', diagnostics: [],
    });
    expect(diff.entries[0].children).toContainEqual(expect.objectContaining({
      kind: 'property',
      identity: 'a.definition',
      before: 'Original definition.',
      after: 'Changed first paragraph.\n\nChanged second paragraph.',
    }));
    expect(semanticModelFingerprint(after)).not.toBe(semanticModelFingerprint(before));
  });

  it('carries no storage partition information', () => {
    const empty = emptySemanticModel();
    const target = {
      ...empty,
      elements: [{
        declaration: { identity: 'a', kind: 'k', parent: null, title: 'A', definition: 'Element A definition.' },
        requirements: [],
      }],
    };
    const diff = createSemanticDiff(empty, target, {
      valid: true, formalFingerprint: '', changeFingerprint: '', diagnostics: [],
    });
    expect(diff.entries).toHaveLength(1);
    expect(diff.entries[0]).not.toHaveProperty('scope');
    expect(diff.entries[0].kind).toBe('element-declaration');
    expect(Object.keys(diff.summary).sort()).toEqual(['ADDED', 'MODIFIED', 'REMOVED', 'total']);
  });

  it('is unaffected by how relationships are grouped into containers', async () => {
    const split = await parseSemanticModel(await createModelRoot(FILES));
    const withoutContainers = Object.fromEntries(
      Object.entries(FILES).filter(([key]) => !key.startsWith('relationships/')),
    );
    const merged = await parseSemanticModel(await createModelRoot({
      ...withoutContainers,
      'relationships/all.yaml': [
        'relationships:',
        '  - source: cap.a', '    kind: invokes', '    target: cap.b',
        '  - source: cap.b', '    kind: uses', '    target: cap.a',
        '',
      ].join('\n'),
    }));
    expect(new Set(merged.model.relationships.map(item => relationshipIdentity(item))))
      .toEqual(new Set(split.model.relationships.map(item => relationshipIdentity(item))));
  });
});
