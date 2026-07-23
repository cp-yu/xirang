import { describe, expect, it } from 'vitest';
import { parseArchitectureDelta } from '../../src/core/architecture-delta-parser.js';

const completeElement = `element 'payment.authorize' {
  kind 'capability'
  parent 'payments'
  title 'Authorize payment'
  summary 'Authorizes a payment'
  metadata {
    elementId 'payment.authorize'
    status 'active'
  }
}`;

describe('parseArchitectureDelta', () => {
  it('parses complete target element, relationship, and metamodel operations', () => {
    const result = parseArchitectureDelta(`architectureDelta {
  ADDED {
    ${completeElement}
    relationship 'payment.authorize' -[invokes]-> 'payment.capture'
    element receipt {
      opsx { contract optional parents [capability] }
    }
    relationship produces {
      opsx { sourceKinds [capability] targetKinds [receipt] }
    }
  }
  MODIFIED {
    element 'payment.capture' {
      kind 'capability'
      parent 'payments'
      title 'Capture payment'
      summary 'Captures an authorized payment'
      metadata { elementId 'payment.capture' }
    }
  }
  REMOVED {
    relationship 'payment.capture' -[precedes]-> 'payment.settle'
    element 'payment.legacy'
  }
}`);

    expect(result.diagnostics).toEqual([]);
    expect(result.delta?.operations).toHaveLength(7);
    expect(result.delta?.operations).toEqual(expect.arrayContaining([
      expect.objectContaining({ operation: 'ADDED', entity: 'element', identity: 'payment.authorize' }),
      expect.objectContaining({ operation: 'ADDED', entity: 'relationship', identity: 'payment.authorize|invokes|payment.capture' }),
      expect.objectContaining({ operation: 'ADDED', entity: 'elementKind', identity: 'receipt' }),
      expect.objectContaining({ operation: 'ADDED', entity: 'relationshipKind', identity: 'produces' }),
      expect.objectContaining({ operation: 'REMOVED', entity: 'element', identity: 'payment.legacy' }),
    ]));
  });

  it.each([
    ['raw extend', `architectureDelta { ADDED { extend payments { ${completeElement} } } }`, 'Unsupported architecture delta syntax: extend'],
    ['partial element payload', `architectureDelta { MODIFIED { element 'payment.authorize' { kind 'capability' parent 'payments' title 'Authorize payment' metadata { elementId 'payment.authorize' } } } }`, 'Missing required element field: summary'],
    ['conflicting identity operations', `architectureDelta { ADDED { ${completeElement} } MODIFIED { ${completeElement} } }`, 'Conflicting operations for element payment.authorize'],
  ])('rejects %s', (_name, source, message) => {
    const result = parseArchitectureDelta(source);

    expect(result.delta).toBeNull();
    expect(result.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ level: 'ERROR', message: expect.stringContaining(message) }),
    ]));
    expect(result.diagnostics[0]?.location.line).toBeGreaterThan(0);
  });
});
