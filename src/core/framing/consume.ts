import { constants as fsConstants, promises as fs } from 'node:fs';
import path from 'node:path';
import { compileChangeDelta } from '../change-compiler.js';
import { canonicalJson } from '../semantic-diff.js';
import { readSemanticTree, semanticTreeFingerprint } from '../model/transaction.js';
import { relationshipIdentity } from '../model/types.js';
import { validateChangeName } from '../../utils/change-utils.js';
import { classifyBaselineDrift } from './baseline.js';
import { projectRelativePosix } from './paths.js';
import type {
  ChangeStructuralDefinitionDocument,
  RelevantSemanticModelBaseline,
} from './types.js';
import { validateStructuralDefinition } from './validator.js';
import { showFraming } from './workspace.js';
import type { DeltaEntry, Operation } from '../model/delta.js';

export type FramingConsumeErrorCode =
  | 'INVALID_CHANGE_NAME'
  | 'INVALID_CHANGE_PATH'
  | 'RELEVANT_DRIFT'
  | 'STRUCTURAL_TARGET_INVALID'
  | 'CHANGE_VALIDATION_FAILED'
  | 'STRUCTURAL_COVERAGE_MISMATCH'
  | 'PROVENANCE_CONFLICT';

export class FramingConsumeError extends Error {
  constructor(public readonly code: FramingConsumeErrorCode, message: string) {
    super(message);
    this.name = 'FramingConsumeError';
  }
}

export interface FramingConsumeResult {
  explorationId: string;
  changeName: string;
  path: string;
  recovered: boolean;
}

function fail(code: FramingConsumeErrorCode, message: string): never {
  throw new FramingConsumeError(code, message);
}

function baselineMaps(baseline: RelevantSemanticModelBaseline) {
  return {
    elementKinds: new Map(baseline.elementKinds.map(item => [item.identity, item])),
    relationshipKinds: new Map(baseline.relationshipKinds.map(item => [item.identity, item])),
    elements: new Map(baseline.elements.map(item => [item.identity, item])),
    relationships: new Map(baseline.relationships.map(item => [relationshipIdentity(item), item])),
  };
}

function normalizedCoverageTarget(entity: DeltaEntry['entity'], target: unknown): unknown {
  if (!target || typeof target !== 'object') return target;
  const value = target as Record<string, unknown>;
  if (entity === 'element-kind') {
    return {
      ...value,
      ...(Array.isArray(value.parents) ? { parents: [...value.parents].sort() } : {}),
      ...(Array.isArray(value.children) ? { children: [...value.children].sort() } : {}),
    };
  }
  if (entity === 'relationship-kind') {
    return {
      ...value,
      ...(Array.isArray(value.sourceKinds) ? { sourceKinds: [...value.sourceKinds].sort() } : {}),
      ...(Array.isArray(value.targetKinds) ? { targetKinds: [...value.targetKinds].sort() } : {}),
    };
  }
  return target;
}

function expectedOperation(
  entity: DeltaEntry['entity'],
  exists: boolean,
  removed: boolean,
  baseline: unknown,
  target: unknown,
): Operation | undefined {
  if (removed) return exists ? 'REMOVED' : undefined;
  if (!exists) return 'ADDED';
  return canonicalJson(normalizedCoverageTarget(entity, baseline)) === canonicalJson(normalizedCoverageTarget(entity, target))
    ? undefined
    : 'MODIFIED';
}

function matchingEntry(
  entries: DeltaEntry[],
  entity: DeltaEntry['entity'],
  identity: string,
  operation: Operation,
  target: unknown,
): boolean {
  const expected = canonicalJson(normalizedCoverageTarget(entity, target));
  return entries.some(entry => entry.entity === entity
    && entry.identity === identity
    && entry.operation === operation
    && (operation === 'REMOVED' || canonicalJson(normalizedCoverageTarget(entity, entry.target)) === expected));
}

function coverageErrors(
  document: ChangeStructuralDefinitionDocument,
  entries: DeltaEntry[],
): string[] {
  const baseline = baselineMaps(document.baseline);
  const errors: string[] = [];
  const check = (
    entity: DeltaEntry['entity'],
    identity: string,
    item: { operation?: 'REMOVED' },
    saved: { exists: boolean; value?: unknown } | undefined,
    target: unknown,
  ): void => {
    if (!saved) {
      errors.push(`${entity} ${identity} is missing from the saved baseline`);
      return;
    }
    const operation = expectedOperation(entity, saved.exists, item.operation === 'REMOVED', saved.value, target);
    if (operation && !matchingEntry(entries, entity, identity, operation, target)) {
      errors.push(`${entity} ${identity} requires ${operation}`);
    }
  };

  for (const item of document.payload.elementKinds) {
    check('element-kind', item.identity, item, baseline.elementKinds.get(item.identity), item);
  }
  for (const item of document.payload.relationshipKinds) {
    check('relationship-kind', item.identity, item, baseline.relationshipKinds.get(item.identity), item);
  }
  for (const item of document.payload.elements) {
    check('element-declaration', item.identity, item, baseline.elements.get(item.identity), item);
  }
  for (const item of document.payload.relationships) {
    const identity = relationshipIdentity(item);
    check('relationship', identity, item, baseline.relationships.get(identity), {
      source: item.source,
      kind: item.kind,
      target: item.target,
    });
  }
  return errors;
}

async function assertChangeDirectory(projectRoot: string, changeName: string): Promise<string> {
  const validation = validateChangeName(changeName);
  if (!validation.valid) fail('INVALID_CHANGE_NAME', validation.error ?? `Invalid change name: ${changeName}`);
  const root = path.resolve(projectRoot);
  const changesRoot = path.join(root, '.xirang', 'changes');
  const changeDir = path.resolve(changesRoot, changeName);
  const relative = path.relative(changesRoot, changeDir);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    fail('INVALID_CHANGE_PATH', `Invalid Change path: ${changeName}`);
  }
  for (const directory of [root, path.join(root, '.xirang'), changesRoot, changeDir]) {
    const stat = await fs.lstat(directory).catch(() => undefined);
    if (!stat || stat.isSymbolicLink() || !stat.isDirectory()) {
      fail('INVALID_CHANGE_PATH', `Managed Change ancestor is not a regular directory: ${directory}`);
    }
  }
  return changeDir;
}

async function destinationState(destination: string, source: Buffer): Promise<'absent' | 'identical'> {
  const stat = await fs.lstat(destination).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  });
  if (!stat) return 'absent';
  if (stat.isSymbolicLink() || !stat.isFile()) fail('INVALID_CHANGE_PATH', 'Frozen provenance path is not a regular file');
  const existing = await fs.readFile(destination);
  if (!existing.equals(source)) fail('PROVENANCE_CONFLICT', 'Frozen provenance differs from the current framing source');
  return 'identical';
}

export function verifyStructuralCoverage(
  document: ChangeStructuralDefinitionDocument,
  entries: DeltaEntry[],
): string[] {
  return coverageErrors(document, entries);
}

export async function consumeFraming(
  projectRoot: string,
  explorationId: string,
  changeName: string,
): Promise<FramingConsumeResult> {
  const source = await showFraming(projectRoot, explorationId);
  const changeDir = await assertChangeDirectory(projectRoot, changeName);
  const compiled = await compileChangeDelta(projectRoot, changeName);
  const currentFingerprint = semanticTreeFingerprint(await readSemanticTree(projectRoot));
  const drift = classifyBaselineDrift(
    source.document.metadata.semanticModelFingerprint,
    currentFingerprint,
    source.document.baseline,
    compiled.base.model,
    source.document.payload,
  );
  if (drift.status === 'relevant-drift') {
    fail('RELEVANT_DRIFT', `Relevant Semantic Model context changed: ${drift.changed.join(', ')}`);
  }
  const structural = validateStructuralDefinition(compiled.base.model, source.document.payload);
  if (!structural.valid) {
    fail('STRUCTURAL_TARGET_INVALID', structural.diagnostics.map(item => item.message).join('; '));
  }
  if (!compiled.compiled.valid) {
    fail('CHANGE_VALIDATION_FAILED', compiled.compiled.diagnostics.map(item => item.message).join('; '));
  }
  const coverage = coverageErrors(source.document, compiled.delta.entries);
  if (coverage.length > 0) fail('STRUCTURAL_COVERAGE_MISMATCH', coverage.join('; '));

  await assertChangeDirectory(projectRoot, changeName);
  const sourceStat = await fs.lstat(source.absolutePath).catch(() => undefined);
  if (!sourceStat || sourceStat.isSymbolicLink() || !sourceStat.isFile()) {
    fail('INVALID_CHANGE_PATH', `Framing source is not a regular file: ${source.absolutePath}`);
  }
  const bytes = await fs.readFile(source.absolutePath);
  const destination = path.join(changeDir, 'change-structural-definition.md');
  const state = await destinationState(destination, bytes);
  if (state === 'absent') await fs.copyFile(source.absolutePath, destination, fsConstants.COPYFILE_EXCL);
  await fs.rm(source.absolutePath);
  return {
    explorationId,
    changeName,
    path: projectRelativePosix(projectRoot, destination),
    recovered: state === 'identical',
  };
}
