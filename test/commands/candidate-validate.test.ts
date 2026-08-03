import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SetupCommand } from '../../src/core/setup.js';
import { initializeCandidate } from '../../src/core/candidate/workspace.js';
import { formatCandidateValidation } from '../../src/commands/candidate.js';
import { validateCandidate } from '../../src/core/candidate/validator.js';
import { parseSemanticModel } from '../../src/core/model/parser.js';
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
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'opsx-candidate-validate-'));
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
        'metamodel/project.md',
      ],
      elements: ['elements/project.root.md'],
      relationships: [],
      views: [],
    });
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
    expect(result.diff?.entries).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'element-declaration', identity: 'added', operation: 'ADDED' }),
      expect.objectContaining({ kind: 'element-declaration', identity: 'project.root', operation: 'MODIFIED' }),
      expect.objectContaining({ kind: 'element-declaration', identity: 'obsolete', operation: 'REMOVED' }),
    ]));
  });

  it('reports Requirement order changes in the promotion diff', async () => {
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
      '## Requirements',
      '',
    ];
    const first = ['### Requirement: First', 'The project SHALL do first.', '', '#### Scenario: First case', '- **WHEN** used', '- **THEN** first holds', ''];
    const second = ['### Requirement: Second', 'The project SHALL do second.', '', '#### Scenario: Second case', '- **WHEN** used', '- **THEN** second holds', ''];
    await fs.writeFile(formal, [...declaration, ...first, ...second].join('\n'));
    await fs.writeFile(candidateUnit, [...declaration, ...second, ...first].join('\n'));

    const result = await validateCandidate(root);

    expect(result.valid).toBe(true);
    expect(result.diff?.entries).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'requirement', identity: 'project.root#First', operation: 'MODIFIED' }),
      expect.objectContaining({ kind: 'requirement', identity: 'project.root#Second', operation: 'MODIFIED' }),
    ]));
  });

  it('reports Scenario order changes as Requirement details', async () => {
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
      '## Requirements',
      '',
      '### Requirement: Ordered',
      'The project SHALL preserve scenario order.',
      '',
    ];
    const one = ['#### Scenario: One', '- **WHEN** first', '- **THEN** one holds', ''];
    const two = ['#### Scenario: Two', '- **WHEN** second', '- **THEN** two holds', ''];
    await fs.writeFile(formal, [...declaration, ...one, ...two].join('\n'));
    await fs.writeFile(candidateUnit, [...declaration, ...two, ...one].join('\n'));

    const result = await validateCandidate(root);
    const requirement = result.diff?.entries.find(entry => entry.identity === 'project.root#Ordered');

    expect(result.valid).toBe(true);
    expect(requirement).toMatchObject({ kind: 'requirement', operation: 'MODIFIED' });
    expect(requirement?.children).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'scenario', identity: 'project.root#Ordered#One', operation: 'MODIFIED' }),
      expect.objectContaining({ kind: 'scenario', identity: 'project.root#Ordered#Two', operation: 'MODIFIED' }),
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

  it('reports missing Scenarios and unresolved Kind constraint references', async () => {
    await fs.writeFile(path.join(candidate, 'metamodel', 'capability.md'),
      '---\nentity: element-kind\nidentity: capability\ncontract: optional\nparents:\n  - missing-kind\n---\n');
    await fs.writeFile(path.join(candidate, 'elements', 'capability.md'),
      '---\nentity: element-declaration\nidentity: capability\nkind: capability\nparent: project.root\ntitle: Capability\ndefinition: S\n---\n\n## Requirements\n\n### Requirement: R\n\nBody.\n');

    const result = await validateCandidate(root);

    expect(result.valid).toBe(false);
    expect(result.reviewDigest).toBeUndefined();
    expect(result.diagnostics.map(item => item.code)).toEqual(expect.arrayContaining([
      'MISSING_REQUIREMENT_SCENARIO',
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
