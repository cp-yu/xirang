import { promises as fs } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  computeProjectionKey,
  createRuntimeProjection,
  type ProjectionDescriptor,
} from '../../../src/core/likec4/runtime-projection.js';
import { emptySemanticModel, type ModelElement, type SemanticModel } from '../../../src/core/model/types.js';

function element(identity: string, parent: string | null, kind: string): ModelElement {
  return {
    declaration: { identity, kind, parent, title: identity, definition: `${identity} definition.` },
    requirements: [],
  };
}

const model: SemanticModel = {
  ...emptySemanticModel(),
  elementKinds: [
    { identity: 'project', contract: 'required', root: true, children: ['domain'], body: '' },
    { identity: 'domain', contract: 'required', parents: ['project'], children: ['capability'], body: '' },
    { identity: 'capability', contract: 'required', parents: ['domain'], body: '' },
  ],
  relationshipKinds: [{ identity: 'invokes', body: '' }],
  elements: [
    element('root', null, 'project'),
    element('domain-a', 'root', 'domain'),
    element('cap-a1', 'domain-a', 'capability'),
    element('cap-a2', 'domain-a', 'capability'),
    element('domain-b', 'root', 'domain'),
    element('cap-b1', 'domain-b', 'capability'),
  ],
  relationships: [
    { source: 'cap-a1', kind: 'invokes', target: 'cap-b1' },
    { source: 'cap-a1', kind: 'invokes', target: 'cap-a2' },
  ],
};

function project(overrides: Partial<ProjectionDescriptor> = {}) {
  return createRuntimeProjection({
    model,
    viewSelection: { type: 'model' },
    changeSelection: null,
    presentationMode: 'complete',
    focus: null,
    expanded: [],
    ...overrides,
  });
}

const GENERATED_FILES = ['likec4.config.json', 'specification.c4', 'model.c4', 'relations.c4', 'views.c4'];

describe('createRuntimeProjection lowering', () => {
  it('emits the same native LikeC4 file set for every selection', () => {
    const selections: ProjectionDescriptor['viewSelection'][] = [
      { type: 'model' },
      { type: 'authored', view: { identity: 'partial', include: ['domain-a'] } },
    ];
    for (const viewSelection of selections) {
      expect([...project({ viewSelection }).files.keys()].sort()).toEqual([...GENERATED_FILES].sort());
    }
  });

  it('anchors every projected Element by its stable identity', () => {
    const modelC4 = project().files.get('model.c4')!;
    for (const item of model.elements) {
      expect(modelC4).toContain(`elementId '${item.declaration.identity}'`);
    }
  });

  it('limits an Authored projection to the descendants closure', () => {
    const projection = project({
      viewSelection: { type: 'authored', view: { identity: 'partial', include: ['domain-a'] } },
    });
    expect(projection.selection).toEqual(['cap-a1', 'cap-a2', 'domain-a']);
    const modelC4 = projection.files.get('model.c4')!;
    expect(modelC4).toContain("elementId 'domain-a'");
    expect(modelC4).not.toContain("elementId 'domain-b'");
    expect(modelC4).not.toContain("elementId 'root'");
  });

  it('prunes the whole excluded subtree ahead of include', () => {
    const projection = project({
      viewSelection: { type: 'authored', view: { identity: 'excluded', include: ['root'], exclude: ['domain-b'] } },
    });
    expect(projection.selection).toEqual(['cap-a1', 'cap-a2', 'domain-a', 'root']);
    const modelC4 = projection.files.get('model.c4')!;
    expect(modelC4).not.toContain("elementId 'domain-b'");
    expect(modelC4).not.toContain("elementId 'cap-b1'");
  });

  it('keeps a relationship only when both endpoints stay visible', () => {
    const relations = project({
      viewSelection: { type: 'authored', view: { identity: 'partial', include: ['domain-a'] } },
    }).files.get('relations.c4')!;
    expect(relations).toContain('invokes');
    expect(relations.match(/-\[invokes\]->/g)).toHaveLength(1);
  });

  it('omits self and ancestor-chain Relationships that LikeC4 cannot express', () => {
    const withUnrepresentable: SemanticModel = {
      ...model,
      relationships: [
        { source: 'cap-a1', kind: 'invokes', target: 'cap-a1' },
        { source: 'root', kind: 'invokes', target: 'cap-a1' },
        { source: 'cap-a1', kind: 'invokes', target: 'root' },
      ],
    };
    const relations = createRuntimeProjection({
      model: withUnrepresentable,
      viewSelection: { type: 'model' },
      changeSelection: null,
      presentationMode: 'complete',
      focus: null,
      expanded: [],
    }).files.get('relations.c4')!;
    expect(relations).not.toContain('-[invokes]->');
    expect(withUnrepresentable.relationships).toHaveLength(3);
  });

  it('lowers a Change target through the same path as the Model', () => {
    const target: SemanticModel = {
      ...model,
      elements: [...model.elements, element('cap-a3', 'domain-a', 'capability')],
    };
    const projection = project({
      changeSelection: { changeId: 'demo', target },
    });
    expect(projection.selection).toContain('cap-a3');
    expect(projection.files.get('model.c4')).toContain("elementId 'cap-a3'");
    expect([...projection.files.keys()].sort()).toEqual([...GENERATED_FILES].sort());
  });

  it('produces byte-identical files for an equal descriptor', () => {
    expect([...project().files.entries()]).toEqual([...project().files.entries()]);
  });
});

describe('createRuntimeProjection virtual root', () => {
  it('marks a virtual root for mutually independent top-level selections', () => {
    expect(project({
      viewSelection: { type: 'authored', view: { identity: 'multi', include: ['domain-a', 'domain-b'] } },
    }).virtualRoot).toBe(true);
  });

  it('keeps the real root for a single-root Authored selection', () => {
    expect(project({
      viewSelection: { type: 'authored', view: { identity: 'single', include: ['root'] } },
    }).virtualRoot).toBe(false);
  });

  it('never marks a virtual root for the Model selection', () => {
    expect(project().virtualRoot).toBe(false);
  });
});

describe('computeProjectionKey', () => {
  const base = {
    modelFingerprint: 'abc123',
    viewSelection: { type: 'model' } as ProjectionDescriptor['viewSelection'],
    changeSelection: null,
    presentationMode: 'complete' as const,
    focus: null,
    expanded: [] as string[],
  };

  it('is stable for the same descriptor', () => {
    expect(computeProjectionKey(base)).toBe(computeProjectionKey(base));
  });

  it('separates each dimension of the descriptor', () => {
    const keys = new Set([
      computeProjectionKey(base),
      computeProjectionKey({ ...base, viewSelection: { type: 'authored', view: { identity: 'partial', include: ['a'] } } }),
      computeProjectionKey({ ...base, changeSelection: { changeId: 'demo' } }),
      computeProjectionKey({ ...base, presentationMode: 'complete-with-diff' }),
      computeProjectionKey({ ...base, presentationMode: 'diff-only' }),
      computeProjectionKey({ ...base, focus: 'domain-a' }),
      computeProjectionKey({ ...base, expanded: ['domain-a'] }),
      computeProjectionKey({ ...base, modelFingerprint: 'def456' }),
    ]);
    expect(keys.size).toBe(8);
  });

  it('ignores the order of the expanded set', () => {
    expect(computeProjectionKey({ ...base, expanded: ['a', 'b', 'c'] }))
      .toBe(computeProjectionKey({ ...base, expanded: ['c', 'b', 'a'] }));
  });
});

describe('root package boundary', () => {
  it('never imports the LikeC4 compute or layout engines', async () => {
    const forbidden = ['@likec4/core', '@likec4/layouts', '@likec4/language-services', 'graphviz'];
    const offenders: string[] = [];
    const walk = async (dir: string): Promise<void> => {
      for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(full);
          continue;
        }
        if (!entry.name.endsWith('.ts')) continue;
        const content = await fs.readFile(full, 'utf8');
        for (const module of forbidden) {
          if (content.includes(`from '${module}`)) offenders.push(`${full} -> ${module}`);
        }
      }
    };
    await walk(path.join(process.cwd(), 'src'));
    expect(offenders).toEqual([]);
  });
});
