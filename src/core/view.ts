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
import { serializeElementUnit } from './model/serializer.js';
import { PARTITIONS, type Partition, type SemanticModel } from './model/types.js';
import type { ChangeDiagnostic, ChangeDiff } from './semantic-diff.js';
import { runLikeC4 } from '../commands/arch/runner.js';

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

export interface ViewRuntimeVariant {
  id: string;
  label: string;
  kind: 'formal' | 'change';
  change?: string;
  valid: boolean;
  formalFingerprint?: string;
  changeFingerprint?: string;
  partitionFingerprints?: Record<Partition, string>;
  diff?: ChangeDiff;
  architecture?: BrowserSemanticModel;
  /** element identity → Contract markdown; the only Contract transport to the Browser. */
  contracts?: Record<string, string>;
  diagnostics: ChangeDiagnostic[];
}

export interface ViewRuntimeSnapshot {
  version: 1;
  variants: ViewRuntimeVariant[];
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

function projectBrowserDiff(diff: ChangeDiff): ChangeDiff {
  const projectEntry = (entry: ChangeDiff['entries'][number]): ChangeDiff['entries'][number] => ({
    ...entry,
    ...(entry.kind === 'element-declaration' && entry.before
      ? { before: projectBrowserDeclaration(entry.before as SemanticModel['elements'][number]['declaration']) }
      : {}),
    ...(entry.kind === 'element-declaration' && entry.after
      ? { after: projectBrowserDeclaration(entry.after as SemanticModel['elements'][number]['declaration']) }
      : {}),
    ...(entry.children ? { children: entry.children.map(projectEntry) } : {}),
  });
  return { ...diff, entries: diff.entries.map(projectEntry) };
}

function partitionFingerprints(model: SemanticModel): Record<Partition, string> {
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

async function buildFormalRuntimeVariant(projectRoot: string): Promise<ViewRuntimeVariant> {
  const { model } = await readFormalSemanticModel(projectRoot);
  return {
    id: 'formal',
    label: 'Current / Formal Architecture',
    kind: 'formal',
    valid: true,
    partitionFingerprints: partitionFingerprints(model),
    contracts: projectContracts(model),
    diagnostics: [],
  };
}

async function buildChangeRuntimeVariant(projectRoot: string, change: string): Promise<ViewRuntimeVariant> {
  try {
    const compiled = await compileChange(projectRoot, change);
    const projection = compiled.target ? projectContracts(compiled.target) : undefined;
    return {
      id: `change:${change}`,
      label: change,
      kind: 'change',
      change,
      valid: compiled.valid,
      formalFingerprint: compiled.formalFingerprint,
      changeFingerprint: compiled.changeFingerprint,
      ...(compiled.target ? { partitionFingerprints: partitionFingerprints(compiled.target) } : {}),
      diff: projectBrowserDiff(compiled.diff),
      ...(compiled.target ? { architecture: projectBrowserArchitecture(compiled.target) } : {}),
      ...(projection ? { contracts: projection } : {}),
      diagnostics: compiled.diagnostics,
    };
  } catch (error) {
    return {
      id: `change:${change}`,
      label: change,
      kind: 'change',
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

export async function buildViewRuntimeSnapshot(
  projectRoot: string,
  options: { previous?: ViewRuntimeSnapshot; onlyChange?: string } = {},
): Promise<ViewRuntimeSnapshot> {
  const changes = await listActiveChanges(projectRoot);
  const previous = new Map(options.previous?.variants.map(variant => [variant.change, variant]));
  const variants: ViewRuntimeVariant[] = [await buildFormalRuntimeVariant(projectRoot)];
  for (const change of changes) {
    const cached = options.onlyChange && options.onlyChange !== change ? previous.get(change) : undefined;
    variants.push(cached ?? await buildChangeRuntimeVariant(projectRoot, change));
  }
  return { version: 1, variants };
}

async function writeViewRuntimeSnapshot(snapshot: ViewRuntimeSnapshot, directory: string): Promise<string> {
  const target = path.join(directory, 'xirang-change-manifest.json');
  await fs.writeFile(target, JSON.stringify(snapshot));
  return target;
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
          const normalized = filename.toString().split(path.sep).join('/');
          if (PARTITIONS.some(partition => normalized.startsWith(`model/${partition}/`))) {
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
