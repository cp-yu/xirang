import { promises as fs } from 'node:fs';
import path from 'node:path';
import { compileChangeDelta } from '../change-compiler.js';
import { validateCandidate } from '../candidate/validator.js';
import { Validator } from '../validation/validator.js';
import { validateTaskStructure } from '../parsers/task-structure.js';
import { classifyBaselineDrift } from './baseline.js';
import { assertCandidateDirectory, assertChangeDirectory, assertCoverageGate, assertExplicitTarget, gateFail, type RecordTarget } from './coverage.js';
import { RECORD_SOURCE_FILE, projectRelativePosix } from './paths.js';
import { readRecordSemanticContext } from './validator.js';
import { showRecord } from './workspace.js';

export interface RecordConsumeResult {
  explorationId: string;
  changeName?: string;
  candidate?: true;
  sourceVersion: string;
  path: string;
  recovered: boolean;
}

const fail = gateFail;

type RecordTransferFileSystem = Pick<typeof fs, 'lstat' | 'readFile' | 'open' | 'rm'>;

async function destinationState(destination: string, source: Buffer, pathError: string, filesystem: RecordTransferFileSystem): Promise<'absent' | 'identical'> {
  const stat = await filesystem.lstat(destination).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  });
  if (!stat) return 'absent';
  if (stat.isSymbolicLink() || !stat.isFile()) fail(pathError, 'Frozen provenance path is not a regular file');
  const existing = await filesystem.readFile(destination);
  if (!existing.equals(source)) fail('PROVENANCE_CONFLICT', 'Frozen provenance differs from the current record source');
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
  const taskErrors = tasks ? validateTaskStructure(tasks).issues.filter(item => item.severity === 'error') : [];
  const errors = [...compiled.compiled.diagnostics.filter(item => item.level === 'ERROR'), ...notation.issues.filter(item => item.level === 'ERROR'), ...taskErrors];
  if (errors.length) fail('CHANGE_VALIDATION_FAILED', errors.map(item => item.message).join('; '));
}

export type RecordConsumeTarget = RecordTarget;

export async function consumeRecord(
  projectRoot: string, explorationId: string, target: RecordConsumeTarget, sourceVersion: string,
  filesystem: RecordTransferFileSystem = fs,
): Promise<RecordConsumeResult> {
  const source = await showRecord(projectRoot, explorationId);
  if (!sourceVersion || source.sourceVersion !== sourceVersion) fail('SOURCE_VERSION_MISMATCH', 'Reload the current source and repeat coverage review before consuming');
  const isCandidate = assertExplicitTarget(target);
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
    await assertCoverageGate(projectRoot, explorationId, target, sourceVersion, source.document.payload.structure);
  };
  const checkSource = async () => {
    const current = await showRecord(projectRoot, explorationId);
    if (current.sourceVersion !== sourceVersion) fail('SOURCE_VERSION_MISMATCH', 'Record source changed during consumption');
    const context = await readRecordSemanticContext(projectRoot, source.document.payload.context);
    const drift = classifyBaselineDrift(source.document.metadata.semanticModelFingerprint, context.semanticModelFingerprint, source.document.baseline, context.model, source.document.payload);
    if (drift.status === 'relevant-drift') fail('RELEVANT_DRIFT', `Related Semantic Model context changed: ${drift.changed.join(', ')}`);
  };
  await checkSource();
  const directory = await targetDirectory();
  const bytes = source.bytes;
  const destination = path.join(directory, RECORD_SOURCE_FILE);
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
