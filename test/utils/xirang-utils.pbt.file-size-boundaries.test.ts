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

describe('PBT: Fixed Two-File Layout', () => {
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
    intent: fc.option(fc.string({ minLength: 50, maxLength: 200 }), { nil: undefined }),
  });

  const capabilityNodeArb = fc.record({
    id: nodeIdArb.filter(id => id.startsWith('cap.')),
    type: fc.constant('capability' as const),
    intent: fc.option(fc.string({ minLength: 50, maxLength: 200 }), { nil: undefined }),
  });

  const mkBundle = (overrides: Partial<ProjectXirangBundle>): ProjectXirangBundle => {
    const domains = overrides.domains ?? [];
    const capabilities = overrides.capabilities ?? [];
    return {
      schema_version: XIRANG_SCHEMA_VERSION,
      project: { id: 'test', name: 'test' },
      domains,
      capabilities,
      relations: capabilities.map(capability => ({
        from: capability.id,
        type: 'belongs_to',
        to: domains[0].id,
      })),
      ...overrides,
    };
  };

  it('Property 1: Small data produces exactly two files', async () => {
    await fc.assert(
      fc.asyncProperty(
        projectMetadataArb,
        fc.uniqueArray(domainNodeArb, { selector: node => node.id, minLength: 1, maxLength: 3 }),
        async (project, domains) => {
          const bundle = mkBundle({ project, domains });
          await writeProjectOpsx(testDir, bundle);

          const opsxDir = path.join(testDir, '.xirang');
          const files = await fs.readdir(opsxDir);
          const opsxFiles = files.filter(f => f.startsWith('project.xirang'));
          expect(opsxFiles).toHaveLength(2);

          const result = await readProjectOpsx(testDir);
          expect(result).not.toBeNull();
          expect(result!.domains).toHaveLength(domains.length);
        },
      ),
      { numRuns: 30 },
    );
  });

  it('Property 2: Large data still produces exactly two files', async () => {
    await fc.assert(
      fc.asyncProperty(
        projectMetadataArb,
        fc.uniqueArray(domainNodeArb, { selector: node => node.id, minLength: 50, maxLength: 100 }),
        fc.uniqueArray(capabilityNodeArb, { selector: node => node.id, minLength: 50, maxLength: 100 }),
        async (project, domains, capabilities) => {
          const bundle = mkBundle({ project, domains, capabilities });
          await writeProjectOpsx(testDir, bundle);

          const opsxDir = path.join(testDir, '.xirang');
          const files = await fs.readdir(opsxDir);
          const opsxFiles = files.filter(f => f.startsWith('project.xirang'));
          expect(opsxFiles).toHaveLength(2);

          const result = await readProjectOpsx(testDir);
          expect(result).not.toBeNull();
          expect(result!.domains).toHaveLength(domains.length);
          expect(result!.capabilities).toHaveLength(capabilities.length);
        },
      ),
      { numRuns: 20 },
    );
  });

  it('Property 3: Data is always readable regardless of size', async () => {
    await fc.assert(
      fc.asyncProperty(
        projectMetadataArb,
        fc.uniqueArray(domainNodeArb, { selector: node => node.id, minLength: 1, maxLength: 50 }),
        async (project, domains) => {
          const bundle = mkBundle({ project, domains });
          await writeProjectOpsx(testDir, bundle);

          const result = await readProjectOpsx(testDir);
          expect(result).not.toBeNull();
          expect(result!.project.name).toBe(project.name);
          expect(result!.domains).toHaveLength(domains.length);
        },
      ),
      { numRuns: 30 },
    );
  });

  it('Property 4: Two-file layout preserves all data', async () => {
    await fc.assert(
      fc.asyncProperty(
        projectMetadataArb,
        fc.uniqueArray(domainNodeArb, { selector: node => node.id, minLength: 10, maxLength: 30 }),
        fc.uniqueArray(capabilityNodeArb, { selector: node => node.id, minLength: 10, maxLength: 30 }),
        async (project, domains, capabilities) => {
          const bundle = mkBundle({ project, domains, capabilities });
          await writeProjectOpsx(testDir, bundle);

          const result = await readProjectOpsx(testDir);
          expect(result).not.toBeNull();

          expect(result!.domains).toHaveLength(domains.length);
          const domainIds = new Set(domains.map(d => d.id));
          result!.domains.forEach(d => {
            expect(domainIds.has(d.id)).toBe(true);
          });

          expect(result!.capabilities).toHaveLength(capabilities.length);
          const capIds = new Set(capabilities.map(c => c.id));
          result!.capabilities.forEach(c => {
            expect(capIds.has(c.id)).toBe(true);
          });
        },
      ),
      { numRuns: 20 },
    );
  });
});
