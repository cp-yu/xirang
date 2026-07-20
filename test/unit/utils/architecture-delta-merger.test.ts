import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mergeArchitectureDelta } from '../../../src/utils/architecture-delta-merger.js';

const formal = `model {
  core = domain 'Core' {
    existing = capability 'Existing' {
      metadata { capabilityId 'cap.core.existing' }
    }
  }
}
`;

describe('architecture delta merger', () => {
  let root: string;
  let delta: string;
  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'openspec-delta-merger-'));
    const architecture = path.join(root, 'openspec', 'architecture');
    await fs.mkdir(path.join(architecture, 'domains'), { recursive: true });
    await fs.writeFile(path.join(architecture, 'domains', 'core.c4'), formal);
    await fs.writeFile(path.join(architecture, 'relations.c4'), 'model {\n}\n');
    delta = path.join(root, 'architecture-delta.c4');
  });
  afterEach(async () => fs.rm(root, { recursive: true, force: true }));

  it('should merge new capability to domain file', async () => {
    await fs.writeFile(delta, `model { extend core { added = capability 'Added' { metadata { capabilityId 'cap.core.added' } } } }`);
    await mergeArchitectureDelta(root, delta, { runLikeC4: async () => undefined });
    expect(await fs.readFile(path.join(root, 'openspec', 'architecture', 'domains', 'core.c4'), 'utf8')).toContain("added = capability 'Added'");
  });

  it('should merge new relations into the standalone relation file', async () => {
    await fs.writeFile(delta, `model { core.existing -[invokes]-> core.existing }`);
    await mergeArchitectureDelta(root, delta, { runLikeC4: async () => undefined });
    expect(await fs.readFile(path.join(root, 'openspec', 'architecture', 'relations.c4'), 'utf8')).toContain('core.existing -[invokes]-> core.existing');
    expect(await fs.readFile(path.join(root, 'openspec', 'architecture', 'domains', 'core.c4'), 'utf8')).not.toContain('core.existing -[invokes]-> core.existing');
  });

  it('should preserve multiline relation blocks', async () => {
    await fs.writeFile(delta, `model {
  core.existing -[invokes]-> core.existing {
    description 'Calls the existing capability'
  }
}
`);
    await mergeArchitectureDelta(root, delta, { runLikeC4: async () => undefined });
    const content = await fs.readFile(path.join(root, 'openspec', 'architecture', 'relations.c4'), 'utf8');
    expect(content).toContain(`core.existing -[invokes]-> core.existing {
    description 'Calls the existing capability'
  }`);
  });

  it('should add a new domain file', async () => {
    await fs.writeFile(delta, `model { added = domain 'Added' { run = capability 'Run' { metadata { capabilityId 'cap.added.run' } } } }`);
    await mergeArchitectureDelta(root, delta, { runLikeC4: async () => undefined });
    expect(await fs.readFile(path.join(root, 'openspec', 'architecture', 'domains', 'added.c4'), 'utf8')).toContain("added = domain 'Added'");
  });

  it('should update specs paths to formal', async () => {
    await fs.writeFile(delta, `model { extend core { added = capability 'Added' { metadata { capabilityId 'cap.core.added' specs ['openspec/changes/add/specs/added/spec.md'] } } } }`);
    await mergeArchitectureDelta(root, delta, { changeName: 'add', runLikeC4: async () => undefined });
    expect(await fs.readFile(path.join(root, 'openspec', 'architecture', 'domains', 'core.c4'), 'utf8')).toContain("specs ['openspec/specs/added/spec.md']");
  });

  it('should sort relations deterministically', async () => {
    await fs.writeFile(delta, `model { core.existing -[validates]-> core.existing\ncore.existing -[invokes]-> core.existing }`);
    await mergeArchitectureDelta(root, delta, { runLikeC4: async () => undefined });
    const content = await fs.readFile(path.join(root, 'openspec', 'architecture', 'relations.c4'), 'utf8');
    expect(content.indexOf('-[invokes]->')).toBeLessThan(content.indexOf('-[validates]->'));
  });

  it('should rollback every file when a write fails after the first write', async () => {
    await fs.writeFile(delta, `model { extend core { added = capability 'Added' } core.existing -[invokes]-> core.existing }`);
    let writes = 0;
    await expect(mergeArchitectureDelta(root, delta, {
      runLikeC4: async () => undefined,
      write: async (file, content) => {
        writes += 1;
        if (writes === 2) throw new Error('injected write failure');
        await fs.writeFile(file, content);
      },
    })).rejects.toThrow('injected write failure');
    expect(await fs.readFile(path.join(root, 'openspec', 'architecture', 'domains', 'core.c4'), 'utf8')).toBe(formal);
    expect(await fs.readFile(path.join(root, 'openspec', 'architecture', 'relations.c4'), 'utf8')).toBe('model {\n}\n');
  });

  it('should rollback on pre-write failure', async () => {
    await fs.writeFile(delta, `model { extend missing { added = capability 'Added' } }`);
    await expect(mergeArchitectureDelta(root, delta, { runLikeC4: async () => undefined })).rejects.toThrow('Cannot extend nonexistent domain: missing');
    expect(await fs.readFile(path.join(root, 'openspec', 'architecture', 'domains', 'core.c4'), 'utf8')).toBe(formal);
  });
});
