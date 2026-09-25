import { createHash, randomBytes } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { canonicalJson } from '../semantic-diff.js';
import { captureRelevantBaseline } from './baseline.js';
import { normalizeFramingPayload, parseChangeStructuralDefinition, renderChangeStructuralDefinition } from './document.js';
import {
  assertContainedPath,
  framingRoot,
  managedFramingFilename,
  managedFramingPath,
  projectRelativePosix,
  validateExplorationId,
  validateFramingSlug,
} from './paths.js';
import type { ChangeStructuralDefinitionDocument, ChangeStructuralDefinitionPayload, FramingPayloadDiff } from './types.js';
import type { SemanticModel } from '../model/types.js';

const MANAGED_FILE = /^(.+)-(\d{8}T\d{6}Z-[a-f0-9]{8})\.md$/;

export type FramingWorkspaceErrorCode =
  | 'FRAMING_NOT_FOUND'
  | 'DUPLICATE_EXPLORATION_ID'
  | 'EMPTY_PAYLOAD'
  | 'UNSAFE_MANAGED_PATH'
  | 'MANAGED_PATH_CONFLICT'
  | 'FILENAME_METADATA_MISMATCH'
  | 'UNSUPPORTED_FRAMING_VERSION'
  | 'CONTEXT_MISMATCH';

export class FramingWorkspaceError extends Error {
  constructor(public readonly code: FramingWorkspaceErrorCode, message: string) {
    super(message);
    this.name = 'FramingWorkspaceError';
  }
}

export interface FramingSemanticContext {
  model: SemanticModel | null;
  semanticModelFingerprint: string;
}

export interface FramingIdentityGeneration {
  now?: Date;
  randomHex?: string;
}

export interface FramingWorkspaceRecord {
  path: string;
  absolutePath: string;
  sourceVersion: string;
  bytes: Buffer;
  document: ChangeStructuralDefinitionDocument;
}

export interface FramingUpdateResult {
  record: FramingWorkspaceRecord;
  diff: FramingPayloadDiff;
}

function workspaceError(code: FramingWorkspaceErrorCode, message: string): never {
  throw new FramingWorkspaceError(code, message);
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

async function inspectFramingRoot(projectRoot: string): Promise<string | undefined> {
  const root = await assertProjectRoot(projectRoot);
  const xirang = await inspectDirectory(path.join(root, '.xirang'));
  if (!xirang) return undefined;
  return inspectDirectory(path.join(xirang, 'framing'));
}

async function ensureFramingRoot(projectRoot: string): Promise<string> {
  const root = await assertProjectRoot(projectRoot);
  const xirang = path.join(root, '.xirang');
  await ensureDirectory(xirang);
  const changes = path.join(xirang, 'framing');
  await ensureDirectory(changes);
  return changes;
}

function timestamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function createExplorationId(generation: FramingIdentityGeneration): string {
  const suffix = generation.randomHex ?? randomBytes(4).toString('hex');
  return validateExplorationId(`${timestamp(generation.now ?? new Date())}-${suffix}`);
}

export function diffFramingPayloads(
  previous: ChangeStructuralDefinitionPayload,
  next: ChangeStructuralDefinitionPayload,
): FramingPayloadDiff {
  const before = new Map(previous.entries.map(item => [item.identity, item]));
  const after = new Map(next.entries.map(item => [item.identity, item]));
  return {
    added: next.entries.filter(item => !before.has(item.identity)),
    modified: previous.entries.flatMap(item => {
      const updated = after.get(item.identity);
      return updated && canonicalJson(item) !== canonicalJson(updated)
        ? [{ identity: item.identity, before: item, after: updated }] : [];
    }),
    removed: previous.entries.filter(item => !after.has(item.identity)),
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

async function readRecord(projectRoot: string, changesRoot: string, filename: string): Promise<FramingWorkspaceRecord> {
  const parsed = parsedFilename(filename);
  if (!parsed) workspaceError('UNSAFE_MANAGED_PATH', `Invalid managed framing filename: ${filename}`);
  const absolutePath = assertContainedPath(changesRoot, path.join(changesRoot, filename));
  await assertRegularFile(absolutePath);
  const bytes = await fs.readFile(absolutePath);
  const document = parseChangeStructuralDefinition(bytes.toString('utf8'));
  if (document.metadata.slug !== parsed.slug || document.metadata.explorationId !== parsed.explorationId) {
    workspaceError('FILENAME_METADATA_MISMATCH', `Managed filename does not match document metadata: ${filename}`);
  }
  return { path: projectRelativePosix(projectRoot, absolutePath), absolutePath, bytes, document, sourceVersion: createHash('sha256').update(bytes).digest('hex') };
}

async function atomicWrite(target: string, content: string): Promise<void> {
  const temporary = path.join(path.dirname(target), `.framing-${path.basename(target)}-${process.pid}-${randomBytes(4).toString('hex')}.tmp`);
  assertContainedPath(path.dirname(target), temporary);
  try {
    await fs.writeFile(temporary, content, { encoding: 'utf8', flag: 'wx' });
    await fs.rename(temporary, target);
  } finally {
    await fs.rm(temporary, { force: true });
  }
}

export async function listFramings(projectRoot: string): Promise<FramingWorkspaceRecord[]> {
  const root = await assertProjectRoot(projectRoot);
  const xirang = await inspectDirectory(path.join(root, '.xirang'));
  if (xirang) {
    const legacy = await inspectDirectory(path.join(xirang, 'changes'));
    if (legacy && (await fs.readdir(legacy)).some(name => name.startsWith('.explore-'))) {
      workspaceError('UNSUPPORTED_FRAMING_VERSION', 'Legacy structural records require explicit user handling; no files were migrated or deleted');
    }
  }
  const changesRoot = await inspectFramingRoot(projectRoot);
  if (!changesRoot) return [];
  const entries = await fs.readdir(changesRoot, { withFileTypes: true });
  const records: FramingWorkspaceRecord[] = [];
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

export async function showFraming(projectRoot: string, explorationId: string): Promise<FramingWorkspaceRecord> {
  validateExplorationId(explorationId);
  const match = (await listFramings(projectRoot)).find(record => record.document.metadata.explorationId === explorationId);
  if (!match) workspaceError('FRAMING_NOT_FOUND', `Framing exploration not found: ${explorationId}`);
  return match;
}

export async function createFraming(
  projectRoot: string,
  slug: string,
  payload: ChangeStructuralDefinitionPayload,
  context: FramingSemanticContext,
  generation: FramingIdentityGeneration = {},
): Promise<FramingWorkspaceRecord> {
  validateFramingSlug(slug);
  payload = normalizeFramingPayload(payload);
  const changesRoot = await ensureFramingRoot(projectRoot);
  const explorationId = createExplorationId(generation);
  if ((await listFramings(projectRoot)).some(record => record.document.metadata.explorationId === explorationId)) {
    workspaceError('DUPLICATE_EXPLORATION_ID', `Duplicate exploration identity: ${explorationId}`);
  }
  const absolutePath = managedFramingPath(projectRoot, slug, explorationId);
  assertContainedPath(changesRoot, absolutePath);
  if (await lstat(absolutePath)) workspaceError('MANAGED_PATH_CONFLICT', `Managed framing path already exists: ${absolutePath}`);
  const document: ChangeStructuralDefinitionDocument = {
    metadata: {
      entity: 'confirmed-design-record',
      explorationId,
      slug,
      semanticModelFingerprint: context.semanticModelFingerprint,
    },
    payload,
    baseline: captureRelevantBaseline(context.model, payload),
  };
  await atomicWrite(absolutePath, renderChangeStructuralDefinition(document));
  return readRecord(path.resolve(projectRoot), changesRoot, managedFramingFilename(slug, explorationId));
}

export async function updateFraming(
  projectRoot: string,
  explorationId: string,
  payload: ChangeStructuralDefinitionPayload,
  context: FramingSemanticContext,
): Promise<FramingUpdateResult> {
  payload = normalizeFramingPayload(payload);
  const current = await showFraming(projectRoot, explorationId);
  if (payload.context !== current.document.payload.context) workspaceError('CONTEXT_MISMATCH', 'Formation context is immutable; create a separate record');
  const document: ChangeStructuralDefinitionDocument = {
    metadata: { ...current.document.metadata, semanticModelFingerprint: context.semanticModelFingerprint },
    payload,
    baseline: captureRelevantBaseline(context.model, payload),
  };
  await atomicWrite(current.absolutePath, renderChangeStructuralDefinition(document));
  return { record: await showFraming(projectRoot, explorationId), diff: diffFramingPayloads(current.document.payload, payload) };
}

export async function renameFraming(
  projectRoot: string,
  explorationId: string,
  slug: string,
): Promise<FramingWorkspaceRecord> {
  validateFramingSlug(slug);
  const current = await showFraming(projectRoot, explorationId);
  const changesRoot = framingRoot(projectRoot);
  const target = managedFramingPath(projectRoot, slug, explorationId);
  assertContainedPath(changesRoot, target);
  if (target !== current.absolutePath && await lstat(target)) {
    workspaceError('MANAGED_PATH_CONFLICT', `Managed framing path already exists: ${target}`);
  }
  const document = { ...current.document, metadata: { ...current.document.metadata, slug } };
  if (target === current.absolutePath) {
    await atomicWrite(target, renderChangeStructuralDefinition(document));
  } else {
    await atomicWrite(target, renderChangeStructuralDefinition(document));
    await fs.rm(current.absolutePath);
  }
  return showFraming(projectRoot, explorationId);
}

export async function discardFraming(projectRoot: string, explorationId: string): Promise<void> {
  const current = await showFraming(projectRoot, explorationId);
  await fs.rm(current.absolutePath);
}
