import { describe, expect, it } from 'vitest';
import {
  allocateDirectionIds,
  deriveTerminal,
  selectEligibleDirection,
  validateDirectionPayload,
  validateDirectionTransition,
  validateOptimizeInput,
  validateReviewInput,
} from '../../../src/core/quality/validators.js';
import type { OptimizationDirection } from '../../../src/core/quality/types.js';

function direction(overrides: Record<string, unknown> = {}) {
  return {
    location: { files: ['src/a.ts'] },
    opportunity: 'Repeated scan',
    impact: 'Avoid repeated work',
    evidence: ['src/a.ts scans twice'],
    recommendation: 'Use a set',
    keyDesign: 'Build the set before the loop',
    preservationConstraints: ['Preserve behavior'],
    implementationOutline: ['Build the set'],
    validation: ['Run tests'],
    impactLevel: 'high',
    confidence: 'high',
    risk: 'low',
    cost: 'low',
    dependencies: [],
    priorityReason: 'Highest impact',
    ...overrides,
  };
}

function stored(overrides: Partial<OptimizationDirection> = {}): OptimizationDirection {
  return {
    ...(direction() as unknown as OptimizationDirection),
    id: 'OPT-20260501T000000000Z-01',
    status: 'pending',
    failureCount: 0,
    ...overrides,
  };
}

describe('quality validators', () => {
  it('accepts a canonical review input', () => {
    const result = validateReviewInput({
      result: 'PASS_WITH_WARNINGS',
      issues: [{ severity: 'WARNING', message: 'note' }],
      evidenceFiles: ['src/a.ts'],
      summary: 'reviewed',
    });

    expect(result.ok).toBe(true);
    expect(result.value?.evidenceFiles).toEqual(['src/a.ts']);
  });

  it('reports a diagnostic for every invalid review field', () => {
    const result = validateReviewInput({ result: 'OK', issues: 'none', evidenceFiles: ['src/a.ts', 7] });

    expect(result.ok).toBe(false);
    expect(result.diagnostics.map((item) => item.path)).toEqual(['result', 'issues', 'evidenceFiles[1]']);
    for (const diagnostic of result.diagnostics) {
      expect(diagnostic.expected.length).toBeGreaterThan(0);
      expect(diagnostic.actual.length).toBeGreaterThan(0);
      expect(diagnostic.fix.length).toBeGreaterThan(0);
    }
  });

  it('rejects CLI-managed review fields', () => {
    const result = validateReviewInput({
      result: 'PASS',
      issues: [],
      evidenceFiles: ['src/a.ts'],
      verificationContext: {},
    });

    expect(result.ok).toBe(false);
    expect(result.diagnostics[0].path).toBe('verificationContext');
    expect(result.diagnostics[0].fix).toContain('CLI');
  });

  it('rejects a review without evidence files', () => {
    const result = validateReviewInput({ result: 'PASS', issues: [], evidenceFiles: [] });

    expect(result.ok).toBe(false);
    expect(result.diagnostics.map((item) => item.path)).toContain('evidenceFiles');
  });

  it('requires a summary whenever stopReason finalizes the loop', () => {
    const missing = validateOptimizeInput({ directions: [], stopReason: 'NO_ACTIONABLE' });
    expect(missing.ok).toBe(false);
    expect(missing.diagnostics.map((item) => item.path)).toContain('summary');

    const blank = validateOptimizeInput({ directions: [], stopReason: 'NO_ACTIONABLE', summary: '  ' });
    expect(blank.ok).toBe(false);
    expect(blank.diagnostics.map((item) => item.path)).toContain('summary');

    expect(validateOptimizeInput({ directions: [], summary: 'round note' }).ok).toBe(true);
  });

  it('rejects a payload that tries to set the ledger baseline commit', () => {
    const result = validateOptimizeInput({ directions: [], baselineCommit: 'a'.repeat(40) });

    expect(result.ok).toBe(false);
    expect(result.diagnostics.map((item) => item.path)).toContain('baselineCommit');
  });

  it('rejects unknown keys and managed ledger fields in an optimize input', () => {
    expect(validateOptimizeInput({ directions: [], surprise: true }).diagnostics[0].path).toBe('surprise');
    expect(validateOptimizeInput({ directions: [], histories: [] }).diagnostics[0].path).toBe('histories');
    expect(validateOptimizeInput({ directions: [], stopReason: 'MAYBE' }).diagnostics[0]).toEqual(
      expect.objectContaining({ path: 'stopReason' })
    );
  });

  it('accepts a full optimization round input', () => {
    const result = validateOptimizeInput({
      directions: [direction()],
      selected: 'OPT-20260501T000000000Z-01',
      attempt: { directionId: 'OPT-20260501T000000000Z-01', status: 'verified' },
      stopReason: 'NO_ACTIONABLE',
      summary: 'optimizer found no eligible direction',
    });

    expect(result.ok, JSON.stringify(result.diagnostics)).toBe(true);
  });

  it('validates direction payload required fields and levels', () => {
    const result = validateDirectionPayload({ ...(direction() as object), impactLevel: 'huge', evidence: [] }, 'directions[0]');

    expect(result.ok).toBe(false);
    expect(result.diagnostics.map((item) => item.path)).toEqual(
      expect.arrayContaining(['directions[0].impactLevel', 'directions[0].evidence'])
    );
  });

  it('requires a reason and evidence when an optimizer revokes a direction', () => {
    const result = validateDirectionPayload(
      { id: 'OPT-20260501T000000000Z-01', status: 'deferred' },
      'directions[0]'
    );

    expect(result.ok).toBe(false);
    expect(result.diagnostics.map((item) => item.path)).toEqual([
      'directions[0].reason',
      'directions[0].evidence',
    ]);
  });

  it('writes diagnostics without markup', () => {
    const result = validateOptimizeInput({ directions: [{ id: 'handmade' }] });

    expect(result.ok).toBe(false);
    const idDiagnostic = result.diagnostics.find((item) => item.path === 'directions[0].id');
    expect(idDiagnostic).toBeDefined();
    for (const diagnostic of result.diagnostics) {
      expect(diagnostic.fix, diagnostic.fix).not.toContain('role=');
      expect(diagnostic.expected, diagnostic.expected).not.toContain('role=');
    }
  });

  it('checks direction status transitions', () => {
    expect(validateDirectionTransition('pending', 'selected')).toBeUndefined();
    expect(validateDirectionTransition('failed', 'rejected')).toBeUndefined();
    expect(validateDirectionTransition('verified', 'pending')).toEqual(
      expect.objectContaining({ path: 'status' })
    );
  });

  it('derives the terminal state from the stop reason', () => {
    expect(deriveTerminal('USER_DECLINED', false)).toBe('SKIPPED');
    expect(deriveTerminal('NO_ACTIONABLE', false)).toBe('NOT_NEEDED');
    expect(deriveTerminal('UNSAFE', false)).toBe('ABORTED_UNSAFE');
    expect(deriveTerminal('DIRECTION_REJECTED', false)).toBe('DEGRADED');
    expect(deriveTerminal('DIRECTION_REJECTED', true)).toBe('IMPROVED');
    expect(deriveTerminal('DIRECTION_LIMIT_REACHED', true)).toBe('IMPROVED');
  });

  it('selects the highest priority direction whose dependencies are verified', () => {
    const prerequisite = stored({ id: 'OPT-1', impactLevel: 'low' });
    const dependent = stored({
      id: 'OPT-2',
      impactLevel: 'high',
      dependencies: ['OPT-1'],
    });
    const independent = stored({ id: 'OPT-3', impactLevel: 'medium' });

    expect(selectEligibleDirection([prerequisite, dependent, independent])?.id).toBe('OPT-3');
    expect(
      selectEligibleDirection([{ ...prerequisite, status: 'verified' }, dependent, independent])?.id
    ).toBe('OPT-2');
    expect(selectEligibleDirection([dependent])).toBeUndefined();
  });

  it('prefers higher impact, higher confidence, lower risk and lower cost', () => {
    const findings = [
      stored({ id: 'OPT-a', impactLevel: 'high', confidence: 'low', risk: 'low', cost: 'low' }),
      stored({ id: 'OPT-b', impactLevel: 'high', confidence: 'high', risk: 'high', cost: 'low' }),
      stored({ id: 'OPT-c', impactLevel: 'high', confidence: 'high', risk: 'low', cost: 'high' }),
      stored({ id: 'OPT-d', impactLevel: 'high', confidence: 'high', risk: 'low', cost: 'low' }),
    ];

    expect(selectEligibleDirection(findings)?.id).toBe('OPT-d');
  });

  it('allocates distinct sequential direction ids', () => {
    const ids = allocateDirectionIds(3);

    expect(new Set(ids).size).toBe(3);
    expect(ids[0]).toMatch(/^OPT-\d{8}T\d{9}Z-01$/);
    expect(ids[2]).toMatch(/-03$/);
  });
});
