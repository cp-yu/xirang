import { promises as fs } from 'fs';
import path from 'path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { z } from 'zod';
import { FileSystemUtils } from './file-system.js';
import {
  getRelationDefinition,
  RelationTypeSchema,
} from '../core/relations/registry.js';
import { validateRelationGraph } from '../core/relations/validator.js';

export const OPSX_SCHEMA_VERSION = 2;

export const OPSX_PATHS = {
  PROJECT_FILE: 'openspec/project.opsx.yaml',
  RELATIONS_FILE: 'openspec/project.opsx.relations.yaml',
  deltaPath: (changeName: string) => `openspec/changes/${changeName}/opsx-delta.yaml`,
} as const;

/**
 * Zod Schemas for OPSX structures
 */

const NodeIdSchema = z.string().regex(/^(cap|dom|inv|ifc|dec|rel|evd)\./);

const ProgressSchema = z.object({
  phase: z.enum(['implementing', 'verifying']),
}).optional();

const BaseNodeSchema = z.object({
  id: NodeIdSchema,
  intent: z.string().optional(),
  status: z.enum(['draft', 'active']).optional(),
  progress: ProgressSchema,
});

// Capability node
export const CapabilityNodeSchema = BaseNodeSchema.extend({
  type: z.literal('capability'),
  domain: z.string().optional(),
});

// Domain node
export const DomainNodeSchema = BaseNodeSchema.extend({
  type: z.literal('domain'),
  boundary: z.string().optional(),
});

// Invariant node
export const InvariantNodeSchema = BaseNodeSchema.extend({
  type: z.literal('invariant'),
  property: z.string().optional(),
});

// Interface node
export const InterfaceNodeSchema = BaseNodeSchema.extend({
  type: z.literal('interface'),
  protocol: z.string().optional(),
});

// Decision node
export const DecisionNodeSchema = BaseNodeSchema.extend({
  type: z.literal('decision'),
  rationale: z.string().optional(),
});

// Evidence node
export const EvidenceNodeSchema = BaseNodeSchema.extend({
  type: z.literal('evidence'),
  source: z.string().optional(),
});

// Union of all node types
export const OpsxNodeSchema = z.union([
  CapabilityNodeSchema,
  DomainNodeSchema,
  InvariantNodeSchema,
  InterfaceNodeSchema,
  DecisionNodeSchema,
  EvidenceNodeSchema,
]);

// Relation schema
export const OpsxRelationSchema = z.object({
  from: NodeIdSchema,
  type: RelationTypeSchema,
  to: NodeIdSchema,
  note: z.string().optional(),
}).superRefine((relation, context) => {
  const policy = getRelationDefinition(relation.type).notePolicy;
  if (relation.note === undefined) return;
  if (!policy.allowed) {
    context.addIssue({
      code: 'custom',
      path: ['note'],
      message: `${relation.type} does not allow note`,
    });
  } else if (relation.note.length > policy.maxLength) {
    context.addIssue({
      code: 'too_big',
      origin: 'string',
      maximum: policy.maxLength,
      inclusive: true,
      path: ['note'],
      message: `note must contain at most ${policy.maxLength} characters`,
    });
  }
});

const ProjectMetadataSchema = z.object({
  id: z.string(),
  name: z.string(),
  intent: z.string().optional(),
  scope: z.string().optional(),
  roots: z.array(z.object({ path: z.string() })).optional(),
});

// --- Disk file schemas ---

export const ProjectOpsxFileSchema = z.object({
  schema_version: z.literal(OPSX_SCHEMA_VERSION),
  project: ProjectMetadataSchema,
  domains: z.array(DomainNodeSchema).optional(),
  capabilities: z.array(CapabilityNodeSchema).optional(),
  invariants: z.array(InvariantNodeSchema).optional(),
  interfaces: z.array(InterfaceNodeSchema).optional(),
  decisions: z.array(DecisionNodeSchema).optional(),
  evidence: z.array(EvidenceNodeSchema).optional(),
});

export const ProjectOpsxRelationsFileSchema = z.object({
  schema_version: z.literal(OPSX_SCHEMA_VERSION),
  relations: z.array(OpsxRelationSchema),
});

// --- Runtime bundle (merged view) ---

export interface ProjectOpsxBundle {
  schema_version: typeof OPSX_SCHEMA_VERSION;
  project: z.infer<typeof ProjectMetadataSchema>;
  domains: z.infer<typeof DomainNodeSchema>[];
  capabilities: z.infer<typeof CapabilityNodeSchema>[];
  invariants?: z.infer<typeof InvariantNodeSchema>[];
  interfaces?: z.infer<typeof InterfaceNodeSchema>[];
  decisions?: z.infer<typeof DecisionNodeSchema>[];
  evidence?: z.infer<typeof EvidenceNodeSchema>[];
  relations: z.infer<typeof OpsxRelationSchema>[];
}

const DeltaCollectionSchema = z.object({
  domains: z.array(DomainNodeSchema).optional(),
  capabilities: z.array(CapabilityNodeSchema).optional(),
  relations: z.array(OpsxRelationSchema).optional(),
});

// MODIFIED: only id is required; intent/status are the mutable fields.
// .passthrough() preserves extra fields (domain, boundary, etc.) so they
// reach applyOpsxDelta for shallow merge.
const ModifiedNodeSchema = z.object({
  id: NodeIdSchema,
  intent: z.string().optional(),
  status: z.enum(['draft', 'active']).optional(),
}).passthrough();

// REMOVED: only id is needed to identify the node to delete
const RemovedNodeSchema = z.object({
  id: NodeIdSchema,
});

const ModifiedDeltaCollectionSchema = z.object({
  domains: z.array(ModifiedNodeSchema).optional(),
  capabilities: z.array(ModifiedNodeSchema).optional(),
  relations: z.array(OpsxRelationSchema).optional(),
});

const RemovedDeltaCollectionSchema = z.object({
  domains: z.array(RemovedNodeSchema).optional(),
  capabilities: z.array(RemovedNodeSchema).optional(),
  relations: z.array(OpsxRelationSchema).optional(),
});

export const OpsxDeltaSchema = z.object({
  schema_version: z.literal(OPSX_SCHEMA_VERSION),
  ADDED: DeltaCollectionSchema.optional(),
  MODIFIED: ModifiedDeltaCollectionSchema.optional(),
  REMOVED: RemovedDeltaCollectionSchema.optional(),
});

// TypeScript types
export type OpsxNode = z.infer<typeof OpsxNodeSchema>;
export type OpsxRelation = z.infer<typeof OpsxRelationSchema>;
export type ProjectOpsxFile = z.infer<typeof ProjectOpsxFileSchema>;
type ParsedOpsxDelta = z.infer<typeof OpsxDeltaSchema>;
export type OpsxDelta = Omit<ParsedOpsxDelta, 'schema_version'> & {
  schema_version?: typeof OPSX_SCHEMA_VERSION;
};

interface DeltaCounts {
  domains: number;
  capabilities: number;
  relations: number;
}

export interface OpsxDeltaApplyResult {
  bundle: ProjectOpsxBundle;
  counts: {
    added: DeltaCounts;
    modified: DeltaCounts;
    removed: DeltaCounts;
  };
  changed: boolean;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Read and assemble the full OPSX v2 bundle from two files.
 */
export async function readProjectOpsx(
  projectRoot: string
): Promise<ProjectOpsxBundle | null> {
  const mainPath = FileSystemUtils.joinPath(projectRoot, OPSX_PATHS.PROJECT_FILE);
  if (!await FileSystemUtils.fileExists(mainPath)) return null;

  const raw = parseYaml(await fs.readFile(mainPath, 'utf-8'));
  if (raw?.schema_version !== OPSX_SCHEMA_VERSION) {
    throw new Error(
      `OPSX schema_version ${String(raw?.schema_version ?? 'missing')} is unsupported; run openspec help authoring project.opsx.relations.yaml and rebuild with the bootstrap/refresh workflow.`
    );
  }

  const mainFile = ProjectOpsxFileSchema.parse(raw);
  const relationsPath = FileSystemUtils.joinPath(projectRoot, OPSX_PATHS.RELATIONS_FILE);
  if (!await FileSystemUtils.fileExists(relationsPath)) {
    throw new Error(`OPSX file not found: ${OPSX_PATHS.RELATIONS_FILE}. Run openspec init or the bootstrap/refresh workflow.`);
  }
  const rawRelations = parseYaml(await fs.readFile(relationsPath, 'utf-8'));
  if (rawRelations?.schema_version !== OPSX_SCHEMA_VERSION) {
    throw new Error(
      `OPSX relations schema_version ${String(rawRelations?.schema_version ?? 'missing')} is unsupported; run openspec help authoring project.opsx.relations.yaml and rebuild with the bootstrap/refresh workflow.`
    );
  }
  const relationsFile = ProjectOpsxRelationsFileSchema.parse(rawRelations);

  const bundle: ProjectOpsxBundle = {
    schema_version: mainFile.schema_version,
    project: mainFile.project,
    domains: mainFile.domains || [],
    capabilities: mainFile.capabilities || [],
    ...(mainFile.invariants ? { invariants: mainFile.invariants } : {}),
    ...(mainFile.interfaces ? { interfaces: mainFile.interfaces } : {}),
    ...(mainFile.decisions ? { decisions: mainFile.decisions } : {}),
    ...(mainFile.evidence ? { evidence: mainFile.evidence } : {}),
    relations: relationsFile.relations,
  };
  const validation = validateRelationGraph(bundle);
  if (!validation.valid) {
    throw new Error(`Invalid OPSX relation graph:\n${validation.errors.map((error) => `  - ${error}`).join('\n')}`);
  }
  return bundle;
}

/**
 * Write the full OPSX bundle atomically to two files.
 */
export async function writeProjectOpsx(
  projectRoot: string,
  bundle: ProjectOpsxBundle
): Promise<void> {
  const mainPath = FileSystemUtils.joinPath(projectRoot, OPSX_PATHS.PROJECT_FILE);
  const relPath = FileSystemUtils.joinPath(projectRoot, OPSX_PATHS.RELATIONS_FILE);

  const mainData: ProjectOpsxFile = {
    schema_version: bundle.schema_version,
    project: bundle.project,
    ...(bundle.domains?.length ? { domains: bundle.domains } : {}),
    ...(bundle.capabilities?.length ? { capabilities: bundle.capabilities } : {}),
    ...(bundle.invariants?.length ? { invariants: bundle.invariants } : {}),
    ...(bundle.interfaces?.length ? { interfaces: bundle.interfaces } : {}),
    ...(bundle.decisions?.length ? { decisions: bundle.decisions } : {}),
    ...(bundle.evidence?.length ? { evidence: bundle.evidence } : {}),
  };

  const relData = {
    schema_version: bundle.schema_version,
    relations: bundle.relations,
  };

  const mainTmp = `${mainPath}.tmp`;
  const relTmp = `${relPath}.tmp`;
  const originals = await Promise.all([
    readOptionalTextFile(mainPath),
    readOptionalTextFile(relPath),
  ]);

  try {
    await FileSystemUtils.createDirectory(path.dirname(mainPath));

    const mainYaml = stringifyYaml(mainData, { lineWidth: 0 });
    const relYaml = stringifyYaml(relData, { lineWidth: 0 });

    await Promise.all([
      fs.writeFile(mainTmp, mainYaml, 'utf-8'),
      fs.writeFile(relTmp, relYaml, 'utf-8'),
    ]);

    await fs.rename(mainTmp, mainPath);
    await fs.rename(relTmp, relPath);
  } catch (err) {
    for (const tmp of [mainTmp, relTmp]) {
      try { await fs.unlink(tmp); } catch { /* ignore */ }
    }
    await Promise.all([
      restoreOptionalTextFile(mainPath, originals[0]),
      restoreOptionalTextFile(relPath, originals[1]),
    ]);
    throw err;
  }
}

/**
 * Format Zod issues into human-readable, diagnostic strings.
 * For z.literal() discriminator fields that are missing (value undefined),
 * replace the misleading "expected 'capability'" message with "field is missing".
 */
function formatZodIssues(issues: z.ZodIssue[], rawData: unknown): string {
  return issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : '<root>';
      let message = issue.message;

      // Detect: z.literal() on a missing field produces misleading messages.
      // When code is 'invalid_type' (not 'invalid_value') and the field is missing,
      // the Zod literal errors can say "Required" already. But for YAML where keys
      // exist with null/undefined values, we get invalid_value. Handle both cases.
      if (issue.code === 'invalid_value') {
        const actual = getValueAtPath(rawData, issue.path as (string | number)[]);
        if (actual === undefined || actual === null) {
          message = `field is missing (required)`;
        }
      }
      if (issue.code === 'invalid_type') {
        const actual = getValueAtPath(rawData, issue.path as (string | number)[]);
        if (actual === undefined) {
          message = `field is missing (required)`;
        }
      }

      return `  ${path}: ${message}`;
    })
    .join('\n');
}

/** Navigate a nested object/array by Zod path segments. */
function getValueAtPath(data: unknown, path: (string | number)[]): unknown {
  let current: any = data;
  for (const segment of path) {
    if (current === undefined || current === null) return undefined;
    current = current[segment];
  }
  return current;
}

export async function readOpsxDelta(projectRoot: string, changeName: string): Promise<OpsxDelta | null> {
  const deltaPath = FileSystemUtils.joinPath(projectRoot, OPSX_PATHS.deltaPath(changeName));
  if (!await FileSystemUtils.fileExists(deltaPath)) return null;

  const content = await fs.readFile(deltaPath, 'utf-8');
  const data = parseYaml(content);
  const result = OpsxDeltaSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid opsx-delta.yaml for change '${changeName}':\n${formatZodIssues(result.error.issues, data)}`);
  }
  return result.data;
}

export function applyOpsxDelta(bundle: ProjectOpsxBundle, delta: OpsxDelta): OpsxDeltaApplyResult {
  const next: ProjectOpsxBundle = {
    ...bundle,
    domains: [...bundle.domains],
    capabilities: [...bundle.capabilities],
    relations: [...bundle.relations],
    ...(bundle.invariants ? { invariants: [...bundle.invariants] } : {}),
    ...(bundle.interfaces ? { interfaces: [...bundle.interfaces] } : {}),
    ...(bundle.decisions ? { decisions: [...bundle.decisions] } : {}),
    ...(bundle.evidence ? { evidence: [...bundle.evidence] } : {}),
  };

  const counts = {
    added: { domains: 0, capabilities: 0, relations: 0 },
    modified: { domains: 0, capabilities: 0, relations: 0 },
    removed: { domains: 0, capabilities: 0, relations: 0 },
  };

  const relationKey = (relation: OpsxRelation) => JSON.stringify([relation.from, relation.to, relation.type]);
  const relationPairKey = (relation: OpsxRelation) => JSON.stringify([relation.from, relation.to]);
  const indexFirst = <T>(values: T[], keyOf: (value: T) => string): Map<string, number> => {
    const indexes = new Map<string, number>();
    values.forEach((value, index) => {
      const key = keyOf(value);
      if (!indexes.has(key)) indexes.set(key, index);
    });
    return indexes;
  };

  const domainIndexes = indexFirst(next.domains, (domain) => domain.id);
  const capabilityIndexes = indexFirst(next.capabilities, (capability) => capability.id);
  const relationKeys = new Set(next.relations.map(relationKey));
  const relationPairIndexes = indexFirst(next.relations, relationPairKey);

  for (const domain of delta.ADDED?.domains || []) {
    if (domainIndexes.has(domain.id)) continue;
    domainIndexes.set(domain.id, next.domains.length);
    next.domains.push(domain);
    counts.added.domains += 1;
  }
  for (const capability of delta.ADDED?.capabilities || []) {
    if (capabilityIndexes.has(capability.id)) continue;
    capabilityIndexes.set(capability.id, next.capabilities.length);
    next.capabilities.push(capability);
    counts.added.capabilities += 1;
  }
  for (const relation of delta.ADDED?.relations || []) {
    const key = relationKey(relation);
    if (relationKeys.has(key)) continue;
    relationKeys.add(key);
    const index = next.relations.length;
    next.relations.push(relation);
    const pairKey = relationPairKey(relation);
    if (!relationPairIndexes.has(pairKey)) relationPairIndexes.set(pairKey, index);
    counts.added.relations += 1;
  }

  for (const domain of delta.MODIFIED?.domains || []) {
    const index = domainIndexes.get(domain.id);
    if (index === undefined) {
      throw new Error(`OPSX MODIFIED failed for domain '${domain.id}' - not found`);
    }
    if (isPatchAlreadyApplied(next.domains[index], domain)) continue;
    next.domains[index] = { ...next.domains[index], ...domain };
    counts.modified.domains += 1;
  }
  for (const capability of delta.MODIFIED?.capabilities || []) {
    const index = capabilityIndexes.get(capability.id);
    if (index === undefined) {
      throw new Error(`OPSX MODIFIED failed for capability '${capability.id}' - not found`);
    }
    if (isPatchAlreadyApplied(next.capabilities[index], capability)) continue;
    next.capabilities[index] = { ...next.capabilities[index], ...capability };
    counts.modified.capabilities += 1;
  }
  for (const relation of delta.MODIFIED?.relations || []) {
    const index = relationPairIndexes.get(relationPairKey(relation));
    if (index === undefined) {
      throw new Error(`OPSX MODIFIED failed for relation '${relation.from}' -> '${relation.to}' - not found`);
    }
    if (isPatchAlreadyApplied(next.relations[index], relation)) continue;
    next.relations[index] = { ...next.relations[index], ...relation };
    counts.modified.relations += 1;
  }

  const removedDomainIds = new Set(delta.REMOVED?.domains?.map((domain) => domain.id) || []);
  counts.removed.domains = [...removedDomainIds].filter((id) => domainIndexes.has(id)).length;
  if (removedDomainIds.size > 0) {
    next.domains = next.domains.filter((domain) => !removedDomainIds.has(domain.id));
  }

  const removedCapabilityIds = new Set(delta.REMOVED?.capabilities?.map((capability) => capability.id) || []);
  counts.removed.capabilities = [...removedCapabilityIds].filter((id) => capabilityIndexes.has(id)).length;
  if (removedCapabilityIds.size > 0) {
    next.capabilities = next.capabilities.filter((capability) => !removedCapabilityIds.has(capability.id));
  }

  const removedRelationKeys = new Set(delta.REMOVED?.relations?.map(relationKey) || []);
  if (removedRelationKeys.size > 0) {
    const currentRelationKeys = new Set(next.relations.map(relationKey));
    counts.removed.relations = [...removedRelationKeys].filter((key) => currentRelationKeys.has(key)).length;
    next.relations = next.relations.filter((relation) => !removedRelationKeys.has(relationKey(relation)));
  }

  const changed = [
    counts.added.domains,
    counts.added.capabilities,
    counts.added.relations,
    counts.modified.domains,
    counts.modified.capabilities,
    counts.modified.relations,
    counts.removed.domains,
    counts.removed.capabilities,
    counts.removed.relations,
  ].some((count) => count > 0);

  return {
    bundle: next,
    counts,
    changed,
  };
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function isPatchAlreadyApplied(current: Record<string, unknown>, patch: Record<string, unknown>): boolean {
  return Object.entries(patch).every(([key, value]) => stableStringify(current[key]) === stableStringify(value));
}

/**
 * Validate referential integrity: all relation from/to must reference existing nodes.
 */
export function validateReferentialIntegrity(bundle: ProjectOpsxBundle): ValidationResult {
  const errors: string[] = [];
  const nodeIds = new Set<string>();

  for (const node of [...bundle.domains, ...bundle.capabilities]) {
    nodeIds.add(node.id);
  }

  for (const rel of bundle.relations) {
    if (!nodeIds.has(rel.from)) {
      errors.push(`Relation references non-existent 'from' node: ${rel.from}`);
    }
    if (!nodeIds.has(rel.to)) {
      errors.push(`Relation references non-existent 'to' node: ${rel.to}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

async function readOptionalTextFile(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

async function restoreOptionalTextFile(filePath: string, content: string | null): Promise<void> {
  if (content === null) {
    await fs.rm(filePath, { force: true }).catch(() => undefined);
    return;
  }
  await FileSystemUtils.createDirectory(path.dirname(filePath));
  await fs.writeFile(filePath, content, 'utf-8');
}
