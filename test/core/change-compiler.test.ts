import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { compileArchitectureChange, compileChange } from '../../src/core/change-compiler.js';
import type { SemanticContract, TargetSemanticModel } from '../../src/utils/semantic-model.js';

const formal: TargetSemanticModel = {
  architecture: {
    languageVersion: '1',
    metamodel: {
      elements: {
        project: { root: true, contractPolicy: 'optional' },
        capability: { contractPolicy: 'required', parents: ['project', 'capability'] },
      },
      relationships: { invokes: {} },
    },
    elements: [
      { id: 'project.root', fqn: 'root', kind: 'project', title: 'Root', summary: 'Root', parent: null, children: ['old.id'], metadata: { elementId: 'project.root' } },
      { id: 'old.id', fqn: 'root.old', kind: 'capability', title: 'Old', summary: 'Old summary', parent: 'project.root', children: ['old.child'], metadata: { elementId: 'old.id', status: 'active' } },
      { id: 'old.child', fqn: 'root.old.child', kind: 'capability', title: 'Child', summary: 'Child summary', parent: 'old.id', children: [], metadata: { elementId: 'old.child' } },
      { id: 'consumer.id', fqn: 'root.consumer', kind: 'capability', title: 'Consumer', summary: 'Consumer summary', parent: 'project.root', children: [], metadata: { elementId: 'consumer.id', owner: 'old.id' } },
    ],
    relations: [{ source: 'consumer.id', kind: 'invokes', target: 'old.id' }],
  },
  contracts: [{
    specId: 'old-contract',
    elementId: 'old.id',
    requirements: [{ title: 'Old behavior', body: 'The system SHALL behave.', scenarios: [{ title: 'Existing scenario', body: 'WHEN old THEN result' }] }],
  }],
};

const newElement = `element 'new.id' {
  kind 'capability'
  parent 'project.root'
  title 'New'
  summary 'New summary'
  metadata { elementId 'new.id' }
}`;

function replacementSource(withHint: boolean): string {
  return `architectureDelta {
    ${withHint ? "replace element 'old.id' with 'new.id'" : ''}
    ADDED { ${newElement} }
    REMOVED { element 'old.id' }
  }`;
}

describe('compileArchitectureChange', () => {
  it('keeps replacement hints presentation-only and reports every surviving reference', () => {
    const withHint = compileArchitectureChange(formal, replacementSource(true));
    const withoutHint = compileArchitectureChange(formal, replacementSource(false));

    expect(withHint.target).toEqual(withoutHint.target);
    expect(withHint.diff.summary).toEqual(withoutHint.diff.summary);
    expect(withHint.diff.entries.find(entry => entry.identity === 'old.id')?.replacement).toEqual({ with: 'new.id' });
    expect(withoutHint.diff.entries.find(entry => entry.identity === 'old.id')?.replacement).toBeUndefined();
    expect(withHint.diagnostics.map(item => item.code)).toEqual(expect.arrayContaining([
      'UNRESOLVED_DESCENDANT',
      'UNRESOLVED_RELATIONSHIP',
      'UNRESOLVED_SPEC_BINDING',
      'UNRESOLVED_METADATA_REFERENCE',
    ]));
  });

  it('rejects identity precondition failures, kind changes, and declared no-op modifications', () => {
    const result = compileArchitectureChange(formal, `architectureDelta {
      ADDED { ${newElement} element 'old.id' { kind 'capability' parent 'project.root' title 'Old duplicate' summary 'Duplicate' metadata { elementId 'old.id' } } }
      MODIFIED {
        element 'consumer.id' { kind 'project' parent 'project.root' title 'Consumer' summary 'Consumer summary' metadata { elementId 'consumer.id' } }
        element 'old.child' { kind 'capability' parent 'old.id' title 'Child' summary 'Child summary' metadata { elementId 'old.child' } }
      }
      REMOVED { element 'ghost.id' }
    }`);

    expect(result.valid).toBe(false);
    expect(result.diagnostics.map(item => item.code)).toEqual(expect.arrayContaining([
      'ADDED_IDENTITY_EXISTS',
      'REMOVED_IDENTITY_MISSING',
      'ELEMENT_KIND_CHANGE',
      'DECLARED_OPERATION_NO_EFFECT',
    ]));
  });

  it('compiles graph and bound contract operations from one immutable Formal snapshot', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'opsx-change-compiler-'));
    try {
      const formalSpec = path.join(root, '.opsx', 'specs', 'old-contract', 'spec.md');
      const changeDir = path.join(root, '.opsx', 'changes', 'change-a');
      await fs.mkdir(path.dirname(formalSpec), { recursive: true });
      await fs.mkdir(path.join(changeDir, 'specs', 'old-contract'), { recursive: true });
      await fs.writeFile(formalSpec, `---\nelement: old.id\n---\n\n# Contract\n\n## Purpose\nOld contract.\n\n## Requirements\n\n### Requirement: Old behavior\nThe system SHALL behave.\n\n#### Scenario: Existing scenario\n- **WHEN** old\n- **THEN** result\n`);
      await fs.writeFile(path.join(changeDir, 'specs', 'old-contract', 'spec.md'), `---\nelement: old.id\n---\n\n## MODIFIED Requirements\n\n### Requirement: Old behavior\nThe system SHALL behave differently.\n\n#### Scenario: Existing scenario\n- **WHEN** old\n- **THEN** changed result\n`);
      await fs.writeFile(path.join(changeDir, 'architecture-delta.c4'), `architectureDelta { MODIFIED {
        element 'old.id' { kind 'capability' parent 'project.root' title 'Old' summary 'Changed summary' metadata { elementId 'old.id' status 'active' } }
      } }`);

      const result = await compileChange(root, 'change-a', {
        architecture: {
          ...formal.architecture,
          metamodel: {
            ...formal.architecture.metamodel,
            elements: {
              ...formal.architecture.metamodel.elements,
              capability: { ...formal.architecture.metamodel.elements.capability, contractPolicy: 'optional' },
            },
          },
        },
      });

      expect(result.diagnostics).toEqual([]);
      expect(result.valid).toBe(true);
      expect(result.target?.contracts[0]?.requirements[0]?.body).toContain('behave differently');
      expect(result.diff.entries).toEqual(expect.arrayContaining([
        expect.objectContaining({ kind: 'element', identity: 'old.id', operation: 'MODIFIED' }),
        expect.objectContaining({ kind: 'requirement', identity: 'old-contract#Old behavior', operation: 'MODIFIED' }),
      ]));
    } finally {
      await fs.rm(root, { recursive: true, force: true });
    }
  });

  it('runs authoritative Semantic Model and relationship validation on materialized targets', () => {
    const unresolved = compileArchitectureChange(formal, `architectureDelta {
      ADDED { relationship 'ghost.source' -[invokes]-> 'ghost.target' }
    }`);
    const invalidFormal: TargetSemanticModel = structuredClone(formal);
    invalidFormal.architecture.elements.push({
      id: 'project.second', fqn: 'second', kind: 'project', title: 'Second', summary: 'Second root',
      parent: null, children: [], metadata: { elementId: 'project.second' },
    });
    invalidFormal.architecture.metamodel.relationships.precedes = {};
    invalidFormal.architecture.relations.push(
      { source: 'old.id', kind: 'precedes', target: 'consumer.id' },
      { source: 'consumer.id', kind: 'precedes', target: 'old.id' },
    );
    const invalid = compileArchitectureChange(invalidFormal, `architectureDelta { MODIFIED {
      element 'old.id' { kind 'capability' parent 'project.root' title 'Old' summary 'Updated' metadata { elementId 'old.id' status 'active' } }
    } }`);

    expect(unresolved.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'INVALID_RELATION_ENDPOINT' }),
    ]));
    expect(invalid.diagnostics.map(item => item.code)).toEqual(expect.arrayContaining([
      'MULTIPLE_PROJECT_ROOTS',
      'PRECEDES_CYCLE',
    ]));

    const unknownBinding = compileArchitectureChange(formal, `architectureDelta { MODIFIED {
      element 'old.id' { kind 'capability' parent 'project.root' title 'Old' summary 'Updated' metadata { elementId 'old.id' status 'active' } }
    } }`, { targetContracts: [{ specId: 'auth', elementId: 'ghost.id', requirements: [] }] });
    expect(unknownBinding.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'UNKNOWN_SPEC_ELEMENT', path: 'specs/auth/spec.md' }),
    ]));
  });

  it('validates a specs-only target as a complete Semantic Model', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'opsx-specs-only-compiler-'));
    try {
      const formalSpec = path.join(root, '.opsx', 'specs', 'old-contract', 'spec.md');
      const changeSpec = path.join(root, '.opsx', 'changes', 'remove-contract', 'specs', 'old-contract', 'spec.md');
      await fs.mkdir(path.dirname(formalSpec), { recursive: true });
      await fs.mkdir(path.dirname(changeSpec), { recursive: true });
      await fs.writeFile(formalSpec, `---\nelement: old.id\n---\n\n# Contract\n\n## Purpose\nOld contract.\n\n## Requirements\n\n### Requirement: Old behavior\nThe system SHALL behave.\n\n#### Scenario: Existing scenario\n- **WHEN** old\n- **THEN** result\n`);
      await fs.writeFile(changeSpec, `---\nelement: old.id\n---\n\n## REMOVED Requirements\n\n### Requirement: Old behavior\n`);

      const result = await compileChange(root, 'remove-contract', { architecture: formal.architecture });

      expect(result.valid).toBe(false);
      expect(result.diagnostics).toEqual(expect.arrayContaining([
        expect.objectContaining({ code: 'MISSING_REQUIRED_CONTRACT', identity: 'old.id' }),
      ]));
    } finally {
      await fs.rm(root, { recursive: true, force: true });
    }
  });

  it('removes a fully deleted Spec with its removed element from one Target model', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'opsx-whole-spec-removal-'));
    try {
      const formalSpec = path.join(root, '.opsx', 'specs', 'obsolete', 'spec.md');
      const changeDir = path.join(root, '.opsx', 'changes', 'remove-obsolete');
      await fs.mkdir(path.dirname(formalSpec), { recursive: true });
      await fs.mkdir(path.join(changeDir, 'specs', 'obsolete'), { recursive: true });
      await fs.writeFile(formalSpec, `---\nelement: obsolete.id\n---\n\n# Obsolete Specification\n\n## Purpose\nObsolete behavior contract.\n\n## Requirements\n\n### Requirement: Obsolete behavior\nThe system SHALL expose obsolete behavior.\n\n#### Scenario: Existing behavior\n- **WHEN** invoked\n- **THEN** obsolete behavior runs\n`);
      await fs.writeFile(path.join(changeDir, 'specs', 'obsolete', 'spec.md'), `---\nelement: obsolete.id\n---\n\n## REMOVED Requirements\n\n### Requirement: Obsolete behavior\n`);
      await fs.writeFile(path.join(changeDir, 'architecture-delta.c4'), `architectureDelta {\n  REMOVED { element 'obsolete.id' }\n}\n`);

      const result = await compileChange(root, 'remove-obsolete', {
        architecture: {
          languageVersion: '1',
          metamodel: {
            elements: {
              project: { root: true, contractPolicy: 'optional' },
              capability: { contractPolicy: 'required', parents: ['project'] },
            },
            relationships: {},
          },
          elements: [
            { id: 'project.root', fqn: 'root', kind: 'project', title: 'Root', summary: 'Root', parent: null, children: ['obsolete.id'], metadata: { elementId: 'project.root' } },
            { id: 'obsolete.id', fqn: 'root.obsolete', kind: 'capability', title: 'Obsolete', summary: 'Obsolete', parent: 'project.root', children: [], metadata: { elementId: 'obsolete.id' } },
          ],
          relations: [],
        },
      });

      expect(result.valid).toBe(true);
      expect(result.diagnostics).toEqual([]);
      expect(result.target?.architecture.elements.map(element => element.id)).toEqual(['project.root']);
      expect(result.target?.contracts).toEqual([]);
    } finally {
      await fs.rm(root, { recursive: true, force: true });
    }
  });

  it('derives property and Scenario entries from Formal and Target comparison', () => {
    const targetContracts: SemanticContract[] = [{
      specId: 'old-contract',
      elementId: 'old.id',
      requirements: [{
        title: 'Old behavior',
        body: 'The system SHALL behave differently.',
        scenarios: [
          { title: 'Existing scenario', body: 'WHEN old THEN changed result' },
          { title: 'New scenario', body: 'WHEN new THEN result' },
        ],
      }],
    }];
    const result = compileArchitectureChange(formal, `architectureDelta {
      MODIFIED {
        element 'old.id' {
          kind 'capability'
          parent 'project.root'
          title 'Old'
          summary 'Changed summary'
          metadata { elementId 'old.id' }
        }
      }
    }`, { targetContracts });

    const element = result.diff.entries.find(entry => entry.kind === 'element' && entry.identity === 'old.id');
    expect(element?.children).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'property', identity: 'old.id.summary', operation: 'MODIFIED' }),
      expect.objectContaining({ kind: 'property', identity: 'old.id.metadata.status', operation: 'REMOVED' }),
    ]));
    const requirement = result.diff.entries.find(entry => entry.kind === 'requirement' && entry.identity === 'old-contract#Old behavior');
    expect(requirement?.children).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'scenario', identity: 'old-contract#Old behavior#Existing scenario', operation: 'MODIFIED' }),
      expect.objectContaining({ kind: 'scenario', identity: 'old-contract#Old behavior#New scenario', operation: 'ADDED' }),
    ]));
  });
});
