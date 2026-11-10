export interface RecordEntry {
  identity: string;
  nature: 'normative' | 'informative';
  decision: 'pending' | 'accepted' | 'excluded';
  content: string;
}

export interface RecordElement {
  identity: string;
  kind?: string;
  parent?: string | null;
  title?: string;
  definition?: string;
  removed?: true;
}

export interface RecordRelationship {
  source: string;
  kind: string;
  target: string;
  removed?: true;
}

export interface RecordElementKind {
  identity: string;
  contract?: 'required' | 'optional';
  contractFormat?: 'business-specification';
  root?: boolean;
  parents?: string[];
  children?: string[];
  removed?: true;
}

export interface RecordRelationshipKind {
  identity: string;
  sourceKinds?: string[];
  targetKinds?: string[];
  removed?: true;
}

export interface RecordStructure {
  elements: RecordElement[];
  relationships: RecordRelationship[];
  elementKinds: RecordElementKind[];
  relationshipKinds: RecordRelationshipKind[];
}

export interface DesignRecordPayload {
  schemaVersion: 4;
  context: 'build' | 'change';
  relatedIdentities: string[];
  entries: RecordEntry[];
  structure: RecordStructure;
}

/** Create input; omitted parts normalize to empty. */
export type DesignRecordInput = Omit<DesignRecordPayload, 'relatedIdentities' | 'entries' | 'structure'>
  & Partial<Pick<DesignRecordPayload, 'relatedIdentities' | 'entries'>>
  & { structure?: Partial<RecordStructure> };

export type StructureRef =
  | { element: string }
  | { relationship: { source: string; kind: string; target: string } }
  | { elementKind: string }
  | { relationshipKind: string };

export interface RecordPatch {
  entries?: { upsert?: RecordEntry[]; remove?: string[] };
  structure?: {
    upsert?: {
      elements?: Array<RecordElement & { clear?: string[] }>;
      relationships?: RecordRelationship[];
      elementKinds?: Array<RecordElementKind & { clear?: string[] }>;
      relationshipKinds?: Array<RecordRelationshipKind & { clear?: string[] }>;
    };
    withdraw?: {
      elements?: string[];
      relationships?: Array<{ source: string; kind: string; target: string }>;
      elementKinds?: string[];
      relationshipKinds?: string[];
    };
  };
  relatedIdentities?: { add?: string[]; remove?: string[] };
}

export interface RelevantSemanticModelBaseline {
  modelState: 'absent' | 'present';
  objects: Record<string, unknown>;
}

export interface DesignRecordMetadata {
  entity: 'confirmed-design-record';
  explorationId?: string;
  slug?: string;
  semanticModelFingerprint: string;
}

export interface DesignRecordDocument {
  metadata: DesignRecordMetadata;
  payload: DesignRecordPayload;
  baseline: RelevantSemanticModelBaseline;
}

export interface EntriesDiff {
  added: RecordEntry[];
  modified: Array<{ identity: string; before: RecordEntry; after: RecordEntry }>;
  removed: RecordEntry[];
}

export interface StructureDiff {
  added: Array<{ ref: StructureRef; after: object }>;
  modified: Array<{
    ref: StructureRef;
    changedFields: Array<{ field: string; before: unknown; after: unknown }>;
    addedFields: Array<{ field: string; after: unknown }>;
    clearedFields: Array<{ field: string; before: unknown }>;
  }>;
  withdrawn: Array<{ ref: StructureRef; before: object }>;
}

export interface RecordPayloadDiff {
  entries: EntriesDiff;
  structure: StructureDiff;
}

export interface DerivedStructureObject {
  ref: StructureRef;
  status: 'added' | 'modified' | 'removed' | 'unchanged';
  fields?: Array<{ field: string; record: unknown; model: unknown }>;
}

export interface RecordSummary {
  entries: number;
  normativeEntries: number;
  decisions: Record<RecordEntry['decision'], number>;
  elements: number;
  relationships: number;
  elementKinds: number;
  relationshipKinds: number;
}

export interface RecordStructureDiagnostic {
  severity: 'ERROR';
  code: string;
  message: string;
  identity: string;
  field: string;
}
