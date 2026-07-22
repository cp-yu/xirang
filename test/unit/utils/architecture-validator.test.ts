import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { validateArchitecture } from '../../../src/utils/architecture-validator.js';
import type { LikeC4Architecture } from '../../../src/utils/likec4-reader.js';
import type { SemanticElement, SemanticMetamodel } from '../../../src/utils/semantic-model.js';

function architecture(overrides: Partial<LikeC4Architecture> = {}): LikeC4Architecture {
  return {
    source: 'likec4', files: [], profile: 'legacy', languageVersion: null,
    elements: [], metamodel: { elements: {}, relationships: {} },
    domains: [{ id: 'core', title: 'Core' }],
    capabilities: [{ id: 'core.a', title: 'A', domain: 'core', capabilityId: 'cap.core.a', specs: [] }],
    relations: [], ...overrides,
  };
}

const metamodel: SemanticMetamodel = {
  elements: {
    project: { root: true, contractPolicy: 'required' },
    product: { contractPolicy: 'optional' },
    workflow: { contractPolicy: 'required', parents: ['product'] },
  },
  relationships: {},
};

function element(overrides: Partial<SemanticElement> = {}): SemanticElement {
  return {
    id: 'project.root', fqn: 'root', kind: 'project', title: 'Root', summary: 'Project intent',
    parent: null, children: [], metadata: { elementId: 'project.root' }, ...overrides,
  };
}

function v1(elements: SemanticElement[], model = metamodel): LikeC4Architecture {
  return architecture({ profile: 'v1', languageVersion: '1', elements, metamodel: model, domains: [], capabilities: [] });
}

describe('architecture validator', () => {
  let root: string;
  beforeEach(async () => { root = await fs.mkdtemp(path.join(os.tmpdir(), 'opsx-architecture-validator-')); });
  afterEach(async () => fs.rm(root, { recursive: true, force: true }));

  it('should detect missing ownership', async () => {
    const result = await validateArchitecture(root, architecture({
      capabilities: [{ id: 'a', title: 'A', specs: [] }],
    }));
    expect(result.errors[0].message).toBe('Capability a has no domain (missing nesting)');
  });

  it('should detect multiple ownership by canonical capability ID', async () => {
    const result = await validateArchitecture(root, architecture({
      domains: [{ id: 'one', title: 'One' }, { id: 'two', title: 'Two' }],
      capabilities: [
        { id: 'one.a', title: 'A', domain: 'one', capabilityId: 'cap.shared.a', specs: [] },
        { id: 'two.a', title: 'A', domain: 'two', capabilityId: 'cap.shared.a', specs: [] },
      ],
    }));
    expect(result.errors).toContainEqual(expect.objectContaining({
      code: 'MULTIPLE_OWNERSHIP', message: 'Capability cap.shared.a belongs to multiple domains',
    }));
  });

  it('should detect precedes cycle', async () => {
    const capabilities = ['a', 'b', 'c'].map(id => ({ id: `core.${id}`, title: id, domain: 'core', capabilityId: `cap.core.${id}`, specs: [] }));
    const relations = [
      { source: 'core.a', target: 'core.b', kind: 'precedes' },
      { source: 'core.b', target: 'core.c', kind: 'precedes' },
      { source: 'core.c', target: 'core.a', kind: 'precedes' },
    ];
    const result = await validateArchitecture(root, architecture({ capabilities, relations }));
    expect(result.errors.some(error => error.message === 'Precedes cycle detected: core.a → core.b → core.c → core.a')).toBe(true);
  });

  it('should detect precedes self-loop', async () => {
    const result = await validateArchitecture(root, architecture({
      relations: [{ source: 'core.a', target: 'core.a', kind: 'precedes' }],
    }));
    expect(result.errors).toContainEqual(expect.objectContaining({
      code: 'PRECEDES_SELF_LOOP', message: 'Precedes self-loop detected: core.a → core.a',
    }));
  });

  it('should check spec file existence', async () => {
    const result = await validateArchitecture(root, architecture({
      capabilities: [{ id: 'core.a', title: 'A', domain: 'core', capabilityId: 'cap.core.a', specs: ['.opsx/specs/missing/spec.md'] }],
    }));
    expect(result.warnings[0].message).toBe('Spec file not found: .opsx/specs/missing/spec.md');
  });

  it('should return structured validation result', async () => {
    const result = await validateArchitecture(root, architecture());
    expect(result).toEqual({ success: true, errors: [], warnings: [] });
  });

  it('accepts one project root and arbitrary-depth single-parent containment', async () => {
    const result = await validateArchitecture(root, v1([
      element({ children: ['product.main'] }),
      element({ id: 'product.main', fqn: 'root.product', kind: 'product', title: 'Product', summary: 'Product intent', parent: 'project.root', children: ['workflow.main'], metadata: { elementId: 'product.main' } }),
      element({ id: 'workflow.main', fqn: 'root.product.flow', kind: 'workflow', title: 'Flow', summary: 'Flow intent', parent: 'product.main', metadata: { elementId: 'workflow.main' } }),
    ]));
    expect(result.errors).toEqual([]);
  });

  it('rejects a v1 metamodel element kind without an explicit contract policy', async () => {
    const invalidMetamodel = {
      elements: {
        project: { root: true, contractPolicy: 'required' },
        product: {},
      },
      relationships: {},
    } as unknown as SemanticMetamodel;
    const result = await validateArchitecture(root, v1([
      element({ children: ['product.main'] }),
      element({ id: 'product.main', fqn: 'root.product', kind: 'product', title: 'Product', summary: 'Product intent', parent: 'project.root', metadata: { elementId: 'product.main' } }),
    ], invalidMetamodel));

    expect(result.errors).toContainEqual(expect.objectContaining({
      code: 'MISSING_CONTRACT_POLICY',
      element: 'product',
    }));
  });

  it('rejects missing and multiple project roots', async () => {
    const missing = await validateArchitecture(root, v1([
      element({ id: 'product.main', kind: 'product', metadata: { elementId: 'product.main' } }),
    ]));
    expect(missing.errors).toContainEqual(expect.objectContaining({ code: 'MISSING_PROJECT_ROOT' }));

    const duplicate = await validateArchitecture(root, v1([
      element(),
      element({ id: 'project.other', fqn: 'other', metadata: { elementId: 'project.other' } }),
    ]));
    expect(duplicate.errors).toContainEqual(expect.objectContaining({ code: 'MULTIPLE_PROJECT_ROOTS' }));
  });

  it('rejects duplicate IDs, empty summaries, cycles, and explicit constraint violations', async () => {
    const result = await validateArchitecture(root, v1([
      element({ children: ['workflow.invalid'] }),
      element({ id: 'product.main', fqn: 'root.product', kind: 'product', title: 'Product', summary: '', parent: 'workflow.main', children: ['workflow.main'], metadata: { elementId: 'product.main' } }),
      element({ id: 'workflow.main', fqn: 'root.product.flow', kind: 'workflow', title: 'Flow', summary: 'Flow intent', parent: 'product.main', children: ['product.main'], metadata: { elementId: 'project.root' } }),
      element({ id: 'workflow.invalid', fqn: 'root.invalid', kind: 'workflow', title: 'Invalid', summary: 'Invalid parent', parent: 'project.root', metadata: { elementId: 'workflow.invalid' } }),
    ]));
    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'DUPLICATE_ELEMENT_ID' }),
      expect.objectContaining({ code: 'MISSING_ELEMENT_SUMMARY' }),
      expect.objectContaining({ code: 'CONTAINMENT_CYCLE' }),
      expect.objectContaining({ code: 'INVALID_CONTAINMENT' }),
    ]));
  });

  it('keeps nesting open when no constraints are declared', async () => {
    const openMetamodel: SemanticMetamodel = {
      elements: { project: { root: true, contractPolicy: 'required' }, workflow: { contractPolicy: 'optional' } },
      relationships: {},
    };
    const result = await validateArchitecture(root, v1([
      element({ children: ['workflow.parent'] }),
      element({ id: 'workflow.parent', fqn: 'root.parent', kind: 'workflow', title: 'Parent', summary: 'Parent', parent: 'project.root', children: ['workflow.child'], metadata: { elementId: 'workflow.parent' } }),
      element({ id: 'workflow.child', fqn: 'root.parent.child', kind: 'workflow', title: 'Child', summary: 'Child', parent: 'workflow.parent', metadata: { elementId: 'workflow.child' } }),
    ], openMetamodel));
    expect(result.errors).toEqual([]);
  });

  it('rejects duplicate relation triples while allowing different kinds on one pair', async () => {
    const elements = [
      element({ children: ['product.a', 'product.b'] }),
      element({ id: 'product.a', fqn: 'root.a', kind: 'product', title: 'A', summary: 'A', parent: 'project.root', metadata: { elementId: 'product.a' } }),
      element({ id: 'product.b', fqn: 'root.b', kind: 'product', title: 'B', summary: 'B', parent: 'project.root', metadata: { elementId: 'product.b' } }),
    ];
    const model = { ...metamodel, relationships: { invokes: {}, consumes: {} } };
    const allowed = await validateArchitecture(root, {
      ...v1(elements, model),
      relations: [
        { source: 'product.a', kind: 'invokes', target: 'product.b' },
        { source: 'product.a', kind: 'consumes', target: 'product.b' },
      ],
    });
    expect(allowed.errors).toEqual([]);

    const duplicate = await validateArchitecture(root, {
      ...v1(elements, model),
      relations: [
        { source: 'product.a', kind: 'invokes', target: 'product.b' },
        { source: 'product.a', kind: 'consumes', target: 'product.b' },
        { source: 'product.a', kind: 'invokes', target: 'product.b' },
      ],
    });
    expect(duplicate.errors).toContainEqual(expect.objectContaining({ code: 'DUPLICATE_RELATION' }));
  });

  it('rejects every relation self-loop', async () => {
    const elements = [element({ children: ['product.a'] }), element({ id: 'product.a', fqn: 'root.a', kind: 'product', title: 'A', summary: 'A', parent: 'project.root', metadata: { elementId: 'product.a' } })];
    const model = { ...metamodel, relationships: { invokes: {}, consumes: {}, precedes: {}, constrains: {}, validates: {}, produces: {} } };
    for (const kind of Object.keys(model.relationships)) {
      const result = await validateArchitecture(root, { ...v1(elements, model), relations: [{ source: 'product.a', kind, target: 'product.a' }] });
      expect(result.errors).toContainEqual(expect.objectContaining({ code: 'RELATION_SELF_LOOP' }));
    }
  });

  it.each(['belongs_to', 'refines', 'abstracts'])('rejects persisted %s relations', async kind => {
    const result = await validateArchitecture(root, {
      ...v1([
        element({ children: ['product.a'] }),
        element({ id: 'product.a', fqn: 'root.a', kind: 'product', title: 'A', summary: 'A', parent: 'project.root', metadata: { elementId: 'product.a' } }),
      ], { ...metamodel, relationships: { [kind]: {} } }),
      relations: [{ source: 'product.a', kind, target: 'project.root' }],
    });
    expect(result.errors).toContainEqual(expect.objectContaining({ code: 'PERSISTED_CONTAINMENT_RELATION' }));
  });
});
