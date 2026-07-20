import type { ProjectOpsxBundle } from '../../utils/opsx-utils.js';
import type { RelationType } from '../../core/relations/registry.js';

export type LikeC4RelationKind = Exclude<RelationType, 'belongs_to'>;

export interface LikeC4Capability {
  id: string;
  elementId: string;
  qualifiedId: string;
  title: string;
  description?: string;
  metadata: { capabilityId: string; status?: string; specs?: string[] };
}

export interface LikeC4Domain {
  id: string;
  elementId: string;
  title: string;
  description?: string;
  metadata: { boundary?: string; status?: string };
  capabilities: LikeC4Capability[];
}

export interface LikeC4Relation {
  source: string;
  target: string;
  kind: LikeC4RelationKind;
  description?: string;
}

export interface LikeC4Model {
  project: ProjectOpsxBundle['project'];
  domains: LikeC4Domain[];
  relations: LikeC4Relation[];
}
