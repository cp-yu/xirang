import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { stringify as stringifyYaml } from 'yaml';
import { OPSX_DIR_NAME } from '../config.js';

export interface CandidatePromotionMetadata {
  schemaVersion: 1;
  reviewDigest: string;
  promotedAt: string;
  previousFormalFingerprint: string;
  candidate: 'candidate';
  previous: {
    architecture: 'previous/architecture';
    specs: 'previous/specs';
  };
}

export interface CandidateHistoryReservation {
  id: string;
  directory: string;
  relativePath: string;
  finalize(metadata: CandidatePromotionMetadata): Promise<void>;
  discard(): Promise<void>;
}

function buildId(now: Date, reviewDigest: string): string {
  return `${now.toISOString().replace(/[:.]/g, '-')}-${reviewDigest.slice(0, 12)}-${randomUUID()}`;
}

export function createCandidateHistoryRelativePath(now: Date, reviewDigest: string): string {
  return `${OPSX_DIR_NAME}/history/builds/${buildId(now, reviewDigest)}`;
}

export async function reserveCandidateHistory(
  projectRoot: string,
  reviewDigest: string,
  buildBytes: Uint8Array,
  now: Date,
  relativePath = createCandidateHistoryRelativePath(now, reviewDigest),
): Promise<CandidateHistoryReservation> {
  if (!/^\.opsx\/history\/builds\/[^/]+$/.test(relativePath)) {
    throw new Error(`Invalid Candidate history path: ${relativePath}`);
  }
  const id = path.posix.basename(relativePath);
  const buildsRoot = path.join(projectRoot, OPSX_DIR_NAME, 'history', 'builds');
  const directory = path.join(projectRoot, ...relativePath.split('/'));
  await fs.mkdir(buildsRoot, { recursive: true });
  await fs.mkdir(directory, { recursive: false });

  try {
    await fs.writeFile(path.join(directory, 'build.md'), buildBytes);
    for (const name of ['architecture', 'specs'] as const) {
      const source = path.join(projectRoot, OPSX_DIR_NAME, name);
      const target = path.join(directory, 'previous', name);
      if (await fs.stat(source).then(() => true, () => false)) {
        await fs.cp(source, target, {
          recursive: true,
          filter: entry => path.basename(entry) !== '.likec4',
        });
      } else {
        await fs.mkdir(target, { recursive: true });
      }
    }
  } catch (error) {
    await fs.rm(directory, { recursive: true, force: true });
    throw error;
  }

  return {
    id,
    directory,
    relativePath,
    async finalize(metadata): Promise<void> {
      await fs.writeFile(path.join(directory, 'promotion.yaml'), stringifyYaml(metadata), 'utf8');
    },
    async discard(): Promise<void> {
      await fs.rm(directory, { recursive: true, force: true });
    },
  };
}
