import type { ArchitectureIssue } from '../architecture-validator.js';
import type { LikeC4Architecture } from '../likec4-reader.js';

const PERSISTED_CONTAINMENT_RELATIONS = new Set(['belongs_to', 'refines', 'abstracts']);

function precedesCycle(architecture: LikeC4Architecture): ArchitectureIssue | undefined {
  const edges = new Map<string, string[]>();
  for (const relation of architecture.relations) {
    if (relation.kind !== 'precedes') continue;
    edges.set(relation.source, [...(edges.get(relation.source) ?? []), relation.target]);
  }

  const visited = new Set<string>();
  const active = new Set<string>();
  const stack: string[] = [];
  const visit = (node: string): string[] | undefined => {
    if (active.has(node)) return [...stack.slice(stack.indexOf(node)), node];
    if (visited.has(node)) return undefined;
    visited.add(node);
    active.add(node);
    stack.push(node);
    for (const target of edges.get(node) ?? []) {
      const cycle = visit(target);
      if (cycle) return cycle;
    }
    stack.pop();
    active.delete(node);
    return undefined;
  };

  for (const node of edges.keys()) {
    const cycle = visit(node);
    if (cycle) {
      return {
        code: cycle.length === 2 ? 'PRECEDES_SELF_LOOP' : 'PRECEDES_CYCLE',
        message: `${cycle.length === 2 ? 'Precedes self-loop detected' : 'Precedes cycle detected'}: ${cycle.join(' → ')}`,
        element: cycle[0],
      };
    }
  }
  return undefined;
}

export function validateSemanticRelations(architecture: LikeC4Architecture): ArchitectureIssue[] {
  const issues: ArchitectureIssue[] = [];
  const seen = new Set<string>();

  for (const relation of architecture.relations) {
    const key = `${relation.source}\u0000${relation.kind}\u0000${relation.target}`;
    if (seen.has(key)) {
      issues.push({
        code: 'DUPLICATE_RELATION',
        message: `Duplicate relation: ${relation.source} -[${relation.kind}]-> ${relation.target}`,
        element: relation.source,
      });
    } else {
      seen.add(key);
    }

    if (relation.source === relation.target) {
      issues.push({
        code: 'RELATION_SELF_LOOP',
        message: `Relation self-loop detected: ${relation.source} -[${relation.kind}]-> ${relation.target}`,
        element: relation.source,
      });
    }

    if (PERSISTED_CONTAINMENT_RELATIONS.has(relation.kind)) {
      issues.push({
        code: 'PERSISTED_CONTAINMENT_RELATION',
        message: `Persisted ${relation.kind} relation is forbidden; containment is represented by nesting: ${relation.source} -> ${relation.target}`,
        element: relation.source,
      });
    }
  }

  const cycle = precedesCycle(architecture);
  if (cycle) issues.push(cycle);
  return issues;
}
