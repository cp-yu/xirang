import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { validateArchitecture } from '../../../src/utils/architecture-validator.js';
import type { LikeC4Architecture } from '../../../src/utils/likec4-reader.js';

function architecture(overrides: Partial<LikeC4Architecture> = {}): LikeC4Architecture {
  return {
    source: 'likec4', files: [],
    domains: [{ id: 'core', title: 'Core' }],
    capabilities: [{ id: 'core.a', title: 'A', domain: 'core', capabilityId: 'cap.core.a', specs: [] }],
    relations: [], ...overrides,
  };
}

describe('architecture validator', () => {
  let root: string;
  beforeEach(async () => { root = await fs.mkdtemp(path.join(os.tmpdir(), 'openspec-architecture-validator-')); });
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
      capabilities: [{ id: 'core.a', title: 'A', domain: 'core', capabilityId: 'cap.core.a', specs: ['openspec/specs/missing/spec.md'] }],
    }));
    expect(result.warnings[0].message).toBe('Spec file not found: openspec/specs/missing/spec.md');
  });

  it('should return structured validation result', async () => {
    const result = await validateArchitecture(root, architecture());
    expect(result).toEqual({ success: true, errors: [], warnings: [] });
  });
});
