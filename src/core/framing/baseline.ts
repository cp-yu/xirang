import { canonicalJson } from '../semantic-diff.js';
import { compareUtf8Bytes } from '../candidate/canonical.js';
import { relationshipIdentity, type SemanticModel } from '../model/types.js';
import type { ChangeStructuralDefinitionPayload, RelevantSemanticModelBaseline } from './types.js';

function normalized(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalized);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key,
    ['parents', 'children', 'sourceKinds', 'targetKinds', 'include', 'exclude'].includes(key) && Array.isArray(item)
      ? [...item].sort(compareUtf8Bytes) : normalized(item),
  ]));
}

export function captureRelevantBaseline(
  model: SemanticModel | null,
  payload: ChangeStructuralDefinitionPayload,
): RelevantSemanticModelBaseline {
  if (!model) return { modelState: 'absent', objects: {} };
  const objects = new Map<string, unknown>();
  const elements = new Map(model.elements.map(item => [item.declaration.identity, item]));
  const kinds = new Map(model.elementKinds.map(item => [item.identity, item]));
  const relationKinds = new Map(model.relationshipKinds.map(item => [item.identity, item]));
  const views = new Map(model.views.map(item => [item.identity, item]));
  const pending = [...payload.relatedIdentities];
  const seen = new Set<string>();
  while (pending.length) {
    const identity = pending.pop()!;
    if (seen.has(identity)) continue;
    seen.add(identity);
    const element = elements.get(identity);
    const kind = kinds.get(identity);
    const relationKind = relationKinds.get(identity);
    const view = views.get(identity);
    if (!element && !kind && !relationKind && !view) objects.set(`identity:${identity}`, null);
    if (element) {
      objects.set(`element:${identity}`, element);
      pending.push(element.declaration.kind);
      if (element.declaration.parent) pending.push(element.declaration.parent);
    }
    if (kind) {
      objects.set(`element-kind:${identity}`, kind);
      pending.push(...(kind.parents ?? []), ...(kind.children ?? []));
    }
    if (relationKind) {
      objects.set(`relationship-kind:${identity}`, relationKind);
      pending.push(...(relationKind.sourceKinds ?? []), ...(relationKind.targetKinds ?? []));
    }
    if (view) objects.set(`view:${identity}`, view);
    for (const relation of model.relationships) {
      if (relation.source === identity || relation.target === identity || relation.kind === identity) {
        objects.set(`relationship:${relationshipIdentity(relation)}`, relation);
        pending.push(relation.source, relation.target, relation.kind);
      }
    }
  }
  return { modelState: 'present', objects: Object.fromEntries([...objects].sort(([a], [b]) => compareUtf8Bytes(a, b)).map(([key, value]) => [key, normalized(value)])) };
}

export interface BaselineDriftResult {
  status: 'fresh' | 'unrelated-drift' | 'relevant-drift';
  changed: string[];
  current: RelevantSemanticModelBaseline;
}

export function classifyBaselineDrift(
  savedFingerprint: string, currentFingerprint: string,
  saved: RelevantSemanticModelBaseline, model: SemanticModel | null,
  payload: ChangeStructuralDefinitionPayload,
): BaselineDriftResult {
  const current = captureRelevantBaseline(model, payload);
  const keys = [...new Set([...Object.keys(saved.objects), ...Object.keys(current.objects)])].sort(compareUtf8Bytes);
  const changed = keys.filter(key => canonicalJson(saved.objects[key]) !== canonicalJson(current.objects[key]));
  if (saved.modelState !== current.modelState) changed.unshift('model-state');
  return {
    status: changed.length ? 'relevant-drift' : savedFingerprint === currentFingerprint ? 'fresh' : 'unrelated-drift',
    changed, current,
  };
}
