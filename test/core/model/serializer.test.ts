import { describe, expect, it } from 'vitest';
import { parseSemanticModel } from '../../../src/core/model/parser.js';
import {
  serializeElementUnit,
  serializeRelationshipContainer,
  serializeSemanticModel,
} from '../../../src/core/model/serializer.js';
import type { ModelElement, Relationship, SemanticModel } from '../../../src/core/model/types.js';
import { createModelRoot } from './fixtures.js';

const element: ModelElement = {
  declaration: {
    identity: 'cap.reader',
    kind: 'capability',
    parent: 'domain.architecture',
    title: 'Reader',
    summary: 'Reads source modules',
  },
  requirements: [
    {
      name: 'Parses units',
      body: 'The reader SHALL parse every unit.',
      scenarios: [{ name: 'Valid unit', body: '- THEN it is parsed' }],
    },
    { name: 'Empty requirement', body: '', scenarios: [] },
  ],
};

const model: SemanticModel = {
  elementKinds: [{ identity: 'capability', contract: 'required', parents: ['domain'], body: 'A unit of capability.' }],
  relationshipKinds: [
    { identity: 'invokes', sourceKinds: ['capability'], body: '' },
    { identity: 'unused', body: '' },
  ],
  elements: [element],
  relationships: [
    { source: 'cap.writer', kind: 'invokes', target: 'cap.reader' },
    { source: 'cap.reader', kind: 'invokes', target: 'cap.writer' },
  ],
  views: [{ identity: 'overview', include: '*', title: 'Overview' }],
};

describe('serializeElementUnit', () => {
  it('emits frontmatter and ordered requirement blocks', () => {
    expect(serializeElementUnit(element)).toBe([
      '---',
      'entity: element-declaration',
      'identity: cap.reader',
      'kind: capability',
      'parent: domain.architecture',
      'title: Reader',
      'summary: Reads source modules',
      '---',
      '',
      '## Requirements',
      '',
      '### Requirement: Parses units',
      '',
      'The reader SHALL parse every unit.',
      '',
      '#### Scenario: Valid unit',
      '',
      '- THEN it is parsed',
      '',
      '### Requirement: Empty requirement',
      '',
    ].join('\n'));
  });

  it('emits frontmatter only for an element with no contract', () => {
    expect(serializeElementUnit({ ...element, requirements: [] })).toBe(
      '---\nentity: element-declaration\nidentity: cap.reader\nkind: capability\n'
      + 'parent: domain.architecture\ntitle: Reader\nsummary: Reads source modules\n---\n',
    );
  });
});

describe('serializeRelationshipContainer', () => {
  it('sorts entries by source, then kind, then target', () => {
    const items: Relationship[] = [
      { source: 'b', kind: 'a', target: 'a' },
      { source: 'a', kind: 'b', target: 'a' },
      { source: 'a', kind: 'a', target: 'b' },
      { source: 'a', kind: 'a', target: 'a' },
    ];
    expect(serializeRelationshipContainer('a', items)).toBe([
      'relationships:',
      '  - source: a', '    kind: a', '    target: a',
      '  - source: a', '    kind: a', '    target: b',
      '  - source: a', '    kind: b', '    target: a',
      '  - source: b', '    kind: a', '    target: a',
      '',
    ].join('\n'));
  });

  it('sorts by UTF-8 bytes rather than by locale', () => {
    const items: Relationship[] = [
      { source: 'a', kind: 'k', target: 't' },
      { source: 'B', kind: 'k', target: 't' },
      { source: 'ä', kind: 'k', target: 't' },
    ];
    const sources = [...serializeRelationshipContainer('k', items).matchAll(/source: (.+)/g)].map(match => match[1]);
    expect(sources).toEqual(['B', 'a', 'ä']);
  });

  it('emits an empty list for a kind with no entries', () => {
    expect(serializeRelationshipContainer('unused', [])).toBe('relationships: []\n');
  });
});

describe('serializeSemanticModel', () => {
  it('follows the default naming convention', () => {
    expect([...serializeSemanticModel(model).keys()]).toEqual([
      'elements/cap.reader.md',
      'metamodel/capability.md',
      'metamodel/invokes.md',
      'metamodel/unused.md',
      'relationships/invokes.yaml',
      'relationships/unused.yaml',
      'views/overview.md',
    ]);
  });

  it('is deterministic across repeated calls and input ordering', () => {
    const first = serializeSemanticModel(model);
    const shuffled: SemanticModel = { ...model, relationships: [...model.relationships].reverse() };
    const second = serializeSemanticModel(shuffled);
    expect([...second]).toEqual([...first]);
  });

  it('never writes into the LikeC4 cache', () => {
    expect([...serializeSemanticModel(model).keys()].some(key => key.includes('.cache-likec4'))).toBe(false);
  });

  it('round-trips through the parser', async () => {
    const files = Object.fromEntries(
      [...serializeSemanticModel(model)].map(([key, value]) => [key, value.toString('utf8')]),
    );
    const parsed = await parseSemanticModel(await createModelRoot(files));
    expect(parsed.diagnostics).toEqual([]);
    expect(parsed.model).toEqual({
      ...model,
      relationships: [...model.relationships].reverse(),
    });
  });
});
