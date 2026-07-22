import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mergeArchitectureDelta } from '../../../src/utils/architecture-delta-merger.js';
import { readLikeC4Architecture } from '../../../src/utils/likec4-reader.js';

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
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'opsx-delta-merger-'));
    const architecture = path.join(root, '.opsx', 'architecture');
    await fs.mkdir(path.join(architecture, 'domains'), { recursive: true });
    await fs.writeFile(path.join(architecture, 'domains', 'core.c4'), formal);
    await fs.writeFile(path.join(architecture, 'relations.c4'), 'model {\n}\n');
    delta = path.join(root, 'architecture-delta.c4');
  });
  afterEach(async () => fs.rm(root, { recursive: true, force: true }));

  it('should merge new capability to domain file', async () => {
    await fs.writeFile(delta, `model { extend core { added = capability 'Added' { metadata { capabilityId 'cap.core.added' } } } }`);
    await mergeArchitectureDelta(root, delta, { runLikeC4: async () => undefined });
    expect(await fs.readFile(path.join(root, '.opsx', 'architecture', 'domains', 'core.c4'), 'utf8')).toContain("added = capability 'Added'");
  });

  it('should merge new relations into the standalone relation file', async () => {
    await fs.writeFile(delta, `model { core.existing -[invokes]-> core.existing }`);
    await mergeArchitectureDelta(root, delta, { runLikeC4: async () => undefined });
    expect(await fs.readFile(path.join(root, '.opsx', 'architecture', 'relations.c4'), 'utf8')).toContain('core.existing -[invokes]-> core.existing');
    expect(await fs.readFile(path.join(root, '.opsx', 'architecture', 'domains', 'core.c4'), 'utf8')).not.toContain('core.existing -[invokes]-> core.existing');
  });

  it('should preserve multiline relation blocks', async () => {
    await fs.writeFile(delta, `model {
  core.existing -[invokes]-> core.existing {
    description 'Calls the existing capability'
  }
}
`);
    await mergeArchitectureDelta(root, delta, { runLikeC4: async () => undefined });
    const content = await fs.readFile(path.join(root, '.opsx', 'architecture', 'relations.c4'), 'utf8');
    expect(content).toContain(`core.existing -[invokes]-> core.existing {
    description 'Calls the existing capability'
  }`);
  });

  it('should add a new domain file', async () => {
    await fs.writeFile(delta, `model { added = domain 'Added' { run = capability 'Run' { metadata { capabilityId 'cap.added.run' } } } }`);
    await mergeArchitectureDelta(root, delta, { runLikeC4: async () => undefined });
    expect(await fs.readFile(path.join(root, '.opsx', 'architecture', 'domains', 'added.c4'), 'utf8')).toContain("added = domain 'Added'");
  });

  it('should update specs paths to formal', async () => {
    await fs.writeFile(delta, `model { extend core { added = capability 'Added' { metadata { capabilityId 'cap.core.added' specs ['.opsx/changes/add/specs/added/spec.md'] } } } }`);
    await mergeArchitectureDelta(root, delta, { changeName: 'add', runLikeC4: async () => undefined });
    expect(await fs.readFile(path.join(root, '.opsx', 'architecture', 'domains', 'core.c4'), 'utf8')).toContain("specs ['.opsx/specs/added/spec.md']");
  });

  it('should lower nested element extensions into the formal capability', async () => {
    await fs.writeFile(delta, `model {
  extend core.existing {
    metadata {
      intent 'Runs existing work'
      status 'deprecated'
      specs ['.opsx/changes/add/specs/existing/spec.md', '.opsx/changes/add/specs/existing/spec.md']
    }
  }
}`);

    await mergeArchitectureDelta(root, delta, { changeName: 'add', runLikeC4: async () => undefined });

    const content = await fs.readFile(path.join(root, '.opsx', 'architecture', 'domains', 'core.c4'), 'utf8');
    expect(content).toContain("description 'Runs existing work'");
    expect(content).toContain("capabilityId 'cap.core.existing'");
    expect(content).toContain("status 'deprecated'");
    expect(content.match(/\.opsx\/specs\/existing\/spec\.md/g)).toHaveLength(1);
    expect(content).not.toContain("intent 'Runs existing work'");
    expect(content.match(/existing\s*=\s*capability/g)).toHaveLength(1);
  });

  it('should exclude LikeC4 cache from staged merge validation', async () => {
    const cache = path.join(root, '.opsx', 'architecture', '.likec4');
    await fs.mkdir(cache, { recursive: true });
    await fs.writeFile(path.join(cache, 'index.likec4.snap'), 'stale');
    await fs.writeFile(delta, `model { extend core { added = capability 'Added' } }`);

    await mergeArchitectureDelta(root, delta, {
      runLikeC4: async ([, staging]) => {
        await expect(fs.access(path.join(staging, '.likec4'))).rejects.toThrow();
      },
    });
  });

  it('should sort relations deterministically', async () => {
    await fs.writeFile(delta, `model { core.existing -[validates]-> core.existing\ncore.existing -[invokes]-> core.existing }`);
    await mergeArchitectureDelta(root, delta, { runLikeC4: async () => undefined });
    const content = await fs.readFile(path.join(root, '.opsx', 'architecture', 'relations.c4'), 'utf8');
    expect(content.indexOf('-[invokes]->')).toBeLessThan(content.indexOf('-[validates]->'));
  });

  it('should not write unchanged domain files', async () => {
    const domains = path.join(root, '.opsx', 'architecture', 'domains');
    const untouched = path.join(domains, 'untouched.c4');
    await fs.writeFile(untouched, `model { untouched = domain 'Untouched' }\n`);
    await fs.writeFile(delta, `model { extend core { added = capability 'Added' } }`);
    const writes: string[] = [];

    await mergeArchitectureDelta(root, delta, {
      runLikeC4: async () => undefined,
      write: async (file, content) => {
        writes.push(file);
        await fs.writeFile(file, content);
      },
    });

    expect(writes).toEqual([path.join(domains, 'core.c4')]);
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
    expect(await fs.readFile(path.join(root, '.opsx', 'architecture', 'domains', 'core.c4'), 'utf8')).toBe(formal);
    expect(await fs.readFile(path.join(root, '.opsx', 'architecture', 'relations.c4'), 'utf8')).toBe('model {\n}\n');
  });

  it('should remove a new domain when a later changed-file write fails', async () => {
    await fs.writeFile(delta, `model {
  added = domain 'Added' { run = capability 'Run' }
  added.run -[invokes]-> core.existing
}`);
    let writes = 0;

    await expect(mergeArchitectureDelta(root, delta, {
      runLikeC4: async () => undefined,
      write: async (file, content) => {
        writes += 1;
        if (writes === 2) throw new Error('injected write failure');
        await fs.writeFile(file, content);
      },
    })).rejects.toThrow('injected write failure');

    await expect(fs.access(path.join(root, '.opsx', 'architecture', 'domains', 'added.c4'))).rejects.toThrow();
    expect(await fs.readFile(path.join(root, '.opsx', 'architecture', 'relations.c4'), 'utf8')).toBe('model {\n}\n');
  });

  it('should rollback on pre-write failure', async () => {
    await fs.writeFile(delta, `model { extend missing { added = capability 'Added' } }`);
    await expect(mergeArchitectureDelta(root, delta, { runLikeC4: async () => undefined })).rejects.toThrow('Cannot extend nonexistent domain: missing');
    expect(await fs.readFile(path.join(root, '.opsx', 'architecture', 'domains', 'core.c4'), 'utf8')).toBe(formal);
  });

  it('should preserve a v1 generic delta as a native LikeC4 module', async () => {
    const architecture = path.join(root, '.opsx', 'architecture');
    await fs.rm(architecture, { recursive: true });
    await fs.mkdir(architecture, { recursive: true });
    await fs.writeFile(path.join(architecture, 'model.c4'), `opsx { languageVersion '1' }
specification {
  element project { opsx { root true contract optional } }
  element area { opsx { contract optional } }
  element operation { opsx { contract optional } }
}
model {
  projectRoot = project 'Root' 'Project intent' {
    metadata { elementId 'project.root' }
    payments = area 'Payments' 'Payment area' {
      metadata { elementId 'payments' }
      authorize = operation 'Authorize' 'Authorize payments' {
        metadata { elementId 'payment.authorize' }
      }
      capture = operation 'Capture' 'Capture payments' {
        metadata { elementId 'payment.capture' }
      }
    }
  }
}
`);
    await fs.writeFile(delta, `specification {
  element artifact { opsx { contract optional parents [operation] } }
  relationship produces { opsx { sourceKinds [operation] targetKinds [artifact] } }
}
model {
  extend projectRoot.payments.authorize {
    receipt = artifact 'Receipt' 'Authorization receipt' {
      metadata { elementId 'payment.receipt' }
    }
  }
  projectRoot.payments.capture -[produces]-> projectRoot.payments.authorize.receipt
}
`);

    await mergeArchitectureDelta(root, delta, { changeName: 'add-receipt', runLikeC4: async () => undefined });

    const merged = await readLikeC4Architecture(root);
    expect(merged.elements).toContainEqual(expect.objectContaining({
      id: 'payment.receipt',
      fqn: 'projectRoot.payments.authorize.receipt',
      kind: 'artifact',
      parent: 'payment.authorize',
    }));
    expect(merged.metamodel.relationships.produces).toEqual({ sourceKinds: ['operation'], targetKinds: ['artifact'] });
    expect(merged.relations).toContainEqual(expect.objectContaining({
      source: 'payment.capture',
      kind: 'produces',
      target: 'payment.receipt',
    }));
    expect(await fs.readFile(path.join(architecture, 'deltas', 'add-receipt.c4'), 'utf8')).toContain('extend projectRoot.payments.authorize');
  });
});
