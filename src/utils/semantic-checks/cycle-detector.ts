import type { LikeC4Architecture } from '../likec4-reader.js';
import type { ArchitectureIssue } from '../architecture-validator.js';

export function detectPrecedesCycles(architecture: LikeC4Architecture): ArchitectureIssue[] {
  const edges = new Map<string, string[]>();
  for (const relation of architecture.relations.filter(relation => relation.kind === 'precedes')) {
    edges.set(relation.source, [...(edges.get(relation.source) ?? []), relation.target]);
  }
  const visited = new Set<string>();
  const active = new Set<string>();
  const stack: string[] = [];
  const visit = (node: string): string[] | null => {
    if (active.has(node)) return [...stack.slice(stack.indexOf(node)), node];
    if (visited.has(node)) return null;
    visited.add(node); active.add(node); stack.push(node);
    for (const target of edges.get(node) ?? []) {
      const cycle = visit(target);
      if (cycle) return cycle;
    }
    stack.pop(); active.delete(node);
    return null;
  };
  for (const node of edges.keys()) {
    const cycle = visit(node);
    if (cycle) return [{
      code: cycle.length === 2 ? 'PRECEDES_SELF_LOOP' : 'PRECEDES_CYCLE',
      message: `${cycle.length === 2 ? 'Precedes self-loop detected' : 'Precedes cycle detected'}: ${cycle.join(' → ')}`,
      element: node,
    }];
  }
  return [];
}
