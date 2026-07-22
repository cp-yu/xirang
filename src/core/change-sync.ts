import { OPSX_DIR_NAME } from './config.js';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  buildUpdatedSpec,
  findSpecUpdates,
  isDeltaSpecAlreadyApplied,
  type SpecUpdate,
} from './specs-apply.js';
import { refreshVerifyEvidenceAfterSync } from './verify/freshness.js';
import { Validator } from './validation/validator.js';
import { extractRequirementsSection, parseDeltaSpec } from './parsers/requirement-blocks.js';
import { mergeArchitectureDelta } from '../utils/architecture-delta-merger.js';
import { readLikeC4Architecture } from '../utils/likec4-reader.js';
import { parseLikeC4Domain } from '../utils/likec4-parser.js';
import { runLikeC4 } from '../commands/arch/runner.js';
import { validateArchitecture } from '../utils/architecture-validator.js';
import { buildSpecRegistry } from './spec-registry.js';

type SpecCounts = { added: number; modified: number; removed: number; renamed: number };

export interface ChangeSyncState {
  changeName: string;
  changeDir: string;
  specUpdates: SpecUpdate[];
  hasDeltaSpecs: boolean;
  hasArchitectureDelta: boolean;
  requiresSync: boolean;
}

interface PreparedSpecWrite {
  update: SpecUpdate;
  rebuilt: string;
  counts: SpecCounts;
  originalContent: string | null;
  action: 'write' | 'delete';
}

interface PreparedArchitectureWrite {
  deltaPath: string;
}

export interface PreparedSyncManifestEntry {
  path: string;
  scope: 'architecture' | 'spec';
  action: 'write' | 'delete';
  preimage: Buffer | null;
  postimage: Buffer | null;
}

export interface PreparedChangeSync {
  state: ChangeSyncState;
  specs: {
    writes: PreparedSpecWrite[];
    totals: SpecCounts;
  };
  architecture: PreparedArchitectureWrite | null;
  manifest: PreparedSyncManifestEntry[];
}

export type SyncTransactionFileSystem = Pick<
  typeof fs,
  'mkdir' | 'readFile' | 'rename' | 'rm' | 'writeFile'
>;

export interface AppliedChangeSyncSummary {
  specs: 'no-delta' | 'synced';
  architecture: 'no-delta' | 'synced';
  files: string[];
}

export interface PendingChangeSync {
  specs: number;
  architecture: boolean;
}

export async function assessChangeSyncState(
  projectRoot: string,
  changeName: string
): Promise<ChangeSyncState> {
  const changeDir = path.join(projectRoot, OPSX_DIR_NAME, 'changes', changeName);
  const mainSpecsDir = path.join(projectRoot, OPSX_DIR_NAME, 'specs');
  const candidateSpecUpdates = await findSpecUpdates(changeDir, mainSpecsDir);
  const specUpdates: SpecUpdate[] = [];
  for (const update of candidateSpecUpdates) {
    const content = await fs.readFile(update.source, 'utf8');
    const plan = parseDeltaSpec(content);
    const operationCount = plan.added.length + plan.modified.length + plan.removed.length + plan.renamed.length;
    const hasDeltaSection = Object.values(plan.sectionPresence).some(Boolean);
    if (operationCount === 0 && hasDeltaSection) {
      throw new Error(`Spec ${path.basename(path.dirname(update.source))} has an empty delta section`);
    }
    if (operationCount > 0) specUpdates.push(update);
  }
  const architectureDelta = await readArchitectureDelta(
    path.join(changeDir, 'architecture-delta.c4'),
  );
  const hasArchitectureDelta = architectureDelta !== null;

  return {
    changeName,
    changeDir,
    specUpdates,
    hasDeltaSpecs: specUpdates.length > 0,
    hasArchitectureDelta,
    requiresSync: specUpdates.length > 0 || hasArchitectureDelta,
  };
}

export async function getPendingChangeSync(
  projectRoot: string,
  state: ChangeSyncState
): Promise<PendingChangeSync> {
  let pendingSpecs = 0;

  for (const update of state.specUpdates) {
    const changeContent = await fs.readFile(update.source, 'utf-8');
    const originalContent = await readOptionalFile(update.target);
    if (
      originalContent !== null &&
      isDeltaSpecAlreadyApplied(changeContent, originalContent)
    ) {
      continue;
    }
    if (originalContent === null && isRemovalOnlyDelta(changeContent)) {
      continue;
    }
    pendingSpecs += 1;
  }

  const architecture = state.hasArchitectureDelta && !await isArchitectureDeltaApplied(
    projectRoot,
    path.join(state.changeDir, 'architecture-delta.c4'),
    state.changeName,
  );
  return { specs: pendingSpecs, architecture };
}

export async function prepareChangeSync(
  projectRoot: string,
  state: ChangeSyncState,
  options: { skipValidation?: boolean } = {}
): Promise<PreparedChangeSync> {
  const writes: PreparedSpecWrite[] = [];
  const totals: SpecCounts = { added: 0, modified: 0, removed: 0, renamed: 0 };
  const validator = new Validator();
  const validateLegacySpecs = !options.skipValidation;

  for (const update of state.specUpdates) {
    const changeContent = await fs.readFile(update.source, 'utf-8');
    const originalContent = await readOptionalFile(update.target);
    if (originalContent !== null && isDeltaSpecAlreadyApplied(changeContent, originalContent)) continue;
    if (originalContent === null && isRemovalOnlyDelta(changeContent)) continue;

    const built = await buildUpdatedSpec(update, state.changeName, projectRoot);
    const action = shouldDeleteRebuiltSpec(built.rebuilt) ? 'delete' : 'write';
    writes.push({ update, rebuilt: built.rebuilt, counts: built.counts, originalContent, action });
    totals.added += built.counts.added;
    totals.modified += built.counts.modified;
    totals.removed += built.counts.removed;
    totals.renamed += built.counts.renamed;
  }

  const deltaPath = path.join(state.changeDir, 'architecture-delta.c4');
  const architectureDelta = await readArchitectureDelta(deltaPath);
  const architecture = architectureDelta
    && !await isArchitectureDeltaApplied(projectRoot, deltaPath, state.changeName)
    ? { deltaPath }
    : null;
  const formalArchitecture = path.join(projectRoot, OPSX_DIR_NAME, 'architecture');
  const hasFormalArchitecture = await directoryExists(formalArchitecture);
  if (architecture && !hasFormalArchitecture) {
    throw new Error('Cannot construct Target Semantic Model: formal architecture does not exist');
  }

  const workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'opsx-sync-target-'));
  try {
    await copyOptionalTree(
      formalArchitecture,
      path.join(workspace, OPSX_DIR_NAME, 'architecture'),
      true,
    );
    await copyOptionalTree(
      path.join(projectRoot, OPSX_DIR_NAME, 'specs'),
      path.join(workspace, OPSX_DIR_NAME, 'specs'),
      false,
    );

    if (architecture) {
      await mergeArchitectureDelta(workspace, architecture.deltaPath, {
        changeName: state.changeName,
      });
    }
    await writeSpecsToTarget(projectRoot, workspace, writes);

    if (hasFormalArchitecture) {
      const profile = await validateTargetSemanticModel(workspace, validator);
      if (profile === 'legacy' && validateLegacySpecs) {
        await validatePreparedSpecWrites(validator, writes);
      }
    } else if (validateLegacySpecs) {
      await validatePreparedSpecWrites(validator, writes);
    }

    const before = await readSemanticTree(projectRoot);
    const after = await readSemanticTree(workspace);
    const manifest = buildManifest(before, after);
    if (architecture && !manifest.some(entry => entry.scope === 'architecture')) {
      throw new Error('architecture-delta.c4 produced no actual Semantic Model mutation');
    }
    return {
      state,
      specs: { writes, totals },
      architecture,
      manifest,
    };
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
}

export async function applyPreparedChangeSync(
  projectRoot: string,
  prepared: PreparedChangeSync,
  options: {
    silent?: boolean;
    filesystem?: Partial<SyncTransactionFileSystem>;
    refreshEvidence?: typeof refreshVerifyEvidenceAfterSync;
  } = {}
): Promise<AppliedChangeSyncSummary> {
  const silent = options.silent ?? false;
  const filesystem = transactionFileSystem(options.filesystem);
  await assertManifestPreimages(projectRoot, prepared.manifest, filesystem);

  const applied: PreparedSyncManifestEntry[] = [];
  try {
    for (let index = 0; index < prepared.manifest.length; index += 1) {
      const entry = prepared.manifest[index];
      applied.push(entry);
      await applyManifestEntry(projectRoot, entry, index, filesystem);
    }
  } catch (error) {
    const rollbackErrors = await rollbackManifest(projectRoot, applied, filesystem);
    if (rollbackErrors.length > 0) {
      throw new AggregateError(
        [error as Error, ...rollbackErrors],
        `Semantic sync failed and rollback was incomplete: ${(error as Error).message}`,
      );
    }
    throw error;
  }

  const syncedFiles = prepared.manifest.map(entry => entry.path);
  const architectureSynced = prepared.manifest.some(entry => entry.scope === 'architecture');
  const specsSynced = prepared.manifest.some(entry => entry.scope === 'spec');
  if (!silent && architectureSynced) console.log('Architecture updated successfully.');
  if (!silent && specsSynced) {
    console.log(
      `Totals: + ${prepared.specs.totals.added}, ~ ${prepared.specs.totals.modified}, - ${prepared.specs.totals.removed}, → ${prepared.specs.totals.renamed}`
    );
    console.log('Specs updated successfully.');
  }

  try {
    await (options.refreshEvidence ?? refreshVerifyEvidenceAfterSync)(
      prepared.state.changeDir,
      projectRoot,
      syncedFiles,
    );
  } catch (error) {
    throw new Error(
      `Semantic sync committed, but evidence refresh failed; run verify to refresh evidence: ${(error as Error).message}`,
      { cause: error },
    );
  }

  return {
    specs: specsSynced ? 'synced' : 'no-delta',
    architecture: architectureSynced ? 'synced' : 'no-delta',
    files: syncedFiles,
  };
}

async function isArchitectureDeltaApplied(
  projectRoot: string,
  deltaPath: string,
  changeName: string,
): Promise<boolean> {
  const content = await fs.readFile(deltaPath, 'utf8');
  const formal = await readLikeC4Architecture(projectRoot).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return null;
    throw error;
  });
  if (!formal) return false;
  if (formal.profile === 'v1') {
    const modulePath = path.join(
      projectRoot,
      OPSX_DIR_NAME,
      'architecture',
      'deltas',
      architectureDeltaModuleName(changeName),
    );
    return await readOptionalFile(modulePath) === content;
  }

  const delta = parseArchitectureDelta(content, changeName);
  const nestedExtensions = assessLegacyElementExtensions(content, formal, changeName);
  const operationCount = delta.domains.length + delta.capabilities.length + delta.relations.length;
  if (operationCount === 0 && !nestedExtensions.hasOperations) return false;
  return nestedExtensions.applied && delta.domains.every(domain => {
    const current = formal.domains.find(candidate => candidate.id === domain.id);
    return current !== undefined && sameDomain(current, domain);
  })
    && delta.capabilities.every(capability => {
      const current = formal.capabilities.find(candidate => candidate.id === capability.id);
      return current !== undefined && sameCapability(current, capability);
    })
    && delta.relations.every(relation => formal.relations.some(candidate =>
      candidate.source === relation.source &&
      candidate.kind === relation.kind &&
      candidate.target === relation.target &&
      (candidate.description ?? '') === (relation.description ?? ''),
    ));
}

function parseArchitectureDelta(content: string, changeName: string) {
  const normalized = formalizeSpecPaths(content, changeName);
  const extensionRanges: Array<[number, number]> = [];
  const capabilities = [];
  for (const match of normalized.matchAll(/\bextend\s+([A-Za-z_][\w-]*)\s*\{/g)) {
    const block = blockAt(normalized, match.index + match[0].lastIndexOf('{'));
    extensionRanges.push([match.index, block.end + 1]);
    capabilities.push(...parseLikeC4Domain(
      `model { ${match[1]} = domain '${match[1]}' {${block.body}} }`,
    ).capabilities);
  }
  const base = parseLikeC4Domain(maskRanges(normalized, extensionRanges));
  return {
    ...base,
    capabilities: [...base.capabilities, ...capabilities],
    relations: parseLikeC4Domain(normalized).relations,
  };
}

function maskRanges(content: string, ranges: Array<[number, number]>): string {
  const characters = [...content];
  for (const [start, end] of ranges) {
    for (let index = start; index < end; index += 1) {
      if (characters[index] !== '\n') characters[index] = ' ';
    }
  }
  return characters.join('');
}

function sameDomain(left: { id: string; title: string; description?: string; boundary?: string; status?: string }, right: typeof left): boolean {
  return left.title === right.title
    && (left.description ?? '') === (right.description ?? '')
    && (left.boundary ?? '') === (right.boundary ?? '')
    && (left.status ?? '') === (right.status ?? '');
}

function sameCapability(left: { id: string; title: string; description?: string; capabilityId?: string; status?: string; specs: string[]; domain?: string }, right: typeof left): boolean {
  return left.title === right.title
    && (left.description ?? '') === (right.description ?? '')
    && (left.capabilityId ?? '') === (right.capabilityId ?? '')
    && (left.status ?? '') === (right.status ?? '')
    && (left.domain ?? '') === (right.domain ?? '')
    && JSON.stringify([...left.specs].sort()) === JSON.stringify([...right.specs].sort());
}

function assessLegacyElementExtensions(
  content: string,
  formal: Awaited<ReturnType<typeof readLikeC4Architecture>>,
  changeName: string,
): { hasOperations: boolean; applied: boolean } {
  let hasOperations = false;
  let applied = true;
  const normalized = formalizeSpecPaths(content, changeName);
  for (const match of normalized.matchAll(/\bextend\s+([A-Za-z_][\w-]*\.[A-Za-z_][\w-]*)\s*\{/g)) {
    const body = blockAt(normalized, match.index + match[0].lastIndexOf('{')).body;
    const metadataMatch = /\bmetadata\s*\{/.exec(body);
    if (!metadataMatch) {
      applied = false;
      continue;
    }
    const metadataBody = blockAt(body, metadataMatch.index + metadataMatch[0].lastIndexOf('{')).body;
    const current = formal.capabilities.find(capability => capability.id === match[1]);
    const intent = quotedValue(metadataBody, 'intent');
    const status = quotedValue(metadataBody, 'status');
    const capabilityId = quotedValue(metadataBody, 'capabilityId');
    const specs = listValues(metadataBody, 'specs');
    hasOperations ||= intent !== null || status !== null || capabilityId !== null || specs !== null;
    if (!current
      || intent !== null && (current.description ?? '') !== intent
      || status !== null && (current.status ?? '') !== status
      || capabilityId !== null && (current.capabilityId ?? '') !== capabilityId
      || specs !== null && specs.some(spec => !current.specs.includes(spec))) {
      applied = false;
    }
  }
  return { hasOperations, applied };
}

function quotedValue(content: string, key: string): string | null {
  const match = content.match(new RegExp(`\\b${key}\\s+'((?:\\\\'|[^'])*)'`));
  return match ? match[1].replaceAll("\\'", "'") : null;
}

function listValues(content: string, key: string): string[] | null {
  const match = content.match(new RegExp(`\\b${key}\\s+\\[([^\\]]*)\\]`));
  return match ? [...match[1].matchAll(/'((?:\\'|[^'])*)'/g)].map(item => item[1].replaceAll("\\'", "'")) : null;
}

function formalizeSpecPaths(content: string, changeName: string): string {
  return content.replaceAll(`.opsx/changes/${changeName}/specs/`, '.opsx/specs/');
}

function blockAt(content: string, openBrace: number): { body: string; end: number } {
  let depth = 0;
  let quote = false;
  for (let index = openBrace; index < content.length; index += 1) {
    const char = content[index];
    if (char === "'" && content[index - 1] !== '\\') quote = !quote;
    if (quote) continue;
    if (char === '{') depth += 1;
    if (char === '}' && --depth === 0) return { body: content.slice(openBrace + 1, index), end: index };
  }
  throw new Error('Unclosed LikeC4 block');
}

async function fileExists(filePath: string): Promise<boolean> {
  try { await fs.access(filePath); return true; } catch { return false; }
}

async function directoryExists(directory: string): Promise<boolean> {
  try { return (await fs.stat(directory)).isDirectory(); } catch { return false; }
}

async function readArchitectureDelta(deltaPath: string): Promise<string | null> {
  if (!await fileExists(deltaPath)) return null;
  const content = await fs.readFile(deltaPath, 'utf8');
  assertArchitectureDeltaOperations(content);
  return content;
}

function assertArchitectureDeltaOperations(content: string): void {
  const modelBlocks = [...content.matchAll(/\bmodel\s*\{/g)].map(match =>
    blockAt(content, match.index + match[0].lastIndexOf('{')).body
  );
  if (modelBlocks.length === 0) {
    throw new Error('architecture-delta.c4 must contain a model block');
  }
  if (modelBlocks.some(body => stripLikeC4Comments(body).trim() === '')) {
    throw new Error('Empty model block has no actual architecture operation');
  }

  const extensionBodies = [...content.matchAll(/\bextend\s+[A-Za-z_][\w.-]*\s*\{/g)].map(match =>
    blockAt(content, match.index + match[0].lastIndexOf('{')).body
  );
  for (const body of extensionBodies) {
    const effective = stripLikeC4Comments(body).replace(/\b[A-Za-z_][\w-]*\s*\{\s*\}/g, '').trim();
    if (effective === '') throw new Error('Empty extend block has no actual architecture operation');
  }
  for (const match of content.matchAll(/\bopsx\s*\{/g)) {
    const body = blockAt(content, match.index + match[0].lastIndexOf('{')).body;
    if (stripLikeC4Comments(body).trim() === '') {
      throw new Error('Empty OPSX annotation has no actual architecture operation');
    }
  }

  const modelSource = modelBlocks.join('\n');
  const hasDeclaration = /\b[A-Za-z_][\w-]*\s*=\s*[A-Za-z_][\w-]*\s+['"]/.test(modelSource);
  const hasRelation = /\b[A-Za-z_][\w.-]*\s+-\[[A-Za-z_][\w-]*\]->\s+[A-Za-z_][\w.-]*/.test(modelSource);
  const hasMetamodelOperation = /\bspecification\s*\{[\s\S]*\b(?:element|relationship)\s+[A-Za-z_][\w-]*/.test(content);
  if (!hasDeclaration && !hasRelation && extensionBodies.length === 0 && !hasMetamodelOperation) {
    throw new Error('architecture-delta.c4 has no actual architecture operation');
  }
}

function stripLikeC4Comments(content: string): string {
  return content.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

function architectureDeltaModuleName(changeName: string): string {
  const normalized = changeName.replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
  return `${normalized || 'architecture-delta'}.c4`;
}

async function copyOptionalTree(source: string, target: string, excludeCache: boolean): Promise<void> {
  await fs.mkdir(target, { recursive: true });
  await fs.cp(source, target, {
    recursive: true,
    filter: file => !excludeCache || path.basename(file) !== '.likec4',
  }).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== 'ENOENT') throw error;
  });
}

async function writeSpecsToTarget(
  projectRoot: string,
  targetRoot: string,
  writes: PreparedSpecWrite[],
): Promise<void> {
  for (const write of writes) {
    const relative = path.relative(projectRoot, write.update.target);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new Error(`Spec target escapes project root: ${write.update.target}`);
    }
    const target = path.join(targetRoot, relative);
    if (write.action === 'delete') {
      await fs.rm(target, { force: true });
    } else {
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, write.rebuilt, 'utf8');
    }
  }
}

async function validateTargetSemanticModel(
  targetRoot: string,
  validator: Validator,
): Promise<'legacy' | 'v1'> {
  const architectureDir = path.join(targetRoot, OPSX_DIR_NAME, 'architecture');
  await runLikeC4(['validate', architectureDir]);
  const architecture = await readLikeC4Architecture(targetRoot);
  const architectureResult = await validateArchitecture(targetRoot, architecture);
  if (!architectureResult.success) {
    const issue = architectureResult.errors[0];
    throw new Error(`${issue.code}: ${issue.message}`);
  }
  if (architecture.profile !== 'v1') return architecture.profile;

  const specsDir = path.join(targetRoot, OPSX_DIR_NAME, 'specs');
  const entries = await fs.readdir(specsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const specPath = path.join(specsDir, entry.name, 'spec.md');
    if (!await fileExists(specPath)) continue;
    const report = await validator.validateSpec(specPath);
    if (!report.valid) throwValidationErrors(`Target spec ${entry.name}`, report.issues);
  }

  const registry = await buildSpecRegistry(targetRoot, specsDir);
  const knownElements = new Set(architecture.elements.map(element => element.id));
  for (const specId of registry.getOrphanedSpecs()) {
    const issues = registry.getIssuesForSpec(specId);
    throw new Error(issues[0]
      ? `${issues[0].code}: ${issues[0].message}`
      : `MISSING_SPEC_ELEMENT: Spec "${specId}" has no singular element binding`);
  }
  for (const [specId, elementId] of registry.specToElement) {
    if (!knownElements.has(elementId)) {
      throw new Error(`UNKNOWN_SPEC_ELEMENT: Spec "${specId}" references unknown element "${elementId}"`);
    }
  }
  const uncovered = registry.getUncoveredRequiredElements(architecture.elements, architecture.metamodel);
  if (uncovered.length > 0) {
    throw new Error(`MISSING_REQUIRED_CONTRACT: required element "${uncovered[0]}" has no bound Spec`);
  }
  return architecture.profile;
}

async function validatePreparedSpecWrites(validator: Validator, writes: PreparedSpecWrite[]): Promise<void> {
  for (const write of writes) {
    if (write.action === 'delete') continue;
    const specName = path.basename(path.dirname(write.update.target));
    const report = await validator.validateSpecContent(specName, write.rebuilt);
    if (!report.valid) throwValidationErrors(`Rebuilt spec ${specName}`, report.issues);
  }
}

function throwValidationErrors(label: string, issues: Array<{ level: string; message: string }>): never {
  const errors = issues.filter(issue => issue.level === 'ERROR').map(issue => `  x ${issue.message}`).join('\n');
  throw new Error(`Validation errors in ${label}:\n${errors}`);
}

async function readSemanticTree(projectRoot: string): Promise<Map<string, Buffer>> {
  const files = new Map<string, Buffer>();
  const visit = async (directory: string): Promise<void> => {
    let entries;
    try {
      entries = await fs.readdir(directory, { withFileTypes: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
      throw error;
    }
    for (const entry of entries) {
      if (entry.name === '.likec4') continue;
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(file);
      else files.set(toPosixProjectRelative(projectRoot, file), await fs.readFile(file));
    }
  };
  await visit(path.join(projectRoot, OPSX_DIR_NAME, 'architecture'));
  await visit(path.join(projectRoot, OPSX_DIR_NAME, 'specs'));
  return files;
}

function buildManifest(
  before: Map<string, Buffer>,
  after: Map<string, Buffer>,
): PreparedSyncManifestEntry[] {
  const paths = [...new Set([...before.keys(), ...after.keys()])].sort();
  return paths.flatMap(relativePath => {
    const preimage = before.get(relativePath) ?? null;
    const postimage = after.get(relativePath) ?? null;
    if (preimage !== null && postimage !== null && preimage.equals(postimage)) return [];
    if (preimage === null && postimage === null) return [];
    return [{
      path: relativePath,
      scope: relativePath.startsWith(`${OPSX_DIR_NAME}/architecture/`) ? 'architecture' as const : 'spec' as const,
      action: postimage === null ? 'delete' as const : 'write' as const,
      preimage,
      postimage,
    }];
  });
}

function transactionFileSystem(overrides?: Partial<SyncTransactionFileSystem>): SyncTransactionFileSystem {
  return {
    mkdir: overrides?.mkdir ?? fs.mkdir.bind(fs),
    readFile: overrides?.readFile ?? fs.readFile.bind(fs),
    rename: overrides?.rename ?? fs.rename.bind(fs),
    rm: overrides?.rm ?? fs.rm.bind(fs),
    writeFile: overrides?.writeFile ?? fs.writeFile.bind(fs),
  };
}

async function assertManifestPreimages(
  projectRoot: string,
  manifest: PreparedSyncManifestEntry[],
  filesystem: SyncTransactionFileSystem,
): Promise<void> {
  for (const entry of manifest) {
    const current = await readOptionalBuffer(resolveManifestPath(projectRoot, entry.path), filesystem);
    if (current === null && entry.preimage === null) continue;
    if (current !== null && entry.preimage !== null && current.equals(entry.preimage)) continue;
    throw new Error(`Prepared sync is stale: ${entry.path} changed after validation`);
  }
}

async function applyManifestEntry(
  projectRoot: string,
  entry: PreparedSyncManifestEntry,
  index: number,
  filesystem: SyncTransactionFileSystem,
): Promise<void> {
  const target = resolveManifestPath(projectRoot, entry.path);
  if (entry.action === 'delete') {
    await filesystem.rm(target, { force: true });
    return;
  }

  await filesystem.mkdir(path.dirname(target), { recursive: true });
  const temporary = path.join(path.dirname(target), `.${path.basename(target)}.opsx-sync-${index}.tmp`);
  try {
    await filesystem.writeFile(temporary, entry.postimage!);
    try {
      await filesystem.rename(temporary, target);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (entry.preimage === null || code !== 'EPERM' && code !== 'EEXIST') throw error;
      await filesystem.rm(target, { force: true });
      await filesystem.rename(temporary, target);
    }
  } finally {
    await filesystem.rm(temporary, { force: true }).catch(() => undefined);
  }
}

async function rollbackManifest(
  projectRoot: string,
  applied: PreparedSyncManifestEntry[],
  filesystem: SyncTransactionFileSystem,
): Promise<Error[]> {
  const errors: Error[] = [];
  for (const entry of [...applied].reverse()) {
    const target = resolveManifestPath(projectRoot, entry.path);
    try {
      if (entry.preimage === null) {
        await filesystem.rm(target, { force: true });
      } else {
        await filesystem.mkdir(path.dirname(target), { recursive: true });
        await filesystem.writeFile(target, entry.preimage);
      }
    } catch (error) {
      errors.push(error as Error);
    }
  }
  return errors;
}

function resolveManifestPath(projectRoot: string, relativePath: string): string {
  if (path.posix.isAbsolute(relativePath) || path.posix.normalize(relativePath) !== relativePath) {
    throw new Error(`Invalid prepared sync path: ${relativePath}`);
  }
  const allowed = relativePath.startsWith(`${OPSX_DIR_NAME}/architecture/`)
    || relativePath.startsWith(`${OPSX_DIR_NAME}/specs/`);
  if (!allowed) throw new Error(`Prepared sync path is outside Semantic Model: ${relativePath}`);
  return path.resolve(projectRoot, ...relativePath.split('/'));
}

async function readOptionalBuffer(
  filePath: string,
  filesystem: Pick<SyncTransactionFileSystem, 'readFile'>,
): Promise<Buffer | null> {
  try {
    return await filesystem.readFile(filePath);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT' || code === 'ENOTDIR') return null;
    throw error;
  }
}

async function readOptionalFile(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (error: any) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
}

function shouldDeleteRebuiltSpec(content: string): boolean {
  return extractRequirementsSection(content).bodyBlocks.length === 0;
}

function isRemovalOnlyDelta(content: string): boolean {
  const plan = parseDeltaSpec(content);
  return plan.removed.length > 0 &&
    plan.added.length === 0 &&
    plan.modified.length === 0 &&
    plan.renamed.length === 0;
}

function toPosixProjectRelative(projectRoot: string, filePath: string): string {
  return path.relative(projectRoot, filePath).split(path.sep).join('/');
}
