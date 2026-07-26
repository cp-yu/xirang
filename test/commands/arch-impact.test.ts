import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { impactArchitecture } from '../../src/commands/arch/impact.js';

const execFileAsync = promisify(execFile);
const projectRoot = fileURLToPath(new URL('../..', import.meta.url));
const localeFixture = path.join(projectRoot, 'test', 'fixtures', 'arch-impact-locale-process.fixture.ts');
const localeVitestConfig = path.join(projectRoot, 'test', 'fixtures', 'vitest.arch-impact-locale.config.ts');
const vitestEntry = path.join(projectRoot, 'node_modules', 'vitest', 'vitest.mjs');

const specification = `xirang { languageVersion '1' }
specification {
  element project { xirang { root true contract required children [capability, requiredCapability] } }
  element capability { xirang { contract optional parents [project, capability] children [capability] } }
  element requiredCapability { xirang { contract required parents [project] } }
  relationship invokes
  relationship observes
}`;

const model = `model {
  project_root = project 'Project' 'Project intent' {
    metadata { elementId 'project.root' }
    domain = capability 'Domain' 'Domain context' {
      metadata { elementId 'cap.domain' }
      focus = capability 'Focus' 'Impact focus' {
        metadata { elementId 'cap.focus' }
        child = capability 'Child' 'Direct refinement' {
          metadata { elementId 'cap.child' }
          grandchild = capability 'Grandchild' 'Deep refinement' {
            metadata { elementId 'cap.grandchild' }
          }
        }
      }
    }
    incoming = capability 'Incoming' 'Incoming relation' { metadata { elementId 'cap.incoming' } }
    alpha = capability 'Alpha' 'Canonical branch' { metadata { elementId 'cap.alpha' } }
    beta = capability 'Beta' 'Alternate branch' { metadata { elementId 'cap.beta' } }
    target = capability 'Target' 'Depth two target' { metadata { elementId 'cap.target' } }
    missing = requiredCapability 'Missing Contract' 'Required without a Contract' { metadata { elementId 'cap.missing' } }
  }
  project_root.incoming -[observes]-> project_root.domain.focus
  project_root.domain.focus -[invokes]-> project_root.alpha
  project_root.domain.focus -[invokes]-> project_root.beta
  project_root.alpha -[invokes]-> project_root.target
  project_root.beta -[invokes]-> project_root.target
  project_root.target -[observes]-> project_root.alpha
}`;

function contract(elementId: string, purpose: string): string {
  return `---\nelement: ${elementId}\n---\n\n# Contract\n\n## Purpose\n${purpose}\n\n## Requirements\n\n### Requirement: Stable behavior\nThe system SHALL behave.\n\n#### Scenario: Existing behavior\n- **WHEN** invoked\n- **THEN** behavior is preserved\n`;
}

describe('architecture impact', () => {
  let root: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-arch-impact-'));
    const architectureDir = path.join(root, '.xirang', 'architecture');
    await fs.mkdir(architectureDir, { recursive: true });
    await fs.writeFile(path.join(architectureDir, 'specification.c4'), specification);
    await fs.writeFile(path.join(architectureDir, 'model.c4'), model);

    for (const [specId, content] of [
      ['project-contract', contract('project.root', 'Project contract.')],
      ['focus-contract', contract('cap.focus', 'Focus contract.')],
      ['focus-extra', contract('cap.focus', 'Additional focus contract.')],
    ] as const) {
      const specDir = path.join(root, '.xirang', 'specs', specId);
      await fs.mkdir(specDir, { recursive: true });
      await fs.writeFile(path.join(specDir, 'spec.md'), content);
    }
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it('merges focus Elements and expands all Relationship kinds bidirectionally to default depth two', async () => {
    const result = await impactArchitecture(root, ['cap.focus', 'cap.incoming', 'cap.focus']);

    expect(result.focusElements.map(element => element.id)).toEqual(['cap.focus', 'cap.incoming']);
    expect(result.elements.map(element => element.id)).toEqual([...result.elements.map(element => element.id)].sort());
    expect(result.elements.map(element => element.id)).toEqual(expect.arrayContaining([
      'cap.alpha', 'cap.beta', 'cap.focus', 'cap.incoming', 'cap.target',
    ]));
    expect(result.relations).toEqual(expect.arrayContaining([
      expect.objectContaining({ source: 'cap.incoming', kind: 'observes', target: 'cap.focus' }),
      expect.objectContaining({ source: 'cap.focus', kind: 'invokes', target: 'cap.alpha' }),
      expect.objectContaining({ source: 'cap.target', kind: 'observes', target: 'cap.alpha' }),
    ]));
    expect(result.statistics.focusElementCount).toBe(2);
    expect(result.diagnostics).toEqual([]);
  });

  it('selects one canonical shortest path while preserving non-selected edges and terminating cycles', async () => {
    const result = await impactArchitecture(root, ['cap.focus']);
    const targetPath = result.relationPaths.find(path => path.focusElementId === 'cap.focus' && path.relatedElementId === 'cap.target');

    expect(targetPath?.steps).toEqual([
      { source: 'cap.focus', kind: 'invokes', target: 'cap.alpha', traversal: 'outgoing' },
      { source: 'cap.alpha', kind: 'invokes', target: 'cap.target', traversal: 'outgoing' },
    ]);
    expect(result.relations).toEqual(expect.arrayContaining([
      expect.objectContaining({ source: 'cap.beta', kind: 'invokes', target: 'cap.target' }),
      expect.objectContaining({ source: 'cap.target', kind: 'observes', target: 'cap.alpha' }),
    ]));
    expect(result.relationPaths.every(path => path.steps.length <= 2)).toBe(true);
  });

  it('returns identical canonical projections across process locales', async () => {
    const locales = ['en_US.UTF-8', 'tr_TR.UTF-8', 'sv_SE.UTF-8'];
    const outputPaths = locales.map(locale => path.join(root, `${locale}.json`));

    await Promise.all(locales.map((locale, index) => execFileAsync(
      process.execPath,
      [vitestEntry, 'run', localeFixture, '--config', localeVitestConfig],
      {
        cwd: projectRoot,
        env: { ...process.env, LANG: locale, XIRANG_LOCALE_OUTPUT: outputPaths[index] },
      },
    )));

    const outputs = await Promise.all(outputPaths.map(output => fs.readFile(output, 'utf8')));
    expect(outputs[1]).toBe(outputs[0]);
    expect(outputs[2]).toBe(outputs[0]);
  });

  it('separates the complete ancestor chain from depth-bounded descendants', async () => {
    const result = await impactArchitecture(root, ['cap.focus'], { depth: 1 });

    expect(result.refinementContext).toEqual(expect.arrayContaining([
      expect.objectContaining({ focusElementId: 'cap.focus', element: expect.objectContaining({ id: 'cap.domain' }), direction: 'ancestor', depth: 1 }),
      expect.objectContaining({ focusElementId: 'cap.focus', element: expect.objectContaining({ id: 'project.root' }), direction: 'ancestor', depth: 2 }),
      expect.objectContaining({ focusElementId: 'cap.focus', element: expect.objectContaining({ id: 'cap.child' }), direction: 'descendant', depth: 1 }),
    ]));
    expect(result.refinementContext.some(item => item.element.id === 'cap.grandchild')).toBe(false);
    expect(result.relationPaths.some(path => path.relatedElementId === 'cap.child')).toBe(false);
  });

  it('returns complete Contracts with stable logical paths and statistics', async () => {
    const result = await impactArchitecture(root, ['cap.focus'], { depth: 0 });
    const focusContracts = result.contracts.filter(item => item.elementId === 'cap.focus');

    expect(focusContracts.map(item => item.specId)).toEqual(['focus-contract', 'focus-extra']);
    expect(focusContracts[0]).toMatchObject({
      elementId: 'cap.focus',
      path: '.xirang/specs/focus-contract/spec.md',
    });
    expect(focusContracts[0].content).toContain('## Purpose\nFocus contract.');
    expect(result.relations).toEqual([]);
    expect(result.relationPaths).toEqual([]);
    expect(result.statistics.contractCount).toBe(result.contracts.length);
    expect(result.statistics.contractBytes).toBe(result.contracts.reduce((total, item) => total + Buffer.byteLength(item.content), 0));
  });

  it('rejects unknown identities, FQNs, and missing required Contracts', async () => {
    await expect(impactArchitecture(root, ['ghost.id'])).rejects.toThrow('Focus Element not found: ghost.id');
    await expect(impactArchitecture(root, ['project_root.domain.focus'])).rejects.toThrow('Use xirang arch search');
    await expect(impactArchitecture(root, ['cap.missing'])).rejects.toThrow('Required Element Contract missing: cap.missing');
  });

  it('rejects malformed or multiple Contract ownership with the Spec identity', async () => {
    const specDir = path.join(root, '.xirang', 'specs', 'conflicted-contract');
    await fs.mkdir(specDir, { recursive: true });
    await fs.writeFile(path.join(specDir, 'spec.md'), '---\nelement: [cap.focus, cap.alpha]\n---\n# Conflict\n');

    await expect(impactArchitecture(root, ['cap.focus'], { depth: 0 }))
      .rejects.toThrow(/conflicted-contract.*MULTIPLE_SPEC_OWNERS/);
  });

  it('rejects unreadable Contract files with the Spec identity', async () => {
    const specPath = path.join(root, '.xirang', 'specs', 'unreadable-contract', 'spec.md');
    await fs.mkdir(specPath, { recursive: true });

    await expect(impactArchitecture(root, ['cap.focus'], { depth: 0 }))
      .rejects.toThrow(/unreadable-contract.*READ_FAILED/);
  });

  it('rejects Contract owners absent from the Formal Semantic Model', async () => {
    const specDir = path.join(root, '.xirang', 'specs', 'unknown-owner');
    await fs.mkdir(specDir, { recursive: true });
    await fs.writeFile(path.join(specDir, 'spec.md'), contract('cap.ghost', 'Unknown owner.'));

    await expect(impactArchitecture(root, ['cap.focus'], { depth: 0 }))
      .rejects.toThrow(/unknown-owner: cap\.ghost/);
  });

  it('ignores active Changes and implementation code and remains read-only', async () => {
    const baseline = await impactArchitecture(root, ['cap.focus'], { depth: 1 });
    const changeDir = path.join(root, '.xirang', 'changes', 'active');
    await fs.mkdir(changeDir, { recursive: true });
    await fs.writeFile(path.join(changeDir, 'architecture-delta.c4'), 'not valid architecture');
    const sourceDir = path.join(root, 'src');
    await fs.mkdir(sourceDir, { recursive: true });
    await fs.writeFile(path.join(sourceDir, 'focus.ts'), 'export const hiddenImplementation = true;\n');
    const before = await fs.readdir(root, { recursive: true });

    expect(await impactArchitecture(root, ['cap.focus'], { depth: 1 })).toEqual(baseline);
    expect(await fs.readdir(root, { recursive: true })).toEqual(before);
    expect(JSON.stringify(baseline)).not.toMatch(/files|symbols|imports|calls|mustChange|mustVerify|architectureDrift|seed/i);
  });
});
