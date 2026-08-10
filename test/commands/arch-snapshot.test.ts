import { promises as fs } from 'node:fs';
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

const CONTRACT = '## Requirements\n\n### Requirement: Stable behavior\nThe system SHALL behave.\n\n#### Scenario: Existing behavior\n- **WHEN** invoked\n- **THEN** behavior is preserved';

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
        { identity: 'observes' },
      ],
      elements: [
        { identity: 'project.root', kind: 'project', parent: null, title: 'Project', definition: 'Project intent', requirements: CONTRACT },
        { identity: 'cap.alpha', kind: 'capability', parent: 'project.root', title: 'Alpha', definition: 'Alpha definition' },
        { identity: 'cap.beta', kind: 'capability', parent: 'cap.alpha', title: 'Beta', definition: 'Beta definition', requirements: CONTRACT },
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
    expect(result.statistics.elementCount).toBe(3);
    expect(result.statistics.relationshipCount).toBe(2);
    expect(result.statistics.kindCount).toBe(4);
    // No Contract content anywhere.
    expect(JSON.stringify(result)).not.toContain('Stable behavior');
    expect(JSON.stringify(result)).not.toContain('## Requirements');
  });

  it('builds a flat element projection with parent and children links', () => {
    const elements = buildModelTree({
      elementKinds: [{ identity: 'project', contract: 'required', root: true, body: '' }],
      relationshipKinds: [],
      elements: [
        { declaration: { identity: 'project.root', kind: 'project', parent: null, title: 'Project', definition: 'Project intent' }, requirements: [] },
        { declaration: { identity: 'cap.alpha', kind: 'capability', parent: 'project.root', title: 'Alpha', definition: 'Alpha definition' }, requirements: [] },
        { declaration: { identity: 'cap.beta', kind: 'capability', parent: 'cap.alpha', title: 'Beta', definition: 'Beta definition' }, requirements: [] },
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
        { declaration: { identity: 'project.root', kind: 'project', parent: null, title: 'Project', definition: 'Project intent' }, requirements: [] },
        ...[...childIds].reverse().map(identity => ({
          declaration: { identity, kind: 'capability', parent: 'project.root', title: identity, definition: identity },
          requirements: [],
        })),
      ],
      relationships: [],
      views: [],
    });

    expect(elements.find(element => element.identity === 'project.root')?.children).toEqual(childIds);
    expect(elements).toHaveLength(childIds.length + 1);
  });

  it('renders a box-drawing text tree with identity (kind) | definition and no title', async () => {
    const result = await snapshotArchitecture(root);
    const text = formatArchitectureSnapshotText(result);

    expect(text).toContain('project.root (project) | Project intent');
    expect(text).toContain('cap.alpha (capability) | Alpha definition');
    expect(text).toContain('cap.beta (capability) | Beta definition');
    expect(text).toContain('└── ');
    // title "Alpha" and "Beta" must not appear as bare node labels.
    expect(text).not.toMatch(/\n\s*(└──|├──) Alpha\b/);
    // parent identity is not repeated in node lines.
    expect(text).not.toContain('parent');
    // Relations grouped by kind.
    expect(text).toContain('invokes:');
    expect(text).toContain('cap.alpha --> cap.beta');
    // Metamodel kinds carry definitions when present.
    expect(text).toContain('invokes');
    expect(text).toContain('invokes 表达 source 调用 target 的能力。');
  });

  it('renders a markdown nested list', async () => {
    const result = await snapshotArchitecture(root);
    const markdown = formatArchitectureSnapshotMarkdown(result);

    expect(markdown).toContain('- project.root (project) | Project intent');
    expect(markdown).toContain('  - cap.alpha (capability) | Alpha definition');
    expect(markdown).toContain('    - cap.beta (capability) | Beta definition');
  });

  it('serializes json without Contract and with stable identities', async () => {
    const result = await snapshotArchitecture(root);
    const json = treeToSnapshotJson(result);

    expect(json.elements.map(element => element.identity).sort()).toEqual(['cap.alpha', 'cap.beta', 'project.root']);
    expect(json.relations.length).toBe(2);
    expect(json.metamodel.elementKinds.length).toBe(2);
    expect(JSON.stringify(json)).not.toContain('Stable behavior');
    expect(JSON.stringify(json)).not.toContain('## Requirements');
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
