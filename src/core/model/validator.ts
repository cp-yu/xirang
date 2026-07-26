import {
  relationshipIdentity,
  type ElementKind,
  type ModelDiagnostic,
  type SemanticModel,
} from './types.js';

const IDENTITY = /^[A-Za-z0-9._-]+$/;

function error(code: string, message: string, identity?: string): ModelDiagnostic {
  return { level: 'ERROR', code, path: '', message, ...(identity ? { identity } : {}) };
}

function checkIdentities(model: SemanticModel, diagnostics: ModelDiagnostic[]): void {
  const identities: Array<[string, string]> = [
    ...model.elements.map(item => ['element', item.declaration.identity] as [string, string]),
    ...model.elementKinds.map(item => ['element kind', item.identity] as [string, string]),
    ...model.relationshipKinds.map(item => ['relationship kind', item.identity] as [string, string]),
    ...model.views.map(item => ['authored view', item.identity] as [string, string]),
  ];
  for (const [label, identity] of identities) {
    if (!IDENTITY.test(identity)) {
      diagnostics.push(error('INVALID_IDENTITY', `Invalid ${label} identity: ${identity}`, identity));
    }
  }

  for (const [label, items] of [
    ['element', model.elements.map(item => item.declaration.identity)],
    ['authored view', model.views.map(item => item.identity)],
  ] as const) {
    const seen = new Set<string>();
    for (const identity of items) {
      if (seen.has(identity)) diagnostics.push(error('DUPLICATE_IDENTITY', `Duplicate ${label} identity: ${identity}`, identity));
      seen.add(identity);
    }
  }

  const kinds = new Set<string>();
  for (const identity of [...model.elementKinds, ...model.relationshipKinds].map(item => item.identity)) {
    if (kinds.has(identity)) {
      diagnostics.push(error('DUPLICATE_KIND_IDENTITY', `Duplicate kind identity in Metamodel: ${identity}`, identity));
    }
    kinds.add(identity);
  }
}

function containmentCycle(parents: Map<string, string | null>): string[] | null {
  for (const start of parents.keys()) {
    const seen = new Map<string, number>();
    const trail: string[] = [];
    let current: string | null = start;
    while (current !== null && parents.has(current)) {
      const position = seen.get(current);
      if (position !== undefined) return [...trail.slice(position), current];
      seen.set(current, trail.length);
      trail.push(current);
      current = parents.get(current) ?? null;
    }
  }
  return null;
}

function checkHierarchy(model: SemanticModel, kinds: Map<string, ElementKind>, diagnostics: ModelDiagnostic[]): void {
  const declarations = model.elements.map(item => item.declaration);
  const byIdentity = new Map(declarations.map(item => [item.identity, item]));
  const roots: string[] = [];

  for (const declaration of declarations) {
    const isRootKind = kinds.get(declaration.kind)?.root === true;
    if (isRootKind && declaration.parent === null) roots.push(declaration.identity);
    if (isRootKind && declaration.parent !== null) {
      diagnostics.push(error('INVALID_PROJECT_ROOT', `Project Root ${declaration.identity} must not have a parent`, declaration.identity));
    }
    if (!isRootKind && declaration.parent === null) {
      diagnostics.push(error('MISSING_PARENT', `Non-root element ${declaration.identity} has no parent`, declaration.identity));
    }
  }

  if (roots.length === 0) diagnostics.push(error('MISSING_PROJECT_ROOT', 'Semantic Model has no Project Root'));
  else if (roots.length > 1) {
    diagnostics.push(error('MULTIPLE_PROJECT_ROOTS', `Semantic Model has multiple Project Roots: ${roots.join(', ')}`));
  }

  const cycle = containmentCycle(new Map(declarations.map(item => [item.identity, item.parent])));
  if (cycle) diagnostics.push(error('CONTAINMENT_CYCLE', `Containment cycle detected: ${cycle.join(' → ')}`, cycle[0]));

  for (const declaration of declarations) {
    if (declaration.parent === null) continue;
    const parent = byIdentity.get(declaration.parent);
    if (!parent) {
      diagnostics.push(error('MISSING_PARENT', `Element ${declaration.identity} references missing parent ${declaration.parent}`, declaration.identity));
      continue;
    }
    const parentKind = kinds.get(parent.kind);
    const childKind = kinds.get(declaration.kind);
    if (parentKind?.children && !parentKind.children.includes(declaration.kind)
      || childKind?.parents && !childKind.parents.includes(parent.kind)) {
      diagnostics.push(error(
        'INVALID_CONTAINMENT',
        `Invalid containment: ${parent.identity} (${parent.kind}) → ${declaration.identity} (${declaration.kind})`,
        declaration.identity,
      ));
    }
  }
}

function checkRelationships(model: SemanticModel, diagnostics: ModelDiagnostic[]): void {
  const kindOf = new Map(model.elements.map(item => [item.declaration.identity, item.declaration.kind]));
  const relationshipKinds = new Map(model.relationshipKinds.map(item => [item.identity, item]));
  const seen = new Set<string>();

  for (const relationship of model.relationships) {
    const label = `${relationship.source} -[${relationship.kind}]-> ${relationship.target}`;
    const key = relationshipIdentity(relationship);
    if (seen.has(key)) diagnostics.push(error('DUPLICATE_RELATION', `Duplicate relation: ${label}`, relationship.source));
    seen.add(key);

    const source = kindOf.get(relationship.source);
    const target = kindOf.get(relationship.target);
    if (source === undefined || target === undefined) {
      diagnostics.push(error('INVALID_RELATION_ENDPOINT', `Relation ${label} has an unresolved endpoint`, relationship.source));
      continue;
    }
    const definition = relationshipKinds.get(relationship.kind);
    if (definition?.sourceKinds && !definition.sourceKinds.includes(source)
      || definition?.targetKinds && !definition.targetKinds.includes(target)) {
      diagnostics.push(error('INVALID_RELATION_ENDPOINT', `Invalid ${relationship.kind} endpoints: ${relationship.source} (${source}) → ${relationship.target} (${target})`, relationship.source));
    }
  }
}

export function validateSemanticModel(model: SemanticModel): ModelDiagnostic[] {
  const diagnostics: ModelDiagnostic[] = [];
  const kinds = new Map(model.elementKinds.map(item => [item.identity, item]));

  checkIdentities(model, diagnostics);
  checkHierarchy(model, kinds, diagnostics);
  checkRelationships(model, diagnostics);

  for (const element of model.elements) {
    if (kinds.get(element.declaration.kind)?.contract === 'required' && element.requirements.length === 0) {
      diagnostics.push(error(
        'MISSING_REQUIRED_CONTRACT',
        `Element ${element.declaration.identity} (${element.declaration.kind}) requires at least one Requirement`,
        element.declaration.identity,
      ));
    }
  }
  return diagnostics;
}
