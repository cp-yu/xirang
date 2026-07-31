import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';
import { resolveLikeC4Command } from '../../../src/commands/arch/runner.js';
import { LIKEC4_RESERVED_NAMES } from '../../../src/core/likec4/local-names.js';

const run = promisify(execFile);

/** Reserved only by the rolled-back Xirang extension; they must stay usable as plain names. */
const ROLLED_BACK_XIRANG_KEYWORDS = [
  'xirang', 'languageVersion', 'root', 'contract', 'parents', 'children',
  'sourceKinds', 'targetKinds', 'required', 'optional',
];

const grammarFile = fileURLToPath(new URL('../../../likec4/packages/language-server/src/like-c4.langium', import.meta.url));

/**
 * Guards `LIKEC4_RESERVED_NAMES` against grammar drift: every literal of the vendored grammar is
 * probed as an element name in its own file, so upstream adding or removing a keyword turns this
 * test red instead of silently producing invalid artifacts.
 */
describe('LIKEC4_RESERVED_NAMES', () => {
  it('matches the names the vendored grammar rejects', { timeout: 300_000 }, async () => {
    const grammar = await fs.readFile(grammarFile, 'utf8');
    const literals = [...new Set(grammar.match(/'[a-zA-Z][a-zA-Z0-9_]*'/g) ?? [])].map(literal => literal.slice(1, -1));
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-likec4-keywords-'));
    try {
      await fs.writeFile(path.join(dir, 'spec.c4'), 'specification {\n  element capability\n}\n');
      for (const literal of literals) {
        await fs.writeFile(
          path.join(dir, `probe_${literal}.c4`),
          `model {\n  ${literal} = capability 'T' 'S'\n}\n`,
        );
      }
      const { argv } = resolveLikeC4Command(['validate', dir]);
      const { stdout, stderr } = await run(process.execPath, argv).catch(error => error);
      const rejected = new Set(
        [...`${stdout}${stderr}`.matchAll(/probe_([A-Za-z0-9_]+)\.c4/g)].map(match => match[1]!),
      );
      expect([...rejected].sort()).toEqual([...LIKEC4_RESERVED_NAMES].sort());
      expect(ROLLED_BACK_XIRANG_KEYWORDS.filter(word => rejected.has(word) || LIKEC4_RESERVED_NAMES.has(word)))
        .toEqual([]);
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });
});
