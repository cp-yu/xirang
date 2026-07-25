import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  assessChangeSyncState,
  applyPreparedChangeSync,
  getPendingChangeSync,
  prepareChangeSync,
} from '../../src/core/change-sync.js';
import { ArchiveCommand } from '../../src/core/archive.js';
import { buildSpecRegistry } from '../../src/core/spec-registry.js';

const formal = `model {
  core = domain 'Core' {
    existing = capability 'Existing' { metadata { capabilityId 'cap.core.existing' } }
  }
}
`;

async function architectureSnapshot(root: string): Promise<Map<string, string>> {
  const architecture = path.join(root, '.xirang', 'architecture');
  const files = new Map<string, string>();
  const visit = async (directory: string): Promise<void> => {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(file);
      else files.set(path.relative(architecture, file), await fs.readFile(file, 'utf8'));
    }
  };
  await visit(architecture);
  return files;
}

describe('architecture sync workflow', () => {
  let root: string;
  let changeDir: string;
  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'opsx-architecture-sync-'));
    changeDir = path.join(root, '.xirang', 'changes', 'add');
    await fs.mkdir(path.join(root, '.xirang', 'architecture', 'domains'), { recursive: true });
    await fs.mkdir(changeDir, { recursive: true });
    const architecture = path.join(root, '.xirang', 'architecture');
    await fs.writeFile(path.join(architecture, 'specification.c4'), 'specification { element domain element capability relationship invokes }');
    await fs.writeFile(path.join(architecture, 'domains', 'core.c4'), formal);
    await fs.writeFile(path.join(architecture, 'relations.c4'), 'model {\n}\n');
    await fs.writeFile(path.join(architecture, 'views.c4'), 'views { view index { include * } }');
  });
  afterEach(async () => fs.rm(root, { recursive: true, force: true }));

  it('should merge architecture-delta.c4', async () => {
    await fs.writeFile(path.join(changeDir, 'architecture-delta.c4'), `model { extend core { added = capability 'Added' { metadata { capabilityId 'cap.core.added' } } } }`);
    const state = await assessChangeSyncState(root, 'add');
    expect(state.hasArchitectureDelta).toBe(true);
    await applyPreparedChangeSync(root, await prepareChangeSync(root, state, { skipValidation: true }));
    expect(await fs.readFile(path.join(root, '.xirang', 'architecture', 'domains', 'core.c4'), 'utf8')).toContain("added = capability 'Added'");
  });

  it('treats an absent graph delta as absent and rejects empty operation blocks', async () => {
    const absentState = await assessChangeSyncState(root, 'add');
    expect(absentState.hasArchitectureDelta).toBe(false);
    expect(absentState.requiresSync).toBe(false);

    await fs.writeFile(path.join(changeDir, 'architecture-delta.c4'), 'model {}\n');
    await expect(assessChangeSyncState(root, 'add')).rejects.toThrow(/no actual architecture operation|empty/i);

    await fs.writeFile(path.join(changeDir, 'architecture-delta.c4'), 'model { extend core {} }\n');
    await expect(assessChangeSyncState(root, 'add')).rejects.toThrow(/no actual architecture operation|empty/i);
  });

  it('prepares a sorted architecture and spec manifest with preimage bytes', async () => {
    await fs.writeFile(path.join(changeDir, 'architecture-delta.c4'), `model { extend core { added = capability 'Added' { metadata { capabilityId 'cap.core.added' } } } }`);
    await fs.mkdir(path.join(changeDir, 'specs', 'added'), { recursive: true });
    await fs.writeFile(path.join(changeDir, 'specs', 'added', 'spec.md'), `## ADDED Requirements\n\n### Requirement: Added behavior\nThe system SHALL add behavior.\n\n#### Scenario: Added succeeds\n- **WHEN** added runs\n- **THEN** it succeeds\n`);

    const prepared = await prepareChangeSync(root, await assessChangeSyncState(root, 'add'), { skipValidation: true });
    expect(prepared.manifest.map(entry => entry.path)).toEqual([...prepared.manifest.map(entry => entry.path)].sort());
    expect(prepared.manifest.every(entry => entry.preimage !== undefined)).toBe(true);
    expect(prepared.manifest.some(entry => entry.path.includes('/architecture/'))).toBe(true);
    expect(prepared.manifest.some(entry => entry.path.endsWith('specs/added/spec.md'))).toBe(true);
  });

  it('rolls back graph and specs when a prepared write fails', async () => {
    await fs.writeFile(path.join(changeDir, 'architecture-delta.c4'), `model { extend core { added = capability 'Added' { metadata { capabilityId 'cap.core.added' } } } }`);
    await fs.mkdir(path.join(changeDir, 'specs', 'added'), { recursive: true });
    await fs.writeFile(path.join(changeDir, 'specs', 'added', 'spec.md'), `## ADDED Requirements\n\n### Requirement: Added behavior\nThe system SHALL add behavior.\n\n#### Scenario: Added succeeds\n- **WHEN** added runs\n- **THEN** it succeeds\n`);
    const before = await architectureSnapshot(root);
    const prepared = await prepareChangeSync(root, await assessChangeSyncState(root, 'add'), { skipValidation: true });
    const target = path.join(root, '.xirang', 'specs', 'added');
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, 'blocks directory creation');

    await expect(applyPreparedChangeSync(root, prepared)).rejects.toThrow();
    expect(await architectureSnapshot(root)).toEqual(before);
    await expect(fs.access(path.join(root, '.xirang', 'architecture', 'deltas', 'add.c4'))).rejects.toThrow();
  });

  it('atomically syncs a v1 element and its same-delta Spec binding', async () => {
    const architecture = path.join(root, '.xirang', 'architecture');
    await fs.rm(architecture, { recursive: true });
    await fs.mkdir(architecture, { recursive: true });
    await fs.writeFile(path.join(architecture, 'model.c4'), `xirang { languageVersion '1' }
specification {
  element project { xirang { root true contract optional } }
  element operation { xirang { contract required parents [project] } }
}
model {
  projectRoot = project 'Root' 'Project intent' {
    metadata { elementId 'project.root' }
  }
}
`);
    await fs.writeFile(path.join(changeDir, 'architecture-delta.c4'), `architectureDelta {
  ADDED {
    element 'operation.added' {
      kind 'operation'
      parent 'project.root'
      title 'Added'
      summary 'Added operation'
      metadata { elementId 'operation.added' }
    }
  }
}
`);
    await fs.mkdir(path.join(changeDir, 'specs', 'added'), { recursive: true });
    await fs.writeFile(path.join(changeDir, 'specs', 'added', 'spec.md'), `---
element: operation.added
---
## ADDED Requirements

### Requirement: Added behavior
The system SHALL add behavior.

#### Scenario: Added succeeds
- **WHEN** added runs
- **THEN** it succeeds
`);

    const prepared = await prepareChangeSync(root, await assessChangeSyncState(root, 'add'), { skipValidation: true });
    await applyPreparedChangeSync(root, prepared, { silent: true });

    const registry = await buildSpecRegistry(root);
    expect(registry.getElementForSpec('added')).toBe('operation.added');
    expect(await fs.readFile(path.join(architecture, 'model.c4'), 'utf8')).toContain("elementId 'operation.added'");
    await expect(fs.access(path.join(architecture, 'deltas'))).rejects.toThrow();
  });

  it('reconciles multi-module v1 graph sources without duplicating semantic facts', async () => {
    const architecture = path.join(root, '.xirang', 'architecture');
    await fs.rm(architecture, { recursive: true });
    await fs.mkdir(path.join(architecture, 'domains'), { recursive: true });
    await fs.writeFile(path.join(architecture, 'domains', 'specification.c4'), `xirang { languageVersion '1' }
specification {
  element project { xirang { root true contract optional children [capability] } }
  element capability { xirang { contract optional parents [project] } }
  relationship invokes
}
`);
    await fs.writeFile(path.join(architecture, 'domains', 'model.c4'), `model {
  projectRoot = project 'Root' 'Project intent' {
    metadata { elementId 'project.root' }
    alpha = capability 'Alpha' 'Alpha summary' { metadata { elementId 'alpha.id' } }
    beta = capability 'Beta' 'Beta summary' { metadata { elementId 'beta.id' } }
  }
}
`);
    await fs.writeFile(path.join(architecture, 'domains', 'relations.c4'), `model {
  projectRoot.alpha -[invokes]-> projectRoot.beta
}
`);
    const views = 'views { view index { include * } }\n';
    await fs.writeFile(path.join(architecture, 'views.c4'), views);
    await fs.writeFile(path.join(changeDir, 'architecture-delta.c4'), `architectureDelta { MODIFIED {
      element 'alpha.id' { kind 'capability' parent 'project.root' title 'Alpha' summary 'Updated summary' metadata { elementId 'alpha.id' } }
    } }`);
    await fs.writeFile(path.join(changeDir, '.specs-noop'), '');

    const prepared = await prepareChangeSync(root, await assessChangeSyncState(root, 'add'), { skipValidation: true });
    await applyPreparedChangeSync(root, prepared, { silent: true });

    await expect(fs.access(path.join(architecture, 'domains', 'specification.c4'))).rejects.toThrow();
    await expect(fs.access(path.join(architecture, 'domains', 'model.c4'))).rejects.toThrow();
    await expect(fs.access(path.join(architecture, 'domains', 'relations.c4'))).rejects.toThrow();
    expect(await fs.readFile(path.join(architecture, 'views.c4'), 'utf8')).toBe(views);
    const relations = await fs.readFile(path.join(architecture, 'relations.c4'), 'utf8');
    expect(relations.match(/-\[invokes\]->/g)).toHaveLength(1);
    expect(await fs.readFile(path.join(architecture, 'model.c4'), 'utf8')).toContain('Updated summary');
  });

  it('rejects a stale Formal snapshot before any graph or Spec write', async () => {
    await fs.writeFile(path.join(changeDir, 'architecture-delta.c4'), `model { extend core { added = capability 'Added' { metadata { capabilityId 'cap.core.added' } } } }`);
    await fs.mkdir(path.join(changeDir, 'specs', 'added'), { recursive: true });
    await fs.writeFile(path.join(changeDir, 'specs', 'added', 'spec.md'), `## ADDED Requirements\n\n### Requirement: Added behavior\nThe system SHALL add behavior.\n\n#### Scenario: Added succeeds\n- **WHEN** added runs\n- **THEN** it succeeds\n`);
    const prepared = await prepareChangeSync(root, await assessChangeSyncState(root, 'add'), { skipValidation: true });
    await fs.writeFile(path.join(root, '.xirang', 'architecture', 'views.c4'), 'views { view changed { include * } }');

    await expect(applyPreparedChangeSync(root, prepared)).rejects.toThrow('Formal Semantic Model changed');
    expect(await fs.readFile(path.join(root, '.xirang', 'architecture', 'domains', 'core.c4'), 'utf8')).toBe(formal);
    await expect(fs.access(path.join(root, '.xirang', 'specs', 'added', 'spec.md'))).rejects.toThrow();
  });

  it('rejects invalid v1 relations in the sync target', async () => {
    const architecture = path.join(root, '.xirang', 'architecture');
    await fs.rm(architecture, { recursive: true });
    await fs.mkdir(architecture, { recursive: true });
    await fs.writeFile(path.join(architecture, 'model.c4'), `xirang { languageVersion '1' }
 specification { element project { xirang { root true contract optional } } relationship invokes }
 model { projectRoot = project 'Root' 'Project intent' { metadata { elementId 'project.root' } } payments = project 'Payments' 'Payments' { metadata { elementId 'project.payments' } } reports = project 'Reports' 'Reports' { metadata { elementId 'project.reports' } } }
`);
    await fs.writeFile(path.join(changeDir, 'architecture-delta.c4'), `architectureDelta {
  ADDED {
    relationship 'project.payments' -[invokes]-> 'project.reports'
    relationship 'project.payments' -[invokes]-> 'project.reports'
  }
}
`);

    await expect((async () => prepareChangeSync(root, await assessChangeSyncState(root, 'add'), { skipValidation: true }))())
      .rejects.toThrow();
  });

  it('should move change-local specs to formal', async () => {
    await fs.mkdir(path.join(changeDir, 'specs', 'added'), { recursive: true });
    await fs.writeFile(path.join(changeDir, 'specs', 'added', 'spec.md'), `## ADDED Requirements\n### Requirement: Added behavior\nThe system SHALL add behavior.\n\n#### Scenario: Added succeeds\n- **WHEN** added runs\n- **THEN** it succeeds\n`);
    const state = await assessChangeSyncState(root, 'add');
    await applyPreparedChangeSync(root, await prepareChangeSync(root, state, { skipValidation: true }));
    await expect(fs.access(path.join(root, '.xirang', 'specs', 'added', 'spec.md'))).resolves.toBeUndefined();
  });

  it('validates rebuilt legacy Specs unless validation is explicitly skipped', async () => {
    const specDir = path.join(changeDir, 'specs', 'invalid');
    await fs.mkdir(specDir, { recursive: true });
    await fs.writeFile(path.join(specDir, 'spec.md'), `## ADDED Requirements\n\n### Requirement: Invalid behavior\nThis statement has no normative keyword.\n`);
    const state = await assessChangeSyncState(root, 'add');

    await expect(prepareChangeSync(root, state)).rejects.toThrow('Validation errors in Rebuilt spec invalid');
    await expect(prepareChangeSync(root, state, { skipValidation: true })).resolves.toBeDefined();
  });

  it('should keep a colliding capability delta pending when its content differs', async () => {
    await fs.writeFile(path.join(changeDir, 'architecture-delta.c4'), `model {
  extend core {
    existing = capability 'Changed Existing' {
      description 'The delta has different content.'
      metadata { capabilityId 'cap.core.existing' }
    }
  }
}
`);
    const state = await assessChangeSyncState(root, 'add');

    expect((await getPendingChangeSync(root, state)).architecture).toBe(true);
    await expect(prepareChangeSync(root, state, { skipValidation: true })).rejects.toThrow();
  });

  it('should keep a colliding relation delta pending when its description differs', async () => {
    await fs.writeFile(path.join(root, '.xirang', 'architecture', 'relations.c4'), `model {
  core.existing -[invokes]-> core.existing { description 'Formal description.' }
}
`);
    await fs.writeFile(path.join(changeDir, 'architecture-delta.c4'), `model {
  core.existing -[invokes]-> core.existing { description 'Changed description.' }
}
`);

    expect((await getPendingChangeSync(root, await assessChangeSyncState(root, 'add'))).architecture).toBe(true);
  });

  it('should archive a successfully synced architecture delta without losing formal content', async () => {
    await fs.writeFile(path.join(changeDir, 'architecture-delta.c4'), `model {
  extend core {
    added = capability 'Added' {
      description 'Added by the change.'
      metadata {
        capabilityId 'cap.core.added'
        status 'active'
        specs ['.xirang/changes/add/specs/added/spec.md']
      }
    }
  }
}
`);
    await fs.writeFile(path.join(changeDir, 'tasks.md'), '- [x] synced architecture\n');
    const state = await assessChangeSyncState(root, 'add');
    await applyPreparedChangeSync(root, await prepareChangeSync(root, state, { skipValidation: true }), { silent: true });

    expect((await getPendingChangeSync(root, await assessChangeSyncState(root, 'add'))).architecture).toBe(false);
    const originalCwd = process.cwd();
    process.chdir(root);
    try {
      await new ArchiveCommand().execute('add', { yes: true, noVerify: true });
    } finally {
      process.chdir(originalCwd);
    }

    const archiveNames = await fs.readdir(path.join(root, '.xirang', 'changes', 'archive'));
    const archived = path.join(root, '.xirang', 'changes', 'archive', archiveNames.find(name => name.endsWith('-add'))!);
    await expect(fs.readFile(path.join(archived, 'architecture-delta.c4'), 'utf8')).resolves.toContain('extend core');
    await expect(fs.readFile(path.join(root, '.xirang', 'architecture', 'domains', 'core.c4'), 'utf8'))
      .resolves.toContain("added = capability 'Added'");
  });

  it('replaces an existing target after an injected Windows-style EPERM', async () => {
    await fs.writeFile(path.join(changeDir, 'architecture-delta.c4'), `model { extend core { added = capability 'Added' { metadata { capabilityId 'cap.core.added' } } } }`);
    const prepared = await prepareChangeSync(root, await assessChangeSyncState(root, 'add'), { skipValidation: true });
    let attempts = 0;
    const rename = vi.fn(async (source: string, target: string) => {
      attempts += 1;
      if (attempts === 1) throw Object.assign(new Error('replacement denied'), { code: 'EPERM' });
      await fs.rename(source, target);
    });

    await expect(applyPreparedChangeSync(root, prepared, { filesystem: { rename } })).resolves.toMatchObject({ architecture: 'synced' });
    expect(await fs.readFile(path.join(root, '.xirang', 'architecture', 'domains', 'core.c4'), 'utf8')).toContain("added = capability 'Added'");
    expect(rename).toHaveBeenCalledTimes(2);
  });

  it('reports evidence refresh failure after semantic commit without claiming rollback', async () => {
    await fs.mkdir(path.join(changeDir, 'specs', 'added'), { recursive: true });
    await fs.writeFile(path.join(changeDir, 'specs', 'added', 'spec.md'), `## ADDED Requirements\n\n### Requirement: Added behavior\nThe system SHALL add behavior.\n\n#### Scenario: Added succeeds\n- **WHEN** added runs\n- **THEN** it succeeds\n`);
    const prepared = await prepareChangeSync(root, await assessChangeSyncState(root, 'add'), { skipValidation: true });

    await expect(applyPreparedChangeSync(root, prepared, {
      refreshEvidence: vi.fn().mockRejectedValue(new Error('evidence unavailable')),
    })).rejects.toThrow(/Semantic sync committed.*evidence refresh failed/);
    await expect(fs.access(path.join(root, '.xirang', 'specs', 'added', 'spec.md'))).resolves.toBeUndefined();
  });

  it('should restore the complete architecture when a later spec write fails', async () => {
    await fs.writeFile(path.join(changeDir, 'architecture-delta.c4'), `model {
  added = domain 'Added' {
    run = capability 'Run' { metadata { capabilityId 'cap.added.run' } }
  }
  added.run -[invokes]-> core.existing
}
`);
    const specDir = path.join(changeDir, 'specs', 'broken');
    await fs.mkdir(specDir, { recursive: true });
    await fs.writeFile(path.join(specDir, 'spec.md'), `## ADDED Requirements
### Requirement: Broken target
The system SHALL expose a broken target.

#### Scenario: Write fails
- **WHEN** sync writes the spec
- **THEN** the transaction rolls back
`);
    const before = await architectureSnapshot(root);
    const state = await assessChangeSyncState(root, 'add');
    const prepared = await prepareChangeSync(root, state, { skipValidation: true });
    const targetParent = path.join(root, '.xirang', 'specs', 'broken');
    await fs.mkdir(path.dirname(targetParent), { recursive: true });
    await fs.writeFile(targetParent, 'blocks mkdir');

    await expect(applyPreparedChangeSync(root, prepared)).rejects.toThrow();
    expect(await architectureSnapshot(root)).toEqual(before);
    await expect(fs.access(path.join(root, '.xirang', 'architecture', 'domains', 'added.c4'))).rejects.toThrow();
  });
});
