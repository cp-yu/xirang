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

export type NodeShape = 'rectangle' | 'person' | 'browser' | 'mobile' | 'cylinder' | 'storage' | 'queue' | 'bucket' | 'document' | 'component';

export const NODE_SHAPE_VALUES: readonly NodeShape[] = ['rectangle', 'person', 'browser', 'mobile', 'cylinder', 'storage', 'queue', 'bucket', 'document', 'component'];

export type NodeColor = 'amber' | 'blue' | 'gray' | 'slate' | 'green' | 'indigo' | 'muted' | 'primary' | 'red' | 'secondary' | 'sky';

export const NODE_COLOR_VALUES: readonly NodeColor[] = ['amber', 'blue', 'gray', 'slate', 'green', 'indigo', 'muted', 'primary', 'red', 'secondary', 'sky'];

export type NodeBorder = 'solid' | 'dashed' | 'dotted' | 'none';

export const NODE_BORDER_VALUES: readonly NodeBorder[] = ['solid', 'dashed', 'dotted', 'none'];

export type RelationshipColor = 'amber' | 'blue' | 'gray' | 'green' | 'indigo' | 'muted' | 'primary' | 'red' | 'secondary' | 'sky' | 'slate';

export const RELATIONSHIP_COLOR_VALUES: readonly RelationshipColor[] = ['amber', 'blue', 'gray', 'green', 'indigo', 'muted', 'primary', 'red', 'secondary', 'sky', 'slate'];

export type RelationshipLine = 'solid' | 'dashed' | 'dotted';

export const RELATIONSHIP_LINE_VALUES: readonly RelationshipLine[] = ['solid', 'dashed', 'dotted'];

export type RelationshipArrow = 'none' | 'normal' | 'onormal' | 'dot' | 'odot' | 'diamond' | 'odiamond' | 'crow' | 'open' | 'vee';

export const RELATIONSHIP_ARROW_VALUES: readonly RelationshipArrow[] = ['none', 'normal', 'onormal', 'dot', 'odot', 'diamond', 'odiamond', 'crow', 'open', 'vee'];

export interface RelationshipPresentation {
  color?: RelationshipColor;
  line?: RelationshipLine;
  head?: RelationshipArrow;
  tail?: RelationshipArrow;
}

export interface NodePresentation {
  shape?: NodeShape;
  color?: NodeColor;
  border?: NodeBorder;
}

export interface ElementKind {
  identity: string;
  contract: 'required' | 'optional';
  root?: boolean;
  parents?: string[];
  children?: string[];
  nodePresentation?: NodePresentation;
  /** Semantics shared by every instance of the kind; empty when absent. */
  body: string;
}

export interface RelationshipKind {
  identity: string;
  sourceKinds?: string[];
  targetKinds?: string[];
  presentation?: RelationshipPresentation;
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
  exclude?: string[];
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
  /** Entity scope of `identity`; set where the generating context knows it, so storage lookups are entity-qualified. */
  entity?: DiagnosticEntity;
}

/** Diagnostic identities resolve within their entity type; requirement entries resolve to their host Element. */
export type DiagnosticEntity = EntityType | 'requirement' | 'relationship';

export function emptySemanticModel(): SemanticModel {
  return { elementKinds: [], relationshipKinds: [], elements: [], relationships: [], views: [] };
}

export function relationshipIdentity(relationship: Relationship): string {
  return `${relationship.source}\u0000${relationship.kind}\u0000${relationship.target}`;
}
