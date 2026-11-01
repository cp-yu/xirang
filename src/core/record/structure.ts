import { canonicalJson } from '../semantic-diff.js';
import type { SemanticModel } from '../model/types.js';
import {
  exactKeys, fail, identity, normalizeRecordPayload, normalizeStructureItem, record, RecordDocumentError,
  STRUCTURE_FIELDS, STRUCTURE_KEY_FIELDS, STRUCTURE_KEYS, structureKey,
} from './document.js';
import type {
  DerivedStructureObject, DesignRecordPayload, RecordEntry, RecordStructure, RecordStructureDiagnostic,
  RecordSummary, StructureDiff, StructureRef,
} from './types.js';

type StructureKey = keyof RecordStructure;
type Item = Record<string, unknown>;

const REF_NAME: Record<StructureKey, 'element' | 'relationship' | 'elementKind' | 'relationshipKind'> = {
  elements: 'element', relationships: 'relationship', elementKinds: 'elementKind', relationshipKinds: 'relationshipKind',
};
const ORDER_INSENSITIVE = new Set(['parents', 'children', 'sourceKinds', 'targetKinds']);

export class RecordStructureError extends Error {
  readonly code = 'INVALID_STRUCTURE';
  constructor(public readonly diagnostics: RecordStructureDiagnostic[]) {
    super(diagnostics.map(item => `${item.identity} ${item.field}: ${item.message}`).join('; '));
    this.name = 'RecordStructureError';
  }
}

export function structureRef(type: StructureKey, item: Item): StructureRef {
  return type === 'relationships'
    ? { relationship: { source: item.source as string, kind: item.kind as string, target: item.target as string } }
    : { [REF_NAME[type]]: item.identity } as StructureRef;
}

export function refLabel(type: StructureKey, item: Item): string {
  return type === 'relationships' ? `${item.source} -${item.kind}-> ${item.target}` : item.identity as string;
}

function list(value: unknown, label: string): unknown[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) fail('INVALID_PATCH', `${label} must be an array`);
  return value;
}

function applyEntries(entries: RecordEntry[], raw: unknown): RecordEntry[] {
  const patch = record(raw, 'entries');
  exactKeys(patch, ['upsert', 'remove'], 'entries');
  const upserts = list(patch.upsert, 'entries.upsert').map(item => record(item, 'entry') as unknown as RecordEntry);
  const removals = list(patch.remove, 'entries.remove').map(item => identity(item, 'entries.remove'));
  const touched = upserts.map(item => item.identity);
  if (removals.some(item => touched.includes(item))) fail('PATCH_CONFLICT', 'An entry cannot be upserted and removed in one patch');
  const next = [...entries];
  for (const entry of upserts) {
    const index = next.findIndex(item => item.identity === entry.identity);
    if (index >= 0) next[index] = entry; else next.push(entry);
  }
  for (const removal of removals) {
    const index = next.findIndex(item => item.identity === removal);
    if (index < 0) fail('PATCH_TARGET_NOT_FOUND', `Entry is not recorded: ${removal}`);
    next.splice(index, 1);
  }
  return next;
}

function mergeItem(type: StructureKey, existing: Item | undefined, raw: unknown): Item {
  const extra = type === 'relationships' ? [] : ['clear'];
  const incoming = normalizeStructureItem(type, raw, extra);
  const clear = list(incoming.clear, `${type}.clear`);
  delete incoming.clear;
  const allowed = [...STRUCTURE_FIELDS[type].filter(field => !STRUCTURE_KEY_FIELDS[type].includes(field)), 'removed'];
  for (const field of clear) {
    if (typeof field !== 'string' || !allowed.includes(field)) fail('INVALID_PATCH', `${type}.clear contains an undeclared field: ${String(field)}`);
    if (field in incoming) fail('PATCH_CONFLICT', `${type}.${field} cannot be set and cleared in one patch`);
  }
  if (type === 'relationships') return incoming;
  const merged: Item = { ...existing, ...incoming };
  for (const field of clear as string[]) delete merged[field];
  return normalizeStructureItem(type, merged);
}

function applyStructure(structure: RecordStructure, raw: unknown): RecordStructure {
  const patch = record(raw, 'structure');
  exactKeys(patch, ['upsert', 'withdraw'], 'structure');
  const upsert = patch.upsert === undefined ? {} : record(patch.upsert, 'structure.upsert');
  const withdraw = patch.withdraw === undefined ? {} : record(patch.withdraw, 'structure.withdraw');
  exactKeys(upsert, STRUCTURE_KEYS, 'structure.upsert');
  exactKeys(withdraw, STRUCTURE_KEYS, 'structure.withdraw');
  const next = {} as Record<StructureKey, Item[]>;
  for (const type of STRUCTURE_KEYS) {
    const items = [...structure[type]] as unknown as Item[];
    const upserted = new Set<string>();
    for (const raw of list(upsert[type], `structure.upsert.${type}`)) {
      const key = structureKey(type, record(raw, type));
      if (upserted.has(key)) fail('PATCH_CONFLICT', `Duplicate ${type} upsert: ${key}`);
      upserted.add(key);
      const index = items.findIndex(item => structureKey(type, item) === key);
      const merged = mergeItem(type, index >= 0 ? items[index] : undefined, raw);
      if (index >= 0) items[index] = merged; else items.push(merged);
    }
    for (const raw of list(withdraw[type], `structure.withdraw.${type}`)) {
      const target = type === 'relationships'
        ? normalizeStructureItem(type, raw)
        : { identity: identity(raw, `structure.withdraw.${type}`) };
      const key = structureKey(type, target);
      if (upserted.has(key)) fail('PATCH_CONFLICT', `${type} cannot be upserted and withdrawn in one patch: ${key}`);
      const index = items.findIndex(item => structureKey(type, item) === key);
      if (index < 0) fail('PATCH_TARGET_NOT_FOUND', `${type} is not recorded: ${key}`);
      items.splice(index, 1);
    }
    next[type] = items;
  }
  return next as unknown as RecordStructure;
}

function applyRelated(related: string[], raw: unknown): string[] {
  const patch = record(raw, 'relatedIdentities');
  exactKeys(patch, ['add', 'remove'], 'relatedIdentities');
  const next = [...related];
  for (const item of list(patch.add, 'relatedIdentities.add')) {
    const value = identity(item, 'relatedIdentities.add');
    if (!next.includes(value)) next.push(value);
  }
  for (const item of list(patch.remove, 'relatedIdentities.remove')) {
    const index = next.indexOf(identity(item, 'relatedIdentities.remove'));
    if (index < 0) fail('PATCH_TARGET_NOT_FOUND', `Related identity is not recorded: ${String(item)}`);
    next.splice(index, 1);
  }
  return next;
}

/** Applies a partial update; untouched entries and structure objects stay byte-identical. */
export function applyRecordPatch(payload: DesignRecordPayload, raw: unknown): DesignRecordPayload {
  const patch = record(raw, 'patch');
  try {
    exactKeys(patch, ['entries', 'structure', 'relatedIdentities'], 'patch');
  } catch (error) {
    if (error instanceof RecordDocumentError) fail('INVALID_PATCH', error.message);
    throw error;
  }
  if (!Object.keys(patch).length) fail('EMPTY_PATCH', 'Patch must contain entries, structure, or relatedIdentities changes');
  const guard = <T>(action: () => T): T => {
    try { return action(); } catch (error) {
      if (error instanceof RecordDocumentError && error.code === 'INVALID_PAYLOAD') fail('INVALID_PATCH', error.message);
      throw error;
    }
  };
  return normalizeRecordPayload({
    ...payload,
    entries: patch.entries === undefined ? payload.entries : guard(() => applyEntries(payload.entries, patch.entries)),
    structure: patch.structure === undefined ? payload.structure : guard(() => applyStructure(payload.structure, patch.structure)),
    relatedIdentities: patch.relatedIdentities === undefined ? payload.relatedIdentities : guard(() => applyRelated(payload.relatedIdentities, patch.relatedIdentities)),
  });
}

function fieldsOf(type: StructureKey): string[] {
  return ['removed', ...STRUCTURE_FIELDS[type].filter(field => !STRUCTURE_KEY_FIELDS[type].includes(field))];
}

export function diffStructure(before: RecordStructure, after: RecordStructure): StructureDiff {
  const result: StructureDiff = { added: [], modified: [], withdrawn: [] };
  for (const type of STRUCTURE_KEYS) {
    const previous = new Map((before[type] as unknown as Item[]).map(item => [structureKey(type, item), item]));
    const next = new Map((after[type] as unknown as Item[]).map(item => [structureKey(type, item), item]));
    for (const [key, item] of next) {
      const old = previous.get(key);
      if (!old) { result.added.push({ ref: structureRef(type, item), after: item }); continue; }
      const changedFields = [], addedFields = [], clearedFields = [];
      for (const field of fieldsOf(type)) {
        if (field in old && field in item) {
          if (canonicalJson(old[field]) !== canonicalJson(item[field])) changedFields.push({ field, before: old[field], after: item[field] });
        } else if (field in item) addedFields.push({ field, after: item[field] });
        else if (field in old) clearedFields.push({ field, before: old[field] });
      }
      if (changedFields.length || addedFields.length || clearedFields.length) {
        result.modified.push({ ref: structureRef(type, item), changedFields, addedFields, clearedFields });
      }
    }
    for (const [key, item] of previous) if (!next.has(key)) result.withdrawn.push({ ref: structureRef(type, item), before: item });
  }
  return result;
}

function modelObjects(model: SemanticModel): Record<StructureKey, Map<string, Item>> {
  return {
    elements: new Map(model.elements.map(item => [item.declaration.identity, { ...item.declaration }])),
    relationships: new Map(model.relationships.map(item => [structureKey('relationships', { ...item }), { ...item }])),
    elementKinds: new Map(model.elementKinds.map(item => [item.identity, { ...item, root: item.root === true }])),
    relationshipKinds: new Map(model.relationshipKinds.map(item => [item.identity, { ...item }])),
  };
}

function comparable(field: string, value: unknown): string {
  if (field === 'root') return canonicalJson(value === true);
  if (ORDER_INSENSITIVE.has(field) && Array.isArray(value)) return canonicalJson([...value].sort());
  return canonicalJson(value ?? null);
}

/** Compares each recorded object with a model: every recorded field must match; unrecorded fields are not compared. */
export function compareStructure(structure: RecordStructure, model: SemanticModel | null): DerivedStructureObject[] {
  const objects = model ? modelObjects(model) : null;
  const result: DerivedStructureObject[] = [];
  for (const type of STRUCTURE_KEYS) {
    for (const item of structure[type] as unknown as Item[]) {
      const ref = structureRef(type, item);
      const current = objects?.[type].get(structureKey(type, item));
      if (item.removed === true) { result.push({ ref, status: current ? 'removed' : 'unchanged' }); continue; }
      if (!current) { result.push({ ref, status: 'added' }); continue; }
      const fields = fieldsOf(type).filter(field => field !== 'removed' && field in item
        && comparable(field, item[field]) !== comparable(field, current[field]))
        .map(field => ({ field, record: item[field], model: current[field] ?? null }));
      result.push(fields.length ? { ref, status: 'modified', fields } : { ref, status: 'unchanged' });
    }
  }
  return result;
}

function available(type: StructureKey, structure: RecordStructure, objects = new Map<string, Item>()): Map<string, Item> {
  for (const item of structure[type] as unknown as Item[]) {
    const key = structureKey(type, item);
    if (item.removed === true) objects.delete(key);
    else objects.set(key, { ...objects.get(key), ...item });
  }
  return objects;
}

/** Deterministic reference checks against the current model plus non-removed record objects. */
export function validateRecordStructure(structure: RecordStructure, model: SemanticModel | null): RecordStructureDiagnostic[] {
  const diagnostics: RecordStructureDiagnostic[] = [];
  const objects = model ? modelObjects(model) : null;
  const elements = available('elements', structure, objects?.elements);
  const elementKinds = available('elementKinds', structure, objects?.elementKinds);
  const relationshipKinds = available('relationshipKinds', structure, objects?.relationshipKinds);
  const report = (type: StructureKey, item: Item, code: string, field: string, message: string) =>
    diagnostics.push({ severity: 'ERROR', code, message, identity: refLabel(type, item), field });
  for (const item of structure.elements as unknown as Item[]) {
    if (item.removed === true) continue;
    if (item.kind !== undefined && !elementKinds.has(item.kind as string)) {
      report('elements', item, 'UNKNOWN_ELEMENT_KIND', 'kind', `Element Kind ${item.kind} is not in the Metamodel or record`);
    }
    if (item.parent === null) {
      const kind = elementKinds.get((elements.get(item.identity as string)?.kind ?? '') as string);
      if (kind && kind.root !== true) report('elements', item, 'UNRESOLVED_PARENT', 'parent', `Element Kind ${kind.identity} does not allow Project Root`);
    } else if (item.parent !== undefined && !elements.has(item.parent as string)) {
      report('elements', item, 'UNRESOLVED_PARENT', 'parent', `Parent ${item.parent} is not in the current model or record`);
    }
  }
  for (const item of structure.relationships as unknown as Item[]) {
    if (item.removed === true) continue;
    for (const field of ['source', 'target']) {
      if (!elements.has(item[field] as string)) report('relationships', item, 'UNRESOLVED_RELATIONSHIP_ENDPOINT', field, `Endpoint ${item[field]} is not in the current model or record`);
    }
    if (!relationshipKinds.has(item.kind as string)) report('relationships', item, 'UNKNOWN_RELATIONSHIP_KIND', 'kind', `Relationship Kind ${item.kind} is not in the Metamodel or record`);
  }
  const kindRefs: Array<[StructureKey, string[]]> = [['elementKinds', ['parents', 'children']], ['relationshipKinds', ['sourceKinds', 'targetKinds']]];
  for (const [type, fields] of kindRefs) {
    for (const item of structure[type] as unknown as Item[]) {
      if (item.removed === true) continue;
      for (const field of fields) {
        const missing = ((item[field] ?? []) as string[]).filter(kind => !elementKinds.has(kind));
        if (missing.length) report(type, item, 'UNKNOWN_ELEMENT_KIND', field, `Element Kinds are not in the Metamodel or record: ${missing.join(', ')}`);
      }
    }
  }
  return diagnostics;
}

export function assertRecordStructure(structure: RecordStructure, model: SemanticModel | null): void {
  const diagnostics = validateRecordStructure(structure, model);
  if (diagnostics.length) throw new RecordStructureError(diagnostics);
}

export function summarizeRecord(payload: DesignRecordPayload): RecordSummary {
  return {
    entries: payload.entries.length,
    normativeEntries: payload.entries.filter(item => item.nature === 'normative').length,
    decisions: {
      pending: payload.entries.filter(item => item.decision === 'pending').length,
      accepted: payload.entries.filter(item => item.decision === 'accepted').length,
      excluded: payload.entries.filter(item => item.decision === 'excluded').length,
    },
    elements: payload.structure.elements.length,
    relationships: payload.structure.relationships.length,
    elementKinds: payload.structure.elementKinds.length,
    relationshipKinds: payload.structure.relationshipKinds.length,
  };
}

/** Identities referenced by the structure part; they join relatedIdentities in the baseline. */
export function structureIdentities(structure: RecordStructure): string[] {
  const values = new Set<string>();
  for (const item of structure.elements) [item.identity, item.kind, item.parent].forEach(value => value && values.add(value));
  for (const item of structure.relationships) [item.source, item.kind, item.target].forEach(value => values.add(value));
  for (const item of [...structure.elementKinds, ...structure.relationshipKinds]) values.add(item.identity);
  return [...values];
}
