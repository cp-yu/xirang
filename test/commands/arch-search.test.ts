import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { searchArchitecture } from '../../src/commands/arch/search.js';
import { minimalModel, writeProjectModel } from '../helpers/model-fixture.js';

function contract(requirement: string): string {
  return `## Requirements\n\n### Requirement: ${requirement}\nThe system SHALL behave.\n\n#### Scenario: Existing behavior\n- **WHEN** invoked\n- **THEN** behavior is preserved`;
}

describe('architecture search', () => {
  let root: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-arch-search-'));
    await writeProjectModel(root, minimalModel({
      elements: [
        {
          identity: 'cap.impact',
          title: 'Impact Sweeper',
          summary: 'Collects architecture context',
          requirements: [
            '```md',
            '### Requirement: FencedOnlyToken',
            'Example only.',
            '```',
            '',
            contract('Impact behavior'),
          ].join('\n'),
        },
        { identity: 'cap.exact', title: 'Exact Candidate', summary: 'Exact identity candidate' },
        { identity: 'cap.summary-only', title: 'Summary Candidate', summary: 'Contains cap.exact in summary' },
        { identity: 'cap.alpha', title: 'Match Alpha', summary: 'First stable match' },
        { identity: 'cap.zeta', title: 'Match Zeta', summary: 'Second stable match' },
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
      summary: 'Collects architecture context',
    });
    expect(result.matches[0]).not.toHaveProperty('ownedSpecs');
    expect(result.matches[0].evidence).toEqual(expect.arrayContaining([
      { field: 'title', text: 'Impact Sweeper' },
      { field: 'requirement', text: 'Impact behavior' },
    ]));
    expect(result.matches[0].evidence.map(item => item.field))
      .not.toEqual(expect.arrayContaining(['fqn', 'specId', 'spec.purpose', 'spec.requirement']));
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
