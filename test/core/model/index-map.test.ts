import { describe, expect, it } from 'vitest';
import { createModelIndex } from '../../../src/core/model/index-map.js';
import { parseSemanticModel } from '../../../src/core/model/parser.js';
import { createModelRoot } from './fixtures.js';

const UNIT = [
  '---',
  'entity: element-declaration',
  'identity: cap.reader',
  'kind: capability',
  'parent: domain.architecture',
  'title: Reader',
  'definition: Reads source modules',
  '---',
  '',
].join('\n');

const CONTAINER = 'relationships:\n  - source: cap.reader\n    kind: invokes\n    target: cap.writer\n';

describe('createModelIndex', () => {
  it('resolves modules by identity and by relationship triple', () => {
    const module = { partition: 'elements' as const, path: 'elements/a.md' };
    const container = { partition: 'relationships' as const, path: 'relationships/invokes.yaml' };
    const index = createModelIndex(
      [{ identity: 'a', declared: 'element-declaration', module }],
      [{ relationship: { source: 'a', kind: 'invokes', target: 'b' }, module: container }],
    );

    expect(index.moduleOf('element-declaration', 'a')).toEqual(module);
    expect(index.moduleOf('element-declaration', 'missing')).toBeUndefined();
    expect(index.moduleOfRelationship({ source: 'a', kind: 'invokes', target: 'b' })).toEqual(container);
    expect(index.moduleOfRelationship({ source: 'a', kind: 'uses', target: 'b' })).toBeUndefined();
    expect(index.organizationWarnings()).toEqual([]);
  });

  it('scopes module lookup by entity type', () => {
    const elementModule = { partition: 'elements' as const, path: 'elements/a.md' };
    const kindModule = { partition: 'metamodel' as const, path: 'metamodel/a.md' };
    const index = createModelIndex(
      [
        { identity: 'a', declared: 'element-declaration', module: elementModule },
        { identity: 'a', declared: 'element-kind', module: kindModule },
      ],
      [],
    );

    expect(index.moduleOf('element-declaration', 'a')).toEqual(elementModule);
    expect(index.moduleOf('element-kind', 'a')).toEqual(kindModule);
    expect(index.moduleOf('authored-view', 'a')).toBeUndefined();
  });

  it('reports entries whose partition does not match their entity type', () => {
    const index = createModelIndex(
      [{ identity: 'uses', declared: 'relationship-kind', module: { partition: 'elements', path: 'elements/uses.md' } }],
      [],
    );
    expect(index.organizationWarnings()).toEqual([
      { identity: 'uses', declared: 'relationship-kind', partition: 'elements', path: 'elements/uses.md' },
    ]);
  });
});

describe('parsed model index', () => {
  it('locates entries under any file name', async () => {
    for (const name of ['cap.reader.md', 'zzz.md', 'nested/deep/unit.markdown']) {
      const root = await createModelRoot({ [`elements/${name}`]: UNIT, 'relationships/x.yaml': CONTAINER });
      const parsed = await parseSemanticModel(root);
      expect(parsed.index.moduleOf('element-declaration', 'cap.reader')).toEqual({ partition: 'elements', path: `elements/${name}` });
      expect(parsed.index.moduleOfRelationship({ source: 'cap.reader', kind: 'invokes', target: 'cap.writer' }))
        .toEqual({ partition: 'relationships', path: 'relationships/x.yaml' });
    }
  });

  it('produces an identical IR after renaming files', async () => {
    const first = await parseSemanticModel(await createModelRoot({ 'elements/a.md': UNIT, 'relationships/a.yaml': CONTAINER }));
    const second = await parseSemanticModel(await createModelRoot({ 'elements/b.md': UNIT, 'relationships/b.yaml': CONTAINER }));
    expect(second.model).toEqual(first.model);
  });
});
