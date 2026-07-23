import type {
  SemanticContract,
  SemanticElement,
  SemanticRelationship,
  TargetSemanticModel,
} from '../utils/semantic-model.js';
import type {
  ArchitectureDeltaOperation,
  ArchitectureReplacementHint,
  SourceLocation,
} from './architecture-delta-parser.js';

export type DiffOperation = 'ADDED' | 'MODIFIED' | 'REMOVED';
export type DiffScope = 'specs' | 'architecture';
export type DiffKind = 'requirement' | 'scenario' | 'element' | 'relationship' | 'elementKind' | 'relationshipKind' | 'property';

export interface ChangeDiagnostic {
  level: 'ERROR' | 'WARNING';
  code: string;
  path: string;
  message: string;
  location?: SourceLocation;
  identity?: string;
}

export interface ChangeDiffEntry {
  scope: DiffScope;
  kind: DiffKind;
  identity: string;
  operation: DiffOperation;
  declaredOperation?: DiffOperation;
  before?: unknown;
  after?: unknown;
  children?: ChangeDiffEntry[];
  replacement?: { from?: string; with?: string };
}

export interface ChangeDiffSummary {
  total: number;
  specs: Record<DiffOperation, number>;
  architecture: Record<DiffOperation, number>;
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
  declaredOperations?: ArchitectureDeltaOperation[];
  replacements?: ArchitectureReplacementHint[];
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => `${JSON.stringify(key)}:${canonical(nested)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function equal(left: unknown, right: unknown): boolean {
  return canonical(left) === canonical(right);
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
      scope: 'architecture',
      kind: 'property',
      identity: `${identity}.${key}`,
      operation: change,
      ...(beforeValue !== undefined ? { before: beforeValue } : {}),
      ...(afterValue !== undefined ? { after: afterValue } : {}),
    });
  }
  return entries;
}

function elementProperties(element: SemanticElement): Record<string, unknown> {
  const properties: Record<string, unknown> = {
    kind: element.kind,
    parent: element.parent,
    title: element.title,
    summary: element.summary,
  };
  for (const [key, value] of Object.entries(element.metadata)) properties[`metadata.${key}`] = value;
  return properties;
}

function relationIdentity(relation: SemanticRelationship): string {
  return `${relation.source}|${relation.kind}|${relation.target}`;
}

function declaredMap(operations: ArchitectureDeltaOperation[] = []): Map<string, DiffOperation> {
  return new Map(operations.map(item => [`${item.entity}:${item.identity}`, item.operation]));
}

function architectureEntries(
  formal: TargetSemanticModel,
  target: TargetSemanticModel,
  declared: Map<string, DiffOperation>,
  replacements: ArchitectureReplacementHint[],
): ChangeDiffEntry[] {
  const entries: ChangeDiffEntry[] = [];
  const replacementFrom = new Map(replacements.map(item => [item.from, item.to]));
  const replacementTo = new Map(replacements.map(item => [item.to, item.from]));
  const beforeElements = new Map(formal.architecture.elements.map(item => [item.id, item]));
  const afterElements = new Map(target.architecture.elements.map(item => [item.id, item]));

  for (const identity of [...new Set([...beforeElements.keys(), ...afterElements.keys()])].sort()) {
    const before = beforeElements.get(identity);
    const after = afterElements.get(identity);
    const change = operation(before, after);
    if (!change) continue;
    const children = before && after ? propertyEntries(identity, elementProperties(before), elementProperties(after)) : [];
    entries.push({
      scope: 'architecture',
      kind: 'element',
      identity,
      operation: change,
      ...(declared.get(`element:${identity}`) ? { declaredOperation: declared.get(`element:${identity}`) } : {}),
      ...(before ? { before } : {}),
      ...(after ? { after } : {}),
      ...(children.length ? { children } : {}),
      ...(replacementFrom.has(identity) ? { replacement: { with: replacementFrom.get(identity)! } } : {}),
      ...(replacementTo.has(identity) ? { replacement: { from: replacementTo.get(identity)! } } : {}),
    });
  }

  const beforeRelations = new Map(formal.architecture.relations.map(item => [relationIdentity(item), item]));
  const afterRelations = new Map(target.architecture.relations.map(item => [relationIdentity(item), item]));
  for (const identity of [...new Set([...beforeRelations.keys(), ...afterRelations.keys()])].sort()) {
    const before = beforeRelations.get(identity);
    const after = afterRelations.get(identity);
    const change = operation(before, after);
    if (!change) continue;
    entries.push({
      scope: 'architecture', kind: 'relationship', identity, operation: change,
      ...(declared.get(`relationship:${identity}`) ? { declaredOperation: declared.get(`relationship:${identity}`) } : {}),
      ...(before ? { before } : {}), ...(after ? { after } : {}),
    });
  }

  for (const [kind, entity] of [['elementKind', 'elements'], ['relationshipKind', 'relationships']] as const) {
    const beforeKinds = formal.architecture.metamodel[entity];
    const afterKinds = target.architecture.metamodel[entity];
    for (const identity of [...new Set([...Object.keys(beforeKinds), ...Object.keys(afterKinds)])].sort()) {
      const before = beforeKinds[identity];
      const after = afterKinds[identity];
      const change = operation(before, after);
      if (!change) continue;
      const children = before && after
        ? propertyEntries(`${kind}.${identity}`, before as Record<string, unknown>, after as Record<string, unknown>)
            .map(item => ({ ...item, identity: item.identity, kind: 'property' as const }))
        : [];
      entries.push({
        scope: 'architecture', kind, identity, operation: change,
        ...(declared.get(`${kind}:${identity}`) ? { declaredOperation: declared.get(`${kind}:${identity}`) } : {}),
        ...(before ? { before } : {}), ...(after ? { after } : {}),
        ...(children.length ? { children } : {}),
      });
    }
  }
  return entries;
}

function contractEntries(formal: SemanticContract[], target: SemanticContract[]): ChangeDiffEntry[] {
  const entries: ChangeDiffEntry[] = [];
  const beforeRequirements = new Map(formal.flatMap(spec => spec.requirements.map(requirement => [`${spec.specId}#${requirement.title}`, requirement] as const)));
  const afterRequirements = new Map(target.flatMap(spec => spec.requirements.map(requirement => [`${spec.specId}#${requirement.title}`, requirement] as const)));

  for (const identity of [...new Set([...beforeRequirements.keys(), ...afterRequirements.keys()])].sort()) {
    const before = beforeRequirements.get(identity);
    const after = afterRequirements.get(identity);
    const change = operation(before, after);
    if (!change) continue;
    const children: ChangeDiffEntry[] = [];
    if (before && after) {
      if (before.body !== after.body) children.push({
        scope: 'specs', kind: 'property', identity: `${identity}.body`, operation: 'MODIFIED', before: before.body, after: after.body,
      });
      const beforeScenarios = new Map(before.scenarios.map(item => [item.title, item]));
      const afterScenarios = new Map(after.scenarios.map(item => [item.title, item]));
      for (const title of [...new Set([...beforeScenarios.keys(), ...afterScenarios.keys()])].sort()) {
        const beforeScenario = beforeScenarios.get(title);
        const afterScenario = afterScenarios.get(title);
        const scenarioOperation = operation(beforeScenario, afterScenario);
        if (!scenarioOperation) continue;
        children.push({
          scope: 'specs', kind: 'scenario', identity: `${identity}#${title}`, operation: scenarioOperation,
          ...(beforeScenario ? { before: beforeScenario } : {}), ...(afterScenario ? { after: afterScenario } : {}),
        });
      }
    }
    entries.push({
      scope: 'specs', kind: 'requirement', identity, operation: change,
      ...(before ? { before } : {}), ...(after ? { after } : {}),
      ...(children.length ? { children } : {}),
    });
  }
  return entries;
}

function summary(entries: ChangeDiffEntry[]): ChangeDiffSummary {
  const empty = (): Record<DiffOperation, number> => ({ ADDED: 0, MODIFIED: 0, REMOVED: 0 });
  const result: ChangeDiffSummary = { total: entries.length, specs: empty(), architecture: empty() };
  for (const entry of entries) result[entry.scope][entry.operation] += 1;
  return result;
}

export function createSemanticDiff(
  formal: TargetSemanticModel,
  target: TargetSemanticModel,
  options: CreateSemanticDiffOptions,
): ChangeDiff {
  const entries = [
    ...contractEntries(formal.contracts, target.contracts),
    ...architectureEntries(formal, target, declaredMap(options.declaredOperations), options.replacements ?? []),
  ].sort((left, right) => left.scope.localeCompare(right.scope) || left.kind.localeCompare(right.kind) || left.identity.localeCompare(right.identity));
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
