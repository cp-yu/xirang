import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { formatArchitectureImpactText, impactArchitecture } from '../../src/commands/arch/impact.js';
import { writeProjectModel } from '../helpers/model-fixture.js';

const execFileAsync = promisify(execFile);
const projectRoot = fileURLToPath(new URL('../..', import.meta.url));
const localeFixture = path.join(projectRoot, 'test', 'fixtures', 'arch-impact-locale-process.fixture.ts');
const localeVitestConfig = path.join(projectRoot, 'test', 'fixtures', 'vitest.arch-impact-locale.config.ts');
const vitestEntry = path.join(projectRoot, 'node_modules', 'vitest', 'vitest.mjs');

const CONTRACT = '## Requirements\n\n### Requirement: Stable behavior\nThe system SHALL behave.\n\n#### Scenario: Existing\n- **WHEN** invoked\n- **THEN** behavior is preserved';
const FOCUS_DEFINITION = 'Focus definition preserves the complete concept boundary.\n\nSecond paragraph remains part of the Definition.';

describe('architecture impact', () => {
  let root: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-arch-impact-'));
    await writeProjectModel(root, {
      elementKinds: [
        { identity: 'project', contract: 'required', root: true, children: ['capability'] },
        { identity: 'capability', parents: ['project', 'capability'], children: ['capability'] },
      ],
      relationshipKinds: [{ identity: 'invokes' }, { identity: 'observes' }],
      elements: [
        { identity: 'project.root', kind: 'project', parent: null, title: 'Project', definition: 'Project intent', requirements: CONTRACT },
        { identity: 'cap.domain', parent: 'project.root', title: 'Domain', definition: 'Domain context' },
        { identity: 'cap.focus', parent: 'cap.domain', title: 'Focus', definition: FOCUS_DEFINITION, requirements: CONTRACT },
        { identity: 'cap.child', parent: 'cap.focus', title: 'Child', definition: 'Direct refinement' },
        { identity: 'cap.grandchild', parent: 'cap.child', title: 'Grandchild', definition: 'Deep refinement' },
        { identity: 'cap.incoming', parent: 'project.root', title: 'Incoming', definition: 'Incoming relation' },
        { identity: 'cap.alpha', parent: 'project.root', title: 'Alpha', definition: 'Canonical branch' },
        { identity: 'cap.beta', parent: 'project.root', title: 'Beta', definition: 'Alternate branch' },
        { identity: 'cap.target', parent: 'project.root', title: 'Target', definition: 'Depth two target' },
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

  it('merges focus identities and expands all Relationship kinds bidirectionally to depth two', async () => {
    const result = await impactArchitecture(root, ['cap.focus', 'cap.incoming', 'cap.focus']);

    expect(result.focusElements).toEqual(['cap.focus', 'cap.incoming']);
    expect(result.elements).toEqual([...result.elements].sort());
    expect(result.elements).toEqual(expect.arrayContaining([
      'cap.alpha', 'cap.beta', 'cap.focus', 'cap.incoming', 'cap.target',
    ]));
    expect(result.relations).toEqual(expect.arrayContaining([
      { source: 'cap.incoming', kind: 'observes', target: 'cap.focus' },
      { source: 'cap.focus', kind: 'invokes', target: 'cap.alpha' },
      { source: 'cap.target', kind: 'observes', target: 'cap.alpha' },
    ]));
    expect(result.statistics).toEqual({
      focusElementCount: 2,
      elementCount: result.elements.length,
      relationCount: result.relations.length,
    });
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

  it('selects the same canonical path from an unsorted frontier across input permutations', async () => {
    const relationships = [
      { source: 'a.branch', kind: 'observes', target: 'm.focus' },
      { source: 'm.focus', kind: 'invokes', target: '0.branch' },
      { source: 'a.branch', kind: 'invokes', target: 'z.target' },
      { source: '0.branch', kind: 'invokes', target: 'z.target' },
    ];
    const roots = await Promise.all([0, 1].map(async permutation => {
      const fixtureRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-arch-impact-frontier-'));
      await writeProjectModel(fixtureRoot, {
        elementKinds: [
          { identity: 'project', contract: 'required', root: true, children: ['capability'] },
          { identity: 'capability', parents: ['project'], children: [] },
        ],
        relationshipKinds: [{ identity: 'invokes' }, { identity: 'observes' }],
        elements: [
          { identity: 'project.root', kind: 'project', parent: null, title: 'Project', definition: 'Project intent', requirements: CONTRACT },
          { identity: 'm.focus', parent: 'project.root', title: 'Focus', definition: 'Focus' },
          { identity: 'a.branch', parent: 'project.root', title: 'A', definition: 'A' },
          { identity: '0.branch', parent: 'project.root', title: 'Zero', definition: 'Zero' },
          { identity: 'z.target', parent: 'project.root', title: 'Target', definition: 'Target' },
        ],
        relationships: permutation === 0 ? relationships : [...relationships].reverse(),
      });
      return fixtureRoot;
    }));

    try {
      const results = await Promise.all(roots.map(fixtureRoot => impactArchitecture(fixtureRoot, ['m.focus'], { depth: 2 })));
      const targetPath = results[0].relationPaths.find(path => path.relatedElementId === 'z.target');

      expect(results[1]).toEqual(results[0]);
      expect(targetPath?.steps).toEqual([
        { source: 'a.branch', kind: 'observes', target: 'm.focus', traversal: 'incoming' },
        { source: 'a.branch', kind: 'invokes', target: 'z.target', traversal: 'outgoing' },
      ]);
    } finally {
      await Promise.all(roots.map(fixtureRoot => fs.rm(fixtureRoot, { recursive: true, force: true })));
    }
  });

  it('preserves high-degree ordering and inserts a self-loop into adjacency once', async () => {
    const highDegreeRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-arch-impact-high-degree-'));
    const targets = Array.from({ length: 32 }, (_, index) => `cap.target-${String(index).padStart(2, '0')}`);
    try {
      await writeProjectModel(highDegreeRoot, {
        elementKinds: [
          { identity: 'project', contract: 'required', root: true, children: ['capability'] },
          { identity: 'capability', parents: ['project'], children: [] },
        ],
        relationshipKinds: [{ identity: 'invokes' }, { identity: 'observes' }],
        elements: [
          { identity: 'project.root', kind: 'project', parent: null, title: 'Project', definition: 'Project intent', requirements: CONTRACT },
          { identity: 'cap.focus', parent: 'project.root', title: 'Focus', definition: 'Focus' },
          ...targets.map(identity => ({ identity, parent: 'project.root', title: identity, definition: identity })),
        ],
        relationships: [
          ...[...targets].reverse().map(target => ({ source: 'cap.focus', kind: 'invokes', target })),
          { source: 'cap.focus', kind: 'observes', target: 'cap.focus' },
        ],
      });

      const result = await impactArchitecture(highDegreeRoot, ['cap.focus'], { depth: 1 });

      expect(result.relations.filter(relation => relation.source === 'cap.focus')).toEqual([
        ...targets.map(target => ({ source: 'cap.focus', kind: 'invokes', target })),
        { source: 'cap.focus', kind: 'observes', target: 'cap.focus' },
      ]);
      expect(result.relationPaths).toHaveLength(targets.length);
      expect(result.relationPaths.some(path => path.relatedElementId === 'cap.focus')).toBe(false);
    } finally {
      await fs.rm(highDegreeRoot, { recursive: true, force: true });
    }
  });

  it('projects identity-only payloads without Definitions or Contracts', async () => {
    const result = await impactArchitecture(root, ['cap.focus'], { depth: 0 });
    const text = formatArchitectureImpactText(result);
    const serialized = JSON.stringify(result);

    expect(result.elements).toEqual(['cap.domain', 'cap.focus', 'project.root']);
    expect(result.refinementContext).toEqual(expect.arrayContaining([
      { focusElementId: 'cap.focus', elementId: 'cap.domain', direction: 'ancestor', depth: 1 },
      { focusElementId: 'cap.focus', elementId: 'project.root', direction: 'ancestor', depth: 2 },
    ]));
    expect(result.relations).toEqual([]);
    expect(result.relationPaths).toEqual([]);
    expect(serialized).not.toContain(FOCUS_DEFINITION);
    expect(serialized).not.toMatch(/contract|requirements|scenarios|title|definition|children/);
    expect(text).toContain('Element identities: cap.domain, cap.focus, project.root');
    expect(text).not.toContain(FOCUS_DEFINITION);
  });

  it('separates the complete ancestor chain from depth-bounded descendants', async () => {
    const result = await impactArchitecture(root, ['cap.focus'], { depth: 1 });

    expect(result.refinementContext).toEqual(expect.arrayContaining([
      expect.objectContaining({ focusElementId: 'cap.focus', elementId: 'cap.domain', direction: 'ancestor', depth: 1 }),
      expect.objectContaining({ focusElementId: 'cap.focus', elementId: 'project.root', direction: 'ancestor', depth: 2 }),
      expect.objectContaining({ focusElementId: 'cap.focus', elementId: 'cap.child', direction: 'descendant', depth: 1 }),
    ]));
    expect(result.refinementContext.some(item => item.elementId === 'cap.grandchild')).toBe(false);
    expect(result.relationPaths.some(item => item.relatedElementId === 'cap.child')).toBe(false);
  });

  it('accepts optional elements without Contracts and rejects unknown identities', async () => {
    await expect(impactArchitecture(root, ['ghost.id'])).rejects.toThrow('Focus Element not found: ghost.id');
    await expect(impactArchitecture(root, ['root.domain.focus']))
      .rejects.toThrow('Focus Element must use stable elementId, not FQN');
    await expect(impactArchitecture(root, ['cap.child'], { depth: 0 })).resolves.toMatchObject({
      focusElements: ['cap.child'],
    });
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
});
