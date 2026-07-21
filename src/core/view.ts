import { existsSync } from 'node:fs';
import path from 'node:path';
import { OPSX_DIR_NAME } from './config.js';
import { runLikeC4 } from '../commands/arch/runner.js';

export interface ViewLaunchOptions {
  projectRoot: string;
  architectureDir: string;
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

export const launchEmbeddedLikeC4: ViewLauncher = async ({ projectRoot, architectureDir, port }) => {
  const args = ['start', architectureDir, '--opsx-project-root', projectRoot];
  if (port !== undefined) {
    args.push('--port', String(port));
  }
  await runLikeC4(args);
};

export class ViewCommand {
  constructor(private readonly launch: ViewLauncher = launchEmbeddedLikeC4) {}

  async execute(startPath: string = '.', options: { port?: number } = {}): Promise<void> {
    const projectRoot = findOpsxProjectRoot(startPath);
    if (!projectRoot) {
      throw new Error(`No ${OPSX_DIR_NAME} directory found from ${path.resolve(startPath)}`);
    }

    await this.launch({
      projectRoot,
      architectureDir: path.join(projectRoot, OPSX_DIR_NAME, 'architecture'),
      port: options.port,
    });
  }
}
