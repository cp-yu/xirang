import { promises as fs } from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { compareUtf8Bytes } from '../candidate/canonical.js';
import { buildCodeFenceMask } from '../parsers/requirement-text.js';
import { extractRequirementsSection } from '../parsers/requirement-blocks.js';
import { normalizeLineEndings, splitFrontmatter } from './frontmatter.js';
import { createModelIndex, type IndexedEntity, type IndexedRelationship, type ModelIndex, type SourceModule } from './index-map.js';
import { validateNodePresentation } from './node-presentation.js';
import { validateRelationshipPresentation } from './relationship-presentation.js';
import {
  DEFAULT_PARTITION,
  ENTITY_TYPES,
  PARTITIONS,
  emptySemanticModel,
  type AuthoredView,
  type ElementKind,
  type EntityType,
  type ModelDiagnostic,
  type ModelElement,
  type NodePresentation,
  type Partition,
  type Relationship,
  type RelationshipKind,
  type RelationshipPresentation,
  type Requirement,
  type Scenario,
  type SemanticModel,
} from './types.js';

export interface ParsedModel {
  model: SemanticModel;
  index: ModelIndex;
  diagnostics: ModelDiagnostic[];
}

export interface ParsedUnit {
  entity: EntityType;
  data: Record<string, unknown>;
  body: string;
}

const SCENARIO_HEADER = /^####\s+Scenario:\s*(.+?)\s*$/;

export function normalizeProse(body: string): string {
  return normalizeLineEndings(body).replace(/^\n+/, '').trimEnd();
}

function error(code: string, file: string, message: string, identity?: string): ModelDiagnostic {
  return { level: 'ERROR', code, path: file, message, ...(identity ? { identity } : {}) };
}

function warning(code: string, file: string, message: string, identity?: string): ModelDiagnostic {
  return { level: 'WARNING', code, path: file, message, ...(identity ? { identity } : {}) };
}

function parseNodePresentation(
  raw: unknown,
  file: string,
  identity: string,
  diagnostics: ModelDiagnostic[],
): NodePresentation | undefined {
  const validation = validateNodePresentation(raw);
  if (validation.absent) return undefined;
  if (validation.notMapping) {
    diagnostics.push(error('INVALID_NODE_PRESENTATION', file, `Element kind ${identity} nodePresentation must be a mapping`, identity));
    return undefined;
  }
  if (validation.unknownFields.length > 0) {
    diagnostics.push(error('INVALID_NODE_PRESENTATION', file, `Element kind ${identity} nodePresentation contains unknown fields: ${[...validation.unknownFields].sort().join(', ')}`, identity));
  }
  for (const invalid of validation.invalidValues) {
    diagnostics.push(error('INVALID_NODE_PRESENTATION', file, `Element kind ${identity} nodePresentation.${invalid.field} has invalid value: ${String(invalid.value)}`, identity));
  }
  return Object.keys(validation.presentation).length > 0 ? validation.presentation : undefined;
}

function parseRelationshipPresentation(
  raw: unknown,
  file: string,
  identity: string,
  diagnostics: ModelDiagnostic[],
): RelationshipPresentation | undefined {
  const validation = validateRelationshipPresentation(raw);
  if (validation.absent) return undefined;
  if (validation.notMapping) {
    diagnostics.push(error('INVALID_RELATIONSHIP_PRESENTATION', file, `Relationship kind ${identity} presentation must be a mapping`, identity));
    return undefined;
  }
  if (validation.unknownFields.length > 0) {
    diagnostics.push(error('INVALID_RELATIONSHIP_PRESENTATION', file, `Relationship kind ${identity} presentation contains unknown fields: ${[...validation.unknownFields].sort().join(', ')}`, identity));
  }
  for (const invalid of validation.invalidValues) {
    diagnostics.push(error('INVALID_RELATIONSHIP_PRESENTATION', file, `Relationship kind ${identity} presentation.${invalid.field} has invalid value: ${String(invalid.value)}`, identity));
  }
  return Object.keys(validation.presentation).length > 0 ? validation.presentation : undefined;
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function list(value: unknown): string[] | undefined {
  return Array.isArray(value) && value.every(item => typeof item === 'string') ? (value as string[]) : undefined;
}

/** Splits a `### Requirement:` block into its body and ordered scenarios. */
export function parseRequirementBlock(name: string, raw: string): Requirement {
  const lines = normalizeLineEndings(raw).split('\n').slice(1);
  const mask = buildCodeFenceMask(lines);
  const bodyLines: string[] = [];
  const scenarios: Scenario[] = [];
  let current: { name: string; lines: string[] } | null = null;

  for (let index = 0; index < lines.length; index += 1) {
    const header = mask[index] ? null : lines[index].match(SCENARIO_HEADER);
    if (header) {
      if (current) scenarios.push({ name: current.name, body: normalizeProse(current.lines.join('\n')) });
      current = { name: header[1], lines: [] };
      continue;
    }
    (current ? current.lines : bodyLines).push(lines[index]);
  }
  if (current) scenarios.push({ name: current.name, body: normalizeProse(current.lines.join('\n')) });
  return { name, body: normalizeProse(bodyLines.join('\n')), scenarios };
}

export interface ParsedContract {
  requirements: Requirement[];
  /** Contract content outside the `## Requirements` section; the IR cannot represent it. */
  leftover: string;
}

function hasRequirementsHeader(normalized: string): boolean {
  const lines = normalized.split('\n');
  const mask = buildCodeFenceMask(lines);
  return lines.some((line, index) => !mask[index] && /^##\s+Requirements\s*$/i.test(line));
}

export function parseContract(body: string): ParsedContract {
  const normalized = normalizeProse(body);
  if (normalized === '') return { requirements: [], leftover: '' };
  if (!hasRequirementsHeader(normalized)) return { requirements: [], leftover: normalized };
  const section = extractRequirementsSection(normalized);
  return {
    requirements: section.bodyBlocks.map(block => parseRequirementBlock(block.name, block.raw)),
    leftover: normalizeProse(`${section.before}\n${section.preamble}\n${section.after}`),
  };
}

export function readEntity(data: Record<string, unknown>): EntityType | undefined {
  const declared = text(data.entity);
  return ENTITY_TYPES.includes(declared as EntityType) ? (declared as EntityType) : undefined;
}

export interface UnitParseOutcome {
  entity: EntityType;
  identity: string;
  element?: ModelElement;
  elementKind?: ElementKind;
  relationshipKind?: RelationshipKind;
  view?: AuthoredView;
  diagnostics: ModelDiagnostic[];
}

/** Converts one markdown unit into IR. Notation-level checks only; no semantic judgement. */
export function parseUnit(file: string, data: Record<string, unknown>, body: string): UnitParseOutcome | ModelDiagnostic[] {
  const entity = readEntity(data);
  if (!entity) {
    return [error('UNKNOWN_ENTITY', file, `Unit does not declare a known entity type: ${String(data.entity ?? '')}`)];
  }
  const identity = text(data.identity);
  if (identity === undefined || identity === '') {
    return [error('MISSING_IDENTITY', file, `${entity} unit has no identity`)];
  }
  const diagnostics: ModelDiagnostic[] = [];

  if (entity === 'element-declaration') {
    const contract = parseContract(body);
    const definition = text(data.definition);
    if (Object.hasOwn(data, 'summary')) {
      diagnostics.push(error(
        'LEGACY_ELEMENT_SUMMARY',
        file,
        'Legacy Element Declaration field "summary" is not supported; migrate it to "definition".',
        identity,
      ));
    }
    if (definition === undefined || definition.trim() === '') {
      diagnostics.push(error(
        'MISSING_ELEMENT_DEFINITION',
        file,
        `Element ${identity} must declare a non-empty definition`,
        identity,
      ));
    }
    if (contract.leftover !== '') {
      diagnostics.push(error('UNSUPPORTED_CONTRACT_CONTENT', file,
        'Element contract content outside the Requirements section cannot be represented', identity));
    }
    return {
      entity,
      identity,
      element: {
        declaration: {
          identity,
          kind: text(data.kind) ?? '',
          parent: text(data.parent) ?? null,
          title: text(data.title) ?? '',
          definition: definition ?? '',
        },
        requirements: contract.requirements,
      },
      diagnostics,
    };
  }

  if (entity === 'element-kind') {
    const contract = text(data.contract);
    if (contract !== 'required' && contract !== 'optional') {
      diagnostics.push(error('MISSING_CONTRACT', file, `Element kind ${identity} has no explicit contract`, identity));
    }
    const nodePresentation = parseNodePresentation(data.nodePresentation, file, identity, diagnostics);
    return {
      entity,
      identity,
      elementKind: {
        identity,
        contract: contract === 'optional' ? 'optional' : 'required',
        ...(typeof data.root === 'boolean' ? { root: data.root } : {}),
        ...(list(data.parents) ? { parents: list(data.parents)! } : {}),
        ...(list(data.children) ? { children: list(data.children)! } : {}),
        ...(nodePresentation === undefined ? {} : { nodePresentation }),
        body: normalizeProse(body),
      },
      diagnostics,
    };
  }

  if (entity === 'relationship-kind') {
    const presentation = parseRelationshipPresentation(data.presentation, file, identity, diagnostics);
    return {
      entity,
      identity,
      relationshipKind: {
        identity,
        ...(list(data.sourceKinds) ? { sourceKinds: list(data.sourceKinds)! } : {}),
        ...(list(data.targetKinds) ? { targetKinds: list(data.targetKinds)! } : {}),
        ...(presentation === undefined ? {} : { presentation }),
        body: normalizeProse(body),
      },
      diagnostics,
    };
  }

  if (normalizeProse(body) !== '') {
    diagnostics.push(error('VIEW_BODY_UNSUPPORTED', file, `Authored view ${identity} must not carry a body`, identity));
  }
  const include = data.include === '*' ? '*' : list(data.include);
  if (include === undefined) {
    diagnostics.push(error('INVALID_VIEW_INCLUDE', file, `Authored view ${identity} has no valid include`, identity));
  }
  const exclude = list(data.exclude);
  if (data.exclude !== undefined && exclude === undefined) {
    diagnostics.push(error('INVALID_VIEW_EXCLUDE', file, `Authored view ${identity} exclude must be a list of identities`, identity));
  }
  return {
    entity,
    identity,
    view: {
      identity,
      include: include ?? [],
      ...(exclude !== undefined && exclude.length > 0 ? { exclude } : {}),
      ...(text(data.of) !== undefined ? { of: text(data.of)! } : {}),
      ...(text(data.title) !== undefined ? { title: text(data.title)! } : {}),
      ...(text(data.autoLayout) !== undefined ? { autoLayout: text(data.autoLayout)! } : {}),
    },
    diagnostics,
  };
}

export interface ParsedRelationshipContainer {
  entries: Array<Record<string, unknown>>;
  diagnostics: ModelDiagnostic[];
}

/** Parses a `relationships:` list container. */
export function parseRelationshipContainer(file: string, content: string): ParsedRelationshipContainer {
  let document: unknown;
  try {
    document = parseYaml(normalizeLineEndings(content));
  } catch (cause) {
    return { entries: [], diagnostics: [error('MALFORMED_UNIT', file, (cause as Error).message)] };
  }
  const items = (document as { relationships?: unknown } | null)?.relationships;
  if (!Array.isArray(items)) {
    return { entries: [], diagnostics: [error('MALFORMED_UNIT', file, 'Container has no relationships list')] };
  }
  const entries: Array<Record<string, unknown>> = [];
  const diagnostics: ModelDiagnostic[] = [];
  for (const item of items) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      diagnostics.push(error('MALFORMED_UNIT', file, 'Relationship entry must be a mapping'));
      continue;
    }
    entries.push(item as Record<string, unknown>);
  }
  return { entries, diagnostics };
}

const RELATIONSHIP_FIELDS = new Set(['source', 'kind', 'target', 'operation']);

export function readRelationship(file: string, entry: Record<string, unknown>): Relationship | ModelDiagnostic {
  const source = text(entry.source);
  const kind = text(entry.kind);
  const target = text(entry.target);
  if (!source || !kind || !target) {
    return error('MALFORMED_UNIT', file, 'Relationship entry requires source, kind and target');
  }
  const unsupported = Object.keys(entry).filter(key => !RELATIONSHIP_FIELDS.has(key));
  if (unsupported.length > 0) {
    return error('UNSUPPORTED_RELATIONSHIP_FIELD', file,
      `A relationship identity is its entire content; unsupported fields: ${unsupported.sort().join(', ')}`);
  }
  return { source, kind, target };
}

function partitionOf(relativePath: string): Partition | undefined {
  const head = relativePath.split('/')[0] as Partition;
  return PARTITIONS.includes(head) ? head : undefined;
}

/** Parses an in-memory partition tree keyed by POSIX paths relative to the model root. */
export function parseSemanticModelFiles(files: Iterable<readonly [string, string]>): ParsedModel {
  const model = emptySemanticModel();
  const diagnostics: ModelDiagnostic[] = [];
  const entities: IndexedEntity[] = [];
  const relationships: IndexedRelationship[] = [];
  const ordered = [...files].sort(([left], [right]) => compareUtf8Bytes(left, right));

  for (const [relativePath, content] of ordered) {
    const partition = partitionOf(relativePath);
    if (!partition) continue;
    const module: SourceModule = { partition, path: relativePath };

    if (isMarkdownUnit(content)) {
      const split = splitFrontmatter(content);
      if (!split.ok) {
        diagnostics.push(error(split.code, relativePath, split.message));
        continue;
      }
      const outcome = parseUnit(relativePath, split.data, split.body);
      if (Array.isArray(outcome)) {
        diagnostics.push(...outcome);
        continue;
      }
      diagnostics.push(...outcome.diagnostics);
      entities.push({ identity: outcome.identity, declared: outcome.entity, module });
      if (outcome.element) model.elements.push(outcome.element);
      if (outcome.elementKind) model.elementKinds.push(outcome.elementKind);
      if (outcome.relationshipKind) model.relationshipKinds.push(outcome.relationshipKind);
      if (outcome.view) model.views.push(outcome.view);
      continue;
    }

    const container = parseRelationshipContainer(relativePath, content);
    diagnostics.push(...container.diagnostics);
    for (const entry of container.entries) {
      const relationship = readRelationship(relativePath, entry);
      if ('level' in relationship) {
        diagnostics.push(relationship);
        continue;
      }
      model.relationships.push(relationship);
      relationships.push({ relationship, module });
    }
  }

  const index = createModelIndex(entities, relationships);
  diagnostics.push(...index.organizationWarnings().map(item => warning(
    'ENTITY_PARTITION_MISMATCH',
    item.path,
    `${item.declared} ${item.identity} is stored in ${item.partition} instead of ${DEFAULT_PARTITION[item.declared]}`,
    item.identity,
  )));
  return { model, index, diagnostics };
}

/** Reads the four partitions below `root` into a path → bytes map. */
export async function readModelTree(root: string): Promise<Map<string, Buffer>> {
  const files = new Map<string, Buffer>();
  const visit = async (directory: string, relative: string): Promise<void> => {
    let entries;
    try {
      entries = await fs.readdir(directory, { withFileTypes: true });
    } catch (cause) {
      if ((cause as NodeJS.ErrnoException).code === 'ENOENT') return;
      throw cause;
    }
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const child = `${relative}/${entry.name}`;
      if (entry.isDirectory()) await visit(path.join(directory, entry.name), child);
      else if (entry.isFile()) files.set(child, await fs.readFile(path.join(directory, entry.name)));
    }
  };
  for (const partition of PARTITIONS) await visit(path.join(root, partition), partition);
  return files;
}

export async function readModelFiles(root: string): Promise<Map<string, string>> {
  return new Map([...await readModelTree(root)].map(([file, bytes]) => [file, bytes.toString('utf8')]));
}

/** A unit carries frontmatter; anything else in a partition is a structured list container. */
export function isMarkdownUnit(content: string): boolean {
  return normalizeLineEndings(content).startsWith('---\n');
}

export async function parseSemanticModel(root: string): Promise<ParsedModel> {
  return parseSemanticModelFiles(await readModelFiles(root));
}
