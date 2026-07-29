import { validateSemanticModel } from '../model/validator.js';
import { relationshipIdentity, type ModelDiagnostic, type SemanticModel } from '../model/types.js';
import type { ChangeStructuralDefinitionPayload } from './types.js';

export interface FramingImpact {
  code: 'REQUIRED_CONTRACT' | 'AFFECTED_CONTRACT' | 'AUTHORED_VIEW_REFERENCE';
  identity: string;
  message: string;
}

export interface StructuralValidationResult {
  valid: boolean;
  diagnostics: ModelDiagnostic[];
  impacts: FramingImpact[];
  targetModel: SemanticModel;
}

interface Removal {
  operation: 'REMOVED';
  identity: string;
}

function isRemoval<T extends { identity: string }>(value: T | Removal): value is Removal {
  return 'operation' in value && value.operation === 'REMOVED';
}

function mergeByIdentity<T extends { identity: string }>(
  existing: T[],
  updates: ReadonlyArray<T | Removal>,
): T[] {
  const updatesById = new Map(updates.map(item => [item.identity, item]));
  const replaced = new Set<string>();
  const merged: T[] = [];
  for (const item of existing) {
    const update = updatesById.get(item.identity);
    if (!update) merged.push(item);
    else if (!isRemoval(update) && !replaced.has(item.identity)) {
      merged.push({ ...update });
      replaced.add(item.identity);
    } else if (!isRemoval(update)) {
      merged.push(item);
    }
  }
  for (const update of updates) {
    if (!isRemoval(update) && !replaced.has(update.identity)) merged.push({ ...update });
  }
  return merged;
}

function applyPayload(model: SemanticModel, payload: ChangeStructuralDefinitionPayload): SemanticModel {
  const target = structuredClone(model);
  target.elementKinds = mergeByIdentity(target.elementKinds, payload.elementKinds);
  target.relationshipKinds = mergeByIdentity(target.relationshipKinds, payload.relationshipKinds);

  const elementUpdates = new Map(payload.elements.map(item => [item.identity, item]));
  const replacedElements = new Set<string>();
  target.elements = target.elements.flatMap(element => {
    const identity = element.declaration.identity;
    const update = elementUpdates.get(identity);
    if (!update) return [element];
    if (update.operation === 'REMOVED') return [];
    if (replacedElements.has(identity)) return [element];
    replacedElements.add(identity);
    return [{ declaration: { ...update }, requirements: element.requirements }];
  });
  for (const update of payload.elements) {
    if (update.operation !== 'REMOVED' && !replacedElements.has(update.identity)) {
      target.elements.push({ declaration: { ...update }, requirements: [] });
    }
  }
  const relationships = new Map(target.relationships.map(item => [relationshipIdentity(item), item]));
  for (const item of payload.relationships) {
    const value = { source: item.source, kind: item.kind, target: item.target };
    const key = relationshipIdentity(value);
    if (item.operation === 'REMOVED') relationships.delete(key);
    else relationships.set(key, value);
  }
  target.relationships = [...relationships.values()];
  return target;
}

function viewReferences(model: SemanticModel, targets: Set<string>): FramingImpact[] {
  const impacts: FramingImpact[] = [];
  for (const view of model.views) {
    const references = [...(view.of === undefined ? [] : [view.of]), ...(view.include === '*' ? [] : view.include)];
    if (references.some(reference => targets.has(reference))) {
      impacts.push({
        code: 'AUTHORED_VIEW_REFERENCE',
        identity: view.identity,
        message: `Authored View ${view.identity} references a structurally changed Element`,
      });
    }
  }
  return impacts;
}

function dedupeImpacts(impacts: FramingImpact[]): FramingImpact[] {
  const seen = new Set<string>();
  return impacts.filter(impact => {
    const key = `${impact.code}\u0000${impact.identity}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function validateStructuralDefinition(
  model: SemanticModel,
  payload: ChangeStructuralDefinitionPayload,
): StructuralValidationResult {
  const targetModel = applyPayload(model, payload);
  const allDiagnostics = validateSemanticModel(targetModel);
  const impacts: FramingImpact[] = [];
  const diagnostics: ModelDiagnostic[] = [];

  for (const diagnostic of allDiagnostics) {
    if (diagnostic.code === 'MISSING_REQUIRED_CONTRACT') {
      impacts.push({
        code: 'REQUIRED_CONTRACT',
        identity: diagnostic.identity ?? '',
        message: diagnostic.message,
      });
    } else if (diagnostic.code === 'UNRESOLVED_VIEW_REFERENCE') {
      impacts.push({
        code: 'AUTHORED_VIEW_REFERENCE',
        identity: diagnostic.identity ?? '',
        message: diagnostic.message,
      });
    } else {
      diagnostics.push(diagnostic);
    }
  }

  const changedElements = new Set(payload.elements.map(item => item.identity));
  const sourceElements = new Map<string, SemanticModel['elements'][number]>();
  for (const element of model.elements) {
    if (!sourceElements.has(element.declaration.identity)) sourceElements.set(element.declaration.identity, element);
  }
  for (const item of payload.elements) {
    if (item.operation === 'REMOVED') continue;
    const existing = sourceElements.get(item.identity);
    if (existing && existing.requirements.length > 0) {
      impacts.push({
        code: 'AFFECTED_CONTRACT',
        identity: item.identity,
        message: `Element ${item.identity} has an existing Contract that must be reviewed against the structural change`,
      });
    }
  }
  impacts.push(...viewReferences(model, changedElements));

  return {
    valid: diagnostics.length === 0,
    diagnostics,
    impacts: dedupeImpacts(impacts),
    targetModel,
  };
}
