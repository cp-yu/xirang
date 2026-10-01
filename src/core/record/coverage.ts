import { createHash, randomBytes } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { compileChangeDelta } from '../change-compiler.js';
import { parseSemanticModelFiles, readModelTree } from '../model/parser.js';
import { relationshipIdentity, type SemanticModel } from '../model/types.js';
import { canonicalJson, semanticModelFingerprint } from '../semantic-diff.js';
import { validateChangeName } from '../../utils/change-utils.js';
import { projectRelativePosix, RECORD_COVERAGE_FILE } from './paths.js';
import { compareStructure, refLabel } from './structure.js';
import type { DerivedStructureObject, DesignRecordPayload, RecordStructure } from './types.js';
import { showRecord } from './workspace.js';

export type RecordTarget = { change: string; candidate?: never } | { candidate: true; change?: never };

export interface RecordGateDiagnostic {
  severity: 'ERROR';
  code: string;
  message: string;
  identity: string;
  field?: string;
}

export class RecordGateError extends Error {
  constructor(public readonly code: string, message: string, public readonly diagnostics: RecordGateDiagnostic[] = []) {
    super(message);
    this.name = 'RecordGateError';
  }
}

export function gateFail(code: string, message: string, diagnostics?: RecordGateDiagnostic[]): never {
  throw new RecordGateError(code, message, diagnostics);
}

export function assertExplicitTarget(target: RecordTarget): boolean {
  if (!target || !((typeof target.change === 'string' && target.candidate === undefined)
    || (target.candidate === true && target.change === undefined))) {
    gateFail('INVALID_CONSUME_TARGET', 'Select exactly one explicit target: named Change or active Candidate');
  }
  return target.candidate === true;
}

async function assertRegularDirectories(directories: string[], code: string, label: string): Promise<void> {
  for (const directory of directories) {
    const stat = await fs.lstat(directory).catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return undefined;
      throw error;
    });
    if (!stat || stat.isSymbolicLink() || !stat.isDirectory()) gateFail(code, `${label} ancestor is not a regular directory: ${directory}`);
  }
}

export async function assertChangeDirectory(projectRoot: string, changeName: string): Promise<string> {
  const validation = validateChangeName(changeName);
  if (!validation.valid) gateFail('INVALID_CHANGE_NAME', validation.error ?? `Invalid change name: ${changeName}`);
  const root = path.resolve(projectRoot);
  const changesRoot = path.join(root, '.xirang', 'changes');
  const changeDir = path.resolve(changesRoot, changeName);
  const relative = path.relative(changesRoot, changeDir);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) gateFail('INVALID_CHANGE_PATH', `Invalid Change path: ${changeName}`);
  await assertRegularDirectories([root, path.join(root, '.xirang'), changesRoot, changeDir], 'INVALID_CHANGE_PATH', 'Managed Change');
  return changeDir;
}

export async function assertCandidateDirectory(projectRoot: string): Promise<string> {
  const root = path.resolve(projectRoot);
  const candidate = path.join(root, '.xirang', 'candidate');
  await assertRegularDirectories([root, path.join(root, '.xirang'), candidate], 'INVALID_CANDIDATE_PATH', 'Active Candidate');
  return candidate;
}

interface TargetModel { directory: string; model: SemanticModel; fingerprint: string }

/** Change: Expected Semantic Model (formal model + Delta); Candidate: its four partitions. Plan files never participate. */
async function readTargetModel(projectRoot: string, target: RecordTarget): Promise<TargetModel> {
  if (target.candidate === true) {
    const directory = await assertCandidateDirectory(projectRoot);
    const parsed = parseSemanticModelFiles([...await readModelTree(directory)].map(([name, bytes]) => [name, bytes.toString('utf8')] as const));
    const errors = parsed.diagnostics.filter(item => item.level === 'ERROR');
    if (errors.length) gateFail('CANDIDATE_VALIDATION_FAILED', errors.map(item => item.message).join('; '));
    return { directory, model: parsed.model, fingerprint: fingerprint('candidate', parsed.model) };
  }
  const directory = await assertChangeDirectory(projectRoot, target.change!);
  const compiled = (await compileChangeDelta(projectRoot, target.change!)).compiled;
  if (!compiled.target) gateFail('CHANGE_VALIDATION_FAILED', compiled.diagnostics.filter(item => item.level === 'ERROR').map(item => item.message).join('; '));
  return { directory, model: compiled.target, fingerprint: fingerprint('change', compiled.target) };
}

function fingerprint(kind: 'change' | 'candidate', model: SemanticModel): string {
  return createHash('sha256').update(`${kind}\u0000${semanticModelFingerprint(model)}`).digest('hex');
}

type Location =
  | { element: string; section?: string; acceptanceCase?: string }
  | { relationship: { source: string; kind: string; target: string } }
  | { elementKind: string }
  | { relationshipKind: string }
  | { view: string };

interface CoverageDetail { detail: string; location?: Location; quote?: string; uncovered?: string }
interface CoverageEntry { identity: string; details: CoverageDetail[] }

function object(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

function nonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function locationShape(value: unknown): boolean {
  const data = object(value);
  if (!data) return false;
  const keys = Object.keys(data).sort().join(',');
  if (keys === 'element' || keys === 'element,section') return Object.values(data).every(nonEmpty);
  if (keys === 'acceptanceCase,element,section') return Object.values(data).every(nonEmpty);
  if (keys === 'relationship') {
    const relation = object(data.relationship);
    return !!relation && Object.keys(relation).sort().join(',') === 'kind,source,target' && Object.values(relation).every(nonEmpty);
  }
  return ['elementKind', 'relationshipKind', 'view'].includes(keys) && nonEmpty(data[keys]);
}

/** Text at an Element location, or undefined when the location does not exist. */
function locationText(model: SemanticModel, location: { element: string; section?: string; acceptanceCase?: string }): string | undefined {
  const element = model.elements.find(item => item.declaration.identity === location.element);
  if (!element) return undefined;
  if (location.section === undefined) return `${element.declaration.title}\n${element.declaration.definition}`;
  const section = element.sections.find(item => item.name === location.section);
  if (!section) return undefined;
  const cases = section.acceptanceCases;
  if (location.acceptanceCase === undefined) return [section.body, ...cases.flatMap(item => [item.name, item.body])].join('\n');
  const found = cases.find(item => item.name === location.acceptanceCase);
  return found && `${found.name}\n${found.body}`;
}

/** Ignores whitespace and Markdown emphasis so a faithful excerpt matches regardless of layout. */
function comparableText(value: string): string {
  return value.replace(/[*_`]/g, '').replace(/\s+/g, '');
}

function resolves(model: SemanticModel, location: Location): boolean {
  if ('element' in location) return locationText(model, location) !== undefined;
  if ('relationship' in location) return model.relationships.some(item => relationshipIdentity(item) === relationshipIdentity(location.relationship));
  if ('elementKind' in location) return model.elementKinds.some(item => item.identity === location.elementKind);
  if ('relationshipKind' in location) return model.relationshipKinds.some(item => item.identity === location.relationshipKind);
  return model.views.some(item => item.identity === location.view);
}

function checkCoverage(payload: DesignRecordPayload, model: SemanticModel, input: unknown): { entries: CoverageEntry[]; diagnostics: RecordGateDiagnostic[] } {
  const diagnostics: RecordGateDiagnostic[] = [];
  const report = (code: string, identity: string, message: string) => diagnostics.push({ severity: 'ERROR', code, identity, message });
  const data = object(input);
  if (!data || Object.keys(data).join(',') !== 'entries' || !Array.isArray(data.entries)) {
    report('INVALID_COVERAGE_INPUT', 'coverage', 'Coverage input must be { entries: [...] }');
    return { entries: [], diagnostics };
  }
  const recorded = new Map(payload.entries.map(item => [item.identity, item]));
  const seen = new Set<string>();
  const entries: CoverageEntry[] = [];
  for (const raw of data.entries) {
    const entry = object(raw);
    if (!entry || Object.keys(entry).sort().join(',') !== 'details,identity' || !nonEmpty(entry.identity) || !Array.isArray(entry.details)) {
      report('INVALID_COVERAGE_INPUT', 'coverage', 'Each coverage entry must be { identity, details: [...] }');
      continue;
    }
    const identity = entry.identity;
    if (seen.has(identity)) report('INVALID_COVERAGE_INPUT', identity, 'Duplicate coverage entry');
    seen.add(identity);
    if (!recorded.has(identity)) report('COVERAGE_ENTRY_UNKNOWN', identity, 'Coverage entry is not in the record');
    if (!entry.details.length) report('COVERAGE_DETAILS_EMPTY', identity, 'Coverage entry must list at least one atomic detail');
    entry.details.forEach((rawDetail, index) => {
      const detail = object(rawDetail);
      const keys = detail ? Object.keys(detail).sort().join(',') : '';
      const elementLocation = !!object(detail?.location) && 'element' in (detail!.location as object);
      const expected = elementLocation ? 'detail,location,quote' : 'detail,location';
      if (!detail || !nonEmpty(detail.detail) || !(keys === expected || keys === 'detail,uncovered')) {
        report('INVALID_COVERAGE_INPUT', identity, `Detail ${index + 1} must be { detail, location, quote } for an Element location, { detail, location } otherwise, or { detail, uncovered }`);
      } else if (keys === 'detail,uncovered') {
        report('COVERAGE_DETAIL_UNCOVERED', identity, `Detail "${detail.detail}" is uncovered: ${String(detail.uncovered)}`);
      } else if (!locationShape(detail.location) || (elementLocation && !nonEmpty(detail.quote))) {
        report('INVALID_COVERAGE_INPUT', identity, `Detail "${detail.detail}" has an invalid location or empty quote`);
      } else if (!resolves(model, detail.location as Location)) {
        report('COVERAGE_LOCATION_UNRESOLVED', identity, `Detail "${detail.detail}" points to a location absent from the target: ${canonicalJson(detail.location)}`);
      } else if (elementLocation && !comparableText(locationText(model, detail.location as { element: string })!).includes(comparableText(detail.quote as string))) {
        report('COVERAGE_QUOTE_NOT_FOUND', identity, `Detail "${detail.detail}" quote does not appear at ${canonicalJson(detail.location)}: ${String(detail.quote)}`);
      }
    });
    entries.push(entry as unknown as CoverageEntry);
  }
  for (const item of payload.entries) {
    if (item.nature === 'normative' && !seen.has(item.identity)) report('COVERAGE_ENTRY_MISSING', item.identity, 'Normative entry has no coverage result');
  }
  return { entries, diagnostics };
}

async function loadSource(projectRoot: string, explorationId: string, target: RecordTarget, sourceVersion: string) {
  const source = await showRecord(projectRoot, explorationId);
  if (!sourceVersion || source.sourceVersion !== sourceVersion) gateFail('SOURCE_VERSION_MISMATCH', 'Reload the current record and repeat the coverage check');
  const isCandidate = assertExplicitTarget(target);
  if (source.document.payload.context !== (isCandidate ? 'build' : 'change')) gateFail('CONTEXT_MISMATCH', 'Build and Change records use separate formation contexts');
  return source;
}

async function assertManagedFile(target: string, pathError: string): Promise<boolean> {
  const stat = await fs.lstat(target).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  });
  if (stat && (stat.isSymbolicLink() || !stat.isFile())) gateFail(pathError, `Managed path is not a regular file: ${target}`);
  return !!stat;
}

export interface RecordCoverageResult {
  explorationId: string;
  path: string;
  sourceVersion: string;
  targetFingerprint: string;
  entries: number;
}

export async function recordCoverage(
  projectRoot: string, explorationId: string, target: RecordTarget, sourceVersion: string, input: unknown,
): Promise<RecordCoverageResult> {
  const source = await loadSource(projectRoot, explorationId, target, sourceVersion);
  const current = await readTargetModel(projectRoot, target);
  const { entries, diagnostics } = checkCoverage(source.document.payload, current.model, input);
  if (diagnostics.length) gateFail('INVALID_COVERAGE', 'Coverage result is incomplete or does not resolve against the target', diagnostics);
  const destination = path.join(current.directory, RECORD_COVERAGE_FILE);
  await assertManagedFile(destination, target.candidate ? 'INVALID_CANDIDATE_PATH' : 'INVALID_CHANGE_PATH');
  const content = `${JSON.stringify({
    schemaVersion: 1, explorationId, sourceVersion, targetFingerprint: current.fingerprint, recordedAt: new Date().toISOString(), entries,
  }, null, 2)}\n`;
  const temporary = path.join(current.directory, `.record-coverage-${process.pid}-${randomBytes(4).toString('hex')}.tmp`);
  try {
    await fs.writeFile(temporary, content, { encoding: 'utf8', flag: 'wx' });
    await fs.rename(temporary, destination);
  } finally {
    await fs.rm(temporary, { force: true });
  }
  return { explorationId, path: projectRelativePosix(projectRoot, destination), sourceVersion, targetFingerprint: current.fingerprint, entries: entries.length };
}

function mismatch(item: DerivedStructureObject, label: string): RecordGateDiagnostic[] {
  if (item.status === 'added') return [{ severity: 'ERROR', code: 'STRUCTURE_MISMATCH', identity: label, field: 'identity', message: 'Recorded object is absent from the target' }];
  if (item.status === 'removed') return [{ severity: 'ERROR', code: 'STRUCTURE_MISMATCH', identity: label, field: 'removed', message: 'Recorded removal still exists in the target' }];
  return (item.fields ?? []).map(field => ({
    severity: 'ERROR' as const, code: 'STRUCTURE_MISMATCH', identity: label, field: field.field,
    message: `Recorded ${canonicalJson(field.record)} but target has ${canonicalJson(field.model)}`,
  }));
}

/** Consume gate: fresh coverage bound to source version and target fingerprint, then field-level structure agreement. */
export async function assertCoverageGate(
  projectRoot: string, explorationId: string, target: RecordTarget, sourceVersion: string, structure: RecordStructure,
): Promise<void> {
  const current = await readTargetModel(projectRoot, target);
  const file = path.join(current.directory, RECORD_COVERAGE_FILE);
  if (!await assertManagedFile(file, target.candidate ? 'INVALID_CANDIDATE_PATH' : 'INVALID_CHANGE_PATH')) {
    gateFail('COVERAGE_MISSING', 'Record a coverage result with `xirang record coverage` before consuming');
  }
  let saved: Record<string, unknown> | undefined;
  try { saved = object(JSON.parse(await fs.readFile(file, 'utf8'))); } catch { saved = undefined; }
  if (!saved) gateFail('INVALID_COVERAGE', `${RECORD_COVERAGE_FILE} is not a coverage result`);
  if (saved.explorationId !== explorationId || saved.sourceVersion !== sourceVersion || saved.targetFingerprint !== current.fingerprint) {
    gateFail('COVERAGE_STALE', 'The record or target changed after the coverage check; repeat it and record a new result');
  }
  const types: Array<keyof RecordStructure> = ['elements', 'relationships', 'elementKinds', 'relationshipKinds'];
  const labels = types.flatMap(type => (structure[type] as unknown as Record<string, unknown>[]).map(item => refLabel(type, item)));
  const diagnostics = compareStructure(structure, current.model).flatMap((item, index) => item.status === 'unchanged' ? [] : mismatch(item, labels[index]));
  if (diagnostics.length) gateFail('STRUCTURE_MISMATCH', 'Recorded structure does not match the target', diagnostics);
}
