import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { runCLI } from '../helpers/run-cli.js';
import { minimalModel, writeChangeDelta, writeProjectModel } from '../helpers/model-fixture.js';

const ALPHA_CONTRACT = [
  '## Specification',
  '',
  '### Section: Alpha module SHALL produce deterministic output',
  'The alpha module SHALL produce a deterministic response for validation.',
  '',
  '#### Acceptance Case: Deterministic alpha run',
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
  '## ADDED Sections',
  '### Section: Validator SHALL support alpha change deltas',
  'The validator SHALL accept deltas provided by the test harness.',
  '',
  '#### Acceptance Case: Apply alpha delta',
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
      elements: [{ identity: 'alpha.id', parent: 'root', title: 'Alpha', definition: 'Alpha summary', sections: ALPHA_CONTRACT }],
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

  it('reports task structure issues from tasks.md in change validation', async () => {
    const tasksContent = `### Task 1: Legacy

**Goal**: Create a file.

**Files**:
- Create: src/shared.ts

#### Checks
- [ ] C1 Verify
  - Test action: reuse
`;
    await fs.writeFile(path.join(changesDir, 'c1', 'tasks.md'), tasksContent, 'utf-8');

    const result = await runCLI(['validate', '--change', 'c1', '--json'], { cwd: testDir });
    const json = JSON.parse(result.stderr.trim());
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe('');
    expect(json.issues.some((issue: { message: string }) => issue.message.includes('unsupported-task-format'))).toBe(true);
    expect(json.issues.some((issue: { path: string }) => issue.path === 'tasks.md')).toBe(true);
  });

  it('rejects legacy Test action tasks through the CLI', async () => {
    const tasks = `### Task 1: Verify alpha\n\n**Goal**: Verify the alpha change.\n**Files**:\n- Modify: src/alpha.ts\n**Sections**:\n- Verify target behavior\n\n#### Checks\n\n- [ ] C1 Verify alpha\n  - Verifies: elements/alpha.id.md / Section "Validator SHALL support alpha change deltas"\n  - Test action: one-time\n  - Command: pnpm test\n`;
    await fs.writeFile(path.join(changesDir, 'c1', 'tasks.md'), tasks);
    const result = await runCLI(['validate', '--change', 'c1', '--json'], { cwd: testDir });
    const json = JSON.parse(result.stderr.trim());
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe('');
    expect(json.issues.some((issue: { message: string }) => issue.message.includes('unsupported-task-format'))).toBe(true);
  });

  it('accepts a no-delta change carrying the .delta-noop marker', async () => {
    await fs.mkdir(path.join(changesDir, 'c-nodelta'), { recursive: true });
    await fs.writeFile(path.join(changesDir, 'c-nodelta', 'proposal.md'), '# No Delta\n\n## Why\nMarker-only change.\n', 'utf-8');
    await fs.writeFile(path.join(changesDir, 'c-nodelta', '.delta-noop'), '', 'utf-8');

    const result = await runCLI(['validate', '--change', 'c-nodelta', '--json'], { cwd: testDir });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe('');
    expect(result.stderr).toBe('');
  });

  it('reports a no-delta change without the .delta-noop marker', async () => {
    await fs.mkdir(path.join(changesDir, 'c-empty'), { recursive: true });
    await fs.writeFile(path.join(changesDir, 'c-empty', 'proposal.md'), '# Empty\n\n## Why\nEmpty change.\n', 'utf-8');

    const result = await runCLI(['validate', '--change', 'c-empty', '--json'], { cwd: testDir });
    const json = JSON.parse(result.stderr.trim());
    expect(result.stdout).toBe('');
    expect(json.issues.some((issue: { message: string }) => issue.message.includes('at least one delta'))).toBe(true);
  });

  it('validates explicit --change with the same semantics as the positional form', async () => {
    const positional = await runCLI(['validate', 'c1', '--type', 'change', '--json'], { cwd: testDir });
    const explicit = await runCLI(['validate', '--change', 'c1', '--json'], { cwd: testDir });

    expect(explicit.exitCode).toBe(positional.exitCode);
    expect(explicit).toMatchObject({ stdout: '', stderr: '' });
    expect(positional).toMatchObject({ stdout: '', stderr: '' });
  });

  it('accepts removing an Element together with its complete Contract', async () => {
    await writeChangeDelta(testDir, 'c1', {
      'elements/alpha.id.md': '---\noperation: REMOVED\nentity: element-declaration\nidentity: alpha.id\n---\n',
    });

    const result = await runCLI(['validate', '--change', 'c1', '--json'], { cwd: testDir });

    expect(result.exitCode).toBe(0);
    expect(result).toMatchObject({ stdout: '', stderr: '' });
  });

  it('shows a concise effective preview without partitions and without writing the artifact', async () => {
    const human = await runCLI(['validate', '--change', 'c1', '--preview'], { cwd: testDir });
    const jsonResult = await runCLI(['validate', '--change', 'c1', '--preview', '--json'], { cwd: testDir });

    expect(human.exitCode).toBe(0);
    expect(human.stdout).toContain('Change: c1');
    expect(human.stdout).toContain('Semantic Delta');
    expect(human.stdout).not.toMatch(/^Specs$/m);
    expect(jsonResult.exitCode).toBe(0);
    const json = JSON.parse(jsonResult.stdout);
    expect(json.summary).toBeDefined();
    expect(json.entries).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'section', operation: 'ADDED' }),
    ]));
    expect(json.entries[0]).not.toHaveProperty('before');
    expect(json.entries[0]).not.toHaveProperty('scope');
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
    expect(result.stdout).toBe('');
    expect(result.stderr).toContain('elements/alpha.id.md');
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
    expect(result).toMatchObject({ stdout: '', stderr: '' });
  });

  it('validates Element Contracts with --contracts and respects --concurrency', async () => {
    const result = await runCLI(['validate', '--contracts', '--json', '--concurrency', '1'], { cwd: testDir });
    expect(result.exitCode).toBe(0);
    expect(result).toMatchObject({ stdout: '', stderr: '' });
  });

  it('validates one Element Contract with --type contract', async () => {
    const result = await runCLI(['validate', 'alpha.id', '--type', 'contract', '--json'], { cwd: testDir });

    expect(result.exitCode).toBe(0);
    expect(result).toMatchObject({ stdout: '', stderr: '' });
  });

  it.each([
    ['--specs'],
    ['alpha.id', '--type', 'spec'],
  ])('rejects the removed spec validation form: %s', async (...args) => {
    const result = await runCLI(['validate', ...args], { cwd: testDir });

    expect(result.exitCode).not.toBe(0);
  });

  it('errors on ambiguous item names and suggests type override', async () => {
    const result = await runCLI(['validate', 'alpha.id'], { cwd: testDir });
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Ambiguous item');
  });

  it('does not register the removed acceptanceCase-labels command', async () => {
    const result = await runCLI(['acceptanceCase-labels', 'c1', '--preview'], { cwd: testDir });

    expect(result.exitCode).not.toBe(0);
    expect(`${result.stdout}\n${result.stderr}`).toContain("unknown command 'acceptanceCase-labels'");
  });

  it('rejects RENAMED Sections with REMOVED plus ADDED guidance', async () => {
    await writeChangeDelta(testDir, 'c1', {
      'elements/alpha.id.md': [
        '---', 'operation: MODIFIED', 'entity: element-declaration', 'identity: alpha.id',
        'kind: capability', 'parent: root', 'title: Alpha', 'definition: Alpha summary', '---', '',
        '## RENAMED Sections', '',
        'FROM: ### Section: Alpha module SHALL produce deterministic output',
        'TO: ### Section: Alpha module SHALL produce renamed output',
        '',
      ].join('\n'),
    });

    const result = await runCLI(['validate', '--change', 'c1', '--json'], { cwd: testDir });

    expect(result.exitCode).toBe(1);
    const output = `${result.stdout}\n${result.stderr}`;
    expect(output).toContain('RENAMED Sections is unsupported');
    expect(output).toContain('REMOVED old Section plus ADDED new Section');
  });

  it('reports notation issues at the actual Element unit path', async () => {
    await writeChangeDelta(testDir, 'c1', {
      'elements/alpha.id.md': ALPHA_DELTA.replace('The validator SHALL accept deltas provided by the test harness.', 'No normative keyword here.'),
    });

    const result = await runCLI(['validate', '--change', 'c1', '--json'], { cwd: testDir });

    expect(result.exitCode).toBe(1);
    const issues = JSON.parse(result.stderr).issues as Array<{ path: string }>;
    expect(issues.some(issue => issue.path === 'elements/alpha.id.md')).toBe(true);
    expect(issues.every(issue => issue.path !== 'architecture-delta.c4')).toBe(true);
  });

  it('reports model warnings on stderr and fails strict mode without requiring a preview', async () => {
    const kind = path.join(testDir, '.xirang/model/metamodel/capability.md');
    await fs.rename(kind, path.join(testDir, '.xirang/model/views/capability.md'));
    const regular = await runCLI(['validate', '--change', 'c1', '--json'], { cwd: testDir });
    expect(regular.exitCode).toBe(0);
    expect(regular.stdout).toBe('');
    expect(JSON.parse(regular.stderr).issues).toContainEqual(expect.objectContaining({ level: 'WARNING' }));
    const strict = await runCLI(['validate', '--change', 'c1', '--strict', '--json'], { cwd: testDir });
    expect(strict.exitCode).toBe(1);
    expect(strict.stdout).toBe('');
    expect(JSON.parse(strict.stderr).issues).toContainEqual(expect.objectContaining({ level: 'WARNING' }));
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
    const result = await runCLI(['validate', '--contracts', '--no-interactive'], {
      cwd: testDir,
      env: { ...process.env, XIRANG_INTERACTIVE: undefined },
    });
    expect(result.exitCode).toBe(0);
    expect(result.stderr).not.toContain('What would you like to validate?');
  });
});
