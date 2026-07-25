import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';
import * as fc from 'fast-check';
import {
  XIRANG_SCHEMA_VERSION,
  readProjectOpsx,
  writeProjectOpsx,
  type ProjectXirangBundle,
} from '../../src/utils/xirang-utils.js';

describe('PBT: Merge Idempotency', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `opsx-opsx-pbt-${randomUUID()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  const projectMetadataArb = fc.record({
    id: fc.string({ minLength: 1, maxLength: 50 }),
    name: fc.string({ minLength: 1, maxLength: 50 }),
  });

  const nodeIdArb = fc.oneof(
    fc.constantFrom('cap', 'dom')
      .chain(prefix => fc.string({ minLength: 1, maxLength: 20 })
        .map(suffix => `${prefix}.${suffix.replace(/[^a-z0-9-]/gi, '-')}`))
  );

  const domainNodeArb = fc.record({
    id: nodeIdArb.filter(id => id.startsWith('dom.')),
    type: fc.constant('domain' as const),
    intent: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
  });

  const capabilityNodeArb = fc.record({
    id: nodeIdArb.filter(id => id.startsWith('cap.')),
    type: fc.constant('capability' as const),
    intent: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
  });

  const bundleArb = fc.record({
    project: projectMetadataArb,
    domains: fc.uniqueArray(domainNodeArb, { selector: node => node.id, maxLength: 5 }),
    capabilities: fc.uniqueArray(capabilityNodeArb, { selector: node => node.id, maxLength: 5 }),
  }).map(base => {
    const domains = base.capabilities.length > 0 && base.domains.length === 0
      ? [{ id: 'dom.generated', type: 'domain' as const }]
      : base.domains;
    return {
      schema_version: XIRANG_SCHEMA_VERSION,
      project: base.project,
      domains,
      capabilities: base.capabilities,
      relations: base.capabilities.map(capability => ({
        from: capability.id,
        type: 'belongs_to' as const,
        to: domains[0].id,
      })),
    } as ProjectXirangBundle;
  });

  it('Property 1: Writing same data twice produces identical result', async () => {
    await fc.assert(
      fc.asyncProperty(bundleArb, async (bundle) => {
        await writeProjectOpsx(testDir, bundle);
        const r1 = await readProjectOpsx(testDir);

        await writeProjectOpsx(testDir, bundle);
        const r2 = await readProjectOpsx(testDir);

        expect(r1).not.toBeNull();
        expect(r2).not.toBeNull();
        // Compare without generated_at (timestamp differs)
        expect(r1).toEqual(r2);
      }),
      { numRuns: 50 },
    );
  });

  it('Property 2: Read-write-read cycle preserves data', async () => {
    await fc.assert(
      fc.asyncProperty(bundleArb, async (original) => {
        await writeProjectOpsx(testDir, original);
        const read1 = await readProjectOpsx(testDir);
        expect(read1).not.toBeNull();

        await writeProjectOpsx(testDir, read1!);
        const read2 = await readProjectOpsx(testDir);
        expect(read2).not.toBeNull();

        expect(read1!.project).toEqual(read2!.project);
        expect(read1!.domains).toEqual(read2!.domains);
        expect(read1!.capabilities).toEqual(read2!.capabilities);
        expect(read1!.relations).toEqual(read2!.relations);
      }),
      { numRuns: 50 },
    );
  });

  it('Property 3: Multiple writes with same data are idempotent', async () => {
    await fc.assert(
      fc.asyncProperty(bundleArb, async (bundle) => {
        await writeProjectOpsx(testDir, bundle);
        await writeProjectOpsx(testDir, bundle);
        await writeProjectOpsx(testDir, bundle);

        const result = await readProjectOpsx(testDir);
        expect(result).not.toBeNull();
        expect(result!.project.name).toBe(bundle.project.name);
        expect(result!.domains).toHaveLength(bundle.domains.length);
        expect(result!.capabilities).toHaveLength(bundle.capabilities.length);
      }),
      { numRuns: 50 },
    );
  });
});
