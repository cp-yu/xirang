import path from 'node:path';
import { readFile, lstat } from 'node:fs/promises';
import {
  loadChangeContext, formatChangeStatus, resolveSchema, resolveArtifactOutputs,
  type ChangeStatus,
} from '../../core/artifact-graph/index.js';
import { validateTaskStructure } from '../../core/parsers/task-structure.js';
import { readQualityCompletion } from '../../core/quality/state.js';
import { validateChangeExists, validateSchemaExists, getAvailableChanges, getStatusIndicator } from './shared.js';

export interface StatusOptions { change?: string; schema?: string; json?: boolean }
export interface WorkflowStatus extends ChangeStatus {
  state: 'blocked' | 'ready' | 'needs_review' | 'needs_optimize' | 'all_done';
  goals: { total: number; completed: number; remaining: number };
  gaps: Array<{ path: string; message: string }>;
}

export async function loadWorkflowStatus(projectRoot: string, changeName: string, schemaName?: string): Promise<WorkflowStatus> {
  const context = loadChangeContext(projectRoot, changeName, schemaName);
  const schema = resolveSchema(context.schemaName, projectRoot);
  const status = formatChangeStatus(context);
  const result: WorkflowStatus = { ...status, state: 'ready', goals: { total: 0, completed: 0, remaining: 0 }, gaps: [] };
  for (const artifact of result.artifacts) {
    const definition = schema.artifacts.find(a => a.id === artifact.id)!;
    Object.assign(artifact, { outputs: resolveArtifactOutputs(context.changeDir, definition.generates).map(p => path.relative(projectRoot, p).split(path.sep).join('/')) });
    if (definition.completionMarker) {
      const marker = path.join(context.changeDir, definition.completionMarker);
      const stat = await lstat(marker).catch((error: NodeJS.ErrnoException) => { if (error.code === 'ENOENT') return undefined; throw error; });
      Object.assign(artifact, { completionMarker: { path: path.relative(projectRoot, marker).split(path.sep).join('/'), present: !!stat?.isFile() } });
    }
    if (result.applyRequires.includes(artifact.id) && artifact.status !== 'done') {
      result.gaps.push({ path: artifact.outputPath, message: `Missing required artifact: ${artifact.id}` });
    }
  }
  const tracks = schema.apply?.tracks;
  if (tracks) {
    try {
      const content = await readFile(path.join(context.changeDir, tracks), 'utf8');
      const validation = validateTaskStructure(content);
      result.gaps.push(...validation.issues.filter(i => i.severity === 'error').map(i => ({ path: tracks, message: i.message })));
      const section = content.replace(/\r\n?/g, '\n').split(/^##\s+Goals\s*$/m)[1]?.split(/^##\s+/m)[0] ?? '';
      const goals = [...section.matchAll(/^\s*-\s+\[([ xX])\]\s+G\d+:\s*\S.*$/gm)];
      const completed = goals.filter(g => g[1].toLowerCase() === 'x').length;
      result.goals = { total: goals.length, completed, remaining: goals.length - completed };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      result.gaps.push({ path: tracks, message: 'Tracking file is missing' });
    }
  }
  if (result.gaps.length) result.state = 'blocked';
  else if (tracks && result.goals.total > 0 && result.goals.remaining === 0) {
    const quality = await readQualityCompletion(context.changeDir, projectRoot);
    result.state = quality.status;
    result.gaps.push(...quality.gaps.map(message => ({ path: '.quality.json', message })));
    if (quality.diagnostic) result.gaps.push({ path: '.quality.json', message: quality.diagnostic });
  }
  return result;
}

export async function statusCommand(options: StatusOptions): Promise<void> {
  const projectRoot = process.cwd();
  if (!options.change && (await getAvailableChanges(projectRoot)).length === 0) {
    console.log(options.json ? JSON.stringify({ changes: [] }) : 'No active changes.');
    return;
  }
  const name = await validateChangeExists(options.change, projectRoot);
  if (options.schema) validateSchemaExists(options.schema, projectRoot);
  const status = await loadWorkflowStatus(projectRoot, name, options.schema);
  if (options.json) console.log(JSON.stringify(status));
  else printStatusText(status);
}

export function printStatusText(status: WorkflowStatus): void {
  const complete = status.artifacts.filter(a => a.status === 'done').length;
  console.log(`${status.changeName} (${status.schemaName}): ${status.state}`);
  console.log(`${complete}/${status.artifacts.length} artifacts complete; ${status.goals.completed}/${status.goals.total} goals complete`);
  for (const artifact of status.artifacts) console.log(`${getStatusIndicator(artifact.status)} ${artifact.id}${artifact.missingDeps?.length ? `: ${artifact.missingDeps.join(', ')}` : ''}`);
  for (const gap of status.gaps) console.log(`${gap.path}: ${gap.message}`);
}
