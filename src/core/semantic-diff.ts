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

function requirementMap(elements: readonly ModelElement[]): Map<string, Requirement> {
  return new Map(elements.flatMap(element =>
    element.requirements.map(requirement => [`${element.declaration.identity}#${requirement.name}`, requirement] as const)));
}

function requirementEntries(
  before: Map<string, Requirement>,
  after: Map<string, Requirement>,
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
      if (previous.body !== next.body) children.push({
        kind: 'property', identity: `${identity}.body`, operation: 'MODIFIED', before: previous.body, after: next.body,
      });
      const beforeScenarios = keyed(previous.scenarios, item => item.name);
      const afterScenarios = keyed(next.scenarios, item => item.name);
      for (const name of [...new Set([...beforeScenarios.keys(), ...afterScenarios.keys()])].sort()) {
        const beforeScenario = beforeScenarios.get(name);
        const afterScenario = afterScenarios.get(name);
        const scenarioOperation = operation(beforeScenario, afterScenario);
        if (!scenarioOperation) continue;
        children.push({
          kind: 'scenario', identity: `${identity}#${name}`, operation: scenarioOperation,
          ...(beforeScenario ? { before: beforeScenario } : {}), ...(afterScenario ? { after: afterScenario } : {}),
        });
      }
    }
    const declaredOperation = declared.get(`requirement\u0000${identity}`);
    entries.push({
      kind: 'requirement', identity, operation: change,
      ...(declaredOperation ? { declaredOperation } : {}),
      ...(previous ? { before: previous } : {}), ...(next ? { after: next } : {}),
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
  const declarations = (model: SemanticModel) => keyed(model.elements.map(item => item.declaration), item => item.identity);
  const relationships = (model: SemanticModel) => keyed(model.relationships, relationshipLabel);
  const entries = [
    ...entityEntries('element-declaration', declarations(base), declarations(expected), declared),
    ...entityEntries('element-kind', keyed(base.elementKinds, item => item.identity), keyed(expected.elementKinds, item => item.identity), declared),
    ...entityEntries('relationship-kind', keyed(base.relationshipKinds, item => item.identity), keyed(expected.relationshipKinds, item => item.identity), declared),
    ...entityEntries('authored-view', keyed(base.views, item => item.identity), keyed(expected.views, item => item.identity), declared),
    ...entityEntries('relationship', relationships(base), relationships(expected), declared, false),
    ...requirementEntries(requirementMap(base.elements), requirementMap(expected.elements), declared),
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

