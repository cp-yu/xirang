import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { promisify } from 'node:util';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  buildModelTree,
  formatArchitectureSnapshotMarkdown,
  formatArchitectureSnapshotText,
  snapshotArchitecture,
  treeToSnapshotJson,
} from '../../src/commands/arch/snapshot.js';
import { writeProjectModel } from '../helpers/model-fixture.js';

const CONTRACT = '## Specification\n\n### Section: Stable behavior\nThe system SHALL behave.\n\n#### Acceptance Case: Existing behavior\n- **WHEN** invoked\n- **THEN** behavior is preserved';
const execFileAsync = promisify(execFile);

describe('architecture snapshot', () => {
  let root: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-arch-snapshot-'));
    await writeProjectModel(root, {
      elementKinds: [
        { identity: 'project', contract: 'required', root: true, children: ['capability'] },
        { identity: 'capability', parents: ['project', 'capability'], children: ['capability'] },
      ],
      relationshipKinds: [
        { identity: 'invokes', body: 'invokes 表达 source 调用 target 的能力。' },
        { identity: 'observes', sourceKinds: ['project'], targetKinds: ['capability'] },
      ],
      elements: [
        { identity: 'project.root', kind: 'project', parent: null, title: 'Project', definition: 'Project intent', sections: CONTRACT },
        { identity: 'cap.alpha', kind: 'capability', parent: 'project.root', title: 'Alpha', definition: 'Alpha definition' },
        { identity: 'cap.beta', kind: 'capability', parent: 'cap.alpha', title: 'Beta', definition: 'Beta definition', sections: CONTRACT },
      ],
      relationships: [
        { source: 'cap.alpha', kind: 'invokes', target: 'cap.beta' },
        { source: 'project.root', kind: 'observes', target: 'cap.alpha' },
      ],
    });
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it('projects the complete skeleton without any Contract content', async () => {
    const result = await snapshotArchitecture(root);

    expect(result.elements.map(element => element.identity).sort()).toEqual([
      'cap.alpha', 'cap.beta', 'project.root',
    ]);
    expect(result.relations).toEqual([
      { source: 'cap.alpha', kind: 'invokes', target: 'cap.beta' },
      { source: 'project.root', kind: 'observes', target: 'cap.alpha' },
    ]);
    expect(result.metamodel.elementKinds.map(kind => kind.identity).sort()).toEqual(['capability', 'project']);
    expect(result.metamodel.relationshipKinds.map(kind => kind.identity).sort()).toEqual(['invokes', 'observes']);
    expect(result.elements.find(element => element.identity === 'project.root')).toMatchObject({
      title: 'Project',
      definition: 'Project intent',
      parent: null,
    });
    expect(result.metamodel.elementKinds.find(kind => kind.identity === 'project')).toMatchObject({
      root: true,
      children: ['capability'],
    });
    expect(result.metamodel.relationshipKinds.find(kind => kind.identity === 'observes')).toMatchObject({
      sourceKinds: ['project'],
      targetKinds: ['capability'],
    });
    expect(result.statistics.elementCount).toBe(3);
    expect(result.statistics.relationshipCount).toBe(2);
    expect(result.statistics.kindCount).toBe(4);
    // No Contract content anywhere.
    expect(JSON.stringify(result)).not.toContain('Stable behavior');
    expect(JSON.stringify(result)).not.toContain('## Specification');
  });

  it('builds a flat element projection with parent and children links', () => {
    const elements = buildModelTree({
      elementKinds: [{ identity: 'project', contract: 'required', root: true, body: '' }],
      relationshipKinds: [],
      elements: [
        { declaration: { identity: 'project.root', kind: 'project', parent: null, title: 'Project', definition: 'Project intent' }, sections: [] },
        { declaration: { identity: 'cap.alpha', kind: 'capability', parent: 'project.root', title: 'Alpha', definition: 'Alpha definition' }, sections: [] },
        { declaration: { identity: 'cap.beta', kind: 'capability', parent: 'cap.alpha', title: 'Beta', definition: 'Beta definition' }, sections: [] },
      ],
      relationships: [],
      views: [],
    });

    expect(elements.map(element => element.identity)).toEqual(['cap.alpha', 'cap.beta', 'project.root']);
    const root = elements.find(element => element.identity === 'project.root')!;
    const alpha = elements.find(element => element.identity === 'cap.alpha')!;
    expect(root.parent).toBeNull();
    expect(root.children).toEqual(['cap.alpha']);
    expect(alpha.parent).toBe('project.root');
    expect(alpha.children).toEqual(['cap.beta']);
  });

  it('sorts high-fanout children without changing the flat projection', () => {
    const childIds = Array.from({ length: 64 }, (_, index) => `cap.${String(index).padStart(2, '0')}`);
    const elements = buildModelTree({
      elementKinds: [{ identity: 'project', contract: 'required', root: true, body: '' }],
      relationshipKinds: [],
      elements: [
        { declaration: { identity: 'project.root', kind: 'project', parent: null, title: 'Project', definition: 'Project intent' }, sections: [] },
        ...[...childIds].reverse().map(identity => ({
          declaration: { identity, kind: 'capability', parent: 'project.root', title: identity, definition: identity },
          sections: [],
        })),
      ],
      relationships: [],
      views: [],
    });

    expect(elements.find(element => element.identity === 'project.root')?.children).toEqual(childIds);
    expect(elements).toHaveLength(childIds.length + 1);
  });

  it('formats a deep hierarchy without call-stack recursion', async () => {
    const fixture = path.join(process.cwd(), 'test', 'fixtures', 'arch-outline-deep-process.fixture.mjs');

    await expect(execFileAsync(process.execPath, [
      '--stack-size=128',
      fixture,
      'snapshot-formatters',
    ], { cwd: process.cwd() })).resolves.toMatchObject({ stderr: '' });
  });

  it('renders a box-drawing text tree without Declaration title fields', async () => {
    const result = await snapshotArchitecture(root);
    const text = formatArchitectureSnapshotText(result);

    expect(text).toContain('project.root (project) | Project intent');
    expect(text).toContain('cap.alpha (capability) | Alpha definition');
    expect(text).toContain('cap.beta (capability) | Beta definition');
    expect(text).toContain('└── ');
    // Titles remain part of the complete JSON Declaration, not tree node labels.
    // parent identity is not repeated in node lines.
    expect(text.split('\n').filter(line => line.includes('──')).every(line => !line.includes('parent'))).toBe(true);
    // Relations grouped by kind.
    expect(text).toContain('invokes:');
    expect(text).toContain('cap.alpha --> cap.beta');
    // Metamodel projection retains complete Kind declarations in every format.
    expect(text).toContain('invokes');
    expect(text).toContain('invokes 表达 source 调用 target 的能力。');
    expect(text).toContain('"root":true');
    expect(text).toContain('"children":["capability"]');
    expect(text).toContain('"sourceKinds":["project"]');
    expect(text).toContain('"targetKinds":["capability"]');
  });

  it('renders a markdown nested list', async () => {
    const result = await snapshotArchitecture(root);
    const markdown = formatArchitectureSnapshotMarkdown(result);

    expect(markdown).toContain('- project.root (project) | Project intent');
    expect(markdown).toContain('  - cap.alpha (capability) | Alpha definition');
    expect(markdown).toContain('    - cap.beta (capability) | Beta definition');
    expect(markdown).toContain('"root":true');
    expect(markdown).toContain('"sourceKinds":["project"]');
  });

  it('serializes json without Contract and with stable identities', async () => {
    const result = await snapshotArchitecture(root);
    const json = treeToSnapshotJson(result);

    expect(json.elements.map(element => element.identity).sort()).toEqual(['cap.alpha', 'cap.beta', 'project.root']);
    expect(json.relations.length).toBe(2);
    expect(json.metamodel.elementKinds.length).toBe(2);
    expect(JSON.stringify(json)).not.toContain('Stable behavior');
    expect(JSON.stringify(json)).not.toContain('## Specification');
  });

  it('fails with non-zero exit when the model is missing', async () => {
    const empty = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-arch-snapshot-empty-'));
    try {
      await expect(snapshotArchitecture(empty)).rejects.toThrow();
    } finally {
      await fs.rm(empty, { recursive: true, force: true });
    }
  });
});
