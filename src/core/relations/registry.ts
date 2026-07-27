export type RelationType =
  | 'belongs_to'
  | 'invokes'
  | 'consumes'
  | 'precedes'
  | 'constrains'
  | 'validates';
export type RelationEndpointKind = 'capability' | 'domain';

export interface RelationDefinition {
  type: RelationType;
  fromKinds: readonly RelationEndpointKind[];
  toKinds: readonly RelationEndpointKind[];
  direction: string;
  meaning: string;
  useWhen: string;
  doNotUseWhen: string;
  propagationHint: string;
  notePolicy: {
    allowed: boolean;
    maxLength: number;
  };
  example: {
    from: string;
    type: RelationType;
    to: string;
    note?: string;
  };
}
