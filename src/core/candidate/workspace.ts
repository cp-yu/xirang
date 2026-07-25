import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { stringify as stringifyYaml, parse as parseYaml } from 'yaml';
import { XIRANG_DIR_NAME } from '../config.js';
import { ARCHITECTURE_FILE_MANIFEST } from '../templates/architecture-skeleton.js';
import { compareUtf8Bytes } from './canonical.js';

export type CandidateBaselineInput =
  | { kind: 'clean' }
  | { kind: 'current' }
  | { kind: 'path'; path: string };

export type CandidateBaseline =
  | { kind: 'clean'; reference: null }
  | { kind: 'current'; reference: '.xirang' }
  | { kind: 'path'; reference: string };

interface CandidateStatusBase {
  inventory: {
    architectureFiles: string[];
    specFiles: string[];
    bytes: number;
  };
  history: { count: number; bytes: number };
  readiness: {
    metadata: boolean;
    build: boolean;
    specification: boolean;
    model: boolean;
    relations: boolean;
    views: boolean;
    specsDirectory: boolean;
  };
}

export type CandidateStatus = CandidateStatusBase & (
  | {
      active: false;
      baseline: null;
      guidance: { init: string };
    }
  | {
      active: true;
      baseline: CandidateBaseline | null;
      guidance: { resume: string; restart: string };
    }
);

async function exists(target: string): Promise<boolean> {
  return fs.lstat(target).then(() => true, (error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return false;
    throw error;
  });
}

async function assertDirectory(target: string, label: string): Promise<void> {
  const stat = await fs.stat(target).catch(() => null);
  if (!stat?.isDirectory()) throw new Error(`${label} directory not found: ${target}`);
}

async function assertNoSymlinks(root: string): Promise<void> {
  const rootStat = await fs.lstat(root);
  if (rootStat.isSymbolicLink()) throw new Error(`Candidate source contains a symlink: ${root}`);

  const entries = await fs.readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    const target = path.join(root, entry.name);
    const stat = await fs.lstat(target);
    if (stat.isSymbolicLink()) throw new Error(`Candidate source contains a symlink: ${target}`);
    if (stat.isDirectory()) await assertNoSymlinks(target);
  }
}

async function copySource(source: string, staging: string): Promise<void> {
  const architecture = path.join(source, 'architecture');
  const specs = path.join(source, 'specs');
  await assertDirectory(architecture, 'Architecture');
  await assertDirectory(specs, 'Specs');
  await assertNoSymlinks(architecture);
  await assertNoSymlinks(specs);
  await fs.cp(architecture, path.join(staging, 'architecture'), {
    recursive: true,
    force: false,
    filter: sourcePath => path.basename(sourcePath) !== '.likec4',
  });
  await fs.cp(specs, path.join(staging, 'specs'), { recursive: true, force: false });
}

function inferProjectName(projectRoot: string): string {
  return path.basename(projectRoot) || 'Project';
}

interface PathSemantics {
  relative(from: string, to: string): string;
  isAbsolute(target: string): boolean;
  sep: string;
}

export function toCanonicalProjectRelativePath(
  projectRoot: string,
  target: string,
  pathSemantics: PathSemantics = path,
): string {
  const relative = pathSemantics.relative(projectRoot, target);
  if (pathSemantics.isAbsolute(relative)) {
    throw new Error('Candidate baseline must use the same filesystem root as the project.');
  }
  return relative.split(pathSemantics.sep).join('/') || '.';
}

async function writeCleanSkeleton(projectRoot: string, staging: string): Promise<void> {
  const architecture = path.join(staging, 'architecture');
  await fs.mkdir(architecture, { recursive: true });
  await fs.mkdir(path.join(staging, 'specs'), { recursive: true });
  const projectName = inferProjectName(projectRoot);
  const context = {
    projectName,
    projectSummary: `Project intent for ${projectName} is not yet defined.`,
  };
  for (const entry of ARCHITECTURE_FILE_MANIFEST) {
    await fs.writeFile(path.join(architecture, entry.relativePath), entry.render(context), 'utf8');
  }
}

async function resolveBaseline(
  projectRoot: string,
  input: CandidateBaselineInput,
  staging: string,
): Promise<CandidateBaseline> {
  if (input.kind === 'clean') {
    await writeCleanSkeleton(projectRoot, staging);
    return { kind: 'clean', reference: null };
  }

  const source = input.kind === 'current'
    ? path.join(projectRoot, XIRANG_DIR_NAME)
    : path.resolve(projectRoot, input.path);
  await copySource(source, staging);
  return input.kind === 'current'
    ? { kind: 'current', reference: '.xirang' }
    : { kind: 'path', reference: toCanonicalProjectRelativePath(projectRoot, source) };
}

export async function initializeCandidate(
  projectRootInput: string,
  input: CandidateBaselineInput,
): Promise<CandidateStatus> {
  const projectRoot = path.resolve(projectRootInput);
  const xirangRoot = path.join(projectRoot, XIRANG_DIR_NAME);
  const candidate = path.join(xirangRoot, 'candidate');
  await assertDirectory(xirangRoot, 'Xirang workspace');
  if (await exists(candidate)) throw new Error('An active .xirang/candidate workspace already exists.');

  const staging = path.join(xirangRoot, `.candidate-${randomUUID()}`);
  try {
    await fs.mkdir(staging, { recursive: false });
    const baseline = await resolveBaseline(projectRoot, input, staging);
    await fs.writeFile(path.join(staging, 'build.md'), '\n', 'utf8');
    const metadata = {
      schemaVersion: 1,
      createdAt: new Date().toISOString(),
      baseline,
    };
    await fs.writeFile(path.join(staging, 'candidate.yaml'), stringifyYaml(metadata), 'utf8');
    await fs.rename(staging, candidate);
  } catch (error) {
    await fs.rm(staging, { recursive: true, force: true }).catch(() => undefined);
    throw error;
  }

  return getCandidateStatus(projectRoot);
}

async function listRegularFiles(root: string, prefix: string): Promise<{ files: string[]; bytes: number }> {
  if (!await exists(root)) return { files: [], bytes: 0 };
  const files: string[] = [];
  let bytes = 0;

  async function walk(directory: string): Promise<void> {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const target = path.join(directory, entry.name);
      const stat = await fs.lstat(target);
      if (stat.isSymbolicLink()) continue;
      if (stat.isDirectory()) await walk(target);
      else if (stat.isFile()) {
        files.push(`${prefix}/${path.relative(root, target).split(path.sep).join('/')}`);
        bytes += stat.size;
      }
    }
  }

  await walk(root);
  files.sort(compareUtf8Bytes);
  return { files, bytes };
}

async function historyStatus(xirangRoot: string): Promise<{ count: number; bytes: number }> {
  const builds = path.join(xirangRoot, 'history', 'builds');
  if (!await exists(builds)) return { count: 0, bytes: 0 };
  const entries = await fs.readdir(builds, { withFileTypes: true });
  const count = entries.filter((entry) => entry.isDirectory()).length;
  const inventory = await listRegularFiles(builds, 'history/builds');
  return { count, bytes: inventory.bytes };
}

async function isDirectory(target: string): Promise<boolean> {
  return fs.stat(target).then((stat) => stat.isDirectory(), () => false);
}

export async function getCandidateStatus(projectRootInput: string): Promise<CandidateStatus> {
  const projectRoot = path.resolve(projectRootInput);
  const xirangRoot = path.join(projectRoot, XIRANG_DIR_NAME);
  const candidate = path.join(xirangRoot, 'candidate');
  const history = await historyStatus(xirangRoot);

  if (!await exists(candidate)) {
    return {
      active: false,
      baseline: null,
      inventory: { architectureFiles: [], specFiles: [], bytes: 0 },
      history,
      readiness: {
        metadata: false,
        build: false,
        specification: false,
        model: false,
        relations: false,
        views: false,
        specsDirectory: false,
      },
      guidance: {
        init: 'Run "xirang candidate init" with an explicit starting point.',
      },
    };
  }

  const metadataPath = path.join(candidate, 'candidate.yaml');
  let baseline: CandidateBaseline | null = null;
  if (await exists(metadataPath)) {
    const parsed = parseYaml(await fs.readFile(metadataPath, 'utf8')) as { baseline?: CandidateBaseline };
    baseline = parsed?.baseline ?? null;
  }
  const architecture = await listRegularFiles(path.join(candidate, 'architecture'), 'architecture');
  const specs = await listRegularFiles(path.join(candidate, 'specs'), 'specs');
  const ownFiles = await listRegularFiles(candidate, 'candidate');

  return {
    active: true,
    baseline,
    inventory: {
      architectureFiles: architecture.files,
      specFiles: specs.files,
      bytes: ownFiles.bytes,
    },
    history,
    readiness: {
      metadata: await exists(metadataPath),
      build: await exists(path.join(candidate, 'build.md')),
      specification: await exists(path.join(candidate, 'architecture', 'specification.c4')),
      model: await exists(path.join(candidate, 'architecture', 'model.c4')),
      relations: await exists(path.join(candidate, 'architecture', 'relations.c4')),
      views: await exists(path.join(candidate, 'architecture', 'views.c4')),
      specsDirectory: await isDirectory(path.join(candidate, 'specs')),
    },
    guidance: {
      resume: 'Continue editing the active .xirang/candidate workspace.',
      restart: 'Explicitly remove or archive .xirang/candidate, then run "xirang candidate init" again.',
    },
  };
}
