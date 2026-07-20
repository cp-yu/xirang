import type { ProjectOpsxBundle } from '../../utils/opsx-utils.js';
import type { LikeC4Domain, LikeC4Relation, LikeC4RelationKind } from './types.js';

export function mapRelations(bundle: ProjectOpsxBundle, domains: LikeC4Domain[]): LikeC4Relation[] {
  const qualifiedById = new Map(
    domains.flatMap(domain => domain.capabilities.map(capability => [capability.id, capability.qualifiedId] as const))
  );

  return bundle.relations.flatMap(relation => {
    if (relation.type === 'belongs_to') return [];
    const source = qualifiedById.get(relation.from);
    const target = qualifiedById.get(relation.to);
    if (!source || !target) {
      throw new Error(`Cannot map relation endpoint: ${relation.from} -[${relation.type}]-> ${relation.to}`);
    }
    return [{
      source,
      target,
      kind: relation.type as LikeC4RelationKind,
      ...(relation.note ? { description: relation.note } : {}),
    }];
  });
}
