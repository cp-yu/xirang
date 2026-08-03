import { describe, expect, it } from 'vitest';
import { parseSemanticModel } from '../../../src/core/model/parser.js';
import { createModelRoot } from './fixtures.js';

const ROOT_KIND = [
  '---',
  'entity: element-kind',
  'identity: project',
  'contract: optional',
  'root: true',
  '---',
  '',
  'The single root of the project.',
  '',
].join('\n');

const CAPABILITY = [
  '---',
  'entity: element-declaration',
  'identity: cap.reader',
  'kind: capability',
  'parent: domain.architecture',
  'title: Reader',
  'definition: Reads source modules and defines the reader boundary.',
  '---',
  '',
  '## Requirements',
  '',
  '### Requirement: Parses units',
  '',
  'The reader SHALL parse every unit.',
  '',
  '#### Scenario: Valid unit',
  '',
  '- WHEN a unit is valid',
  '- THEN it is parsed',
  '',
  '#### Scenario: Invalid unit',
  '',
  '- THEN a diagnostic is produced',
  '',
  '### Requirement: Builds an index',
  '',
  'The reader SHALL index identities.',
  '',
].join('\n');

const RELATIONSHIPS = [
  'relationships:',
  '  - source: cap.reader',
  '    kind: invokes',
  '    target: cap.writer',
  '  - source: cap.writer',
  '    kind: invokes',
  '    target: cap.reader',
  '',
].join('\n');

const PERSPECTIVE_KIND = [
  '---',
  'entity: element-kind',
  'identity: perspective',
  'contract: optional',
  'nodePresentation:',
  '  shape: document',
  '  color: indigo',
  '  border: solid',
  '---',
  '',
  'Perspective kind.',
  '',
].join('\n');

const PERSPECTIVE_KIND_PARTIAL = [
  '---',
  'entity: element-kind',
  'identity: perspective',
  'contract: optional',
  'nodePresentation:',
  '  shape: document',
  '---',
  '',
  'Perspective kind.',
  '',
].join('\n');

describe('parseSemanticModel', () => {
  it('parses all four partitions', async () => {
    const root = await createModelRoot({
      'metamodel/project.md': ROOT_KIND,
      'metamodel/invokes.md': '---\nentity: relationship-kind\nidentity: invokes\nsourceKinds:\n  - capability\n---\n\nCall edges.\n',
      'elements/cap.reader.md': CAPABILITY,
      'relationships/invokes.yaml': RELATIONSHIPS,
      'views/overview.md': '---\nentity: authored-view\nidentity: overview\ninclude: "*"\ntitle: Overview\n---\n',
    });

    const parsed = await parseSemanticModel(root);
    expect(parsed.diagnostics).toEqual([]);
    expect(parsed.model.elementKinds).toEqual([
      { identity: 'project', contract: 'optional', root: true, body: 'The single root of the project.' },
    ]);
    expect(parsed.model.relationshipKinds).toEqual([
      { identity: 'invokes', sourceKinds: ['capability'], body: 'Call edges.' },
    ]);
    expect(parsed.model.views).toEqual([{ identity: 'overview', include: '*', title: 'Overview' }]);
    expect(parsed.model.relationships).toEqual([
      { source: 'cap.reader', kind: 'invokes', target: 'cap.writer' },
      { source: 'cap.writer', kind: 'invokes', target: 'cap.reader' },
    ]);
  });

  it('preserves requirement order and scenario order', async () => {
    const root = await createModelRoot({ 'elements/cap.reader.md': CAPABILITY });
    const [element] = (await parseSemanticModel(root)).model.elements;

    expect(element.declaration).toEqual({
      identity: 'cap.reader',
      kind: 'capability',
      parent: 'domain.architecture',
      title: 'Reader',
      definition: 'Reads source modules and defines the reader boundary.',
    });
    expect(element.requirements.map(item => item.name)).toEqual(['Parses units', 'Builds an index']);
    expect(element.requirements[0]).toEqual({
      name: 'Parses units',
      body: 'The reader SHALL parse every unit.',
      scenarios: [
        { name: 'Valid unit', body: '- WHEN a unit is valid\n- THEN it is parsed' },
        { name: 'Invalid unit', body: '- THEN a diagnostic is produced' },
      ],
    });
  });

  it('treats a missing or null parent as the Project Root', async () => {
    const root = await createModelRoot({
      'elements/a.md': '---\nentity: element-declaration\nidentity: a\nkind: project\ntitle: A\ndefinition: Project A.\n---\n',
      'elements/b.md': '---\nentity: element-declaration\nidentity: b\nkind: project\nparent: null\ntitle: B\ndefinition: Project B.\n---\n',
    });
    const parents = (await parseSemanticModel(root)).model.elements.map(item => item.declaration.parent);
    expect(parents).toEqual([null, null]);
  });

  it('rejects legacy summary and an empty definition explicitly', async () => {
    const root = await createModelRoot({
      'elements/legacy.md': '---\nentity: element-declaration\nidentity: legacy\nkind: project\ntitle: Legacy\nsummary: Old text\n---\n',
      'elements/both.md': '---\nentity: element-declaration\nidentity: both\nkind: project\ntitle: Both\ndefinition: Current text\nsummary: Old text\n---\n',
      'elements/empty.md': '---\nentity: element-declaration\nidentity: empty\nkind: project\ntitle: Empty\ndefinition: "  "\n---\n',
    });

    const diagnostics = (await parseSemanticModel(root)).diagnostics;
    expect(diagnostics.filter(item => item.code === 'LEGACY_ELEMENT_SUMMARY')).toHaveLength(2);
    expect(diagnostics.filter(item => item.code === 'MISSING_ELEMENT_DEFINITION')).toHaveLength(2);
    expect(diagnostics.find(item => item.identity === 'legacy')?.message).toContain('migrate it to "definition"');
  });

  it('parses a single relationships container holding many entries', async () => {
    const root = await createModelRoot({ 'relationships/all.yaml': RELATIONSHIPS });
    expect((await parseSemanticModel(root)).model.relationships).toHaveLength(2);
  });

  it('determines entity type from the entry, not from the partition', async () => {
    const root = await createModelRoot({ 'views/project.md': ROOT_KIND });
    const parsed = await parseSemanticModel(root);

    expect(parsed.diagnostics).toEqual([{
      level: 'WARNING',
      code: 'ENTITY_PARTITION_MISMATCH',
      path: 'views/project.md',
      message: 'element-kind project is stored in views instead of metamodel',
      identity: 'project',
    }]);
    expect(parsed.model.elementKinds.map(item => item.identity)).toEqual(['project']);
    expect(parsed.model.views).toEqual([]);
    expect(parsed.index.organizationWarnings()).toEqual([
      { identity: 'project', declared: 'element-kind', partition: 'views', path: 'views/project.md' },
    ]);
  });

  it('ignores file names when resolving identities', async () => {
    const root = await createModelRoot({ 'elements/completely-unrelated-name.md': CAPABILITY });
    const parsed = await parseSemanticModel(root);
    expect(parsed.model.elements[0].declaration.identity).toBe('cap.reader');
    expect(parsed.index.moduleOf('cap.reader')?.path).toBe('elements/completely-unrelated-name.md');
  });

  it('rejects a body on an authored view instead of dropping it', async () => {
    const root = await createModelRoot({
      'views/overview.md': '---\nentity: authored-view\nidentity: overview\ninclude: "*"\n---\n\nStray prose.\n',
    });
    expect((await parseSemanticModel(root)).diagnostics).toEqual([
      {
        level: 'ERROR',
        code: 'VIEW_BODY_UNSUPPORTED',
        path: 'views/overview.md',
        message: 'Authored view overview must not carry a body',
        identity: 'overview',
      },
    ]);
  });

  it('rejects contract content outside the Requirements section', async () => {
    const head = '---\nentity: element-declaration\nidentity: a\nkind: capability\ntitle: A\ndefinition: Capability A.\n---\n';
    for (const body of [
      '\n## Requirements\n\n### Requirement: R\n\nBody.\n\n## Notes\n\nTrailing.\n',
      '\n## Purpose\n\nWhy it exists.\n\n## Requirements\n\n### Requirement: R\n\nBody.\n',
      '\nLoose prose without any section.\n',
    ]) {
      const parsed = await parseSemanticModel(await createModelRoot({ 'elements/a.md': head + body }));
      expect(parsed.diagnostics.map(item => item.code)).toEqual(['UNSUPPORTED_CONTRACT_CONTENT']);
    }
  });

  it('reports an element kind that declares no contract', async () => {
    const root = await createModelRoot({ 'metamodel/k.md': '---\nentity: element-kind\nidentity: k\n---\n' });
    const parsed = await parseSemanticModel(root);
    expect(parsed.diagnostics.map(item => item.code)).toEqual(['MISSING_CONTRACT']);
  });

  it('reports malformed units without aborting the parse', async () => {
    const root = await createModelRoot({
      'elements/broken.md': '---\nentity: element-declaration\nidentity: broken\n',
      'metamodel/unknown.md': '---\nentity: nonsense\nidentity: x\n---\n',
      'relationships/broken.yaml': 'relationships:\n  - source: a\n    kind: uses\n',
      'metamodel/project.md': ROOT_KIND,
    });
    const parsed = await parseSemanticModel(root);
    expect(parsed.diagnostics.map(item => item.code).sort()).toEqual([
      'MALFORMED_FRONTMATTER', 'MALFORMED_UNIT', 'UNKNOWN_ENTITY',
    ]);
    expect(parsed.model.elementKinds).toHaveLength(1);
  });

  it('returns an empty model when the root does not exist', async () => {
    const parsed = await parseSemanticModel('/nonexistent/model/root');
    expect(parsed.model).toEqual({ elementKinds: [], relationshipKinds: [], elements: [], relationships: [], views: [] });
    expect(parsed.diagnostics).toEqual([]);
  });

  describe('nodePresentation', () => {
    it('parses element kind with complete nodePresentation', async () => {
      const root = await createModelRoot({ 'metamodel/perspective.md': PERSPECTIVE_KIND });
      const parsed = await parseSemanticModel(root);
      expect(parsed.diagnostics).toEqual([]);
      expect(parsed.model.elementKinds[0].nodePresentation).toEqual({
        shape: 'document',
        color: 'indigo',
        border: 'solid',
      });
    });

    it('parses element kind with partial nodePresentation', async () => {
      const root = await createModelRoot({ 'metamodel/perspective.md': PERSPECTIVE_KIND_PARTIAL });
      const parsed = await parseSemanticModel(root);
      expect(parsed.diagnostics).toEqual([]);
      expect(parsed.model.elementKinds[0].nodePresentation).toEqual({ shape: 'document' });
    });

    it('rejects unknown nodePresentation field', async () => {
      const content = PERSPECTIVE_KIND.replace('border: solid', 'borderStyle: solid');
      const root = await createModelRoot({ 'metamodel/perspective.md': content });
      const parsed = await parseSemanticModel(root);
      expect(parsed.diagnostics).toHaveLength(1);
      expect(parsed.diagnostics[0].code).toBe('INVALID_NODE_PRESENTATION');
      expect(parsed.diagnostics[0].message).toContain('unknown fields');
    });

    it('rejects invalid shape value', async () => {
      const content = PERSPECTIVE_KIND.replace('shape: document', 'shape: oval');
      const root = await createModelRoot({ 'metamodel/perspective.md': content });
      const parsed = await parseSemanticModel(root);
      expect(parsed.diagnostics).toHaveLength(1);
      expect(parsed.diagnostics[0].code).toBe('INVALID_NODE_PRESENTATION');
      expect(parsed.diagnostics[0].message).toContain('shape');
    });

    it('rejects invalid color value', async () => {
      const content = PERSPECTIVE_KIND.replace('color: indigo', 'color: violet');
      const root = await createModelRoot({ 'metamodel/perspective.md': content });
      const parsed = await parseSemanticModel(root);
      expect(parsed.diagnostics).toHaveLength(1);
      expect(parsed.diagnostics[0].code).toBe('INVALID_NODE_PRESENTATION');
      expect(parsed.diagnostics[0].message).toContain('color');
    });

    it('rejects invalid border value', async () => {
      const content = PERSPECTIVE_KIND.replace('border: solid', 'border: double');
      const root = await createModelRoot({ 'metamodel/perspective.md': content });
      const parsed = await parseSemanticModel(root);
      expect(parsed.diagnostics).toHaveLength(1);
      expect(parsed.diagnostics[0].code).toBe('INVALID_NODE_PRESENTATION');
      expect(parsed.diagnostics[0].message).toContain('border');
    });

    it('rejects non-mapping nodePresentation', async () => {
      const content = [
        '---',
        'entity: element-kind',
        'identity: perspective',
        'contract: optional',
        'nodePresentation: invalid',
        '---',
        '',
      ].join('\n');
      const root = await createModelRoot({ 'metamodel/perspective.md': content });
      const parsed = await parseSemanticModel(root);
      expect(parsed.diagnostics).toHaveLength(1);
      expect(parsed.diagnostics[0].code).toBe('INVALID_NODE_PRESENTATION');
      expect(parsed.diagnostics[0].message).toContain('must be a mapping');
    });

    it('round-trips element kind with nodePresentation', async () => {
      const root = await createModelRoot({ 'metamodel/perspective.md': PERSPECTIVE_KIND });
      const parsed = await parseSemanticModel(root);
      expect(parsed.diagnostics).toEqual([]);
      const kind = parsed.model.elementKinds[0];
      expect(kind.nodePresentation).toBeDefined();
      expect(kind.identity).toBe('perspective');
      expect(kind.contract).toBe('optional');
    });

    it('accepts element kind without nodePresentation', async () => {
      const root = await createModelRoot({ 'metamodel/k.md': '---\nentity: element-kind\nidentity: k\ncontract: optional\n---\n' });
      const parsed = await parseSemanticModel(root);
      expect(parsed.diagnostics).toEqual([]);
      expect(parsed.model.elementKinds[0].nodePresentation).toBeUndefined();
    });
  });
});