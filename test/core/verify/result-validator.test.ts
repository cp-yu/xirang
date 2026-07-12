import { describe, expect, it } from 'vitest';
import {
  generateSealHash,
  validateFindingStatusTransition,
  validateOptimizationEnvelope,
  validateOptimizationHistoryAppend,
  validatePhase1Input,
  validatePhase2Input,
  validateVerifyResult,
} from '../../../src/core/verify/result-validator.js';
import type {
  OptimizationEnvelope,
  OptimizationFinding,
  VerifyResult,
} from '../../../src/core/verify/types.js';

describe('verify result validator', () => {
  const finding: OptimizationFinding = {
    id: 'OPT-20260712T140523123Z-01',
    status: 'selected',
    location: { files: ['src/a.ts'], symbols: ['run'] },
    opportunity: 'Repeated linear membership checks',
    impact: 'Avoids repeated scans while preserving membership semantics',
    evidence: ['src/a.ts:10 performs the same lookup inside a loop'],
    recommendation: 'Build a lookup set once before the loop',
    keyDesign: 'Keep iteration order unchanged and use the set only for membership',
    preservationConstraints: ['Preserve input order', 'Preserve duplicate output entries'],
    implementationOutline: ['Create the set before iteration', 'Replace membership scans'],
    validation: ['Run the existing membership behavior tests'],
    impactLevel: 'high',
    confidence: 'high',
    risk: 'low',
    cost: 'low',
    dependencies: [],
    priorityReason: 'Highest impact and confidence with lower risk than remaining findings',
  };

  const validEnvelope: OptimizationEnvelope = {
    blockingObservations: [],
    actions: [{ action: 'retain', findingId: 'OPT-20260712T140523123Z-01', reason: 'Still applies' }],
    findings: [finding],
  };

  const validResult: VerifyResult = {
    timestamp: '2026-05-01T00:00:00.000Z',
    result: 'PASS',
    issues: [],
    tasksFileHash: 'a'.repeat(64),
    verificationContext: {
      contractVersion: '1.0',
      evidenceFiles: ['src/a.ts'],
      evidenceFingerprint: 'b'.repeat(64),
    },
    optimization: {
      status: 'PENDING_VERIFICATION',
      attempts: [],
      findings: [finding],
      history: [{ sequence: 1, action: 'retain', findingId: 'OPT-20260712T140523123Z-01', reason: 'Still applies' }],
    },
  };

  it('validates Phase 1 input', () => {
    expect(validatePhase1Input({
      result: 'PASS',
      issues: [],
      evidenceFiles: ['src/a.ts'],
    }).valid).toBe(true);

    const invalid = validatePhase1Input({ result: 'BAD', issues: 'nope' });
    expect(invalid.valid).toBe(false);
    expect(invalid.errors).toContain('result must be PASS, PASS_WITH_WARNINGS, or FAIL_NEEDS_REMEDIATION');
  });

  it('validates finding envelopes and rejects optimizer-owned IDs on add actions', () => {
    expect(validateOptimizationEnvelope(validEnvelope).valid).toBe(true);

    const missingField = validateOptimizationEnvelope({
      ...validEnvelope,
      findings: [{ ...finding, keyDesign: undefined }],
    });
    expect(missingField.valid).toBe(false);
    expect(missingField.errors).toContain('findings[0].keyDesign must be a non-empty string');

    const optimizerOwnedId = validateOptimizationEnvelope({
      blockingObservations: [],
      actions: [{ action: 'add', finding: { ...finding, id: 'OPT-999' } }],
      findings: [{ ...finding, id: 'OPT-20260712T140523123Z-02' }],
    });
    expect(optimizerOwnedId.valid).toBe(false);
    expect(optimizerOwnedId.errors).toContain('actions[0].finding.id must be omitted for add');
  });

  it('accepts actionIndex dependencies for findings added in the same envelope', () => {
    const first = { ...finding, id: undefined, status: 'pending' as const, dependencies: [] };
    const second = {
      ...finding,
      id: undefined,
      status: 'pending' as const,
      opportunity: 'Dependent optimization',
      dependencies: [{ actionIndex: 0 }],
    };
    const result = validateOptimizationEnvelope({
      blockingObservations: [],
      actions: [
        { action: 'add', finding: first },
        { action: 'add', finding: second },
      ],
      findings: [],
    });

    expect(result.valid).toBe(true);
  });

  it('validates Phase 2 inputs by type', () => {
    expect(validatePhase2Input({ status: 'NO_OPTIMIZATION_NEEDED' }, 'optimization').valid).toBe(true);
    expect(validatePhase2Input({ status: 'OPTIMIZATION_PROPOSED' }, 'optimization').valid).toBe(true);
    expect(validatePhase2Input({ result: 'PASS', issues: [] }, 'verification').valid).toBe(true);

    expect(validatePhase2Input({ result: 'NOPE' }, 'verification').valid).toBe(false);
  });

  it('validates finding state transitions and append-only history updates', () => {
    expect(validateFindingStatusTransition('pending', 'selected').valid).toBe(true);
    expect(validateFindingStatusTransition('selected', 'implemented').valid).toBe(true);
    expect(validateFindingStatusTransition('implemented', 'verified').valid).toBe(true);
    expect(validateFindingStatusTransition('failed', 'pending').valid).toBe(true);
    expect(validateFindingStatusTransition('pending', 'verified').valid).toBe(false);
    expect(validateFindingStatusTransition('resolved', 'pending').valid).toBe(false);

    const previous = [{ sequence: 1, action: 'retain' as const, findingId: 'OPT-20260712T140523123Z-01', reason: 'Still applies' }];
    expect(validateOptimizationHistoryAppend(previous, [
      ...previous,
      { sequence: 2, action: 'select', findingId: 'OPT-20260712T140523123Z-01', reason: 'Highest priority' },
    ]).valid).toBe(true);
    expect(validateOptimizationHistoryAppend(previous, [
      { ...previous[0], reason: 'Overwritten' },
    ]).valid).toBe(false);
    expect(validateOptimizationHistoryAppend(previous, []).valid).toBe(false);

    const duplicateSelected = validateVerifyResult({
      ...validResult,
      optimization: {
        ...validResult.optimization,
        findings: [finding, { ...finding, id: 'OPT-20260712T140523123Z-02' }],
      },
    });
    expect(duplicateSelected.valid).toBe(false);
    expect(duplicateSelected.errors).toContain('optimization.findings must contain at most one selected finding');

    const invalidStatus = validateVerifyResult({
      ...validResult,
      optimization: {
        ...validResult.optimization,
        findings: [{ ...finding, status: 'unknown' }],
      },
    });
    expect(invalidStatus.valid).toBe(false);
    expect(invalidStatus.errors).toContain('optimization.findings[0].status is invalid');

    const invalidHistory = validateVerifyResult({
      ...validResult,
      optimization: {
        ...validResult.optimization,
        history: [{ sequence: 0, action: 'overwrite', findingId: 'OPT-20260712T140523123Z-01', reason: '' }],
      },
    });
    expect(invalidHistory.valid).toBe(false);
    expect(invalidHistory.errors).toContain('optimization.history[0].action is invalid');

    const invalidStallMetadata = validateVerifyResult({
      ...validResult,
      optimization: {
        ...validResult.optimization,
        reconciliationSignature: 'invalid',
        unchangedReconciliations: -1,
      },
    });
    expect(invalidStallMetadata.valid).toBe(false);
    expect(invalidStallMetadata.errors).toContain('optimization.reconciliationSignature must be a sha256 hex string');
    expect(invalidStallMetadata.errors).toContain('optimization.unchangedReconciliations must be a non-negative integer');
  });

  it('accepts legacy results without findings or history', () => {
    expect(validateVerifyResult({
      ...validResult,
      optimization: { status: 'NOT_NEEDED', attempts: [] },
    }).valid).toBe(true);
  });

  it('validates .verify-result.json shape and generates stable seal hashes', () => {
    expect(validateVerifyResult(validResult).valid).toBe(true);
    expect(validateVerifyResult({
      ...validResult,
      optimization: {
        status: 'DEGRADED',
        attempts: [],
        failedDirections: ['simplify src/a.ts branch handling'],
      },
    }).valid).toBe(true);
    expect(validateVerifyResult({
      ...validResult,
      optimization: {
        status: 'DEGRADED',
        attempts: [],
        failedDirections: [123],
      },
    }).valid).toBe(false);
    expect(validateVerifyResult({ ...validResult, tasksFileHash: 'bad' }).valid).toBe(false);

    const hash1 = generateSealHash(validResult);
    const hash2 = generateSealHash({
      ...validResult,
      verificationContext: { ...validResult.verificationContext },
    });
    expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    expect(hash2).toBe(hash1);
  });
});
