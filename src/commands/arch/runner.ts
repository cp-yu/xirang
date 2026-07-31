import { spawn } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export type LikeC4Runner = (args: string[]) => Promise<void>;

// The LikeC4 CLI loads its runtime dependencies (language-server, language-services,
// core, layouts, ...) from the built `dist/` of these packages. Sources newer than
// the artifacts would make tests silently exercise a stale build, so they are the
// scope of the staleness check.
export const CLI_RUNTIME_PACKAGES = [
  'likec4',
  'language-server',
  'language-services',
  'core',
  'layouts',
  'log',
  'config',
  'generators',
] as const;

export interface LikeC4Layout {
  packagesRoot: string;
  distBin: string;
  tsxCli: string;
  cliSource: string;
}

const defaultLayout: LikeC4Layout = {
  packagesRoot: fileURLToPath(new URL('../../../likec4/packages', import.meta.url)),
  distBin: fileURLToPath(new URL('../../../likec4/packages/likec4/bin/likec4.mjs', import.meta.url)),
  tsxCli: fileURLToPath(new URL('../../../likec4/node_modules/tsx/dist/cli.mjs', import.meta.url)),
  cliSource: fileURLToPath(new URL('../../../likec4/packages/likec4/src/cli/index.ts', import.meta.url)),
};

/** True when any CLI-runtime package has sources newer than its dist artifacts. */
export function isLikeC4DistStale(layout: LikeC4Layout = defaultLayout): boolean {
  for (const pkg of CLI_RUNTIME_PACKAGES) {
    const src = path.join(layout.packagesRoot, pkg, 'src');
    const dist = path.join(layout.packagesRoot, pkg, 'dist');
    if (!existsSync(dist)) return true;
    if (newestMtime(src) > newestMtime(dist)) return true;
  }
  return false;
}

export interface LikeC4Launch {
  /** Full argument list to pass after `process.execPath`. */
  argv: string[];
  mode: 'dist' | 'source';
}

// Staleness detection is a development/test safeguard: in a published install the
// shipped dist is authoritative and src mtimes are meaningless, so the check stays
// off unless explicitly enabled (vitest.config.ts sets it for the test suite).
const STALE_CHECK_ENV = 'XIRANG_LIKEC4_STALE_CHECK';

/**
 * Resolves how to run a LikeC4 CLI invocation. With staleness detection enabled
 * (dev/test only), falls back to running the CLI from source (tsx with the
 * `sources` condition) when dist is stale, so tests never exercise a silent old
 * build. Otherwise always uses the built dist.
 */
export function resolveLikeC4Command(args: string[], layout: LikeC4Layout = defaultLayout): LikeC4Launch {
  if (process.env[STALE_CHECK_ENV] === '1' && isLikeC4DistStale(layout)) {
    return { argv: [layout.tsxCli, '--conditions=sources', layout.cliSource, ...args], mode: 'source' };
  }
  return { argv: [layout.distBin, ...args], mode: 'dist' };
}

const STALE_WARNING =
  'warning: LikeC4 sources are newer than dist; running the CLI from source (tsx).\n' +
  'Run `pnpm likec4:build` to refresh the production build used by the browser and the xirang CLI.\n';

export const runLikeC4: LikeC4Runner = async (args) => {
  const { argv, mode } = resolveLikeC4Command(args);
  if (mode === 'source' && !existsSync(argv[0]!)) {
    throw new Error('LikeC4 dist is stale and tsx is unavailable; run `pnpm likec4:build` first.');
  }
  if (mode === 'source') process.stderr.write(STALE_WARNING);
  await new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, argv, { stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', code => code === 0 ? resolve() : reject(new Error(`LikeC4 exited with code ${code}`)));
  });
};

function newestMtime(dir: string): number {
  let newest = 0;
  const walk = (current: string) => {
    let entries;
    try {
      entries = readdirSync(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        // Skip turbo-managed generate outputs and vendored installs inside src.
        if (entry.name === 'node_modules' || entry.name === '__app__'
          || entry.name === 'generated' || entry.name === 'generated-lib') continue;
        walk(full);
      } else {
        // Skip `*.generated.*` files (turbo `generate` outputs, e.g. layouts).
        if (entry.name.includes('.generated.')) continue;
        const mtimeMs = statSync(full).mtimeMs;
        if (mtimeMs > newest) newest = mtimeMs;
      }
    }
  };
  walk(dir);
  return newest;
}
