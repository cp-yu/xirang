import { existsSync, promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { OPSX_DIR_NAME } from './config.js';
import { buildSpecRegistry } from './spec-registry.js';
import { runLikeC4 } from '../commands/arch/runner.js';

export interface ViewLaunchOptions {
  projectRoot: string;
  architectureDir: string;
  specRegistryFile: string;
  port?: number;
}

export type ViewLauncher = (options: ViewLaunchOptions) => Promise<void>;

export function findOpsxProjectRoot(startPath: string): string | undefined {
  let current = path.resolve(startPath);

  while (true) {
    if (existsSync(path.join(current, OPSX_DIR_NAME))) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return undefined;
    }
    current = parent;
  }
}

export const launchEmbeddedLikeC4: ViewLauncher = async ({ projectRoot, architectureDir, specRegistryFile, port }) => {
  const args = [
    'start',
    architectureDir,
    '--opsx-project-root',
    projectRoot,
    '--opsx-spec-registry',
    specRegistryFile,
  ];
  if (port !== undefined) {
    args.push('--port', String(port));
  }
  await runLikeC4(args);
};

async function writeSpecRegistrySnapshot(projectRoot: string, directory: string): Promise<string> {
  const registry = await buildSpecRegistry(projectRoot);
  const elements = Object.fromEntries(
    [...registry.elementToSpecs.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([elementId, specs]) => [
        elementId,
        specs.map(specId => `.opsx/specs/${specId}/spec.md`).sort(),
      ]),
  );
  const target = path.join(directory, 'opsx-spec-registry.json');
  await fs.writeFile(target, JSON.stringify({ version: 1, elements }));
  return target;
}

export class ViewCommand {
  constructor(private readonly launch: ViewLauncher = launchEmbeddedLikeC4) {}

  async execute(startPath: string = '.', options: { port?: number } = {}): Promise<void> {
    const projectRoot = findOpsxProjectRoot(startPath);
    if (!projectRoot) {
      throw new Error('未找到 OPSX 项目');
    }

    const snapshotDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'opsx-view-'));
    try {
      const specRegistryFile = await writeSpecRegistrySnapshot(projectRoot, snapshotDirectory);
      await this.launch({
        projectRoot,
        architectureDir: path.join(projectRoot, OPSX_DIR_NAME, 'architecture'),
        specRegistryFile,
        port: options.port,
      });
    } finally {
      await fs.rm(snapshotDirectory, { recursive: true, force: true });
    }
  }
}
