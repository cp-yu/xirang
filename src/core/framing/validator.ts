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

function replaceByIdentity<T extends { identity: string }>(items: T[], target: T): void {
  const index = items.findIndex(item => item.identity === target.identity);
  if (index < 0) items.push(target);
  else items[index] = target;
}

function applyPayload(model: SemanticModel, payload: ChangeStructuralDefinitionPayload): SemanticModel {
  const target = structuredClone(model);

  for (const item of payload.elementKinds) {
    if (item.operation === 'REMOVED') {
      target.elementKinds = target.elementKinds.filter(kind => kind.identity !== item.identity);
    } else {
      replaceByIdentity(target.elementKinds, { ...item });
    }
  }
  for (const item of payload.relationshipKinds) {
    if (item.operation === 'REMOVED') {
      target.relationshipKinds = target.relationshipKinds.filter(kind => kind.identity !== item.identity);
    } else {
      replaceByIdentity(target.relationshipKinds, { ...item });
    }
  }
  for (const item of payload.elements) {
    if (item.operation === 'REMOVED') {
      target.elements = target.elements.filter(element => element.declaration.identity !== item.identity);
    } else {
      const existing = target.elements.find(element => element.declaration.identity === item.identity);
      const replacement = { declaration: { ...item }, requirements: existing?.requirements ?? [] };
      const index = target.elements.findIndex(element => element.declaration.identity === item.identity);
      if (index < 0) target.elements.push(replacement);
      else target.elements[index] = replacement;
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
  for (const item of payload.elements) {
    if (item.operation === 'REMOVED') continue;
    const existing = model.elements.find(element => element.declaration.identity === item.identity);
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
