import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { renderScalar, splitFrontmatter } from '../model/frontmatter.js';
import { validateNodePresentation } from '../model/node-presentation.js';
import { validateExplorationId, validateFramingSlug } from './paths.js';
import type {
  ChangeStructuralDefinitionDocument,
  ChangeStructuralDefinitionMetadata,
  ChangeStructuralDefinitionPayload,
  NodePresentationTarget,
  RelevantSemanticModelBaseline,
} from './types.js';

const BASELINE_OPEN = '<!-- XIRANG:SEMANTIC_MODEL_BASELINE';
const BASELINE_CLOSE = '-->';

export type FramingDocumentErrorCode =
  | 'MALFORMED_DOCUMENT'
  | 'INVALID_METADATA'
  | 'INVALID_PAYLOAD'
  | 'INVALID_BASELINE'
  | 'INVALID_TARGET_OPERATION'
  | 'INVALID_REMOVAL_TARGET'
  | 'DUPLICATE_TARGET';

export class FramingDocumentError extends Error {
  constructor(public readonly code: FramingDocumentErrorCode, message: string) {
    super(message);
    this.name = 'FramingDocumentError';
  }
}

function fail(code: FramingDocumentErrorCode, message: string): never {
  throw new FramingDocumentError(code, message);
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    fail('MALFORMED_DOCUMENT', `${label} must be a mapping`);
  }
  return value as Record<string, unknown>;
}

function text(value: unknown, label: string, allowEmpty = false): string {
  if (typeof value !== 'string' || (!allowEmpty && value.trim() === '')) {
    fail('INVALID_PAYLOAD', `${label} must be a${allowEmpty ? '' : ' non-empty'} string`);
  }
  return value;
}

function exactKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  label: string,
  code: 'INVALID_METADATA' | 'INVALID_PAYLOAD' | 'INVALID_BASELINE' = 'INVALID_PAYLOAD',
): void {
  const extras = Object.keys(value).filter(key => !allowed.includes(key));
  if (extras.length > 0) fail(code, `${label} contains unknown fields: ${extras.join(', ')}`);
}

const STRUCTURAL_IDENTITY = /^[A-Za-z0-9._-]+$/;

function structuralIdentity(value: unknown, label: string): string {
  const parsed = text(value, label);
  if (!STRUCTURAL_IDENTITY.test(parsed)) fail('INVALID_PAYLOAD', `${label} has invalid identity syntax: ${parsed}`);
  return parsed;
}

function stringList(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) fail('INVALID_PAYLOAD', `${label} must be a string array`);
  return value.map((item, index) => structuralIdentity(item, `${label}[${index}]`));
}

function optionalStringList(value: unknown, label: string): string[] | undefined {
  return value === undefined ? undefined : stringList(value, label);
}

function operation(item: Record<string, unknown>, label: string): 'REMOVED' | undefined {
  if (item.operation === undefined) return undefined;
  if (item.operation !== 'REMOVED') {
    fail('INVALID_TARGET_OPERATION', `${label} may only declare operation: REMOVED`);
  }
  return 'REMOVED';
}

function assertRemovalShape(item: Record<string, unknown>, allowed: string[], label: string): void {
  const extras = Object.keys(item).filter(key => key !== 'operation' && !allowed.includes(key));
  if (extras.length > 0) {
    fail('INVALID_REMOVAL_TARGET', `${label} REMOVED target contains fields: ${extras.join(', ')}`);
  }
}

function array(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) fail('INVALID_PAYLOAD', `${label} must be an array`);
  return value;
}

function parseNodePresentationTarget(raw: unknown, label: string): NodePresentationTarget | undefined {
  const validation = validateNodePresentation(raw);
  if (validation.absent) return undefined;
  if (validation.notMapping) {
    fail('INVALID_PAYLOAD', `${label} must be a mapping`);
  }
  if (validation.unknownFields.length > 0) {
    fail('INVALID_PAYLOAD', `${label} contains unknown fields: ${validation.unknownFields.join(', ')}`);
  }
  const firstInvalid = validation.invalidValues[0];
  if (firstInvalid) {
    fail('INVALID_PAYLOAD', `${label}.${firstInvalid.field} has invalid value: ${String(firstInvalid.value)}`);
  }
  return validation.presentation as NodePresentationTarget;
}

function parseElementKinds(value: unknown): ChangeStructuralDefinitionPayload['elementKinds'] {
  return array(value, 'elementKinds').map((raw, index) => {
    const item = record(raw, `elementKinds[${index}]`);
    const identity = structuralIdentity(item.identity, `elementKinds[${index}].identity`);
    if (operation(item, `elementKinds[${index}]`)) {
      assertRemovalShape(item, ['identity'], `elementKinds[${index}]`);
      return { operation: 'REMOVED', identity };
    }
    exactKeys(item, ['identity', 'contract', 'root', 'parents', 'children', 'nodePresentation', 'body'], `elementKinds[${index}]`);
    if (item.contract !== 'required' && item.contract !== 'optional') {
      fail('INVALID_PAYLOAD', `elementKinds[${index}].contract must be required or optional`);
    }
    if (item.root !== undefined && typeof item.root !== 'boolean') {
      fail('INVALID_PAYLOAD', `elementKinds[${index}].root must be boolean`);
    }
    const parents = optionalStringList(item.parents, `elementKinds[${index}].parents`);
    const children = optionalStringList(item.children, `elementKinds[${index}].children`);
    const nodePresentation = parseNodePresentationTarget(item.nodePresentation, `elementKinds[${index}].nodePresentation`);
    return {
      identity,
      contract: item.contract,
      ...(item.root === undefined ? {} : { root: item.root }),
      ...(parents === undefined ? {} : { parents }),
      ...(children === undefined ? {} : { children }),
      ...(nodePresentation === undefined ? {} : { nodePresentation }),
      body: text(item.body, `elementKinds[${index}].body`, true),
    };
  });
}

function parseRelationshipKinds(value: unknown): ChangeStructuralDefinitionPayload['relationshipKinds'] {
  return array(value, 'relationshipKinds').map((raw, index) => {
    const item = record(raw, `relationshipKinds[${index}]`);
    const identity = structuralIdentity(item.identity, `relationshipKinds[${index}].identity`);
    if (operation(item, `relationshipKinds[${index}]`)) {
      assertRemovalShape(item, ['identity'], `relationshipKinds[${index}]`);
      return { operation: 'REMOVED', identity };
    }
    exactKeys(item, ['identity', 'sourceKinds', 'targetKinds', 'body'], `relationshipKinds[${index}]`);
    const sourceKinds = optionalStringList(item.sourceKinds, `relationshipKinds[${index}].sourceKinds`);
    const targetKinds = optionalStringList(item.targetKinds, `relationshipKinds[${index}].targetKinds`);
    return {
      identity,
      ...(sourceKinds === undefined ? {} : { sourceKinds }),
      ...(targetKinds === undefined ? {} : { targetKinds }),
      body: text(item.body, `relationshipKinds[${index}].body`, true),
    };
  });
}

function parseElements(value: unknown): ChangeStructuralDefinitionPayload['elements'] {
  return array(value, 'elements').map((raw, index) => {
    const item = record(raw, `elements[${index}]`);
    const identity = structuralIdentity(item.identity, `elements[${index}].identity`);
    if (operation(item, `elements[${index}]`)) {
      assertRemovalShape(item, ['identity'], `elements[${index}]`);
      return { operation: 'REMOVED', identity };
    }
    exactKeys(item, ['identity', 'kind', 'parent', 'title', 'definition'], `elements[${index}]`);
    if (item.parent !== null && typeof item.parent !== 'string') {
      fail('INVALID_PAYLOAD', `elements[${index}].parent must be a string or null`);
    }
    return {
      identity,
      kind: structuralIdentity(item.kind, `elements[${index}].kind`),
      parent: item.parent === null ? null : structuralIdentity(item.parent, `elements[${index}].parent`),
      title: text(item.title, `elements[${index}].title`, true),
      definition: text(item.definition, `elements[${index}].definition`),
    };
  });
}

function parseRelationships(value: unknown): ChangeStructuralDefinitionPayload['relationships'] {
  return array(value, 'relationships').map((raw, index) => {
    const item = record(raw, `relationships[${index}]`);
    const target = {
      source: structuralIdentity(item.source, `relationships[${index}].source`),
      kind: structuralIdentity(item.kind, `relationships[${index}].kind`),
      target: structuralIdentity(item.target, `relationships[${index}].target`),
    };
    if (operation(item, `relationships[${index}]`)) {
      assertRemovalShape(item, ['source', 'kind', 'target'], `relationships[${index}]`);
      return { operation: 'REMOVED', ...target };
    }
    exactKeys(item, ['source', 'kind', 'target'], `relationships[${index}]`);
    return target;
  });
}

function unique(keys: string[], label: string): void {
  const seen = new Set<string>();
  for (const key of keys) {
    if (seen.has(key)) fail('DUPLICATE_TARGET', `${label} contains duplicate target ${JSON.stringify(key)}`);
    seen.add(key);
  }
}

export function normalizeFramingPayload(value: unknown): ChangeStructuralDefinitionPayload {
  const data = record(value, 'payload');
  exactKeys(data, ['informativeHierarchyPreview', 'elementKinds', 'relationshipKinds', 'elements', 'relationships'], 'payload');
  const payload: ChangeStructuralDefinitionPayload = {
    ...(data.informativeHierarchyPreview === undefined
      ? {}
      : { informativeHierarchyPreview: text(data.informativeHierarchyPreview, 'informativeHierarchyPreview', true) }),
    elementKinds: parseElementKinds(data.elementKinds),
    relationshipKinds: parseRelationshipKinds(data.relationshipKinds),
    elements: parseElements(data.elements),
    relationships: parseRelationships(data.relationships),
  };
  unique(payload.elementKinds.map(item => item.identity), 'elementKinds');
  unique(payload.relationshipKinds.map(item => item.identity), 'relationshipKinds');
  unique(payload.elements.map(item => item.identity), 'elements');
  unique(payload.relationships.map(item => `${item.source}\u0000${item.kind}\u0000${item.target}`), 'relationships');
  return payload;
}

function parseMetadata(data: Record<string, unknown>): ChangeStructuralDefinitionMetadata {
  exactKeys(data, ['entity', 'explorationId', 'slug', 'semanticModelFingerprint'], 'metadata', 'INVALID_METADATA');
  if (data.entity !== 'change-structural-definition') {
    fail('INVALID_METADATA', 'entity must be change-structural-definition');
  }
  if (typeof data.explorationId !== 'string' || typeof data.slug !== 'string') {
    fail('INVALID_METADATA', 'explorationId and slug must be strings');
  }
  try {
    validateExplorationId(data.explorationId);
    validateFramingSlug(data.slug);
  } catch (error) {
    fail('INVALID_METADATA', error instanceof Error ? error.message : 'Invalid managed identity');
  }
  if (typeof data.semanticModelFingerprint !== 'string' || !/^[a-f0-9]{64}$/.test(data.semanticModelFingerprint)) {
    fail('INVALID_METADATA', 'semanticModelFingerprint must be 64 lowercase hexadecimal characters');
  }
  return {
    entity: 'change-structural-definition',
    explorationId: data.explorationId,
    slug: data.slug,
    semanticModelFingerprint: data.semanticModelFingerprint,
  };
}

function baselineRecord(raw: unknown, label: string): Record<string, unknown> {
  try {
    return record(raw, label);
  } catch {
    fail('INVALID_BASELINE', `${label} must be a mapping`);
  }
}

function baselineValue(
  raw: unknown,
  label: string,
  keys: readonly string[],
  parseValue: (value: unknown) => unknown,
  matches: (entry: Record<string, unknown>, value: unknown) => boolean,
): Record<string, unknown> {
  const entry = baselineRecord(raw, label);
  exactKeys(entry, [...keys, 'exists', 'value'], label, 'INVALID_BASELINE');
  for (const key of keys) {
    if (typeof entry[key] !== 'string' || !STRUCTURAL_IDENTITY.test(entry[key] as string)) {
      fail('INVALID_BASELINE', `${label}.${key} must be a valid identity`);
    }
  }
  if (typeof entry.exists !== 'boolean') fail('INVALID_BASELINE', `${label}.exists must be boolean`);
  if (!entry.exists) {
    if (entry.value !== undefined) fail('INVALID_BASELINE', `${label}.value must be absent when exists is false`);
    return entry;
  }
  if (entry.value === undefined) fail('INVALID_BASELINE', `${label}.value is required when exists is true`);
  let parsed: unknown;
  try {
    parsed = parseValue(entry.value);
  } catch (error) {
    fail('INVALID_BASELINE', error instanceof Error ? error.message : `${label}.value is invalid`);
  }
  if (!matches(entry, parsed)) fail('INVALID_BASELINE', `${label}.value identity does not match its baseline key`);
  return { ...entry, value: parsed };
}

function parseBaseline(value: unknown): RelevantSemanticModelBaseline {
  const data = baselineRecord(value, 'baseline');
  exactKeys(data, ['elementKinds', 'relationshipKinds', 'elements', 'relationships'], 'baseline', 'INVALID_BASELINE');
  const elementKinds = array(data.elementKinds, 'baseline.elementKinds').map((raw, index) => baselineValue(
    raw, `baseline.elementKinds[${index}]`, ['identity'],
    item => parseElementKinds([item])[0],
    (entry, item) => !('operation' in (item as object)) && entry.identity === (item as { identity: string }).identity,
  ));
  const relationshipKinds = array(data.relationshipKinds, 'baseline.relationshipKinds').map((raw, index) => baselineValue(
    raw, `baseline.relationshipKinds[${index}]`, ['identity'],
    item => parseRelationshipKinds([item])[0],
    (entry, item) => !('operation' in (item as object)) && entry.identity === (item as { identity: string }).identity,
  ));
  const elements = array(data.elements, 'baseline.elements').map((raw, index) => baselineValue(
    raw, `baseline.elements[${index}]`, ['identity'],
    item => parseElements([item])[0],
    (entry, item) => !('operation' in (item as object)) && entry.identity === (item as { identity: string }).identity,
  ));
  const relationships = array(data.relationships, 'baseline.relationships').map((raw, index) => baselineValue(
    raw, `baseline.relationships[${index}]`, ['source', 'kind', 'target'],
    item => parseRelationships([item])[0],
    (entry, item) => {
      const target = item as { source: string; kind: string; target: string; operation?: string };
      return target.operation === undefined
        && entry.source === target.source && entry.kind === target.kind && entry.target === target.target;
    },
  ));
  unique(elementKinds.map(item => String(item.identity)), 'baseline.elementKinds');
  unique(relationshipKinds.map(item => String(item.identity)), 'baseline.relationshipKinds');
  unique(elements.map(item => String(item.identity)), 'baseline.elements');
  unique(relationships.map(item => `${String(item.source)}\u0000${String(item.kind)}\u0000${String(item.target)}`), 'baseline.relationships');
  return { elementKinds, relationshipKinds, elements, relationships } as unknown as RelevantSemanticModelBaseline;
}

function yaml(value: unknown): string {
  return stringifyYaml(value, { lineWidth: 0 }).trimEnd();
}

export function parseChangeStructuralDefinition(content: string): ChangeStructuralDefinitionDocument {
  const frontmatter = splitFrontmatter(content);
  if (!frontmatter.ok) fail('MALFORMED_DOCUMENT', frontmatter.message);
  const marker = `\n${BASELINE_OPEN}\n`;
  const markerIndex = frontmatter.body.indexOf(marker);
  if (markerIndex < 0 || !frontmatter.body.endsWith(`\n${BASELINE_CLOSE}\n`)) {
    fail('MALFORMED_DOCUMENT', 'Document is missing the Semantic Model baseline block');
  }
  try {
    const payload = parseYaml(frontmatter.body.slice(0, markerIndex));
    const baseline = parseYaml(frontmatter.body.slice(markerIndex + marker.length, -(`\n${BASELINE_CLOSE}\n`.length)));
    return {
      metadata: parseMetadata(frontmatter.data),
      payload: normalizeFramingPayload(payload),
      baseline: parseBaseline(baseline),
    };
  } catch (error) {
    if (error instanceof FramingDocumentError) throw error;
    fail('MALFORMED_DOCUMENT', error instanceof Error ? error.message : 'Invalid YAML document');
  }
}

export function renderChangeStructuralDefinition(document: ChangeStructuralDefinitionDocument): string {
  const normalized: ChangeStructuralDefinitionDocument = {
    metadata: parseMetadata(document.metadata as unknown as Record<string, unknown>),
    payload: normalizeFramingPayload(document.payload),
    baseline: parseBaseline(document.baseline),
  };
  const metadata = normalized.metadata;
  return [
    '---',
    `entity: ${metadata.entity}`,
    `explorationId: ${renderScalar(metadata.explorationId)}`,
    `slug: ${renderScalar(metadata.slug)}`,
    `semanticModelFingerprint: ${renderScalar(metadata.semanticModelFingerprint)}`,
    '---',
    yaml(normalized.payload),
    BASELINE_OPEN,
    yaml(normalized.baseline),
    BASELINE_CLOSE,
    '',
  ].join('\n');
}
