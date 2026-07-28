import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { runCLI } from '../helpers/run-cli.js';
import { minimalModel, writeChangeDelta, writeProjectModel } from '../helpers/model-fixture.js';

const ALPHA_CONTRACT = [
  '## Requirements',
  '',
  '### Requirement: Alpha module SHALL produce deterministic output',
  'The alpha module SHALL produce a deterministic response for validation.',
  '',
  '#### Scenario: Deterministic alpha run',
  '- **GIVEN** a configured alpha module',
  '- **WHEN** the module runs the default flow',
  '- **THEN** the output matches the expected fixture result',
].join('\n');

const ALPHA_DELTA = [
  '---',
  'operation: MODIFIED',
  'entity: element-declaration',
  'identity: alpha.id',
  'kind: capability',
  'parent: root',
  'title: Alpha',
  'definition: Alpha summary',
  '---',
  '',
  '## ADDED Requirements',
  '### Requirement: Validator SHALL support alpha change deltas',
  'The validator SHALL accept deltas provided by the test harness.',
  '',
  '#### Scenario: Apply alpha delta',
  '- **GIVEN** the test change delta',
  '- **WHEN** xirang validate runs',
  '- **THEN** the validator reports the change as valid',
  '',
].join('\n');

describe('top-level validate command', () => {
  const projectRoot = process.cwd();
  const testDir = path.join(projectRoot, 'test-validate-command-tmp');
  const changesDir = path.join(testDir, '.xirang', 'changes');

  beforeEach(async () => {
    await fs.mkdir(changesDir, { recursive: true });
    await writeProjectModel(testDir, minimalModel({
      elements: [{ identity: 'alpha.id', parent: 'root', title: 'Alpha', definition: 'Alpha summary', requirements: ALPHA_CONTRACT }],
    }));

    const changeContent = `# Test Change\n\n## Why\nBecause reasons that are sufficiently long for validation.\n\n## What Changes\n- **alpha:** Add something`;
    await fs.mkdir(path.join(changesDir, 'c1'), { recursive: true });
    await fs.writeFile(path.join(changesDir, 'c1', 'proposal.md'), changeContent, 'utf-8');
    await writeChangeDelta(testDir, 'c1', { 'elements/alpha.id.md': ALPHA_DELTA });

    // A change whose name collides with an Element identity, for the ambiguity test.
    await fs.mkdir(path.join(changesDir, 'alpha.id'), { recursive: true });
    await fs.writeFile(path.join(changesDir, 'alpha.id', 'proposal.md'), changeContent, 'utf-8');
    await writeChangeDelta(testDir, 'alpha.id', { 'elements/alpha.id.md': ALPHA_DELTA });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('prints a helpful hint when no args in non-interactive mode', async () => {
    const result = await runCLI(['validate'], { cwd: testDir });
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Nothing to validate. Try one of:');
  });

  it('validates explicit --change with the same semantics as the positional form', async () => {
    const positional = await runCLI(['validate', 'c1', '--type', 'change', '--json'], { cwd: testDir });
    const explicit = await runCLI(['validate', '--change', 'c1', '--json'], { cwd: testDir });

    expect(explicit.exitCode).toBe(positional.exitCode);
    const positionalJson = JSON.parse(positional.stdout.trim());
    const explicitJson = JSON.parse(explicit.stdout.trim());
    expect(explicitJson.items[0]).toMatchObject({ id: 'c1', type: 'change', valid: true });
    expect(explicitJson.items[0].issues).toEqual(positionalJson.items[0].issues);
  });

  it('accepts removing an Element together with its complete Contract', async () => {
    await writeChangeDelta(testDir, 'c1', {
      'elements/alpha.id.md': '---\noperation: REMOVED\nentity: element-declaration\nidentity: alpha.id\n---\n',
    });

    const result = await runCLI(['validate', '--change', 'c1', '--json'], { cwd: testDir });

    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout).items[0]).toMatchObject({ id: 'c1', type: 'change', valid: true });
  });

  it('shows a concise effective preview without partitions and without writing the artifact', async () => {
    const human = await runCLI(['validate', '--change', 'c1'], { cwd: testDir });
    const jsonResult = await runCLI(['validate', '--change', 'c1', '--json'], { cwd: testDir });

    expect(human.exitCode).toBe(0);
    expect(human.stdout).toContain('Effective change preview');
    expect(human.stdout).toContain('Semantic Delta');
    expect(human.stdout).not.toMatch(/^Specs$/m);
    expect(jsonResult.exitCode).toBe(0);
    const json = JSON.parse(jsonResult.stdout);
    expect(json.items[0].summary).toBeDefined();
    expect(json.items[0].entries).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'requirement', operation: 'ADDED' }),
    ]));
    expect(json.items[0].entries[0]).not.toHaveProperty('before');
    expect(json.items[0].entries[0]).not.toHaveProperty('scope');
    await expect(fs.access(path.join(changesDir, 'c1', 'effective-change.md'))).rejects.toThrow();
  });

  it('no longer accepts the removed --artifacts option', async () => {
    const result = await runCLI(['validate', '--change', 'c1', '--artifacts', 'specs'], { cwd: testDir });

    expect(result.exitCode).toBe(1);
    expect(`${result.stdout}\n${result.stderr}`).toContain("unknown option '--artifacts'");
  });

  it('directs invalid changes to structured validation output without referencing diff', async () => {
    await writeChangeDelta(testDir, 'c1', {
      'elements/alpha.id.md': ALPHA_DELTA.replace('The validator SHALL accept deltas provided by the test harness.', 'No normative keyword here.'),
    });

    const result = await runCLI(['validate', '--change', 'c1'], { cwd: testDir });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('xirang validate --change <id> --json');
    expect(result.stderr).not.toContain('xirang diff');
  });

  it('rejects missing explicit changes deterministically', async () => {
    const result = await runCLI(['validate', '--change', 'missing-change'], { cwd: testDir });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Unknown change 'missing-change'");
  });

  it('validates all with --all and outputs JSON summary', async () => {
    const result = await runCLI(['validate', '--all', '--json'], { cwd: testDir });
    expect(result.exitCode).toBe(0);
    const json = JSON.parse(result.stdout.trim());
    expect(Array.isArray(json.items)).toBe(true);
    expect(json.summary?.totals?.items).toBeDefined();
    expect(json.version).toBe('1.0');
  });

  it('validates Element Contracts with --specs and respects --concurrency', async () => {
    const result = await runCLI(['validate', '--specs', '--json', '--concurrency', '1'], { cwd: testDir });
    expect(result.exitCode).toBe(0);
    const json = JSON.parse(result.stdout.trim());
    expect(json.items.map((item: { id: string }) => item.id)).toEqual(['alpha.id']);
    expect(json.items.every((item: { type: string }) => item.type === 'spec')).toBe(true);
  });

  it('errors on ambiguous item names and suggests type override', async () => {
    const result = await runCLI(['validate', 'alpha.id'], { cwd: testDir });
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Ambiguous item');
  });

  it('does not register the removed scenario-labels command', async () => {
    const result = await runCLI(['scenario-labels', 'c1', '--preview'], { cwd: testDir });

    expect(result.exitCode).not.toBe(0);
    expect(`${result.stdout}\n${result.stderr}`).toContain("unknown command 'scenario-labels'");
  });

  it.each(['ADDED', 'MODIFIED', 'REMOVED', 'UPDATED'])('rejects [%s] Scenario metadata', async prefix => {
    await writeChangeDelta(testDir, 'c1', {
      'elements/alpha.id.md': ALPHA_DELTA.replace('#### Scenario: Apply alpha delta', `#### Scenario: [${prefix}] Apply alpha delta`),
    });

    const result = await runCLI(['validate', '--change', 'c1', '--json'], { cwd: testDir });

    expect(result.exitCode).toBe(1);
    expect(`${result.stdout}\n${result.stderr}`).toContain(`Unsupported Scenario operation metadata [${prefix}]`);
  });

  it('rejects RENAMED Requirements with REMOVED plus ADDED guidance', async () => {
    await writeChangeDelta(testDir, 'c1', {
      'elements/alpha.id.md': [
        '---', 'operation: MODIFIED', 'entity: element-declaration', 'identity: alpha.id',
        'kind: capability', 'parent: root', 'title: Alpha', 'definition: Alpha summary', '---', '',
        '## RENAMED Requirements', '',
        'FROM: ### Requirement: Alpha module SHALL produce deterministic output',
        'TO: ### Requirement: Alpha module SHALL produce renamed output',
        '',
      ].join('\n'),
    });

    const result = await runCLI(['validate', '--change', 'c1', '--json'], { cwd: testDir });

    expect(result.exitCode).toBe(1);
    const output = `${result.stdout}\n${result.stderr}`;
    expect(output).toContain('RENAMED Requirements is unsupported');
    expect(output).toContain('REMOVED old Requirement plus ADDED new Requirement');
  });

  it('reports notation issues at the actual Element unit path', async () => {
    await writeChangeDelta(testDir, 'c1', {
      'elements/alpha.id.md': ALPHA_DELTA.replace('The validator SHALL accept deltas provided by the test harness.', 'No normative keyword here.'),
    });

    const result = await runCLI(['validate', '--change', 'c1', '--json'], { cwd: testDir });

    expect(result.exitCode).toBe(1);
    const issues = JSON.parse(result.stdout).items[0].issues as Array<{ path: string }>;
    expect(issues.some(issue => issue.path === 'elements/alpha.id.md')).toBe(true);
    expect(issues.every(issue => issue.path !== 'architecture-delta.c4')).toBe(true);
  });

  it('accepts change proposals saved with CRLF line endings', async () => {
    const changeId = 'crlf-change';
    const toCrlf = (segments: string[]) => segments.join('\n').replace(/\n/g, '\r\n');

    await fs.mkdir(path.join(changesDir, changeId), { recursive: true });
    await fs.writeFile(path.join(changesDir, changeId, 'proposal.md'), toCrlf([
      '# CRLF Proposal',
      '',
      '## Why',
      'This change verifies validation works with Windows line endings.',
      '',
      '## What Changes',
      '- **alpha:** Ensure validation passes on CRLF files',
    ]), 'utf-8');
    await writeChangeDelta(testDir, changeId, { 'elements/alpha.id.md': ALPHA_DELTA.replace(/\n/g, '\r\n') });

    const result = await runCLI(['validate', changeId], { cwd: testDir });
    expect(result.exitCode).toBe(0);
  });

  it('respects --no-interactive flag passed via CLI', async () => {
    const result = await runCLI(['validate', '--specs', '--no-interactive'], {
      cwd: testDir,
      env: { ...process.env, XIRANG_INTERACTIVE: undefined },
    });
    expect(result.exitCode).toBe(0);
    expect(result.stderr).not.toContain('What would you like to validate?');
  });
});
