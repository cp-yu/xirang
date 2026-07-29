import { compareUtf8Bytes } from '../candidate/canonical.js';
import { relationshipIdentity, type ElementKind, type RelationshipKind, type SemanticModel } from '../model/types.js';
import type {
  ChangeStructuralDefinitionPayload,
  ElementKindTarget,
  ElementTarget,
  RelevantSemanticModelBaseline,
  RelationshipKindTarget,
  RelationshipTarget,
} from './types.js';

function elementKindTarget(kind: ElementKind): ElementKindTarget {
  return {
    identity: kind.identity,
    contract: kind.contract,
    ...(kind.root === undefined ? {} : { root: kind.root }),
    ...(kind.parents === undefined ? {} : { parents: sorted(kind.parents) }),
    ...(kind.children === undefined ? {} : { children: sorted(kind.children) }),
    body: kind.body,
  };
}

function relationshipKindTarget(kind: RelationshipKind): RelationshipKindTarget {
  return {
    identity: kind.identity,
    ...(kind.sourceKinds === undefined ? {} : { sourceKinds: sorted(kind.sourceKinds) }),
    ...(kind.targetKinds === undefined ? {} : { targetKinds: sorted(kind.targetKinds) }),
    body: kind.body,
  };
}

function elementTarget(model: SemanticModel, identity: string): ElementTarget | undefined {
  const element = model.elements.find(item => item.declaration.identity === identity);
  return element ? { ...element.declaration } : undefined;
}

function relationshipTarget(model: SemanticModel, key: string): RelationshipTarget | undefined {
  const relationship = model.relationships.find(item => relationshipIdentity(item) === key);
  return relationship ? { ...relationship } : undefined;
}

function sorted(values: Iterable<string>): string[] {
  return [...values].sort(compareUtf8Bytes);
}

export function captureRelevantBaseline(
  model: SemanticModel,
  payload: ChangeStructuralDefinitionPayload,
): RelevantSemanticModelBaseline {
  const elementsById = new Map(model.elements.map(item => [item.declaration.identity, item]));
  const elementKindsById = new Map(model.elementKinds.map(item => [item.identity, item]));
  const relationshipKindsById = new Map(model.relationshipKinds.map(item => [item.identity, item]));
  const elementIds = new Set<string>();
  const elementKindIds = new Set<string>();
  const relationshipKindIds = new Set<string>();

  for (const target of payload.elementKinds) {
    elementKindIds.add(target.identity);
    if (target.operation !== 'REMOVED') {
      for (const reference of [...(target.parents ?? []), ...(target.children ?? [])]) elementKindIds.add(reference);
    }
  }
  for (const target of payload.relationshipKinds) {
    relationshipKindIds.add(target.identity);
    if (target.operation !== 'REMOVED') {
      for (const reference of [...(target.sourceKinds ?? []), ...(target.targetKinds ?? [])]) elementKindIds.add(reference);
    }
  }
  for (const target of payload.elements) {
    elementIds.add(target.identity);
    if (target.operation !== 'REMOVED') {
      elementKindIds.add(target.kind);
      if (target.parent !== null) elementIds.add(target.parent);
    }
  }
  for (const target of payload.relationships) {
    elementIds.add(target.source);
    elementIds.add(target.target);
    relationshipKindIds.add(target.kind);
  }

  const pendingElements = [...elementIds];
  while (pendingElements.length > 0) {
    const identity = pendingElements.pop()!;
    const element = elementsById.get(identity);
    if (!element) continue;
    elementKindIds.add(element.declaration.kind);
    const parent = element.declaration.parent;
    if (parent !== null && !elementIds.has(parent)) {
      elementIds.add(parent);
      pendingElements.push(parent);
    }
  }

  const pendingKinds = [...elementKindIds];
  while (pendingKinds.length > 0) {
    const identity = pendingKinds.pop()!;
    const kind = elementKindsById.get(identity);
    if (!kind) continue;
    for (const reference of [...(kind.parents ?? []), ...(kind.children ?? [])]) {
      if (!elementKindIds.has(reference)) {
        elementKindIds.add(reference);
        pendingKinds.push(reference);
      }
    }
  }
  for (const identity of relationshipKindIds) {
    const kind = relationshipKindsById.get(identity);
    for (const reference of [...(kind?.sourceKinds ?? []), ...(kind?.targetKinds ?? [])]) elementKindIds.add(reference);
  }
  const relationshipConstraintKinds = [...elementKindIds];
  while (relationshipConstraintKinds.length > 0) {
    const kind = elementKindsById.get(relationshipConstraintKinds.pop()!);
    for (const reference of [...(kind?.parents ?? []), ...(kind?.children ?? [])]) {
      if (!elementKindIds.has(reference)) {
        elementKindIds.add(reference);
        relationshipConstraintKinds.push(reference);
      }
    }
  }

  return {
    elementKinds: sorted(elementKindIds).map(identity => {
      const value = elementKindsById.get(identity);
      return value
        ? { identity, exists: true, value: elementKindTarget(value) }
        : { identity, exists: false };
    }),
    relationshipKinds: sorted(relationshipKindIds).map(identity => {
      const value = relationshipKindsById.get(identity);
      return value
        ? { identity, exists: true, value: relationshipKindTarget(value) }
        : { identity, exists: false };
    }),
    elements: sorted(elementIds).map(identity => {
      const value = elementTarget(model, identity);
      return value ? { identity, exists: true, value } : { identity, exists: false };
    }),
    relationships: [...payload.relationships]
      .map(target => ({ source: target.source, kind: target.kind, target: target.target }))
      .sort((left, right) => compareUtf8Bytes(relationshipIdentity(left), relationshipIdentity(right)))
      .map(target => {
        const value = relationshipTarget(model, relationshipIdentity(target));
        return value ? { ...target, exists: true, value } : { ...target, exists: false };
      }),
  };
}

function normalizeSavedElementKind(value: ElementKindTarget): ElementKindTarget {
  return {
    ...value,
    ...(value.parents === undefined ? {} : { parents: sorted(value.parents) }),
    ...(value.children === undefined ? {} : { children: sorted(value.children) }),
  };
}

function normalizeSavedRelationshipKind(value: RelationshipKindTarget): RelationshipKindTarget {
  return {
    ...value,
    ...(value.sourceKinds === undefined ? {} : { sourceKinds: sorted(value.sourceKinds) }),
    ...(value.targetKinds === undefined ? {} : { targetKinds: sorted(value.targetKinds) }),
  };
}

function baselineEntries(baseline: RelevantSemanticModelBaseline): Map<string, string> {
  const entries = new Map<string, string>();
  for (const item of baseline.elementKinds) entries.set(`element-kind:${item.identity}`, JSON.stringify(
    item.exists ? { ...item, value: normalizeSavedElementKind(item.value!) } : item,
  ));
  for (const item of baseline.relationshipKinds) entries.set(`relationship-kind:${item.identity}`, JSON.stringify(
    item.exists ? { ...item, value: normalizeSavedRelationshipKind(item.value!) } : item,
  ));
  for (const item of baseline.elements) entries.set(`element:${item.identity}`, JSON.stringify(item));
  for (const item of baseline.relationships) {
    entries.set(`relationship:${item.source}|${item.kind}|${item.target}`, JSON.stringify(item));
  }
  return entries;
}

export interface BaselineDriftResult {
  status: 'fresh' | 'unrelated-drift' | 'relevant-drift';
  changed: string[];
  current: RelevantSemanticModelBaseline;
}

export function classifyBaselineDrift(
  savedFingerprint: string,
  currentFingerprint: string,
  saved: RelevantSemanticModelBaseline,
  currentModel: SemanticModel,
  payload: ChangeStructuralDefinitionPayload,
): BaselineDriftResult {
  if (savedFingerprint === currentFingerprint) return { status: 'fresh', changed: [], current: saved };
  const current = captureRelevantBaseline(currentModel, payload);
  const previousEntries = baselineEntries(saved);
  const currentEntries = baselineEntries(current);
  const keys = sorted(new Set([...previousEntries.keys(), ...currentEntries.keys()]));
  const changed = keys.filter(key => previousEntries.get(key) !== currentEntries.get(key));
  return { status: changed.length === 0 ? 'unrelated-drift' : 'relevant-drift', changed, current };
}
