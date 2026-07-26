import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildViewRuntimeSnapshot, ViewCommand, type ViewLauncher } from '../../src/core/view.js';
import { likec4CacheDir } from '../../src/core/likec4/paths.js';
import { minimalModel, writeChangeDelta, writeProjectModel } from '../helpers/model-fixture.js';

const CONTRACT = '## Requirements\n\n### Requirement: Existing\nThe system SHALL preserve existing behavior.\n\n#### Scenario: Existing\n- **WHEN** invoked\n- **THEN** existing behavior remains';

function requirementDelta(change: string): string {
  return '---\noperation: MODIFIED\nentity: element-declaration\nidentity: alpha.id\nkind: capability\nparent: root\ntitle: Alpha\nsummary: Alpha summary\n---\n\n'
    + `## ADDED Requirements\n\n### Requirement: ${change}\nThe system SHALL provide ${change} behavior.\n\n`
    + `#### Scenario: ${change}\n- **WHEN** invoked\n- **THEN** ${change} behavior is provided\n`;
}

async function writeBaseModel(root: string): Promise<void> {
  await writeProjectModel(root, minimalModel({
    elements: [{ identity: 'alpha.id', parent: 'root', title: 'Alpha', summary: 'Alpha summary', requirements: CONTRACT }],
  }));
}

describe('ViewCommand', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'opsx-view-test-'));
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
      architectureDir: likec4CacheDir(tempDir),
      port: undefined,
      specRegistryFile: expect.stringContaining('xirang-spec-registry.json'),
      changeManifestFile: expect.stringContaining('xirang-change-manifest.json'),
    });
    expect((await fs.readdir(likec4CacheDir(tempDir))).sort())
      .toEqual(['model.c4', 'relations.c4', 'specification.c4', 'views.c4']);
  });

  it('passes a custom port to the embedded server', async () => {
    await writeBaseModel(tempDir);
    const launch = vi.fn<ViewLauncher>().mockResolvedValue(undefined);

    await new ViewCommand(launch).execute(tempDir, { port: 4321 });

    expect(launch).toHaveBeenCalledWith(expect.objectContaining({ projectRoot: tempDir, port: 4321 }));
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
      architectureDir: likec4CacheDir(innerRoot),
    }));
  });

  it('passes a sorted Contract registry snapshot keyed by Element identity', async () => {
    await writeProjectModel(tempDir, minimalModel({
      elements: [
        { identity: 'zeta.id', parent: 'root', requirements: CONTRACT },
        { identity: 'alpha.id', parent: 'root', requirements: CONTRACT },
        { identity: 'no.contract', parent: 'root' },
      ],
    }));
    let snapshot: unknown;
    const launch: ViewLauncher = async options => {
      snapshot = JSON.parse(await fs.readFile(options.specRegistryFile, 'utf8'));
    };

    await new ViewCommand(launch).execute(tempDir);

    expect(snapshot).toEqual({
      version: 1,
      elements: {
        'alpha.id': ['.xirang/model/elements/alpha.id.md'],
        'zeta.id': ['.xirang/model/elements/zeta.id.md'],
      },
    });
  });

  it('lists isolated active change variants deterministically and excludes archive', async () => {
    await writeBaseModel(tempDir);
    for (const change of ['z-change', 'a-change']) {
      await writeChangeDelta(tempDir, change, {
        'elements/alpha.id.md': requirementDelta(change === 'a-change' ? 'Alpha' : 'Zeta'),
      });
    }
    await fs.mkdir(path.join(tempDir, '.xirang', 'changes', 'archive', 'old-change'), { recursive: true });

    const snapshot = await buildViewRuntimeSnapshot(tempDir);

    expect(snapshot.variants.map(variant => variant.id)).toEqual([
      'formal', 'change:a-change', 'change:z-change',
    ]);
    const alpha = snapshot.variants[1]!;
    const zeta = snapshot.variants[2]!;
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
    const beforeVariant = before.variants.find(variant => variant.id === 'change:contract-only')!;
    expect(Object.keys(beforeVariant.partitionFingerprints!).sort())
      .toEqual(['elements', 'metamodel', 'relationships', 'views']);

    await writeChangeDelta(tempDir, 'contract-only', {
      'views/detail.md': '---\noperation: ADDED\nentity: authored-view\nidentity: detail\ninclude: "*"\n---\n',
    });
    const after = await buildViewRuntimeSnapshot(tempDir, { previous: before, onlyChange: 'contract-only' });
    const afterVariant = after.variants.find(variant => variant.id === 'change:contract-only')!;

    expect(afterVariant.changeFingerprint).not.toBe(beforeVariant.changeFingerprint);
    expect(afterVariant.partitionFingerprints!.views).not.toBe(beforeVariant.partitionFingerprints!.views);
    expect(afterVariant.partitionFingerprints!.elements).toBe(beforeVariant.partitionFingerprints!.elements);
  });

  it('retains invalid active changes with their diagnostics', async () => {
    await writeBaseModel(tempDir);
    await writeChangeDelta(tempDir, 'broken', {
      'elements/ghost.md': '---\noperation: MODIFIED\nentity: element-declaration\nidentity: ghost.id\nkind: capability\nparent: root\ntitle: Ghost\nsummary: Ghost\n---\n',
    });

    const snapshot = await buildViewRuntimeSnapshot(tempDir);

    expect(snapshot.variants).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'change:broken', valid: false, diagnostics: expect.any(Array) }),
    ]));
  });

  it('fails without launching when no Xirang project exists', async () => {
    const launch = vi.fn<ViewLauncher>().mockResolvedValue(undefined);

    await expect(new ViewCommand(launch).execute(tempDir)).rejects.toThrow(
      '未找到 Xirang 项目',
    );
    expect(launch).not.toHaveBeenCalled();
  });
});
