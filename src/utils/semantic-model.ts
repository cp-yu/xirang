export type ContractPolicy = 'required' | 'optional';

export interface SemanticElementKind {
  root?: boolean;
  contractPolicy?: ContractPolicy;
  parents?: string[];
  children?: string[];
}

export interface SemanticRelationshipKind {
  sourceKinds?: string[];
  targetKinds?: string[];
}

export interface SemanticMetamodel {
  elements: Record<string, SemanticElementKind>;
  relationships: Record<string, SemanticRelationshipKind>;
}

export interface SemanticElement {
  id: string;
  fqn: string;
  kind: string;
  title: string;
  summary: string;
  parent: string | null;
  children: string[];
  metadata: Record<string, string | string[]>;
}
