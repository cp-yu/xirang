import { createHash, randomBytes } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { canonicalJson } from '../semantic-diff.js';
import { captureRelevantBaseline } from './baseline.js';
import { normalizeRecordPayload, parseDesignRecord, renderDesignRecord } from './document.js';
import {
  assertContainedPath,
  recordRoot,
  managedRecordFilename,
  managedRecordPath,
  projectRelativePosix,
  validateExplorationId,
  validateRecordSlug,
} from './paths.js';
import { applyRecordPatch, assertRecordStructure, compareStructure, diffStructure, summarizeRecord } from './structure.js';
import type { DerivedStructureObject, DesignRecordDocument, DesignRecordInput, DesignRecordPayload, RecordPayloadDiff, RecordSummary } from './types.js';
import type { SemanticModel } from '../model/types.js';

const MANAGED_FILE = /^(.+)-(\d{8}T\d{6}Z-[a-f0-9]{8})\.md$/;

export type RecordWorkspaceErrorCode =
  | 'RECORD_NOT_FOUND'
  | 'DUPLICATE_EXPLORATION_ID'
  | 'EMPTY_PAYLOAD'
  | 'UNSAFE_MANAGED_PATH'
  | 'MANAGED_PATH_CONFLICT'
  | 'FILENAME_METADATA_MISMATCH'
  | 'UNSUPPORTED_RECORD_VERSION'
  | 'SOURCE_VERSION_STALE';

export class RecordWorkspaceError extends Error {
  constructor(public readonly code: RecordWorkspaceErrorCode, message: string, public readonly details?: Record<string, unknown>) {
    super(message);
    this.name = 'RecordWorkspaceError';
  }
}

export interface RecordSemanticContext {
  model: SemanticModel | null;
  semanticModelFingerprint: string;
}

export interface RecordIdentityGeneration {
  now?: Date;
  randomHex?: string;
}

export interface RecordWorkspaceRecord {
  path: string;
  absolutePath: string;
  sourceVersion: string;
  bytes: Buffer;
  document: DesignRecordDocument;
}

export interface RecordUpdateResult {
  record: RecordWorkspaceRecord;
  diff: RecordPayloadDiff;
  derived: DerivedStructureObject[];
  summary: RecordSummary;
}

function workspaceError(code: RecordWorkspaceErrorCode, message: string, details?: Record<string, unknown>): never {
  throw new RecordWorkspaceError(code, message, details);
}

async function lstat(target: string): Promise<Awaited<ReturnType<typeof fs.lstat>> | undefined> {
  return fs.lstat(target).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  });
}

async function ensureDirectory(target: string): Promise<void> {
  const stat = await lstat(target);
  if (stat) {
    if (stat.isSymbolicLink() || !stat.isDirectory()) {
      workspaceError('UNSAFE_MANAGED_PATH', `Managed directory is not a regular directory: ${target}`);
    }
    return;
  }
  await fs.mkdir(target);
}

async function assertProjectRoot(projectRoot: string): Promise<string> {
  const root = path.resolve(projectRoot);
  const rootStat = await lstat(root);
  if (!rootStat?.isDirectory() || rootStat.isSymbolicLink()) {
    workspaceError('UNSAFE_MANAGED_PATH', `Project root is not a regular directory: ${root}`);
  }
  return root;
}

async function inspectDirectory(target: string): Promise<string | undefined> {
  const stat = await lstat(target);
  if (!stat) return undefined;
  if (stat.isSymbolicLink() || !stat.isDirectory()) {
    workspaceError('UNSAFE_MANAGED_PATH', `Managed directory is not a regular directory: ${target}`);
  }
  return target;
}

async function inspectRecordRoot(projectRoot: string): Promise<string | undefined> {
  const root = await assertProjectRoot(projectRoot);
  const xirang = await inspectDirectory(path.join(root, '.xirang'));
  if (!xirang) return undefined;
  return inspectDirectory(path.join(xirang, 'records'));
}

async function ensureRecordRoot(projectRoot: string): Promise<string> {
  const root = await assertProjectRoot(projectRoot);
  const xirang = path.join(root, '.xirang');
  await ensureDirectory(xirang);
  const changes = path.join(xirang, 'records');
  await ensureDirectory(changes);
  return changes;
}

function timestamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function createExplorationId(generation: RecordIdentityGeneration): string {
  const suffix = generation.randomHex ?? randomBytes(4).toString('hex');
  return validateExplorationId(`${timestamp(generation.now ?? new Date())}-${suffix}`);
}

export function diffRecordPayloads(
  previous: DesignRecordPayload,
  next: DesignRecordPayload,
): RecordPayloadDiff {
  const before = new Map(previous.entries.map(item => [item.identity, item]));
  const after = new Map(next.entries.map(item => [item.identity, item]));
  return {
    entries: {
      added: next.entries.filter(item => !before.has(item.identity)),
      modified: previous.entries.flatMap(item => {
        const updated = after.get(item.identity);
        return updated && canonicalJson(item) !== canonicalJson(updated)
          ? [{ identity: item.identity, before: item, after: updated }] : [];
      }),
      removed: previous.entries.filter(item => !after.has(item.identity)),
    },
    structure: diffStructure(previous.structure, next.structure),
  };
}

async function assertRegularFile(target: string): Promise<void> {
  const stat = await lstat(target);
  if (!stat || stat.isSymbolicLink() || !stat.isFile()) {
    workspaceError('UNSAFE_MANAGED_PATH', `Managed path is not a regular file: ${target}`);
  }
}

function parsedFilename(filename: string): { slug: string; explorationId: string } | undefined {
  const match = filename.match(MANAGED_FILE);
  if (!match) return undefined;
  return { slug: match[1], explorationId: match[2] };
}

async function readRecord(projectRoot: string, changesRoot: string, filename: string): Promise<RecordWorkspaceRecord> {
  const parsed = parsedFilename(filename);
  if (!parsed) workspaceError('UNSAFE_MANAGED_PATH', `Invalid managed record filename: ${filename}`);
  const absolutePath = assertContainedPath(changesRoot, path.join(changesRoot, filename));
  await assertRegularFile(absolutePath);
  const bytes = await fs.readFile(absolutePath);
  const document = parseDesignRecord(bytes.toString('utf8'));
  if (document.metadata.slug !== parsed.slug || document.metadata.explorationId !== parsed.explorationId) {
    workspaceError('FILENAME_METADATA_MISMATCH', `Managed filename does not match document metadata: ${filename}`);
  }
  return { path: projectRelativePosix(projectRoot, absolutePath), absolutePath, bytes, document, sourceVersion: createHash('sha256').update(bytes).digest('hex') };
}

async function atomicWrite(target: string, content: string): Promise<void> {
  const temporary = path.join(path.dirname(target), `.record-${path.basename(target)}-${process.pid}-${randomBytes(4).toString('hex')}.tmp`);
  assertContainedPath(path.dirname(target), temporary);
  try {
    await fs.writeFile(temporary, content, { encoding: 'utf8', flag: 'wx' });
    await fs.rename(temporary, target);
  } finally {
    await fs.rm(temporary, { force: true });
  }
}

export async function listRecords(projectRoot: string): Promise<RecordWorkspaceRecord[]> {
  const root = await assertProjectRoot(projectRoot);
  const xirang = await inspectDirectory(path.join(root, '.xirang'));
  if (xirang) {
    const legacy = await inspectDirectory(path.join(xirang, 'changes'));
    if (legacy && (await fs.readdir(legacy)).some(name => name.startsWith('.explore-'))) {
      workspaceError('UNSUPPORTED_RECORD_VERSION', 'Legacy structural records require explicit user handling; no files were migrated or deleted');
    }
  }
  const changesRoot = await inspectRecordRoot(projectRoot);
  if (!changesRoot) return [];
  const entries = await fs.readdir(changesRoot, { withFileTypes: true });
  const records: RecordWorkspaceRecord[] = [];
  for (const entry of entries) {
    if (!entry.name.endsWith('.md')) continue;
    if (entry.isSymbolicLink() || !entry.isFile()) {
      workspaceError('UNSAFE_MANAGED_PATH', `Managed path is not a regular file: ${entry.name}`);
    }
    records.push(await readRecord(path.resolve(projectRoot), changesRoot, entry.name));
  }
  records.sort((left, right) => left.document.metadata.explorationId.localeCompare(right.document.metadata.explorationId));
  const identities = new Set<string>();
  for (const record of records) {
    const identity = record.document.metadata.explorationId;
    if (identities.has(identity)) {
      workspaceError('DUPLICATE_EXPLORATION_ID', `Duplicate exploration identity: ${identity}`);
    }
    identities.add(identity);
  }
  return records;
}

export async function showRecord(projectRoot: string, explorationId: string): Promise<RecordWorkspaceRecord> {
  validateExplorationId(explorationId);
  const match = (await listRecords(projectRoot)).find(record => record.document.metadata.explorationId === explorationId);
  if (!match) workspaceError('RECORD_NOT_FOUND', `Record exploration not found: ${explorationId}`);
  return match;
}

export async function createRecord(
  projectRoot: string,
  slug: string,
  input: DesignRecordInput,
  context: RecordSemanticContext,
  generation: RecordIdentityGeneration = {},
): Promise<RecordWorkspaceRecord> {
  validateRecordSlug(slug);
  const payload = normalizeRecordPayload(input);
  assertRecordStructure(payload.structure, context.model);
  const changesRoot = await ensureRecordRoot(projectRoot);
  const explorationId = createExplorationId(generation);
  if ((await listRecords(projectRoot)).some(record => record.document.metadata.explorationId === explorationId)) {
    workspaceError('DUPLICATE_EXPLORATION_ID', `Duplicate exploration identity: ${explorationId}`);
  }
  const absolutePath = managedRecordPath(projectRoot, slug, explorationId);
  assertContainedPath(changesRoot, absolutePath);
  if (await lstat(absolutePath)) workspaceError('MANAGED_PATH_CONFLICT', `Managed record path already exists: ${absolutePath}`);
  const document: DesignRecordDocument = {
    metadata: {
      entity: 'confirmed-design-record',
      explorationId,
      slug,
      semanticModelFingerprint: context.semanticModelFingerprint,
    },
    payload,
    baseline: captureRelevantBaseline(context.model, payload),
  };
  await atomicWrite(absolutePath, renderDesignRecord(document));
  return readRecord(path.resolve(projectRoot), changesRoot, managedRecordFilename(slug, explorationId));
}

export async function updateRecord(
  projectRoot: string,
  explorationId: string,
  patch: unknown,
  sourceVersion: string,
  context: RecordSemanticContext,
): Promise<RecordUpdateResult> {
  const current = await showRecord(projectRoot, explorationId);
  if (current.sourceVersion !== sourceVersion) {
    workspaceError('SOURCE_VERSION_STALE', 'Record changed since the provided source version; reload and resubmit the patch', { currentSourceVersion: current.sourceVersion });
  }
  const payload = applyRecordPatch(current.document.payload, patch);
  assertRecordStructure(payload.structure, context.model);
  const document: DesignRecordDocument = {
    metadata: { ...current.document.metadata, semanticModelFingerprint: context.semanticModelFingerprint },
    payload,
    baseline: captureRelevantBaseline(context.model, payload),
  };
  await atomicWrite(current.absolutePath, renderDesignRecord(document));
  return {
    record: await showRecord(projectRoot, explorationId),
    diff: diffRecordPayloads(current.document.payload, payload),
    derived: compareStructure(payload.structure, context.model),
    summary: summarizeRecord(payload),
  };
}

export async function renameRecord(
  projectRoot: string,
  explorationId: string,
  slug: string,
): Promise<RecordWorkspaceRecord> {
  validateRecordSlug(slug);
  const current = await showRecord(projectRoot, explorationId);
  const changesRoot = recordRoot(projectRoot);
  const target = managedRecordPath(projectRoot, slug, explorationId);
  assertContainedPath(changesRoot, target);
  if (target !== current.absolutePath && await lstat(target)) {
    workspaceError('MANAGED_PATH_CONFLICT', `Managed record path already exists: ${target}`);
  }
  const document = { ...current.document, metadata: { ...current.document.metadata, slug } };
  if (target === current.absolutePath) {
    await atomicWrite(target, renderDesignRecord(document));
  } else {
    await atomicWrite(target, renderDesignRecord(document));
    await fs.rm(current.absolutePath);
  }
  return showRecord(projectRoot, explorationId);
}

export async function discardRecord(projectRoot: string, explorationId: string): Promise<void> {
  const current = await showRecord(projectRoot, explorationId);
  await fs.rm(current.absolutePath);
}
