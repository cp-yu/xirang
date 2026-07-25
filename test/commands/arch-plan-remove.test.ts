import { promises as fs } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { runCLI } from '../helpers/run-cli.js';

const architecture = `xirang { languageVersion '1' }
specification {
  element project { xirang { root true contract optional } }
  element capability { xirang { contract optional parents [project, capability] } }
  relationship invokes
}
model {
  project_root = project 'Root' 'Root summary' {
    metadata { elementId 'project.root' }
    old = capability 'Old' 'Old summary' {
      metadata { elementId 'old.id' }
      child = capability 'Child' 'Child summary' { metadata { elementId 'child.id' } }
    }
    consumer = capability 'Consumer' 'Consumer summary' { metadata { elementId 'consumer.id' } }
  }
  project_root.consumer -[invokes]-> project_root.old
}
`;

const formalSpec = `---
element: old.id
---

# Old

## Purpose
Old contract.

## Requirements

### Requirement: Old behavior
The system SHALL retain old behavior.

#### Scenario: Existing behavior
- **WHEN** old runs
- **THEN** the result is returned
`;

describe('arch plan-remove command', () => {
  const root = path.join(process.cwd(), 'test-arch-plan-remove-tmp');
  const changeDir = path.join(root, '.xirang', 'changes', 'replace-old');

  beforeEach(async () => {
    await fs.mkdir(path.join(root, '.xirang', 'architecture'), { recursive: true });
    await fs.mkdir(path.join(root, '.xirang', 'specs', 'old-contract'), { recursive: true });
    await fs.writeFile(path.join(root, '.xirang', 'architecture', 'model.c4'), architecture);
    await fs.writeFile(path.join(root, '.xirang', 'specs', 'old-contract', 'spec.md'), formalSpec);
  });

  afterEach(async () => fs.rm(root, { recursive: true, force: true }));

  it('reports deterministic formal dependencies by stable identity or current FQN without writing', async () => {
    const before = await fs.readFile(path.join(root, '.xirang', 'architecture', 'model.c4'), 'utf8');
    const byId = await runCLI(['arch', 'plan-remove', 'old.id', '--json'], { cwd: root });
    const byFqn = await runCLI(['arch', 'plan-remove', 'project_root.old', '--json'], { cwd: root });

    expect(byId.exitCode).toBe(0);
    expect(byFqn.exitCode).toBe(0);
    const idResult = JSON.parse(byId.stdout);
    const fqnResult = JSON.parse(byFqn.stdout);
    expect(idResult.subject).toMatchObject({ id: 'old.id', fqn: 'project_root.old' });
    expect(fqnResult.subject).toEqual(idResult.subject);
    expect(idResult.unresolved).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'descendant', identity: 'element:child.id' }),
      expect.objectContaining({ type: 'relationship', identity: 'relationship:consumer.id|invokes|old.id' }),
      expect.objectContaining({ type: 'spec-binding', identity: 'spec:old-contract' }),
    ]));
    expect(idResult.requiredCount).toBe(idResult.unresolved.length);
    expect(await fs.readFile(path.join(root, '.xirang', 'architecture', 'model.c4'), 'utf8')).toBe(before);
  });

  it('returns nonzero for an unknown identity', async () => {
    const result = await runCLI(['arch', 'plan-remove', 'ghost.id', '--json'], { cwd: root });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Element not found: ghost.id');
  });

  it('classifies explicitly removed dependencies as Handled and keeps replacement references unresolved', async () => {
    await fs.mkdir(path.join(changeDir, 'specs'), { recursive: true });
    await fs.writeFile(path.join(changeDir, 'architecture-delta.c4'), `architectureDelta {
      replace element 'old.id' with 'new.id'
      ADDED {
        element 'new.id' { kind 'capability' parent 'project.root' title 'New' summary 'New summary' metadata { elementId 'new.id' } }
      }
      REMOVED {
        relationship 'consumer.id' -[invokes]-> 'old.id'
        element 'old.id'
      }
    }`);

    const result = await runCLI(['arch', 'plan-remove', 'old.id', '--change', 'replace-old', '--json'], { cwd: root });

    expect(result.exitCode).toBe(0);
    const json = JSON.parse(result.stdout);
    expect(json.handled).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'relationship', identity: 'relationship:consumer.id|invokes|old.id' }),
    ]));
    expect(json.unresolved).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'descendant', identity: 'element:child.id' }),
      expect.objectContaining({ type: 'spec-binding', identity: 'spec:old-contract' }),
    ]));
    expect(json.requiredCount).toBe(2);
    expect(json.diagnostics.map((item: any) => item.code)).toEqual(expect.arrayContaining([
      'UNRESOLVED_DESCENDANT',
      'UNRESOLVED_SPEC_BINDING',
    ]));
  });
});
