import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildViewRuntimeSnapshot, ViewCommand, type ViewLauncher } from '../../src/core/view.js';
import { validateArchitecture } from '../../src/utils/architecture-validator.js';
import { readLikeC4Architecture } from '../../src/utils/likec4-reader.js';

const browserFixtureRoot = path.resolve(import.meta.dirname, '..', 'fixtures', 'spec-browser');

describe('ViewCommand', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'opsx-view-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('starts the embedded LikeC4 view for an OPSX project', async () => {
    const architectureDir = path.join(tempDir, '.opsx', 'architecture');
    await fs.mkdir(architectureDir, { recursive: true });
    const launch = vi.fn<ViewLauncher>().mockResolvedValue(undefined);

    await new ViewCommand(launch).execute(tempDir);

    expect(launch).toHaveBeenCalledOnce();
    expect(launch).toHaveBeenCalledWith({
      projectRoot: tempDir,
      architectureDir,
      port: undefined,
      specRegistryFile: expect.stringContaining('opsx-spec-registry.json'),
      changeManifestFile: expect.stringContaining('opsx-change-manifest.json'),
    });
  });

  it('passes a custom port to the embedded server', async () => {
    const architectureDir = path.join(tempDir, '.opsx', 'architecture');
    await fs.mkdir(architectureDir, { recursive: true });
    const launch = vi.fn<ViewLauncher>().mockResolvedValue(undefined);

    await new ViewCommand(launch).execute(tempDir, { port: 4321 });

    expect(launch).toHaveBeenCalledWith({
      projectRoot: tempDir,
      architectureDir,
      port: 4321,
      specRegistryFile: expect.stringContaining('opsx-spec-registry.json'),
      changeManifestFile: expect.stringContaining('opsx-change-manifest.json'),
    });
  });

  it('discovers the nearest OPSX project from a nested directory', async () => {
    const outerArchitecture = path.join(tempDir, '.opsx', 'architecture');
    const innerRoot = path.join(tempDir, 'packages', 'feature');
    const innerArchitecture = path.join(innerRoot, '.opsx', 'architecture');
    const nestedDir = path.join(innerRoot, 'src', 'nested');
    await fs.mkdir(outerArchitecture, { recursive: true });
    await fs.mkdir(innerArchitecture, { recursive: true });
    await fs.mkdir(nestedDir, { recursive: true });
    const launch = vi.fn<ViewLauncher>().mockResolvedValue(undefined);

    await new ViewCommand(launch).execute(nestedDir);

    expect(launch).toHaveBeenCalledWith({
      projectRoot: innerRoot,
      architectureDir: innerArchitecture,
      port: undefined,
      specRegistryFile: expect.stringContaining('opsx-spec-registry.json'),
      changeManifestFile: expect.stringContaining('opsx-change-manifest.json'),
    });
  });

  it('passes a sorted immutable Spec registry snapshot to the server lifecycle', async () => {
    const architectureDir = path.join(tempDir, '.opsx', 'architecture');
    await fs.mkdir(architectureDir, { recursive: true });
    await fs.mkdir(path.join(tempDir, '.opsx', 'specs', 'zeta'), { recursive: true });
    await fs.mkdir(path.join(tempDir, '.opsx', 'specs', 'alpha'), { recursive: true });
    await fs.writeFile(path.join(tempDir, '.opsx', 'specs', 'zeta', 'spec.md'), '---\nelement: payment.authorize\n---\n');
    await fs.writeFile(path.join(tempDir, '.opsx', 'specs', 'alpha', 'spec.md'), '---\nelement: payment.authorize\n---\n');
    let snapshot: unknown;
    const launch: ViewLauncher = async options => {
      snapshot = JSON.parse(await fs.readFile(options.specRegistryFile, 'utf8'));
    };

    await new ViewCommand(launch).execute(tempDir);

    expect(snapshot).toEqual({
      version: 1,
      elements: {
        'payment.authorize': [
          '.opsx/specs/alpha/spec.md',
          '.opsx/specs/zeta/spec.md',
        ],
      },
    });
  });

  it('lists isolated active change variants deterministically and excludes archive', async () => {
    const architectureDir = path.join(tempDir, '.opsx', 'architecture');
    await fs.mkdir(architectureDir, { recursive: true });
    await fs.writeFile(path.join(architectureDir, 'model.c4'), [
      "opsx { languageVersion '1' }",
      'specification {',
      '  element project { opsx { root true contract optional } }',
      '  element capability { opsx { contract optional parents [project] } }',
      '}',
      'model {',
      "  projectRoot = project 'Root' 'Root summary' {",
      "    metadata { elementId 'project.root' }",
      "    alpha = capability 'Alpha' 'Alpha summary' { metadata { elementId 'alpha.id' } }",
      '  }',
      '}',
    ].join('\n'));
    const mainSpec = path.join(tempDir, '.opsx', 'specs', 'alpha', 'spec.md');
    await fs.mkdir(path.dirname(mainSpec), { recursive: true });
    await fs.writeFile(mainSpec, `---\nelement: alpha.id\n---\n\n## Purpose\nAlpha behavior for runtime variant tests.\n\n## Requirements\n\n### Requirement: Existing\nThe system SHALL preserve existing behavior.\n\n#### Scenario: Existing\n- **WHEN** invoked\n- **THEN** existing behavior remains\n`);

    for (const [change, requirement] of [['z-change', 'Zeta'], ['a-change', 'Alpha']] as const) {
      const delta = path.join(tempDir, '.opsx', 'changes', change, 'specs', 'alpha', 'spec.md');
      await fs.mkdir(path.dirname(delta), { recursive: true });
      await fs.writeFile(delta, `---\nelement: alpha.id\n---\n\n## ADDED Requirements\n\n### Requirement: ${requirement}\nThe system SHALL provide ${requirement} behavior.\n\n#### Scenario: ${requirement}\n- **WHEN** invoked\n- **THEN** ${requirement} behavior is provided\n`);
    }
    await fs.mkdir(path.join(tempDir, '.opsx', 'changes', 'archive', 'old-change'), { recursive: true });

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
    expect(zeta.diff?.entries.some(entry => entry.identity.includes('#Alpha'))).toBe(false);
    expect(alpha.diff?.summary.architecture).toEqual({ ADDED: 0, MODIFIED: 0, REMOVED: 0 });
    expect(alpha.architecture?.elements).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'project.root', fqn: 'projectRoot' }),
      expect.objectContaining({ id: 'alpha.id', fqn: 'projectRoot.alpha' }),
    ]));
  });

  it('keeps Architecture identity stable when only Specs change in a mixed change', async () => {
    await fs.cp(browserFixtureRoot, tempDir, { recursive: true });
    const targetSpec = path.join(tempDir, '.opsx', 'changes', 'architecture-change', 'specs', 'single', 'spec.md');

    const before = await buildViewRuntimeSnapshot(tempDir);
    const beforeVariant = before.variants.find(variant => variant.id === 'change:architecture-change')!;
    await fs.writeFile(targetSpec, (await fs.readFile(targetSpec, 'utf8')).replace('architecture-change target content', 'new Spec-only content'));
    const after = await buildViewRuntimeSnapshot(tempDir, { previous: before, onlyChange: 'architecture-change' });
    const afterVariant = after.variants.find(variant => variant.id === 'change:architecture-change')!;

    expect(afterVariant.changeFingerprint).not.toBe(beforeVariant.changeFingerprint);
    expect(afterVariant.specsFingerprint).not.toBe(beforeVariant.specsFingerprint);
    expect(afterVariant.architectureFingerprint).toBe(beforeVariant.architectureFingerprint);
    expect(after.variants.find(variant => variant.id === 'change:browser-change')).toBe(
      before.variants.find(variant => variant.id === 'change:browser-change'),
    );
  });

  it('retains invalid active changes with partitioned diagnostics', async () => {
    await fs.mkdir(path.join(tempDir, '.opsx', 'architecture'), { recursive: true });
    const delta = path.join(tempDir, '.opsx', 'changes', 'broken', 'specs', 'bad', 'spec.md');
    await fs.mkdir(path.dirname(delta), { recursive: true });
    await fs.writeFile(delta, '## RENAMED Requirements\n');

    const snapshot = await buildViewRuntimeSnapshot(tempDir);

    expect(snapshot.variants).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'change:broken', valid: false, diagnostics: expect.any(Array) }),
    ]));
  });

  it('fails without launching when no OPSX project exists', async () => {
    const launch = vi.fn<ViewLauncher>().mockResolvedValue(undefined);

    await expect(new ViewCommand(launch).execute(tempDir)).rejects.toThrow(
      '未找到 OPSX 项目',
    );
    expect(launch).not.toHaveBeenCalled();
  });

  it('uses a complete v1 Semantic Model for the browser fixture', async () => {
    const architecture = await readLikeC4Architecture(browserFixtureRoot);
    const validation = await validateArchitecture(browserFixtureRoot, architecture);

    expect(architecture.profile).toBe('v1');
    expect(architecture.elements).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'project.root',
        kind: 'project',
        parent: null,
        children: ['browser.long', 'browser.multi', 'browser.none', 'browser.single'],
      }),
      expect.objectContaining({ id: 'browser.none', kind: 'capability', parent: 'project.root' }),
      expect.objectContaining({ id: 'browser.single', kind: 'capability', parent: 'project.root' }),
      expect.objectContaining({ id: 'browser.multi', kind: 'capability', parent: 'project.root' }),
      expect.objectContaining({ id: 'browser.long', kind: 'capability', parent: 'project.root' }),
    ]));
    expect(validation).toEqual({ success: true, errors: [], warnings: [] });
  });
});
