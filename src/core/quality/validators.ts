import { createHash } from 'crypto';
import type {
  Diagnostic,
  DirectionAttemptInput,
  DirectionLevel,
  DirectionStatus,
  DirectionUpdatePayload,
  NewDirectionPayload,
  OptimizationDirection,
  OptimizationStopReason,
  OptimizationTerminal,
  OptimizeInput,
  QualityRecord,
  ReviewInput,
  ReviewResultStatus,
} from './types.js';

export const REVIEW_RESULT_VALUES: readonly ReviewResultStatus[] = [
  'PASS',
  'PASS_WITH_WARNINGS',
  'FAIL_NEEDS_CORRECTIONS',
];

export const DIRECTION_STATUS_VALUES: readonly DirectionStatus[] = [
  'pending',
  'selected',
  'implemented',
  'verified',
  'failed',
  'rejected',
  'deferred',
];

export const DIRECTION_LEVEL_VALUES: readonly DirectionLevel[] = ['high', 'medium', 'low'];

export const STOP_REASON_VALUES: readonly OptimizationStopReason[] = [
  'USER_DECLINED',
  'NO_ACTIONABLE',
  'DIRECTION_REJECTED',
  'DIRECTION_LIMIT_REACHED',
  'UNSAFE',
];

export const REVIEW_INPUT_FIELDS = [
  'result',
  'issues',
  'evidenceFiles',
  'summary',
  'writeBackPlan',
  'executionMode',
  'gitDiffSummary',
] as const;

export const REVIEW_MANAGED_FIELDS = [
  'kind',
  'timestamp',
  'tasksFileHash',
  'verificationContext',
  'optimization',
  'sealHash',
] as const;

export const OPTIMIZE_INPUT_FIELDS = ['directions', 'selected', 'attempt', 'stopReason', 'summary'] as const;

export const LEDGER_MANAGED_FIELDS = ['histories', 'directionsUsed', 'terminal'] as const;

export const DIRECTION_UPDATE_FIELDS = ['id', 'status', 'reason', 'evidence'] as const;

export const DIRECTION_REVOCATION_VALUES: readonly DirectionStatus[] = ['rejected', 'deferred'];

export const DIRECTION_ID_PREFIX = 'OPT-';

export const DIRECTION_REQUIRED_TEXT_FIELDS = [
  'opportunity',
  'impact',
  'recommendation',
  'keyDesign',
  'priorityReason',
] as const;

export const DIRECTION_REQUIRED_LIST_FIELDS = [
  'evidence',
  'preservationConstraints',
  'implementationOutline',
  'validation',
] as const;

export const DIRECTION_LENGTH_FIELDS = ['impactLevel', 'confidence', 'risk', 'cost'] as const;

const DIRECTION_TRANSITIONS: Record<DirectionStatus, readonly DirectionStatus[]> = {
  pending: ['selected', 'rejected', 'deferred'],
  selected: ['implemented', 'failed', 'pending'],
  implemented: ['verified', 'failed'],
  verified: [],
  failed: ['pending', 'rejected', 'deferred'],
  rejected: [],
  deferred: ['rejected'],
};

const TERMINAL_BY_STOP_REASON: Record<OptimizationStopReason, OptimizationTerminal> = {
  USER_DECLINED: 'SKIPPED',
  NO_ACTIONABLE: 'NOT_NEEDED',
  DIRECTION_REJECTED: 'DEGRADED',
  DIRECTION_LIMIT_REACHED: 'DEGRADED',
  UNSAFE: 'ABORTED_UNSAFE',
};

const DIRECTION_LEVEL_RANK = { high: 0, medium: 1, low: 2 } as const;

export interface ValidationOutcome<T> {
  ok: boolean;
  value?: T;
  diagnostics: Diagnostic[];
}

export function diagnostic(path: string, expected: string, actual: string, fix: string): Diagnostic {
  return { path, expected, actual, fix };
}

export function validateReviewInput(input: unknown): ValidationOutcome<ReviewInput> {
  if (!isRecord(input)) {
    return { ok: false, diagnostics: [diagnostic('$', 'a JSON object', describe(input), 'Pass a JSON object via --input.')] };
  }

  const diagnostics = rejectManagedFields(input, REVIEW_MANAGED_FIELDS, 'review');
  addUnknownFieldDiagnostics(input, REVIEW_INPUT_FIELDS, diagnostics);

  if (!REVIEW_RESULT_VALUES.includes(input.result as ReviewResultStatus)) {
    diagnostics.push(
      diagnostic(
        'result',
        REVIEW_RESULT_VALUES.join(' | '),
        describe(input.result),
        'Set result to the review conclusion for this round.'
      )
    );
  }
  if (!Array.isArray(input.issues)) {
    diagnostics.push(
      diagnostic('issues', 'an array of issue objects', describe(input.issues), 'Pass every finding as an issue entry; use an empty array when none were found.')
    );
  }
  if (input.summary !== undefined && typeof input.summary !== 'string' && !isRecord(input.summary)) {
    diagnostics.push(
      diagnostic('summary', 'a string or an object', describe(input.summary), 'Pass the reviewer summary as emitted.')
    );
  }
  if (input.writeBackPlan !== undefined) {
    const plan = input.writeBackPlan;
    if (!Array.isArray(plan) || !plan.every((entry) => isRecord(entry))) {
      diagnostics.push(
        diagnostic(
          'writeBackPlan',
          'an array of write-back entries',
          describe(plan),
          'Pass the reviewer writeBackPlan array as emitted; the master applies CRITICAL entries to tasks.md.'
        )
      );
    }
  }
  if (input.executionMode !== undefined && typeof input.executionMode !== 'string') {
    diagnostics.push(diagnostic('executionMode', 'a string', describe(input.executionMode), 'Pass the execution mode as plain text.'));
  }
  if (input.gitDiffSummary !== undefined && typeof input.gitDiffSummary !== 'string') {
    diagnostics.push(diagnostic('gitDiffSummary', 'a string', describe(input.gitDiffSummary), 'Pass the reviewed scope as plain text.'));
  }

  if (!Array.isArray(input.evidenceFiles)) {
    diagnostics.push(
      diagnostic('evidenceFiles', 'an array of project-relative paths', describe(input.evidenceFiles), 'List every file the review inspected.')
    );
  } else {
    input.evidenceFiles.forEach((entry, index) => {
      if (typeof entry !== 'string' || entry.trim() === '') {
        diagnostics.push(
          diagnostic(`evidenceFiles[${index}]`, 'a non-empty project-relative path', describe(entry), 'Remove the entry or replace it with a path.')
        );
      }
    });
    if (input.evidenceFiles.length === 0) {
      diagnostics.push(
        diagnostic(
          'evidenceFiles',
          'at least one project-relative path',
          '[]',
          'A record without evidence keeps the state clean for any later code change; list the files the review inspected.'
        )
      );
    }
  }

  return finalize(input as unknown as ReviewInput, diagnostics);
}

export function validateOptimizeInput(input: unknown): ValidationOutcome<OptimizeInput> {
  if (!isRecord(input)) {
    return { ok: false, diagnostics: [diagnostic('$', 'a JSON object', describe(input), 'Pass a JSON object via --input.')] };
  }

  const diagnostics = rejectManagedFields(input, LEDGER_MANAGED_FIELDS, 'ledger');
  addUnknownFieldDiagnostics(input, OPTIMIZE_INPUT_FIELDS, diagnostics);

  const directions: Array<NewDirectionPayload | DirectionUpdatePayload> = [];
  if (!Array.isArray(input.directions)) {
    diagnostics.push(
      diagnostic('directions', 'an array of directions', describe(input.directions), 'Pass the round ledger directions; use an empty array when this round adds nothing.')
    );
  } else {
    input.directions.forEach((entry, index) => {
      const validated = validateDirectionPayload(entry, `directions[${index}]`);
      diagnostics.push(...validated.diagnostics);
      if (validated.value) {
        directions.push(validated.value);
      }
    });
  }

  if (input.selected !== undefined && !isDirectionId(input.selected)) {
    diagnostics.push(
      diagnostic('selected', `an echoed ${DIRECTION_ID_PREFIX}… identifier`, describe(input.selected), 'Omit selected or use the direction ID echoed by this command.')
    );
  }

  let attempt: DirectionAttemptInput | undefined;
  if (input.attempt !== undefined) {
    if (!isRecord(input.attempt)) {
      diagnostics.push(diagnostic('attempt', 'an object describing the previous round outcome', describe(input.attempt), 'Pass { directionId, status }.'));
    } else {
      const attemptDiagnostics = rejectManagedFields(input.attempt, [], 'attempt');
      diagnostics.push(...attemptDiagnostics);
      if (!isDirectionId(input.attempt.directionId)) {
        diagnostics.push(
          diagnostic('attempt.directionId', `the echoed ${DIRECTION_ID_PREFIX}… identifier that was implemented`, describe(input.attempt.directionId), 'Use the direction ID echoed when it was selected.')
        );
      }
      if (input.attempt.status !== 'verified' && input.attempt.status !== 'failed') {
        diagnostics.push(
          diagnostic('attempt.status', 'verified | failed', describe(input.attempt.status), 'Report whether the round implementation passed the review.')
        );
      }
      attempt = input.attempt as unknown as DirectionAttemptInput;
    }
  }

  if (input.stopReason !== undefined && !STOP_REASON_VALUES.includes(input.stopReason as OptimizationStopReason)) {
    diagnostics.push(
      diagnostic('stopReason', STOP_REASON_VALUES.join(' | '), describe(input.stopReason), 'Use one of the published stop reasons.')
    );
  }

  const summary = input.summary;
  if (summary !== undefined && (typeof summary !== 'string' || summary.trim() === '')) {
    diagnostics.push(
      diagnostic('summary', 'a non-empty string', describe(summary), 'Record the optimizer conclusion as plain text.')
    );
  }
  if (input.stopReason !== undefined && (typeof summary !== 'string' || summary.trim() === '')) {
    diagnostics.push(
      diagnostic(
        'summary',
        'a non-empty string recording why the loop stops',
        describe(summary),
        'A finalized round must carry the optimizer conclusion; resubmit with the same stopReason and a summary.'
      )
    );
  }

  return finalize(
    {
      directions,
      ...(input.selected !== undefined ? { selected: input.selected as string } : {}),
      ...(attempt ? { attempt } : {}),
      ...(input.stopReason !== undefined ? { stopReason: input.stopReason as OptimizationStopReason } : {}),
      ...(typeof summary === 'string' && summary.trim() !== '' ? { summary } : {}),
    },
    diagnostics
  );
}

export function validateDirectionPayload(
  value: unknown,
  path: string
): ValidationOutcome<NewDirectionPayload | DirectionUpdatePayload> {
  if (!isRecord(value)) {
    return { ok: false, diagnostics: [diagnostic(path, 'a direction object', describe(value), 'Pass a direction object.')] };
  }

  const hasId = value.id !== undefined;
  const hasBody = DIRECTION_REQUIRED_TEXT_FIELDS.some((field) => value[field] !== undefined) || value.location !== undefined;
  if (hasId && hasBody) {
    return {
      ok: false,
      diagnostics: [
        diagnostic(
          `${path}.id`,
          'omitted for a new direction, or only { id, status, reason?, evidence? } when updating a known direction',
          describe(value.id),
          'Remove id to submit a new direction (the CLI assigns and echoes it), or keep only id, status, reason, and evidence to update a known direction.'
        ),
      ],
    };
  }

  if (!hasId) {
    return validateNewDirectionPayload(value, path);
  }

  const diagnostics: Diagnostic[] = [];
  addUnknownFieldDiagnostics(value, DIRECTION_UPDATE_FIELDS, diagnostics, path);
  if (!isDirectionId(value.id)) {
    diagnostics.push(
      diagnostic(`${path}.id`, `an echoed ${DIRECTION_ID_PREFIX}… identifier`, describe(value.id), 'Use the ID role="echoed" from a previous response.')
    );
  }
  if (!DIRECTION_REVOCATION_VALUES.includes(value.status as DirectionStatus)) {
    diagnostics.push(
      diagnostic(
        `${path}.status`,
        DIRECTION_REVOCATION_VALUES.join(' | '),
        describe(value.status),
        'Selection, implementation, and verification are CLI-owned; an optimizer may only revoke a known direction as rejected or deferred.'
      )
    );
  }
  appendRevocationRequirements(value, `${path}`, diagnostics);
  return finalize(value as unknown as DirectionUpdatePayload, diagnostics);
}

export function validateDirectionTransition(
  from: DirectionStatus,
  to: DirectionStatus
): Diagnostic | undefined {
  if (DIRECTION_TRANSITIONS[from].includes(to)) {
    return undefined;
  }
  return diagnostic(
    'status',
    DIRECTION_TRANSITIONS[from].length > 0 ? DIRECTION_TRANSITIONS[from].join(' | ') : 'no further transitions',
    `${from} -> ${to}`,
    'Rejected, deferred, verified, and failed directions may only move along the published transitions.'
  );
}

export function deriveTerminal(
  stopReason: OptimizationStopReason,
  hasVerifiedDirection: boolean
): OptimizationTerminal {
  const terminal = TERMINAL_BY_STOP_REASON[stopReason];
  if (terminal !== 'DEGRADED') {
    return terminal;
  }
  return hasVerifiedDirection ? 'IMPROVED' : 'DEGRADED';
}

export function selectEligibleDirection(
  directions: OptimizationDirection[]
): OptimizationDirection | undefined {
  const verified = new Set(
    directions.filter((direction) => direction.status === 'verified').map((direction) => direction.id)
  );
  return directions
    .filter(
      (direction) =>
        direction.status === 'pending' &&
        direction.dependencies.every((dependency) => verified.has(dependency))
    )
    .sort(compareDirectionPriority)[0];
}

export function compareDirectionPriority(
  left: OptimizationDirection,
  right: OptimizationDirection
): number {
  return (
    DIRECTION_LEVEL_RANK[left.impactLevel] - DIRECTION_LEVEL_RANK[right.impactLevel] ||
    DIRECTION_LEVEL_RANK[left.confidence] - DIRECTION_LEVEL_RANK[right.confidence] ||
    DIRECTION_LEVEL_RANK[right.risk] - DIRECTION_LEVEL_RANK[left.risk] ||
    DIRECTION_LEVEL_RANK[right.cost] - DIRECTION_LEVEL_RANK[left.cost] ||
    left.id.localeCompare(right.id)
  );
}

export function allocateDirectionIds(count: number): string[] {
  const timestamp = new Date().toISOString().replace(/[-:.]/g, '');
  return Array.from(
    { length: count },
    (_, index) => `${DIRECTION_ID_PREFIX}${timestamp}-${String(index + 1).padStart(2, '0')}`
  );
}

export function isDirectionId(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith(DIRECTION_ID_PREFIX) && value.length > DIRECTION_ID_PREFIX.length;
}

export function generateSealHash(record: QualityRecord): string {
  const copy = JSON.parse(JSON.stringify(record)) as Record<string, unknown>;
  delete copy.sealHash;
  return createHash('sha256').update(stableStringify(copy)).digest('hex');
}

export function validateQualityRecord(record: unknown): ValidationOutcome<QualityRecord> {
  if (!isRecord(record)) {
    return { ok: false, diagnostics: [diagnostic('$', 'a quality record object', describe(record), 'Re-record the review with xirang quality review.')] };
  }

  const diagnostics: Diagnostic[] = [];
  if (typeof record.timestamp !== 'string' || record.timestamp.length === 0) {
    diagnostics.push(diagnostic('timestamp', 'a non-empty ISO timestamp', describe(record.timestamp), 'Re-record the review so the CLI writes the timestamp.'));
  }
  if (!REVIEW_RESULT_VALUES.includes(record.result as ReviewResultStatus)) {
    diagnostics.push(diagnostic('result', REVIEW_RESULT_VALUES.join(' | '), describe(record.result), 'Re-record the review with a valid conclusion.'));
  }
  if (!Array.isArray(record.issues)) {
    diagnostics.push(diagnostic('issues', 'an array', describe(record.issues), 'Re-record the review.'));
  }
  if (record.tasksFileHash !== null && !isSha256(record.tasksFileHash)) {
    diagnostics.push(diagnostic('tasksFileHash', 'a sha256 hex string or null', describe(record.tasksFileHash), 'Re-record the review so the CLI recomputes the hash.'));
  }

  const context = record.verificationContext;
  if (!isRecord(context)) {
    diagnostics.push(diagnostic('verificationContext', 'an object', describe(context), 'Re-record the review.'));
  } else {
    if (context.contractVersion !== '1.0') {
      diagnostics.push(diagnostic('verificationContext.contractVersion', '"1.0"', describe(context.contractVersion), 'Re-record the review with the current CLI.'));
    }
    if (!Array.isArray(context.evidenceFiles)) {
      diagnostics.push(diagnostic('verificationContext.evidenceFiles', 'an array of strings', describe(context.evidenceFiles), 'Re-record the review.'));
    }
    if (!isSha256(context.evidenceFingerprint)) {
      diagnostics.push(diagnostic('verificationContext.evidenceFingerprint', 'a sha256 hex string', describe(context.evidenceFingerprint), 'Re-record the review.'));
    }
    if (context.evidenceFingerprintEntries !== undefined && !isFingerprintEntries(context.evidenceFingerprintEntries)) {
      diagnostics.push(diagnostic('verificationContext.evidenceFingerprintEntries', 'an array of { path, hash }', describe(context.evidenceFingerprintEntries), 'Re-record the review.'));
    }
  }

  return finalize(record as unknown as QualityRecord, diagnostics);
}

function validateNewDirectionPayload(value: Record<string, unknown>, path: string): ValidationOutcome<NewDirectionPayload> {
  const diagnostics: Diagnostic[] = [];

  const location = value.location;
  if (!isRecord(location) || !Array.isArray(location.files) || location.files.length === 0) {
    diagnostics.push(diagnostic(`${path}.location.files`, 'a non-empty array of project-relative paths', describe(location), 'List the files the direction touches.'));
  } else {
    location.files.forEach((file, index) => {
      if (typeof file !== 'string' || file.trim() === '') {
        diagnostics.push(diagnostic(`${path}.location.files[${index}]`, 'a non-empty path', describe(file), 'Remove the entry or replace it with a path.'));
      }
    });
  }

  for (const field of DIRECTION_REQUIRED_TEXT_FIELDS) {
    if (typeof value[field] !== 'string' || (value[field] as string).trim() === '') {
      diagnostics.push(diagnostic(`${path}.${field}`, 'a non-empty string', describe(value[field]), `Describe the direction's ${field}.`));
    }
  }

  for (const field of DIRECTION_REQUIRED_LIST_FIELDS) {
    const entries = value[field];
    if (!Array.isArray(entries) || entries.length === 0) {
      diagnostics.push(diagnostic(`${path}.${field}`, 'a non-empty array of strings', describe(entries), `Provide at least one ${field} entry.`));
      continue;
    }
    entries.forEach((entry, index) => {
      if (typeof entry !== 'string' || entry.trim() === '') {
        diagnostics.push(diagnostic(`${path}.${field}[${index}]`, 'a non-empty string', describe(entry), 'Remove the entry or fill it in.'));
      }
    });
  }

  for (const field of DIRECTION_LENGTH_FIELDS) {
    if (!DIRECTION_LEVEL_VALUES.includes(value[field] as DirectionLevel)) {
      diagnostics.push(diagnostic(`${path}.${field}`, DIRECTION_LEVEL_VALUES.join(' | '), describe(value[field]), `Rate the direction's ${field}.`));
    }
  }

  const dependencies = value.dependencies;
  if (!Array.isArray(dependencies)) {
    diagnostics.push(diagnostic(`${path}.dependencies`, 'an array', describe(dependencies), 'Use an empty array when the direction has no dependencies.'));
  } else {
    dependencies.forEach((dependency, index) => {
      if (typeof dependency === 'string') {
        if (!isDirectionId(dependency)) {
          diagnostics.push(diagnostic(`${path}.dependencies[${index}]`, `an echoed ${DIRECTION_ID_PREFIX}… identifier`, describe(dependency), 'Reference a direction ID echoed by this CLI.'));
        }
        return;
      }
      if (!isRecord(dependency) || !Number.isInteger(dependency.actionIndex) || (dependency.actionIndex as number) < 0) {
        diagnostics.push(
          diagnostic(
            `${path}.dependencies[${index}]`,
            'a direction ID or { actionIndex } for a direction in this batch',
            describe(dependency),
            'Use { "actionIndex": n } to depend on the n-th new direction of this request.'
          )
        );
      }
    });
  }

  return finalize(value as unknown as NewDirectionPayload, diagnostics);
}

function appendRevocationRequirements(value: Record<string, unknown>, path: string, diagnostics: Diagnostic[]): void {
  if (value.status !== 'rejected' && value.status !== 'deferred') {
    return;
  }
  if (typeof value.reason !== 'string' || value.reason.trim() === '') {
    diagnostics.push(diagnostic(`${path}.reason`, 'a non-empty string', describe(value.reason), 'Explain why the optimizer revokes this direction.'));
  }
  if (!Array.isArray(value.evidence) || value.evidence.length === 0) {
    diagnostics.push(diagnostic(`${path}.evidence`, 'a non-empty array of strings', describe(value.evidence), 'Attach the evidence that supports the revocation.'));
  }
}

function rejectManagedFields(
  value: Record<string, unknown>,
  managed: readonly string[],
  owner: string
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  for (const field of managed) {
    if (value[field] !== undefined) {
      diagnostics.push(
        diagnostic(field, `omitted — ${owner} fields are owned by the CLI`, describe(value[field]), `Remove ${field}; the CLI computes and persists it.`)
      );
    }
  }
  return diagnostics;
}

function addUnknownFieldDiagnostics(
  value: Record<string, unknown>,
  allowed: readonly string[],
  diagnostics: Diagnostic[],
  prefix = ''
): void {
  for (const key of Object.keys(value)) {
    if (allowed.includes(key)) {
      continue;
    }
    if (diagnostics.some((item) => item.path === `${prefix}${key}`)) {
      continue;
    }
    diagnostics.push(
      diagnostic(
        `${prefix}${key}`,
        allowed.join(' | ') || 'no additional fields',
        describe(value[key]),
        'Remove the unknown field; see xirang quality --help for the accepted shape.'
      )
    );
  }
}

function finalize<T>(value: T, diagnostics: Diagnostic[]): ValidationOutcome<T> {
  return diagnostics.length === 0 ? { ok: true, value, diagnostics: [] } : { ok: false, diagnostics };
}

function isSha256(value: unknown): boolean {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
}

function isFingerprintEntries(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.every((entry) => isRecord(entry) && typeof entry.path === 'string' && isSha256(entry.hash))
  );
}

function describe(value: unknown): string {
  if (value === undefined) {
    return 'undefined';
  }
  if (typeof value === 'string') {
    return value;
  }
  return JSON.stringify(value) ?? String(value);
}

function isRecord(value: unknown): value is Record<string, any> {
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
