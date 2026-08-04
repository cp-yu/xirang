import { describe, expect, it } from 'vitest';
import { applySemanticDelta, parseSemanticDelta } from '../../../src/core/model/delta.js';
import { relationshipIdentity, type ModelElement, type SemanticModel } from '../../../src/core/model/types.js';
import { createModelRoot } from './fixtures.js';

function element(identity: string, kind: string, parent: string | null, requirements: string[] = []): ModelElement {
  return {
    declaration: { identity, kind, parent, title: identity, definition: `Definition of ${identity}.` },
    requirements: requirements.map(name => ({ name, body: `${name} body`, scenarios: [] })),
  };
}

function base(): SemanticModel {
  return {
    elementKinds: [
      { identity: 'project', contract: 'optional', root: true, body: '' },
      { identity: 'capability', contract: 'optional', body: '' },
    ],
    relationshipKinds: [{ identity: 'invokes', body: '' }],
    elements: [element('root', 'project', null), element('cap.a', 'capability', 'root', ['Existing'])],
    relationships: [{ source: 'cap.a', kind: 'invokes', target: 'root' }],
    views: [{ identity: 'overview', include: '*' }],
  };
}

describe('parseSemanticDelta', () => {
  it('produces a declaration entry and requirement entries from one element unit', async () => {
    const root = await createModelRoot({
      'elements/cap.a.md': [
        '---',
        'operation: MODIFIED',
        'entity: element-declaration',
        'identity: cap.a',
        'kind: capability',
        'parent: root',
        'title: Renamed',
        'definition: Full new definition.',
        '---',
        '',
        '## ADDED Requirements',
        '',
        '### Requirement: Added one',
        '',
        'SHALL do the new thing.',
        '',
        '#### Scenario: Happy',
        '',
        '- THEN it works',
        '',
        '## MODIFIED Requirements',
        '',
        '### Requirement: Existing',
        '',
        'SHALL do the changed thing.',
        '',
        '## REMOVED Requirements',
        '',
        '### Requirement: Obsolete',
        '',
      ].join('\n'),
    });

    const { delta, diagnostics } = await parseSemanticDelta(root);
    expect(diagnostics).toEqual([]);
    expect(delta.entries).toEqual([
      {
        operation: 'MODIFIED',
        entity: 'element-declaration',
        identity: 'cap.a',
        target: { identity: 'cap.a', kind: 'capability', parent: 'root', title: 'Renamed', definition: 'Full new definition.' },
      },
      {
        operation: 'ADDED',
        entity: 'requirement',
        identity: 'cap.a#Added one',
        target: {
          name: 'Added one',
          body: 'SHALL do the new thing.',
          scenarios: [{ name: 'Happy', body: '- THEN it works' }],
        },
      },
      {
        operation: 'MODIFIED',
        entity: 'requirement',
        identity: 'cap.a#Existing',
        target: { name: 'Existing', body: 'SHALL do the changed thing.', scenarios: [] },
      },
      { operation: 'REMOVED', entity: 'requirement', identity: 'cap.a#Obsolete' },
    ]);
  });

  it('uses frontmatter without operation only to locate the host', async () => {
    const root = await createModelRoot({
      'elements/cap.a.md': [
        '---', 'entity: element-declaration', 'identity: cap.a', 'definition: Host definition.', '---', '',
        '## ADDED Requirements', '', '### Requirement: Only contract', '', 'SHALL hold.', '',
      ].join('\n'),
    });
    const { delta, diagnostics } = await parseSemanticDelta(root);
    expect(diagnostics).toEqual([]);
    expect(delta.entries.map(entry => entry.entity)).toEqual(['requirement']);
  });

  it('accepts an identity-only REMOVED Element Declaration', async () => {
    const root = await createModelRoot({
      'elements/cap.a.md': [
        '---', 'operation: REMOVED', 'entity: element-declaration', 'identity: cap.a', '---', '',
      ].join('\n'),
    });

    const { delta, diagnostics } = await parseSemanticDelta(root);
    expect(diagnostics).toEqual([]);
    expect(delta.entries).toEqual([{
      operation: 'REMOVED',
      entity: 'element-declaration',
      identity: 'cap.a',
    }]);
  });

  it('adds element kind with nodePresentation', async () => {
    const root = await createModelRoot({
      'metamodel/perspective.md': [
        '---',
        'operation: ADDED',
        'entity: element-kind',
        'identity: perspective',
        'contract: optional',
        'nodePresentation:',
        '  shape: document',
        '  color: indigo',
        '  border: solid',
        '---',
        '',
        'Perspective kind.',
        '',
      ].join('\n'),
    });

    const { delta, diagnostics } = await parseSemanticDelta(root);
    expect(diagnostics).toEqual([]);
    expect(delta.entries).toEqual([{
      operation: 'ADDED',
      entity: 'element-kind',
      identity: 'perspective',
      target: {
        identity: 'perspective',
        contract: 'optional',
        nodePresentation: { shape: 'document', color: 'indigo', border: 'solid' },
        body: 'Perspective kind.',
      },
    }]);
  });

  it('modifies element kind nodePresentation', () => {
    const result = applySemanticDelta(base(), {
      entries: [{
        operation: 'MODIFIED',
        entity: 'element-kind',
        identity: 'capability',
        target: {
          identity: 'capability',
          contract: 'optional',
          nodePresentation: { shape: 'component', color: 'green', border: 'dashed' },
          body: '',
        },
      }],
    });
    expect(result.diagnostics).toEqual([]);
    expect(result.expected.elementKinds.find(kind => kind.identity === 'capability')?.nodePresentation)
      .toEqual({ shape: 'component', color: 'green', border: 'dashed' });
    expect(result.expected.elementKinds.find(kind => kind.identity === 'project')?.nodePresentation).toBeUndefined();
    expect([...result.touched]).toEqual(['capability']);
  });

  it('supports all three operations on metamodel, views and relationships', async () => {
    const root = await createModelRoot({
      'metamodel/added.md': '---\noperation: ADDED\nentity: element-kind\nidentity: added\ncontract: optional\n---\n',
      'metamodel/invokes.md': '---\noperation: MODIFIED\nentity: relationship-kind\nidentity: invokes\nsourceKinds:\n  - capability\n---\n',
      'metamodel/gone.md': '---\noperation: REMOVED\nentity: element-kind\nidentity: gone\n---\n',
      'views/overview.md': '---\noperation: REMOVED\nentity: authored-view\nidentity: overview\n---\n',
      'relationships/invokes.yaml': [
        'relationships:',
        '  - operation: ADDED',
        '    source: root',
        '    kind: invokes',
        '    target: cap.a',
        '  - operation: REMOVED',
        '    source: cap.a',
        '    kind: invokes',
        '    target: root',
        '',
      ].join('\n'),
    });

    const { delta, diagnostics } = await parseSemanticDelta(root);
    expect(diagnostics).toEqual([]);
    expect(delta.entries.map(entry => [entry.entity, entry.operation])).toEqual([
      ['element-kind', 'ADDED'],
      ['element-kind', 'REMOVED'],
      ['relationship-kind', 'MODIFIED'],
      ['relationship', 'ADDED'],
      ['relationship', 'REMOVED'],
      ['authored-view', 'REMOVED'],
    ]);
    expect(delta.entries.find(entry => entry.operation === 'REMOVED')).not.toHaveProperty('target');
  });

  it('rejects MODIFIED on a relationship', async () => {
    const root = await createModelRoot({
      'relationships/invokes.yaml': 'relationships:\n  - operation: MODIFIED\n    source: a\n    kind: invokes\n    target: b\n',
    });
    const { delta, diagnostics } = await parseSemanticDelta(root);
    expect(diagnostics.map(item => item.code)).toEqual(['RELATIONSHIP_MODIFIED_UNSUPPORTED']);
    expect(delta.entries).toEqual([]);
  });

  it('requires an operation outside element units', async () => {
    const root = await createModelRoot({
      'metamodel/k.md': '---\nentity: element-kind\nidentity: k\ncontract: optional\n---\n',
      'relationships/r.yaml': 'relationships:\n  - source: a\n    kind: invokes\n    target: b\n',
    });
    expect((await parseSemanticDelta(root)).diagnostics.map(item => item.code))
      .toEqual(['MISSING_OPERATION', 'MISSING_OPERATION']);
  });

  it('rejects conflicting operations on one identity', async () => {
    const root = await createModelRoot({
      'relationships/a.yaml': 'relationships:\n  - operation: ADDED\n    source: a\n    kind: invokes\n    target: b\n',
      'relationships/b.yaml': 'relationships:\n  - operation: REMOVED\n    source: a\n    kind: invokes\n    target: b\n',
    });
    expect((await parseSemanticDelta(root)).diagnostics.map(item => item.code)).toEqual(['CONFLICTING_OPERATIONS']);
  });
});

describe('applySemanticDelta', () => {
  it('allows MODIFIED to change an element kind while the identity stays', () => {
    const result = applySemanticDelta(base(), {
      entries: [{
        operation: 'MODIFIED',
        entity: 'element-declaration',
        identity: 'cap.a',
        target: { identity: 'cap.a', kind: 'project', parent: 'root', title: 'cap.a', definition: 'Changed capability boundary.' },
      }],
    });
    expect(result.diagnostics).toEqual([]);
    expect(result.expected.elements[1].declaration).toEqual({
      identity: 'cap.a',
      kind: 'project',
      parent: 'root',
      title: 'cap.a',
      definition: 'Changed capability boundary.',
    });
    expect(result.expected.elements[1].requirements.map(item => item.name)).toEqual(['Existing']);
    expect([...result.touched]).toEqual(['cap.a']);
  });

  it('applies requirement entries and reports the host element as touched', () => {
    const result = applySemanticDelta(base(), {
      entries: [
        { operation: 'ADDED', entity: 'requirement', identity: 'cap.a#New', target: { name: 'New', body: 'B', scenarios: [] } },
        { operation: 'REMOVED', entity: 'requirement', identity: 'cap.a#Existing' },
      ],
    });
    expect(result.diagnostics).toEqual([]);
    expect(result.expected.elements[1].requirements.map(item => item.name)).toEqual(['New']);
    expect([...result.touched]).toEqual(['cap.a']);
  });

  it('rejects ADDED on an existing identity and MODIFIED or REMOVED on a missing one', () => {
    const conflicting = applySemanticDelta(base(), {
      entries: [
        { operation: 'ADDED', entity: 'authored-view', identity: 'overview', target: { identity: 'overview', include: '*' } },
        { operation: 'MODIFIED', entity: 'element-kind', identity: 'ghost', target: { identity: 'ghost', contract: 'optional', body: '' } },
        { operation: 'REMOVED', entity: 'requirement', identity: 'cap.a#Ghost' },
        { operation: 'REMOVED', entity: 'requirement', identity: 'ghost#R' },
      ],
    });
    expect(conflicting.diagnostics.map(item => item.code)).toEqual([
      'ADDED_IDENTITY_EXISTS', 'MODIFIED_IDENTITY_MISSING', 'REMOVED_IDENTITY_MISSING', 'REMOVED_IDENTITY_MISSING',
    ]);
    expect(conflicting.touched.size).toBe(0);
  });

  it('adds and removes relationships by their triple', () => {
    const added = { source: 'root', kind: 'invokes', target: 'cap.a' };
    const result = applySemanticDelta(base(), {
      entries: [
        { operation: 'ADDED', entity: 'relationship', identity: relationshipIdentity(added), target: added },
        {
          operation: 'REMOVED',
          entity: 'relationship',
          identity: relationshipIdentity({ source: 'cap.a', kind: 'invokes', target: 'root' }),
        },
      ],
    });
    expect(result.diagnostics).toEqual([]);
    expect(result.expected.relationships).toEqual([added]);
    expect(result.touched.size).toBe(2);
  });

  it('does not mutate the base model', () => {
    const input = base();
    const snapshot = structuredClone(input);
    applySemanticDelta(input, { entries: [{ operation: 'REMOVED', entity: 'element-declaration', identity: 'cap.a' }] });
    expect(input).toEqual(snapshot);
  });
});
