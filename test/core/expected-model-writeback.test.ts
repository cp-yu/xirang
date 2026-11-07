import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { writebackExpectedModel } from '../../src/core/expected-model-writeback.js';
import { compileChangeDelta } from '../../src/core/change-compiler.js';
import { serializeSemanticModel, serializeElementUnit } from '../../src/core/model/serializer.js';
import { elementUnit, minimalModel, writeChangeDelta, writeProjectModel } from '../helpers/model-fixture.js';
import type { ModelElement } from '../../src/core/model/types.js';

const section = (name: string, body: string) => ({ name, body, acceptanceCases: [] });

describe('Expected Model text writeback', () => {
  let root: string;
  let source: string;
  let original: string;
  const relative = path.join('elements', 'custom-name.md');
  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-writeback-'));
    await writeProjectModel(root, minimalModel({ elements: [{ identity: 'item', sections:
      '## Specification\n\n### Section: Existing\n\nItem SHALL keep old text.\n\n### Section: Context\n\nItem SHALL keep context.' }] }));
    original = elementUnit({ identity: 'item', sections: '## MODIFIED Sections\n\n### Section: Existing\n\nItem SHALL have planned text.' });
    const directory = await writeChangeDelta(root, 'demo', {
      'elements/custom-name.md': original,
      'elements/other.md': '---\nentity: element-declaration\nidentity: other\nkind: capability\nparent: root\ntitle: Other\ndefinition: Other definition.\noperation: ADDED\n---\n',
    });
    await fs.writeFile(path.join(directory, 'proposal.md'), '# Change: Demo\n');
    source = path.join(directory, relative);
  });
  afterEach(async () => { await fs.rm(root, { recursive: true, force: true }); });

  async function expected(): Promise<ModelElement> {
    const result = await compileChangeDelta(root, 'demo');
    expect(result.compiled.valid).toBe(true);
    return structuredClone(result.compiled.target!.elements.find(item => item.declaration.identity === 'item')!);
  }

  it('saves Definition and visible context edits, ignores structural fields and preserves other sources and Formal model', async () => {
    const formal = await fs.readFile(path.join(root, '.xirang', 'model', 'elements', 'item.md'), 'utf8');
    const otherPath = path.join(path.dirname(source), 'other.md');
    const other = await fs.readFile(otherPath, 'utf8');
    const target = await expected();
    target.declaration.definition = 'Adjusted definition.';
    target.declaration.identity = 'ignored-identity';
    target.declaration.parent = 'missing-parent';
    target.sections[1].body = 'Item SHALL adjust previously unchanged context.';
    const result = await writebackExpectedModel(root, 'demo', relative, serializeElementUnit(target));
    expect(result).toEqual({ changed: true, ignoredChanges: ['identity', 'parent'] });
    const actual = await expected();
    expect(actual.declaration).toMatchObject({ identity: 'item', parent: 'root', definition: 'Adjusted definition.' });
    expect(actual.sections[1].body).toBe(target.sections[1].body);
    expect((await compileChangeDelta(root, 'demo')).delta.entries).toEqual(expect.arrayContaining([
      expect.objectContaining({ entity: 'element-declaration', identity: 'item', operation: 'MODIFIED' }),
      expect.objectContaining({ identity: 'item#Existing', operation: 'MODIFIED' }),
      expect.objectContaining({ identity: 'item#Context', operation: 'MODIFIED' }),
    ]));
    expect(await fs.readFile(otherPath, 'utf8')).toBe(other);
    expect(await fs.readFile(path.join(root, '.xirang', 'model', 'elements', 'item.md'), 'utf8')).toBe(formal);
  });

  it('derives Section removal, rename, addition and partial text deletion against Formal model', async () => {
    const target = await expected();
    target.sections = [section('Renamed', 'Item SHALL have planned text.'), section('New', 'Item SHALL add behavior.')];
    await writebackExpectedModel(root, 'demo', relative, serializeElementUnit(target));
    let result = await compileChangeDelta(root, 'demo');
    expect(result.delta.entries.filter(entry => entry.entity === 'section').map(({ identity, operation }) => ({ identity, operation }))).toEqual([
      { identity: 'item#Renamed', operation: 'ADDED' }, { identity: 'item#New', operation: 'ADDED' },
      { identity: 'item#Existing', operation: 'REMOVED' }, { identity: 'item#Context', operation: 'REMOVED' },
    ]);
    const next = await expected();
    next.sections[0].body = 'Item SHALL have text.';
    await writebackExpectedModel(root, 'demo', relative, serializeElementUnit(next));
    result = await compileChangeDelta(root, 'demo');
    expect(result.delta.entries.find(entry => entry.identity === 'item#Renamed')).toMatchObject({ operation: 'ADDED', target: next.sections[0] });
    next.sections = [section('Existing', 'Item SHALL keep text.'), section('Context', 'Item SHALL keep context.')];
    await writebackExpectedModel(root, 'demo', relative, serializeElementUnit(next));
    expect((await compileChangeDelta(root, 'demo')).delta.entries.filter(entry => entry.entity === 'section'))
      .toEqual([expect.objectContaining({ identity: 'item#Existing', operation: 'MODIFIED' })]);
  });

  it('drops cancelled new Sections and no-op Entries while retaining the source for further edits', async () => {
    const target = await expected();
    target.sections.push(section('Temporary', 'Item SHALL add a draft.'));
    await writebackExpectedModel(root, 'demo', relative, serializeElementUnit(target));
    target.sections.pop();
    target.sections[0].body = 'Item SHALL keep old text.';
    await writebackExpectedModel(root, 'demo', relative, serializeElementUnit(target));
    const result = await compileChangeDelta(root, 'demo');
    expect(result.delta.entries.filter(entry => entry.identity.startsWith('item'))).toEqual([]);
    expect(result.sources.some(item => item.path === 'elements/custom-name.md')).toBe(true);
  });

  it('preserves added Declaration operation and cancels a newly added Section without a REMOVED entry', async () => {
    const result = await compileChangeDelta(root, 'demo');
    const target = structuredClone(result.compiled.target!.elements.find(item => item.declaration.identity === 'other')!);
    target.declaration.definition = 'Adjusted new element.';
    target.sections = [section('New', 'Other SHALL work.')];
    await writebackExpectedModel(root, 'demo', path.join('elements', 'other.md'), serializeElementUnit(target));
    target.sections = [];
    await writebackExpectedModel(root, 'demo', path.join('elements', 'other.md'), serializeElementUnit(target));
    expect((await compileChangeDelta(root, 'demo')).delta.entries.filter(entry => entry.identity.startsWith('other')))
      .toEqual([expect.objectContaining({ entity: 'element-declaration', operation: 'ADDED', target: target.declaration })]);
  });

  it('last successful save replaces supported text and unsupported-only save leaves bytes unchanged', async () => {
    const first = await expected();
    const second = structuredClone(first);
    first.declaration.definition = 'First saved text.';
    second.declaration.definition = 'Last saved text.';
    await writebackExpectedModel(root, 'demo', relative, serializeElementUnit(first));
    await writebackExpectedModel(root, 'demo', relative, serializeElementUnit(second));
    expect((await expected()).declaration.definition).toBe('Last saved text.');
    const before = await fs.readFile(source, 'utf8');
    second.declaration.kind = 'unknown-kind';
    second.declaration.title = 'Ignored title';
    expect(await writebackExpectedModel(root, 'demo', relative, serializeElementUnit(second)))
      .toEqual({ changed: false, ignoredChanges: ['kind', 'title'] });
    expect(await fs.readFile(source, 'utf8')).toBe(before);
  });

  it('rejects malformed or invalid supported text without changing the Delta', async () => {
    await expect(writebackExpectedModel(root, 'demo', relative, 'malformed')).rejects.toMatchObject({ code: 'INVALID_INPUT' });
    const target = await expected();
    target.declaration.definition = '';
    await expect(writebackExpectedModel(root, 'demo', relative, serializeElementUnit(target))).rejects.toMatchObject({ code: 'INVALID_INPUT' });
    target.declaration.definition = 'Valid definition.';
    target.sections[0].body = 'Missing normative keyword.';
    await expect(writebackExpectedModel(root, 'demo', relative, serializeElementUnit(target))).rejects.toMatchObject({ code: 'INVALID_TARGET' });
    expect(await fs.readFile(source, 'utf8')).toBe(original);
  });

  it.each(['```', '~~~~'])('preserves complete fenced Markdown examples through %s writeback and recompilation', async fence => {
    const target = await expected();
    target.sections[0].body = `Item SHALL preserve Markdown examples.\n\n${fence}markdown\n## Example heading\n### Section: Example section\n#### Acceptance Case: Example case\nExample content\n${fence}\n\nText after the fence.`;
    target.sections[0].acceptanceCases = [{ name: 'actual-case', body: `**WHEN** saved **THEN** complete.\n\n${fence}markdown\n## ADDED Sections\n### Section: Example\n${fence}` }];
    const result = await writebackExpectedModel(root, 'demo', relative, serializeElementUnit(target));
    expect(result).toEqual({ changed: true, ignoredChanges: [] });
    expect((await expected()).sections).toEqual(target.sections);
  });

  it('preserves unaffected entries in another source for the same Element', async () => {
    const external = elementUnit({ identity: 'item', sections: '## MODIFIED Sections\n\n### Section: Context\n\nItem SHALL keep externally planned context.' });
    const externalPath = path.join(path.dirname(source), 'second.md');
    await fs.writeFile(externalPath, external);
    const target = await expected();
    target.declaration.definition = 'Adjusted definition.';
    await writebackExpectedModel(root, 'demo', relative, serializeElementUnit(target));
    expect((await expected()).declaration.definition).toBe('Adjusted definition.');
    expect((await expected()).sections).toEqual(target.sections);
    expect(await fs.readFile(externalPath, 'utf8')).toBe(external);
    expect(await fs.readFile(source, 'utf8')).not.toContain('### Section: Context');
    target.sections[0].body = 'Item SHALL save locally edited behavior.';
    await writebackExpectedModel(root, 'demo', relative, serializeElementUnit(target));
    expect((await expected()).sections).toEqual(target.sections);
    expect(await fs.readFile(externalPath, 'utf8')).toBe(external);
  });

  it('preserves an unaffected Declaration Entry owned by another source', async () => {
    const external = elementUnit({ identity: 'item', title: 'Planned title' }).replace('entity: element-declaration', 'operation: MODIFIED\nentity: element-declaration');
    const externalPath = path.join(path.dirname(source), 'second.md');
    await fs.writeFile(externalPath, external);
    const target = await expected();
    target.sections[0].body = 'Item SHALL save locally edited behavior.';
    await writebackExpectedModel(root, 'demo', relative, serializeElementUnit(target));
    expect((await expected()).declaration.title).toBe('Planned title');
    expect((await expected()).sections).toEqual(target.sections);
    expect(await fs.readFile(externalPath, 'utf8')).toBe(external);
    expect(await fs.readFile(source, 'utf8')).not.toMatch(/^operation:/m);
  });

  it('stores Acceptance Case edits inside the host Section and treats case deletion as Section modification', async () => {
    const target = await expected();
    target.sections[0].acceptanceCases = [{ name: 'saved-case', body: '**WHEN** saved **THEN** visible.' }];
    await writebackExpectedModel(root, 'demo', relative, serializeElementUnit(target));
    expect((await expected()).sections[0].acceptanceCases).toEqual(target.sections[0].acceptanceCases);
    target.sections[0].acceptanceCases = [];
    await writebackExpectedModel(root, 'demo', relative, serializeElementUnit(target));
    expect((await compileChangeDelta(root, 'demo')).delta.entries.find(entry => entry.identity === 'item#Existing'))
      .toMatchObject({ operation: 'MODIFIED', target: { acceptanceCases: [] } });
  });

  it('keeps unsupported Declaration changes already present in the Expected model', async () => {
    await fs.writeFile(source, original.replace('entity: element-declaration', 'operation: MODIFIED\nentity: element-declaration')
      .replace('title: "item"', 'title: "Planned title"'));
    const target = await expected();
    target.declaration.title = 'Ignored new title';
    target.declaration.definition = 'Adjusted definition.';
    await writebackExpectedModel(root, 'demo', relative, serializeElementUnit(target));
    expect((await expected()).declaration).toMatchObject({ title: 'Planned title', definition: 'Adjusted definition.' });
  });

  it('ignores edits to non-Element entities and retains their existing Delta bytes', async () => {
    const directory = path.dirname(path.dirname(source));
    const files = {
      'metamodel/custom-kind.md': '---\nentity: element-kind\nidentity: capability\noperation: MODIFIED\ncontract: optional\n---\nPlanned kind semantics.\n',
      'metamodel/custom-relationship.md': '---\nentity: relationship-kind\nidentity: uses\noperation: ADDED\n---\n',
      'relationships/custom.yaml': 'relationships:\n  - source: root\n    kind: uses\n    target: item\n    operation: ADDED\n',
      'views/custom-view.md': '---\nentity: authored-view\nidentity: selected\ninclude: "*"\noperation: ADDED\n---\n',
    };
    await writeChangeDelta(root, 'demo', files);
    const compiled = await compileChangeDelta(root, 'demo');
    expect(compiled.compiled.valid).toBe(true);
    const projection = serializeSemanticModel(compiled.compiled.target!);
    for (const [relativePath, projectedPath] of [
      ['metamodel/custom-kind.md', 'metamodel/capability.md'],
      ['metamodel/custom-relationship.md', 'metamodel/uses.md'],
      ['relationships/custom.yaml', 'relationships/uses.yaml'],
      ['views/custom-view.md', 'views/selected.md'],
    ]) {
      const text = projection.get(projectedPath)!.toString('utf8');
      expect(await writebackExpectedModel(root, 'demo', relativePath, text)).toEqual({ changed: false, ignoredChanges: [] });
      expect(await writebackExpectedModel(root, 'demo', relativePath, `${text}ignored edit`))
        .toEqual({ changed: false, ignoredChanges: ['content'] });
      expect(await fs.readFile(path.join(directory, relativePath), 'utf8')).toBe(files[relativePath as keyof typeof files]);
    }
  });

  it('keeps original bytes and cleans temporary files when replacement fails', async () => {
    const target = await expected();
    target.declaration.definition = 'Adjusted definition.';
    await expect(writebackExpectedModel(root, 'demo', relative, serializeElementUnit(target), async () => { throw new Error('write failure'); }))
      .rejects.toThrow('write failure');
    expect(await fs.readFile(source, 'utf8')).toBe(original);
    expect((await fs.readdir(path.dirname(source))).sort()).toEqual(['custom-name.md', 'other.md']);
  });

  it('rejects escaping, unrelated files and symlink source paths', async () => {
    const target = serializeElementUnit(await expected());
    await expect(writebackExpectedModel(root, 'demo', path.join('..', '..', 'model', 'elements', 'item.md'), target))
      .rejects.toMatchObject({ code: 'INVALID_SOURCE' });
    const plan = path.join(path.dirname(path.dirname(source)), 'proposal.md');
    await fs.writeFile(plan, 'plan');
    await expect(writebackExpectedModel(root, 'demo', 'proposal.md', target)).rejects.toMatchObject({ code: 'INVALID_SOURCE' });
    const link = path.join(path.dirname(source), 'link.md');
    try { await fs.symlink(source, link); }
    catch (error) { if (process.platform === 'win32' && (error as NodeJS.ErrnoException).code === 'EPERM') return; throw error; }
    await expect(writebackExpectedModel(root, 'demo', path.join('elements', 'link.md'), target)).rejects.toMatchObject({ code: 'INVALID_SOURCE' });
  });
});
