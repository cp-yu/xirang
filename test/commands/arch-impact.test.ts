import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { impactArchitecture } from '../../src/commands/arch/impact.js';
import { writeProjectModel } from '../helpers/model-fixture.js';

const execFileAsync = promisify(execFile);
const projectRoot = fileURLToPath(new URL('../..', import.meta.url));
const localeFixture = path.join(projectRoot, 'test', 'fixtures', 'arch-impact-locale-process.fixture.ts');
const localeVitestConfig = path.join(projectRoot, 'test', 'fixtures', 'vitest.arch-impact-locale.config.ts');
const vitestEntry = path.join(projectRoot, 'node_modules', 'vitest', 'vitest.mjs');

const CONTRACT = '## Requirements\n\n### Requirement: Stable behavior\nThe system SHALL behave.\n\n#### Scenario: Existing behavior\n- **WHEN** invoked\n- **THEN** behavior is preserved';

describe('architecture impact', () => {
  let root: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-arch-impact-'));
    await writeProjectModel(root, {
      elementKinds: [
        { identity: 'project', contract: 'required', root: true, children: ['capability', 'requiredCapability'] },
        { identity: 'capability', parents: ['project', 'capability'], children: ['capability'] },
        { identity: 'requiredCapability', contract: 'required', parents: ['project'] },
      ],
      relationshipKinds: [{ identity: 'invokes' }, { identity: 'observes' }],
      elements: [
        { identity: 'project.root', kind: 'project', parent: null, title: 'Project', summary: 'Project intent', requirements: CONTRACT },
        { identity: 'cap.domain', parent: 'project.root', title: 'Domain', summary: 'Domain context' },
        { identity: 'cap.focus', parent: 'cap.domain', title: 'Focus', summary: 'Impact focus', requirements: CONTRACT },
        { identity: 'cap.child', parent: 'cap.focus', title: 'Child', summary: 'Direct refinement' },
        { identity: 'cap.grandchild', parent: 'cap.child', title: 'Grandchild', summary: 'Deep refinement' },
        { identity: 'cap.incoming', parent: 'project.root', title: 'Incoming', summary: 'Incoming relation' },
        { identity: 'cap.alpha', parent: 'project.root', title: 'Alpha', summary: 'Canonical branch' },
        { identity: 'cap.beta', parent: 'project.root', title: 'Beta', summary: 'Alternate branch' },
        { identity: 'cap.target', parent: 'project.root', title: 'Target', summary: 'Depth two target' },
      ],
      relationships: [
        { source: 'cap.incoming', kind: 'observes', target: 'cap.focus' },
        { source: 'cap.focus', kind: 'invokes', target: 'cap.alpha' },
        { source: 'cap.focus', kind: 'invokes', target: 'cap.beta' },
        { source: 'cap.alpha', kind: 'invokes', target: 'cap.target' },
        { source: 'cap.beta', kind: 'invokes', target: 'cap.target' },
        { source: 'cap.target', kind: 'observes', target: 'cap.alpha' },
      ],
    });
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it('merges focus Elements and expands all Relationship kinds bidirectionally to default depth two', async () => {
    const result = await impactArchitecture(root, ['cap.focus', 'cap.incoming', 'cap.focus']);

    expect(result.focusElements.map(element => element.identity)).toEqual(['cap.focus', 'cap.incoming']);
    expect(result.elements.map(element => element.identity)).toEqual([...result.elements.map(element => element.identity)].sort());
    expect(result.elements.map(element => element.identity)).toEqual(expect.arrayContaining([
      'cap.alpha', 'cap.beta', 'cap.focus', 'cap.incoming', 'cap.target',
    ]));
    expect(result.relations).toEqual(expect.arrayContaining([
      { source: 'cap.incoming', kind: 'observes', target: 'cap.focus' },
      { source: 'cap.focus', kind: 'invokes', target: 'cap.alpha' },
      { source: 'cap.target', kind: 'observes', target: 'cap.alpha' },
    ]));
    expect(result.statistics.focusElementCount).toBe(2);
    expect(result.diagnostics).toEqual([]);
  });

  it('selects one canonical shortest path while preserving non-selected edges and terminating cycles', async () => {
    const result = await impactArchitecture(root, ['cap.focus']);
    const targetPath = result.relationPaths.find(item => item.focusElementId === 'cap.focus' && item.relatedElementId === 'cap.target');

    expect(targetPath?.steps).toEqual([
      { source: 'cap.focus', kind: 'invokes', target: 'cap.alpha', traversal: 'outgoing' },
      { source: 'cap.alpha', kind: 'invokes', target: 'cap.target', traversal: 'outgoing' },
    ]);
    expect(result.relations).toEqual(expect.arrayContaining([
      { source: 'cap.beta', kind: 'invokes', target: 'cap.target' },
      { source: 'cap.target', kind: 'observes', target: 'cap.alpha' },
    ]));
    expect(result.relationPaths.every(item => item.steps.length <= 2)).toBe(true);
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
      expect.objectContaining({ focusElementId: 'cap.focus', element: expect.objectContaining({ identity: 'cap.domain' }), direction: 'ancestor', depth: 1 }),
      expect.objectContaining({ focusElementId: 'cap.focus', element: expect.objectContaining({ identity: 'project.root' }), direction: 'ancestor', depth: 2 }),
      expect.objectContaining({ focusElementId: 'cap.focus', element: expect.objectContaining({ identity: 'cap.child' }), direction: 'descendant', depth: 1 }),
    ]));
    expect(result.refinementContext.some(item => item.element.identity === 'cap.grandchild')).toBe(false);
    expect(result.relationPaths.some(item => item.relatedElementId === 'cap.child')).toBe(false);
  });

  it('returns Contracts keyed by Element identity with matching statistics', async () => {
    const result = await impactArchitecture(root, ['cap.focus'], { depth: 0 });

    expect(result.contracts.map(item => item.elementId)).toEqual(['cap.focus', 'project.root']);
    expect(result.contracts[0]).not.toHaveProperty('specId');
    expect(result.contracts[0]).not.toHaveProperty('path');
    expect(result.contracts[0]).not.toHaveProperty('content');
    expect(result.contracts[0].requirements).toEqual([{
      name: 'Stable behavior',
      body: 'The system SHALL behave.',
      scenarios: [{ name: 'Existing behavior', body: '- **WHEN** invoked\n- **THEN** behavior is preserved' }],
    }]);
    expect(result.relations).toEqual([]);
    expect(result.relationPaths).toEqual([]);
    expect(result.statistics.contractCount).toBe(result.contracts.length);
    expect(result.statistics.contractBytes)
      .toBe(result.contracts.reduce((total, item) => total + Buffer.byteLength(JSON.stringify(item.requirements)), 0));
  });

  it('renames contractPolicy to contract on every projected Element', async () => {
    const result = await impactArchitecture(root, ['cap.focus'], { depth: 0 });

    expect(result.focusElements[0]).toMatchObject({ identity: 'cap.focus', contract: 'optional' });
    expect(result.focusElements[0]).not.toHaveProperty('contractPolicy');
    expect(result.focusElements[0]).not.toHaveProperty('fqn');
    expect(result.focusElements[0]).not.toHaveProperty('metadata');
  });

  it('rejects unknown identities, derived FQNs, and missing required Contracts', async () => {
    await expect(impactArchitecture(root, ['ghost.id'])).rejects.toThrow('Focus Element not found: ghost.id');
    await expect(impactArchitecture(root, ['root.domain.focus']))
      .rejects.toThrow('Focus Element must use stable elementId, not FQN');

    await writeProjectModel(root, {
      elementKinds: [
        { identity: 'project', root: true },
        { identity: 'requiredCapability', contract: 'required', parents: ['project'] },
      ],
      elements: [
        { identity: 'project.root', kind: 'project', parent: null, title: 'Project', summary: 'Project intent' },
        { identity: 'cap.missing', kind: 'requiredCapability', parent: 'project.root', title: 'Missing', summary: 'Required without a Contract' },
      ],
    });
    await expect(impactArchitecture(root, ['cap.missing'])).rejects.toThrow('Required Element Contract missing: cap.missing');
  });

  it('ignores active Changes and implementation code and remains read-only', async () => {
    const baseline = await impactArchitecture(root, ['cap.focus'], { depth: 1 });
    const changeDir = path.join(root, '.xirang', 'changes', 'active', 'elements');
    await fs.mkdir(changeDir, { recursive: true });
    await fs.writeFile(path.join(changeDir, 'cap.focus.md'), 'not a valid unit');
    const sourceDir = path.join(root, 'src');
    await fs.mkdir(sourceDir, { recursive: true });
    await fs.writeFile(path.join(sourceDir, 'focus.ts'), 'export const hiddenImplementation = true;\n');
    const before = await fs.readdir(root, { recursive: true });

    expect(await impactArchitecture(root, ['cap.focus'], { depth: 1 })).toEqual(baseline);
    expect(await fs.readdir(root, { recursive: true })).toEqual(before);
    expect(JSON.stringify(baseline)).not.toMatch(/files|symbols|imports|calls|mustChange|mustVerify|architectureDrift|seed/i);
  });
});
