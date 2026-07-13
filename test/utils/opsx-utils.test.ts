import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import {
  OPSX_PATHS,
  OPSX_SCHEMA_VERSION,
  ProjectOpsxFileSchema,
  OpsxDeltaSchema,
  validateReferentialIntegrity,
  applyOpsxDelta,
  readProjectOpsx,
  writeProjectOpsx,
  readOpsxDelta,
  type ProjectOpsxBundle,
} from '../../src/utils/opsx-utils.js';

describe('opsx-utils', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `openspec-opsx-test-${randomUUID()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  const mkBundle = (overrides: Partial<ProjectOpsxBundle> = {}): ProjectOpsxBundle => ({
    schema_version: OPSX_SCHEMA_VERSION,
    project: { id: 'test', name: 'test' },
    domains: [],
    capabilities: [],
    relations: [],
    ...overrides,
  });

  describe('YAML parse/serialize', () => {
    it('should parse valid YAML with new schema', () => {
      const yaml = `
schema_version: 2
project:
  id: test
  name: test
domains:
  - id: dom.core
    type: domain
    intent: Core domain
`;
      const data = parseYaml(yaml);
      const result = ProjectOpsxFileSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.domains).toHaveLength(1);
        expect(result.data.domains![0].id).toBe('dom.core');
      }
    });

    it('should reject invalid YAML structure', () => {
      const yaml = `
domains:
  - id: invalid-id
    type: domain
`;
      const data = parseYaml(yaml);
      const result = ProjectOpsxFileSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should serialize to valid YAML', () => {
      const data = {
        schema_version: 2,
        project: { id: 'test', name: 'test' },
        domains: [
          { id: 'dom.core', type: 'domain' as const, intent: 'Core domain' },
        ],
      };
      const yaml = stringifyYaml(data);
      expect(yaml).toContain('domains:');
      expect(yaml).toContain('id: dom.core');
    });

    it('should round-trip parse and serialize', () => {
      const original = {
        schema_version: 2,
        project: { id: 'test', name: 'test' },
        domains: [
          { id: 'dom.core', type: 'domain' as const, intent: 'Core' },
        ],
        capabilities: [
          { id: 'cap.auth', type: 'capability' as const, intent: 'Auth' },
        ],
      };
      const yaml = stringifyYaml(original);
      const data = parseYaml(yaml);
      const result = ProjectOpsxFileSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.domains).toHaveLength(1);
        expect(result.data.capabilities).toHaveLength(1);
      }
    });
  });

  describe('referential integrity validation', () => {
    it('should pass with valid references', () => {
      const bundle = mkBundle({
        domains: [{ id: 'dom.core', type: 'domain' }],
        capabilities: [{ id: 'cap.auth', type: 'capability' }],
        relations: [{ from: 'cap.auth', to: 'dom.core', type: 'belongs_to' }],
      });
      const result = validateReferentialIntegrity(bundle);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail with missing from reference', () => {
      const bundle = mkBundle({
        domains: [{ id: 'dom.core', type: 'domain' }],
        relations: [{ from: 'cap.missing', to: 'dom.core', type: 'belongs_to' }],
      });
      const result = validateReferentialIntegrity(bundle);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('cap.missing');
    });

    it('should fail with missing to reference', () => {
      const bundle = mkBundle({
        capabilities: [{ id: 'cap.auth', type: 'capability' }],
        relations: [{ from: 'cap.auth', to: 'dom.missing', type: 'belongs_to' }],
      });
      const result = validateReferentialIntegrity(bundle);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('dom.missing');
    });

    it('should handle empty relations', () => {
      const bundle = mkBundle({
        domains: [{ id: 'dom.core', type: 'domain' }],
      });
      const result = validateReferentialIntegrity(bundle);
      expect(result.valid).toBe(true);
    });
  });

  describe('readProjectOpsx', () => {
    it('should read a valid two-file v2 bundle', async () => {
      const bundle = mkBundle({
        domains: [{ id: 'dom.core', type: 'domain' }],
        capabilities: [{ id: 'cap.core', type: 'capability' }],
        relations: [{ from: 'cap.core', to: 'dom.core', type: 'belongs_to' }],
      });
      await writeProjectOpsx(testDir, bundle);

      const result = await readProjectOpsx(testDir);
      expect(result).toEqual(bundle);
      await expect(fs.access(path.join(testDir, 'openspec', 'project.opsx.code-map.yaml'))).rejects.toThrow();
    });

    it('should return null if file does not exist', async () => {
      const result = await readProjectOpsx(testDir);
      expect(result).toBeNull();
    });

    it('should reject v1 with authoring and rebuild guidance', async () => {
      const opsxDir = path.join(testDir, 'openspec');
      await fs.mkdir(opsxDir, { recursive: true });
      await fs.writeFile(path.join(testDir, OPSX_PATHS.PROJECT_FILE), stringifyYaml({
        schema_version: 1,
        project: { id: 'test', name: 'test' },
        domains: [],
        capabilities: [],
      }));

      await expect(readProjectOpsx(testDir)).rejects.toThrow('openspec help authoring project.opsx.relations.yaml');
      await expect(readProjectOpsx(testDir)).rejects.toThrow('bootstrap');
    });

    it('should reject a missing relations companion file', async () => {
      const opsxDir = path.join(testDir, 'openspec');
      await fs.mkdir(opsxDir, { recursive: true });
      await fs.writeFile(path.join(testDir, OPSX_PATHS.PROJECT_FILE), stringifyYaml({
        schema_version: 2,
        project: { id: 'test', name: 'test' },
        domains: [],
        capabilities: [],
      }));

      await expect(readProjectOpsx(testDir)).rejects.toThrow('project.opsx.relations.yaml');
    });

    it('should reject a v1 relations companion file', async () => {
      const opsxDir = path.join(testDir, 'openspec');
      await fs.mkdir(opsxDir, { recursive: true });
      await fs.writeFile(path.join(testDir, OPSX_PATHS.PROJECT_FILE), stringifyYaml({
        schema_version: 2,
        project: { id: 'test', name: 'test' },
      }));
      await fs.writeFile(path.join(testDir, OPSX_PATHS.RELATIONS_FILE), stringifyYaml({
        schema_version: 1,
        relations: [],
      }));

      await expect(readProjectOpsx(testDir)).rejects.toThrow('openspec help authoring project.opsx.relations.yaml');
      await expect(readProjectOpsx(testDir)).rejects.toThrow('bootstrap');
    });

    it('should reject a semantically invalid relation graph', async () => {
      const opsxDir = path.join(testDir, 'openspec');
      await fs.mkdir(opsxDir, { recursive: true });
      await fs.writeFile(path.join(testDir, OPSX_PATHS.PROJECT_FILE), stringifyYaml({
        schema_version: 2,
        project: { id: 'test', name: 'test' },
        capabilities: [{ id: 'cap.test.run', type: 'capability' }],
      }));
      await fs.writeFile(path.join(testDir, OPSX_PATHS.RELATIONS_FILE), stringifyYaml({
        schema_version: 2,
        relations: [],
      }));

      await expect(readProjectOpsx(testDir)).rejects.toThrow("capability 'cap.test.run' has 0 belongs_to relations; expected exactly 1");
    });
  });

  describe('writeProjectOpsx', () => {
    it('should write exactly two OPSX files', async () => {
      await writeProjectOpsx(testDir, mkBundle());

      const files = await fs.readdir(path.join(testDir, 'openspec'));
      expect(files.sort()).toEqual(['project.opsx.relations.yaml', 'project.opsx.yaml']);
    });

    it('should use atomic write pattern (no tmp files remain)', async () => {
      const bundle = mkBundle({
        domains: [{ id: 'dom.core', type: 'domain' }],
      });
      await writeProjectOpsx(testDir, bundle);

      const opsxDir = path.join(testDir, 'openspec');
      const files = await fs.readdir(opsxDir);
      const hasTmpFile = files.some(f => f.includes('.tmp'));
      expect(hasTmpFile).toBe(false);
    });
  });

  describe('applyOpsxDelta', () => {
    it('should not report unchanged MODIFIED nodes as changed', () => {
      const capability = {
        id: 'cap.verify.gate',
        type: 'capability' as const,
        intent: 'Verify gate',
        status: 'active' as const,
      };
      const relation = { from: 'cap.verify.gate', to: 'dom.verify', type: 'belongs_to' };
      const bundle = mkBundle({
        domains: [{ id: 'dom.verify', type: 'domain', intent: 'Verify domain' }],
        capabilities: [capability],
        relations: [relation],
      });

      const result = applyOpsxDelta(bundle, {
        schema_version: OPSX_SCHEMA_VERSION,
        MODIFIED: {
          capabilities: [{ status: 'active', intent: 'Verify gate', type: 'capability', id: 'cap.verify.gate' }],
          relations: [{ type: 'belongs_to', to: 'dom.verify', from: 'cap.verify.gate' }],
        },
      });

      expect(result.changed).toBe(false);
      expect(result.counts.modified).toEqual({ domains: 0, capabilities: 0, relations: 0 });
    });

    it('should shallow merge MODIFIED capability (only intent)', () => {
      const bundle = mkBundle({
        capabilities: [{ id: 'cap.cli.init', type: 'capability', intent: '原始描述', status: 'active' as const, domain: 'dom.cli' }],
      });

      const result = applyOpsxDelta(bundle, {
        MODIFIED: { capabilities: [{ id: 'cap.cli.init', intent: '修改后的描述' }] },
      });

      expect(result.changed).toBe(true);
      expect(result.counts.modified.capabilities).toBe(1);
      expect(result.bundle.capabilities[0].intent).toBe('修改后的描述');
      expect(result.bundle.capabilities[0].type).toBe('capability');
      expect(result.bundle.capabilities[0].status).toBe('active');
      expect(result.bundle.capabilities[0].domain).toBe('dom.cli');
    });

    it('should not report already applied partial MODIFIED capability as changed', () => {
      const bundle = mkBundle({
        capabilities: [{ id: 'cap.cli.init', type: 'capability', intent: '已同步描述', status: 'active' as const, domain: 'dom.cli' }],
      });

      const result = applyOpsxDelta(bundle, {
        MODIFIED: { capabilities: [{ id: 'cap.cli.init', intent: '已同步描述' }] },
      });

      expect(result.changed).toBe(false);
      expect(result.counts.modified.capabilities).toBe(0);
      expect(result.bundle.capabilities[0]).toEqual(bundle.capabilities[0]);
    });

    it('should shallow merge MODIFIED domain (only boundary)', () => {
      const bundle = mkBundle({
        domains: [{ id: 'dom.cli', type: 'domain', intent: 'CLI domain', boundary: 'old boundary' }],
      });

      const result = applyOpsxDelta(bundle, {
        MODIFIED: { domains: [{ id: 'dom.cli', boundary: 'new boundary' }] },
      });

      expect(result.changed).toBe(true);
      expect(result.bundle.domains[0].boundary).toBe('new boundary');
      expect(result.bundle.domains[0].type).toBe('domain');
      expect(result.bundle.domains[0].intent).toBe('CLI domain');
    });

    it('should shallow merge MODIFIED capability (multiple fields)', () => {
      const bundle = mkBundle({
        capabilities: [{ id: 'cap.x', type: 'capability', intent: 'old', status: 'draft' as const }],
      });

      const result = applyOpsxDelta(bundle, {
        MODIFIED: { capabilities: [{ id: 'cap.x', intent: 'new', status: 'active' as const }] },
      });

      expect(result.changed).toBe(true);
      expect(result.bundle.capabilities[0].intent).toBe('new');
      expect(result.bundle.capabilities[0].status).toBe('active');
      expect(result.bundle.capabilities[0].type).toBe('capability');
    });

    it('should throw on MODIFIED non-existent node', () => {
      const bundle = mkBundle({ capabilities: [] });

      expect(() => applyOpsxDelta(bundle, {
        MODIFIED: { capabilities: [{ id: 'cap.nonexistent', intent: 'x' }] },
      })).toThrow("OPSX MODIFIED failed for capability 'cap.nonexistent' - not found");
    });

    it('should shallow merge MODIFIED relation (preserve from/to/type)', () => {
      const bundle = mkBundle({
        capabilities: [
          { id: 'cap.x', type: 'capability' },
          { id: 'cap.y', type: 'capability' },
        ],
        relations: [{ from: 'cap.y', to: 'cap.x', type: 'invokes', note: 'old' }],
      });

      const result = applyOpsxDelta(bundle, {
        MODIFIED: { relations: [{ from: 'cap.y', to: 'cap.x', type: 'invokes', note: 'new' }] },
      });

      expect(result.changed).toBe(true);
      expect(result.bundle.relations[0].note).toBe('new');
    });

    it('preserves ordering, duplicate, sequential patch, and removal semantics', () => {
      const bundle = mkBundle({
        domains: [
          { id: 'dom.a', type: 'domain', intent: 'A' },
          { id: 'dom.remove', type: 'domain', intent: 'remove' },
        ],
        capabilities: [
          { id: 'cap.a.one', type: 'capability', intent: 'old', status: 'draft' },
          { id: 'cap.remove.one', type: 'capability', intent: 'remove' },
        ],
        relations: [
          { from: 'cap.a.one', to: 'dom.a', type: 'invokes', note: 'first' },
          { from: 'cap.a.one', to: 'dom.a', type: 'consumes', note: 'second' },
          { from: 'cap.remove.one', to: 'dom.remove', type: 'belongs_to' },
          { from: 'cap.remove.one', to: 'dom.remove', type: 'belongs_to' },
        ],
      });

      const result = applyOpsxDelta(bundle, {
        ADDED: {
          domains: [
            { id: 'dom.a', type: 'domain', intent: 'duplicate' },
            { id: 'dom.b', type: 'domain', intent: 'B' },
            { id: 'dom.b', type: 'domain', intent: 'duplicate' },
          ],
          capabilities: [
            { id: 'cap.a.one', type: 'capability', intent: 'duplicate' },
            { id: 'cap.b.one', type: 'capability', intent: 'B' },
            { id: 'cap.b.one', type: 'capability', intent: 'duplicate' },
          ],
          relations: [
            { from: 'cap.a.one', to: 'dom.a', type: 'invokes', note: 'ignored duplicate note' },
            { from: 'cap.b.one', to: 'dom.b', type: 'belongs_to' },
          ],
        },
        MODIFIED: {
          capabilities: [
            { id: 'cap.a.one', intent: 'middle', status: 'active' },
            { id: 'cap.a.one', intent: 'final' },
          ],
          relations: [
            { from: 'cap.a.one', to: 'dom.a', type: 'consumes', note: 'patched first pair' },
          ],
        },
        REMOVED: {
          domains: [{ id: 'dom.remove' }, { id: 'dom.remove' }, { id: 'dom.absent' }],
          capabilities: [{ id: 'cap.remove.one' }, { id: 'cap.remove.one' }, { id: 'cap.absent.one' }],
          relations: [
            { from: 'cap.remove.one', to: 'dom.remove', type: 'belongs_to' },
            { from: 'cap.remove.one', to: 'dom.remove', type: 'belongs_to' },
          ],
        },
      });

      expect(result.bundle.domains.map(({ id }) => id)).toEqual(['dom.a', 'dom.b']);
      expect(result.bundle.capabilities.map(({ id }) => id)).toEqual(['cap.a.one', 'cap.b.one']);
      expect(result.bundle.capabilities[0]).toMatchObject({ intent: 'final', status: 'active' });
      expect(result.bundle.relations).toEqual([
        { from: 'cap.a.one', to: 'dom.a', type: 'consumes', note: 'patched first pair' },
        { from: 'cap.a.one', to: 'dom.a', type: 'consumes', note: 'second' },
        { from: 'cap.b.one', to: 'dom.b', type: 'belongs_to' },
      ]);
      expect(result.counts).toEqual({
        added: { domains: 1, capabilities: 1, relations: 1 },
        modified: { domains: 0, capabilities: 2, relations: 1 },
        removed: { domains: 1, capabilities: 1, relations: 1 },
      });
      expect(bundle.capabilities[0]).toMatchObject({ intent: 'old', status: 'draft' });
      expect(bundle.relations).toHaveLength(4);
    });

    it('keeps relation tuple and endpoint-pair identity collision-free', () => {
      const left = { from: 'cap.a|cap.b', to: 'cap.c', type: 'invokes' as const, note: 'left' };
      const right = { from: 'cap.a', to: 'cap.b|cap.c', type: 'invokes' as const, note: 'right' };
      const bundle = mkBundle({ relations: [left, right] });

      const added = applyOpsxDelta(bundle, {
        ADDED: {
          relations: [
            { from: 'cap.a|cap.b', to: 'cap.c', type: 'consumes' },
            { from: 'cap.a', to: 'cap.b|cap.c', type: 'consumes' },
          ],
        },
      });
      expect(added.counts.added.relations).toBe(2);

      const modified = applyOpsxDelta(bundle, {
        MODIFIED: {
          relations: [{ from: 'cap.a', to: 'cap.b|cap.c', type: 'invokes', note: 'patched right' }],
        },
      });
      expect(modified.bundle.relations).toEqual([
        left,
        { ...right, note: 'patched right' },
      ]);

      const removed = applyOpsxDelta(bundle, {
        REMOVED: {
          relations: [{ from: 'cap.a', to: 'cap.b|cap.c', type: 'invokes' }],
        },
      });
      expect(removed.counts.removed.relations).toBe(1);
      expect(removed.bundle.relations).toEqual([left]);
    });

    it('applies batched node deltas with a linear number of existing ID reads', () => {
      let idReads = 0;
      const capabilities = Array.from({ length: 200 }, (_, index) => {
        const capability = { type: 'capability' as const, intent: `old-${index}` };
        Object.defineProperty(capability, 'id', {
          enumerable: true,
          get: () => {
            idReads += 1;
            return `cap.batch.c${index}`;
          },
        });
        return capability as typeof capability & { id: string };
      });
      const bundle = mkBundle({ capabilities });
      idReads = 0;

      const result = applyOpsxDelta(bundle, {
        ADDED: {
          capabilities: Array.from({ length: 50 }, (_, index) => ({
            id: `cap.added.c${index}`,
            type: 'capability' as const,
            intent: `added-${index}`,
          })),
        },
        MODIFIED: {
          capabilities: Array.from({ length: 50 }, (_, index) => ({
            id: `cap.batch.c${index}`,
            intent: `new-${index}`,
          })),
        },
        REMOVED: {
          capabilities: Array.from({ length: 50 }, (_, index) => ({
            id: `cap.batch.c${index + 100}`,
          })),
        },
      });

      expect(result.counts).toEqual({
        added: { domains: 0, capabilities: 50, relations: 0 },
        modified: { domains: 0, capabilities: 50, relations: 0 },
        removed: { domains: 0, capabilities: 50, relations: 0 },
      });
      expect(result.bundle.capabilities).toHaveLength(200);
      expect(idReads).toBeLessThanOrEqual(600);
    });
  });

  describe('OpsxDeltaSchema validation', () => {
    it.each([
      ['missing', 'ADDED: {}'],
      ['v1', 'schema_version: 1\nADDED: {}'],
    ])('should reject %s schema_version', (_label, yaml) => {
      expect(OpsxDeltaSchema.safeParse(parseYaml(yaml)).success).toBe(false);
    });

    it('should pass MODIFIED without type field', () => {
      const data = parseYaml(`
        schema_version: 2
        MODIFIED:
          capabilities:
            - id: cap.xxx
              intent: some intent
      `);
      const result = OpsxDeltaSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should fail MODIFIED without id field', () => {
      const data = parseYaml(`
        schema_version: 2
        MODIFIED:
          capabilities:
            - intent: missing id
      `);
      const result = OpsxDeltaSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should pass REMOVED with only id field', () => {
      const data = parseYaml(`
        schema_version: 2
        REMOVED:
          capabilities:
            - id: cap.xxx
      `);
      const result = OpsxDeltaSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should fail ADDED without type field', () => {
      const data = parseYaml(`
        schema_version: 2
        ADDED:
          capabilities:
            - id: cap.xxx
              intent: missing type
      `);
      const result = OpsxDeltaSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should pass ADDED with complete fields', () => {
      const data = parseYaml(`
        schema_version: 2
        ADDED:
          capabilities:
            - id: cap.xxx
              type: capability
              intent: complete node
      `);
      const result = OpsxDeltaSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('readOpsxDelta error messages', () => {
    it('should produce diagnostic message when ADDED capability has no type', async () => {
      const changeDir = path.join(testDir, 'openspec', 'changes', 'test-change');
      await fs.mkdir(changeDir, { recursive: true });
      await fs.writeFile(path.join(changeDir, 'opsx-delta.yaml'), stringifyYaml({
        schema_version: 2,
        ADDED: { capabilities: [{ id: 'cap.xxx', intent: 'no type' }] },
      }));

      await expect(readOpsxDelta(testDir, 'test-change')).rejects.toThrow('field is missing');
    });

    it('should include section/index/path info in error output', async () => {
      const changeDir = path.join(testDir, 'openspec', 'changes', 'test-change2');
      await fs.mkdir(changeDir, { recursive: true });
      await fs.writeFile(path.join(changeDir, 'opsx-delta.yaml'), stringifyYaml({
        schema_version: 2,
        ADDED: { capabilities: [{ id: 'cap.xxx', intent: 'no type' }] },
      }));

      await expect(readOpsxDelta(testDir, 'test-change2')).rejects.toThrow('ADDED');
    });
  });

  describe('path constants', () => {
    it('should have correct project file path', () => {
      expect(OPSX_PATHS.PROJECT_FILE).toBe('openspec/project.opsx.yaml');
    });

    it('should have correct relations file path', () => {
      expect(OPSX_PATHS.RELATIONS_FILE).toBe('openspec/project.opsx.relations.yaml');
    });

    it('should generate correct delta path', () => {
      const deltaPath = OPSX_PATHS.deltaPath('my-change');
      expect(deltaPath).toBe('openspec/changes/my-change/opsx-delta.yaml');
    });
  });
});
