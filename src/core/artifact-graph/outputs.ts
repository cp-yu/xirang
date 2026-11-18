import * as fs from 'node:fs';
import * as path from 'node:path';
import fg from 'fast-glob';
import { FileSystemUtils } from '../../utils/file-system.js';
import { isIgnoredDeltaFile } from '../model/paths.js';
import { PARTITIONS } from '../model/types.js';

/**
 * Checks if a path contains glob pattern characters.
 */
export function isGlobPattern(pattern: string): boolean {
  return pattern.includes('*') || pattern.includes('?') || pattern.includes('[');
}

/**
 * Resolves an artifact's output path(s) to concrete files that currently exist.
 * Returns absolute file paths. Glob matches are sorted for deterministic output.
 */
export function resolveArtifactOutputs(changeDir: string, generates: string): string[] {
  if (!isGlobPattern(generates)) {
    const fullPath = path.join(changeDir, generates);
    try {
      return fs.statSync(fullPath).isFile()
        ? [FileSystemUtils.canonicalizeExistingPath(fullPath)]
        : [];
    } catch {
      return [];
    }
  }

  const normalizedPattern = FileSystemUtils.toPosixPath(generates);
  const semanticDelta = normalizedPattern === `{${PARTITIONS.join(',')}}/**/*`;
  const matches = fg.sync(normalizedPattern, {
    cwd: changeDir, onlyFiles: true, absolute: true,
    ...(semanticDelta ? { dot: true, followSymbolicLinks: false } : {}),
  })
    .filter(match => !semanticDelta || !isIgnoredDeltaFile(path.basename(match)))
    .map(match => FileSystemUtils.canonicalizeExistingPath(path.normalize(match)));

  return Array.from(new Set(matches)).sort();
}

/**
 * Checks if an artifact has at least one resolved output file.
 */
export function artifactOutputExists(changeDir: string, generates: string): boolean {
  return resolveArtifactOutputs(changeDir, generates).length > 0;
}
