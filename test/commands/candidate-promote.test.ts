import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SetupCommand } from '../../src/core/setup.js';
import { initializeCandidate } from '../../src/core/candidate/workspace.js';
import { validateCandidate } from '../../src/core/candidate/validator.js';
import {
  promoteCandidate,
  recoverPendingCandidatePromotions,
} from '../../src/core/candidate/promotion.js';
import { SEMANTIC_DIRECTORY_JOURNAL, SEMANTIC_PARTITIONS } from '../../src/core/model/transaction.js';

async function exists(target: string): Promise<boolean> {
  return fs.lstat(target).then(() => true, () => false);
}

async function readFormalTree(root: string): Promise<Map<string, Buffer>> {
  const files = new Map<string, Buffer>();
  const visit = async (directory: string): Promise<void> => {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(target);
      else if (entry.isFile()) files.set(path.relative(root, target), await fs.readFile(target));
    }
  };
  for (const partition of SEMANTIC_PARTITIONS) await visit(path.join(root, '.xirang', 'model', partition));
  return files;
}

describe('Candidate promotion', () => {
  let root: string;
  let candidate: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'opsx-candidate-promote-'));
    await new SetupCommand({
      tools: 'none',
      force: true,
      projectDefinition: 'Candidate promotion test project.',
    }).execute(root);
    await initializeCandidate(root, { kind: 'current' });
    candidate = path.join(root, '.xirang', 'candidate');
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it('backs up the complete preimage and replaces formal source exactly', async () => {
    const stale = path.join(root, '.xirang', 'model', 'views', 'stale', 'note.txt');
    await fs.mkdir(path.dirname(stale), { recursive: true });
    await fs.writeFile(stale, 'stale formal source\n');
    const validation = await validateCandidate(root);
    expect(validation.valid).toBe(true);

    const result = await promoteCandidate(root, validation.reviewDigest!, {
      now: () => new Date('2030-01-02T03:04:05.000Z'),
    });

    expect(result.reviewDigest).toBe(validation.reviewDigest);
    expect(await exists(candidate)).toBe(false);
    expect(await exists(path.dirname(stale))).toBe(false);
    const history = path.join(root, result.historyPath);
    expect(await fs.readFile(path.join(history, 'previous', 'views', 'stale', 'note.txt'), 'utf8'))
      .toBe('stale formal source\n');
    expect(await fs.readFile(path.join(history, 'build.md'), 'utf8')).toBe('\n');
    expect(await exists(path.join(history, 'candidate'))).toBe(false);
    const historyEntries = await fs.readdir(history);
    expect(historyEntries.sort()).toEqual(['build.md', 'previous', 'promotion.yaml']);
    const manifest = await fs.readFile(path.join(history, 'promotion.yaml'), 'utf8');
    expect(manifest).toContain(`reviewDigest: ${validation.reviewDigest}`);
    for (const partition of SEMANTIC_PARTITIONS) expect(manifest).toContain(`previous/${partition}`);
    expect(manifest).not.toContain('candidate:');
    expect(manifest).not.toContain(root);
  });

  it('promotes the first Semantic Model when comparison is unavailable', async () => {
    await fs.rm(path.join(root, '.xirang', 'model'), { recursive: true, force: true });
    const validation = await validateCandidate(root);

    expect(validation.comparison.diff).toBe('unavailable');
    expect(validation.diff).toBeUndefined();

    await promoteCandidate(root, validation.reviewDigest!);

    expect(await exists(candidate)).toBe(false);
    for (const partition of SEMANTIC_PARTITIONS) {
      expect(await exists(path.join(root, '.xirang', 'model', partition))).toBe(true);
    }
  });

  it('rejects a stale digest without changing formal source or history', async () => {
    const validation = await validateCandidate(root);
    const before = await readFormalTree(root);
    await fs.writeFile(path.join(candidate, 'build.md'), 'changed requirement\n');

    await expect(promoteCandidate(root, validation.reviewDigest!)).rejects.toThrow(/digest mismatch/i);

    expect(await readFormalTree(root)).toEqual(before);
    expect(await exists(candidate)).toBe(true);
    expect(await exists(path.join(root, '.xirang', 'history', 'builds'))).toBe(false);
  });

  it('rejects Candidate revalidation failures before formal writes', async () => {
    const validation = await validateCandidate(root);
    const before = await readFormalTree(root);
    await fs.writeFile(path.join(candidate, 'build.md'), Buffer.from('invalid  \r\n'));

    await expect(promoteCandidate(root, validation.reviewDigest!)).rejects.toThrow(/validation failed/i);

    expect(await readFormalTree(root)).toEqual(before);
    expect(await exists(candidate)).toBe(true);
  });

  it('rolls back after post-write digest revalidation detects a concurrent Candidate change', async () => {
    const validation = await validateCandidate(root);
    const before = await readFormalTree(root);

    await expect(promoteCandidate(root, validation.reviewDigest!, {
      transactionFilesystem: {
        rename: async (source, target) => {
          await fs.rename(source, target);
          if (target === path.join(root, '.xirang', 'model', 'views')
            && source.includes('.candidate-promotion-')
            && !source.includes('.backup-')) {
            const build = path.join(path.dirname(source), 'candidate', 'build.md');
            await fs.chmod(build, 0o644);
            await fs.writeFile(build, 'concurrent change\n');
          }
        },
      },
    })).rejects.toThrow(/digest mismatch during promotion/i);

    expect(await readFormalTree(root)).toEqual(before);
    expect(await exists(candidate)).toBe(true);
    expect(await fs.readFile(path.join(candidate, 'build.md'), 'utf8')).toBe('concurrent change\n');
    expect(await fs.readdir(path.join(root, '.xirang', 'history', 'builds')).catch(() => [])).toEqual([]);
  });

  it('rejects and preserves files added after target installation', async () => {
    const validation = await validateCandidate(root);
    const before = await readFormalTree(root);

    await expect(promoteCandidate(root, validation.reviewDigest!, {
      transactionFilesystem: {
        rename: async (source, target) => {
          await fs.rename(source, target);
          if (target === path.join(root, '.xirang', 'model', 'views')
            && source.includes('.candidate-promotion-')
            && !source.includes('.backup-')) {
            await fs.writeFile(path.join(target, 'unreviewed.txt'), 'late formal edit\n');
          }
        },
      },
    })).rejects.toThrow(/does not exactly match/i);

    expect(await readFormalTree(root)).toEqual(before);
    expect(await exists(candidate)).toBe(true);
    const recoveryRoot = path.join(root, '.xirang', 'history', 'recovery');
    const recoveryEntry = (await fs.readdir(recoveryRoot))[0];
    expect(await fs.readFile(path.join(recoveryRoot, recoveryEntry, 'views', 'unreviewed.txt'), 'utf8'))
      .toBe('late formal edit\n');
  });

  it('rejects concurrent formal edits and preserves them outside Candidate history', async () => {
    const validation = await validateCandidate(root);
    const concurrent = path.join(root, '.xirang', 'model', 'views', 'concurrent.txt');
    let injected = false;

    await expect(promoteCandidate(root, validation.reviewDigest!, {
      transactionFilesystem: {
        stat: async (target) => {
          if (!injected && target === path.join(root, '.xirang', 'model', 'elements')) {
            injected = true;
            await fs.writeFile(concurrent, 'concurrent formal edit\n');
          }
          return fs.stat(target);
        },
      },
    })).rejects.toThrow(/changed while promotion was preparing/i);

    expect(await fs.readFile(concurrent, 'utf8')).toBe('concurrent formal edit\n');
    expect(await exists(candidate)).toBe(true);
    expect(await fs.readdir(path.join(root, '.xirang', 'history', 'builds')).catch(() => [])).toEqual([]);
  });

  it('preserves recovered Candidate when an active Candidate already exists', async () => {
    const staging = path.join(root, '.xirang', '.candidate-promotion-active-exists');
    const frozen = path.join(staging, 'candidate');
    for (const partition of SEMANTIC_PARTITIONS) await fs.mkdir(path.join(frozen, partition), { recursive: true });
    await fs.writeFile(path.join(frozen, 'build.md'), 'recovered candidate\n');
    await fs.writeFile(path.join(staging, 'candidate-promotion.json'), `${JSON.stringify({
      schemaVersion: 1,
      historyPath: '.xirang/history/builds/active-exists',
      reviewDigest: 'b'.repeat(64),
    }, null, 2)}\n`);

    await recoverPendingCandidatePromotions(root);

    expect(await exists(candidate)).toBe(true);
    expect(await exists(staging)).toBe(false);
    expect(await fs.readFile(path.join(
      root,
      '.xirang',
      'history',
      'recovery',
      '.candidate-promotion-active-exists',
      'candidate',
      'build.md',
    ), 'utf8')).toBe('recovered candidate\n');
  });

  it('recovers an interrupted directory swap from its durable journal', async () => {
    const before = await readFormalTree(root);
    const staging = path.join(root, '.xirang', '.candidate-promotion-interrupted');
    const backup = path.join(staging, '.backup-interrupted');
    const historyPath = '.xirang/history/builds/interrupted';
    await fs.mkdir(backup, { recursive: true });
    await fs.writeFile(path.join(staging, 'candidate-promotion.json'), `${JSON.stringify({
      schemaVersion: 1,
      historyPath,
      reviewDigest: 'a'.repeat(64),
    }, null, 2)}\n`);
    await fs.writeFile(path.join(staging, SEMANTIC_DIRECTORY_JOURNAL), `${JSON.stringify({
      schemaVersion: 1,
      state: 'prepared',
      formalFingerprint: 'unused-during-recovery',
      targetFingerprint: 'unused-during-recovery',
      targetFingerprints: Object.fromEntries(SEMANTIC_PARTITIONS.map(partition => [partition, 'expected-target'])),
      backupDirectory: '.backup-interrupted',
      existed: Object.fromEntries(SEMANTIC_PARTITIONS.map(partition => [partition, true])),
    }, null, 2)}\n`);
    await fs.rename(candidate, path.join(staging, 'candidate'));
    for (const partition of SEMANTIC_PARTITIONS) {
      await fs.rename(path.join(root, '.xirang', 'model', partition), path.join(backup, partition));
    }
    await fs.mkdir(path.join(root, '.xirang', 'model', 'elements'), { recursive: true });
    await fs.writeFile(path.join(root, '.xirang', 'model', 'elements', 'partial.md'), 'partial\n');
    await fs.mkdir(path.join(root, ...historyPath.split('/')), { recursive: true });

    await recoverPendingCandidatePromotions(root);

    expect(await readFormalTree(root)).toEqual(before);
    expect(await exists(candidate)).toBe(true);
    expect(await exists(staging)).toBe(false);
    expect(await exists(path.join(root, ...historyPath.split('/')))).toBe(false);
    expect(await fs.readFile(path.join(
      root,
      '.xirang',
      'history',
      'recovery',
      '.candidate-promotion-interrupted',
      'elements',
      'partial.md',
    ), 'utf8')).toBe('partial\n');
  });

  it('rolls back formal writes and removes incomplete history when the transaction fails', async () => {
    await fs.writeFile(path.join(candidate, 'views', 'index.md'),
      '---\nentity: authored-view\nidentity: index\ninclude: "*"\n---\n');
    const validation = await validateCandidate(root);
    expect(validation.valid).toBe(true);
    const before = await readFormalTree(root);

    await expect(promoteCandidate(root, validation.reviewDigest!, {
      transactionFilesystem: {
        rename: async (source, target) => {
          if (target === path.join(root, '.xirang', 'model', 'elements')
            && source.includes('.candidate-promotion-')
            && !source.includes('.backup-')) {
            throw Object.assign(new Error('injected transaction failure'), { code: 'EIO' });
          }
          return fs.rename(source, target);
        },
      },
    })).rejects.toThrow(/injected transaction failure/);

    expect(await readFormalTree(root)).toEqual(before);
    expect(await exists(candidate)).toBe(true);
    const builds = path.join(root, '.xirang', 'history', 'builds');
    expect(await fs.readdir(builds).catch(() => [])).toEqual([]);
  });
});
