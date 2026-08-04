import { compareUtf8Bytes } from '../candidate/canonical.js';
import { parseDeltaSpec } from '../parsers/requirement-blocks.js';
import { normalizeLineEndings, splitFrontmatter } from './frontmatter.js';
import {
  normalizeProse,
  parseRelationshipContainer,
  parseRequirementBlock,
  parseUnit,
  readEntity,
  readModelFiles,
  readRelationship,
} from './parser.js';
import {
  relationshipIdentity,
  type AuthoredView,
  type ElementDeclaration,
  type ElementKind,
  type EntityType,
  type ModelDiagnostic,
  type ModelElement,
  type Relationship,
  type RelationshipKind,
  type Requirement,
  type SemanticModel,
} from './types.js';

export type Operation = 'ADDED' | 'MODIFIED' | 'REMOVED';

export type DeltaEntityType = EntityType | 'requirement' | 'relationship';

export interface DeltaEntry {
  operation: Operation;
  entity: DeltaEntityType;
  /** requirement entries use `<element identity>#<name>` */
  identity: string;
  /** REMOVED carries no content */
  target?: unknown;
}

export interface SemanticDelta {
  entries: DeltaEntry[];
}

export interface ParsedDelta {
  delta: SemanticDelta;
  diagnostics: ModelDiagnostic[];
}

export interface DeltaApplication {
  expected: SemanticModel;
  /** Storage-addressable identities affected by the delta; requirement entries resolve to their host Element. */
  touched: Set<string>;
  diagnostics: ModelDiagnostic[];
}

const OPERATIONS: readonly Operation[] = ['ADDED', 'MODIFIED', 'REMOVED'];

function error(code: string, file: string, message: string, identity?: string): ModelDiagnostic {
  return { level: 'ERROR', code, path: file, message, ...(identity ? { identity } : {}) };
}

function readOperation(value: unknown): Operation | undefined {
  return OPERATIONS.includes(value as Operation) ? (value as Operation) : undefined;
}

function requirementEntry(operation: Operation, element: string, requirement: Requirement): DeltaEntry {
  return { operation, entity: 'requirement', identity: `${element}#${requirement.name}`, target: requirement };
}

function parseElementUnit(file: string, data: Record<string, unknown>, body: string, entries: DeltaEntry[], diagnostics: ModelDiagnostic[]): void {
  const outcome = parseUnit(file, data, '');
  if (Array.isArray(outcome)) {
    diagnostics.push(...outcome);
    return;
  }
  const identity = outcome.identity;
  const operation = readOperation(data.operation);
  diagnostics.push(...outcome.diagnostics.filter(diagnostic =>
    operation !== 'REMOVED' || diagnostic.code !== 'MISSING_ELEMENT_DEFINITION'
  ));
  if (data.operation !== undefined && operation === undefined) {
    diagnostics.push(error('INVALID_OPERATION', file, `Unknown operation: ${String(data.operation)}`, identity));
  }
  if (operation) {
    entries.push({
      operation,
      entity: 'element-declaration',
      identity,
      ...(operation === 'REMOVED' ? {} : { target: outcome.element!.declaration }),
    });
  }

  if (normalizeProse(body) === '') return;
  const plan = parseDeltaSpec(body);
  if (!Object.values(plan.sectionPresence).some(Boolean)) {
    diagnostics.push(error('MISSING_OPERATION', file,
      'Requirement entries must appear under ## ADDED/MODIFIED/REMOVED Requirements', identity));
    return;
  }
  for (const block of plan.added) entries.push(requirementEntry('ADDED', identity, parseRequirementBlock(block.name, block.raw)));
  for (const block of plan.modified) entries.push(requirementEntry('MODIFIED', identity, parseRequirementBlock(block.name, block.raw)));
  for (const name of plan.removed) entries.push({ operation: 'REMOVED', entity: 'requirement', identity: `${identity}#${name}` });
}

function parseDeltaUnit(file: string, content: string, entries: DeltaEntry[], diagnostics: ModelDiagnostic[]): void {
  const split = splitFrontmatter(content);
  if (!split.ok) {
    diagnostics.push(error(split.code, file, split.message));
    return;
  }
  if (readEntity(split.data) === 'element-declaration') {
    parseElementUnit(file, split.data, split.body, entries, diagnostics);
    return;
  }

  const outcome = parseUnit(file, split.data, split.body);
  if (Array.isArray(outcome)) {
    diagnostics.push(...outcome);
    return;
  }
  const operation = readOperation(split.data.operation);
  if (!operation) {
    diagnostics.push(error(
      split.data.operation === undefined ? 'MISSING_OPERATION' : 'INVALID_OPERATION',
      file,
      `${outcome.entity} delta unit requires an operation`,
      outcome.identity,
    ));
    return;
  }
  if (operation !== 'REMOVED') diagnostics.push(...outcome.diagnostics);
  const target = outcome.elementKind ?? outcome.relationshipKind ?? outcome.view;
  entries.push({
    operation,
    entity: outcome.entity,
    identity: outcome.identity,
    ...(operation === 'REMOVED' ? {} : { target }),
  });
}

function parseDeltaContainer(file: string, content: string, entries: DeltaEntry[], diagnostics: ModelDiagnostic[]): void {
  const container = parseRelationshipContainer(file, content);
  diagnostics.push(...container.diagnostics);
  for (const entry of container.entries) {
    const relationship = readRelationship(file, entry);
    if ('level' in relationship) {
      diagnostics.push(relationship);
      continue;
    }
    const label = `${relationship.source} -[${relationship.kind}]-> ${relationship.target}`;
    if (entry.operation === 'MODIFIED') {
      diagnostics.push(error('RELATIONSHIP_MODIFIED_UNSUPPORTED', file,
        `Relationship MODIFIED is not supported; its identity is its entire content: ${label}`));
      continue;
    }
    const operation = readOperation(entry.operation);
    if (!operation) {
      diagnostics.push(error(
        entry.operation === undefined ? 'MISSING_OPERATION' : 'INVALID_OPERATION',
        file,
        `Relationship entry requires an operation: ${label}`,
      ));
      continue;
    }
    entries.push({
      operation,
      entity: 'relationship',
      identity: relationshipIdentity(relationship),
      ...(operation === 'REMOVED' ? {} : { target: relationship }),
    });
  }
}

function detectConflicts(entries: DeltaEntry[], diagnostics: ModelDiagnostic[]): void {
  const seen = new Map<string, Operation>();
  for (const entry of entries) {
    const key = `${entry.entity}\u0000${entry.identity}`;
    const previous = seen.get(key);
    if (previous !== undefined) {
      diagnostics.push(error('CONFLICTING_OPERATIONS', '',
        `Conflicting ${previous}/${entry.operation} operations on ${entry.entity} ${entry.identity}`, entry.identity));
      continue;
    }
    seen.set(key, entry.operation);
  }
}

export async function parseSemanticDelta(changeRoot: string): Promise<ParsedDelta> {
  const entries: DeltaEntry[] = [];
  const diagnostics: ModelDiagnostic[] = [];
  for (const [file, content] of [...await readModelFiles(changeRoot)].sort(([left], [right]) => compareUtf8Bytes(left, right))) {
    if (normalizeLineEndings(content).startsWith('---\n')) parseDeltaUnit(file, content, entries, diagnostics);
    else parseDeltaContainer(file, content, entries, diagnostics);
  }
  detectConflicts(entries, diagnostics);
  return { delta: { entries }, diagnostics };
}

interface ApplyState {
  elements: Map<string, ModelElement>;
  elementKinds: Map<string, ElementKind>;
  relationshipKinds: Map<string, RelationshipKind>;
  relationships: Map<string, Relationship>;
  views: Map<string, AuthoredView>;
  /** element identities whose state entry is already an independent copy owned by this apply */
  ownedElements: Set<string>;
}

function cloneState(base: SemanticModel): ApplyState {
  return {
    elements: new Map(base.elements.map(item => [item.declaration.identity, item])),
    elementKinds: new Map(base.elementKinds.map(item => [item.identity, item])),
    relationshipKinds: new Map(base.relationshipKinds.map(item => [item.identity, item])),
    relationships: new Map(base.relationships.map(item => [relationshipIdentity(item), item])),
    views: new Map(base.views.map(item => [item.identity, item])),
    ownedElements: new Set(),
  };
}

/** Clones a host element plus its requirements array on the first requirement write, so the base is never mutated. */
function ensureOwnedElement(state: ApplyState, host: string): ModelElement | undefined {
  const element = state.elements.get(host);
  if (!element) return undefined;
  if (state.ownedElements.has(host)) return element;
  const owned: ModelElement = {
    declaration: element.declaration,
    requirements: [...element.requirements],
  };
  state.elements.set(host, owned);
  state.ownedElements.add(host);
  return owned;
}

function applyEntry(state: ApplyState, entry: DeltaEntry, touched: Set<string>, diagnostics: ModelDiagnostic[]): void {
  if (entry.entity === 'requirement') {
    const [host, ...rest] = entry.identity.split('#');
    const name = rest.join('#');
    const element = state.elements.get(host);
    if (!element) {
      diagnostics.push(error(`${entry.operation}_IDENTITY_MISSING`, '', `Requirement host element does not exist: ${host}`, entry.identity));
      return;
    }
    const owned = ensureOwnedElement(state, host)!;
    const index = owned.requirements.findIndex(item => item.name === name);
    if (entry.operation === 'ADDED') {
      if (index >= 0) {
        diagnostics.push(error('ADDED_IDENTITY_EXISTS', '', `ADDED requirement already exists: ${entry.identity}`, entry.identity));
        return;
      }
      owned.requirements.push(entry.target as Requirement);
    } else if (index < 0) {
      diagnostics.push(error(`${entry.operation}_IDENTITY_MISSING`, '', `${entry.operation} requirement does not exist: ${entry.identity}`, entry.identity));
      return;
    } else if (entry.operation === 'REMOVED') {
      owned.requirements.splice(index, 1);
    } else {
      owned.requirements[index] = entry.target as Requirement;
    }
    touched.add(host);
    return;
  }

  const collection: Map<string, unknown> = entry.entity === 'element-declaration' ? state.elements
    : entry.entity === 'element-kind' ? state.elementKinds
      : entry.entity === 'relationship-kind' ? state.relationshipKinds
        : entry.entity === 'authored-view' ? state.views
          : state.relationships;
  const exists = collection.has(entry.identity);

  if (entry.operation === 'ADDED' && exists) {
    diagnostics.push(error('ADDED_IDENTITY_EXISTS', '', `ADDED ${entry.entity} already exists: ${entry.identity}`, entry.identity));
    return;
  }
  if (entry.operation !== 'ADDED' && !exists) {
    diagnostics.push(error(`${entry.operation}_IDENTITY_MISSING`, '', `${entry.operation} ${entry.entity} does not exist: ${entry.identity}`, entry.identity));
    return;
  }

  if (entry.operation === 'REMOVED') collection.delete(entry.identity);
  else if (entry.entity === 'element-declaration') {
    const previous = state.elements.get(entry.identity);
    state.elements.set(entry.identity, {
      declaration: entry.target as ElementDeclaration,
      requirements: previous?.requirements ?? [],
    });
  } else collection.set(entry.identity, entry.target);
  touched.add(entry.identity);
}

export function applySemanticDelta(base: SemanticModel, delta: SemanticDelta): DeltaApplication {
  const state = cloneState(base);
  const touched = new Set<string>();
  const diagnostics: ModelDiagnostic[] = [];
  for (const entry of delta.entries) applyEntry(state, entry, touched, diagnostics);
  return {
    expected: {
      elementKinds: [...state.elementKinds.values()],
      relationshipKinds: [...state.relationshipKinds.values()],
      elements: [...state.elements.values()],
      relationships: [...state.relationships.values()],
      views: [...state.views.values()],
    },
    touched,
    diagnostics,
  };
}
