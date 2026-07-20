import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  assessChangeSyncState,
  applyPreparedChangeSync,
  getPendingChangeSync,
  prepareChangeSync,
} from '../../src/core/change-sync.js';
import { ArchiveCommand } from '../../src/core/archive.js';

const formal = `model {
  core = domain 'Core' {
    existing = capability 'Existing' { metadata { capabilityId 'cap.core.existing' } }
  }
}
`;

async function architectureSnapshot(root: string): Promise<Map<string, string>> {
  const architecture = path.join(root, 'openspec', 'architecture');
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
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'openspec-architecture-sync-'));
    changeDir = path.join(root, 'openspec', 'changes', 'add');
    await fs.mkdir(path.join(root, 'openspec', 'architecture', 'domains'), { recursive: true });
    await fs.mkdir(changeDir, { recursive: true });
    const architecture = path.join(root, 'openspec', 'architecture');
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
    expect(await fs.readFile(path.join(root, 'openspec', 'architecture', 'domains', 'core.c4'), 'utf8')).toContain("added = capability 'Added'");
  });

  it('should move change-local specs to formal', async () => {
    await fs.mkdir(path.join(changeDir, 'specs', 'added'), { recursive: true });
    await fs.writeFile(path.join(changeDir, 'specs', 'added', 'spec.md'), `## ADDED Requirements\n### Requirement: Added behavior\nThe system SHALL add behavior.\n\n#### Scenario: Added succeeds\n- **WHEN** added runs\n- **THEN** it succeeds\n`);
    const state = await assessChangeSyncState(root, 'add');
    await applyPreparedChangeSync(root, await prepareChangeSync(root, state, { skipValidation: true }));
    await expect(fs.access(path.join(root, 'openspec', 'specs', 'added', 'spec.md'))).resolves.toBeUndefined();
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
    expect((await prepareChangeSync(root, state, { skipValidation: true })).architecture).not.toBeNull();
  });

  it('should keep a colliding relation delta pending when its description differs', async () => {
    await fs.writeFile(path.join(root, 'openspec', 'architecture', 'relations.c4'), `model {
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
        specs ['openspec/changes/add/specs/added/spec.md']
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

    const archiveNames = await fs.readdir(path.join(root, 'openspec', 'changes', 'archive'));
    const archived = path.join(root, 'openspec', 'changes', 'archive', archiveNames.find(name => name.endsWith('-add'))!);
    await expect(fs.access(path.join(archived, 'architecture-delta.c4'))).rejects.toThrow();
    await expect(fs.readFile(path.join(root, 'openspec', 'architecture', 'domains', 'core.c4'), 'utf8'))
      .resolves.toContain("added = capability 'Added'");
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
    const targetParent = path.join(root, 'openspec', 'specs', 'broken');
    await fs.mkdir(path.dirname(targetParent), { recursive: true });
    await fs.writeFile(targetParent, 'blocks mkdir');

    await expect(applyPreparedChangeSync(root, prepared)).rejects.toThrow();
    expect(await architectureSnapshot(root)).toEqual(before);
    await expect(fs.access(path.join(root, 'openspec', 'architecture', 'domains', 'added.c4'))).rejects.toThrow();
  });
});
