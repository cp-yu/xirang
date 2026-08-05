import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  buildViewRuntimeSnapshot,
  launchEmbeddedLikeC4,
  projectBrowserDiff,
  ViewCommand,
  type ViewLauncher,
  type ViewRuntimeSnapshot,
} from '../../src/core/view.js';
import { runLikeC4 } from '../../src/commands/arch/runner.js';
import { definitionExcerpt } from '../../src/core/likec4/definition.js';
import { likec4CacheDir } from '../../src/core/likec4/paths.js';
import type { ChangeDiff } from '../../src/core/semantic-diff.js';
import { minimalModel, writeChangeDelta, writeModel, writeProjectModel } from '../helpers/model-fixture.js';

vi.mock('../../src/commands/arch/runner.js', () => ({ runLikeC4: vi.fn() }));

const CONTRACT = '## Requirements\n\n### Requirement: Existing\nThe system SHALL preserve existing behavior.\n\n#### Scenario: Existing\n- **WHEN** invoked\n- **THEN** existing behavior remains';

function requirementDelta(change: string): string {
  return '---\noperation: MODIFIED\nentity: element-declaration\nidentity: alpha.id\nkind: capability\nparent: root\ntitle: Alpha\ndefinition: Alpha definition\n---\n\n'
    + `## ADDED Requirements\n\n### Requirement: ${change}\nThe system SHALL provide ${change} behavior.\n\n`
    + `#### Scenario: ${change}\n- **WHEN** invoked\n- **THEN** ${change} behavior is provided\n`;
}

async function writeBaseModel(root: string): Promise<void> {
  await writeProjectModel(root, minimalModel({
    elements: [{ identity: 'alpha.id', parent: 'root', title: 'Alpha', definition: 'Alpha definition', requirements: CONTRACT }],
  }));
}

describe('ViewCommand', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-view-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('launches the embedded viewer against generated LikeC4 artifacts', async () => {
    await writeBaseModel(tempDir);
    const launch = vi.fn<ViewLauncher>().mockResolvedValue(undefined);

    await new ViewCommand(launch).execute(tempDir);

    expect(launch).toHaveBeenCalledOnce();
    expect(launch).toHaveBeenCalledWith({
      projectRoot: tempDir,
      likec4SourceDir: likec4CacheDir(tempDir),
      port: undefined,
      changeManifestFile: expect.stringContaining('xirang-change-manifest.json'),
    });
    expect((await fs.readdir(likec4CacheDir(tempDir))).sort())
      .toEqual(['likec4.config.json', 'model.c4', 'relations.c4', 'specification.c4', 'views.c4']);
  });

  it('passes a custom port to the embedded server', async () => {
    await writeBaseModel(tempDir);
    const launch = vi.fn<ViewLauncher>().mockResolvedValue(undefined);

    await new ViewCommand(launch).execute(tempDir, { port: 4321 });

    expect(launch).toHaveBeenCalledWith(expect.objectContaining({ projectRoot: tempDir, port: 4321 }));
  });

  it('passes a custom listen address to the embedded server', async () => {
    await writeBaseModel(tempDir);
    const launch = vi.fn<ViewLauncher>().mockResolvedValue(undefined);

    await new ViewCommand(launch).execute(tempDir, { listen: '0.0.0.0' });

    expect(launch).toHaveBeenCalledWith(expect.objectContaining({ projectRoot: tempDir, listen: '0.0.0.0' }));
  });

  it('forwards the listen address to LikeC4', async () => {
    vi.mocked(runLikeC4).mockResolvedValue(undefined);

    await launchEmbeddedLikeC4({
      projectRoot: tempDir,
      likec4SourceDir: '/tmp/likec4',
      changeManifestFile: '/tmp/manifest.json',
      listen: '0.0.0.0',
      port: 61000,
    });

    expect(runLikeC4).toHaveBeenCalledWith([
      'start',
      '/tmp/likec4',
      '--xirang-change-manifest',
      '/tmp/manifest.json',
      '--listen',
      '0.0.0.0',
      '--port',
      '61000',
    ]);
  });

  it('discovers the nearest Xirang project from a nested directory', async () => {
    await writeBaseModel(tempDir);
    const innerRoot = path.join(tempDir, 'packages', 'feature');
    await writeBaseModel(innerRoot);
    const nestedDir = path.join(innerRoot, 'src', 'nested');
    await fs.mkdir(nestedDir, { recursive: true });
    const launch = vi.fn<ViewLauncher>().mockResolvedValue(undefined);

    await new ViewCommand(launch).execute(nestedDir);

    expect(launch).toHaveBeenCalledWith(expect.objectContaining({
      projectRoot: innerRoot,
      likec4SourceDir: likec4CacheDir(innerRoot),
    }));
  });

  it('projects Semantic Model Contracts into the manifest keyed by Element identity', async () => {
    await writeProjectModel(tempDir, minimalModel({
      elements: [
        { identity: 'zeta.id', parent: 'root', requirements: CONTRACT },
        { identity: 'alpha.id', parent: 'root', requirements: CONTRACT },
        { identity: 'no.contract', parent: 'root' },
      ],
    }));
    let manifest: ViewRuntimeSnapshot | undefined;
    const launch: ViewLauncher = async options => {
      manifest = JSON.parse(await fs.readFile(options.changeManifestFile, 'utf8')) as ViewRuntimeSnapshot;
    };

    await new ViewCommand(launch).execute(tempDir);

    const semanticModel = manifest!.semanticModel;
    expect(manifest!.version).toBe(3);
    expect(semanticModel.id).toBe('model');
    expect(Object.keys(semanticModel.contracts!)).toEqual(['alpha.id', 'zeta.id']);
    expect(semanticModel.contracts!['alpha.id']).toContain('### Requirement: Existing');
    expect(semanticModel.contracts!['alpha.id']).toContain('identity: alpha.id');
    expect(semanticModel.partitionFingerprints).toBeDefined();
  });

  it('projects the Expected Contract of a change under the same identity key', async () => {
    await writeBaseModel(tempDir);
    await writeChangeDelta(tempDir, 'a-change', { 'elements/alpha.id.md': requirementDelta('Alpha') });

    const snapshot = await buildViewRuntimeSnapshot(tempDir);
    const change = snapshot.changes['a-change']!;

    expect(Object.keys(change.contracts!)).toEqual(['alpha.id']);
    expect(change.contracts!['alpha.id']).toContain('### Requirement: Alpha');
    expect(change.contracts!['alpha.id']).toContain('### Requirement: Existing');
  });

  it('indexes isolated active Changes deterministically and excludes archive', async () => {
    await writeBaseModel(tempDir);
    for (const change of ['z-change', 'a-change']) {
      await writeChangeDelta(tempDir, change, {
        'elements/alpha.id.md': requirementDelta(change === 'a-change' ? 'Alpha' : 'Zeta'),
      });
    }
    await fs.mkdir(path.join(tempDir, '.xirang', 'changes', 'archive', 'old-change'), { recursive: true });

    const snapshot = await buildViewRuntimeSnapshot(tempDir);

    expect(Object.keys(snapshot.changes)).toEqual(['a-change', 'z-change']);
    const alpha = snapshot.changes['a-change']!;
    const zeta = snapshot.changes['z-change']!;
    expect(alpha.valid).toBe(true);
    expect(zeta.valid).toBe(true);
    expect(alpha.changeFingerprint).not.toBe(zeta.changeFingerprint);
    expect(alpha.diff?.entries.some(entry => entry.identity.includes('#Alpha'))).toBe(true);
    expect(alpha.diff?.entries.some(entry => entry.identity.includes('#Zeta'))).toBe(false);
    expect(zeta.diff?.entries.some(entry => entry.identity.includes('#Zeta'))).toBe(true);
    expect(zeta.architecture?.elements.map(element => element.declaration.identity))
      .toEqual(expect.arrayContaining(['root', 'alpha.id']));
  });

  it('reports one fingerprint per Semantic Model partition', async () => {
    await writeBaseModel(tempDir);
    await writeChangeDelta(tempDir, 'contract-only', { 'elements/alpha.id.md': requirementDelta('Alpha') });

    const before = await buildViewRuntimeSnapshot(tempDir);
    const beforeSource = before.changes['contract-only']!;
    expect(Object.keys(beforeSource.partitionFingerprints!).sort())
      .toEqual(['elements', 'metamodel', 'relationships', 'views']);

    await writeChangeDelta(tempDir, 'contract-only', {
      'views/detail.md': '---\noperation: ADDED\nentity: authored-view\nidentity: detail\ninclude: "*"\n---\n',
    });
    const after = await buildViewRuntimeSnapshot(tempDir, { previous: before, onlyChange: 'contract-only' });
    const afterSource = after.changes['contract-only']!;

    expect(afterSource.changeFingerprint).not.toBe(beforeSource.changeFingerprint);
    expect(afterSource.partitionFingerprints!.views).not.toBe(beforeSource.partitionFingerprints!.views);
    expect(afterSource.partitionFingerprints!.elements).toBe(beforeSource.partitionFingerprints!.elements);
  });

  it('projects top-level Declarations without cloning child-only diff details', () => {
    const beforeDefinition = `Before ${'界'.repeat(130)}.\n\nBefore boundary.`;
    const afterDefinition = `After ${'🚀'.repeat(130)}.\n\nAfter boundary.`;
    const children = [
      { kind: 'property' as const, identity: 'alpha.id#definition', operation: 'MODIFIED' as const, before: beforeDefinition, after: afterDefinition },
      { kind: 'scenario' as const, identity: 'alpha.id#Behavior#Preserved', operation: 'ADDED' as const, after: { body: 'Preserved' } },
    ];
    const diff: ChangeDiff = {
      schemaVersion: '1',
      change: 'definition-change',
      valid: true,
      formalFingerprint: 'formal',
      changeFingerprint: 'change',
      summary: { total: 2, ADDED: 0, MODIFIED: 2, REMOVED: 0 },
      entries: [
        {
          kind: 'element-declaration',
          identity: 'alpha.id',
          operation: 'MODIFIED',
          before: { identity: 'alpha.id', kind: 'capability', parent: 'root', title: 'Alpha', definition: beforeDefinition },
          after: { identity: 'alpha.id', kind: 'capability', parent: 'root', title: 'Alpha', definition: afterDefinition },
        },
        { kind: 'requirement', identity: 'alpha.id#Behavior', operation: 'MODIFIED', children },
      ],
      diagnostics: [],
    };

    const projected = projectBrowserDiff(diff);

    expect(projected.entries[0]).toMatchObject({
      before: { definition: beforeDefinition, summary: definitionExcerpt(beforeDefinition), description: beforeDefinition },
      after: { definition: afterDefinition, summary: definitionExcerpt(afterDefinition), description: afterDefinition },
    });
    expect(projected.entries[1]).not.toBe(diff.entries[1]);
    expect(projected.entries[1].children).toBe(children);
    expect(projected.entries[1].children).toEqual(children);
  });

  it('retains invalid active changes with their diagnostics', async () => {
    await writeBaseModel(tempDir);
    await writeChangeDelta(tempDir, 'broken', {
      'elements/ghost.md': '---\noperation: MODIFIED\nentity: element-declaration\nidentity: ghost.id\nkind: capability\nparent: root\ntitle: Ghost\ndefinition: Ghost definition.\n---\n',
    });

    const snapshot = await buildViewRuntimeSnapshot(tempDir);

    expect(snapshot.changes['broken']).toEqual(
      expect.objectContaining({ id: 'change:broken', valid: false, diagnostics: expect.any(Array) }),
    );
  });

  it('fails without launching when no Xirang project exists', async () => {
    const launch = vi.fn<ViewLauncher>().mockResolvedValue(undefined);

    await expect(new ViewCommand(launch).execute(tempDir)).rejects.toThrow(
      '未找到 Xirang 项目',
    );
    expect(launch).not.toHaveBeenCalled();
  });

  it('builds the complete candidate source from one snapshot', async () => {
    await writeBaseModel(tempDir);
    const candidateRoot = path.join(tempDir, '.xirang', 'candidate');
    await fs.mkdir(candidateRoot, { recursive: true });
    await fs.writeFile(
      path.join(candidateRoot, 'candidate.yaml'),
      'schemaVersion: 1\ncreatedAt: "2025-01-01T00:00:00.000Z"\nbaseline:\n  kind: current\n  reference: .xirang\n',
      'utf8',
    );
    await fs.writeFile(path.join(candidateRoot, 'build.md'), '# Build\n', 'utf8');
    await writeModel(candidateRoot, minimalModel({
      elements: [
        { identity: 'alpha.id', parent: 'root', title: 'Alpha', definition: 'Alpha definition', requirements: CONTRACT },
        { identity: 'beta.id', parent: 'root', title: 'Beta', definition: 'Beta candidate definition' },
      ],
    }));

    const snapshot = await buildViewRuntimeSnapshot(tempDir);

    expect(snapshot.candidate).toBeDefined();
    expect(snapshot.candidate!.id).toBe('candidate');
    expect(snapshot.candidate!.label).toBe('Candidate View');
    expect(snapshot.candidate!.valid).toBe(true);
    expect(snapshot.candidate!.architecture).toBeDefined();
    expect(snapshot.candidate!.architecture!.elements.map(e => e.declaration.identity)).toContain('beta.id');
    expect(snapshot.candidate!.contracts).toBeDefined();
    expect(Object.keys(snapshot.candidate!.contracts!)).toEqual(['alpha.id']);
    expect(snapshot.candidate!.diff).toBeUndefined();
  });

  it('retains invalid Candidate with diagnostics and partial architecture when parseable', async () => {
    await writeBaseModel(tempDir);
    const candidateRoot = path.join(tempDir, '.xirang', 'candidate');
    await fs.mkdir(candidateRoot, { recursive: true });
    await fs.writeFile(
      path.join(candidateRoot, 'candidate.yaml'),
      'schemaVersion: 1\ncreatedAt: "2025-01-01T00:00:00.000Z"\nbaseline:\n  kind: current\n  reference: .xirang\n',
      'utf8',
    );
    await fs.writeFile(path.join(candidateRoot, 'build.md'), '# Build\n', 'utf8');
    await writeModel(candidateRoot, minimalModel({
      elements: [
        { identity: 'ghost.id', parent: 'root', title: 'Ghost', definition: 'Ghost candidate' },
      ],
    }));
    await fs.writeFile(
      path.join(candidateRoot, 'elements', 'broken.md'),
      '---\noperation: ADDED\nentity: element-declaration\nidentity: broken.id\nkind: capability\nparent: nonexistent\ntitle: Broken\ndefinition: Broken element\n---\n',
      'utf8',
    );

    const snapshot = await buildViewRuntimeSnapshot(tempDir);

    expect(snapshot.candidate).toBeDefined();
    expect(snapshot.candidate!.valid).toBe(false);
    expect(snapshot.candidate!.diagnostics.length).toBeGreaterThan(0);
    expect(snapshot.candidate!.architecture).toBeDefined();
    expect(snapshot.candidate!.architecture!.elements.map(e => e.declaration.identity)).toContain('ghost.id');
  });

  it('shares Candidate target and refresh state between Candidate View and Candidate Diff View', async () => {
    await writeProjectModel(tempDir, minimalModel());
    const candidateRoot = path.join(tempDir, '.xirang', 'candidate');
    await fs.mkdir(candidateRoot, { recursive: true });
    
    // Write required candidate files
    await fs.writeFile(
      path.join(candidateRoot, 'candidate.yaml'),
      'schemaVersion: 1\ncreatedAt: "2025-01-01T00:00:00.000Z"\nbaseline:\n  kind: current\n  reference: .xirang\n',
      'utf8',
    );
    await fs.writeFile(path.join(candidateRoot, 'build.md'), '# Build\n', 'utf8');
    
    const modifiedModel = minimalModel();
    modifiedModel.elements[0].definition = 'Modified definition for Candidate';
    await writeModel(candidateRoot, modifiedModel);

    const snapshot = await buildViewRuntimeSnapshot(tempDir);
    expect(snapshot.candidate).toBeDefined();
    expect(snapshot.candidateDiff).toBeDefined();
    expect(snapshot.candidate!.partitionFingerprints).toEqual(snapshot.candidateDiff!.partitionFingerprints);
    expect(snapshot.candidate!.sourceFingerprint).toBe(snapshot.candidateDiff!.sourceFingerprint);
    expect(snapshot.candidate!.architecture).toEqual(snapshot.candidateDiff!.architecture);
    expect(snapshot.candidateDiff!.diff).toBeDefined();
  });
});

describe('Manifest version 3', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-view-manifest-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('emits version 3 manifest with candidate sources', async () => {
    await writeProjectModel(tempDir, minimalModel());
    const candidateRoot = path.join(tempDir, '.xirang', 'candidate');
    await fs.mkdir(candidateRoot, { recursive: true });
    
    await fs.writeFile(
      path.join(candidateRoot, 'candidate.yaml'),
      'schemaVersion: 1\ncreatedAt: "2025-01-01T00:00:00.000Z"\nbaseline:\n  kind: current\n  reference: .xirang\n',
      'utf8',
    );
    await fs.writeFile(path.join(candidateRoot, 'build.md'), '# Build\n', 'utf8');
    
    const modifiedModel = minimalModel();
    modifiedModel.elements[0].definition = 'Modified for candidate test';
    await writeModel(candidateRoot, modifiedModel);

    const snapshot = await buildViewRuntimeSnapshot(tempDir);
    
    expect(snapshot.version).toBe(3);
    expect(snapshot.semanticModel).toBeDefined();
    expect(snapshot.candidate).toBeDefined();
    expect(snapshot.candidateDiff).toBeDefined();
    
    expect(snapshot.candidate!.valid).toBe(snapshot.candidateDiff!.valid);
    expect(snapshot.candidate!.sourceFingerprint).toBe(snapshot.candidateDiff!.sourceFingerprint);
    expect(snapshot.candidate!.diagnostics).toEqual(snapshot.candidateDiff!.diagnostics);
  });

  it('omits candidate sources when no active candidate exists', async () => {
    await writeProjectModel(tempDir, minimalModel());

    const snapshot = await buildViewRuntimeSnapshot(tempDir);
    
    expect(snapshot.version).toBe(3);
    expect(snapshot.semanticModel).toBeDefined();
    expect(snapshot.candidate).toBeUndefined();
    expect(snapshot.candidateDiff).toBeUndefined();
    expect(snapshot.changes).toBeDefined();
  });

  it('refreshes both candidate sources after candidate changes', async () => {
    await writeProjectModel(tempDir, minimalModel());
    await writeChangeDelta(tempDir, 'test-change', {
      'elements/alpha.md': '---\noperation: ADDED\nentity: element\nidentity: alpha\nkind: component\nparent: project.id\n---\n# Alpha\n',
    });
    
    const candidateRoot = path.join(tempDir, '.xirang', 'candidate');
    await fs.mkdir(candidateRoot, { recursive: true });
    await fs.writeFile(
      path.join(candidateRoot, 'candidate.yaml'),
      'schemaVersion: 1\ncreatedAt: "2025-01-01T00:00:00.000Z"\nbaseline:\n  kind: current\n  reference: .xirang\n',
      'utf8',
    );
    await fs.writeFile(path.join(candidateRoot, 'build.md'), '# Build V1\n', 'utf8');
    await writeModel(candidateRoot, minimalModel());

    const before = await buildViewRuntimeSnapshot(tempDir);
    const beforeCandidateFingerprint = before.candidate!.sourceFingerprint;
    const beforeCandidateDiffFingerprint = before.candidateDiff!.sourceFingerprint;
    const beforeModelFingerprint = before.semanticModel.sourceFingerprint;
    const beforeChangeFingerprint = before.changes['test-change']!.sourceFingerprint;

    await fs.writeFile(path.join(candidateRoot, 'build.md'), '# Build V2\n', 'utf8');

    const after = await buildViewRuntimeSnapshot(tempDir, { previous: before });

    expect(after.candidate!.sourceFingerprint).not.toBe(beforeCandidateFingerprint);
    expect(after.candidateDiff!.sourceFingerprint).not.toBe(beforeCandidateDiffFingerprint);
    expect(after.semanticModel.sourceFingerprint).toBe(beforeModelFingerprint);
    expect(after.changes['test-change']!.sourceFingerprint).toBe(beforeChangeFingerprint);
  });

  it('refreshes model dependent sources after model changes', async () => {
    await writeProjectModel(tempDir, minimalModel());
    await writeChangeDelta(tempDir, 'test-change', {
      'elements/alpha.md': '---\noperation: ADDED\nentity: element\nidentity: alpha\nkind: component\nparent: project.id\n---\n# Alpha\n',
    });
    
    const candidateRoot = path.join(tempDir, '.xirang', 'candidate');
    await fs.mkdir(candidateRoot, { recursive: true });
    await fs.writeFile(
      path.join(candidateRoot, 'candidate.yaml'),
      'schemaVersion: 1\ncreatedAt: "2025-01-01T00:00:00.000Z"\nbaseline:\n  kind: current\n  reference: .xirang\n',
      'utf8',
    );
    await fs.writeFile(path.join(candidateRoot, 'build.md'), '# Build\n', 'utf8');
    await writeModel(candidateRoot, minimalModel());

    const before = await buildViewRuntimeSnapshot(tempDir);
    const beforeModelFingerprint = before.semanticModel.sourceFingerprint;
    const beforeCandidateDiffFingerprint = before.candidateDiff!.sourceFingerprint;
    const beforeChangeFingerprint = before.changes['test-change']!.sourceFingerprint;

    const modifiedModel = minimalModel();
    modifiedModel.elements[0].definition = 'Modified definition';
    await writeProjectModel(tempDir, modifiedModel);

    const after = await buildViewRuntimeSnapshot(tempDir, { previous: before });

    expect(after.semanticModel.sourceFingerprint).not.toBe(beforeModelFingerprint);
    expect(after.candidateDiff!.sourceFingerprint).not.toBe(beforeCandidateDiffFingerprint);
    expect(after.changes['test-change']!.sourceFingerprint).not.toBe(beforeChangeFingerprint);
  });
});
