import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { projectContractLinks } from '../../src/core/contract-links.js';
import { parseSemanticModelFiles } from '../../src/core/model/parser.js';
import { elementUnit, minimalModel } from '../helpers/model-fixture.js';

function model() {
  const fixture = minimalModel({ elements: [
    { identity: 'analysis', parent: 'root', title: 'Analysis', definition: 'Analysis', sections: '## Specification\n\n### Section: First\nRead [evidence](research/case.md#时间依据) and [external](https://example.com).\n\n### Section: Second\nRead [same][ref].\n\n[ref]: research/case.md\n\n`[code](missing.md)`' },
    { identity: 'evidence.id', parent: 'root', title: 'Evidence', definition: 'Evidence', sections: '## Specification\n\n### Section: Result\nEvidence SHALL exist.' },
    { identity: 'other.id', parent: 'root', sections: '## Specification\n\n### Section: Result\nOther SHALL exist.' },
  ] });
  return parseSemanticModelFiles(fixture.elements!.map(e => ['elements/'+e.identity+'.md', elementUnit(e)] as const)).model;
}

describe('Contract link projection', () => {
  it('resolves link occurrences by source unit and declared identity without modifying Markdown', () => {
    const target = model();
    const original = JSON.stringify(target);
    const source = path.resolve('demo', 'elements', 'analysis.md');
    const paths = new Map([[path.resolve('demo', 'elements', 'research', 'case.md'), 'evidence.id']]);
    const result = projectContractLinks(target, () => source, paths);
    expect(result.analysis).toEqual([
      { href: 'research/case.md#时间依据', element: 'evidence.id', fragment: '时间依据' },
      { href: 'https://example.com', external: true },
      { href: 'research/case.md', element: 'evidence.id' },
    ]);
    expect(JSON.stringify(target)).toBe(original);
  });

  it('keeps identical hrefs in inherited and delta Sections bound to their own origins', () => {
    const target = model();
    target.elements.find(e => e.declaration.identity === 'analysis')!.sections.forEach(s => { s.body = '[e](evidence.md)'; });
    const paths = new Map([
      [path.resolve('model', 'evidence.md'), 'evidence.id'],
      [path.resolve('change', 'evidence.md'), 'other.id'],
    ]);
    const result = projectContractLinks(target, (_id, section) => path.resolve(section === 'First' ? 'model' : 'change', 'analysis.md'), paths);
    expect(result.analysis).toEqual([{ href: 'evidence.md', element: 'evidence.id' }, { href: 'evidence.md', element: 'other.id' }]);
  });

  it('marks unknown or removed targets unresolved and handles fragments and encoded paths', () => {
    const target = model();
    target.elements.find(e => e.declaration.identity === 'analysis')!.sections = [{ name: 'Links', body: '[missing](no.md) [removed](gone.md) [local](#时间依据) [encoded](research/case%20file.md)', acceptanceCases: [] }];
    const result = projectContractLinks(target, () => path.resolve('demo', 'analysis.md'), new Map([
      [path.resolve('demo', 'gone.md'), 'removed.id'],
      [path.resolve('demo', 'research', 'case file.md'), 'evidence.id'],
    ]));
    expect(result.analysis).toEqual([
      { href: 'no.md' }, { href: 'gone.md' },
      { href: '#时间依据', element: 'analysis', fragment: '时间依据' },
      { href: 'research/case%20file.md', element: 'evidence.id' },
    ]);
  });
});
