import { PERSPECTIVE_KIND } from '../templates/model-skeleton.js';
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

function warning(code: string, message: string, identity?: string): ModelDiagnostic {
  return { level: 'WARNING', code, path: '', message, ...(identity ? { identity } : {}) };
}

function checkManagedPerspectiveKind(model: SemanticModel, diagnostics: ModelDiagnostic[]): void {
  const declared = model.elementKinds.find(kind => kind.identity === PERSPECTIVE_KIND.identity);
  if (!declared) {
    if (!model.elements.some(element => element.declaration.kind === PERSPECTIVE_KIND.identity)) {
      diagnostics.push(warning(
        'MISSING_BUILTIN_PERSPECTIVE_KIND',
        'Legacy Semantic Model is missing managed Element Kind perspective; run setup/update to add it',
        PERSPECTIVE_KIND.identity,
      ));
    }
    return;
  }
  if (JSON.stringify(declared) !== JSON.stringify(PERSPECTIVE_KIND)) {
    diagnostics.push(error(
      'CONFLICTING_BUILTIN_PERSPECTIVE_KIND',
      'Element Kind perspective conflicts with the managed built-in definition',
      PERSPECTIVE_KIND.identity,
    ));
  }
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

  for (const view of model.views) {
    if (view.identity === 'model') {
      diagnostics.push(error(
        'RESERVED_VIEW_IDENTITY',
        'Authored View identity model is reserved for the default Model View',
        view.identity,
      ));
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
  const completed = new Set<string>();
  for (const start of parents.keys()) {
    if (completed.has(start)) continue;
    const seen = new Map<string, number>();
    const trail: string[] = [];
    let current: string | null = start;
    while (current !== null && parents.has(current) && !completed.has(current)) {
      const position = seen.get(current);
      if (position !== undefined) return [...trail.slice(position), current];
      seen.set(current, trail.length);
      trail.push(current);
      current = parents.get(current) ?? null;
    }
    for (const identity of trail) completed.add(identity);
  }
  return null;
}

function checkKindReferences(model: SemanticModel, kinds: Map<string, ElementKind>, diagnostics: ModelDiagnostic[]): void {
  for (const element of model.elements) {
    const { identity, kind } = element.declaration;
    if (!kinds.has(kind)) {
      diagnostics.push(error('UNDECLARED_ELEMENT_KIND', `Element ${identity} references undeclared Element Kind ${kind}`, identity));
    }
  }

  const constraints: Array<[string, string, string[] | undefined]> = [
    ...model.elementKinds.flatMap(kind => [
      [kind.identity, 'parents', kind.parents],
      [kind.identity, 'children', kind.children],
    ] as Array<[string, string, string[] | undefined]>),
    ...model.relationshipKinds.flatMap(kind => [
      [kind.identity, 'sourceKinds', kind.sourceKinds],
      [kind.identity, 'targetKinds', kind.targetKinds],
    ] as Array<[string, string, string[] | undefined]>),
  ];
  for (const [owner, field, references] of constraints) {
    for (const reference of references ?? []) {
      if (!kinds.has(reference)) {
        diagnostics.push(error(
          'UNRESOLVED_KIND_REFERENCE',
          `Kind ${owner} ${field} references undeclared Element Kind ${reference}`,
          owner,
        ));
      }
    }
  }
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
    const definition = relationshipKinds.get(relationship.kind);
    if (!definition) {
      diagnostics.push(error(
        'UNDECLARED_RELATIONSHIP_KIND',
        `Relationship ${label} references undeclared Relationship Kind ${relationship.kind}`,
        relationship.source,
      ));
    }
    if (source === undefined || target === undefined) {
      diagnostics.push(error('INVALID_RELATION_ENDPOINT', `Relation ${label} has an unresolved endpoint`, relationship.source));
      continue;
    }
    if (definition?.sourceKinds && !definition.sourceKinds.includes(source)
      || definition?.targetKinds && !definition.targetKinds.includes(target)) {
      diagnostics.push(error('INVALID_RELATION_ENDPOINT', `Invalid ${relationship.kind} endpoints: ${relationship.source} (${source}) → ${relationship.target} (${target})`, relationship.source));
    }
  }
}

function checkContracts(model: SemanticModel, diagnostics: ModelDiagnostic[]): void {
  for (const element of model.elements) {
    const elementIdentity = element.declaration.identity;
    const requirementNames = new Set<string>();
    for (const requirement of element.requirements) {
      if (requirementNames.has(requirement.name)) {
        diagnostics.push(error(
          'DUPLICATE_REQUIREMENT_NAME',
          `Element ${elementIdentity} has duplicate Requirement name ${requirement.name}`,
          elementIdentity,
        ));
      }
      requirementNames.add(requirement.name);

      if (requirement.scenarios.length === 0) {
        diagnostics.push(error(
          'MISSING_REQUIREMENT_SCENARIO',
          `Requirement ${elementIdentity}#${requirement.name} has no Scenario`,
          elementIdentity,
        ));
      }
      const scenarioNames = new Set<string>();
      for (const scenario of requirement.scenarios) {
        if (scenarioNames.has(scenario.name)) {
          diagnostics.push(error(
            'DUPLICATE_SCENARIO_NAME',
            `Requirement ${elementIdentity}#${requirement.name} has duplicate Scenario name ${scenario.name}`,
            elementIdentity,
          ));
        }
        scenarioNames.add(scenario.name);
      }
    }
  }
}

function checkViews(model: SemanticModel, diagnostics: ModelDiagnostic[]): void {
  const elements = new Set(model.elements.map(element => element.declaration.identity));
  for (const view of model.views) {
    const references = [
      ...(view.of === undefined ? [] : [view.of]),
      ...(view.include === '*' ? [] : view.include),
    ];
    for (const reference of references) {
      if (!elements.has(reference)) {
        diagnostics.push(error(
          'UNRESOLVED_VIEW_REFERENCE',
          `Authored View ${view.identity} references undeclared Element ${reference}`,
          view.identity,
        ));
      }
    }
  }
}

export function validateSemanticModel(model: SemanticModel): ModelDiagnostic[] {
  const diagnostics: ModelDiagnostic[] = [];
  const kinds = new Map(model.elementKinds.map(item => [item.identity, item]));

  checkManagedPerspectiveKind(model, diagnostics);
  checkIdentities(model, diagnostics);
  checkKindReferences(model, kinds, diagnostics);
  checkHierarchy(model, kinds, diagnostics);
  checkRelationships(model, diagnostics);
  checkContracts(model, diagnostics);
  checkViews(model, diagnostics);

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
