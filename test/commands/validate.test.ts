import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { runCLI } from '../helpers/run-cli.js';

describe('top-level validate command', () => {
  const projectRoot = process.cwd();
  const testDir = path.join(projectRoot, 'test-validate-command-tmp');
  const changesDir = path.join(testDir, '.opsx', 'changes');
  const specsDir = path.join(testDir, '.opsx', 'specs');

  beforeEach(async () => {
    await fs.mkdir(changesDir, { recursive: true });
    await fs.mkdir(specsDir, { recursive: true });

    await fs.mkdir(path.join(testDir, '.opsx', 'architecture'), { recursive: true });
    await fs.writeFile(path.join(testDir, '.opsx', 'architecture', 'model.c4'), [
      "opsx { languageVersion '1' }",
      'specification {',
      '  element project { opsx { root true contract optional } }',
      '  element capability { opsx { contract optional parents [project] } }',
      '}',
      'model {',
      "  project_root = project 'Root' 'Root summary' {",
      "    metadata { elementId 'project.root' }",
      "    alpha = capability 'Alpha' 'Alpha summary' { metadata { elementId 'alpha.id' } }",
      '  }',
      '}',
      '',
    ].join('\n'));

    // Create a valid spec
    const specContent = [
      '---',
      'element: alpha.id',
      '---',
      '',
      '## Purpose',
      'This spec ensures the validation harness exercises a deterministic alpha module for automated tests.',
      '',
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
    await fs.mkdir(path.join(specsDir, 'alpha'), { recursive: true });
    await fs.writeFile(path.join(specsDir, 'alpha', 'spec.md'), specContent, 'utf-8');

    // Create a simple change with bullets (parser supports this)
    const changeContent = `# Test Change\n\n## Why\nBecause reasons that are sufficiently long for validation.\n\n## What Changes\n- **alpha:** Add something`;
    await fs.mkdir(path.join(changesDir, 'c1'), { recursive: true });
    await fs.writeFile(path.join(changesDir, 'c1', 'proposal.md'), changeContent, 'utf-8');
    const deltaContent = [
      '---',
      'element: alpha.id',
      '---',
      '',
      '## ADDED Requirements',
      '### Requirement: Validator SHALL support alpha change deltas',
      'The validator SHALL accept deltas provided by the test harness.',
      '',
      '#### Scenario: Apply alpha delta',
      '- **GIVEN** the test change delta',
      '- **WHEN** opsx validate runs',
      '- **THEN** the validator reports the change as valid',
    ].join('\n');
    const c1DeltaDir = path.join(changesDir, 'c1', 'specs', 'alpha');
    await fs.mkdir(c1DeltaDir, { recursive: true });
    await fs.writeFile(path.join(c1DeltaDir, 'spec.md'), deltaContent, 'utf-8');

    // Duplicate name for ambiguity test
    await fs.mkdir(path.join(changesDir, 'dup'), { recursive: true });
    await fs.writeFile(path.join(changesDir, 'dup', 'proposal.md'), changeContent, 'utf-8');
    const dupDeltaDir = path.join(changesDir, 'dup', 'specs', 'dup');
    await fs.mkdir(dupDeltaDir, { recursive: true });
    await fs.writeFile(path.join(dupDeltaDir, 'spec.md'), deltaContent, 'utf-8');
    await fs.mkdir(path.join(specsDir, 'dup'), { recursive: true });
    await fs.writeFile(path.join(specsDir, 'dup', 'spec.md'), specContent, 'utf-8');
  });

  async function writeProjectOpsx(): Promise<void> {
    await fs.writeFile(path.join(testDir, '.opsx', 'project.opsx.yaml'), [
      'schema_version: 2',
      'project:',
      '  id: proj.test',
      '  name: Test',
      '  intent: Test project',
      '  scope: Test scope',
      '  roots:',
      '    - path: .',
      'domains:',
      '  - id: dom.alpha',
      '    intent: Alpha domain',
      '    type: domain',
      'capabilities:',
      '  - id: cap.alpha',
      '    intent: Alpha capability',
      '    type: capability',
    ].join('\n'), 'utf-8');
    await fs.writeFile(path.join(testDir, '.opsx', 'project.opsx.relations.yaml'), [
      'schema_version: 2',
      'relations:',
      '  - from: cap.alpha',
      '    type: belongs_to',
      '    to: dom.alpha',
    ].join('\n'), 'utf-8');
  }

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('prints a helpful hint when no args in non-interactive mode', async () => {
    const result = await runCLI(['validate'], { cwd: testDir });
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Nothing to validate. Try one of:');
  });

  it('validates explicit --change with the same full semantics as legacy change validation', async () => {
    const legacy = await runCLI(['validate', 'c1', '--type', 'change', '--json'], { cwd: testDir });
    const explicit = await runCLI(['validate', '--change', 'c1', '--json'], { cwd: testDir });

    expect(explicit.exitCode).toBe(legacy.exitCode);
    const legacyJson = JSON.parse(legacy.stdout.trim());
    const explicitJson = JSON.parse(explicit.stdout.trim());
    expect(explicitJson.items[0]).toMatchObject({ id: 'c1', type: 'change', valid: true });
    expect(explicitJson.items[0].issues).toEqual(legacyJson.items[0].issues);
  });

  it('shows concise effective preview without writing the review artifact', async () => {
    const human = await runCLI(['validate', '--change', 'c1'], { cwd: testDir });
    const jsonResult = await runCLI(['validate', '--change', 'c1', '--json'], { cwd: testDir });

    expect(human.exitCode).toBe(0);
    expect(human.stdout).toContain('Effective change preview');
    expect(human.stdout).toContain('Specs');
    expect(jsonResult.exitCode).toBe(0);
    const json = JSON.parse(jsonResult.stdout);
    expect(json.items[0].summary).toBeDefined();
    expect(json.items[0].entries).toEqual(expect.arrayContaining([
      expect.objectContaining({ scope: 'specs', kind: 'requirement', operation: 'ADDED' }),
    ]));
    expect(json.items[0].entries[0]).not.toHaveProperty('before');
    await expect(fs.access(path.join(changesDir, 'c1', 'effective-change.md'))).rejects.toThrow();
  });

  it('accepts a canonical Specs no-op in scoped and full validation', async () => {
    const changeDir = path.join(changesDir, 'specs-noop');
    await fs.mkdir(changeDir, { recursive: true });
    await fs.writeFile(path.join(changeDir, 'proposal.md'), `# No-op\n\n## Why\nArchitecture-only change with no behavior delta.\n\n## What Changes\n- Update architecture source only.`);
    await fs.writeFile(path.join(changeDir, '.specs-noop'), '');
    await fs.writeFile(path.join(changeDir, 'opsx-delta.yaml'), 'schema_version: 2\n');

    const scoped = await runCLI(['validate', '--change', 'specs-noop', '--artifacts', 'specs', '--json'], { cwd: testDir });
    const full = await runCLI(['validate', '--change', 'specs-noop', '--json'], { cwd: testDir });

    expect(scoped.exitCode).toBe(0);
    expect(full.exitCode).toBe(0);
  });

  it('validates only delta specs for --artifacts specs', async () => {
    await writeProjectOpsx();
    await fs.writeFile(path.join(changesDir, 'c1', 'opsx-delta.yaml'), [
      'schema_version: 2',
      'MODIFIED:',
      '  capabilities:',
      '    - id: cap.missing',
      '      intent: Missing capability',
    ].join('\n'), 'utf-8');

    const result = await runCLI(['validate', '--change', 'c1', '--artifacts', 'specs', '--json'], { cwd: testDir });

    expect(result.exitCode).toBe(0);
    const json = JSON.parse(result.stdout.trim());
    expect(json.items[0]).toMatchObject({ id: 'c1', type: 'change', valid: true });
    expect(json.items[0].issues.some((issue: any) => issue.message.includes('OPSX dry-run merge failed'))).toBe(false);
  });

  it('rejects deprecated opsx-delta artifact scope', async () => {
    const result = await runCLI(['validate', '--change', 'c1', '--artifacts', 'opsx-delta'], { cwd: testDir });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Unknown artifact scope 'opsx-delta'");
    expect(result.stderr).toContain('architecture-delta');
  });

  it('rejects invalid artifact scope before running validation', async () => {
    const result = await runCLI(['validate', '--change', 'c1', '--artifacts', 'unknown'], { cwd: testDir });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Unknown artifact scope');
    expect(result.stderr).toContain('specs');
    expect(result.stderr).toContain('architecture-delta');
  });

  it('rejects missing explicit changes deterministically', async () => {
    const result = await runCLI(['validate', '--change', 'missing-change'], { cwd: testDir });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Unknown change 'missing-change'");
  });

  it('validates all with --all and outputs JSON summary', async () => {
    const result = await runCLI(['validate', '--all', '--json'], { cwd: testDir });
    expect(result.exitCode).toBe(0);
    const output = result.stdout.trim();
    expect(output).not.toBe('');
    const json = JSON.parse(output);
    expect(Array.isArray(json.items)).toBe(true);
    expect(json.summary?.totals?.items).toBeDefined();
    expect(json.version).toBe('1.0');
  });

  it('validates only specs with --specs and respects --concurrency', async () => {
    const result = await runCLI(['validate', '--specs', '--json', '--concurrency', '1'], { cwd: testDir });
    expect(result.exitCode).toBe(0);
    const output = result.stdout.trim();
    expect(output).not.toBe('');
    const json = JSON.parse(output);
    expect(json.items.every((i: any) => i.type === 'spec')).toBe(true);
  });

  it('errors on ambiguous item names and suggests type override', async () => {
    const result = await runCLI(['validate', 'dup'], { cwd: testDir });
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Ambiguous item');
  });

  it('does not register the removed scenario-labels command', async () => {
    const result = await runCLI(['scenario-labels', 'c1', '--preview'], { cwd: testDir });

    expect(result.exitCode).not.toBe(0);
    expect(`${result.stdout}\n${result.stderr}`).toContain("unknown command 'scenario-labels'");
  });

  it.each(['ADDED', 'MODIFIED', 'REMOVED', 'UPDATED'])('rejects [%s] Scenario metadata', async prefix => {
    const specPath = path.join(changesDir, 'c1', 'specs', 'alpha', 'spec.md');
    const content = await fs.readFile(specPath, 'utf-8');
    await fs.writeFile(specPath, content.replace('#### Scenario: Apply alpha delta', `#### Scenario: [${prefix}] Apply alpha delta`));

    const result = await runCLI(['validate', '--change', 'c1', '--artifacts', 'specs', '--json'], { cwd: testDir });

    expect(result.exitCode).toBe(1);
    expect(`${result.stdout}\n${result.stderr}`).toContain(`Unsupported Scenario operation metadata [${prefix}]`);
  });

  it('rejects RENAMED Requirements with REMOVED plus ADDED guidance', async () => {
    const specPath = path.join(changesDir, 'c1', 'specs', 'alpha', 'spec.md');
    await fs.writeFile(specPath, [
      '---', 'element: alpha.id', '---', '',
      '## RENAMED Requirements', '',
      'FROM: ### Requirement: Alpha module SHALL produce deterministic output',
      'TO: ### Requirement: Alpha module SHALL produce renamed output',
    ].join('\n'));

    const result = await runCLI(['validate', '--change', 'c1', '--artifacts', 'specs', '--json'], { cwd: testDir });

    expect(result.exitCode).toBe(1);
    const output = `${result.stdout}\n${result.stderr}`;
    expect(output).toContain('RENAMED Requirements is unsupported');
    expect(output).toContain('REMOVED old Requirement plus ADDED new Requirement');
  });

  it('accepts change proposals saved with CRLF line endings', async () => {
    const changeId = 'crlf-change';
    const toCrlf = (segments: string[]) => segments.join('\n').replace(/\n/g, '\r\n');

    const crlfContent = toCrlf([
      '# CRLF Proposal',
      '',
      '## Why',
      'This change verifies validation works with Windows line endings.',
      '',
      '## What Changes',
      '- **alpha:** Ensure validation passes on CRLF files',
    ]);

    await fs.mkdir(path.join(changesDir, changeId), { recursive: true });
    await fs.writeFile(path.join(changesDir, changeId, 'proposal.md'), crlfContent, 'utf-8');

    const deltaContent = toCrlf([
      '---',
      'element: alpha.id',
      '---',
      '',
      '## ADDED Requirements',
      '### Requirement: Parser SHALL accept CRLF change proposals',
      'The parser SHALL accept CRLF change proposals without manual edits.',
      '',
      '#### Scenario: Validate CRLF change',
      '- **GIVEN** a change proposal saved with CRLF line endings',
      '- **WHEN** a developer runs opsx validate on the proposal',
      '- **THEN** validation succeeds without section errors',
    ]);

    const deltaDir = path.join(changesDir, changeId, 'specs', 'alpha');
    await fs.mkdir(deltaDir, { recursive: true });
    await fs.writeFile(path.join(deltaDir, 'spec.md'), deltaContent, 'utf-8');

    const result = await runCLI(['validate', changeId], { cwd: testDir });
    expect(result.exitCode).toBe(0);
  });

  it('respects --no-interactive flag passed via CLI', async () => {
    // This test ensures Commander.js --no-interactive flag is correctly parsed
    // and passed to the validate command. The flag sets options.interactive = false
    // (not options.noInteractive = true) due to Commander.js convention.
    const result = await runCLI(['validate', '--specs', '--no-interactive'], {
      cwd: testDir,
      // Don't set OPSX_INTERACTIVE to ensure we're testing the flag itself
      env: { ...process.env, OPSX_INTERACTIVE: undefined },
    });
    expect(result.exitCode).toBe(0);
    // Should complete without hanging and without prompts
    expect(result.stderr).not.toContain('What would you like to validate?');
  });
});
