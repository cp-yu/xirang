import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { searchArchitecture } from '../../src/commands/arch/search.js';

const specification = `xirang { languageVersion '1' }
specification {
  element project { xirang { root true contract required children [capability] } }
  element capability { xirang { contract optional parents [project] } }
  relationship invokes
}`;

const model = `model {
  project_root = project 'Project' 'Project intent' {
    metadata { elementId 'project.root' }
    impact = capability 'Impact Sweeper' 'Collects architecture context' {
      metadata { elementId 'cap.impact' }
    }
    exact = capability 'Exact Candidate' 'Exact identity candidate' {
      metadata { elementId 'cap.exact' }
    }
    summaryOnly = capability 'Summary Candidate' 'Contains cap.exact in summary' {
      metadata { elementId 'cap.summary-only' }
    }
    alpha = capability 'Match Alpha' 'First stable match' {
      metadata { elementId 'cap.alpha' }
    }
    zeta = capability 'Match Zeta' 'Second stable match' {
      metadata { elementId 'cap.zeta' }
    }
  }
}`;

function contract(elementId: string, purpose: string, requirement: string): string {
  return `---\nelement: ${elementId}\n---\n\n# Contract\n\n## Purpose\n${purpose}\n\n## Requirements\n\n### Requirement: ${requirement}\nThe system SHALL behave.\n\n#### Scenario: Existing behavior\n- **WHEN** invoked\n- **THEN** behavior is preserved\n`;
}

describe('architecture search', () => {
  let root: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-arch-search-'));
    const architectureDir = path.join(root, '.xirang', 'architecture');
    await fs.mkdir(architectureDir, { recursive: true });
    await fs.writeFile(path.join(architectureDir, 'specification.c4'), specification);
    await fs.writeFile(path.join(architectureDir, 'model.c4'), model);

    for (const [specId, content] of [
      ['project-contract', contract('project.root', 'Project contract.', 'Project behavior')],
      ['impact-contract', contract('cap.impact', 'Impact contract purpose.', 'Impact behavior')],
    ] as const) {
      const specDir = path.join(root, '.xirang', 'specs', specId);
      await fs.mkdir(specDir, { recursive: true });
      await fs.writeFile(path.join(specDir, 'spec.md'), content);
    }
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it('returns one element with declaration and owned Contract match evidence', async () => {
    const result = await searchArchitecture(root, 'Impact');

    expect(result.query).toBe('Impact');
    expect(result.matches).toHaveLength(1);
    expect(result.matches[0].element).toMatchObject({
      id: 'cap.impact',
      fqn: 'project_root.impact',
      title: 'Impact Sweeper',
      summary: 'Collects architecture context',
    });
    expect(result.matches[0].ownedSpecs).toEqual([
      { specId: 'impact-contract', path: '.xirang/specs/impact-contract/spec.md' },
    ]);
    expect(result.matches[0].evidence).toEqual(expect.arrayContaining([
      { field: 'title', text: 'Impact Sweeper' },
      { field: 'spec.purpose', specId: 'impact-contract', text: 'Impact contract purpose.' },
      { field: 'spec.requirement', specId: 'impact-contract', text: 'Impact behavior' },
    ]));
    expect(result.diagnostics).toEqual([]);
  });

  it('sorts by strongest match then stable elementId and applies limit afterward', async () => {
    const exact = await searchArchitecture(root, 'cap.exact', { limit: 1 });
    expect(exact.matches.map(match => match.element.id)).toEqual(['cap.exact']);
    expect(exact.totalMatches).toBe(2);
    expect(exact.matches[0].evidence[0]).toEqual({ field: 'elementId', text: 'cap.exact' });

    const stable = await searchArchitecture(root, 'Match', { limit: 1 });
    expect(stable.matches.map(match => match.element.id)).toEqual(['cap.alpha']);
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
      expect(results[0].matches.map(match => match.element.id)).toEqual(['cap.impact']);
      expect(results[0].matches[0].evidence[0]).toEqual({ field: 'title', text: 'Impact Sweeper' });
    } finally {
      if (originalLang === undefined) delete process.env.LANG;
      else process.env.LANG = originalLang;
    }
  });

  it('returns empty matches without semantic inference', async () => {
    const result = await searchArchitecture(root, 'scanner');

    expect(result).toMatchObject({ query: 'scanner', matches: [], totalMatches: 0, diagnostics: [] });
  });

  it('reads each Formal Contract once per invocation', async () => {
    const readFileSpy = vi.spyOn(fs, 'readFile');
    try {
      await searchArchitecture(root, 'Impact');
      const specReads = readFileSpy.mock.calls
        .map(([filePath]) => String(filePath))
        .filter(filePath => filePath.endsWith(`${path.sep}spec.md`));
      const counts = new Map<string, number>();
      for (const filePath of specReads) counts.set(filePath, (counts.get(filePath) ?? 0) + 1);

      expect(counts.size).toBe(2);
      expect([...counts.values()]).toEqual([1, 1]);
    } finally {
      readFileSpy.mockRestore();
    }
  });

  it('reads only Formal Architecture and Contracts without changing the project', async () => {
    const changeDir = path.join(root, '.xirang', 'changes', 'active', 'specs', 'change-only');
    await fs.mkdir(changeDir, { recursive: true });
    await fs.writeFile(path.join(changeDir, 'spec.md'), contract('cap.impact', 'ChangeOnlyToken.', 'Changed behavior'));
    const sourceDir = path.join(root, 'src');
    await fs.mkdir(sourceDir, { recursive: true });
    await fs.writeFile(path.join(sourceDir, 'code.ts'), 'export const CodeOnlyToken = true;\n');
    const before = await fs.readdir(root, { recursive: true });

    expect((await searchArchitecture(root, 'ChangeOnlyToken')).matches).toEqual([]);
    expect((await searchArchitecture(root, 'CodeOnlyToken')).matches).toEqual([]);
    expect(await fs.readdir(root, { recursive: true })).toEqual(before);
  });
});
