import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { verifyMigration } from '../../../src/migration/migration-verifier.js';
import type { LikeC4Model } from '../../../src/migration/converters/types.js';

describe('migration verifier', () => {
  let root: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'openspec-migration-verifier-'));
    const architecture = path.join(root, '.opsx', 'architecture');
    await fs.mkdir(path.join(architecture, 'domains'), { recursive: true });
    await fs.writeFile(path.join(architecture, 'domains', 'core.c4'), `model {
  core = domain 'Core' {
    description 'Wrong domain intent'
    metadata { boundary 'wrong'; status 'deprecated' }
    run = capability 'Run' {
      description 'Run intent'
      metadata { capabilityId 'cap.core.run'; status 'deprecated'; specs ['.opsx/specs/run/spec.md'] }
    }
    stop = capability 'Stop' { metadata { capabilityId 'cap.core.stop' } }
  }
}`);
    await fs.writeFile(path.join(architecture, 'relations.c4'), `model {
  core.run -[invokes]-> core.stop { description 'Wrong relation description' }
}`);
  });

  afterEach(async () => fs.rm(root, { recursive: true, force: true }));

  it('compares domain capability and relation metadata', async () => {
    const model: LikeC4Model = {
      project: { id: 'test', name: 'Test' },
      domains: [{
        id: 'dom.core', elementId: 'core', title: 'Core', description: 'Core intent',
        metadata: { boundary: 'service', status: 'active' },
        capabilities: [
          { id: 'cap.core.run', elementId: 'run', qualifiedId: 'core.run', title: 'Run', description: 'Run intent', metadata: { capabilityId: 'cap.core.run', status: 'active', specs: ['.opsx/specs/run/spec.md'] } },
          { id: 'cap.core.stop', elementId: 'stop', qualifiedId: 'core.stop', title: 'Stop', metadata: { capabilityId: 'cap.core.stop' } },
        ],
      }],
      relations: [{ source: 'core.run', target: 'core.stop', kind: 'invokes', description: 'Run invokes stop' }],
    };

    const report = await verifyMigration(root, model);

    expect(report.valid).toBe(false);
    expect(report.metadataMismatches).toEqual(expect.arrayContaining([
      'dom.core: description',
      'dom.core: boundary',
      'dom.core: status',
      'cap.core.run: status',
      'core.run|invokes|core.stop: description',
    ]));
  });
});
