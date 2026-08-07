import { createHash } from 'node:crypto';
import { existsSync, promises as fs, watch, type FSWatcher } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { XIRANG_DIR_NAME } from './config.js';
import { compileChange, readFormalSemanticModel } from './change-compiler.js';
import { generateLikeC4Artifacts } from '../commands/arch/export.js';
import {
  projectBrowserArchitecture,
  projectBrowserDeclaration,
  type BrowserSemanticModel,
} from './likec4/definition.js';
import { resolveViewSelection, type ResolvedViewSelection } from './likec4/runtime-projection.js';
import { serializeElementUnit } from './model/serializer.js';
import { PARTITIONS, type Partition, type SemanticModel } from './model/types.js';
import type { ChangeDiagnostic, ChangeDiff } from './semantic-diff.js';
import { runLikeC4 } from '../commands/arch/runner.js';
import { validateCandidateSnapshot } from './candidate/validator.js';
import { parseSemanticModelFiles } from './model/parser.js';

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

export interface ViewRuntimeSemanticModel {
  id: 'model';
  label: 'Model View';
  source: 'semantic-model';
  valid: true;
  sourceFingerprint: string;
  partitionFingerprints: Record<Partition, string>;
  architecture: BrowserSemanticModel;
  contracts: Record<string, string>;
  diagnostics: ChangeDiagnostic[];
}

export interface ViewRuntimeChangeDerivedView {
  id: string;
  label: string;
  source: 'change-derived-view';
  change: string;
  valid: boolean;
  semanticModelFingerprint?: string;
  changeFingerprint?: string;
  sourceFingerprint?: string;
  partitionFingerprints?: Record<Partition, string>;
  diff?: ChangeDiff;
  architecture?: BrowserSemanticModel;
  /** element identity → Contract markdown; the only Contract transport to the Browser. */
  contracts?: Record<string, string>;
  diagnostics: ChangeDiagnostic[];
  /** Change plan files (design.md, proposal.md, tasks.md — keys are file basenames). */
  changePlan?: Record<string, string>;
}

export interface ViewRuntimeCandidateView {
  id: 'candidate';
  label: 'Candidate View';
  source: 'candidate';
  valid: boolean;
  partitionFingerprints?: Record<Partition, string>;
  sourceFingerprint?: string;
  architecture?: BrowserSemanticModel;
  contracts?: Record<string, string>;
  diagnostics: ChangeDiagnostic[];
}

export interface ViewRuntimeCandidateDiffView {
  id: 'candidate-diff';
  label: 'Candidate Diff View';
  source: 'candidate-diff';
  valid: boolean;
  semanticModelFingerprint?: string;
  sourceFingerprint?: string;
  partitionFingerprints?: Record<Partition, string>;
  diff?: ChangeDiff;
  architecture?: BrowserSemanticModel;
  contracts?: Record<string, string>;
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
  candidate?: ViewRuntimeCandidateView;
  candidateDiff?: ViewRuntimeCandidateDiffView;
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

async function buildSemanticModelSource(projectRoot: string): Promise<ViewRuntimeSemanticModel> {
  const { model } = await readFormalSemanticModel(projectRoot);
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
    diagnostics: [],
  };
}

async function buildChangeDerivedView(projectRoot: string, change: string): Promise<ViewRuntimeChangeDerivedView> {
  try {
    const compiled = await compileChange(projectRoot, change);
    const projection = compiled.target ? projectContracts(compiled.target) : undefined;
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
      id: `change:${change}`,
      label: change,
      source: 'change-derived-view',
      change,
      valid: compiled.valid,
      semanticModelFingerprint: compiled.formalFingerprint,
      changeFingerprint: compiled.changeFingerprint,
      sourceFingerprint: hashString(compiled.formalFingerprint + compiled.changeFingerprint),
      ...(compiled.target ? { partitionFingerprints: partitionFingerprints(compiled.target) } : {}),
      diff: projectBrowserDiff(compiled.diff),
      ...(compiled.target ? { architecture: projectBrowserArchitecture(compiled.target) } : {}),
      ...(projection ? { contracts: projection } : {}),
      diagnostics: compiled.diagnostics,
      ...(Object.keys(changePlan).length > 0 ? { changePlan } : {}),
    };
  } catch (error) {
    return {
      id: `change:${change}`,
      label: change,
      source: 'change-derived-view',
      change,
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
): Promise<{ candidate: ViewRuntimeCandidateView; candidateDiff: ViewRuntimeCandidateDiffView } | undefined> {
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
    // Combined fingerprint includes both candidate content and formal model baseline so both
    // candidate and candidateDiff invalidate together when either source changes.
    const formalFp = result.comparison.baseline === 'formal' ? result.comparison.formalFingerprint : ''
    const sourceFingerprint = snapshot.reviewDigest
      ? hashString(snapshot.reviewDigest + formalFp)
      : undefined;

    const candidate: ViewRuntimeCandidateView = {
      id: 'candidate',
      label: 'Candidate View',
      source: 'candidate',
      valid: result.valid,
      ...(fingerprints ? { partitionFingerprints: fingerprints } : {}),
      ...(sourceFingerprint ? { sourceFingerprint } : {}),
      ...(architecture ? { architecture } : {}),
      ...(contracts ? { contracts } : {}),
      diagnostics: result.diagnostics,
    };

    const candidateDiff: ViewRuntimeCandidateDiffView = {
      id: 'candidate-diff',
      label: 'Candidate Diff View',
      source: 'candidate-diff',
      valid: result.valid,
      ...(result.comparison.baseline === 'formal' ? { semanticModelFingerprint: result.comparison.formalFingerprint } : {}),
      ...(sourceFingerprint ? { sourceFingerprint } : {}),
      ...(fingerprints ? { partitionFingerprints: fingerprints } : {}),
      ...(result.diff ? { diff: projectBrowserDiff(result.diff) } : {}),
      ...(architecture ? { architecture } : {}),
      ...(contracts ? { contracts } : {}),
      diagnostics: result.diagnostics,
    };

    return { candidate, candidateDiff };
  } catch (error) {
    const diagnostics: ChangeDiagnostic[] = [{
      level: 'ERROR',
      code: 'CANDIDATE_RUNTIME_FAILED',
      path: path.posix.join('.xirang', 'candidate'),
      message: error instanceof Error ? error.message : 'Unable to build Candidate sources',
    }];
    return {
      candidate: {
        id: 'candidate',
        label: 'Candidate View',
        source: 'candidate',
        valid: false,
        diagnostics,
      },
      candidateDiff: {
        id: 'candidate-diff',
        label: 'Candidate Diff View',
        source: 'candidate-diff',
        valid: false,
        diagnostics,
      },
    };
  }
}

export async function buildViewRuntimeSnapshot(
  projectRoot: string,
  options: { previous?: ViewRuntimeSnapshot; onlyChange?: string } = {},
): Promise<ViewRuntimeSnapshot> {
  const changes = await listActiveChanges(projectRoot);
  const previous = options.previous?.changes ?? {};
  const entries = await Promise.all(
    changes.map(async change => {
      const cached = options.onlyChange && options.onlyChange !== change ? previous[change] : undefined;
      return [change, cached ?? await buildChangeDerivedView(projectRoot, change)] as const;
    }),
  );
  const sources = Object.fromEntries(entries);

  const [candidateSources, semanticModel] = await Promise.all([
    buildCandidateSources(projectRoot),
    buildSemanticModelSource(projectRoot),
  ]);

  // The Browser server consumes the resolved selection directly, so closure, exclude precedence
  // and virtual-root detection stay in one place instead of being re-derived per consumer.
  const { model } = await readFormalSemanticModel(projectRoot);
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
    ...(candidateSources ? { candidate: candidateSources.candidate, candidateDiff: candidateSources.candidateDiff } : {}),
    changes: sources,
  };
}

async function writeViewRuntimeSnapshot(snapshot: ViewRuntimeSnapshot, directory: string): Promise<string> {
  const target = path.join(directory, 'xirang-change-manifest.json');
  await fs.writeFile(target, JSON.stringify(snapshot));
  return target;
}

/**
 * Normalizes a filesystem watcher path to a forward-slash, relative-to-XIRANG_DIR string.
 * Handles both POSIX and Windows separators so the same detection keys work on all platforms.
 */
export function normalizeWatcherPath(raw: Buffer | string): string {
  // Replace both `\` and `/` with `/` to handle Windows paths on any host OS.
  return raw.toString().replace(/\\/g, '/');
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
          if (all) runtimeSnapshot = await buildViewRuntimeSnapshot(projectRoot);
          else for (const change of changes) {
            runtimeSnapshot = await buildViewRuntimeSnapshot(projectRoot, { previous: runtimeSnapshot, onlyChange: change });
          }
          await writeViewRuntimeSnapshot(runtimeSnapshot, snapshotDirectory);
        }).catch(() => undefined);
      };
      try {
        sourceWatcher = watch(path.join(projectRoot, XIRANG_DIR_NAME), { recursive: true }, (_event, filename) => {
          if (!filename) return;
          const normalized = normalizeWatcherPath(filename);
          if (PARTITIONS.some(partition => normalized.startsWith(`model/${partition}/`))) {
            refreshAll = true;
          } else if (normalized.startsWith('candidate/')) {
            refreshAll = true;
          } else {
            const change = normalized.match(/^changes\/([^/]+)\//)?.[1];
            if (!change || change === 'archive') return;
            refreshChanges.add(change);
          }
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
