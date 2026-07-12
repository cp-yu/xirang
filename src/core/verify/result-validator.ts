import { createHash } from 'crypto';
import type {
  OptimizationEnvelope,
  OptimizationFinding,
  OptimizationFindingStatus,
  OptimizationHistoryEvent,
  Phase2Input,
  Phase2OptimizationInput,
  Phase2Type,
  Phase2VerificationInput,
  Phase1Input,
  ValidationResult,
  VerifyIssue,
  VerifyResult,
} from './types.js';

const PHASE1_RESULTS = new Set(['PASS', 'PASS_WITH_WARNINGS', 'FAIL_NEEDS_REMEDIATION']);
const OPTIMIZATION_INPUT_STATUSES = new Set([
  'NO_OPTIMIZATION_NEEDED',
  'OPTIMIZATION_PROPOSED',
  'ABORTED_UNSAFE',
  'SKIPPED',
]);
const OPTIMIZATION_STATUSES = new Set([
  'SKIPPED',
  'NOT_NEEDED',
  'PENDING_VERIFICATION',
  'IMPROVED',
  'DEGRADED',
  'ABORTED_UNSAFE',
]);
const FINDING_STATUSES = new Set([
  'pending',
  'selected',
  'implemented',
  'verified',
  'resolved',
  'failed',
  'rejected',
  'invalidated',
  'deferred',
  'merged',
]);
const FINDING_LEVELS = new Set(['high', 'medium', 'low']);
const RECONCILIATION_ACTIONS = new Set([
  'add',
  'retain',
  'reprioritize',
  'resolve',
  'invalidate',
  'reject',
  'merge',
  'masterChallenge',
]);
const HISTORY_ACTIONS = new Set([
  ...RECONCILIATION_ACTIONS,
  'select',
  'implemented',
  'verified',
  'failed',
  'stalled',
]);
const FINDING_ID_PATTERN = /^OPT-\d{8}T\d{9}Z-\d{2,}$/;

export function validatePhase1Input(input: unknown): ValidationResult<Phase1Input> {
  const errors: string[] = [];
  if (!isRecord(input)) {
    return { valid: false, errors: ['input must be a JSON object'] };
  }

  if (!PHASE1_RESULTS.has(String(input.result))) {
    errors.push('result must be PASS, PASS_WITH_WARNINGS, or FAIL_NEEDS_REMEDIATION');
  }
  if (!Array.isArray(input.issues)) {
    errors.push('issues must be an array');
  } else {
    errors.push(...validateIssues(input.issues, 'issues'));
  }
  if (!Array.isArray(input.evidenceFiles) || !input.evidenceFiles.every((item) => typeof item === 'string')) {
    errors.push('evidenceFiles must be an array of strings');
  }

  return finishValidation(input as unknown as Phase1Input, errors);
}

export function validatePhase2Input(
  input: unknown,
  type: Phase2Type
): ValidationResult<Phase2Input> {
  if (type === 'optimization') {
    return validateOptimizationInput(input);
  }
  return validateVerificationInput(input);
}

export function validateOptimizationEnvelope(
  envelope: unknown
): ValidationResult<OptimizationEnvelope> {
  const errors: string[] = [];
  if (!isRecord(envelope)) {
    return { valid: false, errors: ['optimization envelope must be a JSON object'] };
  }

  if (!Array.isArray(envelope.blockingObservations)) {
    errors.push('blockingObservations must be an array');
  } else {
    envelope.blockingObservations.forEach((observation, index) => {
      if (!isRecord(observation)) {
        errors.push(`blockingObservations[${index}] must be an object`);
        return;
      }
      validateNonEmptyString(observation.location, `blockingObservations[${index}].location`, errors);
      validateNonEmptyString(observation.issue, `blockingObservations[${index}].issue`, errors);
      validateStringArray(observation.evidence, `blockingObservations[${index}].evidence`, errors);
    });
  }

  if (!Array.isArray(envelope.actions)) {
    errors.push('actions must be an array');
  } else {
    envelope.actions.forEach((action, index) => validateReconciliationAction(action, `actions[${index}]`, errors));
  }

  if (!Array.isArray(envelope.findings)) {
    errors.push('findings must be an array');
  } else {
    envelope.findings.forEach((finding, index) => validateFinding(finding, `findings[${index}]`, errors));
    validateFindingCollection(envelope.findings, 'findings', errors);
  }

  return finishValidation(envelope as unknown as OptimizationEnvelope, errors);
}

export function validateFindingStatusTransition(
  from: OptimizationFindingStatus,
  to: OptimizationFindingStatus
): ValidationResult<OptimizationFindingStatus> {
  const transitions: Record<OptimizationFindingStatus, readonly OptimizationFindingStatus[]> = {
    pending: ['selected', 'invalidated', 'deferred', 'merged', 'rejected'],
    selected: ['implemented', 'pending', 'invalidated', 'rejected', 'merged'],
    implemented: ['verified', 'failed'],
    verified: ['resolved', 'pending'],
    failed: ['pending', 'rejected'],
    resolved: [],
    rejected: [],
    invalidated: [],
    deferred: ['pending', 'invalidated', 'merged', 'rejected'],
    merged: [],
  };
  const errors = transitions[from]?.includes(to)
    ? []
    : [`illegal finding status transition: ${from} -> ${to}`];
  return finishValidation(to, errors);
}

export function validateOptimizationHistoryAppend(
  previous: OptimizationHistoryEvent[],
  next: OptimizationHistoryEvent[]
): ValidationResult<OptimizationHistoryEvent[]> {
  const errors: string[] = [];
  if (next.length < previous.length) {
    errors.push('optimization history must be append-only');
  } else {
    for (let index = 0; index < previous.length; index += 1) {
      if (stableStringify(previous[index]) !== stableStringify(next[index])) {
        errors.push('optimization history must preserve existing events');
        break;
      }
    }
  }
  for (let index = previous.length; index < next.length; index += 1) {
    if (next[index]?.sequence !== index + 1) {
      errors.push('appended optimization history sequence must be contiguous');
      break;
    }
  }
  return finishValidation(next, errors);
}

export function validateVerifyResult(result: unknown): ValidationResult<VerifyResult> {
  const errors: string[] = [];
  if (!isRecord(result)) {
    return { valid: false, errors: ['verify result must be a JSON object'] };
  }

  if (typeof result.timestamp !== 'string' || result.timestamp.length === 0) {
    errors.push('timestamp must be a non-empty string');
  }
  if (!PHASE1_RESULTS.has(String(result.result))) {
    errors.push('result must be PASS, PASS_WITH_WARNINGS, or FAIL_NEEDS_REMEDIATION');
  }
  if (!Array.isArray(result.issues)) {
    errors.push('issues must be an array');
  } else {
    errors.push(...validateIssues(result.issues, 'issues'));
  }
  if (typeof result.tasksFileHash !== 'string' || !/^[a-f0-9]{64}$/.test(result.tasksFileHash)) {
    errors.push('tasksFileHash must be a sha256 hex string');
  }

  const context = result.verificationContext;
  if (!isRecord(context)) {
    errors.push('verificationContext must be an object');
  } else {
    if (context.contractVersion !== '1.0') {
      errors.push('verificationContext.contractVersion must be "1.0"');
    }
    if (!Array.isArray(context.evidenceFiles) || !context.evidenceFiles.every((item) => typeof item === 'string')) {
      errors.push('verificationContext.evidenceFiles must be an array of strings');
    }
    if (typeof context.evidenceFingerprint !== 'string' || !/^[a-f0-9]{64}$/.test(context.evidenceFingerprint)) {
      errors.push('verificationContext.evidenceFingerprint must be a sha256 hex string');
    }
    if (
      context.evidenceFingerprintEntries !== undefined &&
      (!Array.isArray(context.evidenceFingerprintEntries) ||
        !context.evidenceFingerprintEntries.every(
          (entry) =>
            isRecord(entry) &&
            typeof entry.path === 'string' &&
            typeof entry.hash === 'string' &&
            /^[a-f0-9]{64}$/.test(entry.hash)
        ))
    ) {
      errors.push('verificationContext.evidenceFingerprintEntries must be an array of { path, hash }');
    }
  }

  if (result.optimization !== undefined) {
    const optimization = result.optimization;
    if (!isRecord(optimization)) {
      errors.push('optimization must be an object');
    } else {
      if (!OPTIMIZATION_STATUSES.has(String(optimization.status))) {
        errors.push('optimization.status is invalid');
      }
      if (!Array.isArray(optimization.attempts)) {
        errors.push('optimization.attempts must be an array');
      }
      if (
        optimization.failedDirections !== undefined &&
        (!Array.isArray(optimization.failedDirections) ||
          !optimization.failedDirections.every((item) => typeof item === 'string'))
      ) {
        errors.push('optimization.failedDirections must be an array of strings');
      }
      if (
        optimization.affectedFileHashes !== undefined &&
        !isHashRecord(optimization.affectedFileHashes)
      ) {
        errors.push('optimization.affectedFileHashes must map paths to sha256 hex strings');
      }
      if (
        optimization.reconciliationSignature !== undefined &&
        (typeof optimization.reconciliationSignature !== 'string' ||
          !/^[a-f0-9]{64}$/.test(optimization.reconciliationSignature))
      ) {
        errors.push('optimization.reconciliationSignature must be a sha256 hex string');
      }
      if (
        optimization.unchangedReconciliations !== undefined &&
        (typeof optimization.unchangedReconciliations !== 'number' ||
          !Number.isInteger(optimization.unchangedReconciliations) ||
          optimization.unchangedReconciliations < 0)
      ) {
        errors.push('optimization.unchangedReconciliations must be a non-negative integer');
      }
      if (optimization.findings !== undefined) {
        if (!Array.isArray(optimization.findings)) {
          errors.push('optimization.findings must be an array');
        } else {
          optimization.findings.forEach((finding, index) =>
            validateFinding(finding, `optimization.findings[${index}]`, errors)
          );
          validateFindingCollection(optimization.findings, 'optimization.findings', errors);
        }
      }
      if (optimization.history !== undefined) {
        if (!Array.isArray(optimization.history)) {
          errors.push('optimization.history must be an array');
        } else {
          optimization.history.forEach((event, index) =>
            validateHistoryEvent(event, `optimization.history[${index}]`, errors)
          );
          const sequences = optimization.history
            .filter(isRecord)
            .map((event) => event.sequence);
          if (new Set(sequences).size !== sequences.length) {
            errors.push('optimization.history sequence values must be unique');
          }
        }
      }
    }
  }

  return finishValidation(result as unknown as VerifyResult, errors);
}

export function generateSealHash(result: VerifyResult): string {
  const copy = JSON.parse(JSON.stringify(result)) as Record<string, unknown>;
  delete copy.sealHash;
  return createHash('sha256').update(stableStringify(copy)).digest('hex');
}

function validateOptimizationInput(input: unknown): ValidationResult<Phase2OptimizationInput> {
  const errors: string[] = [];
  if (!isRecord(input)) {
    return { valid: false, errors: ['input must be a JSON object'] };
  }
  if (!OPTIMIZATION_INPUT_STATUSES.has(String(input.status))) {
    errors.push(
      'status must be NO_OPTIMIZATION_NEEDED, OPTIMIZATION_PROPOSED, ABORTED_UNSAFE, or SKIPPED'
    );
  }
  if (input.attempts !== undefined && !Array.isArray(input.attempts)) {
    errors.push('attempts must be an array when provided');
  }
  if (input.mode !== undefined && input.mode !== 'reconcile' && input.mode !== 'begin-implementation') {
    errors.push('mode must be reconcile or begin-implementation when provided');
  }
  if (input.findingId !== undefined) {
    validateFindingId(input.findingId, 'findingId', errors);
  }
  if (input.envelope !== undefined) {
    const envelope = validateOptimizationEnvelope(input.envelope);
    errors.push(...envelope.errors.map((error) => `envelope.${error}`));
  }
  return finishValidation(input as Phase2OptimizationInput, errors);
}

function validateVerificationInput(input: unknown): ValidationResult<Phase2VerificationInput> {
  const errors: string[] = [];
  if (!isRecord(input)) {
    return { valid: false, errors: ['input must be a JSON object'] };
  }
  if (!PHASE1_RESULTS.has(String(input.result))) {
    errors.push('result must be PASS, PASS_WITH_WARNINGS, or FAIL_NEEDS_REMEDIATION');
  }
  if (input.issues !== undefined) {
    if (!Array.isArray(input.issues)) {
      errors.push('issues must be an array when provided');
    } else {
      errors.push(...validateIssues(input.issues, 'issues'));
    }
  }
  if (input.findingId !== undefined) {
    validateFindingId(input.findingId, 'findingId', errors);
  }
  return finishValidation(input as Phase2VerificationInput, errors);
}

function validateIssues(issues: unknown[], path: string): string[] {
  const errors: string[] = [];
  issues.forEach((issue, index) => {
    if (!isRecord(issue)) {
      errors.push(`${path}[${index}] must be an object`);
      return;
    }
    if (typeof issue.severity !== 'string' || issue.severity.length === 0) {
      errors.push(`${path}[${index}].severity must be a non-empty string`);
    }
    if (typeof issue.message !== 'string' || issue.message.length === 0) {
      errors.push(`${path}[${index}].message must be a non-empty string`);
    }
  });
  return errors;
}

function validateFinding(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }

  if (typeof value.id !== 'string' || !FINDING_ID_PATTERN.test(value.id)) {
    errors.push(`${path}.id must match OPT-NNN`);
  }
  if (!FINDING_STATUSES.has(String(value.status))) {
    errors.push(`${path}.status is invalid`);
  }
  if (!isRecord(value.location)) {
    errors.push(`${path}.location must be an object`);
  } else {
    validateStringArray(value.location.files, `${path}.location.files`, errors, true);
    if (value.location.symbols !== undefined) {
      validateStringArray(value.location.symbols, `${path}.location.symbols`, errors);
    }
  }
  for (const field of [
    'opportunity',
    'impact',
    'recommendation',
    'keyDesign',
    'priorityReason',
  ]) {
    validateNonEmptyString(value[field], `${path}.${field}`, errors);
  }
  for (const field of [
    'evidence',
    'preservationConstraints',
    'implementationOutline',
    'validation',
  ]) {
    validateStringArray(value[field], `${path}.${field}`, errors, true);
  }
  validateFindingIds(value.dependencies, `${path}.dependencies`, errors, false);
  for (const field of ['impactLevel', 'confidence', 'risk', 'cost']) {
    if (!FINDING_LEVELS.has(String(value[field]))) {
      errors.push(`${path}.${field} must be high, medium, or low`);
    }
  }
  if (value.targetFileHashes !== undefined && !isHashRecord(value.targetFileHashes)) {
    errors.push(`${path}.targetFileHashes must map paths to sha256 hex strings`);
  }
  if (
    value.failureCount !== undefined &&
    (typeof value.failureCount !== 'number' || !Number.isInteger(value.failureCount) || value.failureCount < 0)
  ) {
    errors.push(`${path}.failureCount must be a non-negative integer`);
  }
}

function validateFindingCollection(findings: unknown[], path: string, errors: string[]): void {
  const records = findings.filter(isRecord);
  const ids = records.map((finding) => finding.id).filter((id): id is string => typeof id === 'string');
  if (new Set(ids).size !== ids.length) {
    errors.push(`${path} IDs must be unique`);
  }
  if (records.filter((finding) => finding.status === 'selected').length > 1) {
    errors.push(`${path} must contain at most one selected finding`);
  }
}

function validateReconciliationAction(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  if (!RECONCILIATION_ACTIONS.has(String(value.action))) {
    errors.push(`${path}.action is invalid`);
    return;
  }
  if (value.action === 'add' || value.action === 'merge') {
    if (!isRecord(value.finding)) {
      errors.push(`${path}.finding must be an object`);
    } else {
      if (value.finding.id !== undefined) {
        errors.push(`${path}.finding.id must be omitted for ${value.action}`);
      }
      validateNewFinding(value.finding, `${path}.finding`, errors);
    }
  }
  if (value.action === 'merge') {
    validateFindingIds(value.findingIds, `${path}.findingIds`, errors, true);
  } else if (value.action !== 'add') {
    validateFindingId(value.findingId, `${path}.findingId`, errors);
  }
  if (value.action !== 'add') {
    validateNonEmptyString(value.reason, `${path}.reason`, errors);
  }
  if (value.action === 'masterChallenge') {
    validateStringArray(value.evidence, `${path}.evidence`, errors, true);
  }
}

function validateNewFinding(value: Record<string, unknown>, path: string, errors: string[]): void {
  if (value.status !== 'pending' && value.status !== 'deferred') {
    errors.push(`${path}.status must be pending or deferred`);
  }
  const dependencies = value.dependencies;
  validateFinding(
    {
      ...value,
      id: 'OPT-20000101T000000000Z-00',
      dependencies: Array.isArray(dependencies)
        ? dependencies.filter((dependency) => typeof dependency === 'string')
        : dependencies,
    },
    path,
    errors
  );
  if (!Array.isArray(dependencies)) {
    return;
  }
  dependencies.forEach((dependency, index) => {
    if (typeof dependency === 'string') {
      validateFindingId(dependency, `${path}.dependencies[${index}]`, errors);
      return;
    }
    if (
      !isRecord(dependency) ||
      typeof dependency.actionIndex !== 'number' ||
      !Number.isInteger(dependency.actionIndex) ||
      dependency.actionIndex < 0
    ) {
      errors.push(`${path}.dependencies[${index}] must be a finding ID or non-negative actionIndex`);
    }
  });
}

function validateHistoryEvent(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  if (typeof value.sequence !== 'number' || !Number.isInteger(value.sequence) || value.sequence < 1) {
    errors.push(`${path}.sequence must be a positive integer`);
  }
  if (!HISTORY_ACTIONS.has(String(value.action))) {
    errors.push(`${path}.action is invalid`);
  }
  if (value.findingId !== undefined) {
    validateFindingId(value.findingId, `${path}.findingId`, errors);
  }
  if (value.findingIds !== undefined) {
    validateFindingIds(value.findingIds, `${path}.findingIds`, errors, true);
  }
  validateNonEmptyString(value.reason, `${path}.reason`, errors);
  if (value.evidence !== undefined) {
    validateStringArray(value.evidence, `${path}.evidence`, errors);
  }
  if (value.hashes !== undefined && !isHashRecord(value.hashes)) {
    errors.push(`${path}.hashes must map paths to sha256 hex strings`);
  }
}

function validateFindingId(value: unknown, path: string, errors: string[]): void {
  if (typeof value !== 'string' || !FINDING_ID_PATTERN.test(value)) {
    errors.push(`${path} must match OPT-<UTC timestamp>-<batch index>`);
  }
}

function validateFindingIds(value: unknown, path: string, errors: string[], requireNonEmpty: boolean): void {
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string' && FINDING_ID_PATTERN.test(item))) {
    errors.push(`${path} must be an array of finding IDs`);
  } else if (requireNonEmpty && value.length === 0) {
    errors.push(`${path} must not be empty`);
  }
}

function validateNonEmptyString(value: unknown, path: string, errors: string[]): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    errors.push(`${path} must be a non-empty string`);
  }
}

function validateStringArray(
  value: unknown,
  path: string,
  errors: string[],
  requireNonEmpty = false
): void {
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string' && item.trim().length > 0)) {
    errors.push(`${path} must be an array of non-empty strings`);
  } else if (requireNonEmpty && value.length === 0) {
    errors.push(`${path} must not be empty`);
  }
}

function isHashRecord(value: unknown): boolean {
  return isRecord(value) && Object.values(value).every(
    (hash) => typeof hash === 'string' && /^[a-f0-9]{64}$/.test(hash)
  );
}

function finishValidation<T>(value: T, errors: string[]): ValidationResult<T> {
  return errors.length === 0
    ? { valid: true, value, errors: [] }
    : { valid: false, errors };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}
