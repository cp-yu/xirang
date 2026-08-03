import { describe, expect, it } from 'vitest';
import { parse as parseYaml } from 'yaml';
import { renderFrontmatter, splitFrontmatter } from '../../../src/core/model/frontmatter.js';

describe('splitFrontmatter', () => {
  it('separates frontmatter from body', () => {
    const result = splitFrontmatter('---\nentity: element-kind\nidentity: domain\n---\nBody line\n');
    expect(result).toEqual({
      ok: true,
      data: { entity: 'element-kind', identity: 'domain' },
      body: 'Body line\n',
    });
  });

  it('normalizes CRLF line endings', () => {
    const result = splitFrontmatter('---\r\nentity: element-kind\r\nidentity: domain\r\n---\r\nBody\r\n');
    expect(result).toEqual({ ok: true, data: { entity: 'element-kind', identity: 'domain' }, body: 'Body\n' });
  });

  it('reports MALFORMED_FRONTMATTER when the closing delimiter is missing', () => {
    const result = splitFrontmatter('---\nentity: element-kind\nidentity: domain\n');
    expect(result).toMatchObject({ ok: false, code: 'MALFORMED_FRONTMATTER' });
  });

  it('reports MALFORMED_FRONTMATTER when the opening delimiter is missing', () => {
    expect(splitFrontmatter('entity: element-kind\n')).toMatchObject({ ok: false, code: 'MALFORMED_FRONTMATTER' });
  });

  it('reports MALFORMED_FRONTMATTER for invalid YAML', () => {
    expect(splitFrontmatter('---\na: [1, 2\n---\n')).toMatchObject({ ok: false, code: 'MALFORMED_FRONTMATTER' });
  });

  it('reports MALFORMED_FRONTMATTER when the document is not a mapping', () => {
    expect(splitFrontmatter('---\n- one\n---\n')).toMatchObject({ ok: false, code: 'MALFORMED_FRONTMATTER' });
  });

  it('accepts an empty body', () => {
    expect(splitFrontmatter('---\nentity: authored-view\n---\n')).toEqual({
      ok: true,
      data: { entity: 'authored-view' },
      body: '',
    });
  });
});

describe('renderFrontmatter', () => {
  it('orders keys by entity type rather than object insertion order', () => {
    const rendered = renderFrontmatter('element-declaration', {
      definition: 'Reads source modules',
      title: 'LikeC4 Reader',
      parent: 'domain.architecture',
      kind: 'capability',
      identity: 'cap.likec4-reader',
    });
    expect(rendered).toBe([
      '---',
      'entity: element-declaration',
      'identity: cap.likec4-reader',
      'kind: capability',
      'parent: domain.architecture',
      'title: LikeC4 Reader',
      'definition: Reads source modules',
      '---',
      '',
    ].join('\n'));
  });

  it('places operation before entity for delta units', () => {
    const rendered = renderFrontmatter('element-declaration', { identity: 'a', operation: 'MODIFIED' });
    expect(rendered.split('\n').slice(1, 3)).toEqual(['operation: MODIFIED', 'entity: element-declaration']);
  });

  it('omits undefined optional fields and emits explicit null parents', () => {
    const rendered = renderFrontmatter('element-kind', { identity: 'domain', contract: 'required', root: true });
    expect(rendered).toBe('---\nentity: element-kind\nidentity: domain\ncontract: required\nroot: true\n---\n');
    expect(renderFrontmatter('element-declaration', { identity: 'a', parent: null })).toContain('parent: null\n');
  });

  it('renders list fields as block sequences and empty lists inline', () => {
    expect(renderFrontmatter('relationship-kind', { identity: 'uses', sourceKinds: ['b', 'a'], targetKinds: [] }))
      .toBe('---\nentity: relationship-kind\nidentity: uses\nsourceKinds:\n  - b\n  - a\ntargetKinds: []\n---\n');
  });

  it('quotes scalars that are unsafe as plain YAML', () => {
    const values: Record<string, string> = {
      star: '*',
      colon: 'a: b',
      hash: 'a #b',
      multiline: 'line one\nline two',
      quoted: 'he said "hi"',
      numeric: '42',
      boolish: 'true',
      padded: ' spaced ',
      empty: '',
      tab: 'a\tb',
    };
    for (const [, value] of Object.entries(values)) {
      const rendered = renderFrontmatter('authored-view', { identity: 'v', title: value });
      const parsed = parseYaml(rendered.slice(4, rendered.length - 4)) as Record<string, unknown>;
      expect(parsed.title).toBe(value);
    }
    expect(renderFrontmatter('authored-view', { identity: 'v', title: '*' })).toContain('title: "*"\n');
  });

  it('is a pure function of its input', () => {
    const values = { identity: 'v', include: ['b', 'a'], of: 'root' };
    expect(renderFrontmatter('authored-view', values)).toBe(renderFrontmatter('authored-view', values));
  });

  it('round-trips through splitFrontmatter', () => {
    const values = { identity: 'v', include: '*', title: 'A: title', autoLayout: 'TB' };
    const result = splitFrontmatter(renderFrontmatter('authored-view', values));
    expect(result).toEqual({ ok: true, data: { entity: 'authored-view', ...values }, body: '' });
  });

  it('renders nodePresentation as nested mapping', () => {
    const rendered = renderFrontmatter('element-kind', {
      identity: 'perspective',
      contract: 'optional',
      nodePresentation: { shape: 'document', color: 'indigo', border: 'solid' },
    });
    expect(rendered).toContain('nodePresentation:');
    expect(rendered).toContain('  shape: document');
    expect(rendered).toContain('  color: indigo');
    expect(rendered).toContain('  border: solid');
  });

  it('renders partial nodePresentation', () => {
    const rendered = renderFrontmatter('element-kind', {
      identity: 'perspective',
      contract: 'optional',
      nodePresentation: { shape: 'document' },
    });
    expect(rendered).toContain('nodePresentation:');
    expect(rendered).toContain('  shape: document');
    expect(rendered).not.toContain('color:');
    expect(rendered).not.toContain('border:');
  });

  it('omits nodePresentation entirely when absent', () => {
    const rendered = renderFrontmatter('element-kind', { identity: 'k', contract: 'optional' });
    expect(rendered).not.toContain('nodePresentation');
  });

  it('round-trips nodePresentation through splitFrontmatter', () => {
    const values = { identity: 'perspective', contract: 'optional', nodePresentation: { shape: 'document', color: 'indigo', border: 'solid' } };
    const result = splitFrontmatter(renderFrontmatter('element-kind', values));
    expect(result).toEqual({ ok: true, data: { entity: 'element-kind', ...values }, body: '' });
  });
});