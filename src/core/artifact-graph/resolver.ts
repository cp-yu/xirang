import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseSchema, SchemaValidationError } from './schema.js';
import { BUILT_IN_SCHEMA_IDS, type SchemaYaml } from './types.js';

export class SchemaLoadError extends Error {
  constructor(
    message: string,
    public readonly schemaPath: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'SchemaLoadError';
  }
}

export function getPackageSchemasDir(): string {
  const currentFile = fileURLToPath(import.meta.url);
  return path.join(path.dirname(currentFile), '..', '..', '..', 'schemas');
}

export function getSchemaDir(name: string, _projectRoot?: string): string | null {
  if (!(BUILT_IN_SCHEMA_IDS as readonly string[]).includes(name)) {
    return null;
  }
  const schemaDir = path.join(getPackageSchemasDir(), name);
  return fs.existsSync(path.join(schemaDir, 'schema.yaml')) ? schemaDir : null;
}

export function resolveSchema(name: string, projectRoot?: string): SchemaYaml {
  const schemaDir = getSchemaDir(name, projectRoot);
  if (!schemaDir) {
    throw new Error(
      `Schema '${name}' not found. Available schemas: ${BUILT_IN_SCHEMA_IDS.join(', ')}`
    );
  }
  const schemaPath = path.join(schemaDir, 'schema.yaml');

  let content: string;
  try {
    content = fs.readFileSync(schemaPath, 'utf-8');
  } catch (error) {
    const cause = error instanceof Error ? error : new Error(String(error));
    throw new SchemaLoadError(`Failed to read schema at '${schemaPath}': ${cause.message}`, schemaPath, cause);
  }

  try {
    return parseSchema(content);
  } catch (error) {
    const cause = error instanceof Error ? error : new Error(String(error));
    const prefix = error instanceof SchemaValidationError ? 'Invalid schema' : 'Failed to parse schema';
    throw new SchemaLoadError(`${prefix} at '${schemaPath}': ${cause.message}`, schemaPath, cause);
  }
}

export function listSchemas(_projectRoot?: string): string[] {
  return [...BUILT_IN_SCHEMA_IDS];
}

export interface SchemaInfo {
  name: string;
  description: string;
  artifacts: string[];
  source: 'package';
}

export function listSchemasWithInfo(_projectRoot?: string): SchemaInfo[] {
  return BUILT_IN_SCHEMA_IDS.map((name) => {
    const schema = resolveSchema(name);
    return {
      name,
      description: schema.description ?? '',
      artifacts: schema.artifacts.map((artifact) => artifact.id),
      source: 'package' as const,
    };
  });
}
