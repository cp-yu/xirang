import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { stringify as stringifyYaml } from 'yaml';
import { convertOpsxToLikeC4 } from '../../src/migration/converters/opsx-to-likec4.js';
import { generateLikeC4Files } from '../../src/migration/generators/likec4-file-generator.js';

const roots: string[] = [];
afterEach(async () => Promise.all(roots.splice(0).map(root => fs.rm(root, { recursive: true, force: true }))));

describe('large OPSX migration', () => {
  it('migrates 1000 capabilities in under 60 seconds', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'opsx-likec4-large-'));
    roots.push(root);
    const opsx = path.join(root, '.opsx');
    await fs.mkdir(opsx, { recursive: true });
    const domains = Array.from({ length: 10 }, (_, index) => ({
      id: `dom.domain-${index}`,
      type: 'domain',
      intent: `Domain ${index}`,
    }));
    const capabilities = domains.flatMap((_, domainIndex) =>
      Array.from({ length: 100 }, (_, capabilityIndex) => ({
        id: `cap.domain-${domainIndex}.capability-${capabilityIndex}`,
        type: 'capability',
        intent: `Capability ${domainIndex}.${capabilityIndex}`,
      }))
    );
    const relations = capabilities.map(capability => ({
      from: capability.id,
      type: 'belongs_to',
      to: `dom.${capability.id.split('.')[1]}`,
    }));
    await fs.writeFile(path.join(opsx, 'project.opsx.yaml'), stringifyYaml({
      schema_version: 2,
      project: { id: 'large', name: 'Large Project' },
      domains,
      capabilities,
    }));
    await fs.writeFile(path.join(opsx, 'project.opsx.relations.yaml'), stringifyYaml({ schema_version: 2, relations }));

    const startedAt = performance.now();
    const model = await convertOpsxToLikeC4(root);
    const generated = await generateLikeC4Files(root, model);
    const durationMs = performance.now() - startedAt;

    expect(model.domains.flatMap(domain => domain.capabilities)).toHaveLength(1000);
    expect(generated.domains).toHaveLength(10);
    expect(durationMs).toBeLessThan(60_000);
  }, 60_000);
});
