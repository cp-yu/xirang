import { XIRANG_DIR_NAME } from '../core/config.js';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { validateArchitecture } from '../utils/architecture-validator.js';
import { readLikeC4Architecture } from '../utils/likec4-reader.js';

export interface ArchitectureDeltaIssue { level: 'ERROR'; path: string; message: string }
export interface ArchitectureDeltaValidationResult { valid: boolean; issues: ArchitectureDeltaIssue[] }

async function validateV1Delta(projectRoot: string, deltaPath: string): Promise<ArchitectureDeltaValidationResult> {
  const workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-v1-delta-validation-'));
  const source = path.join(projectRoot, XIRANG_DIR_NAME, 'architecture');
  const target = path.join(workspace, XIRANG_DIR_NAME, 'architecture');
  const issuePath = path.basename(deltaPath);
  try {
    await fs.cp(source, target, {
      recursive: true,
      filter: file => path.basename(file) !== '.likec4',
    });
    const modulePath = path.join(target, 'deltas', 'architecture-delta.c4');
    await fs.mkdir(path.dirname(modulePath), { recursive: true });
    await fs.copyFile(deltaPath, modulePath);

    const architecture = await readLikeC4Architecture(workspace);
    const result = await validateArchitecture(workspace, architecture);
    const issues = result.errors.map(error => ({
      level: 'ERROR' as const,
      path: issuePath,
      message: `${error.code}: ${error.message}`,
    }));
    return { valid: issues.length === 0, issues };
  } catch (error) {
    return {
      valid: false,
      issues: [{ level: 'ERROR', path: issuePath, message: (error as Error).message }],
    };
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
}

export async function validateArchitectureDelta(projectRoot: string, deltaPath: string): Promise<ArchitectureDeltaValidationResult> {
  const content = await fs.readFile(deltaPath, 'utf8');
  const architecture = await readLikeC4Architecture(projectRoot);
  if (architecture.profile === 'v1') return validateV1Delta(projectRoot, deltaPath);
  const domains = new Set(architecture.domains.map(domain => domain.id));
  const elements = new Set([
    ...architecture.domains.map(domain => domain.id),
    ...architecture.capabilities.map(capability => capability.id),
  ]);
  const issues: ArchitectureDeltaIssue[] = [];
  for (const match of content.matchAll(/\bextend\s+([A-Za-z_][\w-]*(?:\.[A-Za-z_][\w-]*)?)\s*\{/g)) {
    const target = match[1];
    if (!elements.has(target)) issues.push({
      level: 'ERROR',
      path: path.basename(deltaPath),
      message: target.includes('.')
        ? `Cannot extend nonexistent element: ${target}`
        : `Cannot extend nonexistent domain: ${target}`,
    });
  }
  if (!/\bmodel\s*\{/.test(content)) issues.push({
    level: 'ERROR', path: path.basename(deltaPath), message: 'architecture-delta.c4 must contain a model block',
  });
  return { valid: issues.length === 0, issues };
}
