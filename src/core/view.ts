import { createHash } from 'node:crypto';
import { existsSync, promises as fs, watch, type FSWatcher } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { XIRANG_DIR_NAME } from './config.js';
import { compileChangeDelta, readFormalSemanticModel } from './change-compiler.js';
import { deriveLocalNames } from './likec4/local-names.js';
import { generateLikeC4 } from './likec4/generator.js';
import { generateLikeC4Artifacts } from '../commands/arch/export.js';
import {
  projectBrowserArchitecture,
  projectBrowserDeclaration,
  type BrowserSemanticModel,
} from './likec4/definition.js';
import { resolveViewSelection, type ResolvedViewSelection } from './likec4/runtime-projection.js';
import { serializeElementUnit } from './model/serializer.js';
import { PARTITIONS, relationshipIdentity, type Partition, type SemanticModel } from './model/types.js';
import type { ChangeDiagnostic, ChangeDiff } from './semantic-diff.js';
import { runLikeC4 } from '../commands/arch/runner.js';
import { validateCandidateSnapshot } from './candidate/validator.js';
import { parseSemanticModelFiles, type ParsedModel } from './model/parser.js';

export interface ViewLaunchOptions {
  projectRoot: string;
  likec4SourceDir: string;
  changeManifestFile: string;
  listen?: string;
  port?: number;
}

export type ViewLauncher = (options: ViewLaunchOptions) => Promise<void>;

export function findXirangProjectRoot(startPath: string): string | undefined {
  let current = path.resolve(startPath);

  while (true) {
    if (existsSync(path.join(current, XIRANG_DIR_NAME))) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return undefined;
    }
    current = parent;
  }
}

export const launchEmbeddedLikeC4: ViewLauncher = async ({ likec4SourceDir, changeManifestFile, listen, port }) => {
  const args = [
    'start',
    likec4SourceDir,
    '--xirang-change-manifest',
    changeManifestFile,
  ];
  if (listen !== undefined) {
    args.push('--listen', listen);
  }
  if (port !== undefined) {
    args.push('--port', String(port));
  }
  await runLikeC4(args);
};

function runtimeLikeC4(model: SemanticModel): { likec4Sources: Record<string, string>; likec4ElementPaths: Record<string, string> };
function runtimeLikeC4(model: SemanticModel, sourcesKey: 'diffLikec4Sources', pathsKey: 'diffLikec4ElementPaths'): { diffLikec4Sources: Record<string, string>; diffLikec4ElementPaths: Record<string, string> };
function runtimeLikeC4(
  model: SemanticModel,
  sourcesKey: 'likec4Sources' | 'diffLikec4Sources' = 'likec4Sources',
  pathsKey: 'likec4ElementPaths' | 'diffLikec4ElementPaths' = 'likec4ElementPaths',
): { likec4Sources?: Record<string, string>; likec4ElementPaths?: Record<string, string>; diffLikec4Sources?: Record<string, string>; diffLikec4ElementPaths?: Record<string, string> } {
  const names = deriveLocalNames(model.elements);
  const sources = Object.fromEntries(generateLikeC4(model));
  const paths = Object.fromEntries(model.elements.map(element => [element.declaration.identity, names.pathOf(element.declaration.identity)]));
  return { [sourcesKey]: sources, [pathsKey]: paths };
}
export interface ViewRuntimeSemanticModel {
  id: 'model';
  label: 'Model View';
  source: 'semantic-model';
  valid: true;
  sourceFingerprint: string;
  partitionFingerprints: Record<Partition, string>;
  architecture: BrowserSemanticModel;
  contracts: Record<string, string>;
  likec4Sources: Record<string, string>;
  likec4ElementPaths: Record<string, string>;
  diagnostics: ChangeDiagnostic[];
}

export interface ViewRuntimeChangeDerivedView {
  change: string;
  label: string;
  valid: boolean;
  semanticModelFingerprint?: string;
  changeFingerprint?: string;
  sourceFingerprint?: string;
  diffSourceFingerprint?: string;
  partitionFingerprints?: Record<Partition, string>;
  diff?: ChangeDiff;
  architecture?: BrowserSemanticModel;
  diffArchitecture?: BrowserSemanticModel;
  /** element identity → Contract markdown; the only Contract transport to the Browser. */
  contracts?: Record<string, string>;
  likec4Sources?: Record<string, string>;
  likec4ElementPaths?: Record<string, string>;
  diffLikec4Sources?: Record<string, string>;
  diffLikec4ElementPaths?: Record<string, string>;
  diagnostics: ChangeDiagnostic[];
  /** Change plan files (design.md, proposal.md, tasks.md — keys are file basenames). */
  changePlan?: Record<string, string>;
}

export interface ViewRuntimeCandidateSource {
  id: 'candidate';
  label: 'Candidate View';
  source: 'candidate';
  valid: boolean;
  semanticModelFingerprint?: string;
  sourceFingerprint?: string;
  diffSourceFingerprint?: string;
  partitionFingerprints?: Record<Partition, string>;
  diff?: ChangeDiff;
  architecture?: BrowserSemanticModel;
  diffArchitecture?: BrowserSemanticModel;
  /** element identity → Contract markdown; the only Contract transport to the Browser. */
  contracts?: Record<string, string>;
  likec4Sources?: Record<string, string>;
  likec4ElementPaths?: Record<string, string>;
  diffLikec4Sources?: Record<string, string>;
  diffLikec4ElementPaths?: Record<string, string>;
  diagnostics: ChangeDiagnostic[];
}

/** A View Selection entry: its display label plus the resolved selection boundary. */
export interface ViewRuntimeAuthoredView extends ResolvedViewSelection {
  title: string;
}

export interface ViewRuntimeSnapshot {
  version: 4;
  modelFingerprint: string;
  model: ViewRuntimeSemanticModel;
  authoredViews: Record<string, ViewRuntimeAuthoredView>;
  candidate?: ViewRuntimeCandidateSource;
  changes: Record<string, ViewRuntimeChangeDerivedView>;
}

function runtimeFingerprint(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

export async function listActiveChanges(projectRoot: string): Promise<string[]> {
  const changesDir = path.join(projectRoot, XIRANG_DIR_NAME, 'changes');
  const entries = await fs.readdir(changesDir, { withFileTypes: true }).catch(() => []);
  return entries
    .filter(entry => entry.isDirectory() && entry.name !== 'archive' && !entry.name.startsWith('.'))
    .map(entry => entry.name)
    .sort((left, right) => left.localeCompare(right));
}

/** Elements without a Contract are absent, so a lookup miss is exactly "no Contract". */
export function projectContracts(model: SemanticModel): Record<string, string> {
  const contracts: Record<string, string> = {};
  for (const element of [...model.elements].sort((left, right) =>
    left.declaration.identity.localeCompare(right.declaration.identity))) {
    if (element.requirements.length === 0) continue;
    contracts[element.declaration.identity] = serializeElementUnit(element);
  }
  return contracts;
}

export function projectBrowserDiff(diff: ChangeDiff): ChangeDiff {
  const projectEntry = (entry: ChangeDiff['entries'][number]): ChangeDiff['entries'][number] => ({
    ...entry,
    ...(entry.kind === 'element-declaration' && entry.before
      ? { before: projectBrowserDeclaration(entry.before as SemanticModel['elements'][number]['declaration']) }
      : {}),
    ...(entry.kind === 'element-declaration' && entry.after
      ? { after: projectBrowserDeclaration(entry.after as SemanticModel['elements'][number]['declaration']) }
      : {}),
  });
  return { ...diff, entries: diff.entries.map(projectEntry) };
}

function hashString(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

export function partitionFingerprints(model: SemanticModel): Record<Partition, string> {
  const byPartition: Record<Partition, unknown> = {
    elements: model.elements,
    metamodel: [model.elementKinds, model.relationshipKinds],
    relationships: model.relationships,
    views: model.views,
  };
  return Object.fromEntries(
    PARTITIONS.map(partition => [partition, runtimeFingerprint(byPartition[partition])]),
  ) as Record<Partition, string>;
}

async function buildSemanticModelSource(formal: ParsedModel): Promise<ViewRuntimeSemanticModel> {
  const { model } = formal;
  const fingerprints = partitionFingerprints(model);
  return {
    id: 'model',
    label: 'Model View',
    source: 'semantic-model',
    valid: true,
    sourceFingerprint: hashString(JSON.stringify(fingerprints)),
    partitionFingerprints: fingerprints,
    architecture: projectBrowserArchitecture(model),
    contracts: projectContracts(model),
    ...runtimeLikeC4(model),
    diagnostics: [],
  };
}

function unionSemanticModels(before: SemanticModel, after: SemanticModel): SemanticModel {
  const elements = new Map(before.elements.map(item => [item.declaration.identity, item]))
  for (const item of after.elements) elements.set(item.declaration.identity, item)
  const elementKinds = new Map(before.elementKinds.map(item => [item.identity, item]))
  for (const item of after.elementKinds) elementKinds.set(item.identity, item)
  const relationshipKinds = new Map(before.relationshipKinds.map(item => [item.identity, item]))
  for (const item of after.relationshipKinds) relationshipKinds.set(item.identity, item)
  const relationships = new Map(before.relationships.map(item => [relationshipIdentity(item), item]))
  for (const item of after.relationships) relationships.set(relationshipIdentity(item), item)
  return {
    ...after,
    elementKinds: [...elementKinds.values()],
    relationshipKinds: [...relationshipKinds.values()],
    elements: [...elements.values()],
    relationships: [...relationships.values()],
  }
}

async function buildChangeDerivedView(projectRoot: string, change: string, formal: ParsedModel): Promise<ViewRuntimeChangeDerivedView> {
  try {
    const compiledDelta = await compileChangeDelta(projectRoot, change, { base: formal });
    const compiled = compiledDelta.compiled;
    const projection = compiled.target ? projectContracts(compiled.target) : undefined;
    const diffModel = compiled.target ? unionSemanticModels(compiledDelta.base.model, compiled.target) : undefined;
    const changeRoot = path.join(projectRoot, XIRANG_DIR_NAME, 'changes', change);
    const planFiles = ['design.md', 'proposal.md', 'tasks.md'] as const;
    const planResults = await Promise.allSettled(
      planFiles.map(file =>
        fs.readFile(path.join(changeRoot, file), 'utf8')
          .then(content => [file, content] as const),
      ),
    );
    const changePlan: Record<string, string> = {};
    for (const result of planResults) {
      if (result.status === 'fulfilled') changePlan[result.value[0]] = result.value[1];
    }
    return {
      change,
      label: change,
      valid: compiled.valid,
      semanticModelFingerprint: compiled.formalFingerprint,
      changeFingerprint: compiled.changeFingerprint,
      sourceFingerprint: hashString(compiled.formalFingerprint + compiled.changeFingerprint),
      ...(diffModel ? { diffSourceFingerprint: hashString(JSON.stringify(partitionFingerprints(diffModel))) } : {}),
      ...(compiled.target ? { partitionFingerprints: partitionFingerprints(compiled.target) } : {}),
      diff: projectBrowserDiff(compiled.diff),
      ...(compiled.target ? { architecture: projectBrowserArchitecture(compiled.target) } : {}),
      ...(diffModel ? { diffArchitecture: projectBrowserArchitecture(diffModel) } : {}),
      ...(compiled.target ? { ...runtimeLikeC4(compiled.target) } : {}),
      ...(diffModel ? { ...runtimeLikeC4(diffModel, 'diffLikec4Sources', 'diffLikec4ElementPaths') } : {}),
      ...(projection ? { contracts: projection } : {}),
      diagnostics: compiled.diagnostics,
      ...(Object.keys(changePlan).length > 0 ? { changePlan } : {}),
    };
  } catch (error) {
    return {
      change,
      label: change,
      valid: false,
      diagnostics: [{
        level: 'ERROR',
        code: 'CHANGE_RUNTIME_FAILED',
        path: path.posix.join('.xirang', 'changes', change),
        message: error instanceof Error ? error.message : 'Unable to compile active change',
      }],
    };
  }
}

async function buildCandidateSources(
  projectRoot: string,
  formal: ParsedModel,
): Promise<ViewRuntimeCandidateSource | undefined> {
  const candidateRoot = path.join(projectRoot, XIRANG_DIR_NAME, 'candidate');
  const candidateExists = existsSync(candidateRoot);
  if (!candidateExists) return undefined;

  try {
    const validation = await validateCandidateSnapshot(projectRoot);
    const { result, snapshot } = validation;
    
    const candidateModel = parseSemanticModelFiles(
      snapshot.files
        .filter(file => PARTITIONS.some(p => file.path.startsWith(`${p}/`)))
        .map(file => [file.path, file.bytes.toString('utf8')] as const),
    );

    const fingerprints = result.valid ? partitionFingerprints(candidateModel.model) : undefined;
    const architecture = projectBrowserArchitecture(candidateModel.model);
    const contracts = result.valid ? projectContracts(candidateModel.model) : undefined;
    const candidateRuntime = result.valid ? runtimeLikeC4(candidateModel.model) : null;
    // The before-after union carries removed ghosts; diff-only projections render from it.
    const unionModel = result.comparison.baseline === 'formal'
      ? unionSemanticModels(formal.model, candidateModel.model)
      : null
    const diffArchitecture = unionModel ? projectBrowserArchitecture(unionModel) : undefined
    const diffSourceFingerprint = unionModel
      ? hashString(JSON.stringify(partitionFingerprints(unionModel)))
      : undefined
    // The combined fingerprint includes both candidate content and the formal model baseline
    // so the candidate source invalidates when either changes.
    const formalFp = result.comparison.baseline === 'formal' ? result.comparison.formalFingerprint : ''
    const sourceFingerprint = snapshot.reviewDigest
      ? hashString(snapshot.reviewDigest + formalFp)
      : undefined;

    return {
      id: 'candidate',
      label: 'Candidate View',
      source: 'candidate',
      valid: result.valid,
      ...(result.comparison.baseline === 'formal' ? { semanticModelFingerprint: result.comparison.formalFingerprint } : {}),
      ...(sourceFingerprint ? { sourceFingerprint } : {}),
      ...(fingerprints ? { partitionFingerprints: fingerprints } : {}),
      ...(result.diff ? { diff: projectBrowserDiff(result.diff) } : {}),
      ...(architecture ? { architecture } : {}),
      ...(result.valid && unionModel ? {
        ...(diffArchitecture ? { diffArchitecture } : {}),
        ...(diffSourceFingerprint ? { diffSourceFingerprint } : {}),
        ...runtimeLikeC4(unionModel, 'diffLikec4Sources', 'diffLikec4ElementPaths'),
      } : {}),
      ...(contracts ? { contracts } : {}),
      ...(candidateRuntime ? { ...candidateRuntime } : {}),
      diagnostics: result.diagnostics,
    };
  } catch (error) {
    return {
      id: 'candidate',
      label: 'Candidate View',
      source: 'candidate',
      valid: false,
      diagnostics: [{
        level: 'ERROR',
        code: 'CANDIDATE_RUNTIME_FAILED',
        path: path.posix.join('.xirang', 'candidate'),
        message: error instanceof Error ? error.message : 'Unable to build Candidate sources',
      }],
    };
  }
}

export async function buildViewRuntimeSnapshot(
  projectRoot: string,
  options: { previous?: ViewRuntimeSnapshot; onlyChange?: string } = {},
): Promise<ViewRuntimeSnapshot> {
  const formal = await readFormalSemanticModel(projectRoot);
  const changes = await listActiveChanges(projectRoot);
  const previous = options.previous?.changes ?? {};
  const entries = await Promise.all(
    changes.map(async change => {
      const cached = options.onlyChange && options.onlyChange !== change ? previous[change] : undefined;
      return [change, cached ?? await buildChangeDerivedView(projectRoot, change, formal)] as const;
    }),
  );
  const sources = Object.fromEntries(entries);

  const [candidateSources, semanticModel] = await Promise.all([
    buildCandidateSources(projectRoot, formal),
    buildSemanticModelSource(formal),
  ]);

  // The Browser server consumes the resolved selection directly, so closure, exclude precedence
  // and virtual-root detection stay in one place instead of being re-derived per consumer.
  const { model } = formal;
  const authoredViews: Record<string, ViewRuntimeAuthoredView> = {};
  for (const view of model.views) {
    authoredViews[view.identity] = {
      title: view.title ?? view.identity,
      ...resolveViewSelection(view, model),
    };
  }

  return {
    version: 4,
    modelFingerprint: semanticModel.sourceFingerprint,
    model: semanticModel,
    authoredViews,
    ...(candidateSources ? { candidate: candidateSources } : {}),
    changes: sources,
  };
}

async function writeViewRuntimeSnapshot(snapshot: ViewRuntimeSnapshot, directory: string): Promise<string> {
  const target = path.join(directory, 'xirang-change-manifest.json');
  const temporary = `${target}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(temporary, JSON.stringify(snapshot));
  await fs.rename(temporary, target);
  return target;
}

/**
 * Normalizes a filesystem watcher path to a forward-slash, relative-to-XIRANG_DIR string.
 * Handles both POSIX and Windows separators so the same detection keys work on all platforms.
 */
export function normalizeWatcherPath(raw: Buffer | string, root?: string): string | null {
  const value = raw.toString().replace(/\\/g, '/');
  if (!root) return value;
  const rootPath = path.resolve(root);
  const absolute = path.resolve(rootPath, value);
  const relative = path.relative(rootPath, absolute);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) return null;
  return relative.split(path.sep).join('/');
}

export function changeFromWatcherPath(normalized: string): string | null {
  const change = normalized.match(/^changes\/([^/]+)(?:\/|$)/)?.[1];
  return change && change !== 'archive' ? change : null;
}

export type WatcherRefresh = { all: true } | { all: false; change: string };

export function watcherRefreshForPath(normalized: string | null): WatcherRefresh | null {
  if (normalized === null || normalized === 'changes/archive' || normalized.startsWith('changes/archive/')) {
    return { all: true };
  }
  if (PARTITIONS.some(partition => normalized.startsWith(`model/${partition}/`))) return { all: true };
  if (normalized === 'candidate' || normalized.startsWith('candidate/')) return { all: true };
  const change = changeFromWatcherPath(normalized);
  return change ? { all: false, change } : null;
}

export class ViewCommand {
  constructor(private readonly launch: ViewLauncher = launchEmbeddedLikeC4) {}

  async execute(startPath: string = '.', options: { listen?: string; port?: number } = {}): Promise<void> {
    const projectRoot = findXirangProjectRoot(startPath);
    if (!projectRoot) {
      throw new Error('未找到 Xirang 项目');
    }

    const snapshotDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-view-'));
    try {
      let runtimeSnapshot = await buildViewRuntimeSnapshot(projectRoot);
      const changeManifestFile = await writeViewRuntimeSnapshot(runtimeSnapshot, snapshotDirectory);
      let sourceWatcher: FSWatcher | undefined;
      let refreshTimer: NodeJS.Timeout | undefined;
      let refreshing = Promise.resolve();
      let refreshAll = false;
      const refreshChanges = new Set<string>();
      const refresh = () => {
        const all = refreshAll;
        const changes = [...refreshChanges];
        refreshAll = false;
        refreshChanges.clear();
        refreshing = refreshing.then(async () => {
          let next = runtimeSnapshot;
          if (all) next = await buildViewRuntimeSnapshot(projectRoot);
          else for (const change of changes) {
            next = await buildViewRuntimeSnapshot(projectRoot, { previous: next, onlyChange: change });
          }
          if (all) await generateLikeC4Artifacts(projectRoot);
          await writeViewRuntimeSnapshot(next, snapshotDirectory);
          runtimeSnapshot = next;
        }).catch(() => undefined);
      };
      try {
        sourceWatcher = watch(path.join(projectRoot, XIRANG_DIR_NAME), { recursive: true }, (_event, filename) => {
          const normalized = filename
            ? normalizeWatcherPath(filename, path.join(projectRoot, XIRANG_DIR_NAME))
            : null;
          if (filename && !normalized) return;
          const requested = watcherRefreshForPath(normalized);
          if (!requested) return;
          if (requested.all) refreshAll = true;
          else refreshChanges.add(requested.change);
          if (refreshTimer) clearTimeout(refreshTimer);
          refreshTimer = setTimeout(refresh, 75);
        });
      } catch {
        sourceWatcher = undefined;
      }
      try {
        await this.launch({
          projectRoot,
          likec4SourceDir: await generateLikeC4Artifacts(projectRoot),
          changeManifestFile,
          listen: options.listen,
          port: options.port,
        });
      } finally {
        sourceWatcher?.close();
        if (refreshTimer) clearTimeout(refreshTimer);
        await refreshing;
      }
    } finally {
      await fs.rm(snapshotDirectory, { recursive: true, force: true });
    }
  }
}
