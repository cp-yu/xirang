import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { readLikeC4Architecture } from '../../../src/utils/likec4-reader.js';
import { readArchitecture } from '../../../src/utils/architecture-reader.js';

const domain = `model {
  core = domain 'Core' {
    description 'Core domain'
    run = capability 'Run' {
      description 'Run things'
      metadata {
        capabilityId 'cap.core.run'
        specs ['openspec/specs/run/spec.md']
      }
    }
    stop = capability 'Stop' {
      metadata { capabilityId 'cap.core.stop' }
    }
  }
  core.run -[invokes]-> core.stop {
    description 'Runs stop'
  }
}`;

describe('LikeC4 architecture reader', () => {
  let root: string;
  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'openspec-likec4-reader-'));
    const architecture = path.join(root, 'openspec', 'architecture');
    await fs.mkdir(path.join(architecture, 'domains'), { recursive: true });
    await fs.writeFile(path.join(architecture, 'specification.c4'), 'specification { element domain element capability relationship invokes }');
    await fs.writeFile(path.join(architecture, 'domains', 'core.c4'), domain);
    await fs.writeFile(path.join(architecture, 'views.c4'), 'views { view index { include * } }');
  });
  afterEach(async () => fs.rm(root, { recursive: true, force: true }));

  it('should read multi-file LikeC4 model', async () => {
    const result = await readLikeC4Architecture(root);
    expect(result.source).toBe('likec4');
    expect(result.files).toHaveLength(3);
  });

  it('should parse element definitions', async () => {
    const result = await readLikeC4Architecture(root);
    expect(result.domains[0]).toMatchObject({ id: 'core', title: 'Core' });
    expect(result.capabilities[0]).toMatchObject({ id: 'core.run', capabilityId: 'cap.core.run', specs: ['openspec/specs/run/spec.md'] });
  });

  it('should parse relationships from domain and standalone relation files', async () => {
    await fs.writeFile(path.join(root, 'openspec', 'architecture', 'relations.c4'), `model { core.stop -[invokes]-> core.run }`);
    const result = await readLikeC4Architecture(root);
    expect(result.files).toHaveLength(4);
    expect(result.relations).toEqual(expect.arrayContaining([
      { source: 'core.run', target: 'core.stop', kind: 'invokes', description: 'Runs stop' },
      { source: 'core.stop', target: 'core.run', kind: 'invokes' },
    ]));
  });

  it('should fallback to OPSX when LikeC4 not present', async () => {
    await fs.rm(path.join(root, 'openspec', 'architecture'), { recursive: true });
    await fs.writeFile(path.join(root, 'openspec', 'project.opsx.yaml'), `schema_version: 2\nproject: { id: test, name: Test }\ndomains: [{ id: dom.core, type: domain }]\ncapabilities: [{ id: cap.core.run, type: capability }]\n`);
    await fs.writeFile(path.join(root, 'openspec', 'project.opsx.relations.yaml'), `schema_version: 2\nrelations: [{ from: cap.core.run, type: belongs_to, to: dom.core }]\n`);
    const result = await readArchitecture(root);
    expect(result.source).toBe('opsx');
  });
});
