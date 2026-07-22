import type { ArchitectureIssue } from '../architecture-validator.js';
import type { LikeC4Architecture } from '../likec4-reader.js';

function containmentCycle(architecture: LikeC4Architecture): string[] | null {
  const parentById = new Map(architecture.elements.map(element => [element.id, element.parent]));
  for (const element of architecture.elements) {
    const path: string[] = [];
    const positions = new Map<string, number>();
    let current: string | null = element.id;
    while (current) {
      const position = positions.get(current);
      if (position !== undefined) return [...path.slice(position), current];
      positions.set(current, path.length);
      path.push(current);
      current = parentById.get(current) ?? null;
    }
  }
  return null;
}

export function validateSemanticModel(architecture: LikeC4Architecture): ArchitectureIssue[] {
  const issues: ArchitectureIssue[] = [];
  for (const [kind, definition] of Object.entries(architecture.metamodel.elements)) {
    if (definition.contractPolicy !== 'required' && definition.contractPolicy !== 'optional') {
      issues.push({
        code: 'MISSING_CONTRACT_POLICY',
        message: `Element kind ${kind} has no explicit contract policy`,
        element: kind,
      });
    }
  }
  const rootKinds = new Set(Object.entries(architecture.metamodel.elements)
    .filter(([, definition]) => definition.root)
    .map(([kind]) => kind));
  const roots = architecture.elements.filter(element => rootKinds.has(element.kind) && element.parent === null);
  for (const element of architecture.elements) {
    if (element.parent === null && !rootKinds.has(element.kind)) {
      issues.push({ code: 'MISSING_PARENT', message: `Non-root element ${element.id} has no parent`, element: element.id });
    }
    if (element.parent !== null && rootKinds.has(element.kind)) {
      issues.push({ code: 'INVALID_PROJECT_ROOT', message: `Project Root ${element.id} must not have a parent`, element: element.id });
    }
  }
  if (roots.length === 0) {
    issues.push({ code: 'MISSING_PROJECT_ROOT', message: 'OPSX Semantic Model has no Project Root' });
  } else if (roots.length > 1) {
    issues.push({
      code: 'MULTIPLE_PROJECT_ROOTS',
      message: `OPSX Semantic Model has multiple Project Roots: ${roots.map(root => root.id).join(', ')}`,
    });
  }

  const fqnsById = new Map<string, string[]>();
  for (const element of architecture.elements) {
    const metadataId = element.metadata.elementId;
    if (typeof metadataId !== 'string' || metadataId.trim() === '') {
      issues.push({ code: 'MISSING_ELEMENT_ID', message: `Element ${element.fqn} missing elementId`, element: element.fqn });
    } else {
      const fqns = fqnsById.get(metadataId) ?? [];
      fqns.push(element.fqn);
      fqnsById.set(metadataId, fqns);
    }
    if (element.summary.trim() === '') {
      issues.push({ code: 'MISSING_ELEMENT_SUMMARY', message: `Element ${element.id} missing summary`, element: element.id });
    }
  }
  for (const [id, fqns] of fqnsById) {
    if (fqns.length > 1) {
      issues.push({ code: 'DUPLICATE_ELEMENT_ID', message: `Duplicate elementId ${id}: ${fqns.join(', ')}`, element: id });
    }
  }

  const cycle = containmentCycle(architecture);
  if (cycle) {
    issues.push({ code: 'CONTAINMENT_CYCLE', message: `Containment cycle detected: ${cycle.join(' → ')}`, element: cycle[0] });
  }

  const byId = new Map(architecture.elements.map(element => [element.id, element]));
  for (const element of architecture.elements) {
    if (element.parent === null) continue;
    const parent = byId.get(element.parent);
    if (!parent) {
      issues.push({ code: 'MISSING_PARENT', message: `Element ${element.id} references missing parent ${element.parent}`, element: element.id });
      continue;
    }
    const parentDefinition = architecture.metamodel.elements[parent.kind];
    const childDefinition = architecture.metamodel.elements[element.kind];
    if (parentDefinition?.children && !parentDefinition.children.includes(element.kind)
      || childDefinition?.parents && !childDefinition.parents.includes(parent.kind)) {
      issues.push({
        code: 'INVALID_CONTAINMENT',
        message: `Invalid containment: ${parent.id} (${parent.kind}) → ${element.id} (${element.kind})`,
        element: element.id,
      });
    }
  }

  for (const relation of architecture.relations) {
    const source = byId.get(relation.source);
    const target = byId.get(relation.target);
    if (!source || !target) {
      issues.push({
        code: 'INVALID_RELATION_ENDPOINT',
        message: `Relation ${relation.source} -[${relation.kind}]-> ${relation.target} has an unresolved endpoint`,
      });
      continue;
    }
    const definition = architecture.metamodel.relationships[relation.kind];
    if (definition?.sourceKinds && !definition.sourceKinds.includes(source.kind)
      || definition?.targetKinds && !definition.targetKinds.includes(target.kind)) {
      issues.push({
        code: 'INVALID_RELATION_ENDPOINT',
        message: `Invalid ${relation.kind} endpoints: ${source.id} (${source.kind}) → ${target.id} (${target.kind})`,
        element: source.id,
      });
    }
  }
  return issues;
}
