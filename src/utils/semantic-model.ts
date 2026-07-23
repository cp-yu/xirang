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

export interface SemanticRelationship {
  source: string;
  kind: string;
  target: string;
  description?: string;
}

export interface SemanticScenario {
  title: string;
  body: string;
}

export interface SemanticRequirement {
  title: string;
  body: string;
  scenarios: SemanticScenario[];
}

export interface SemanticContract {
  specId: string;
  elementId: string;
  requirements: SemanticRequirement[];
}

export interface SemanticArchitectureModel {
  languageVersion: string | null;
  metamodel: SemanticMetamodel;
  elements: SemanticElement[];
  relations: SemanticRelationship[];
}

export interface TargetSemanticModel {
  architecture: SemanticArchitectureModel;
  contracts: SemanticContract[];
}
