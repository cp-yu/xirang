export interface FramingEntry {
  identity: string;
  nature: 'normative' | 'informative';
  content: string;
}

export interface ChangeStructuralDefinitionPayload {
  schemaVersion: 2;
  context: 'build' | 'change';
  relatedIdentities: string[];
  entries: FramingEntry[];
}

export interface RelevantSemanticModelBaseline {
  modelState: 'absent' | 'present';
  objects: Record<string, unknown>;
}

export interface ChangeStructuralDefinitionMetadata {
  entity: 'confirmed-design-record';
  explorationId: string;
  slug: string;
  semanticModelFingerprint: string;
}

export interface ChangeStructuralDefinitionDocument {
  metadata: ChangeStructuralDefinitionMetadata;
  payload: ChangeStructuralDefinitionPayload;
  baseline: RelevantSemanticModelBaseline;
}

export interface FramingPayloadDiff {
  added: FramingEntry[];
  modified: Array<{ identity: string; before: FramingEntry; after: FramingEntry }>;
  removed: FramingEntry[];
}
