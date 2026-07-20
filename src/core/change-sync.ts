import { promises as fs } from 'fs';
import path from 'path';
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
  architectureDir: string;
  deltaPath: string;
  originalFiles: Map<string, string>;
}

export interface PreparedChangeSync {
  state: ChangeSyncState;
  specs: {
    writes: PreparedSpecWrite[];
    totals: SpecCounts;
  };
  architecture: PreparedArchitectureWrite | null;
}

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
  const changeDir = path.join(projectRoot, 'openspec', 'changes', changeName);
  const mainSpecsDir = path.join(projectRoot, 'openspec', 'specs');
  const specUpdates = await findSpecUpdates(changeDir, mainSpecsDir);
  const architectureDelta = path.join(changeDir, 'architecture-delta.c4');
  const hasArchitectureDelta = await fileExists(architectureDelta);

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
  const validator = options.skipValidation ? null : new Validator();

  const pendingSpecUpdates: Array<{ update: SpecUpdate; originalContent: string | null }> = [];
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
    pendingSpecUpdates.push({ update, originalContent });
  }

  for (const { update, originalContent } of pendingSpecUpdates) {
    const built = await buildUpdatedSpec(update, state.changeName, projectRoot);
    const action = shouldDeleteRebuiltSpec(built.rebuilt) ? 'delete' : 'write';
    if (validator) {
      const specName = path.basename(path.dirname(update.target));
      if (action === 'write') {
        const report = await validator.validateSpecContent(specName, built.rebuilt);
        if (!report.valid) {
          const errors = report.issues
            .filter((issue) => issue.level === 'ERROR')
            .map((issue) => `  ✗ ${issue.message}`)
            .join('\n');
          throw new Error(`Validation errors in rebuilt spec for ${specName}:\n${errors}`);
        }
      }
    }

    writes.push({
      update,
      rebuilt: built.rebuilt,
      counts: built.counts,
      originalContent,
      action,
    });

    totals.added += built.counts.added;
    totals.modified += built.counts.modified;
    totals.removed += built.counts.removed;
    totals.renamed += built.counts.renamed;
  }

  let architecture: PreparedArchitectureWrite | null = null;
  if (state.hasArchitectureDelta) {
    const deltaPath = path.join(state.changeDir, 'architecture-delta.c4');
    if (!await isArchitectureDeltaApplied(projectRoot, deltaPath)) {
      const architectureDir = path.join(projectRoot, 'openspec', 'architecture');
      architecture = {
        architectureDir,
        deltaPath,
        originalFiles: await readFileTree(architectureDir),
      };
    }
  }


  return {
    state,
    specs: { writes, totals },
    architecture,
  };
}

export async function applyPreparedChangeSync(
  projectRoot: string,
  prepared: PreparedChangeSync,
  options: { silent?: boolean } = {}
): Promise<AppliedChangeSyncSummary> {
  const silent = options.silent ?? false;
  const syncedFiles: string[] = [];

  if (prepared.architecture) {
    await mergeArchitectureDelta(projectRoot, prepared.architecture.deltaPath, { changeName: prepared.state.changeName });
    const mergedFiles = await readFileTree(prepared.architecture.architectureDir);
    const allFiles = new Set([...prepared.architecture.originalFiles.keys(), ...mergedFiles.keys()]);
    syncedFiles.push(...[...allFiles]
      .filter(file => prepared.architecture!.originalFiles.get(file) !== mergedFiles.get(file))
      .map(file => toPosixProjectRelative(projectRoot, file)));
    if (!silent) console.log('Architecture updated successfully.');
  }

  try {
    if (prepared.specs.writes.length > 0) {
      await writePreparedSpecs(prepared.specs.writes, silent);
      syncedFiles.push(
        ...prepared.specs.writes.map((write) => toPosixProjectRelative(projectRoot, write.update.target))
      );
      if (!silent) {
        console.log(
          `Totals: + ${prepared.specs.totals.added}, ~ ${prepared.specs.totals.modified}, - ${prepared.specs.totals.removed}, → ${prepared.specs.totals.renamed}`
        );
        console.log('Specs updated successfully.');
      }
    }
  } catch (error) {
    if (prepared.architecture) {
      await restoreFileTree(prepared.architecture.architectureDir, prepared.architecture.originalFiles);
    }
    throw error;
  }

  await refreshVerifyEvidenceAfterSync(prepared.state.changeDir, projectRoot, syncedFiles);

  return {
    specs: prepared.specs.writes.length > 0 ? 'synced' : 'no-delta',
    architecture: prepared.architecture ? 'synced' : 'no-delta',
    files: syncedFiles,
  };
}

async function isArchitectureDeltaApplied(projectRoot: string, deltaPath: string): Promise<boolean> {
  const delta = parseLikeC4Domain(await fs.readFile(deltaPath, 'utf8'));
  const formal = await readLikeC4Architecture(projectRoot).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return null;
    throw error;
  });
  if (!formal) return false;
  const domains = new Set(formal.domains.map(domain => domain.id));
  const capabilities = new Set(formal.capabilities.flatMap(capability => capability.capabilityId ?? []));
  const relations = new Set(formal.relations.map(relation => `${relation.source}|${relation.kind}|${relation.target}`));

  return delta.domains.every(domain => domains.has(domain.id))
    && delta.capabilities.every(capability => capability.capabilityId && capabilities.has(capability.capabilityId))
    && delta.relations.every(relation => relations.has(`${relation.source}|${relation.kind}|${relation.target}`));
}

async function fileExists(filePath: string): Promise<boolean> {
  try { await fs.access(filePath); return true; } catch { return false; }
}

async function readFileTree(root: string): Promise<Map<string, string>> {
  const files = new Map<string, string>();
  const visit = async (directory: string): Promise<void> => {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(file);
      else files.set(file, await fs.readFile(file, 'utf8'));
    }
  };
  await visit(root);
  return files;
}

async function restoreFileTree(root: string, snapshot: Map<string, string>): Promise<void> {
  const current = await readFileTree(root);
  await Promise.all([...current.keys()]
    .filter(file => !snapshot.has(file))
    .map(file => fs.rm(file, { force: true })));
  for (const [file, content] of snapshot) {
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, content, 'utf8');
  }
}

async function readOptionalFile(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

async function writePreparedSpecs(writes: PreparedSpecWrite[], silent: boolean): Promise<void> {
  const applied: PreparedSpecWrite[] = [];

  try {
    for (const write of writes) {
      if (write.action === 'delete') {
        await fs.rm(write.update.target, { force: true });
      } else {
        await fs.mkdir(path.dirname(write.update.target), { recursive: true });
        await fs.writeFile(write.update.target, write.rebuilt, 'utf-8');
      }
      applied.push(write);

      if (!silent) {
        const specName = path.basename(path.dirname(write.update.target));
        console.log(`Applying changes to openspec/specs/${specName}/spec.md:`);
        if (write.counts.added) console.log(`  + ${write.counts.added} added`);
        if (write.counts.modified) console.log(`  ~ ${write.counts.modified} modified`);
        if (write.counts.removed) console.log(`  - ${write.counts.removed} removed`);
        if (write.counts.renamed) console.log(`  → ${write.counts.renamed} renamed`);
      }
    }
  } catch (error) {
    for (const write of applied.reverse()) {
      if (write.originalContent === null) {
        await fs.rm(write.update.target, { force: true }).catch(() => undefined);
        continue;
      }
      await fs.writeFile(write.update.target, write.originalContent, 'utf-8').catch(() => undefined);
    }
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
