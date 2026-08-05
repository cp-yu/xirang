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
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xirang-resolver-'));
    originalDataHome = process.env.XDG_DATA_HOME;
    process.env.XDG_DATA_HOME = path.join(tempDir, 'data');
  });

  afterEach(() => {
    if (originalDataHome === undefined) delete process.env.XDG_DATA_HOME;
    else process.env.XDG_DATA_HOME = originalDataHome;
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('resolves the fixed built-in schema from the package directory', () => {
    for (const id of BUILT_IN_SCHEMA_IDS) {
      const expected = path.join(getPackageSchemasDir(), id);
      expect(getSchemaDir(id, tempDir)).toBe(expected);
      expect(resolveSchema(id, tempDir).name).toBe(id);
    }
  });

  it('ignores project and user schemas, including same-name overrides', () => {
    const projectOverride = path.join(tempDir, '.xirang', 'schemas', 'semantic-model');
    const userOverride = path.join(process.env.XDG_DATA_HOME!, 'xirang', 'schemas', 'semantic-model');
    const custom = path.join(tempDir, '.xirang', 'schemas', 'custom');
    for (const dir of [projectOverride, userOverride, custom]) {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'schema.yaml'), 'name: override\nversion: 1\nartifacts: []\n');
    }

    expect(resolveSchema('semantic-model', tempDir).name).toBe('semantic-model');
    expect(listSchemas(tempDir)).toEqual([...BUILT_IN_SCHEMA_IDS]);
    expect(listSchemasWithInfo(tempDir).map(({ name, source }) => ({ name, source }))).toEqual([
      { name: 'semantic-model', source: 'package' },
    ]);
  });

  it('rejects unknown IDs and lists every valid built-in ID', () => {
    expect(() => resolveSchema('custom', tempDir)).toThrow(
      "Schema 'custom' not found. Available schemas: semantic-model"
    );
    expect(getSchemaDir('SEMANTIC-MODEL', tempDir)).toBeNull();
  });

  it('rejects aliases and case variants instead of inferring a schema ID', () => {
    expect(() => resolveSchema('semantic-model.yaml', tempDir)).toThrow(/Available schemas: semantic-model/);
    expect(getSchemaDir('SEMANTIC-MODEL', tempDir)).toBeNull();
  });

  it('uses Node path construction for package schema paths', () => {
    const dir = getSchemaDir('semantic-model');
    expect(dir).toBe(path.join(getPackageSchemasDir(), 'semantic-model'));
    expect(path.basename(dir!)).toBe('semantic-model');
    expect(path.basename(path.dirname(dir!))).toBe('schemas');
  });
});
