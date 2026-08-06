import { createHash } from 'node:crypto';
import type {
  ModelElement,
  Relationship,
  Requirement,
  SemanticModel,
} from './model/types.js';

export interface SourceLocation {
  line: number;
  column: number;
  offset: number;
}

export type DiffOperation = 'ADDED' | 'MODIFIED' | 'REMOVED';

/** Entry kinds mirror the contract `entity` values; `scenario` and `property` are child-only detail. */
export type DiffKind =
  | 'element-declaration'
  | 'element-kind'
  | 'relationship-kind'
  | 'authored-view'
  | 'relationship'
  | 'requirement'
  | 'scenario'
  | 'property';

export const DIFF_ENTITY_KINDS: readonly DiffKind[] = [
  'element-declaration',
  'element-kind',
  'relationship-kind',
  'authored-view',
  'relationship',
  'requirement',
];

export interface ChangeDiagnostic {
  level: 'ERROR' | 'WARNING';
  code: string;
  path: string;
  message: string;
  location?: SourceLocation;
  identity?: string;
}

export interface ChangeDiffEntry {
  kind: DiffKind;
  identity: string;
  operation: DiffOperation;
  declaredOperation?: DiffOperation;
  before?: unknown;
  after?: unknown;
  children?: ChangeDiffEntry[];
}

export interface ChangeDiffSummary {
  total: number;
  ADDED: number;
  MODIFIED: number;
  REMOVED: number;
}

export interface ChangeDiff {
  schemaVersion: '1';
  change: string;
  valid: boolean;
  formalFingerprint: string;
  changeFingerprint: string;
  summary: ChangeDiffSummary;
  entries: ChangeDiffEntry[];
  diagnostics: ChangeDiagnostic[];
}

export interface CreateSemanticDiffOptions {
  change?: string;
  valid: boolean;
  formalFingerprint: string;
  changeFingerprint: string;
  diagnostics: ChangeDiagnostic[];
  declaredOperations?: Array<{ entity: string; identity: string; operation: DiffOperation }>;
}

export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => `${JSON.stringify(key)}:${canonicalJson(nested)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function sortStrings(values: string[] | undefined): string[] | undefined {
  return values && [...new Set(values)].sort();
}

function sortByIdentity<T extends { identity: string }>(items: readonly T[]): T[] {
  return [...items].sort((left, right) => left.identity.localeCompare(right.identity));
}

/** Canonicalizes set-semantic collections while preserving Contract entry order. */
export function normalizeSemanticModel(model: SemanticModel): SemanticModel {
  return {
    elements: [...model.elements].sort((left, right) =>
      left.declaration.identity.localeCompare(right.declaration.identity)),
    elementKinds: sortByIdentity(model.elementKinds).map(kind => ({
      ...kind,
      ...(kind.parents ? { parents: sortStrings(kind.parents)! } : {}),
      ...(kind.children ? { children: sortStrings(kind.children)! } : {}),
    })),
    relationshipKinds: sortByIdentity(model.relationshipKinds).map(kind => ({
      ...kind,
      ...(kind.sourceKinds ? { sourceKinds: sortStrings(kind.sourceKinds)! } : {}),
      ...(kind.targetKinds ? { targetKinds: sortStrings(kind.targetKinds)! } : {}),
    })),
    relationships: [...model.relationships].sort((left, right) =>
      relationshipLabel(left).localeCompare(relationshipLabel(right))),
    views: sortByIdentity(model.views).map(view => ({
      ...view,
      ...(Array.isArray(view.include) ? { include: sortStrings(view.include)! } : {}),
      ...(view.exclude ? { exclude: sortStrings(view.exclude)! } : {}),
    })),
  };
}

export function semanticModelFingerprint(model: SemanticModel): string {
  return createHash('sha256').update(canonicalJson(normalizeSemanticModel(model))).digest('hex');
}

function equal(left: unknown, right: unknown): boolean {
  return canonicalJson(left) === canonicalJson(right);
}

function operation(before: unknown, after: unknown): DiffOperation | null {
  if (before === undefined && after !== undefined) return 'ADDED';
  if (before !== undefined && after === undefined) return 'REMOVED';
  return equal(before, after) ? null : 'MODIFIED';
}

function propertyEntries(identity: string, before: Record<string, unknown>, after: Record<string, unknown>): ChangeDiffEntry[] {
  const entries: ChangeDiffEntry[] = [];
  for (const key of [...new Set([...Object.keys(before), ...Object.keys(after)])].sort()) {
    const beforeValue = before[key];
    const afterValue = after[key];
    const change = operation(beforeValue, afterValue);
    if (!change) continue;
    entries.push({
      kind: 'property',
      identity: `${identity}.${key}`,
      operation: change,
      ...(beforeValue !== undefined ? { before: beforeValue } : {}),
      ...(afterValue !== undefined ? { after: afterValue } : {}),
    });
  }
  return entries;
}

function record(value: object): Record<string, unknown> {
  return value as Record<string, unknown>;
}

function declaredMap(operations: CreateSemanticDiffOptions['declaredOperations'] = []): Map<string, DiffOperation> {
  return new Map(operations.map(item => [`${item.entity}\u0000${item.identity}`, item.operation]));
}

function keyed<T>(items: readonly T[], identity: (item: T) => string): Map<string, T> {
  return new Map(items.map(item => [identity(item), item]));
}

function entityEntries<T extends object>(
  kind: DiffKind,
  before: Map<string, T>,
  after: Map<string, T>,
  declared: Map<string, DiffOperation>,
  detail = true,
): ChangeDiffEntry[] {
  const entries: ChangeDiffEntry[] = [];
  for (const identity of [...new Set([...before.keys(), ...after.keys()])].sort()) {
    const previous = before.get(identity);
    const next = after.get(identity);
    const change = operation(previous, next);
    if (!change) continue;
    const children = detail && previous && next ? propertyEntries(identity, record(previous), record(next)) : [];
    const declaredOperation = declared.get(`${kind}\u0000${identity}`);
    entries.push({
      kind,
      identity,
      operation: change,
      ...(declaredOperation ? { declaredOperation } : {}),
      ...(previous ? { before: previous } : {}),
      ...(next ? { after: next } : {}),
      ...(children.length ? { children } : {}),
    });
  }
  return entries;
}

interface Positioned<T> {
  value: T;
  index: number;
}

function requirementMap(elements: readonly ModelElement[]): Map<string, Positioned<Requirement>> {
  return new Map(elements.flatMap(element =>
    element.requirements.map((requirement, index) => [
      `${element.declaration.identity}#${requirement.name}`,
      { value: requirement, index },
    ] as const)));
}

function requirementEntries(
  before: Map<string, Positioned<Requirement>>,
  after: Map<string, Positioned<Requirement>>,
  declared: Map<string, DiffOperation>,
): ChangeDiffEntry[] {
  const entries: ChangeDiffEntry[] = [];
  for (const identity of [...new Set([...before.keys(), ...after.keys()])].sort()) {
    const previous = before.get(identity);
    const next = after.get(identity);
    const change = operation(previous, next);
    if (!change) continue;
    const children: ChangeDiffEntry[] = [];
    if (previous && next) {
      if (previous.index !== next.index) children.push({
        kind: 'property', identity: `${identity}.position`, operation: 'MODIFIED', before: previous.index, after: next.index,
      });
      if (previous.value.body !== next.value.body) children.push({
        kind: 'property', identity: `${identity}.body`, operation: 'MODIFIED', before: previous.value.body, after: next.value.body,
      });
      const beforeScenarios = keyed(previous.value.scenarios.map((value, index) => ({ value, index })), item => item.value.name);
      const afterScenarios = keyed(next.value.scenarios.map((value, index) => ({ value, index })), item => item.value.name);
      for (const name of [...new Set([...beforeScenarios.keys(), ...afterScenarios.keys()])].sort()) {
        const beforeScenario = beforeScenarios.get(name);
        const afterScenario = afterScenarios.get(name);
        const scenarioOperation = operation(beforeScenario, afterScenario);
        if (!scenarioOperation) continue;
        children.push({
          kind: 'scenario', identity: `${identity}#${name}`, operation: scenarioOperation,
          ...(beforeScenario ? { before: beforeScenario.value } : {}),
          ...(afterScenario ? { after: afterScenario.value } : {}),
        });
      }
    }
    const declaredOperation = declared.get(`requirement\u0000${identity}`);
    entries.push({
      kind: 'requirement', identity, operation: change,
      ...(declaredOperation ? { declaredOperation } : {}),
      ...(previous ? { before: previous.value } : {}), ...(next ? { after: next.value } : {}),
      ...(children.length ? { children } : {}),
    });
  }
  return entries;
}

function summary(entries: ChangeDiffEntry[]): ChangeDiffSummary {
  const result: ChangeDiffSummary = { total: entries.length, ADDED: 0, MODIFIED: 0, REMOVED: 0 };
  for (const entry of entries) result[entry.operation] += 1;
  return result;
}

function relationshipLabel(relationship: Relationship): string {
  return `${relationship.source}|${relationship.kind}|${relationship.target}`;
}

/** Diff two Semantic Models. Entries are keyed by entity type and identity only; partitions never appear. */
export function createSemanticDiff(
  base: SemanticModel,
  expected: SemanticModel,
  options: CreateSemanticDiffOptions,
): ChangeDiff {
  const declared = declaredMap(options.declaredOperations);
  const normalizedBase = normalizeSemanticModel(base);
  const normalizedExpected = normalizeSemanticModel(expected);
  const declarations = (model: SemanticModel) => keyed(model.elements.map(item => item.declaration), item => item.identity);
  const relationships = (model: SemanticModel) => keyed(model.relationships, relationshipLabel);
  const entries = [
    ...entityEntries('element-declaration', declarations(normalizedBase), declarations(normalizedExpected), declared),
    ...entityEntries('element-kind', keyed(normalizedBase.elementKinds, item => item.identity), keyed(normalizedExpected.elementKinds, item => item.identity), declared),
    ...entityEntries('relationship-kind', keyed(normalizedBase.relationshipKinds, item => item.identity), keyed(normalizedExpected.relationshipKinds, item => item.identity), declared),
    ...entityEntries('authored-view', keyed(normalizedBase.views, item => item.identity), keyed(normalizedExpected.views, item => item.identity), declared),
    ...entityEntries('relationship', relationships(normalizedBase), relationships(normalizedExpected), declared, false),
    ...requirementEntries(requirementMap(normalizedBase.elements), requirementMap(normalizedExpected.elements), declared),
  ].sort((left, right) => left.kind.localeCompare(right.kind) || left.identity.localeCompare(right.identity));

  return {
    schemaVersion: '1',
    change: options.change ?? '',
    valid: options.valid,
    formalFingerprint: options.formalFingerprint,
    changeFingerprint: options.changeFingerprint,
    summary: summary(entries),
    entries,
    diagnostics: options.diagnostics,
  };
}

