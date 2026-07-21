import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'yaml';
import { BUILT_IN_SCHEMA_IDS, ChangeMetadataSchema, type BuiltInSchemaId, type ChangeMetadata } from '../core/artifact-graph/types.js';
import { readProjectConfig } from '../core/project-config.js';

const METADATA_FILENAME = '.opsx.yaml';

/**
 * Error thrown when change metadata validation fails.
 */
export class ChangeMetadataError extends Error {
  constructor(
    message: string,
    public readonly metadataPath: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'ChangeMetadataError';
  }
}

/**
 * Validates that a schema name is valid (exists in available schemas).
 *
 * @param schemaName - The schema name to validate
 * @param projectRoot - Optional project root retained for API compatibility
 * @returns The validated schema name
 * @throws Error if schema is not found
 */
export function validateSchemaName(
  schemaName: string,
  _projectRoot?: string
): BuiltInSchemaId {
  if (!(BUILT_IN_SCHEMA_IDS as readonly string[]).includes(schemaName)) {
    throw new Error(
      `Unknown schema '${schemaName}'. Available: ${BUILT_IN_SCHEMA_IDS.join(', ')}`
    );
  }
  return schemaName as BuiltInSchemaId;
}

/**
 * Writes change metadata to .opsx.yaml in the change directory.
 *
 * @param changeDir - The path to the change directory
 * @param metadata - The metadata to write
 * @param projectRoot - Optional project root retained for API compatibility
 * @throws ChangeMetadataError if validation fails or write fails
 */
export function writeChangeMetadata(
  changeDir: string,
  metadata: ChangeMetadata,
  projectRoot?: string
): void {
  const metaPath = path.join(changeDir, METADATA_FILENAME);

  // Validate schema exists
  validateSchemaName(metadata.schema, projectRoot);

  // Validate with Zod
  const parseResult = ChangeMetadataSchema.safeParse(metadata);
  if (!parseResult.success) {
    throw new ChangeMetadataError(
      `Invalid metadata: ${parseResult.error.message}`,
      metaPath
    );
  }

  // Write YAML file
  const content = yaml.stringify(parseResult.data);
  try {
    fs.writeFileSync(metaPath, content, 'utf-8');
  } catch (err) {
    const ioError = err instanceof Error ? err : new Error(String(err));
    throw new ChangeMetadataError(
      `Failed to write metadata: ${ioError.message}`,
      metaPath,
      ioError
    );
  }
}

/**
 * Reads change metadata from .opsx.yaml in the change directory.
 *
 * @param changeDir - The path to the change directory
 * @param projectRoot - Optional project root retained for API compatibility
 * @returns The validated metadata, or null if no metadata file exists
 * @throws ChangeMetadataError if the file exists but is invalid
 */
export function readChangeMetadata(
  changeDir: string,
  projectRoot?: string
): ChangeMetadata | null {
  const metaPath = path.join(changeDir, METADATA_FILENAME);

  if (!fs.existsSync(metaPath)) {
    return null;
  }

  let content: string;
  try {
    content = fs.readFileSync(metaPath, 'utf-8');
  } catch (err) {
    const ioError = err instanceof Error ? err : new Error(String(err));
    throw new ChangeMetadataError(
      `Failed to read metadata: ${ioError.message}`,
      metaPath,
      ioError
    );
  }

  let parsed: unknown;
  try {
    parsed = yaml.parse(content);
  } catch (err) {
    const parseError = err instanceof Error ? err : new Error(String(err));
    throw new ChangeMetadataError(
      `Invalid YAML in metadata file: ${parseError.message}`,
      metaPath,
      parseError
    );
  }

  // Validate with Zod
  const parseResult = ChangeMetadataSchema.safeParse(parsed);
  if (!parseResult.success) {
    throw new ChangeMetadataError(
      `Invalid metadata: ${parseResult.error.message}`,
      metaPath
    );
  }

  return parseResult.data;
}

/**
 * Resolves the schema for a change, with explicit override taking precedence.
 *
 * Resolution order:
 * 1. Explicit schema (if provided)
 * 2. Schema from .opsx.yaml metadata (if exists)
 * 3. Schema from .opsx/config.yaml (if exists)
 * 4. Default 'spec-driven'
 *
 * @param changeDir - The path to the change directory
 * @param explicitSchema - Optional explicit schema override
 * @returns The resolved schema name
 */
export function resolveSchemaForChange(
  changeDir: string,
  explicitSchema?: string
): BuiltInSchemaId {
  // Derive project root from changeDir (changeDir is typically projectRoot/.opsx/changes/change-name)
  const projectRoot = path.resolve(changeDir, '../../..');

  // 1. Explicit override wins
  if (explicitSchema) {
    return validateSchemaName(explicitSchema);
  }

  // 2. Read metadata when present; invalid metadata is a workflow error.
  const metadata = readChangeMetadata(changeDir, projectRoot);
  if (metadata?.schema) {
    return metadata.schema;
  }

  // 3. Read project config when present; an invalid binding must not fall back.
  const config = readProjectConfig(projectRoot);
  if (config?.schema) {
    return config.schema;
  }

  // 4. Default
  return 'spec-driven';
}
