import * as fs from 'node:fs';
import { parse as parseYaml } from 'yaml';
import { BUILT_IN_SCHEMA_IDS, SchemaYamlSchema, type SchemaYaml, type Artifact } from './types.js';

export class SchemaValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SchemaValidationError';
  }
}

/**
 * Loads and validates an artifact schema from a YAML file.
 */
export function loadSchema(filePath: string): SchemaYaml {
  const content = fs.readFileSync(filePath, 'utf-8');
  return parseSchema(content);
}

/**
 * Parses and validates an artifact schema from YAML content.
 */
export function parseSchema(yamlContent: string): SchemaYaml {
  const parsed = parseYaml(yamlContent);

  // Validate with Zod
  const result = SchemaYamlSchema.safeParse(parsed);
  if (!result.success) {
    const errors = result.error.issues.map((issue) => {
      const [collection, index, ...rest] = issue.path;
      if ((collection === 'artifacts' || collection === 'files') && typeof index === 'number') {
        const entries = parsed?.[collection];
        const id = Array.isArray(entries) ? entries[index]?.id : undefined;
        if (typeof id === 'string') {
          const kind = collection === 'artifacts' ? 'artifact' : 'file';
          return `${kind} '${id}'.${rest.join('.')}: ${issue.message}`;
        }
      }
      return `${issue.path.join('.')}: ${issue.message}`;
    }).join(', ');
    throw new SchemaValidationError(`Invalid schema: ${errors}`);
  }

  const schema = result.data;

  if ((BUILT_IN_SCHEMA_IDS as readonly string[]).includes(schema.name)) {
    for (const artifact of schema.artifacts) {
      if (!artifact.definition) {
        throw new SchemaValidationError(
          `Invalid built-in artifact '${artifact.id}': definition is required`
        );
      }
    }
  }
  // Check for duplicate artifact IDs
  validateNoDuplicateIds(schema.artifacts);
  validateFileReferences(schema);

  // Check that all requires references are valid
  validateRequiresReferences(schema.artifacts);

  // Check for cycles
  validateNoCycles(schema.artifacts);

  return schema;
}

/**
 * Validates that there are no duplicate artifact IDs.
 */
function validateNoDuplicateIds(artifacts: Artifact[]): void {
  const seen = new Set<string>();
  for (const artifact of artifacts) {
    if (seen.has(artifact.id)) {
      throw new SchemaValidationError(`Duplicate artifact ID: ${artifact.id}`);
    }
    seen.add(artifact.id);
  }
}

function validateFileReferences(schema: SchemaYaml): void {
  const ids = new Set<string>();
  for (const file of schema.files ?? []) {
    if (ids.has(file.id)) {
      throw new SchemaValidationError(`Duplicate file ID: ${file.id}`);
    }
    ids.add(file.id);
  }

  for (const artifact of schema.artifacts) {
    const referenced = new Set<string>();
    for (const fileId of artifact.files ?? []) {
      if (referenced.has(fileId)) {
        throw new SchemaValidationError(
          `Invalid file reference in artifact '${artifact.id}': duplicate '${fileId}'`
        );
      }
      if (!ids.has(fileId)) {
        throw new SchemaValidationError(
          `Invalid file reference in artifact '${artifact.id}': '${fileId}' does not exist`
        );
      }
      referenced.add(fileId);
    }
  }
}

/**
 * Validates that all `requires` references point to valid artifact IDs.
 */
function validateRequiresReferences(artifacts: Artifact[]): void {
  const validIds = new Set(artifacts.map(a => a.id));

  for (const artifact of artifacts) {
    for (const req of artifact.requires) {
      if (!validIds.has(req)) {
        throw new SchemaValidationError(
          `Invalid dependency reference in artifact '${artifact.id}': '${req}' does not exist`
        );
      }
    }
  }
}

/**
 * Validates that there are no cyclic dependencies.
 * Uses DFS to detect cycles and reports the full cycle path.
 */
function validateNoCycles(artifacts: Artifact[]): void {
  const artifactMap = new Map(artifacts.map(a => [a.id, a]));
  const visited = new Set<string>();
  const inStack = new Set<string>();
  const parent = new Map<string, string>();

  function dfs(id: string): string | null {
    visited.add(id);
    inStack.add(id);

    const artifact = artifactMap.get(id);
    if (!artifact) return null;

    for (const dep of artifact.requires) {
      if (!visited.has(dep)) {
        parent.set(dep, id);
        const cycle = dfs(dep);
        if (cycle) return cycle;
      } else if (inStack.has(dep)) {
        // Found a cycle - reconstruct the path
        const cyclePath = [dep];
        let current = id;
        while (current !== dep) {
          cyclePath.unshift(current);
          current = parent.get(current)!;
        }
        cyclePath.unshift(dep);
        return cyclePath.join(' → ');
      }
    }

    inStack.delete(id);
    return null;
  }

  for (const artifact of artifacts) {
    if (!visited.has(artifact.id)) {
      const cycle = dfs(artifact.id);
      if (cycle) {
        throw new SchemaValidationError(`Cyclic dependency detected: ${cycle}`);
      }
    }
  }
}
