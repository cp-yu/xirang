import type { NodeBorder, NodeColor, NodeShape } from '../model/types.js';

export type RemovalOperation = 'REMOVED';

export interface NodePresentationTarget {
  shape?: NodeShape;
  color?: NodeColor;
  border?: NodeBorder;
}

export interface ElementKindTarget {
  operation?: never;
  identity: string;
  contract: 'required' | 'optional';
  root?: boolean;
  parents?: string[];
  children?: string[];
  nodePresentation?: NodePresentationTarget;
  body: string;
}

export interface RemovedElementKindTarget {
  operation: RemovalOperation;
  identity: string;
}

export interface RelationshipKindTarget {
  operation?: never;
  identity: string;
  sourceKinds?: string[];
  targetKinds?: string[];
  body: string;
}

export interface RemovedRelationshipKindTarget {
  operation: RemovalOperation;
  identity: string;
}

export interface ElementTarget {
  operation?: never;
  identity: string;
  kind: string;
  parent: string | null;
  title: string;
  definition: string;
}

export interface RemovedElementTarget {
  operation: RemovalOperation;
  identity: string;
}

export interface RelationshipTarget {
  operation?: never;
  source: string;
  kind: string;
  target: string;
}

export interface RemovedRelationshipTarget {
  operation: RemovalOperation;
  source: string;
  kind: string;
  target: string;
}

export interface ChangeStructuralDefinitionPayload {
  informativeHierarchyPreview?: string;
  elementKinds: Array<ElementKindTarget | RemovedElementKindTarget>;
  relationshipKinds: Array<RelationshipKindTarget | RemovedRelationshipKindTarget>;
  elements: Array<ElementTarget | RemovedElementTarget>;
  relationships: Array<RelationshipTarget | RemovedRelationshipTarget>;
}

export interface BaselineValue<T> {
  exists: boolean;
  value?: T;
}

export interface BaselineElementKind extends BaselineValue<ElementKindTarget> {
  identity: string;
}

export interface BaselineRelationshipKind extends BaselineValue<RelationshipKindTarget> {
  identity: string;
}

export interface BaselineElement extends BaselineValue<ElementTarget> {
  identity: string;
}

export interface BaselineRelationship extends BaselineValue<RelationshipTarget> {
  source: string;
  kind: string;
  target: string;
}

export interface RelevantSemanticModelBaseline {
  elementKinds: BaselineElementKind[];
  relationshipKinds: BaselineRelationshipKind[];
  elements: BaselineElement[];
  relationships: BaselineRelationship[];
}

export interface ChangeStructuralDefinitionMetadata {
  entity: 'change-structural-definition';
  explorationId: string;
  slug: string;
  semanticModelFingerprint: string;
}

export interface ChangeStructuralDefinitionDocument {
  metadata: ChangeStructuralDefinitionMetadata;
  payload: ChangeStructuralDefinitionPayload;
  baseline: RelevantSemanticModelBaseline;
}
