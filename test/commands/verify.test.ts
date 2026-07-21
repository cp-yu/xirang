import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { execFile } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { promisify } from 'util';
import * as freshness from '../../src/core/verify/freshness.js';
import { runCLI } from '../helpers/run-cli.js';

const execFileAsync = promisify(execFile);

function finding(overrides: Record<string, unknown> = {}) {
  return {
    status: 'pending',
    location: { files: ['src/a.ts'], symbols: ['a'] },
    opportunity: 'Repeated lookup',
    impact: 'Avoid repeated linear scans',
    evidence: ['src/a.ts contains repeated membership scans'],
    recommendation: 'Use a lookup set',
    keyDesign: 'Build the set once and preserve output iteration order',
    preservationConstraints: ['Preserve inputs, outputs, ordering, and errors'],
    implementationOutline: ['Build lookup before use', 'Replace repeated scans'],
    validation: ['Run focused behavior tests'],
    impactLevel: 'high',
    confidence: 'high',
    risk: 'low',
    cost: 'low',
    dependencies: [],
    priorityReason: 'Highest impact and confidence with the lowest risk',
    ...overrides,
  };
}

describe('opsx verify command', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'opsx-verify-cli-'));
    await fs.mkdir(path.join(tempDir, '.opsx', 'changes', 'c1'), { recursive: true });
    await fs.mkdir(path.join(tempDir, 'src'), { recursive: true });
    await fs.writeFile(path.join(tempDir, '.opsx', 'changes', 'c1', 'tasks.md'), '- [x] task\n', 'utf-8');
    await fs.writeFile(path.join(tempDir, 'src', 'a.ts'), 'const a = 1;\n', 'utf-8');
    await execFileAsync('git', ['init'], { cwd: tempDir });
    await execFileAsync('git', ['config', 'user.name', 'OPSX Test'], { cwd: tempDir });
    await execFileAsync('git', ['config', 'user.email', 'test@example.com'], { cwd: tempDir });
    await execFileAsync('git', ['add', '.'], { cwd: tempDir });
    await execFileAsync('git', ['commit', '-m', 'init'], { cwd: tempDir });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('persists prioritized findings with CLI-owned timestamp IDs', async () => {
    await runCLI([
      'verify', 'phase1', 'c1', '--input',
      JSON.stringify({ result: 'PASS', issues: [], evidenceFiles: ['src/a.ts'] }),
    ], { cwd: tempDir });

    const result = await runCLI([
      'verify', 'phase2', 'c1', '--type=optimization', '--json', '--input',
      JSON.stringify({
        status: 'OPTIMIZATION_PROPOSED',
        envelope: {
          blockingObservations: [],
          actions: [
            { action: 'add', finding: finding({ impactLevel: 'medium' }) },
            { action: 'add', finding: finding({
              opportunity: 'Dependent optimization',
              dependencies: [{ actionIndex: 0 }],
            }) },
          ],
          findings: [],
        },
      }),
    ], { cwd: tempDir });

    expect(result.exitCode, result.stdout).toBe(0);
    const optimization = JSON.parse(result.stdout).result.optimization;
    expect(optimization.findings).toHaveLength(2);
    expect(optimization.findings[0].id).toMatch(/^OPT-\d{8}T\d{9}Z-01$/);
    expect(optimization.findings[1].id).toMatch(/^OPT-\d{8}T\d{9}Z-02$/);
    expect(optimization.findings[0].status).toBe('selected');
    expect(optimization.findings[1].status).toBe('pending');
    expect(optimization.findings[1].dependencies).toEqual([optimization.findings[0].id]);
    expect(optimization.history.map((event: { action: string }) => event.action)).toEqual([
      'add', 'add', 'select',
    ]);
  });

  it('hashes one normalized snapshot in selected-first error order', async () => {
    await fs.writeFile(path.join(tempDir, 'src', 'b.ts'), 'const b = 1;\n', 'utf-8');
    await runCLI(['verify', 'phase1', 'c1', '--input', JSON.stringify({
      result: 'PASS', issues: [], evidenceFiles: ['src/a.ts'],
    })], { cwd: tempDir });
    const hashFiles = vi.spyOn(freshness, 'hashFiles');

    const result = await runCLI(['verify', 'phase2', 'c1', '--type=optimization', '--json', '--input', JSON.stringify({
      status: 'OPTIMIZATION_PROPOSED',
      envelope: {
        blockingObservations: [],
        actions: [
          { action: 'add', finding: finding({
            location: { files: ['src/b.ts', 'src\\b.ts'], symbols: ['b'] },
          }) },
          { action: 'add', finding: finding({ opportunity: 'Second optimization', impactLevel: 'medium' }) },
        ],
        findings: [],
      },
    })], { cwd: tempDir });

    expect(result.exitCode, result.stdout).toBe(0);
    expect(hashFiles).toHaveBeenCalledTimes(1);
    expect(hashFiles).toHaveBeenCalledWith(['src/b.ts', 'src/a.ts'], tempDir);
    expect(JSON.parse(result.stdout).result.optimization.findings[0].targetFileHashes)
      .toEqual({ 'src/b.ts': expect.any(String) });
  });

  it('reports selected target errors before pending target errors', async () => {
    await runCLI(['verify', 'phase1', 'c1', '--input', JSON.stringify({
      result: 'PASS', issues: [], evidenceFiles: ['src/a.ts'],
    })], { cwd: tempDir });

    const result = await runCLI(['verify', 'phase2', 'c1', '--type=optimization', '--json', '--input', JSON.stringify({
      status: 'OPTIMIZATION_PROPOSED',
      envelope: {
        blockingObservations: [],
        actions: [
          { action: 'add', finding: finding({
            location: { files: ['src/z-missing.ts', 'src/y-missing.ts'], symbols: ['missing'] },
          }) },
          { action: 'add', finding: finding({
            opportunity: 'Second optimization',
            impactLevel: 'medium',
            location: { files: ['src/a-missing.ts'], symbols: ['missing'] },
          }) },
        ],
        findings: [],
      },
    })], { cwd: tempDir });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('src/z-missing.ts');
    expect(result.stderr).not.toContain('src/a-missing.ts');
  });

  it('selects the highest-priority actionable finding regardless of insertion order', async () => {
    await runCLI(['verify', 'phase1', 'c1', '--input', JSON.stringify({
      result: 'PASS', issues: [], evidenceFiles: ['src/a.ts'],
    })], { cwd: tempDir });

    const result = await runCLI(['verify', 'phase2', 'c1', '--type=optimization', '--json', '--input', JSON.stringify({
      status: 'OPTIMIZATION_PROPOSED',
      envelope: {
        blockingObservations: [],
        actions: [
          { action: 'add', finding: finding({ opportunity: 'Low priority', impactLevel: 'low' }) },
          { action: 'add', finding: finding({ opportunity: 'High priority' }) },
        ],
        findings: [],
      },
    })], { cwd: tempDir });

    expect(result.exitCode, result.stdout).toBe(0);
    expect(JSON.parse(result.stdout).result.optimization.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ opportunity: 'Low priority', status: 'pending' }),
      expect.objectContaining({ opportunity: 'High priority', status: 'selected' }),
    ]));
  });

  it('requires reconciliation evidence for NO_OPTIMIZATION_NEEDED', async () => {
    await runCLI([
      'verify', 'phase1', 'c1', '--input',
      JSON.stringify({ result: 'PASS', issues: [], evidenceFiles: ['src/a.ts'] }),
    ], { cwd: tempDir });

    const result = await runCLI([
      'verify', 'phase2', 'c1', '--type=optimization', '--json', '--input',
      JSON.stringify({ status: 'NO_OPTIMIZATION_NEEDED', summary: 'No opportunities' }),
    ], { cwd: tempDir });

    expect(result.exitCode).toBe(1);
    expect(JSON.parse(result.stdout).reason).toBe('OPTIMIZER_REQUIRED');
  });

  it('records a finding PASS and requires another reconciliation', async () => {
    await runCLI([
      'verify', 'phase1', 'c1', '--input',
      JSON.stringify({ result: 'PASS', issues: [], evidenceFiles: ['src/a.ts'] }),
    ], { cwd: tempDir });
    const proposed = await runCLI([
      'verify', 'phase2', 'c1', '--type=optimization', '--json', '--input',
      JSON.stringify({
        status: 'OPTIMIZATION_PROPOSED',
        envelope: {
          blockingObservations: [],
          actions: [{ action: 'add', finding: finding() }],
          findings: [],
        },
      }),
    ], { cwd: tempDir });
    const findingId = JSON.parse(proposed.stdout).result?.optimization?.findings?.[0]?.id;
    expect(findingId, proposed.stdout).toBeTruthy();
    const direct = await runCLI([
      'verify', 'phase2', 'c1', '--type=verification', '--json', '--input',
      JSON.stringify({ result: 'PASS', findingId, issues: [] }),
    ], { cwd: tempDir });
    expect(direct.exitCode).toBe(1);
    expect(JSON.parse(direct.stdout).reason).toBe('IMPLEMENTED_FINDING_REQUIRED');

    await runCLI([
      'verify', 'phase2', 'c1', '--type=optimization', '--input',
      JSON.stringify({ status: 'OPTIMIZATION_PROPOSED', mode: 'begin-implementation', findingId }),
    ], { cwd: tempDir });
    await fs.writeFile(path.join(tempDir, 'src', 'a.ts'), 'const a = 2;\n', 'utf-8');

    const verified = await runCLI([
      'verify', 'phase2', 'c1', '--type=verification', '--json', '--input',
      JSON.stringify({ result: 'PASS', findingId, issues: [] }),
    ], { cwd: tempDir });

    expect(verified.exitCode).toBe(0);
    const optimization = JSON.parse(verified.stdout).result.optimization;
    expect(optimization.status).toBe('PENDING_VERIFICATION');
    expect(optimization.findings[0].status).toBe('verified');
    expect(JSON.parse(verified.stdout).nextStep).toBe('RECONCILE');
  });

  it('checks selected finding freshness before implementation', async () => {
    await runCLI([
      'verify', 'phase1', 'c1', '--input',
      JSON.stringify({ result: 'PASS', issues: [], evidenceFiles: ['src/a.ts'] }),
    ], { cwd: tempDir });
    const proposed = await runCLI([
      'verify', 'phase2', 'c1', '--type=optimization', '--json', '--input',
      JSON.stringify({
        status: 'OPTIMIZATION_PROPOSED',
        envelope: {
          blockingObservations: [],
          actions: [{ action: 'add', finding: finding() }],
          findings: [],
        },
      }),
    ], { cwd: tempDir });
    const findingId = JSON.parse(proposed.stdout).selectedFindingId;

    const begun = await runCLI([
      'verify', 'phase2', 'c1', '--type=optimization', '--json', '--input',
      JSON.stringify({ status: 'OPTIMIZATION_PROPOSED', mode: 'begin-implementation', findingId }),
    ], { cwd: tempDir });
    expect(begun.exitCode).toBe(0);
    expect(JSON.parse(begun.stdout).result.optimization.findings[0].status).toBe('implemented');
  });

  it('rejects stale selected findings before implementation', async () => {
    await runCLI([
      'verify', 'phase1', 'c1', '--input',
      JSON.stringify({ result: 'PASS', issues: [], evidenceFiles: ['src/a.ts'] }),
    ], { cwd: tempDir });
    const proposed = await runCLI([
      'verify', 'phase2', 'c1', '--type=optimization', '--json', '--input',
      JSON.stringify({
        status: 'OPTIMIZATION_PROPOSED',
        envelope: {
          blockingObservations: [],
          actions: [{ action: 'add', finding: finding() }],
          findings: [],
        },
      }),
    ], { cwd: tempDir });
    const findingId = JSON.parse(proposed.stdout).selectedFindingId;
    await fs.writeFile(path.join(tempDir, 'src', 'a.ts'), 'const changedBeforeImplementation = true;\n', 'utf-8');

    const begun = await runCLI([
      'verify', 'phase2', 'c1', '--type=optimization', '--json', '--input',
      JSON.stringify({ status: 'OPTIMIZATION_PROPOSED', mode: 'begin-implementation', findingId }),
    ], { cwd: tempDir });
    expect(begun.exitCode).toBe(1);
    expect(JSON.parse(begun.stdout).reason).toBe('STALE_FINDING');
  });

  it('reconciles resolved, invalidated, and new findings after a successful wave', async () => {
    await fs.writeFile(
      path.join(tempDir, '.opsx', 'config.yaml'),
      'schema: spec-driven\noptimization:\n  enabled: true\n  optRetries: 1\n',
      'utf-8'
    );
    await runCLI(['verify', 'phase1', 'c1', '--input', JSON.stringify({
      result: 'PASS', issues: [], evidenceFiles: ['src/a.ts'],
    })], { cwd: tempDir });
    const first = await runCLI(['verify', 'phase2', 'c1', '--type=optimization', '--json', '--input', JSON.stringify({
      status: 'OPTIMIZATION_PROPOSED',
      envelope: {
        blockingObservations: [],
        actions: [
          { action: 'add', finding: finding({ opportunity: 'First' }) },
          { action: 'add', finding: finding({ opportunity: 'Second', impactLevel: 'medium' }) },
        ],
        findings: [],
      },
    })], { cwd: tempDir });
    const [firstFinding, secondFinding] = JSON.parse(first.stdout).result.optimization.findings;
    await runCLI(['verify', 'phase2', 'c1', '--type=optimization', '--input', JSON.stringify({
      status: 'OPTIMIZATION_PROPOSED', mode: 'begin-implementation', findingId: firstFinding.id,
    })], { cwd: tempDir });
    await fs.writeFile(path.join(tempDir, 'src', 'a.ts'), 'const waveOne = true;\n', 'utf-8');
    await runCLI(['verify', 'phase2', 'c1', '--type=verification', '--input', JSON.stringify({
      result: 'PASS', findingId: firstFinding.id, issues: [],
    })], { cwd: tempDir });

    const reconciled = await runCLI(['verify', 'phase2', 'c1', '--type=optimization', '--json', '--input', JSON.stringify({
      status: 'OPTIMIZATION_PROPOSED',
      envelope: {
        blockingObservations: [],
        actions: [
          { action: 'resolve', findingId: firstFinding.id, reason: 'Implemented and verified' },
          { action: 'invalidate', findingId: secondFinding.id, reason: 'First wave removed its premise' },
          { action: 'add', finding: finding({ opportunity: 'New current-code opportunity' }) },
        ],
        findings: [
          { ...firstFinding, status: 'verified' },
          secondFinding,
        ],
      },
    })], { cwd: tempDir });

    expect(reconciled.exitCode).toBe(0);
    const findings = JSON.parse(reconciled.stdout).result.optimization.findings;
    expect(findings.find((item: { id: string }) => item.id === firstFinding.id).status).toBe('resolved');
    expect(findings.find((item: { id: string }) => item.id === secondFinding.id).status).toBe('invalidated');
    const newFinding = findings.find((item: { opportunity: string }) => item.opportunity === 'New current-code opportunity');
    expect(newFinding.status).toBe('selected');

    await runCLI(['verify', 'phase2', 'c1', '--type=optimization', '--input', JSON.stringify({
      status: 'OPTIMIZATION_PROPOSED', mode: 'begin-implementation', findingId: newFinding.id,
    })], { cwd: tempDir });
    await fs.writeFile(path.join(tempDir, 'src', 'a.ts'), 'const waveTwo = true;\n', 'utf-8');
    const secondPass = await runCLI(['verify', 'phase2', 'c1', '--type=verification', '--json', '--input', JSON.stringify({
      result: 'PASS', findingId: newFinding.id, issues: [],
    })], { cwd: tempDir });
    const verifiedNewFinding = JSON.parse(secondPass.stdout).result.optimization.findings.find(
      (item: { id: string }) => item.id === newFinding.id
    );
    const terminal = await runCLI(['verify', 'phase2', 'c1', '--type=optimization', '--json', '--input', JSON.stringify({
      status: 'NO_OPTIMIZATION_NEEDED',
      envelope: {
        blockingObservations: [],
        actions: [{ action: 'resolve', findingId: newFinding.id, reason: 'Second wave verified' }],
        findings: [verifiedNewFinding],
      },
    })], { cwd: tempDir });
    expect(terminal.exitCode, terminal.stdout).toBe(0);
    expect(JSON.parse(terminal.stdout).result.optimization.status).toBe('IMPROVED');
  });

  it('records masterChallenge and rejects one exhausted direction without blocking others', async () => {
    await fs.writeFile(
      path.join(tempDir, '.opsx', 'config.yaml'),
      'schema: spec-driven\noptimization:\n  enabled: true\n  optRetries: 1\n',
      'utf-8'
    );
    await runCLI(['verify', 'phase1', 'c1', '--input', JSON.stringify({
      result: 'PASS', issues: [], evidenceFiles: ['src/a.ts'],
    })], { cwd: tempDir });
    const proposed = await runCLI(['verify', 'phase2', 'c1', '--type=optimization', '--json', '--input', JSON.stringify({
      status: 'OPTIMIZATION_PROPOSED',
      envelope: {
        blockingObservations: [],
        actions: [
          { action: 'add', finding: finding({ opportunity: 'Risky first' }) },
          { action: 'add', finding: finding({ opportunity: 'Independent second', impactLevel: 'medium' }) },
        ],
        findings: [],
      },
    })], { cwd: tempDir });
    const proposedOptimization = JSON.parse(proposed.stdout).result.optimization;
    const [firstFinding, secondFinding] = proposedOptimization.findings;
    const firstId = JSON.parse(proposed.stdout).selectedFindingId;
    const challenged = await runCLI(['verify', 'phase2', 'c1', '--type=optimization', '--json', '--input', JSON.stringify({
      status: 'OPTIMIZATION_PROPOSED',
      envelope: {
        blockingObservations: [],
        actions: [
          { action: 'masterChallenge', findingId: firstId, reason: 'Existing contract conflicts', evidence: ['src/a.ts preserves legacy ordering'] },
          { action: 'retain', findingId: secondFinding.id, reason: 'Still actionable' },
        ],
        findings: [firstFinding, secondFinding],
      },
    })], { cwd: tempDir });
    expect(JSON.parse(challenged.stdout).result.optimization.history).toEqual(expect.arrayContaining([
      expect.objectContaining({ action: 'masterChallenge', findingId: firstId }),
    ]));
    await runCLI(['verify', 'phase2', 'c1', '--type=optimization', '--input', JSON.stringify({
      status: 'OPTIMIZATION_PROPOSED', mode: 'begin-implementation', findingId: firstId,
    })], { cwd: tempDir });
    await fs.writeFile(path.join(tempDir, 'src', 'a.ts'), 'const failedWave = true;\n', 'utf-8');
    const failed = await runCLI(['verify', 'phase2', 'c1', '--type=verification', '--json', '--input', JSON.stringify({
      result: 'FAIL_NEEDS_REMEDIATION', findingId: firstId, issues: [], summary: 'Ordering changed',
    })], { cwd: tempDir });

    const optimization = JSON.parse(failed.stdout).result.optimization;
    expect(optimization.findings.find((item: { id: string }) => item.id === firstId).status).toBe('rejected');
    expect(optimization.findings.some((item: { status: string }) => item.status === 'pending')).toBe(true);
    expect(optimization.status).toBe('PENDING_VERIFICATION');
  });

  it('rejects incomplete reconciliation and illegal pending-to-resolved transitions atomically', async () => {
    await runCLI(['verify', 'phase1', 'c1', '--input', JSON.stringify({
      result: 'PASS', issues: [], evidenceFiles: ['src/a.ts'],
    })], { cwd: tempDir });
    const proposed = await runCLI(['verify', 'phase2', 'c1', '--type=optimization', '--json', '--input', JSON.stringify({
      status: 'OPTIMIZATION_PROPOSED',
      envelope: {
        blockingObservations: [],
        actions: [
          { action: 'add', finding: finding({ opportunity: 'First' }) },
          { action: 'add', finding: finding({ opportunity: 'Second', impactLevel: 'medium' }) },
        ],
        findings: [],
      },
    })], { cwd: tempDir });
    const [firstFinding, secondFinding] = JSON.parse(proposed.stdout).result.optimization.findings;
    const before = await fs.readFile(path.join(tempDir, '.opsx', 'changes', 'c1', '.verify-result.json'), 'utf-8');

    const incomplete = await runCLI(['verify', 'phase2', 'c1', '--type=optimization', '--json', '--input', JSON.stringify({
      status: 'OPTIMIZATION_PROPOSED',
      envelope: {
        blockingObservations: [],
        actions: [{ action: 'retain', findingId: firstFinding.id, reason: 'Still useful' }],
        findings: [firstFinding],
      },
    })], { cwd: tempDir });
    expect(incomplete.exitCode).toBe(2);
    expect(JSON.parse(incomplete.stdout).reason).toBe('INCOMPLETE_RECONCILIATION');

    const illegal = await runCLI(['verify', 'phase2', 'c1', '--type=optimization', '--json', '--input', JSON.stringify({
      status: 'OPTIMIZATION_PROPOSED',
      envelope: {
        blockingObservations: [],
        actions: [
          { action: 'retain', findingId: firstFinding.id, reason: 'Still useful' },
          { action: 'resolve', findingId: secondFinding.id, reason: 'No longer useful' },
        ],
        findings: [firstFinding, secondFinding],
      },
    })], { cwd: tempDir });
    expect(illegal.exitCode).toBe(2);
    expect(JSON.parse(illegal.stdout).reason).toBe('ILLEGAL_FINDING_TRANSITION');
    expect(await fs.readFile(path.join(tempDir, '.opsx', 'changes', 'c1', '.verify-result.json'), 'utf-8')).toBe(before);
  });

  it('terminates with a stalled diagnostic after two unchanged reconciliations', async () => {
    await runCLI(['verify', 'phase1', 'c1', '--input', JSON.stringify({
      result: 'PASS', issues: [], evidenceFiles: ['src/a.ts'],
    })], { cwd: tempDir });
    const proposed = await runCLI(['verify', 'phase2', 'c1', '--type=optimization', '--json', '--input', JSON.stringify({
      status: 'OPTIMIZATION_PROPOSED',
      envelope: {
        blockingObservations: [],
        actions: [{ action: 'add', finding: finding() }],
        findings: [],
      },
    })], { cwd: tempDir });
    const selected = JSON.parse(proposed.stdout).result.optimization.findings[0];

    const firstRetain = await runCLI(['verify', 'phase2', 'c1', '--type=optimization', '--json', '--input', JSON.stringify({
      status: 'OPTIMIZATION_PROPOSED',
      envelope: {
        blockingObservations: [],
        actions: [{ action: 'retain', findingId: selected.id, reason: 'Still unchanged' }],
        findings: [selected],
      },
    })], { cwd: tempDir });
    expect(JSON.parse(firstRetain.stdout).result.optimization.status).toBe('PENDING_VERIFICATION');
    const retained = JSON.parse(firstRetain.stdout).result.optimization.findings[0];

    const stalled = await runCLI(['verify', 'phase2', 'c1', '--type=optimization', '--json', '--input', JSON.stringify({
      status: 'OPTIMIZATION_PROPOSED',
      envelope: {
        blockingObservations: [],
        actions: [{ action: 'retain', findingId: selected.id, reason: 'Still unchanged' }],
        findings: [retained],
      },
    })], { cwd: tempDir });

    expect(stalled.exitCode, stalled.stdout).toBe(0);
    const optimization = JSON.parse(stalled.stdout).result.optimization;
    expect(optimization.status).toBe('DEGRADED');
    expect(optimization.history.at(-1)).toEqual(expect.objectContaining({ action: 'stalled' }));
    expect(JSON.parse(stalled.stdout).nextStep).toBe('PHASE2_COMPLETE');
  });

  it('rejects the removed envelope-less Search/Replace proposal path', async () => {
    await runCLI(['verify', 'phase1', 'c1', '--input', JSON.stringify({
      result: 'PASS', issues: [], evidenceFiles: ['src/a.ts'],
    })], { cwd: tempDir });

    const result = await runCLI([
      'verify', 'phase2', 'c1', '--type=optimization', '--json', '--input',
      JSON.stringify({ status: 'OPTIMIZATION_PROPOSED', summary: 'legacy proposal' }),
    ], { cwd: tempDir });

    expect(result.exitCode).toBe(2);
    expect(JSON.parse(result.stdout).reason).toBe('FINDING_ENVELOPE_REQUIRED');
  });

  it('rejects optimizer-owned IDs smuggled through the initial findings view', async () => {
    await runCLI(['verify', 'phase1', 'c1', '--input', JSON.stringify({
      result: 'PASS', issues: [], evidenceFiles: ['src/a.ts'],
    })], { cwd: tempDir });
    const result = await runCLI(['verify', 'phase2', 'c1', '--type=optimization', '--json', '--input', JSON.stringify({
      status: 'OPTIMIZATION_PROPOSED',
      envelope: {
        blockingObservations: [],
        actions: [],
        findings: [{ ...finding(), id: 'OPT-20260712T140523123Z-99' }],
      },
    })], { cwd: tempDir });

    expect(result.exitCode).toBe(2);
    expect(JSON.parse(result.stdout).reason).toBe('INCOMPLETE_RECONCILIATION');
  });

  it('rejects unknown stable dependency IDs atomically', async () => {
    await runCLI(['verify', 'phase1', 'c1', '--input', JSON.stringify({
      result: 'PASS', issues: [], evidenceFiles: ['src/a.ts'],
    })], { cwd: tempDir });
    const before = await fs.readFile(path.join(tempDir, '.opsx', 'changes', 'c1', '.verify-result.json'), 'utf-8');
    const result = await runCLI(['verify', 'phase2', 'c1', '--type=optimization', '--json', '--input', JSON.stringify({
      status: 'OPTIMIZATION_PROPOSED',
      envelope: {
        blockingObservations: [],
        actions: [{ action: 'add', finding: finding({ dependencies: ['OPT-20260712T140523123Z-99'] }) }],
        findings: [],
      },
    })], { cwd: tempDir });

    expect(result.exitCode).toBe(2);
    expect(JSON.parse(result.stdout).reason).toBe('UNKNOWN_FINDING_DEPENDENCY');
    expect(await fs.readFile(path.join(tempDir, '.opsx', 'changes', 'c1', '.verify-result.json'), 'utf-8')).toBe(before);
  });

  it('requires reconciliation after an exhausted direction before terminating', async () => {
    await fs.writeFile(path.join(tempDir, '.opsx', 'config.yaml'), 'schema: spec-driven\noptimization:\n  optRetries: 1\n', 'utf-8');
    await runCLI(['verify', 'phase1', 'c1', '--input', JSON.stringify({
      result: 'PASS', issues: [], evidenceFiles: ['src/a.ts'],
    })], { cwd: tempDir });
    const proposed = await runCLI(['verify', 'phase2', 'c1', '--type=optimization', '--json', '--input', JSON.stringify({
      status: 'OPTIMIZATION_PROPOSED',
      envelope: { blockingObservations: [], actions: [{ action: 'add', finding: finding() }], findings: [] },
    })], { cwd: tempDir });
    const selected = JSON.parse(proposed.stdout).result.optimization.findings[0];
    await runCLI(['verify', 'phase2', 'c1', '--type=optimization', '--input', JSON.stringify({
      status: 'OPTIMIZATION_PROPOSED', mode: 'begin-implementation', findingId: selected.id,
    })], { cwd: tempDir });
    const failed = await runCLI(['verify', 'phase2', 'c1', '--type=verification', '--json', '--input', JSON.stringify({
      result: 'FAIL_NEEDS_REMEDIATION', findingId: selected.id, issues: [], summary: 'Behavior changed',
    })], { cwd: tempDir });
    expect(JSON.parse(failed.stdout).result.optimization.status).toBe('PENDING_VERIFICATION');

    const reconciled = await runCLI(['verify', 'phase2', 'c1', '--type=optimization', '--json', '--input', JSON.stringify({
      status: 'NO_OPTIMIZATION_NEEDED',
      envelope: { blockingObservations: [], actions: [], findings: [] },
    })], { cwd: tempDir });
    expect(reconciled.exitCode, reconciled.stdout).toBe(0);
    expect(JSON.parse(reconciled.stdout).result.optimization.status).toBe('DEGRADED');
  });

  it('preserves deferred findings through later reconciliation without selecting them', async () => {
    await runCLI(['verify', 'phase1', 'c1', '--input', JSON.stringify({
      result: 'PASS', issues: [], evidenceFiles: ['src/a.ts'],
    })], { cwd: tempDir });
    const result = await runCLI(['verify', 'phase2', 'c1', '--type=optimization', '--json', '--input', JSON.stringify({
      status: 'OPTIMIZATION_PROPOSED',
      envelope: {
        blockingObservations: [],
        actions: [
          { action: 'add', finding: finding({ opportunity: 'Actionable' }) },
          { action: 'add', finding: finding({ status: 'deferred', opportunity: 'Needs workload', priorityReason: 'Requires workload evidence' }) },
        ],
        findings: [],
      },
    })], { cwd: tempDir });

    expect(result.exitCode, result.stdout).toBe(0);
    const findings = JSON.parse(result.stdout).result.optimization.findings;
    const actionable = findings.find((item: { opportunity: string }) => item.opportunity === 'Actionable');
    const deferred = findings.find((item: { opportunity: string }) => item.opportunity === 'Needs workload');
    expect(actionable.status).toBe('selected');
    expect(deferred.status).toBe('deferred');

    await runCLI(['verify', 'phase2', 'c1', '--type=optimization', '--input', JSON.stringify({
      status: 'OPTIMIZATION_PROPOSED', mode: 'begin-implementation', findingId: actionable.id,
    })], { cwd: tempDir });
    await fs.writeFile(path.join(tempDir, 'src', 'a.ts'), 'const deferredWave = true;\n', 'utf-8');
    const verified = await runCLI(['verify', 'phase2', 'c1', '--type=verification', '--json', '--input', JSON.stringify({
      result: 'PASS', findingId: actionable.id, issues: [],
    })], { cwd: tempDir });
    const verifiedActionable = JSON.parse(verified.stdout).result.optimization.findings.find(
      (item: { id: string }) => item.id === actionable.id
    );

    const retained = await runCLI(['verify', 'phase2', 'c1', '--type=optimization', '--json', '--input', JSON.stringify({
      status: 'NO_OPTIMIZATION_NEEDED',
      envelope: {
        blockingObservations: [],
        actions: [
          { action: 'resolve', findingId: actionable.id, reason: 'Verified opportunity completed' },
          { action: 'retain', findingId: deferred.id, reason: 'Still requires workload evidence' },
        ],
        findings: [verifiedActionable, deferred],
      },
    })], { cwd: tempDir });
    expect(retained.exitCode, retained.stdout).toBe(0);
    expect(JSON.parse(retained.stdout).result.optimization.findings.find(
      (item: { id: string }) => item.id === deferred.id
    ).status).toBe('deferred');
    expect(JSON.parse(retained.stdout).selectedFindingId).toBeUndefined();
  });

  it('resolves same-envelope actionIndex dependencies for merged findings', async () => {
    await runCLI(['verify', 'phase1', 'c1', '--input', JSON.stringify({
      result: 'PASS', issues: [], evidenceFiles: ['src/a.ts'],
    })], { cwd: tempDir });
    const first = await runCLI(['verify', 'phase2', 'c1', '--type=optimization', '--json', '--input', JSON.stringify({
      status: 'OPTIMIZATION_PROPOSED',
      envelope: {
        blockingObservations: [],
        actions: [
          { action: 'add', finding: finding({ opportunity: 'First old finding' }) },
          { action: 'add', finding: finding({ opportunity: 'Second old finding', impactLevel: 'medium' }) },
        ],
        findings: [],
      },
    })], { cwd: tempDir });
    const [firstFinding, secondFinding] = JSON.parse(first.stdout).result.optimization.findings;

    const merged = await runCLI(['verify', 'phase2', 'c1', '--type=optimization', '--json', '--input', JSON.stringify({
      status: 'OPTIMIZATION_PROPOSED',
      envelope: {
        blockingObservations: [],
        actions: [
          { action: 'add', finding: finding({ opportunity: 'Prerequisite', impactLevel: 'medium' }) },
          {
            action: 'merge',
            findingIds: [firstFinding.id, secondFinding.id],
            finding: finding({ opportunity: 'Merged finding', dependencies: [{ actionIndex: 0 }] }),
            reason: 'Same root cause',
          },
        ],
        findings: [firstFinding, secondFinding],
      },
    })], { cwd: tempDir });

    expect(merged.exitCode, merged.stdout).toBe(0);
    const findings = JSON.parse(merged.stdout).result.optimization.findings;
    const prerequisite = findings.find((item: { opportunity: string }) => item.opportunity === 'Prerequisite');
    expect(findings.find((item: { opportunity: string }) => item.opportunity === 'Merged finding').dependencies).toEqual([prerequisite.id]);
  });

  it('rejects NO_OPTIMIZATION_NEEDED when reconciliation creates actionable work', async () => {
    await runCLI(['verify', 'phase1', 'c1', '--input', JSON.stringify({
      result: 'PASS', issues: [], evidenceFiles: ['src/a.ts'],
    })], { cwd: tempDir });
    const before = await fs.readFile(path.join(tempDir, '.opsx', 'changes', 'c1', '.verify-result.json'), 'utf-8');
    const result = await runCLI(['verify', 'phase2', 'c1', '--type=optimization', '--json', '--input', JSON.stringify({
      status: 'NO_OPTIMIZATION_NEEDED',
      envelope: {
        blockingObservations: [],
        actions: [{ action: 'add', finding: finding() }],
        findings: [],
      },
    })], { cwd: tempDir });

    expect(result.exitCode).toBe(2);
    expect(JSON.parse(result.stdout).reason).toBe('CONTRADICTORY_OPTIMIZATION_STATUS');
    expect(await fs.readFile(path.join(tempDir, '.opsx', 'changes', 'c1', '.verify-result.json'), 'utf-8')).toBe(before);
  });

  it('persists Phase 1, seals, and reports status in JSON mode', async () => {
    const phase1 = await runCLI([
      'verify',
      'phase1',
      'c1',
      '--json',
      '--input',
      JSON.stringify({ result: 'PASS', issues: [], evidenceFiles: ['src/a.ts'] }),
    ], { cwd: tempDir });

    expect(phase1.exitCode).toBe(0);
    expect(JSON.parse(phase1.stdout).nextStep).toBe('Enter Phase 2');

    const pendingStatus = await runCLI(['verify', 'status', 'c1', '--json'], { cwd: tempDir });
    expect(pendingStatus.exitCode).toBe(1);
    expect(JSON.parse(pendingStatus.stdout).archiveCompatibility.blockReason).toBe('PENDING_VERIFICATION');

    const phase2 = await runCLI([
      'verify',
      'phase2',
      'c1',
      '--type=optimization',
      '--json',
      '--input',
      JSON.stringify({
        status: 'NO_OPTIMIZATION_NEEDED',
        envelope: { blockingObservations: [], actions: [], findings: [] },
      }),
    ], { cwd: tempDir });
    expect(phase2.exitCode).toBe(0);

    const seal = await runCLI(['verify', 'seal', 'c1', '--json'], { cwd: tempDir });
    expect(seal.exitCode).toBe(0);
    expect(JSON.parse(seal.stdout).sealHash).toMatch(/^[a-f0-9]{64}$/);

    const status = await runCLI(['verify', 'status', 'c1', '--json'], { cwd: tempDir });
    expect(status.exitCode).toBe(0);
    expect(JSON.parse(status.stdout).ok).toBe(true);
  });

  it('rejects invalid Phase 1 input with exit code 2', async () => {
    const result = await runCLI([
      'verify',
      'phase1',
      'c1',
      '--json',
      '--input',
      JSON.stringify({ result: 'BAD', issues: [], evidenceFiles: [] }),
    ], { cwd: tempDir });

    expect(result.exitCode).toBe(2);
    expect(JSON.parse(result.stdout).errors).toContain(
      'result must be PASS, PASS_WITH_WARNINGS, or FAIL_NEEDS_REMEDIATION'
    );
  });

  it('reports modified evidence files when freshness becomes stale', async () => {
    await runCLI([
      'verify',
      'phase1',
      'c1',
      '--input',
      JSON.stringify({ result: 'PASS', issues: [], evidenceFiles: ['src/a.ts'] }),
    ], { cwd: tempDir });

    await fs.writeFile(path.join(tempDir, 'src', 'a.ts'), 'const a = 2;\n', 'utf-8');

    const status = await runCLI(['verify', 'status', 'c1'], { cwd: tempDir });

    expect(status.exitCode).toBe(1);
    expect(status.stdout).toContain('Evidence file fingerprint mismatch:');
    expect(status.stdout).toContain('- src/a.ts');
  });

  it('reports git HEAD transitions as information without making freshness stale', async () => {
    await runCLI([
      'verify',
      'phase1',
      'c1',
      '--input',
      JSON.stringify({ result: 'PASS', issues: [], evidenceFiles: ['src/a.ts'] }),
    ], { cwd: tempDir });
    await runCLI([
      'verify',
      'phase2',
      'c1',
      '--type=optimization',
      '--input',
      JSON.stringify({
        status: 'NO_OPTIMIZATION_NEEDED',
        envelope: { blockingObservations: [], actions: [], findings: [] },
      }),
    ], { cwd: tempDir });
    const seal = await runCLI(['verify', 'seal', 'c1', '--json'], { cwd: tempDir });
    expect(seal.exitCode).toBe(0);

    const phase1Result = JSON.parse(
      await fs.readFile(path.join(tempDir, '.opsx', 'changes', 'c1', '.verify-result.json'), 'utf-8')
    );
    await fs.writeFile(path.join(tempDir, 'notes.md'), 'head changed\n', 'utf-8');
    await execFileAsync('git', ['add', 'notes.md'], { cwd: tempDir });
    await execFileAsync('git', ['commit', '-m', 'head-change'], { cwd: tempDir });

    const status = await runCLI(['verify', 'status', 'c1', '--json'], { cwd: tempDir });
    const currentHead = (
      await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: tempDir })
    ).stdout.trim();
    const output = JSON.parse(status.stdout);

    expect(status.exitCode).toBe(0);
    expect(output.freshness.status).toBe('FRESH');
    expect(output.freshness.checks).not.toHaveProperty('gitHeadCommit');
    expect(output.freshness.details).toEqual([]);
    expect(output.freshness.information.gitHeadCommit).toEqual({
      matches: false,
      recorded: phase1Result.verificationContext.gitHeadCommit,
      current: currentHead,
    });

    const textStatus = await runCLI(['verify', 'status', 'c1'], { cwd: tempDir });
    expect(textStatus.exitCode).toBe(0);
    expect(textStatus.stdout).toContain('Verify gate passed.');
    expect(textStatus.stdout).toContain('Information:');
    expect(textStatus.stdout).not.toContain('Warnings:');
    expect(textStatus.stdout).toContain(
      `gitHeadCommit changed: ${phase1Result.verificationContext.gitHeadCommit} → ${currentHead}`
    );
  });

  it('formats verify gate failures with remediation guidance', async () => {
    await runCLI([
      'verify',
      'phase1',
      'c1',
      '--input',
      JSON.stringify({ result: 'PASS', issues: [], evidenceFiles: ['src/a.ts'] }),
    ], { cwd: tempDir });

    await fs.writeFile(path.join(tempDir, 'src', 'a.ts'), 'const a = 3;\n', 'utf-8');
    await fs.writeFile(path.join(tempDir, 'notes.md'), 'second head change\n', 'utf-8');
    await execFileAsync('git', ['add', 'notes.md'], { cwd: tempDir });
    await execFileAsync('git', ['commit', '-m', 'second-head-change'], { cwd: tempDir });

    const status = await runCLI(['verify', 'status', 'c1'], { cwd: tempDir });

    expect(status.exitCode).toBe(1);
    expect(status.stdout).toContain('Archive compatibility:');
    expect(status.stdout).toContain('PENDING_VERIFICATION');
    expect(status.stdout).toContain('Suggested actions:');
    expect(status.stdout).toContain('opsx verify phase1 c1');
    expect(status.stdout).toContain('opsx sync c1 --no-verify');
  });

  it('allows SKIPPED to close Phase 2 when optimization is disabled', async () => {
    await fs.writeFile(
      path.join(tempDir, '.opsx', 'config.yaml'),
      'schema: spec-driven\noptimization:\n  enabled: false\n',
      'utf-8'
    );
    await runCLI([
      'verify',
      'phase1',
      'c1',
      '--input',
      JSON.stringify({ result: 'PASS', issues: [], evidenceFiles: ['src/a.ts'] }),
    ], { cwd: tempDir });

    const notNeeded = await runCLI([
      'verify',
      'phase2',
      'c1',
      '--type=optimization',
      '--json',
      '--input',
      JSON.stringify({ status: 'NO_OPTIMIZATION_NEEDED' }),
    ], { cwd: tempDir });
    expect(notNeeded.exitCode).toBe(1);
    expect(JSON.parse(notNeeded.stdout).reason).toBe('optimization.enabled is false');

    const skipped = await runCLI([
      'verify',
      'phase2',
      'c1',
      '--type=optimization',
      '--json',
      '--input',
      JSON.stringify({ status: 'SKIPPED', summary: 'optimization disabled by config' }),
    ], { cwd: tempDir });

    expect(skipped.exitCode).toBe(0);
    expect(JSON.parse(skipped.stdout).result.optimization.status).toBe('SKIPPED');

    const status = await runCLI(['verify', 'status', 'c1', '--json'], { cwd: tempDir });
    expect(status.exitCode).toBe(0);
    expect(JSON.parse(status.stdout).ok).toBe(true);
  });

  it('uses optRetries per finding direction and preserves failedDirections', async () => {
    await fs.writeFile(
      path.join(tempDir, '.opsx', 'config.yaml'),
      'schema: spec-driven\noptimization:\n  enabled: true\n  optRetries: 2\n',
      'utf-8'
    );
    await runCLI(['verify', 'phase1', 'c1', '--input', JSON.stringify({
      result: 'PASS', issues: [], evidenceFiles: ['src/a.ts'],
    })], { cwd: tempDir });
    const proposed = await runCLI(['verify', 'phase2', 'c1', '--type=optimization', '--json', '--input', JSON.stringify({
      status: 'OPTIMIZATION_PROPOSED',
      envelope: {
        blockingObservations: [],
        actions: [{ action: 'add', finding: finding({ keyDesign: 'Extract branch handling' }) }],
        findings: [],
      },
    })], { cwd: tempDir });
    const initial = JSON.parse(proposed.stdout).result.optimization.findings[0];

    await runCLI(['verify', 'phase2', 'c1', '--type=optimization', '--input', JSON.stringify({
      status: 'OPTIMIZATION_PROPOSED', mode: 'begin-implementation', findingId: initial.id,
    })], { cwd: tempDir });
    await fs.writeFile(path.join(tempDir, 'src', 'a.ts'), 'const firstAttempt = true;\n', 'utf-8');
    const firstFailure = await runCLI(['verify', 'phase2', 'c1', '--type=verification', '--json', '--input', JSON.stringify({
      result: 'FAIL_NEEDS_REMEDIATION', findingId: initial.id, issues: [], summary: 'Ordering changed',
    })], { cwd: tempDir });
    const failedFinding = JSON.parse(firstFailure.stdout).result.optimization.findings[0];
    expect(failedFinding.status).toBe('failed');

    const retried = await runCLI(['verify', 'phase2', 'c1', '--type=optimization', '--json', '--input', JSON.stringify({
      status: 'OPTIMIZATION_PROPOSED',
      envelope: {
        blockingObservations: [],
        actions: [{ action: 'retain', findingId: initial.id, reason: 'Revised implementation remains worthwhile' }],
        findings: [failedFinding],
      },
    })], { cwd: tempDir });
    const selected = JSON.parse(retried.stdout).result.optimization.findings[0];
    await runCLI(['verify', 'phase2', 'c1', '--type=optimization', '--input', JSON.stringify({
      status: 'OPTIMIZATION_PROPOSED', mode: 'begin-implementation', findingId: selected.id,
    })], { cwd: tempDir });
    await fs.writeFile(path.join(tempDir, 'src', 'a.ts'), 'const secondAttempt = true;\n', 'utf-8');
    const exhausted = await runCLI(['verify', 'phase2', 'c1', '--type=verification', '--json', '--input', JSON.stringify({
      result: 'FAIL_NEEDS_REMEDIATION', findingId: selected.id, issues: [], summary: 'Errors changed',
    })], { cwd: tempDir });

    const optimization = JSON.parse(exhausted.stdout).result.optimization;
    expect(optimization.findings[0].status).toBe('rejected');
    expect(optimization.status).toBe('PENDING_VERIFICATION');
    expect(optimization.failedDirections).toHaveLength(2);

    const terminal = await runCLI(['verify', 'phase2', 'c1', '--type=optimization', '--json', '--input', JSON.stringify({
      status: 'NO_OPTIMIZATION_NEEDED',
      envelope: { blockingObservations: [], actions: [], findings: [] },
    })], { cwd: tempDir });
    expect(JSON.parse(terminal.stdout).result.optimization.status).toBe('DEGRADED');
  });

  it('recalculates evidenceFingerprint on Phase 2 finding PASS', async () => {
    await runCLI([
      'verify',
      'phase1',
      'c1',
      '--input',
      JSON.stringify({ result: 'PASS', issues: [], evidenceFiles: ['src/a.ts'] }),
    ], { cwd: tempDir });

    const phase1Result = JSON.parse(
      await fs.readFile(path.join(tempDir, '.opsx', 'changes', 'c1', '.verify-result.json'), 'utf-8')
    );
    const phase1Fingerprint = phase1Result.verificationContext.evidenceFingerprint;

    const proposed = await runCLI(['verify', 'phase2', 'c1', '--type=optimization', '--json', '--input', JSON.stringify({
      status: 'OPTIMIZATION_PROPOSED',
      envelope: { blockingObservations: [], actions: [{ action: 'add', finding: finding() }], findings: [] },
    })], { cwd: tempDir });
    const findingId = JSON.parse(proposed.stdout).selectedFindingId;
    await runCLI(['verify', 'phase2', 'c1', '--type=optimization', '--input', JSON.stringify({
      status: 'OPTIMIZATION_PROPOSED', mode: 'begin-implementation', findingId,
    })], { cwd: tempDir });
    await fs.writeFile(path.join(tempDir, 'src', 'a.ts'), 'const optimized = true;\n', 'utf-8');

    await runCLI(['verify', 'phase2', 'c1', '--type=verification', '--json', '--input', JSON.stringify({
      result: 'PASS', findingId, issues: [],
    })], { cwd: tempDir });

    const finalResult = JSON.parse(
      await fs.readFile(path.join(tempDir, '.opsx', 'changes', 'c1', '.verify-result.json'), 'utf-8')
    );
    expect(finalResult.verificationContext.evidenceFingerprint).not.toBe(phase1Fingerprint);
    expect(finalResult.verificationContext.evidenceFingerprintEntries).toEqual([
      expect.objectContaining({ path: 'src/a.ts' }),
    ]);
    expect(finalResult.optimization.status).toBe('PENDING_VERIFICATION');

    const status = await runCLI(['verify', 'status', 'c1', '--json'], { cwd: tempDir });
    expect(status.exitCode).toBe(1);
    expect(JSON.parse(status.stdout).freshness.status).toBe('FRESH');
    expect(JSON.parse(status.stdout).archiveCompatibility.blockReason).toBe('PENDING_VERIFICATION');
  });

  it('does NOT recalculate evidenceFingerprint on DEGRADED path', async () => {
    await fs.writeFile(
      path.join(tempDir, '.opsx', 'config.yaml'),
      'schema: spec-driven\noptimization:\n  enabled: true\n  optRetries: 1\n',
      'utf-8'
    );

    await runCLI([
      'verify',
      'phase1',
      'c1',
      '--input',
      JSON.stringify({ result: 'PASS', issues: [], evidenceFiles: ['src/a.ts'] }),
    ], { cwd: tempDir });

    const phase1Result = JSON.parse(
      await fs.readFile(path.join(tempDir, '.opsx', 'changes', 'c1', '.verify-result.json'), 'utf-8')
    );
    const phase1Fingerprint = phase1Result.verificationContext.evidenceFingerprint;

    const proposed = await runCLI(['verify', 'phase2', 'c1', '--type=optimization', '--json', '--input', JSON.stringify({
      status: 'OPTIMIZATION_PROPOSED',
      envelope: { blockingObservations: [], actions: [{ action: 'add', finding: finding() }], findings: [] },
    })], { cwd: tempDir });
    const findingId = JSON.parse(proposed.stdout).selectedFindingId;
    await runCLI(['verify', 'phase2', 'c1', '--type=optimization', '--input', JSON.stringify({
      status: 'OPTIMIZATION_PROPOSED', mode: 'begin-implementation', findingId,
    })], { cwd: tempDir });
    await fs.writeFile(path.join(tempDir, 'src', 'a.ts'), 'const changed = true;\n', 'utf-8');

    await runCLI(['verify', 'phase2', 'c1', '--type=verification', '--json', '--input', JSON.stringify({
      result: 'FAIL_NEEDS_REMEDIATION', findingId, issues: [], summary: 'Behavior changed',
    })], { cwd: tempDir });

    await runCLI(['verify', 'phase2', 'c1', '--type=optimization', '--json', '--input', JSON.stringify({
      status: 'NO_OPTIMIZATION_NEEDED',
      envelope: { blockingObservations: [], actions: [], findings: [] },
    })], { cwd: tempDir });

    const finalResult = JSON.parse(
      await fs.readFile(path.join(tempDir, '.opsx', 'changes', 'c1', '.verify-result.json'), 'utf-8')
    );
    expect(finalResult.optimization.status).toBe('DEGRADED');
    expect(finalResult.verificationContext.evidenceFingerprint).toBe(phase1Fingerprint);
  });
});
