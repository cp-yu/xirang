import { describe, expect, it } from 'vitest';
import { generateLikeC4 } from '../../../src/core/likec4/generator.js';
import { toLikeC4RelationshipStyle, toLikeC4Style } from '../../../src/core/likec4/presentation-adapter.js';
import { NODE_BORDER_VALUES, NODE_COLOR_VALUES, NODE_SHAPE_VALUES, RELATIONSHIP_ARROW_VALUES, RELATIONSHIP_COLOR_VALUES, RELATIONSHIP_LINE_VALUES, emptySemanticModel, type SemanticModel } from '../../../src/core/model/types.js';
import { applyXirangPresentationOverlay } from '../../../likec4/packages/diagram/src/xirang/architectureView.js';
import type { XirangViewSource } from '../../../likec4/packages/diagram/src/xirang/ContractLoaderContext.js';

function element(identity: string, parent: string | null, kind = 'capability', title = identity, definition = `${identity} definition.`): SemanticModel['elements'][number] {
  return { declaration: { identity, kind, parent, title, definition }, requirements: [] };
}

const constrained: SemanticModel = {
  ...emptySemanticModel(),
  elementKinds: [
    { identity: 'project', contract: 'required', root: true, children: ['domain'], body: 'A project root.' },
    { identity: 'domain', contract: 'optional', parents: ['project'], children: ['capability'], body: '' },
    { identity: 'capability', contract: 'required', parents: ['domain'], body: '' },
  ],
  relationshipKinds: [
    { identity: 'invokes', sourceKinds: ['capability'], targetKinds: ['capability'], body: 'Runtime call.' },
    { identity: 'covers', body: '' },
  ],
};

describe('generateLikeC4 specification.c4', () => {
  it('emits bare kind names in identity byte order', () => {
    expect(generateLikeC4(constrained).get('specification.c4')).toBe([
      'specification {',
      '  element capability',
      '  element domain',
      '  element project',
      '  relationship covers',
      '  relationship invokes',
      '}',
      '',
    ].join('\n'));
  });

  it('never emits a xirang block', () => {
    for (const [file, content] of generateLikeC4(constrained)) {
      if (file.endsWith('.c4')) expect(content).not.toContain('xirang');
    }
  });

  it('avoids LikeC4 keywords in kind and view names', () => {
    const model: SemanticModel = {
      ...emptySemanticModel(),
      elementKinds: [{ identity: 'views', contract: 'optional', body: '' }],
      relationshipKinds: [{ identity: 'include', body: '' }],
      views: [{ identity: 'arch.title', include: '*' }],
    };
    const files = generateLikeC4(model);
    expect(files.get('specification.c4')).toBe('specification {\n  element _views\n  relationship _include\n}\n');
    expect(files.get('views.c4')).toBe('views {\n  view model {\n  }\n  view arch_title {\n    include *\n  }\n}\n');
  });

  it('disables LikeC4 implicit views in the generated project', () => {
    expect(generateLikeC4(emptySemanticModel()).get('likec4.config.json')).toBe([
      '{',
      '  "name": "xirang",',
      '  "implicitViews": false,',
      '  "defaultLandscapeView": false',
      '}',
      '',
    ].join('\n'));
  });

  it('maps all valid nodePresentation values to LikeC4', () => {
    for (const shape of NODE_SHAPE_VALUES) {
      expect(toLikeC4Style({ shape })).toEqual({ shape });
    }
    for (const color of NODE_COLOR_VALUES) {
      expect(toLikeC4Style({ color })).toEqual({ color });
    }
    for (const border of NODE_BORDER_VALUES) {
      expect(toLikeC4Style({ border })).toEqual({ border });
    }
    expect(toLikeC4Style({ shape: 'document', color: 'indigo', border: 'solid' }))
      .toEqual({ shape: 'document', color: 'indigo', border: 'solid' });
  });

  it('generates LikeC4 style block for nodePresentation', () => {
    const model: SemanticModel = {
      ...emptySemanticModel(),
      elementKinds: [{
        identity: 'perspective',
        contract: 'optional',
        nodePresentation: { shape: 'document', color: 'indigo', border: 'solid' },
        body: '',
      }],
    };
    expect(generateLikeC4(model).get('specification.c4')).toBe([
      'specification {',
      '  element perspective {',
      '    style {',
      '      shape document',
      '      color indigo',
      '      border solid',
      '    }',
      '  }',
      '}',
      '',
    ].join('\n'));
  });

  it('outputs bare kind without nodePresentation', () => {
    expect(generateLikeC4(constrained).get('specification.c4')).toContain('  element capability\n');
    expect(generateLikeC4(constrained).get('specification.c4')).not.toContain('style {');
  });

  it('maps all valid relationship presentation values to LikeC4', () => {
    for (const color of RELATIONSHIP_COLOR_VALUES) {
      expect(toLikeC4RelationshipStyle({ color })).toEqual({ color });
    }
    for (const line of RELATIONSHIP_LINE_VALUES) {
      expect(toLikeC4RelationshipStyle({ line })).toEqual({ line });
    }
    for (const head of RELATIONSHIP_ARROW_VALUES) {
      expect(toLikeC4RelationshipStyle({ head })).toEqual({ head });
    }
    for (const tail of RELATIONSHIP_ARROW_VALUES) {
      expect(toLikeC4RelationshipStyle({ tail })).toEqual({ tail });
    }
    expect(toLikeC4RelationshipStyle({ color: 'blue', line: 'dashed', head: 'diamond', tail: 'normal' }))
      .toEqual({ color: 'blue', line: 'dashed', head: 'diamond', tail: 'normal' });
  });

  it('generates LikeC4 style block for relationship presentation', () => {
    const model: SemanticModel = {
      ...emptySemanticModel(),
      relationshipKinds: [{
        identity: 'critical-invokes',
        presentation: { color: 'red', line: 'dashed', head: 'diamond', tail: 'normal' },
        body: '',
      }],
    };
    expect(generateLikeC4(model).get('specification.c4')).toBe([
      'specification {',
      '  relationship critical_invokes {',
      '    style {',
      '      color red',
      '      line dashed',
      '      head diamond',
      '      tail normal',
      '    }',
      '  }',
      '}',
      '',
    ].join('\n'));
  });

  it('outputs bare relationship kind without presentation', () => {
    expect(generateLikeC4(constrained).get('specification.c4')).toContain('  relationship invokes\n');
  });

  it('generates perspective with style block', () => {
    const model: SemanticModel = {
      ...emptySemanticModel(),
      elementKinds: [{
        identity: 'perspective',
        contract: 'optional',
        nodePresentation: { shape: 'document', color: 'indigo', border: 'solid' },
        body: '',
      }],
    };
    expect(generateLikeC4(model).get('specification.c4')).toBe([
      'specification {',
      '  element perspective {',
      '    style {',
      '      shape document',
      '      color indigo',
      '      border solid',
      '    }',
      '  }',
      '}',
      '',
    ].join('\n'));
  });

  it('produces the generated project files', () => {
    expect([...generateLikeC4(emptySemanticModel()).keys()]).toEqual([
      'likec4.config.json',
      'specification.c4',
      'model.c4',
      'relations.c4',
      'views.c4',
    ]);
  });
});

describe('generateLikeC4 views.c4', () => {
  const model: SemanticModel = {
    ...emptySemanticModel(),
    elementKinds: [
      { identity: 'project', contract: 'required', body: '' },
      { identity: 'domain', contract: 'optional', body: '' },
    ],
    elements: [
      element('project.root', null, 'project'),
      element('domain.architecture', 'project.root', 'domain'),
      element('domain.cli', 'project.root', 'domain'),
    ],
    views: [
      { identity: 'refinement', include: '*', of: 'project.root' },
      { identity: 'index', include: '*', title: 'Xirang Architecture', autoLayout: 'TopBottom' },
      { identity: 'focus', include: ['domain.cli', 'domain.architecture'] },
    ],
  };

  it('emits views in identity byte order with optional properties omitted when absent', () => {
    expect(generateLikeC4(model).get('views.c4')).toBe([
      'views {',
      '  view model {',
      '    include root.architecture',
      '    include root.cli',
      '    include root',
      '  }',
      '  view focus {',
      '    include root.cli',
      '    include root.architecture',
      '  }',
      '  view index {',
      "    title 'Xirang Architecture'",
      '    include *',
      '    autoLayout TopBottom',
      '  }',
      '  view refinement of root {',
      '    include *',
      '  }',
      '}',
      '',
    ].join('\n'));
  });

  it('always emits the default model view', () => {
    expect(generateLikeC4(emptySemanticModel()).get('views.c4')).toBe([
      'views {',
      '  view model {',
      '  }',
      '}',
      '',
    ].join('\n'));
  });
});

const nested: SemanticModel = {
  ...emptySemanticModel(),
  elementKinds: [
    { identity: 'project', contract: 'required', root: true, body: '' },
    { identity: 'domain', contract: 'optional', body: '' },
    { identity: 'capability', contract: 'required', body: '' },
  ],
  relationshipKinds: [{ identity: 'invokes', body: '' }, { identity: 'covers', body: '' }],
  elements: [
    {
      declaration: { identity: 'cap.reader', kind: 'capability', parent: 'domain.architecture', title: 'Reader', definition: 'Reads units' },
      requirements: [{ name: 'Parses units', body: 'The reader SHALL parse every unit.', scenarios: [] }],
    },
    element('domain.architecture', 'project.root', 'domain', 'Architecture', 'Architecture intent'),
    element('project.root', null, 'project', 'Root', 'Project intent'),
    element('domain.cli', 'project.root', 'domain', 'CLI', 'CLI intent'),
    element('cap.parser', 'domain.architecture', 'capability', 'Parser', 'Parses units'),
  ],
  relationships: [
    { source: 'cap.reader', kind: 'invokes', target: 'domain.cli' },
    { source: 'cap.parser', kind: 'invokes', target: 'cap.reader' },
    { source: 'cap.parser', kind: 'covers', target: 'domain.cli' },
  ],
};

describe('generateLikeC4 model.c4', () => {
  it('rebuilds the nesting from parent and keeps elementId metadata', () => {
    expect(generateLikeC4(nested).get('model.c4')).toBe([
      'model {',
      "  root = project 'Root' 'Project intent' {",
      "    description 'Project intent'",
      '    metadata {',
      "      elementId 'project.root'",
      '    }',
      "    architecture = domain 'Architecture' 'Architecture intent' {",
      "      description 'Architecture intent'",
      '      metadata {',
      "        elementId 'domain.architecture'",
      '      }',
      "      parser = capability 'Parser' 'Parses units' {",
      "        description 'Parses units'",
      '        metadata {',
      "          elementId 'cap.parser'",
      '        }',
      '      }',
      "      reader = capability 'Reader' 'Reads units' {",
      "        description 'Reads units'",
      '        metadata {',
      "          elementId 'cap.reader'",
      '        }',
      '      }',
      '    }',
      "    cli = domain 'CLI' 'CLI intent' {",
      "      description 'CLI intent'",
      '      metadata {',
      "        elementId 'domain.cli'",
      '      }',
      '    }',
      '  }',
      '}',
      '',
    ].join('\n'));
  });

  it('projects a deterministic summary excerpt and the full Definition', () => {
    const cases = [
      { definition: 'a'.repeat(24), summary: 'a'.repeat(24) },
      { definition: 'a'.repeat(25), summary: 'a'.repeat(25) },
      { definition: 'a'.repeat(26), summary: `${'a'.repeat(25)}...` },
      { definition: '😀'.repeat(26), summary: `${'😀'.repeat(25)}...` },
      { definition: '  First   paragraph.  \n\nSecond paragraph remains full.  ', summary: 'First paragraph.' },
    ];

    for (const [index, item] of cases.entries()) {
      const model: SemanticModel = {
        ...emptySemanticModel(),
        elementKinds: [{ identity: 'capability', contract: 'optional', body: '' }],
        elements: [element(`cap.${index}`, null, 'capability', 'Capability', item.definition)],
      };
      const output = generateLikeC4(model).get('model.c4')!;
      expect(output).toContain(`= capability 'Capability' '${item.summary}' {`);
      expect(output).toContain(`description '${item.definition.replaceAll('\\', '\\\\').replaceAll("'", "\\'").replaceAll('\n', '\\n')}'`);
    }
  });

  it('bounds every summary excerpt in the generated artifacts', () => {
    const long = '长'.repeat(200);
    const model: SemanticModel = {
      ...emptySemanticModel(),
      elementKinds: [{ identity: 'capability', contract: 'optional', body: '' }],
      elements: Array.from({ length: 6 }, (_, i) => element(`cap.${i}`, null, 'capability', `Capability ${i}`, long)),
    };
    const output = generateLikeC4(model).get('model.c4')!;
    const summaries = [...output.matchAll(/= capability '[^']+' '([^']*)' \{/g)].map(match => match[1]);
    expect(summaries).toHaveLength(6);
    // EXCERPT_LIMIT (25) plus the '...' suffix; long summaries widen LikeC4 node labels
    // and can push the view into a graphviz unflatten layout failure.
    for (const summary of summaries) {
      expect([...summary].length).toBeLessThanOrEqual(28);
    }
  });

  it('leaves the element contract out of the artifact', () => {
    expect(generateLikeC4(nested).get('model.c4')).not.toContain('SHALL parse');
  });

  it('emits an empty model block when there are no elements', () => {
    expect(generateLikeC4(emptySemanticModel()).get('model.c4')).toBe('model {\n}\n');
  });
});

describe('generateLikeC4 relations.c4', () => {
  it('emits derived endpoint paths ordered by source, kind then target', () => {
    expect(generateLikeC4(nested).get('relations.c4')).toBe([
      'model {',
      "  root.architecture.parser -[covers]-> root.cli 'covers'",
      "  root.architecture.parser -[invokes]-> root.architecture.reader 'invokes'",
      "  root.architecture.reader -[invokes]-> root.cli 'invokes'",
      '}',
      '',
    ].join('\n'));
  });

  it('omits ancestor-descendant relationships that LikeC4 cannot represent', () => {
    const model: SemanticModel = {
      ...nested,
      relationships: [
        ...nested.relationships,
        { source: 'cap.reader', kind: 'invokes', target: 'domain.architecture' },
        { source: 'project.root', kind: 'covers', target: 'cap.parser' },
        { source: 'cap.reader', kind: 'covers', target: 'cap.reader' },
      ],
    };

    const relations = generateLikeC4(model).get('relations.c4')!;
    expect(relations).not.toContain('root.architecture.reader -[invokes]-> root.architecture');
    expect(relations).not.toContain('root -[covers]-> root.architecture.parser');
    expect(relations).not.toContain('root.architecture.reader -[covers]-> root.architecture.reader');
    expect(model.relationships).toHaveLength(6);
  });

  it('emits an empty model block when there are no relationships', () => {
    expect(generateLikeC4(emptySemanticModel()).get('relations.c4')).toBe('model {\n}\n');
  });
});

describe('generateLikeC4 determinism and escaping', () => {
  it('produces identical bytes across calls and input orders', () => {
    const shuffled: SemanticModel = {
      elementKinds: [...nested.elementKinds].reverse(),
      relationshipKinds: [...nested.relationshipKinds].reverse(),
      elements: [...nested.elements].reverse(),
      relationships: [...nested.relationships].reverse(),
      views: [],
    };
    expect([...generateLikeC4(shuffled)]).toEqual([...generateLikeC4(nested)]);
    expect([...generateLikeC4(nested)]).toEqual([...generateLikeC4(nested)]);
  });

  it('throws when an element references an undeclared kind', () => {
    expect(() => generateLikeC4({ ...emptySemanticModel(), elements: [element('project.root', null, 'project')] }))
      .toThrow(/project/);
  });

  it('escapes quotes, backslashes and newlines in strings', () => {
    const model: SemanticModel = {
      ...emptySemanticModel(),
      elementKinds: [{ identity: 'project', contract: 'required', body: '' }],
      elements: [element('project.root', null, 'project', "It's a \\ root", 'line one\nline two')],
    };
    expect(generateLikeC4(model).get('model.c4')).toContain(
      "root = project 'It\\'s a \\\\ root' 'line one line two' {",
    );
  });
});

describe('generator-browser presentation parity', () => {
  const modelView = {
    _type: 'element',
    _stage: 'layouted',
    id: 'index',
    title: 'Index',
    hash: 'modelView',
    bounds: { x: 0, y: 0, width: 1200, height: 400 },
    nodes: [{
      id: 'root',
      modelRef: 'root',
      metadata: { elementId: 'root' },
      parent: null,
      level: 0,
      children: [],
      inEdges: [],
      outEdges: [],
      title: 'Root',
      shape: 'rectangle',
      color: 'primary',
      style: { opacity: 15, size: 'md' },
      kind: 'el',
      x: 0,
      y: 40,
      width: 320,
      height: 180,
    }],
    edges: [],
  } as never;

  function sourceFor(presentation: Record<string, string>): XirangViewSource {
    return {
      id: 'model',
      label: 'Model View',
      source: 'semantic-model',
      valid: true,
      sourceFingerprint: 'fp',
      diagnostics: [],
      architecture: {
        elements: [{
          declaration: {
            identity: 'root',
            kind: 'styled',
            parent: null,
            title: 'Root',
            definition: 'Root.',
            summary: 'Root.',
            description: 'Root.',
          },
        }],
        relationships: [],
        elementKinds: [{ identity: 'styled', nodePresentation: presentation }],
      },
    };
  }

  it('resolves every shape value identically to the generator adapter', () => {
    for (const shape of NODE_SHAPE_VALUES) {
      const rendered = applyXirangPresentationOverlay(modelView, sourceFor({ shape }))
        .nodes[0] as unknown as { shape: string };
      expect(rendered.shape).toBe(toLikeC4Style({ shape })!.shape);
    }
  });

  it('resolves every color value identically to the generator adapter', () => {
    for (const color of NODE_COLOR_VALUES) {
      const rendered = applyXirangPresentationOverlay(modelView, sourceFor({ color }))
        .nodes[0] as unknown as { color: string };
      expect(rendered.color).toBe(toLikeC4Style({ color })!.color);
    }
  });

  it('resolves every border value identically to the generator adapter', () => {
    for (const border of NODE_BORDER_VALUES) {
      const rendered = applyXirangPresentationOverlay(modelView, sourceFor({ border }))
        .nodes[0] as unknown as { style: { border?: string } };
      expect(rendered.style.border).toBe(toLikeC4Style({ border })!.border);
    }
  });
});
