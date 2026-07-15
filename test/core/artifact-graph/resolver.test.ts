import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  BUILT_IN_SCHEMA_IDS,
  getPackageSchemasDir,
  getSchemaDir,
  listSchemas,
  listSchemasWithInfo,
  resolveSchema,
} from '../../../src/core/artifact-graph/index.js';

describe('artifact-graph/resolver', () => {
  let tempDir: string;
  let originalDataHome: string | undefined;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openspec-resolver-'));
    originalDataHome = process.env.XDG_DATA_HOME;
    process.env.XDG_DATA_HOME = path.join(tempDir, 'data');
  });

  afterEach(() => {
    if (originalDataHome === undefined) delete process.env.XDG_DATA_HOME;
    else process.env.XDG_DATA_HOME = originalDataHome;
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('resolves both built-in schemas from the package directory', () => {
    for (const id of BUILT_IN_SCHEMA_IDS) {
      const expected = path.join(getPackageSchemasDir(), id);
      expect(getSchemaDir(id, tempDir)).toBe(expected);
      expect(resolveSchema(id, tempDir).name).toBe(id);
    }
  });

  it('ignores project and user schemas, including same-name overrides', () => {
    const projectOverride = path.join(tempDir, 'openspec', 'schemas', 'spec-driven');
    const userOverride = path.join(process.env.XDG_DATA_HOME!, 'openspec', 'schemas', 'spec-driven');
    const custom = path.join(tempDir, 'openspec', 'schemas', 'custom');
    for (const dir of [projectOverride, userOverride, custom]) {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'schema.yaml'), 'name: override\nversion: 1\nartifacts: []\n');
    }

    expect(resolveSchema('spec-driven', tempDir).name).toBe('spec-driven');
    expect(listSchemas(tempDir)).toEqual([...BUILT_IN_SCHEMA_IDS]);
    expect(listSchemasWithInfo(tempDir).map(({ name, source }) => ({ name, source }))).toEqual([
      { name: 'spec-driven', source: 'package' },
      { name: 'bootstrap', source: 'package' },
    ]);
  });

  it('rejects unknown IDs and lists every valid built-in ID', () => {
    expect(() => resolveSchema('custom', tempDir)).toThrow(
      "Schema 'custom' not found. Available schemas: spec-driven, bootstrap"
    );
    expect(getSchemaDir('SPEC-DRIVEN', tempDir)).toBeNull();
  });

  it('rejects aliases and case variants instead of inferring a schema ID', () => {
    expect(() => resolveSchema('spec-driven.yaml', tempDir)).toThrow(/spec-driven, bootstrap/);
    expect(getSchemaDir('SPEC-DRIVEN', tempDir)).toBeNull();
  });

  it('uses Node path construction for package schema paths', () => {
    const dir = getSchemaDir('spec-driven');
    expect(dir).toBe(path.join(getPackageSchemasDir(), 'spec-driven'));
    expect(path.basename(dir!)).toBe('spec-driven');
    expect(path.basename(path.dirname(dir!))).toBe('schemas');
  });
});
