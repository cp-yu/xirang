export type EntityType =
  | 'element-declaration'
  | 'element-kind'
  | 'relationship-kind'
  | 'authored-view';

export type Partition = 'metamodel' | 'elements' | 'relationships' | 'views';

export const PARTITIONS: readonly Partition[] = ['elements', 'metamodel', 'relationships', 'views'];

export const ENTITY_TYPES: readonly EntityType[] = [
  'element-declaration',
  'element-kind',
  'relationship-kind',
  'authored-view',
];

/** Default partition for each entity type; organization convention only. */
export const DEFAULT_PARTITION: Record<EntityType, Partition> = {
  'element-declaration': 'elements',
  'element-kind': 'metamodel',
  'relationship-kind': 'metamodel',
  'authored-view': 'views',
};

export interface ElementDeclaration {
  identity: string;
  kind: string;
  parent: string | null;
  title: string;
  definition: string;
}

export interface Scenario {
  name: string;
  body: string;
}

export interface Requirement {
  name: string;
  body: string;
  scenarios: Scenario[];
}

/** Element = Declaration + Contract; the Contract is the `## Requirements` section alone. */
export interface ModelElement {
  declaration: ElementDeclaration;
  requirements: Requirement[];
}

export interface ElementKind {
  identity: string;
  contract: 'required' | 'optional';
  root?: boolean;
  parents?: string[];
  children?: string[];
  /** Semantics shared by every instance of the kind; empty when absent. */
  body: string;
}

export interface RelationshipKind {
  identity: string;
  sourceKinds?: string[];
  targetKinds?: string[];
  /** Semantics shared by every instance of the kind; empty when absent. */
  body: string;
}

/** identity is the entire content. */
export interface Relationship {
  source: string;
  kind: string;
  target: string;
}

export interface AuthoredView {
  identity: string;
  include: '*' | string[];
  of?: string;
  title?: string;
  autoLayout?: string;
}

export interface SemanticModel {
  elementKinds: ElementKind[];
  relationshipKinds: RelationshipKind[];
  elements: ModelElement[];
  relationships: Relationship[];
  views: AuthoredView[];
}

export interface ModelDiagnostic {
  level: 'ERROR' | 'WARNING';
  code: string;
  path: string;
  message: string;
  identity?: string;
}

export function emptySemanticModel(): SemanticModel {
  return { elementKinds: [], relationshipKinds: [], elements: [], relationships: [], views: [] };
}

export function relationshipIdentity(relationship: Relationship): string {
  return `${relationship.source}\u0000${relationship.kind}\u0000${relationship.target}`;
}
