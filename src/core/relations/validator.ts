import { getRelationDefinition, RELATION_TYPES, type RelationType } from './registry.js';
import type { ProjectOpsxBundle } from '../../utils/opsx-utils.js';

export interface RelationValidationResult {
  valid: boolean;
  errors: string[];
  diagnostics: string[];
}

type NodeKind = 'capability' | 'domain';

export function validateRelationGraph(bundle: ProjectOpsxBundle): RelationValidationResult {
  const errors: string[] = [];
  const diagnostics: string[] = [];
  const nodeKinds = new Map<string, NodeKind>();
  const ownershipCounts = new Map(bundle.capabilities.map(({ id }) => [id, 0]));
  const seen = new Set<string>();

  for (const { id } of bundle.domains) nodeKinds.set(id, 'domain');
  for (const { id } of bundle.capabilities) nodeKinds.set(id, 'capability');

  for (const relation of bundle.relations) {
    const key = `${relation.from}|${relation.type}|${relation.to}`;
    if (seen.has(key)) errors.push(`Duplicate relation: ${relation.from} -[${relation.type}]-> ${relation.to}`);
    seen.add(key);

    const fromKind = nodeKinds.get(relation.from);
    const toKind = nodeKinds.get(relation.to);
    if (!fromKind) errors.push(`Relation references non-existent 'from' node: ${relation.from}`);
    if (!toKind) errors.push(`Relation references non-existent 'to' node: ${relation.to}`);

    const definition = getRelationDefinition(relation.type);
    if (fromKind && !definition.fromKinds.includes(fromKind)) {
      errors.push(`${relation.type} relation '${relation.from}' -> '${relation.to}' requires ${definition.direction}; found ${fromKind} -> ${toKind ?? 'missing'}`);
    }
    if (toKind && !definition.toKinds.includes(toKind)) {
      errors.push(`${relation.type} relation '${relation.from}' -> '${relation.to}' requires ${definition.direction}; found ${fromKind ?? 'missing'} -> ${toKind}`);
    }
    if (relation.from === relation.to) {
      errors.push(`Self-loop relation: ${relation.from} -[${relation.type}]-> ${relation.to}`);
    }
    if (relation.type === 'belongs_to' && fromKind === 'capability') {
      ownershipCounts.set(relation.from, (ownershipCounts.get(relation.from) ?? 0) + 1);
    }
  }

  for (const [capabilityId, count] of ownershipCounts) {
    if (count !== 1) errors.push(`capability '${capabilityId}' has ${count} belongs_to relations; expected exactly 1`);
  }

  for (const type of RELATION_TYPES) {
    if (type === 'belongs_to') continue;
    const cycle = findCycle(bundle, type);
    if (!cycle) continue;
    const message = `${type} cycle: ${cycle.join(' -> ')}`;
    if (type === 'precedes') errors.push(message);
    else diagnostics.push(message);
  }

  return { valid: errors.length === 0, errors, diagnostics };
}

function findCycle(bundle: ProjectOpsxBundle, type: Exclude<RelationType, 'belongs_to'>): string[] | null {
  const edges = new Map<string, string[]>();
  for (const relation of bundle.relations) {
    if (relation.type !== type) continue;
    const targets = edges.get(relation.from) ?? [];
    targets.push(relation.to);
    edges.set(relation.from, targets);
  }

  const visited = new Set<string>();
  const active = new Set<string>();
  const path: string[] = [];

  const visit = (node: string): string[] | null => {
    if (active.has(node)) {
      const start = path.indexOf(node);
      return [...path.slice(start), node];
    }
    if (visited.has(node)) return null;

    visited.add(node);
    active.add(node);
    path.push(node);
    for (const target of edges.get(node) ?? []) {
      const cycle = visit(target);
      if (cycle) return cycle;
    }
    path.pop();
    active.delete(node);
    return null;
  };

  for (const node of edges.keys()) {
    const cycle = visit(node);
    if (cycle) return cycle;
  }
  return null;
}
