import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SetupCommand } from '../../src/core/setup.js';
import { initializeCandidate } from '../../src/core/candidate/workspace.js';
import { formatCandidateValidation } from '../../src/commands/candidate.js';
import { validateCandidate } from '../../src/core/candidate/validator.js';
import { runCLI } from '../helpers/run-cli.js';
import { parseSemanticModel } from '../../src/core/model/parser.js';
import { recordCoverage } from '../../src/core/record/coverage.js';
import { createRecord } from '../../src/core/record/workspace.js';
import { readRecordSemanticContext } from '../../src/core/record/validator.js';
import { semanticModelFingerprint } from '../../src/core/semantic-diff.js';

async function readTree(root: string): Promise<Map<string, Buffer>> {
  const files = new Map<string, Buffer>();
  const visit = async (directory: string): Promise<void> => {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(target);
      else if (entry.isFile()) files.set(path.relative(root, target), await fs.readFile(target));
    }
  };
  await visit(root);
  return files;
}

describe('Candidate validation', () => {
  let root: string;
  let candidate: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-candidate-validate-'));
    await new SetupCommand({
      tools: 'none',
      force: true,
      projectDefinition: 'Candidate validation test project.',
    }).execute(root);
    await initializeCandidate(root, { kind: 'current' });
    candidate = path.join(root, '.xirang', 'candidate');
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it('returns a deterministic digest and formal diff for a valid Candidate', async () => {
    const first = await validateCandidate(root);
    const second = await validateCandidate(root);

    expect(first.valid).toBe(true);
    expect(first.diagnostics).toEqual([]);
    expect(first.reviewDigest).toMatch(/^[a-f0-9]{64}$/);
    expect(second.reviewDigest).toBe(first.reviewDigest);
    expect(first.comparison).toEqual({
      baseline: 'formal',
      diff: 'available',
      formalFingerprint: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
    expect(first.diff?.summary.total).toBe(0);
    expect(formatCandidateValidation(first)).toContain('Formal comparison baseline: available');
    expect(formatCandidateValidation(first)).toContain('Formal diff entries: 0');
    expect(first.inventory.partitions).toEqual({
      metamodel: [
        'metamodel/element.md',
        'metamodel/perspective.md',
        'metamodel/project.md',
      ],
      elements: ['elements/project.root.md'],
      relationships: [],
      views: [],
    });
  });

  async function provenance() {
    const record = await createRecord(root, 'source.md', {
      schemaVersion: 4, context: 'build', relatedIdentities: ['project.root'],
      entries: [{ identity: 'scope', nature: 'normative', decision: 'accepted', content: 'Preserve the confirmed exception.' }],
    }, await readRecordSemanticContext(root, 'build'));
    await recordCoverage(root, 'source.md', { candidate: true }, {
      entries: [{ identity: 'scope', result: 'covered', details: [{
        detail: 'Confirmed scope', location: { element: 'project.root' }, quote: 'Candidate validation test project.',
      }] }],
    });
    const coveragePath = path.join(candidate, 'record-coverage.json');
    return { record, sourcePath: path.join(candidate, 'record-source.md'), coveragePath,
      coverage: JSON.parse(await fs.readFile(coveragePath, 'utf8')) };
  }

  it('validates optional Build provenance read-only and binds exact source bytes to digest', async () => {
    const { record, sourcePath, coveragePath, coverage } = await provenance();
    // Coverage precedes source copying during consume.
    expect((await validateCandidate(root)).valid).toBe(true);
    await fs.writeFile(sourcePath, record.bytes);
    const tree = await readTree(root);
    const first = await validateCandidate(root);
    expect(first.valid).toBe(true);
    expect(first.inventory.files).toEqual(expect.arrayContaining(['record-source.md', 'record-coverage.json']));
    expect(first.diff?.summary.total).toBe(0);
    expect((await validateCandidate(root)).reviewDigest).toBe(first.reviewDigest);
    expect(await readTree(root)).toEqual(tree);
    await fs.writeFile(coveragePath, JSON.stringify({ ...coverage, recordedAt: '2030-01-01T00:00:00.000Z' }) + '\n');
    expect((await validateCandidate(root)).reviewDigest).not.toBe(first.reviewDigest);
    // Historical locations, quotes and target fingerprints do not constrain later model edits.
    const unit = path.join(candidate, 'elements', 'project.root.md');
    await fs.writeFile(unit, (await fs.readFile(unit, 'utf8')).replace('Candidate validation test project.', 'Revised project definition.'));
    expect((await validateCandidate(root)).valid).toBe(true);
    await fs.rm(coveragePath);
    const sourceOnly = await validateCandidate(root);
    expect(sourceOnly.valid).toBe(true);
    await fs.writeFile(sourcePath, record.bytes.toString('utf8').replace('confirmed exception', 'confirmed timing'));
    const changed = await validateCandidate(root);
    expect(changed.valid).toBe(true);
    expect(changed.reviewDigest).not.toBe(sourceOnly.reviewDigest);
  });

  it.each([
    ['missing fields', { schemaVersion: 1 }],
    ['unsupported version', { schemaVersion: 2 }],
    ['unsafe filename', { filename: '../source.md' }],
    ['unbound source', { sourceVersion: '0'.repeat(64) }],
    ['invalid target fingerprint', { targetFingerprint: 'invalid' }],
    ['invalid timestamp', { recordedAt: 'invalid' }],
    ['missing dispositions', { entries: [] }],
    ['unknown source entry', { entries: [{ identity: 'unknown', result: 'not-applicable', reason: 'test' }] }],
    ['malformed detail', { entries: [{ identity: 'scope', result: 'covered', details: [{}] }] }],
  ])('rejects %s in provenance without rewriting files or issuing a digest', async (reason, patch) => {
    const { record, sourcePath, coveragePath, coverage } = await provenance();
    await fs.writeFile(sourcePath, record.bytes);
    await fs.writeFile(coveragePath, JSON.stringify(reason === 'missing fields' ? patch : { ...coverage, ...patch }) + '\n');
    const before = await readTree(root);
    const result = await validateCandidate(root);
    expect(result.valid).toBe(false);
    expect(result.reviewDigest).toBeUndefined();
    expect(result.diagnostics).toContainEqual(expect.objectContaining({ code: 'CANDIDATE_RECORD_COVERAGE', path: 'record-coverage.json' }));
    expect(await readTree(root)).toEqual(before);
  });

  it.each([
    ['malformed source', 'not a design record\n'],
    ['unsupported source version', 'version'],
    ['wrong formation context', 'context'],
    ['malformed coverage JSON', 'json'],
    ['changed bound source bytes', 'bytes'],
  ])('rejects %s on the CLI without a usable digest', async (_reason, mutation) => {
    const { record, sourcePath, coveragePath } = await provenance();
    await fs.writeFile(sourcePath, mutation === 'version' ? record.bytes.toString('utf8').replace('schemaVersion: 4', 'schemaVersion: 3')
      : mutation === 'context' ? record.bytes.toString('utf8').replace('context: build', 'context: change')
      : mutation === 'bytes' ? record.bytes.toString('utf8').replace('confirmed exception', 'confirmed timing')
      : mutation === 'json' ? record.bytes : mutation);
    if (mutation === 'json') await fs.writeFile(coveragePath, '{invalid}\n');
    const before = await readTree(root);
    const result = await runCLI(['candidate', 'validate', '--json'], { cwd: root });
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe('');
    expect(result.stderr).toContain('CANDIDATE_RECORD_');
    expect(await readTree(root)).toEqual(before);
  });

  it('reports unavailable comparison without invalidating the first Formal Candidate', async () => {
    await fs.rm(path.join(root, '.xirang', 'model'), { recursive: true, force: true });

    const result = await validateCandidate(root);

    expect(result.valid).toBe(true);
    expect(result.reviewDigest).toMatch(/^[a-f0-9]{64}$/);
    expect(result.comparison).toEqual({
      baseline: 'absent',
      diff: 'unavailable',
      reason: 'formal-model-absent',
    });
    expect(result.diff).toBeUndefined();
    expect(formatCandidateValidation(result)).toContain('Formal comparison baseline: absent');
    expect(formatCandidateValidation(result)).toContain('Formal diff: unavailable (formal model absent)');
  });

  it('computes the real promotion diff from Formal to Candidate', async () => {
    const formal = path.join(root, '.xirang', 'model');
    await fs.writeFile(path.join(formal, 'metamodel', 'obsolete.md'),
      '---\nentity: element-kind\nidentity: obsolete\ncontract: optional\n---\n');
    await fs.writeFile(path.join(formal, 'elements', 'obsolete.md'),
      '---\nentity: element-declaration\nidentity: obsolete\nkind: obsolete\nparent: project.root\ntitle: Obsolete\ndefinition: Old\n---\n');
    await fs.writeFile(path.join(candidate, 'metamodel', 'capability.md'),
      '---\nentity: element-kind\nidentity: capability\ncontract: optional\n---\n');
    await fs.writeFile(path.join(candidate, 'elements', 'added.md'),
      '---\nentity: element-declaration\nidentity: added\nkind: capability\nparent: project.root\ntitle: Added\ndefinition: New\n---\n');
    const projectUnit = path.join(candidate, 'elements', 'project.root.md');
    await fs.writeFile(projectUnit, (await fs.readFile(projectUnit, 'utf8'))
      .replace('Candidate validation test project.', 'Changed candidate validation test project.'));

    const result = await validateCandidate(root);

    expect(result.valid).toBe(true);
    expect(result.comparison).toMatchObject({ baseline: 'formal', diff: 'available' });
    const details = await runCLI(['candidate', 'validate', '--details'], { cwd: root });
    expect(details.exitCode).toBe(0);
    for (const content of ['added', 'project.root', 'obsolete', 'ADDED', 'MODIFIED', 'REMOVED', 'Candidate validation test project.', 'Changed candidate validation test project.']) expect(details.stdout).toContain(content);
    expect(result.diff?.entries).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'element-declaration', identity: 'added', operation: 'ADDED' }),
      expect.objectContaining({ kind: 'element-declaration', identity: 'project.root', operation: 'MODIFIED' }),
      expect.objectContaining({ kind: 'element-declaration', identity: 'obsolete', operation: 'REMOVED' }),
    ]));
  });

  it('reports Section order changes in the promotion diff', async () => {
    const formal = path.join(root, '.xirang', 'model', 'elements', 'project.root.md');
    const candidateUnit = path.join(candidate, 'elements', 'project.root.md');
    const declaration = [
      '---',
      'entity: element-declaration',
      'identity: project.root',
      'kind: project',
      'parent: null',
      'title: Project',
      'definition: Project intent',
      '---',
      '',
      '## Specification',
      '',
    ];
    const first = ['### Section: First', 'The project SHALL do first.', '', '#### Acceptance Case: First case', '- **WHEN** used', '- **THEN** first holds', ''];
    const second = ['### Section: Second', 'The project SHALL do second.', '', '#### Acceptance Case: Second case', '- **WHEN** used', '- **THEN** second holds', ''];
    await fs.writeFile(formal, [...declaration, ...first, ...second].join('\n'));
    await fs.writeFile(candidateUnit, [...declaration, ...second, ...first].join('\n'));

    const result = await validateCandidate(root);

    expect(result.valid).toBe(true);
    expect(result.diff?.entries).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'section', identity: 'project.root#First', operation: 'MODIFIED' }),
      expect.objectContaining({ kind: 'section', identity: 'project.root#Second', operation: 'MODIFIED' }),
    ]));
  });

  it('reports AcceptanceCase order changes as Section details', async () => {
    const formal = path.join(root, '.xirang', 'model', 'elements', 'project.root.md');
    const candidateUnit = path.join(candidate, 'elements', 'project.root.md');
    const declaration = [
      '---',
      'entity: element-declaration',
      'identity: project.root',
      'kind: project',
      'parent: null',
      'title: Project',
      'definition: Project intent',
      '---',
      '',
      '## Specification',
      '',
      '### Section: Ordered',
      'The project SHALL preserve acceptanceCase order.',
      '',
    ];
    const one = ['#### Acceptance Case: One', '- **WHEN** first', '- **THEN** one holds', ''];
    const two = ['#### Acceptance Case: Two', '- **WHEN** second', '- **THEN** two holds', ''];
    await fs.writeFile(formal, [...declaration, ...one, ...two].join('\n'));
    await fs.writeFile(candidateUnit, [...declaration, ...two, ...one].join('\n'));

    const result = await validateCandidate(root);
    const section = result.diff?.entries.find(entry => entry.identity === 'project.root#Ordered');

    expect(result.valid).toBe(true);
    expect(section).toMatchObject({ kind: 'section', operation: 'MODIFIED' });
    expect(section?.children).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'acceptance-case', identity: 'project.root#Ordered#One', operation: 'MODIFIED' }),
      expect.objectContaining({ kind: 'acceptance-case', identity: 'project.root#Ordered#Two', operation: 'MODIFIED' }),
    ]));
  });

  it('ignores unordered Kind and View list permutations in diff and fingerprint', async () => {
    const formal = path.join(root, '.xirang', 'model');
    const projectKind = (children: string[]) => [
      '---', 'entity: element-kind', 'identity: project', 'contract: optional', 'root: true', 'children:',
      ...children.map(value => `  - ${value}`), '---', '',
    ].join('\n');
    const capabilityKind = (parents: string[], children: string[]) => [
      '---', 'entity: element-kind', 'identity: capability', 'contract: optional', 'parents:',
      ...parents.map(value => `  - ${value}`), 'children:', ...children.map(value => `  - ${value}`), '---', '',
    ].join('\n');
    const domainKind = ['---', 'entity: element-kind', 'identity: domain', 'contract: optional', 'parents:', '  - project', '---', ''].join('\n');
    const relationKind = (sourceKinds: string[], targetKinds: string[]) => [
      '---', 'entity: relationship-kind', 'identity: invokes', 'sourceKinds:',
      ...sourceKinds.map(value => `  - ${value}`), 'targetKinds:', ...targetKinds.map(value => `  - ${value}`), '---', '',
    ].join('\n');
    const element = ['---', 'entity: element-declaration', 'identity: cap', 'kind: capability', 'parent: project.root', 'title: Cap', 'definition: Cap', '---', ''].join('\n');
    const view = (include: string[]) => [
      '---', 'entity: authored-view', 'identity: index', 'include:', ...include.map(value => `  - ${value}`), '---', '',
    ].join('\n');
    const writes = [
      ['metamodel/project.md', projectKind(['capability', 'domain']), projectKind(['domain', 'capability', 'capability'])],
      ['metamodel/capability.md', capabilityKind(['project', 'domain'], ['project', 'domain']), capabilityKind(['domain', 'project', 'project'], ['domain', 'project', 'domain'])],
      ['metamodel/domain.md', domainKind, domainKind],
      ['metamodel/invokes.md', relationKind(['project', 'capability'], ['capability', 'project']), relationKind(['capability', 'project', 'project'], ['project', 'capability', 'capability'])],
      ['elements/cap.md', element, element],
      ['views/index.md', view(['project.root', 'cap']), view(['cap', 'project.root', 'cap'])],
    ] as const;
    for (const [relative, formalContent, candidateContent] of writes) {
      await fs.mkdir(path.dirname(path.join(formal, relative)), { recursive: true });
      await fs.mkdir(path.dirname(path.join(candidate, relative)), { recursive: true });
      await fs.writeFile(path.join(formal, relative), formalContent);
      await fs.writeFile(path.join(candidate, relative), candidateContent);
    }

    const result = await validateCandidate(root);
    const formalModel = await parseSemanticModel(formal);
    const candidateModel = await parseSemanticModel(candidate);

    expect(result.valid).toBe(true);
    expect(result.diff?.summary.total).toBe(0);
    expect(semanticModelFingerprint(candidateModel.model)).toBe(semanticModelFingerprint(formalModel.model));
  });

  it('keeps the digest stable when comparison availability changes', async () => {
    const available = await validateCandidate(root);
    await fs.rm(path.join(root, '.xirang', 'model'), { recursive: true, force: true });
    const unavailable = await validateCandidate(root);

    expect(available.comparison.diff).toBe('available');
    expect(unavailable.comparison.diff).toBe('unavailable');
    expect(unavailable.reviewDigest).toBe(available.reviewDigest);
  });

  it('excludes candidate metadata from the review digest', async () => {
    const before = await validateCandidate(root);
    const metadataPath = path.join(candidate, 'candidate.yaml');
    const metadata = await fs.readFile(metadataPath, 'utf8');
    await fs.writeFile(metadataPath, metadata.replace(/createdAt: .+/, 'createdAt: 2030-01-01T00:00:00.000Z'));

    const after = await validateCandidate(root);

    expect(after.valid).toBe(true);
    expect(after.reviewDigest).toBe(before.reviewDigest);
  });

  it('rejects malformed or non-canonical lifecycle metadata', async () => {
    await fs.writeFile(path.join(candidate, 'candidate.yaml'), [
      'schemaVersion: 1',
      'createdAt: not-a-date',
      'baseline:',
      '  kind: invalid',
      '  reference: /absolute/source',
      'extra: true',
      '',
    ].join('\n'));

    const result = await validateCandidate(root);

    expect(result.valid).toBe(false);
    expect(result.diagnostics).toContainEqual(expect.objectContaining({
      code: 'CANDIDATE_METADATA', path: 'candidate.yaml',
    }));
  });

  it('reports canonical text failures without modifying any observed bytes', async () => {
    await fs.writeFile(path.join(candidate, 'build.md'), Buffer.from('scope  \r\n'));
    const before = await readTree(candidate);

    const result = await validateCandidate(root);

    expect(result.valid).toBe(false);
    expect(result.reviewDigest).toBeUndefined();
    expect(result.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({
        path: 'build.md', code: 'LINE_ENDING_LF', location: { line: 1, column: 8, offset: 7 },
      }),
      expect.objectContaining({
        path: 'build.md', code: 'TRAILING_WHITESPACE', location: { line: 1, column: 6, offset: 5 },
      }),
    ]));
    expect(await readTree(candidate)).toEqual(before);
  });

  it('rejects a unit outside the four partitions', async () => {
    await fs.mkdir(path.join(candidate, 'architecture'), { recursive: true });
    await fs.writeFile(path.join(candidate, 'architecture', 'model.c4'), 'model {}\n');

    const result = await validateCandidate(root);

    expect(result.valid).toBe(false);
    expect(result.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'CANDIDATE_FILE_UNEXPECTED', path: 'architecture/model.c4' }),
    ]));
  });

  it('rejects an Element whose parent is unknown', async () => {
    await fs.writeFile(path.join(candidate, 'elements', 'orphan.md'),
      '---\nentity: element-declaration\nidentity: orphan\nkind: project\nparent: ghost\ntitle: Orphan\ndefinition: S\n---\n');

    const result = await validateCandidate(root);

    expect(result.valid).toBe(false);
    expect(result.diagnostics.map(item => item.code)).toContain('MISSING_PARENT');
  });

  it('accepts a Section without an Acceptance Case and reports unresolved Kind constraint references', async () => {
    await fs.writeFile(path.join(candidate, 'metamodel', 'capability.md'),
      '---\nentity: element-kind\nidentity: capability\ncontract: optional\nparents:\n  - missing-kind\n---\n');
    await fs.writeFile(path.join(candidate, 'elements', 'capability.md'),
      '---\nentity: element-declaration\nidentity: capability\nkind: capability\nparent: project.root\ntitle: Capability\ndefinition: S\n---\n\n## Specification\n\n### Section: R\n\nBody.\n');

    const result = await validateCandidate(root);

    expect(result.valid).toBe(false);
    expect(result.reviewDigest).toBeUndefined();
    expect(result.diagnostics.map(item => item.code)).toEqual(expect.arrayContaining([
      'UNRESOLVED_KIND_REFERENCE',
    ]));
  });

  it('keeps a misplaced entity valid while reporting a partition warning', async () => {
    await fs.rename(
      path.join(candidate, 'metamodel', 'project.md'),
      path.join(candidate, 'views', 'project.md'),
    );

    const result = await validateCandidate(root);

    expect(result.valid).toBe(true);
    expect(result.reviewDigest).toMatch(/^[a-f0-9]{64}$/);
    expect(result.diagnostics).toContainEqual(expect.objectContaining({
      level: 'WARNING',
      code: 'ENTITY_PARTITION_MISMATCH',
      path: 'views/project.md',
      identity: 'project',
    }));
  });

  it.runIf(process.platform !== 'win32')('rejects Candidate source symlinks', async () => {
    await fs.symlink(path.join(candidate, 'build.md'), path.join(candidate, 'views', 'linked.md'));

    const result = await validateCandidate(root);

    expect(result.valid).toBe(false);
    expect(result.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'CANDIDATE_SYMLINK', path: 'views/linked.md' }),
    ]));
  });
});
