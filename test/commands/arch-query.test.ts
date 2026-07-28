import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { formatArchitectureQueryText, queryArchitecture } from '../../src/commands/arch/query.js';
import { minimalModel, writeProjectModel } from '../helpers/model-fixture.js';
import { runCLI } from '../helpers/run-cli.js';

const DEFINITION = `First paragraph ${'界'.repeat(130)}.\n\nSecond paragraph remains complete.`;

describe('architecture query Definition', () => {
  let root: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-arch-query-'));
    await writeProjectModel(root, minimalModel({
      elements: [{ identity: 'cap.long', title: 'Long Definition', definition: DEFINITION }],
    }));
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it('returns the complete Definition in structured and text output', async () => {
    const result = await queryArchitecture(root, 'cap.long');
    const text = formatArchitectureQueryText(result);

    expect(result.element.definition).toBe(DEFINITION);
    expect(JSON.parse(JSON.stringify(result)).element.definition).toBe(DEFINITION);
    expect(text).toContain(`Definition: ${DEFINITION}`);
    expect(text).not.toContain('Summary:');
    expect(text).not.toContain('...');
  });

  it('rejects a legacy Declaration through every Agent-facing read command', async () => {
    const unitPath = path.join(root, '.xirang', 'model', 'elements', 'cap.long.md');
    const unit = await fs.readFile(unitPath, 'utf8');
    await fs.writeFile(unitPath, unit.replace('\ndefinition:', '\nsummary:'), 'utf8');

    for (const args of [
      ['arch', 'query', 'cap.long', '--json'],
      ['arch', 'search', 'Long', '--json'],
      ['arch', 'impact', 'cap.long', '--json'],
    ]) {
      const result = await runCLI(args, { cwd: root });
      expect(result.exitCode, args.join(' ')).toBe(1);
      expect(`${result.stdout}\n${result.stderr}`).toContain('LEGACY_ELEMENT_SUMMARY');
    }
  });
});
