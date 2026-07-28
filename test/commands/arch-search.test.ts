import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { formatArchitectureSearchText, searchArchitecture } from '../../src/commands/arch/search.js';
import { minimalModel, writeProjectModel } from '../helpers/model-fixture.js';

const LONG_DEFINITION = `First paragraph ${'界'.repeat(130)}.\n\nSecond paragraph contains UnicodeNeedle.`;

describe('architecture search', () => {
  let root: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-arch-search-'));
    await writeProjectModel(root, minimalModel({
      elements: [
        {
          identity: 'cap.impact',
          title: 'Impact Sweeper',
          definition: 'Collects architecture context across the full project boundary.',
          requirements: [
            '## Requirements',
            '',
            '### Requirement: Impact behavior',
            'The system SHALL behave.',
            '',
            '```md',
            '### Requirement: FencedOnlyToken',
            'Example only.',
            '```',
            '',
            '#### Scenario: Existing behavior',
            '- **WHEN** invoked',
            '- **THEN** behavior is preserved',
          ].join('\n'),
        },
        { identity: 'cap.exact', title: 'Exact Candidate', definition: 'Exact identity candidate definition.' },
        { identity: 'cap.definition-only', title: 'Definition Candidate', definition: 'Contains cap.exact in the full Definition.' },
        { identity: 'cap.alpha', title: 'Match Alpha', definition: 'First stable match definition.' },
        { identity: 'cap.zeta', title: 'Match Zeta', definition: 'Second stable match definition.' },
        {
          identity: 'cap.long',
          title: 'Long Definition',
          definition: LONG_DEFINITION,
        },
      ],
    }));
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it('returns one element with declaration and Contract match evidence', async () => {
    const result = await searchArchitecture(root, 'Impact');

    expect(result.query).toBe('Impact');
    expect(result.matches).toHaveLength(1);
    expect(result.matches[0].element).toEqual({
      identity: 'cap.impact',
      kind: 'capability',
      parent: 'root',
      title: 'Impact Sweeper',
      definition: 'Collects architecture context across the full project boundary.',
    });
    expect(result.matches[0]).not.toHaveProperty('ownedSpecs');
    expect(result.matches[0].evidence).toEqual(expect.arrayContaining([
      { field: 'title', text: 'Impact Sweeper' },
      { field: 'requirement', text: 'Impact behavior' },
    ]));
    expect(result.matches[0].evidence.map(item => item.field))
      .not.toEqual(expect.arrayContaining(['summary', 'fqn', 'specId', 'spec.purpose', 'spec.requirement']));
    expect(result.diagnostics).toEqual([]);
  });

  it('sorts by strongest match then stable identity and applies limit afterward', async () => {
    const exact = await searchArchitecture(root, 'cap.exact', { limit: 1 });
    expect(exact.matches.map(match => match.element.identity)).toEqual(['cap.exact']);
    expect(exact.totalMatches).toBe(2);
    expect(exact.matches[0].evidence[0]).toEqual({ field: 'elementId', text: 'cap.exact' });

    const stable = await searchArchitecture(root, 'Match', { limit: 1 });
    expect(stable.matches.map(match => match.element.identity)).toEqual(['cap.alpha']);
    expect(stable.totalMatches).toBe(2);
  });

  it('searches and returns the complete Definition without Browser truncation', async () => {
    const result = await searchArchitecture(root, 'UnicodeNeedle');

    expect(result.matches).toHaveLength(1);
    expect(result.matches[0].evidence).toEqual([{
      field: 'definition',
      text: LONG_DEFINITION,
    }]);
    expect(result.matches[0].evidence[0].text).not.toContain('...');
  });

  it('always includes the complete Definition in text for non-Definition matches', async () => {
    const cases = [
      { result: await searchArchitecture(root, 'cap.exact'), definition: 'Exact identity candidate definition.' },
      { result: await searchArchitecture(root, 'Long Definition'), definition: LONG_DEFINITION },
      { result: await searchArchitecture(root, 'Impact behavior'), definition: 'Collects architecture context across the full project boundary.' },
    ];

    for (const { result, definition } of cases) {
      const text = formatArchitectureSearchText(result);
      expect(text).toContain(`Definition: ${definition}`);
    }
    expect(formatArchitectureSearchText(cases[1].result)).not.toContain('...');
  });

  it('returns identical matches and ordering across process locale settings', async () => {
    const originalLang = process.env.LANG;
    try {
      const results = [];
      for (const locale of ['en_US.UTF-8', 'tr_TR.UTF-8', 'sv_SE.UTF-8']) {
        process.env.LANG = locale;
        results.push(await searchArchitecture(root, 'impact sweeper'));
      }

      expect(results[1]).toEqual(results[0]);
      expect(results[2]).toEqual(results[0]);
      expect(results[0].matches.map(match => match.element.identity)).toEqual(['cap.impact']);
      expect(results[0].matches[0].evidence[0]).toEqual({ field: 'title', text: 'Impact Sweeper' });
    } finally {
      if (originalLang === undefined) delete process.env.LANG;
      else process.env.LANG = originalLang;
    }
  });

  it('returns empty matches without semantic inference', async () => {
    const result = await searchArchitecture(root, 'scanner');

    expect(result).toMatchObject({ query: 'scanner', matches: [], totalMatches: 0, diagnostics: [] });
    expect(await searchArchitecture(root, 'FencedOnlyToken')).toMatchObject({ matches: [], totalMatches: 0 });
  });

  it('reads only the Formal Semantic Model without changing the project', async () => {
    const changeDir = path.join(root, '.xirang', 'changes', 'active', 'elements');
    await fs.mkdir(changeDir, { recursive: true });
    await fs.writeFile(path.join(changeDir, 'cap.impact.md'),
      `---\noperation: MODIFIED\nentity: element-declaration\nidentity: cap.impact\n---\n\n## ADDED Requirements\n\n### Requirement: ChangeOnlyToken\nIt SHALL hold.\n`);
    const sourceDir = path.join(root, 'src');
    await fs.mkdir(sourceDir, { recursive: true });
    await fs.writeFile(path.join(sourceDir, 'code.ts'), 'export const CodeOnlyToken = true;\n');
    const before = await fs.readdir(root, { recursive: true });

    expect((await searchArchitecture(root, 'ChangeOnlyToken')).matches).toEqual([]);
    expect((await searchArchitecture(root, 'CodeOnlyToken')).matches).toEqual([]);
    expect(await fs.readdir(root, { recursive: true })).toEqual(before);
  });
});
