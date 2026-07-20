import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { assessChangeSyncState, prepareChangeSync, applyPreparedChangeSync } from '../../src/core/change-sync.js';

const formal = `model {
  core = domain 'Core' {
    existing = capability 'Existing' { metadata { capabilityId 'cap.core.existing' } }
  }
}
`;

describe('architecture sync workflow', () => {
  let root: string;
  let changeDir: string;
  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'openspec-architecture-sync-'));
    changeDir = path.join(root, 'openspec', 'changes', 'add');
    await fs.mkdir(path.join(root, 'openspec', 'architecture', 'domains'), { recursive: true });
    await fs.mkdir(changeDir, { recursive: true });
    const architecture = path.join(root, 'openspec', 'architecture');
    await fs.writeFile(path.join(architecture, 'specification.c4'), 'specification { element domain element capability }');
    await fs.writeFile(path.join(architecture, 'domains', 'core.c4'), formal);
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
});
