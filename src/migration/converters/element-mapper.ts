import type { ProjectOpsxBundle } from '../../utils/opsx-utils.js';
import type { LikeC4Capability, LikeC4Domain } from './types.js';

const LIKEC4_RESERVED_IDS = new Set([
  'global', 'metadata', 'migration', 'opsx', 'project', 'projection', 'view',
]);

export function toElementId(id: string): string {
  const elementId = id.split('.').at(-1)!.replaceAll('-', '_');
  return LIKEC4_RESERVED_IDS.has(elementId) ? `${elementId}_element` : elementId;
}

function toTitle(id: string): string {
  return toElementId(id).split('_').filter(Boolean).map(part => part[0]!.toUpperCase() + part.slice(1)).join(' ');
}

export function mapDomains(bundle: ProjectOpsxBundle): LikeC4Domain[] {
  const ownerByCapability = new Map(
    bundle.relations
      .filter(relation => relation.type === 'belongs_to')
      .map(relation => [relation.from, relation.to])
  );

  return bundle.domains.map(domain => {
    const elementId = toElementId(domain.id);
    const capabilities: LikeC4Capability[] = bundle.capabilities
      .filter(capability => ownerByCapability.get(capability.id) === domain.id)
      .map(capability => ({
        id: capability.id,
        elementId: toElementId(capability.id),
        qualifiedId: `${elementId}.${toElementId(capability.id)}`,
        title: toTitle(capability.id),
        ...(capability.intent ? { description: capability.intent } : {}),
        metadata: {
          capabilityId: capability.id,
          ...(capability.status ? { status: capability.status } : {}),
        },
      }));

    return {
      id: domain.id,
      elementId,
      title: toTitle(domain.id),
      ...(domain.intent ? { description: domain.intent } : {}),
      metadata: {
        ...(domain.boundary ? { boundary: domain.boundary } : {}),
        ...(domain.status ? { status: domain.status } : {}),
      },
      capabilities,
    };
  });
}
