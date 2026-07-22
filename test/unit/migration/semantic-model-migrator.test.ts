import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { migrateSemanticModel } from '../../../src/migration/semantic-model-migrator.js';

const graph = `model {
  core = domain 'Core' {
    run = capability 'Run' { metadata { capabilityId 'cap.core.run' } }
    other = capability 'Other' { metadata { capabilityId 'cap.core.other' } }
  }
}
`;

const spec = (owners: string) => `---\ncapabilities:\n${owners}\n---\n\n# Spec\n\n## Purpose\nRun work.\n\n## Requirements\n\n### Requirement: Run\nThe system SHALL run.\n\n#### Scenario: Run succeeds\n- **WHEN** run is requested\n- **THEN** work runs\n`;

const roots: string[] = [];
afterEach(async () => {
  await Promise.all(roots.splice(0).map(root => fs.rm(root, { recursive: true, force: true })));
});

describe('semantic model migrator', () => {
  it('maps only unique legacy capability owners to deterministic element IDs', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'opsx-semantic-unit-'));
    roots.push(root);
    await fs.mkdir(path.join(root, '.opsx', 'architecture'), { recursive: true });
    await fs.mkdir(path.join(root, '.opsx', 'specs', 'run'), { recursive: true });
    await fs.mkdir(path.join(root, '.opsx', 'specs', 'other'), { recursive: true });
    await fs.writeFile(path.join(root, '.opsx', 'architecture', 'model.c4'), graph);
    await fs.writeFile(path.join(root, '.opsx', 'specs', 'run', 'spec.md'), spec('  - cap.core.run'));
    await fs.writeFile(path.join(root, '.opsx', 'specs', 'other', 'spec.md'), spec('  - cap.core.other'));

    const result = await migrateSemanticModel(root);
    expect(result.report.gaps).toEqual([]);
    expect(result.report.contractPolicies).toEqual([
      { kind: 'project', contractPolicy: 'required', basis: 'generated-project-contract' },
      { kind: 'domain', contractPolicy: 'optional', basis: 'legacy-structural-containment' },
      { kind: 'capability', contractPolicy: 'required', basis: 'legacy-capability-contract' },
    ]);
    expect(result.report.resolvedMappings).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'capability', legacyId: 'cap.core.run', elementId: 'project.root/domain.core/cap.core.run' }),
      expect.objectContaining({ type: 'spec', specId: 'run', elementId: 'project.root/domain.core/cap.core.run' }),
    ]));
    const candidateSpec = await fs.readFile(path.join(result.candidatePath, '.opsx', 'specs', 'run', 'spec.md'), 'utf8');
    expect(candidateSpec).toContain('element: project.root/domain.core/cap.core.run');
    const specification = await fs.readFile(path.join(result.candidatePath, '.opsx', 'architecture', 'specification.c4'), 'utf8');
    expect(specification).toMatch(/element project[\s\S]*contract required/);
    expect(specification).toMatch(/element domain[\s\S]*contract optional/);
    expect(specification).toMatch(/element capability[\s\S]*contract required/);
    await expect(fs.readFile(path.join(result.candidatePath, '.opsx', 'specs', 'project-contract', 'spec.md'), 'utf8'))
      .resolves.toContain('element: project.root');
  });

  it('records an auditable gap instead of defaulting an unresolved contract policy to optional', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'opsx-semantic-unit-'));
    roots.push(root);
    const model = `specification {\n  element actor\n}\n\n${graph}`;
    const graphPath = path.join(root, '.opsx', 'architecture', 'model.c4');
    await fs.mkdir(path.dirname(graphPath), { recursive: true });
    await fs.writeFile(graphPath, model);
    const before = await fs.readFile(graphPath);

    const result = await migrateSemanticModel(root);

    expect(result.report.gaps).toContainEqual(expect.objectContaining({
      code: 'UNKNOWN_CONTRACT_POLICY',
      source: expect.stringContaining('model.c4'),
      resolution: 'human-review',
    }));
    await expect(migrateSemanticModel(root, { promote: true, yes: true })).rejects.toThrow('UNKNOWN_CONTRACT_POLICY');
    await expect(fs.readFile(graphPath)).resolves.toEqual(before);
    const specification = await fs.readFile(path.join(result.candidatePath, '.opsx', 'architecture', 'specification.c4'), 'utf8');
    expect(specification).not.toMatch(/element actor[\s\S]*contract optional/);
  });

  it('rejects a candidate when a required legacy capability has no uniquely bound Spec', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'opsx-semantic-unit-'));
    roots.push(root);
    const graphPath = path.join(root, '.opsx', 'architecture', 'model.c4');
    const specPath = path.join(root, '.opsx', 'specs', 'run', 'spec.md');
    await fs.mkdir(path.dirname(graphPath), { recursive: true });
    await fs.mkdir(path.dirname(specPath), { recursive: true });
    await fs.writeFile(graphPath, graph);
    await fs.writeFile(specPath, spec('  - cap.core.run'));
    const beforeGraph = await fs.readFile(graphPath);
    const beforeSpec = await fs.readFile(specPath);

    const result = await migrateSemanticModel(root);

    expect(result.report.validation).toMatchObject({ success: false });
    expect(result.report.validation.errors).toContainEqual(expect.stringContaining('MISSING_REQUIRED_CONTRACT'));
    await expect(migrateSemanticModel(root, { promote: true, yes: true })).rejects.toThrow('MISSING_REQUIRED_CONTRACT');
    await expect(fs.readFile(graphPath)).resolves.toEqual(beforeGraph);
    await expect(fs.readFile(specPath)).resolves.toEqual(beforeSpec);
  });

  it('rejects invalid relations in the migration candidate', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'opsx-semantic-unit-'));
    roots.push(root);
    await fs.mkdir(path.join(root, '.opsx', 'architecture'), { recursive: true });
    await fs.writeFile(path.join(root, '.opsx', 'architecture', 'model.c4'), graph.replace('\n}\n', '\n  core.run -[invokes]-> core.other\n  core.run -[invokes]-> core.other\n}\n'));

    const result = await migrateSemanticModel(root);

    expect(result.report.gaps).toContainEqual(expect.objectContaining({ code: 'VALIDATION_FAILURE', message: expect.stringContaining('Duplicate relation') }));
  });

  it('records multiple owners and orphan specs as unresolved gaps', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'opsx-semantic-unit-'));
    roots.push(root);
    await fs.mkdir(path.join(root, '.opsx', 'architecture'), { recursive: true });
    await fs.mkdir(path.join(root, '.opsx', 'specs', 'ambiguous'), { recursive: true });
    await fs.mkdir(path.join(root, '.opsx', 'specs', 'orphan'), { recursive: true });
    await fs.writeFile(path.join(root, '.opsx', 'architecture', 'model.c4'), graph);
    await fs.writeFile(path.join(root, '.opsx', 'specs', 'ambiguous', 'spec.md'), spec('  - cap.core.run\n  - cap.core.other'));
    await fs.writeFile(path.join(root, '.opsx', 'specs', 'orphan', 'spec.md'), '# Orphan');

    const result = await migrateSemanticModel(root);
    expect(result.report.gaps.map(gap => gap.code)).toEqual(expect.arrayContaining(['MULTIPLE_SPEC_OWNERS', 'ORPHAN_SPEC']));
    expect(result.report.gaps.every(gap => gap.resolution === 'human-review')).toBe(true);
  });

  it('excludes missing and duplicate capability identities without affecting valid mappings', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'opsx-semantic-unit-'));
    roots.push(root);
    const mixedGraph = `model {
  core = domain 'Core' {
    valid = capability 'Valid' { metadata { capabilityId 'cap.core.valid' } }
    missing = capability 'Missing identity'
    duplicateOne = capability 'Duplicate one' { metadata { capabilityId 'cap.shared.duplicate' } }
  }
  secondary = domain 'Secondary' {
    duplicateTwo = capability 'Duplicate two' { metadata { capabilityId 'cap.shared.duplicate' } }
  }
  core.valid -[invokes]-> core.missing
  core.valid -[invokes]-> secondary.duplicateTwo
}
`;
    const architecture = path.join(root, '.opsx', 'architecture');
    await fs.mkdir(architecture, { recursive: true });
    await fs.mkdir(path.join(root, '.opsx', 'specs', 'valid'), { recursive: true });
    await fs.mkdir(path.join(root, '.opsx', 'specs', 'duplicate'), { recursive: true });
    await fs.writeFile(path.join(architecture, 'model.c4'), mixedGraph);
    await fs.writeFile(path.join(root, '.opsx', 'specs', 'valid', 'spec.md'), spec('  - cap.core.valid'));
    await fs.writeFile(path.join(root, '.opsx', 'specs', 'duplicate', 'spec.md'), spec('  - cap.shared.duplicate'));

    const result = await migrateSemanticModel(root);
    const candidateModel = await fs.readFile(path.join(result.candidatePath, '.opsx', 'architecture', 'model.c4'), 'utf8');
    const candidateRelations = await fs.readFile(path.join(result.candidatePath, '.opsx', 'architecture', 'relations.c4'), 'utf8');
    const duplicateSpec = await fs.readFile(path.join(result.candidatePath, '.opsx', 'specs', 'duplicate', 'spec.md'), 'utf8');

    expect(result.report.gaps.map(gap => gap.code)).toEqual(expect.arrayContaining([
      'MISSING_CAPABILITY_ID',
      'DUPLICATE_CAPABILITY_ID',
      'DUPLICATE_CAPABILITY_MAPPING',
    ]));
    expect(result.report.resolvedMappings).toContainEqual(expect.objectContaining({
      type: 'capability', legacyId: 'cap.core.valid', elementId: 'project.root/domain.core/cap.core.valid',
    }));
    expect(result.report.resolvedMappings).not.toContainEqual(expect.objectContaining({ legacyId: 'cap.shared.duplicate' }));
    expect(candidateModel).toContain("valid = capability 'Valid'");
    expect(candidateModel).not.toContain('Missing identity');
    expect(candidateModel).not.toContain('Duplicate one');
    expect(candidateModel).not.toContain('Duplicate two');
    expect(candidateRelations).not.toContain('core.missing');
    expect(candidateRelations).not.toContain('duplicateTwo');
    expect(duplicateSpec).not.toMatch(/^---\nelement:/);
  });

  it('restores formal graph and specs when promotion fails mid-transaction', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'opsx-semantic-unit-'));
    roots.push(root);
    const graphPath = path.join(root, '.opsx', 'architecture', 'model.c4');
    const specPath = path.join(root, '.opsx', 'specs', 'run', 'spec.md');
    await fs.mkdir(path.dirname(graphPath), { recursive: true });
    await fs.mkdir(path.dirname(specPath), { recursive: true });
    const transactionGraph = graph.replace("    other = capability 'Other' { metadata { capabilityId 'cap.core.other' } }\n", '');
    await fs.writeFile(graphPath, transactionGraph);
    await fs.writeFile(specPath, spec('  - cap.core.run'));
    const beforeGraph = await fs.readFile(graphPath);
    const beforeSpec = await fs.readFile(specPath);
    const rename = fs.rename.bind(fs);
    const spy = vi.spyOn(fs, 'rename').mockImplementation(async (source, target) => {
      if (path.basename(String(source)) === 'specs' && String(source).includes('.semantic-model-stage-')) {
        throw new Error('injected promotion failure');
      }
      return rename(source, target);
    });

    await expect(migrateSemanticModel(root, { promote: true, yes: true })).rejects.toThrow('injected promotion failure');
    spy.mockRestore();
    await expect(fs.readFile(graphPath)).resolves.toEqual(beforeGraph);
    await expect(fs.readFile(specPath)).resolves.toEqual(beforeSpec);
  });

  it('uses a resolved custom candidate path', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'opsx-semantic-unit-'));
    roots.push(root);
    await fs.mkdir(path.join(root, '.opsx', 'architecture'), { recursive: true });
    await fs.writeFile(path.join(root, '.opsx', 'architecture', 'model.c4'), graph);
    const candidate = path.join(root, 'tmp', 'candidate');
    const result = await migrateSemanticModel(root, { candidatePath: candidate });
    expect(result.candidatePath).toBe(path.resolve(candidate));
    await expect(fs.access(path.join(candidate, 'migration-report.json'))).resolves.toBeUndefined();
  });
});
