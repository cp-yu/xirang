import { createHash } from 'node:crypto';
import { existsSync, promises as fs, watch, type FSWatcher } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { XIRANG_DIR_NAME } from './config.js';
import { buildSpecRegistry } from './spec-registry.js';
import { compileChange } from './change-compiler.js';
import type { ChangeDiagnostic, ChangeDiff } from './semantic-diff.js';
import type { SemanticArchitectureModel } from '../utils/semantic-model.js';
import { runLikeC4 } from '../commands/arch/runner.js';

export interface ViewLaunchOptions {
  projectRoot: string;
  architectureDir: string;
  specRegistryFile: string;
  changeManifestFile: string;
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

export const launchEmbeddedLikeC4: ViewLauncher = async ({ projectRoot, architectureDir, specRegistryFile, changeManifestFile, port }) => {
  const args = [
    'start',
    architectureDir,
    '--xirang-project-root',
    projectRoot,
    '--xirang-spec-registry',
    specRegistryFile,
    '--xirang-change-manifest',
    changeManifestFile,
  ];
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
  architectureFingerprint?: string;
  specsFingerprint?: string;
  diff?: ChangeDiff;
  architecture?: SemanticArchitectureModel;
  specs?: Record<string, string[]>;
  contents?: Record<string, string>;
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

function projectContracts(contracts: NonNullable<Awaited<ReturnType<typeof compileChange>>['target']>['contracts']): {
  specs: Record<string, string[]>;
  contents: Record<string, string>;
} {
  const specs: Record<string, string[]> = {};
  const contents: Record<string, string> = {};
  for (const contract of [...contracts].sort((left, right) => left.specId.localeCompare(right.specId))) {
    const specPath = `.xirang/specs/${contract.specId}/spec.md`;
    (specs[contract.elementId] ??= []).push(specPath);
    const lines = [
      '---', `element: ${contract.elementId}`, '---', '',
      '## Purpose', `Target contract for ${contract.specId}.`, '',
      '## Requirements', '',
    ];
    for (const requirement of contract.requirements) {
      lines.push(`### Requirement: ${requirement.title}`, requirement.body, '');
      for (const scenario of requirement.scenarios) {
        lines.push(`#### Scenario: ${scenario.title}`, scenario.body, '');
      }
    }
    contents[specPath] = lines.join('\n').trimEnd() + '\n';
  }
  for (const paths of Object.values(specs)) paths.sort();
  return { specs, contents };
}

const formalRuntimeVariant: ViewRuntimeVariant = {
  id: 'formal',
  label: 'Current / Formal Architecture',
  kind: 'formal',
  valid: true,
  diagnostics: [],
};

async function buildChangeRuntimeVariant(projectRoot: string, change: string): Promise<ViewRuntimeVariant> {
  try {
    const compiled = await compileChange(projectRoot, change);
    const projection = compiled.target ? projectContracts(compiled.target.contracts) : undefined;
    return {
      id: `change:${change}`,
      label: change,
      kind: 'change',
      change,
      valid: compiled.valid,
      formalFingerprint: compiled.formalFingerprint,
      changeFingerprint: compiled.changeFingerprint,
      ...(compiled.target ? {
        architectureFingerprint: runtimeFingerprint(compiled.target.architecture),
        specsFingerprint: runtimeFingerprint(compiled.target.contracts),
      } : {}),
      diff: compiled.diff,
      ...(compiled.target ? { architecture: compiled.target.architecture } : {}),
      ...(projection ?? {}),
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
  const variants: ViewRuntimeVariant[] = [formalRuntimeVariant];
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

async function writeSpecRegistrySnapshot(projectRoot: string, directory: string): Promise<string> {
  const registry = await buildSpecRegistry(projectRoot);
  const elements = Object.fromEntries(
    [...registry.elementToSpecs.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([elementId, specs]) => [
        elementId,
        specs.map(specId => `.xirang/specs/${specId}/spec.md`).sort(),
      ]),
  );
  const target = path.join(directory, 'xirang-spec-registry.json');
  await fs.writeFile(target, JSON.stringify({ version: 1, elements }));
  return target;
}

export class ViewCommand {
  constructor(private readonly launch: ViewLauncher = launchEmbeddedLikeC4) {}

  async execute(startPath: string = '.', options: { port?: number } = {}): Promise<void> {
    const projectRoot = findXirangProjectRoot(startPath);
    if (!projectRoot) {
      throw new Error('未找到 Xirang 项目');
    }

    const snapshotDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-view-'));
    try {
      let runtimeSnapshot = await buildViewRuntimeSnapshot(projectRoot);
      const [specRegistryFile, changeManifestFile] = await Promise.all([
        writeSpecRegistrySnapshot(projectRoot, snapshotDirectory),
        writeViewRuntimeSnapshot(runtimeSnapshot, snapshotDirectory),
      ]);
      let sourceWatcher: FSWatcher | undefined;
      let refreshTimer: NodeJS.Timeout | undefined;
      let refreshing = Promise.resolve();
      let refreshAll = false;
      let refreshRegistry = false;
      const refreshChanges = new Set<string>();
      const refresh = () => {
        const all = refreshAll;
        const registry = refreshRegistry;
        const changes = [...refreshChanges];
        refreshAll = false;
        refreshRegistry = false;
        refreshChanges.clear();
        refreshing = refreshing.then(async () => {
          if (all) runtimeSnapshot = await buildViewRuntimeSnapshot(projectRoot);
          else for (const change of changes) {
            runtimeSnapshot = await buildViewRuntimeSnapshot(projectRoot, { previous: runtimeSnapshot, onlyChange: change });
          }
          await Promise.all([
            ...(registry ? [writeSpecRegistrySnapshot(projectRoot, snapshotDirectory)] : []),
            writeViewRuntimeSnapshot(runtimeSnapshot, snapshotDirectory),
          ]);
        }).catch(() => undefined);
      };
      try {
        sourceWatcher = watch(path.join(projectRoot, XIRANG_DIR_NAME), { recursive: true }, (_event, filename) => {
          if (!filename) return;
          const normalized = filename.toString().split(path.sep).join('/');
          if (normalized.startsWith('architecture/')) refreshAll = true;
          else if (normalized.startsWith('specs/')) {
            refreshAll = true;
            refreshRegistry = true;
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
          architectureDir: path.join(projectRoot, XIRANG_DIR_NAME, 'architecture'),
          specRegistryFile,
          changeManifestFile,
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
