import { describe, expect, it } from 'vitest';
import { generateLikeC4 } from '../../../src/core/likec4/generator.js';
import { emptySemanticModel, type SemanticModel } from '../../../src/core/model/types.js';

function element(identity: string, parent: string | null, kind = 'capability', title = identity, summary = ''): SemanticModel['elements'][number] {
  return { declaration: { identity, kind, parent, title, summary }, requirements: [] };
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
    for (const content of generateLikeC4(constrained).values()) expect(content).not.toContain('xirang');
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
    expect(files.get('views.c4')).toBe('views {\n  view arch_title {\n    include *\n  }\n}\n');
  });

  it('produces the four artifact files', () => {
    expect([...generateLikeC4(emptySemanticModel()).keys()]).toEqual([
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

  it('emits an empty views block when there are no views', () => {
    expect(generateLikeC4(emptySemanticModel()).get('views.c4')).toBe('views {\n}\n');
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
      declaration: { identity: 'cap.reader', kind: 'capability', parent: 'domain.architecture', title: 'Reader', summary: 'Reads units' },
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
      '    metadata {',
      "      elementId 'project.root'",
      '    }',
      "    architecture = domain 'Architecture' 'Architecture intent' {",
      '      metadata {',
      "        elementId 'domain.architecture'",
      '      }',
      "      parser = capability 'Parser' 'Parses units' {",
      '        metadata {',
      "          elementId 'cap.parser'",
      '        }',
      '      }',
      "      reader = capability 'Reader' 'Reads units' {",
      '        metadata {',
      "          elementId 'cap.reader'",
      '        }',
      '      }',
      '    }',
      "    cli = domain 'CLI' 'CLI intent' {",
      '      metadata {',
      "        elementId 'domain.cli'",
      '      }',
      '    }',
      '  }',
      '}',
      '',
    ].join('\n'));
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
      '  root.architecture.parser -[covers]-> root.cli',
      '  root.architecture.parser -[invokes]-> root.architecture.reader',
      '  root.architecture.reader -[invokes]-> root.cli',
      '}',
      '',
    ].join('\n'));
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
      "root = project 'It\\'s a \\\\ root' 'line one\\nline two' {",
    );
  });
});
