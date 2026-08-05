import { describe, expect, it } from 'vitest';
import { diffFramingPayloads } from '../../../src/core/framing/workspace.js';
import type { ChangeStructuralDefinitionPayload } from '../../../src/core/framing/types.js';

function kind(identity: string, extra: Record<string, unknown> = {}): ChangeStructuralDefinitionPayload['elementKinds'][number] {
  return { identity, contract: 'optional', body: `${identity} body`, ...extra };
}

function element(identity: string, extra: Record<string, unknown> = {}): ChangeStructuralDefinitionPayload['elements'][number] {
  return { identity, kind: 'capability', parent: 'root', title: identity, definition: `${identity}.`, ...extra };
}

function payload(overrides: Partial<ChangeStructuralDefinitionPayload> = {}): ChangeStructuralDefinitionPayload {
  return {
    elementKinds: [],
    relationshipKinds: [],
    elements: [],
    relationships: [],
    ...overrides,
  };
}

describe('diffFramingPayloads', () => {
  it('returns empty added/modified/removed for identical payloads', () => {
    const one = payload({ elements: [element('a'), element('b')] });
    const diff = diffFramingPayloads(one, payload({ elements: [element('b'), element('a')] }));
    expect(diff.elements.added).toEqual([]);
    expect(diff.elements.modified).toEqual([]);
    expect(diff.elements.removed).toEqual([]);
  });

  it('reports added, modified and removed element targets with keys and full content', () => {
    const previous = payload({
      elements: [element('a'), element('b', { parent: 'old-parent' }), element('drop')],
    });
    const next = payload({
      elements: [element('a'), element('b', { parent: 'new-parent' }), element('fresh')],
    });
    const diff = diffFramingPayloads(previous, next);
    expect(diff.elements.added).toEqual(['fresh']);
    expect(diff.elements.modified).toEqual([
      { identity: 'b', before: element('b', { parent: 'old-parent' }), after: element('b', { parent: 'new-parent' }) },
    ]);
    expect(diff.elements.removed).toEqual([element('drop')]);
  });

  it('treats explicit REMOVED targets in the next payload as removed', () => {
    const previous = payload({ elements: [element('a'), element('b')] });
    const next = payload({ elements: [element('a'), { operation: 'REMOVED', identity: 'b' }] });
    const diff = diffFramingPayloads(previous, next);
    expect(diff.elements.removed).toEqual([element('b')]);
    expect(diff.elements.added).toEqual([]);
  });

  it('reports element kind diff across elementKinds and relationshipKinds', () => {
    const previous = payload({
      elementKinds: [kind('service'), kind('api', { contract: 'required' })],
      relationshipKinds: [{ identity: 'calls', body: 'calls body' }],
    });
    const next = payload({
      elementKinds: [kind('service'), kind('api', { contract: 'optional' }), kind('gateway')],
      relationshipKinds: [{ identity: 'calls', body: 'calls body' }, { identity: 'exposes', body: 'exposes body' }],
    });
    const diff = diffFramingPayloads(previous, next);
    expect(diff.elementKinds.added).toEqual(['gateway']);
    expect(diff.elementKinds.modified).toEqual([{
      identity: 'api',
      before: kind('api', { contract: 'required' }),
      after: kind('api', { contract: 'optional' }),
    }]);
    expect(diff.elementKinds.removed).toEqual([]);
    expect(diff.relationshipKinds.added).toEqual(['exposes']);
    expect(diff.relationshipKinds.modified).toEqual([]);
  });

  it('reports relationship added and removed triples and never modified', () => {
    const previous = payload({
      relationships: [
        { source: 'checkout', kind: 'calls', target: 'payment' },
        { source: 'legacy', kind: 'calls', target: 'payment' },
      ],
    });
    const next = payload({
      relationships: [
        { source: 'checkout', kind: 'calls', target: 'payment' },
        { source: 'payment', kind: 'exposes', target: 'api' },
      ],
    });
    const diff = diffFramingPayloads(previous, next);
    expect(diff.relationships.added).toEqual([{ source: 'payment', kind: 'exposes', target: 'api' }]);
    expect(diff.relationships.modified).toEqual([]);
    expect(diff.relationships.removed).toEqual([{ source: 'legacy', kind: 'calls', target: 'payment' }]);
  });

  it('ignores array order in parents/children when comparing modified element kinds', () => {
    const previous = payload({
      elementKinds: [kind('service', { parents: ['a', 'b'], children: ['x', 'y'] })],
    });
    const next = payload({
      elementKinds: [kind('service', { parents: ['b', 'a'], children: ['y', 'x'] })],
    });
    const diff = diffFramingPayloads(previous, next);
    expect(diff.elementKinds.modified).toEqual([]);
  });
});
