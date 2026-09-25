import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { renderScalar, splitFrontmatter } from '../model/frontmatter.js';
import { validateExplorationId, validateFramingSlug } from './paths.js';
import type { ChangeStructuralDefinitionDocument, ChangeStructuralDefinitionMetadata, ChangeStructuralDefinitionPayload, RelevantSemanticModelBaseline } from './types.js';

const BASELINE_OPEN = '<!-- XIRANG:SEMANTIC_MODEL_BASELINE';
const BASELINE_CLOSE = '-->';
const IDENTITY = /^[A-Za-z0-9._-]+$/;

export class FramingDocumentError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = 'FramingDocumentError';
  }
}

function fail(code: string, message: string): never {
  throw new FramingDocumentError(code, message);
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('MALFORMED_DOCUMENT', `${label} must be a mapping`);
  return value as Record<string, unknown>;
}

function exactKeys(value: Record<string, unknown>, allowed: readonly string[], label: string): void {
  const extras = Object.keys(value).filter(key => !allowed.includes(key));
  if (extras.length) fail('INVALID_PAYLOAD', `${label} contains unknown fields: ${extras.join(', ')}`);
}

function text(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim()) fail('INVALID_PAYLOAD', `${label} must be a non-empty string`);
  return value;
}

function identity(value: unknown, label: string): string {
  const result = text(value, label);
  if (!IDENTITY.test(result)) fail('INVALID_PAYLOAD', `${label} has invalid identity syntax`);
  return result;
}

function unique(values: string[], label: string): void {
  if (new Set(values).size !== values.length) fail('DUPLICATE_IDENTITY', `${label} contains duplicate identities`);
}

export function normalizeFramingPayload(value: unknown): ChangeStructuralDefinitionPayload {
  const data = record(value, 'payload');
  if (data.schemaVersion !== 2) fail('UNSUPPORTED_FRAMING_VERSION', 'Unsupported framing format; legacy structural records require explicit user handling and are not migrated');
  exactKeys(data, ['schemaVersion', 'context', 'relatedIdentities', 'entries'], 'payload');
  if (data.context !== 'build' && data.context !== 'change') fail('INVALID_PAYLOAD', 'context must be build or change');
  if (!Array.isArray(data.relatedIdentities)) fail('INVALID_PAYLOAD', 'relatedIdentities must be an array');
  const relatedIdentities = data.relatedIdentities.map(item => identity(item, 'relatedIdentities'));
  unique(relatedIdentities, 'relatedIdentities');
  if (!Array.isArray(data.entries)) fail('INVALID_PAYLOAD', 'entries must be an array');
  if (!data.entries.length) fail('EMPTY_PAYLOAD', 'Confirmed entries must not be empty');
  const entries = data.entries.map<ChangeStructuralDefinitionPayload['entries'][number]>(raw => {
    const entry = record(raw, 'entry');
    exactKeys(entry, ['identity', 'nature', 'content'], 'entry');
    if (entry.nature !== 'normative' && entry.nature !== 'informative') fail('INVALID_PAYLOAD', 'nature must be normative or informative');
    return { identity: identity(entry.identity, 'entry.identity'), nature: entry.nature, content: text(entry.content, 'entry.content') };
  });
  unique(entries.map(item => item.identity), 'entries');
  return { schemaVersion: 2, context: data.context, relatedIdentities, entries };
}

function parseMetadata(data: Record<string, unknown>): ChangeStructuralDefinitionMetadata {
  if (data.entity === 'change-structural-definition') fail('UNSUPPORTED_FRAMING_VERSION', 'Legacy structural records are unsupported; explicit user handling is required');
  exactKeys(data, ['entity', 'explorationId', 'slug', 'semanticModelFingerprint'], 'metadata');
  if (data.entity !== 'confirmed-design-record') fail('INVALID_METADATA', 'entity must be confirmed-design-record');
  if (typeof data.explorationId !== 'string' || typeof data.slug !== 'string') fail('INVALID_METADATA', 'explorationId and slug must be strings');
  validateExplorationId(data.explorationId);
  validateFramingSlug(data.slug);
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

export function parseChangeStructuralDefinition(content: string): ChangeStructuralDefinitionDocument {
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
    const payload = normalizeFramingPayload(parseYaml(frontmatter.body.slice(0, markerIndex)));
    const baseline = parseBaseline(parseYaml(frontmatter.body.slice(markerIndex + marker.length, -(`
${BASELINE_CLOSE}
`.length))));
    if (payload.context === 'change' && baseline.modelState === 'absent') fail('INVALID_BASELINE', 'Change framing requires a formal model');
    return { metadata, payload, baseline };
  } catch (error) {
    if (error instanceof FramingDocumentError) throw error;
    fail('MALFORMED_DOCUMENT', error instanceof Error ? error.message : 'Invalid YAML');
  }
}

export function renderChangeStructuralDefinition(document: ChangeStructuralDefinitionDocument): string {
  const metadata = parseMetadata(document.metadata as unknown as Record<string, unknown>);
  const payload = normalizeFramingPayload(document.payload);
  const baseline = parseBaseline(document.baseline);
  if (payload.context === 'change' && baseline.modelState === 'absent') fail('INVALID_BASELINE', 'Change framing requires a formal model');
  return [
    '---', `entity: ${metadata.entity}`,
    `explorationId: ${renderScalar(metadata.explorationId)}`,
    `slug: ${renderScalar(metadata.slug)}`,
    `semanticModelFingerprint: ${renderScalar(metadata.semanticModelFingerprint)}`, '---',
    stringifyYaml(payload, { lineWidth: 0 }).trimEnd(), BASELINE_OPEN,
    stringifyYaml(baseline, { lineWidth: 0 }).trimEnd(), BASELINE_CLOSE, '',
  ].join('\n');
}
