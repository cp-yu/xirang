import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { renderScalar, splitFrontmatter } from '../model/frontmatter.js';
import { validateExplorationId, validateRecordSlug } from './paths.js';
import type { DesignRecordDocument, DesignRecordMetadata, DesignRecordPayload, RecordEntry, RecordStructure, RelevantSemanticModelBaseline } from './types.js';

const BASELINE_OPEN = '<!-- XIRANG:SEMANTIC_MODEL_BASELINE';
const BASELINE_CLOSE = '-->';
const IDENTITY = /^[A-Za-z0-9._-]+$/;

export class RecordDocumentError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = 'RecordDocumentError';
  }
}

export function fail(code: string, message: string): never {
  throw new RecordDocumentError(code, message);
}

export function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('MALFORMED_DOCUMENT', `${label} must be a mapping`);
  return value as Record<string, unknown>;
}

export function exactKeys(value: Record<string, unknown>, allowed: readonly string[], label: string): void {
  const extras = Object.keys(value).filter(key => !allowed.includes(key));
  if (extras.length) fail('INVALID_PAYLOAD', `${label} contains unknown fields: ${extras.join(', ')}`);
}

function text(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim()) fail('INVALID_PAYLOAD', `${label} must be a non-empty string`);
  return value;
}

export function identity(value: unknown, label: string): string {
  const result = text(value, label);
  if (!IDENTITY.test(result)) fail('INVALID_PAYLOAD', `${label} has invalid identity syntax`);
  return result;
}

function unique(values: string[], label: string): void {
  if (new Set(values).size !== values.length) fail('DUPLICATE_IDENTITY', `${label} contains duplicate identities`);
}

type StructureKey = keyof RecordStructure;

export const STRUCTURE_KEYS: readonly StructureKey[] = ['elements', 'relationships', 'elementKinds', 'relationshipKinds'];

/** Declared fields per structure type, in canonical order; identity fields first. */
export const STRUCTURE_FIELDS: Record<StructureKey, readonly string[]> = {
  elements: ['identity', 'kind', 'parent', 'title', 'definition'],
  relationships: ['source', 'kind', 'target'],
  elementKinds: ['identity', 'contract', 'contractFormat', 'root', 'parents', 'children'],
  relationshipKinds: ['identity', 'sourceKinds', 'targetKinds'],
};

export const STRUCTURE_KEY_FIELDS: Record<StructureKey, readonly string[]> = {
  elements: ['identity'], relationships: ['source', 'kind', 'target'], elementKinds: ['identity'], relationshipKinds: ['identity'],
};

function identityList(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) fail('INVALID_PAYLOAD', `${label} must be an array`);
  const result = value.map(item => identity(item, label));
  unique(result, label);
  return result;
}

function structureField(type: StructureKey, field: string, value: unknown, label: string): unknown {
  switch (field) {
    case 'title': case 'definition': return text(value, label);
    case 'parent': return value === null ? null : identity(value, label);
    case 'contract':
      if (value !== 'required' && value !== 'optional') fail('INVALID_PAYLOAD', `${label} must be required or optional`);
      return value;
    case 'contractFormat':
      if (value !== 'business-specification') fail('INVALID_PAYLOAD', `${label} must be business-specification`);
      return value;
    case 'root':
      if (typeof value !== 'boolean') fail('INVALID_PAYLOAD', `${label} must be a boolean`);
      return value;
    case 'parents': case 'children': case 'sourceKinds': case 'targetKinds': return identityList(value, label);
    default: return identity(value, `${type}.${field}`);
  }
}

export function structureKey(type: StructureKey, item: Record<string, unknown>): string {
  return STRUCTURE_KEY_FIELDS[type].map(field => item[field]).join('\u0000');
}

export function normalizeStructureItem(type: StructureKey, raw: unknown, extraKeys: readonly string[] = []): Record<string, unknown> {
  const item = record(raw, type);
  exactKeys(item, [...STRUCTURE_FIELDS[type], 'removed', ...extraKeys], type);
  if ('removed' in item && item.removed !== true) fail('INVALID_PAYLOAD', `${type}.removed must be true when present`);
  const result: Record<string, unknown> = {};
  for (const field of STRUCTURE_FIELDS[type]) {
    const required = STRUCTURE_KEY_FIELDS[type].includes(field);
    if (!(field in item)) {
      if (required) fail('INVALID_PAYLOAD', `${type}.${field} is required`);
      continue;
    }
    result[field] = structureField(type, field, item[field], `${type}.${field}`);
  }
  if (item.removed === true) {
    const extra = Object.keys(result).filter(field => !STRUCTURE_KEY_FIELDS[type].includes(field));
    if (extra.length) fail('INVALID_PAYLOAD', `Removed ${type} must declare only its identity: ${extra.join(', ')}`);
    result.removed = true;
  }
  for (const key of extraKeys) if (key in item) result[key] = item[key];
  return result;
}

export function normalizeRecordStructure(value: unknown): RecordStructure {
  const data = value === undefined ? {} : record(value, 'structure');
  exactKeys(data, STRUCTURE_KEYS, 'structure');
  const result = {} as Record<StructureKey, Record<string, unknown>[]>;
  for (const type of STRUCTURE_KEYS) {
    const items = data[type] === undefined ? [] : data[type];
    if (!Array.isArray(items)) fail('INVALID_PAYLOAD', `structure.${type} must be an array`);
    result[type] = items.map(item => normalizeStructureItem(type, item));
    unique(result[type].map(item => structureKey(type, item)), `structure.${type}`);
  }
  return result as unknown as RecordStructure;
}

export function normalizeRecordPayload(value: unknown): DesignRecordPayload {
  const data = record(value, 'payload');
  if (data.schemaVersion !== 4) fail('UNSUPPORTED_RECORD_VERSION', 'Unsupported record format; only schemaVersion 4 design records are supported and older records are not migrated');
  exactKeys(data, ['schemaVersion', 'context', 'relatedIdentities', 'entries', 'structure'], 'payload');
  if (data.context !== 'build' && data.context !== 'change') fail('INVALID_PAYLOAD', 'context must be build or change');
  const relatedIdentities = data.relatedIdentities === undefined ? [] : identityList(data.relatedIdentities, 'relatedIdentities');
  const rawEntries = data.entries === undefined ? [] : data.entries;
  if (!Array.isArray(rawEntries)) fail('INVALID_PAYLOAD', 'entries must be an array');
  const entries = rawEntries.map<RecordEntry>(raw => {
    const entry = record(raw, 'entry');
    exactKeys(entry, ['identity', 'nature', 'decision', 'content'], 'entry');
    if (entry.nature !== 'normative' && entry.nature !== 'informative') fail('INVALID_PAYLOAD', 'nature must be normative or informative');
    if (entry.decision !== 'pending' && entry.decision !== 'accepted' && entry.decision !== 'excluded') fail('INVALID_PAYLOAD', 'decision must be pending, accepted or excluded');
    return { identity: identity(entry.identity, 'entry.identity'), nature: entry.nature, decision: entry.decision, content: text(entry.content, 'entry.content') };
  });
  unique(entries.map(item => item.identity), 'entries');
  const structure = normalizeRecordStructure(data.structure);
  if (!entries.length && STRUCTURE_KEYS.every(type => !structure[type].length)) fail('EMPTY_PAYLOAD', 'A design record must contain at least one entry or structure object');
  return { schemaVersion: 4, context: data.context, relatedIdentities, entries, structure };
}

function parseMetadata(data: Record<string, unknown>): DesignRecordMetadata {
  if (data.entity === 'change-structural-definition') fail('UNSUPPORTED_RECORD_VERSION', 'Legacy structural records are unsupported; explicit user handling is required');
  exactKeys(data, ['entity', 'explorationId', 'slug', 'semanticModelFingerprint'], 'metadata');
  if (data.entity !== 'confirmed-design-record') fail('INVALID_METADATA', 'entity must be confirmed-design-record');
  if (typeof data.explorationId !== 'string' || typeof data.slug !== 'string') fail('INVALID_METADATA', 'explorationId and slug must be strings');
  validateExplorationId(data.explorationId);
  validateRecordSlug(data.slug);
  if (typeof data.semanticModelFingerprint !== 'string' || !/^[a-f0-9]{64}$/.test(data.semanticModelFingerprint)) fail('INVALID_METADATA', 'semanticModelFingerprint must be a SHA-256 digest');
  return { entity: 'confirmed-design-record', explorationId: data.explorationId, slug: data.slug, semanticModelFingerprint: data.semanticModelFingerprint };
}

function parseBaseline(value: unknown): RelevantSemanticModelBaseline {
  const data = record(value, 'baseline');
  exactKeys(data, ['modelState', 'objects'], 'baseline');
  if (data.modelState !== 'absent' && data.modelState !== 'present') fail('INVALID_BASELINE', 'modelState must be absent or present');
  const objects = record(data.objects, 'baseline.objects');
  if (data.modelState === 'absent' && Object.keys(objects).length) fail('INVALID_BASELINE', 'Absent model cannot contain baseline objects');
  return { modelState: data.modelState, objects };
}

export function parseDesignRecord(content: string): DesignRecordDocument {
  const frontmatter = splitFrontmatter(content);
  if (!frontmatter.ok) fail('MALFORMED_DOCUMENT', frontmatter.message);
  const metadata = parseMetadata(frontmatter.data);
  const marker = `
${BASELINE_OPEN}
`;
  const markerIndex = frontmatter.body.indexOf(marker);
  if (markerIndex < 0 || !frontmatter.body.endsWith(`
${BASELINE_CLOSE}
`)) fail('MALFORMED_DOCUMENT', 'Missing Semantic Model baseline block');
  try {
    const payload = normalizeRecordPayload(parseYaml(frontmatter.body.slice(0, markerIndex)));
    const baseline = parseBaseline(parseYaml(frontmatter.body.slice(markerIndex + marker.length, -(`
${BASELINE_CLOSE}
`.length))));
    if (payload.context === 'change' && baseline.modelState === 'absent') fail('INVALID_BASELINE', 'Change record requires a formal model');
    return { metadata, payload, baseline };
  } catch (error) {
    if (error instanceof RecordDocumentError) throw error;
    fail('MALFORMED_DOCUMENT', error instanceof Error ? error.message : 'Invalid YAML');
  }
}

export function renderDesignRecord(document: DesignRecordDocument): string {
  const metadata = parseMetadata(document.metadata as unknown as Record<string, unknown>);
  const payload = normalizeRecordPayload(document.payload);
  const baseline = parseBaseline(document.baseline);
  if (payload.context === 'change' && baseline.modelState === 'absent') fail('INVALID_BASELINE', 'Change record requires a formal model');
  return [
    '---', `entity: ${metadata.entity}`,
    `explorationId: ${renderScalar(metadata.explorationId)}`,
    `slug: ${renderScalar(metadata.slug)}`,
    `semanticModelFingerprint: ${renderScalar(metadata.semanticModelFingerprint)}`, '---',
    stringifyYaml(payload, { lineWidth: 0 }).trimEnd(), BASELINE_OPEN,
    stringifyYaml(baseline, { lineWidth: 0 }).trimEnd(), BASELINE_CLOSE, '',
  ].join('\n');
}
