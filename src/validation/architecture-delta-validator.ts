import { promises as fs } from 'node:fs';
import path from 'node:path';
import { readLikeC4Architecture } from '../utils/likec4-reader.js';

export interface ArchitectureDeltaIssue { level: 'ERROR'; path: string; message: string }
export interface ArchitectureDeltaValidationResult { valid: boolean; issues: ArchitectureDeltaIssue[] }

export async function validateArchitectureDelta(projectRoot: string, deltaPath: string): Promise<ArchitectureDeltaValidationResult> {
  const content = await fs.readFile(deltaPath, 'utf8');
  const architecture = await readLikeC4Architecture(projectRoot);
  const domains = new Set(architecture.domains.map(domain => domain.id));
  const issues: ArchitectureDeltaIssue[] = [];
  for (const match of content.matchAll(/\bextend\s+([A-Za-z_][\w-]*)\s*\{/g)) {
    if (!domains.has(match[1])) issues.push({
      level: 'ERROR', path: path.basename(deltaPath), message: `Cannot extend nonexistent domain: ${match[1]}`,
    });
  }
  if (!/\bmodel\s*\{/.test(content)) issues.push({
    level: 'ERROR', path: path.basename(deltaPath), message: 'architecture-delta.c4 must contain a model block',
  });
  return { valid: issues.length === 0, issues };
}
