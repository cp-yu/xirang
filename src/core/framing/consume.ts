import { promises as fs } from 'node:fs';
import path from 'node:path';
import { compileChangeDelta } from '../change-compiler.js';
import { validateCandidate } from '../candidate/validator.js';
import { Validator } from '../validation/validator.js';
import { validateTaskStructure } from '../parsers/task-structure.js';
import { validateChangeName } from '../../utils/change-utils.js';
import { classifyBaselineDrift } from './baseline.js';
import { FRAMING_SOURCE_FILE, projectRelativePosix } from './paths.js';
import { readFramingSemanticContext } from './validator.js';
import { showFraming } from './workspace.js';

export class FramingConsumeError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = 'FramingConsumeError';
  }
}

export interface FramingConsumeResult {
  explorationId: string;
  changeName?: string;
  candidate?: true;
  sourceVersion: string;
  path: string;
  recovered: boolean;
}

function fail(code: string, message: string): never {
  throw new FramingConsumeError(code, message);
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

type FramingTransferFileSystem = Pick<typeof fs, 'lstat' | 'readFile' | 'open' | 'rm'>;

async function destinationState(destination: string, source: Buffer, pathError: string, filesystem: FramingTransferFileSystem): Promise<'absent' | 'identical'> {
  const stat = await filesystem.lstat(destination).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  });
  if (!stat) return 'absent';
  if (stat.isSymbolicLink() || !stat.isFile()) fail(pathError, 'Frozen provenance path is not a regular file');
  const existing = await filesystem.readFile(destination);
  if (!existing.equals(source)) fail('PROVENANCE_CONFLICT', 'Frozen provenance differs from the current framing source');
  return 'identical';
}

async function validateChangeTarget(projectRoot: string, changeName: string): Promise<void> {
  const changeDir = await assertChangeDirectory(projectRoot, changeName);
  const compiled = await compileChangeDelta(projectRoot, changeName);
  const notation = await new Validator().validateChangeDeltaSpecs(changeDir);
  const tasks = await fs.readFile(path.join(changeDir, 'tasks.md'), 'utf8').catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return '';
    throw error;
  });
  const taskErrors = tasks ? validateTaskStructure(tasks, { changeDir }).issues.filter(item => item.severity === 'error') : [];
  const errors = [...compiled.compiled.diagnostics.filter(item => item.level === 'ERROR'), ...notation.issues.filter(item => item.level === 'ERROR'), ...taskErrors];
  if (errors.length) fail('CHANGE_VALIDATION_FAILED', errors.map(item => item.message).join('; '));
}

export type FramingConsumeTarget = { change: string; candidate?: never } | { candidate: true; change?: never };

async function assertCandidateDirectory(projectRoot: string): Promise<string> {
  const root = path.resolve(projectRoot);
  const candidate = path.join(root, '.xirang', 'candidate');
  for (const directory of [root, path.join(root, '.xirang'), candidate]) {
    const stat = await fs.lstat(directory).catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return undefined;
      throw error;
    });
    if (!stat || stat.isSymbolicLink() || !stat.isDirectory()) {
      fail('INVALID_CANDIDATE_PATH', `Active Candidate ancestor is not a regular directory: ${directory}`);
    }
  }
  return candidate;
}

export async function consumeFraming(
  projectRoot: string, explorationId: string, target: FramingConsumeTarget, sourceVersion: string,
  filesystem: FramingTransferFileSystem = fs,
): Promise<FramingConsumeResult> {
  const source = await showFraming(projectRoot, explorationId);
  if (!sourceVersion || source.sourceVersion !== sourceVersion) fail('SOURCE_VERSION_MISMATCH', 'Reload the current source and repeat coverage review before consuming');
  if (!target || !((typeof target.change === 'string' && target.candidate === undefined)
    || (target.candidate === true && target.change === undefined))) {
    fail('INVALID_CONSUME_TARGET', 'Select exactly one explicit target: named Change or active Candidate');
  }
  const isCandidate = target.candidate === true;
  if (source.document.payload.context !== (isCandidate ? 'build' : 'change')) fail('CONTEXT_MISMATCH', 'Build and Change records use separate formation contexts');
  const targetDirectory = () => isCandidate
    ? assertCandidateDirectory(projectRoot)
    : assertChangeDirectory(projectRoot, target.change!);
  const validateTarget = async () => {
    await targetDirectory();
    if (isCandidate) {
      const validation = await validateCandidate(projectRoot);
      if (!validation.valid) fail('CANDIDATE_VALIDATION_FAILED', validation.diagnostics.filter(item => item.level === 'ERROR').map(item => item.message).join('; '));
    } else {
      await validateChangeTarget(projectRoot, target.change!);
    }
  };
  const checkSource = async () => {
    const current = await showFraming(projectRoot, explorationId);
    if (current.sourceVersion !== sourceVersion) fail('SOURCE_VERSION_MISMATCH', 'Framing source changed during consumption');
    const context = await readFramingSemanticContext(projectRoot, source.document.payload.context);
    const drift = classifyBaselineDrift(source.document.metadata.semanticModelFingerprint, context.semanticModelFingerprint, source.document.baseline, context.model, source.document.payload);
    if (drift.status === 'relevant-drift') fail('RELEVANT_DRIFT', `Related Semantic Model context changed: ${drift.changed.join(', ')}`);
  };
  await checkSource();
  const directory = await targetDirectory();
  const bytes = source.bytes;
  const destination = path.join(directory, FRAMING_SOURCE_FILE);
  const pathError = isCandidate ? 'INVALID_CANDIDATE_PATH' : 'INVALID_CHANGE_PATH';
  const state = await destinationState(destination, bytes, pathError, filesystem);
  await validateTarget();
  await checkSource();
  let created = false;
  try {
    if (state === 'absent') {
      const file = await filesystem.open(destination, 'wx');
      created = true;
      try { await file.writeFile(bytes); } finally { await file.close(); }
    }
    await validateTarget();
    await checkSource();
    if (await destinationState(destination, bytes, pathError, filesystem) !== 'identical') {
      fail('PROVENANCE_MISSING', 'Frozen provenance disappeared before source cleanup; retain the active record and retry');
    }
    await filesystem.rm(source.absolutePath);
  } catch (error) {
    if (created) await filesystem.rm(destination, { force: true });
    throw error;
  }
  return {
    explorationId,
    ...(isCandidate ? { candidate: true as const } : { changeName: target.change }),
    sourceVersion, path: projectRelativePosix(projectRoot, destination), recovered: state === 'identical',
  };
}
