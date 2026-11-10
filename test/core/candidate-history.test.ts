import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SetupCommand } from '../../src/core/setup.js';
import { initializeCandidate } from '../../src/core/candidate/workspace.js';
import { validateCandidate } from '../../src/core/candidate/validator.js';
import { recordCoverage } from '../../src/core/record/coverage.js';
import { createRecord } from '../../src/core/record/workspace.js';
import { readRecordSemanticContext } from '../../src/core/record/validator.js';
import { promoteCandidate } from '../../src/core/candidate/promotion.js';

describe('Candidate build history', () => {
  let root: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-candidate-history-'));
    await new SetupCommand({
      tools: 'none',
      force: true,
      projectDefinition: 'Candidate history test project.',
    }).execute(root);
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it('retains every successful build history entry', async () => {
    await initializeCandidate(root, { kind: 'current' });
    const source = await createRecord(root, 'history-source.md', {
      schemaVersion: 4, context: 'build', relatedIdentities: ['project.root'],
      entries: [{ identity: 'intent', nature: 'normative', decision: 'accepted', content: 'Preserve history without promoting provenance.' }],
    }, await readRecordSemanticContext(root, 'build'));
    await fs.writeFile(path.join(root, '.xirang', 'candidate', 'record-source.md'), source.bytes);
    await recordCoverage(root, 'history-source.md', { candidate: true }, {
      entries: [{ identity: 'intent', result: 'not-applicable', reason: 'History retention is not a model commitment.' }],
    });
    const coverage = await fs.readFile(path.join(root, '.xirang', 'candidate', 'record-coverage.json'));
    const first = await validateCandidate(root);
    const promoted = await promoteCandidate(root, first.reviewDigest!, {
      now: () => new Date('2030-01-01T00:00:00.000Z'),
    });

    expect(await fs.readFile(path.join(root, promoted.historyPath, 'record-source.md'))).toEqual(source.bytes);
    expect(await fs.readFile(path.join(root, promoted.historyPath, 'record-coverage.json'))).toEqual(coverage);
    expect((await fs.readdir(path.join(root, '.xirang', 'model'))).sort()).toEqual(['elements', 'metamodel', 'relationships', 'views']);
    await initializeCandidate(root, { kind: 'current' });
    await expect(fs.access(path.join(root, '.xirang', 'candidate', 'record-source.md'))).rejects.toMatchObject({ code: 'ENOENT' });
    const second = await validateCandidate(root);
    await promoteCandidate(root, second.reviewDigest!, {
      now: () => new Date('2030-01-01T00:00:01.000Z'),
    });

    const entries = await fs.readdir(path.join(root, '.xirang', 'history', 'builds'));
    expect(entries).toHaveLength(2);
    expect(entries[0]).not.toBe(entries[1]);
    for (const entry of entries) {
      expect((await fs.stat(path.join(root, '.xirang', 'history', 'builds', entry, 'previous', 'elements'))).isDirectory())
        .toBe(true);
      await expect(fs.readFile(path.join(root, '.xirang', 'history', 'builds', entry, 'promotion.yaml'), 'utf8'))
        .resolves.toContain('reviewDigest:');
    }
  });
});
