import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  buildViewRuntimeSnapshot,
  changeFromWatcherPath,
  launchEmbeddedLikeC4,
  normalizeWatcherPath,
  projectBrowserDiff,
  ViewCommand,
  watcherRefreshForPath,
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

    const semanticModel = manifest!.model;
    expect(manifest!.version).toBe(4);
    expect(semanticModel.id).toBe('model');
    expect(Object.keys(semanticModel.contracts!)).toEqual(['alpha.id', 'zeta.id']);
    expect(semanticModel.contracts!['alpha.id']).toContain('### Requirement: Existing');
    expect(semanticModel.contracts!['alpha.id']).toContain('identity: alpha.id');
    expect(semanticModel.partitionFingerprints).toBeDefined();
  });

  it('resolves each Authored View selection into the manifest', async () => {
    await writeProjectModel(tempDir, minimalModel({
      elements: [
        { identity: 'domain.a', kind: 'domain', parent: 'root' },
        { identity: 'cap.a1', parent: 'domain.a' },
        { identity: 'domain.b', kind: 'domain', parent: 'root' },
        { identity: 'cap.b1', parent: 'domain.b' },
      ],
      views: [
        { identity: 'everything', include: '"*"' },
        { identity: 'pruned', include: '[root]', exclude: '[domain.b]' },
        { identity: 'multi', include: '[domain.a, domain.b]' },
      ],
    }));

    const snapshot = await buildViewRuntimeSnapshot(tempDir);

    // The View Selection control and breadcrumb need a label without re-reading the model.
    expect(snapshot.authoredViews['pruned']!.title).toBe('pruned');

    // The plugin must not re-derive closure or exclude precedence: the manifest carries the result.
    expect(snapshot.authoredViews['pruned']!.selection)
      .toEqual(['cap.a1', 'domain.a', 'root']);
    expect(snapshot.authoredViews['pruned']!.virtualRoot).toBe(false);
    expect(snapshot.authoredViews['multi']!.selection)
      .toEqual(['cap.a1', 'cap.b1', 'domain.a', 'domain.b']);
    expect(snapshot.authoredViews['multi']!.virtualRoot).toBe(true);
    expect(snapshot.authoredViews['everything']!.selection)
      .toEqual(['cap.a1', 'cap.b1', 'domain.a', 'domain.b', 'root']);
    expect(snapshot.authoredViews['everything']!.virtualRoot).toBe(false);
  });

  it('projects the Expected Contract of a change under the same identity key', async () => {
    await writeBaseModel(tempDir);
    await writeChangeDelta(tempDir, 'a-change', { 'elements/alpha.id.md': requirementDelta('Alpha') });

    const snapshot = await buildViewRuntimeSnapshot(tempDir);
    const change = snapshot.changes['a-change']!;

    expect(change).not.toHaveProperty('id');
    expect(change).not.toHaveProperty('source');
    expect(change.diffLikec4Sources).toBeDefined();
    expect(change.diffLikec4ElementPaths).toBeDefined();
    expect(change.diffSourceFingerprint).toBeDefined();
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

  it('removes an archived Change from the live manifest', async () => {
    await writeBaseModel(tempDir);
    await writeChangeDelta(tempDir, 'archive-me', { 'elements/alpha.id.md': requirementDelta('Archive') });
    const launch: ViewLauncher = async options => {
      const readManifest = async () => JSON.parse(
        await fs.readFile(options.changeManifestFile, 'utf8'),
      ) as ViewRuntimeSnapshot;
      expect((await readManifest()).changes['archive-me']).toBeDefined();

      const changesDir = path.join(tempDir, '.xirang', 'changes');
      await fs.mkdir(path.join(changesDir, 'archive'), { recursive: true });
      await fs.rename(
        path.join(changesDir, 'archive-me'),
        path.join(changesDir, 'archive', '2026-01-01-archive-me'),
      );

      for (let attempt = 0; attempt < 50; attempt += 1) {
        if (!(await readManifest()).changes['archive-me']) return;
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      throw new Error('Live manifest retained the archived Change');
    };

    await new ViewCommand(launch).execute(tempDir);
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
      expect.objectContaining({ change: 'broken', valid: false, diagnostics: expect.any(Array) }),
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
    expect(snapshot.candidate!.diff).toBeDefined();
    expect(snapshot.candidate!.diffArchitecture).toBeDefined();
    expect(snapshot.candidate!.diffLikec4Sources).toBeDefined();
    expect(snapshot.candidate!.diffLikec4ElementPaths).toBeDefined();
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

  it('carries the Candidate target and diff in one unified source', async () => {
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
    expect('candidateDiff' in snapshot).toBe(false);
    expect(snapshot.candidate!.partitionFingerprints).toBeDefined();
    expect(snapshot.candidate!.sourceFingerprint).toBeDefined();
    expect(snapshot.candidate!.architecture).toBeDefined();
    expect(snapshot.candidate!.diff).toBeDefined();
  });

  it('provides the before-after union sources to the Candidate for removed ghosts', async () => {
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
        { identity: 'alpha.id', parent: 'root', title: 'Alpha', definition: 'Alpha candidate definition', requirements: CONTRACT },
        { identity: 'gamma.id', parent: 'root', title: 'Gamma', definition: 'Gamma definition' },
      ],
    }));

    const snapshot = await buildViewRuntimeSnapshot(tempDir);
    const candidate = snapshot.candidate!;
    expect(candidate.diffLikec4Sources).toBeDefined();
    expect(candidate.diffLikec4ElementPaths).toBeDefined();
    expect(candidate.diffArchitecture!.elements.map(element => element.declaration.identity)).toEqual(
      expect.arrayContaining(['alpha.id', 'gamma.id']),
    );
    expect(candidate.diffSourceFingerprint).toBeDefined();
    expect(candidate.diffSourceFingerprint).not.toBe(candidate.sourceFingerprint);
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

  it('emits a version 4 manifest with one unified candidate source', async () => {
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
    
    expect(snapshot.version).toBe(4);
    expect(snapshot.model).toBeDefined();
    expect(snapshot.candidate).toBeDefined();
    expect('candidateDiff' in snapshot).toBe(false);

    expect(snapshot.candidate!.valid).toBe(true);
    expect(snapshot.candidate!.sourceFingerprint).toBeDefined();
    expect(snapshot.candidate!.diff).toBeDefined();
    expect(snapshot.candidate!.diagnostics).toEqual([]);
  });

  it('omits candidate sources when no active candidate exists', async () => {
    await writeProjectModel(tempDir, minimalModel());

    const snapshot = await buildViewRuntimeSnapshot(tempDir);
    
    expect(snapshot.version).toBe(4);
    expect(snapshot.model).toBeDefined();
    expect(snapshot.candidate).toBeUndefined();
    expect(snapshot.changes).toBeDefined();
  });

  it('refreshes the candidate source after candidate changes', async () => {
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
    const beforeModelFingerprint = before.model.sourceFingerprint;
    const beforeChangeFingerprint = before.changes['test-change']!.sourceFingerprint;

    await fs.writeFile(path.join(candidateRoot, 'build.md'), '# Build V2\n', 'utf8');

    const after = await buildViewRuntimeSnapshot(tempDir, { previous: before });

    expect(after.candidate!.sourceFingerprint).not.toBe(beforeCandidateFingerprint);
    expect(after.model.sourceFingerprint).toBe(beforeModelFingerprint);
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
    const beforeModelFingerprint = before.model.sourceFingerprint;
    const beforeCandidateFingerprint = before.candidate!.sourceFingerprint;
    const beforeChangeFingerprint = before.changes['test-change']!.sourceFingerprint;

    const modifiedModel = minimalModel();
    modifiedModel.elements[0].definition = 'Modified definition';
    await writeProjectModel(tempDir, modifiedModel);

    const after = await buildViewRuntimeSnapshot(tempDir, { previous: before });

    expect(after.model.sourceFingerprint).not.toBe(beforeModelFingerprint);
    expect(after.candidate!.sourceFingerprint).not.toBe(beforeCandidateFingerprint);
    expect(after.changes['test-change']!.sourceFingerprint).not.toBe(beforeChangeFingerprint);
  });
});

describe('normalizeWatcherPath', () => {
  it('preserves POSIX paths unchanged', () => {
    expect(normalizeWatcherPath('model/elements/foo.md')).toBe('model/elements/foo.md');
  });

  it('converts Windows backslash paths to forward slashes', () => {
    expect(normalizeWatcherPath('model\\elements\\foo.md')).toBe('model/elements/foo.md');
  });

  it('handles mixed separators', () => {
    expect(normalizeWatcherPath('changes\\my-change/elements/bar.md')).toBe('changes/my-change/elements/bar.md');
  });

  it('accepts Buffer input', () => {
    expect(normalizeWatcherPath(Buffer.from('model\\elements\\foo.md'))).toBe('model/elements/foo.md');
  });

  it('resolves relative paths against a managed root and rejects traversal', () => {
    const root = path.join(os.tmpdir(), 'xirang-watch-root');
    expect(normalizeWatcherPath('model\\elements\\foo.md', root)).toBe('model/elements/foo.md');
    expect(normalizeWatcherPath('../outside.md', root)).toBeNull();
  });
  it('POSIX and Windows paths for the same source file map to the same detection key', () => {
    const posix = normalizeWatcherPath('model/elements/foo.md');
    const windows = normalizeWatcherPath('model\\elements\\foo.md');
    expect(posix).toBe(windows);
  });
});

describe('changeFromWatcherPath', () => {
  it('detects both a Change directory event and its descendants', () => {
    expect(changeFromWatcherPath('changes/my-change')).toBe('my-change');
    expect(changeFromWatcherPath('changes/my-change/elements/foo.md')).toBe('my-change');
  });

  it('ignores archive and unrelated paths', () => {
    expect(changeFromWatcherPath('changes/archive/2026-01-01-my-change')).toBeNull();
    expect(changeFromWatcherPath('model/elements/foo.md')).toBeNull();
  });
});

describe('watcherRefreshForPath', () => {
  it('refreshes all sources for archive-side and missing-filename events', () => {
    expect(watcherRefreshForPath('changes/archive/2026-01-01-my-change')).toEqual({ all: true });
    expect(watcherRefreshForPath(null)).toEqual({ all: true });
  });

  it('refreshes only the affected active Change for its events', () => {
    expect(watcherRefreshForPath('changes/my-change')).toEqual({ all: false, change: 'my-change' });
  });

  it('refreshes only the Candidate for candidate events', () => {
    expect(watcherRefreshForPath('candidate')).toEqual({ all: false, candidate: true });
    expect(watcherRefreshForPath('candidate/elements/foo.md')).toEqual({ all: false, candidate: true });
  });
});

describe('buildViewRuntimeSnapshot candidate-only refresh', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-cand-refresh-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  async function writeCandidateSource(root: string): Promise<string> {
    const candidateRoot = path.join(root, '.xirang', 'candidate');
    await fs.mkdir(candidateRoot, { recursive: true });
    await fs.writeFile(
      path.join(candidateRoot, 'candidate.yaml'),
      'schemaVersion: 1\ncreatedAt: "2025-01-01T00:00:00.000Z"\nbaseline:\n  kind: current\n  reference: .xirang\n',
      'utf8',
    );
    await fs.writeFile(path.join(candidateRoot, 'build.md'), '# Build\n', 'utf8');
    return candidateRoot;
  }

  it('reuses model, authored views and changes on a candidate-only edit', async () => {
    await writeProjectModel(tempDir, minimalModel());
    await writeChangeDelta(tempDir, 'test-change', {
      'elements/alpha.md': '---\noperation: ADDED\nentity: element\nidentity: alpha\nkind: component\nparent: project.id\n---\n# Alpha\n',
    });
    const candidateRoot = await writeCandidateSource(tempDir);
    await writeModel(candidateRoot, minimalModel());

    const before = await buildViewRuntimeSnapshot(tempDir);
    await fs.writeFile(path.join(candidateRoot, 'build.md'), '# Build V2\n', 'utf8');

    const after = await buildViewRuntimeSnapshot(tempDir, { previous: before, onlyCandidate: true });

    expect(after.candidate!.sourceFingerprint).not.toBe(before.candidate!.sourceFingerprint);
    expect(after.model).toBe(before.model);
    expect(after.authoredViews).toBe(before.authoredViews);
    expect(after.changes).toBe(before.changes);
  });

  it('falls back to a full rebuild when the formal model changed', async () => {
    await writeProjectModel(tempDir, minimalModel());
    await writeChangeDelta(tempDir, 'test-change', {
      'elements/alpha.md': '---\noperation: ADDED\nentity: element\nidentity: alpha\nkind: component\nparent: project.id\n---\n# Alpha\n',
    });
    const candidateRoot = await writeCandidateSource(tempDir);
    await writeModel(candidateRoot, minimalModel());

    const before = await buildViewRuntimeSnapshot(tempDir);
    const modifiedModel = minimalModel();
    modifiedModel.elements![0]!.definition = 'Modified definition';
    await writeProjectModel(tempDir, modifiedModel);

    const after = await buildViewRuntimeSnapshot(tempDir, { previous: before, onlyCandidate: true });

    expect(after.model).not.toBe(before.model);
    expect(after.model.sourceFingerprint).not.toBe(before.model.sourceFingerprint);
  });

  it('drops the candidate when its directory was removed', async () => {
    await writeProjectModel(tempDir, minimalModel());
    const candidateRoot = await writeCandidateSource(tempDir);
    await writeModel(candidateRoot, minimalModel());

    const before = await buildViewRuntimeSnapshot(tempDir);
    await fs.rm(candidateRoot, { recursive: true, force: true });

    const after = await buildViewRuntimeSnapshot(tempDir, { previous: before, onlyCandidate: true });

    expect(after.candidate).toBeUndefined();
    expect(after.model).toBe(before.model);
    expect(after.changes).toBe(before.changes);
  });

  it('refreshes only the Candidate through the watcher and keeps artifacts untouched', async () => {
    await writeProjectModel(tempDir, minimalModel());
    await writeChangeDelta(tempDir, 'test-change', {
      'elements/alpha.md': '---\noperation: ADDED\nentity: element\nidentity: alpha\nkind: component\nparent: project.id\n---\n# Alpha\n',
    });
    const candidateRoot = await writeCandidateSource(tempDir);
    await writeModel(candidateRoot, minimalModel());

    const launch: ViewLauncher = async options => {
      const readManifest = async () => JSON.parse(
        await fs.readFile(options.changeManifestFile, 'utf8'),
      ) as ViewRuntimeSnapshot;
      const before = await readManifest();
      const artifactFile = path.join(likec4CacheDir(tempDir), 'model.c4');
      const artifactMtime = (await fs.stat(artifactFile)).mtimeMs;

      await fs.writeFile(path.join(candidateRoot, 'build.md'), '# Build V2\n', 'utf8');

      for (let attempt = 0; attempt < 50; attempt += 1) {
        const after = await readManifest();
        if (after.candidate?.sourceFingerprint !== before.candidate?.sourceFingerprint) {
          // Candidate-only edits keep the formal-derived sources and artifacts untouched.
          expect(after.model.sourceFingerprint).toBe(before.model.sourceFingerprint);
          expect(after.changes['test-change']!.sourceFingerprint)
            .toBe(before.changes['test-change']!.sourceFingerprint);
          expect((await fs.stat(artifactFile)).mtimeMs).toBe(artifactMtime);
          return;
        }
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      throw new Error('Candidate edit did not refresh the live manifest');
    };

    await new ViewCommand(launch).execute(tempDir);
  });

  it('regenerates artifacts on a model edit through the watcher', async () => {
    await writeProjectModel(tempDir, minimalModel());
    const launch: ViewLauncher = async options => {
      const readManifest = async () => JSON.parse(
        await fs.readFile(options.changeManifestFile, 'utf8'),
      ) as ViewRuntimeSnapshot;
      const before = await readManifest();

      const modifiedModel = minimalModel();
      modifiedModel.elements![0]!.definition = 'Refreshed definition';
      await writeProjectModel(tempDir, modifiedModel);

      for (let attempt = 0; attempt < 50; attempt += 1) {
        const after = await readManifest();
        if (after.model.sourceFingerprint !== before.model.sourceFingerprint) {
          const modelC4 = await fs.readFile(path.join(likec4CacheDir(tempDir), 'model.c4'), 'utf8');
          expect(modelC4).toContain('Refreshed definition');
          return;
        }
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      throw new Error('Model edit did not refresh the live manifest');
    };

    await new ViewCommand(launch).execute(tempDir);
  });
});

describe('buildViewRuntimeSnapshot last-known-good', () => {
  it('preserves the previous snapshot when a change source cannot be compiled', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-lkg-'));
    try {
      await writeProjectModel(tempDir, minimalModel());
      await writeChangeDelta(tempDir, 'valid-change', {
        'elements/root.md': '---\noperation: MODIFIED\nentity: element-declaration\nidentity: root\nkind: project\nparent: null\ntitle: Root\ndefinition: Root definition.\n---\n',
      });

      const before = await buildViewRuntimeSnapshot(tempDir);
      const beforeFingerprint = before.model.sourceFingerprint;

      // Break the change delta — e.g. truncate it so it cannot parse.
      const changeDir = path.join(tempDir, '.xirang', 'changes', 'valid-change', 'elements');
      await fs.writeFile(path.join(changeDir, 'root.md'), '---\nentity: BROKEN\n');

      // Even though the source is broken, a partial re-build with the previous snapshot still
      // returns the old model source fingerprint because the broken source yields diagnostics
      // but does not throw — the manifest is emitted with `valid: false` for that change.
      const after = await buildViewRuntimeSnapshot(tempDir, { previous: before, onlyChange: 'valid-change' });

      // The model fingerprint must not change when only a change source breaks.
      expect(after.model.sourceFingerprint).toBe(beforeFingerprint);
      // The broken change is represented with valid: false, not silently dropped.
      expect(after.changes['valid-change']!.valid).toBe(false);
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });
});
