import {
  DIRECTION_ID_PREFIX,
  DIRECTION_LEVEL_VALUES,
  DIRECTION_STATUS_VALUES,
  OPTIMIZE_INPUT_FIELDS,
  REVIEW_INPUT_FIELDS,
  REVIEW_RESULT_VALUES,
  STOP_REASON_VALUES,
} from './validators.js';

export const QUALITY_SUBCOMMANDS = ['review', 'optimize', 'status', 'seal'] as const;

export const QUALITY_EXIT_CODES = [
  { code: 0, meaning: 'the record was accepted, or the query answered' },
  { code: 1, meaning: 'the entry condition or recorded state blocks the operation' },
  { code: 2, meaning: 'the payload shape is invalid (INVALID_INPUT)' },
];

const STATE_RULES = [
  'state clean means a recorded review conclusion passed and its evidence fingerprint still matches the current code; otherwise the state is dirty',
  'review accepts a conclusion only while the state is dirty; optimize accepts a round only while the state is clean',
  'optimize refuses new rounds once optimization is finalized, after ABORTED_UNSAFE, or when optimization.enabled is false',
  'stopReason derives the terminal state: USER_DECLINED -> SKIPPED, NO_ACTIONABLE -> NOT_NEEDED, DIRECTION_REJECTED and DIRECTION_LIMIT_REACHED -> IMPROVED when a direction is verified and DEGRADED otherwise, UNSAFE -> ABORTED_UNSAFE',
  'optimization.directionLimit caps selected directions; optimization.directionRetries caps failures of one direction; a verified direction consumes neither the failure budget nor another direction slot beyond its own selection',
  'the CLI assigns every direction ID and echoes it; agents never author IDs, counters, histories, or timestamps',
  'a failed direction below optimization.directionRetries returns to pending when the next round starts; a deferred direction stays parked until the optimizer revokes it, and a revoked direction never returns',
  'a finalizing call carries the last round attempt when a round just finished: implemented means the round was reviewed but its outcome is not yet reported, so an unreported round never counts as a successful landing',
  'a review record must list at least one evidence path; a record whose evidence set is empty never counts as clean',
];

const DIRECTION_FIELD_NAMES = [
  'location.files',
  'opportunity',
  'impact',
  'evidence',
  'recommendation',
  'keyDesign',
  'preservationConstraints',
  'implementationOutline',
  'validation',
  'impactLevel',
  'confidence',
  'risk',
  'cost',
  'dependencies',
  'priorityReason',
];

const REVIEW_EXAMPLE = '{"result":"PASS","issues":[],"evidenceFiles":["src/..."]}';

const OPTIMIZATION_ROUND_EXAMPLE =
  `{"directions":[{"location":{"files":["src/a.ts"]},"opportunity":"...","impact":"...","evidence":["..."],`
  + `"recommendation":"...","keyDesign":"...","preservationConstraints":["..."],"implementationOutline":["..."],"validation":["..."],`
  + `"impactLevel":"high","confidence":"high","risk":"low","cost":"low","dependencies":[],"priorityReason":"..."}],`
  + `"attempt":{"directionId":"${DIRECTION_ID_PREFIX}…","status":"verified"}}`;

export function renderQualityStateDiagram(): string {
  return `
**Quality State Machine**:
\`\`\`
dirty   no recorded review conclusion matches the current code evidence
  |
  v
xirang quality review <change-name> --input '<json>' --json
  |-- FAIL_NEEDS_CORRECTIONS --> fix the code and review again (state stays dirty)
  |-- PASS | PASS_WITH_WARNINGS --> clean
                                     |
                                     v
xirang quality optimize <change-name> --input '<json>' --json
  |   one round per call; accepted only while clean and not finalized
  |-- new directions ------> the CLI assigns ${DIRECTION_ID_PREFIX}… IDs and selects the highest priority eligible direction
  |                          the master implements the selected direction, then reviews it again
  |-- attempt verified ----> direction verified; the next round judges the remaining directions
  |-- attempt failed ------> failure count +1; rejected at optimization.directionRetries
  |-- stopReason ----------> the loop is finalized with a terminal state
                                     |
                                     v
xirang quality seal <change-name> --json
      requires clean + a finalized ledger + a terminal other than ABORTED_UNSAFE

stopReason -> terminal:  USER_DECLINED -> SKIPPED
                         NO_ACTIONABLE -> NOT_NEEDED
                         DIRECTION_REJECTED | DIRECTION_LIMIT_REACHED -> IMPROVED when a direction is verified, otherwise DEGRADED
                         UNSAFE -> ABORTED_UNSAFE

Archive accepts: SKIPPED | NOT_NEEDED | IMPROVED | DEGRADED
Archive rejects: an unfinalized ledger (NOT_FINALIZED) | ABORTED_UNSAFE
\`\`\`
`.trim();
}

export function renderQualityCliReference(): string {
  return `
**Quality CLI JSON Schema Reference**:

| CLI call | \`--input\` JSON |
| --- | --- |
| Review | \`${REVIEW_EXAMPLE}\` |
| Optimization round | \`${OPTIMIZATION_ROUND_EXAMPLE}\` |
| Revoke a direction | \`{"directions":[{"id":"${DIRECTION_ID_PREFIX}…","status":"rejected","reason":"...","evidence":["..."]}]}\` |
| Finalize the loop | \`{"directions":[],"attempt":{"directionId":"${DIRECTION_ID_PREFIX}…","status":"verified"},"stopReason":"NO_ACTIONABLE","summary":"optimizer conclusion"}\` |
| Read the state | \`xirang quality status "<change-name>" --json\` (no \`--input\`) |

- The review \`result\` is ${REVIEW_RESULT_VALUES.join(' | ')}; \`issues\` and \`evidenceFiles\` are required arrays.
- A new direction carries ${DIRECTION_FIELD_NAMES.map((field) => `\`${field}\``).join(', ')}; omit \`id\` so the CLI can assign it and echo it back.
- \`impactLevel\`, \`confidence\`, \`risk\`, and \`cost\` are ${DIRECTION_LEVEL_VALUES.join(' | ')}.
- Direction statuses are ${DIRECTION_STATUS_VALUES.join(' | ')}; the CLI owns selection, implementation, and verification, and an optimizer may only revoke a direction as \`rejected\` or \`deferred\` with \`reason\` and \`evidence\`.
- Stop reasons are ${STOP_REASON_VALUES.join(' | ')}; a round that sets one also carries \`summary\` with the optimizer conclusion.
- Depend on another direction of the same round with \`{"actionIndex": n}\`; the CLI replaces it with the assigned ID.
`.trim();
}

export function renderQualityErrorRecovery(): string {
  return `
**Quality CLI Error Recovery Guide** (decide from \`code\`, \`diagnostics\`, and \`allowedNextOperations\` only):
- exit 2 \`INVALID_INPUT\`: read every \`diagnostics[]\` entry and follow its \`path\`, \`expected\`, \`actual\`, and \`fix\` before resubmitting.
- exit 2 \`UNKNOWN_DIRECTION\`, \`DIRECTION_ORDER_VIOLATION\`, \`ILLEGAL_DIRECTION_TRANSITION\`: use only direction IDs the CLI echoed, omit \`selected\` so the CLI selects, and move a direction only along its published transitions.
- exit 1 \`REVIEW_REQUIRED\`: the current code has no matching passing record; run \`xirang quality review\` before the next optimization round.
- exit 1 \`REVIEW_NOT_REQUIRED\`: the recorded review still matches; continue with \`optimize\` or \`seal\`.
- exit 1 \`DIRECTION_LIMIT_REACHED\`: finalize with \`{"directions":[],"stopReason":"DIRECTION_LIMIT_REACHED","summary":"..."}\` or raise \`optimization.directionLimit\`.
- exit 1 \`OPTIMIZATION_DISABLED\`: only \`{"directions":[],"stopReason":"USER_DECLINED","summary":"..."}\` is accepted while \`optimization.enabled\` is false.
- exit 1 \`OPTIMIZATION_FINALIZED\`: seal and archive; a new optimization requires a new change.
- exit 1 \`ABORTED_UNSAFE\`: restore the workspace to the recorded baseline; no automatic recovery.
- A \`stopReason\` always travels with \`summary\`; a finalize payload without it is rejected with exit 2.
- exit 1 \`SEAL_NOT_READY\`: read the listed conditions and record the missing review conclusion or stop reason first.
- Never edit \`.quality-state.json\` or \`.quality-log.jsonl\` by hand, and never infer the code state when no record exists.
- Fail closed when isolation metadata (\`baseCommit\`, \`optimizationBaselineCommit\`) is missing or invalid.
`.trim();
}

export function renderQualityFastPath(): string {
  return `
**Simple Change Fast Path**:
- Spawn a fresh optimizer for every round while \`optimization.enabled\` is true and the user has not declined, including changes that only delete, rename, or remove parameters.
- Master MUST NOT generate, skip, or revoke a direction on its own; it may revoke one only by submitting a reason and evidence inside the round ledger.
- Only an optimizer round may produce \`NO_ACTIONABLE\`; record the optimizer's actual conclusion in the round \`summary\`.
- The master MUST NOT read or inline the generated \`xirang-reviewer\` or \`xirang-optimizer\` agent artifacts.
`.trim();
}

export function renderQualityCheckpointStateMachine(): string {
  return `
[Mode: Checkpoint]

| State | Trigger condition | Git operation |
| --- | --- | --- |
| CREATED | Optimization starts and the workspace carries this Apply's changes | \`git add -A && git commit -m "wip: opt-checkpoint-r0 (baseline)"\`; persist the SHA as \`optimizationBaselineCommit\` |
| BASELINE_RESTORED_FOR_RETRY | A round review returned FAIL_NEEDS_CORRECTIONS | \`git reset --hard HEAD\` and \`git clean -fd\` back to the latest successful checkpoint |
| TERMINAL_ACCEPTED | The ledger is finalized and the last round passed review | keep every \`wip: opt-*\` commit |
| TERMINAL_RESTORED | The ledger is finalized after a failed round | keep the restored checkpoint together with the recorded failure history |

**Hard rules**:
- Never use \`--allow-empty\` for the baseline or for a direction checkpoint; never use stash or tags.
- A successful direction checkpoint is \`git commit -m "wip: opt-r\${N} (\${directionId}: \${description})"\` after the round review passes.
- Snapshot and restore \`.quality-state.json\`, \`.quality-log.jsonl\`, and \`.apply-isolation.json\` together: \`git clean -fd\` removes the untracked log, and a snapshot without its log line is treated as \`dirty\` (fail-closed).
- Rollback only discards speculative code; the recorded review, the failure counts, and the failed directions stay durable, and the round outcome is reported on the next \`optimize\` call.
- Keep the isolation metadata authoritative: confirm \`HEAD\` is the latest successful checkpoint before discarding work, and stop if restoration or hash verification fails.
`.trim();
}

export function renderQualityOverview(entryCommand = 'xirang quality'): string {
  return [
    'Protocol',
    ...STATE_RULES.map((rule) => `  - ${rule}`),
    '',
    'Exit codes',
    ...QUALITY_EXIT_CODES.map((item) => `  ${item.code}: ${item.meaning}`),
    '',
    `Subcommands: ${QUALITY_SUBCOMMANDS.map((name) => `${entryCommand} ${name}`).join(', ')}`,
  ].join('\n');
}

export function renderReviewHelp(): string {
  return [
    'Payload (--input)',
    `  ${REVIEW_INPUT_FIELDS.map((field) => `"${field}"`).join(', ')}`,
    `  result: ${REVIEW_RESULT_VALUES.join(' | ')}`,
    '  issues: array of { severity, message, requirement?, task?, recommendation?, evidence? }',
    '  evidenceFiles: project-relative paths the review inspected',
    '',
    'Minimal example',
    `  ${REVIEW_EXAMPLE}`,
    '',
    renderQualityOverview(),
  ].join('\n');
}

export function renderOptimizeHelp(): string {
  return [
    'Payload (--input)',
    `  ${OPTIMIZE_INPUT_FIELDS.map((field) => `"${field}"`).join(', ')}`,
    '  directions: new directions without "id", or revocation of a known direction as { id, status: rejected | deferred, reason, evidence }',
    '  selected: the direction ID this round implements; omit it and the CLI selects the highest priority eligible direction',
    '  attempt: { directionId, status: verified | failed, summary?, evidence? } reporting the previous round',
    '  summary: the optimizer conclusion; required whenever stopReason finalizes the loop',
    `  stopReason: ${STOP_REASON_VALUES.join(' | ')}`,
    '',
    `  A new direction carries ${DIRECTION_FIELD_NAMES.join(', ')},`,
    `  with impactLevel/confidence/risk/cost as ${DIRECTION_LEVEL_VALUES.join(' | ')}.`,
    '  Depend on a direction of the same batch with { "actionIndex": n }.',
    `  Direction statuses: ${DIRECTION_STATUS_VALUES.join(' | ')}. Revoking a direction requires reason and evidence.`,
    '',
    'Minimal example',
    `  ${OPTIMIZATION_ROUND_EXAMPLE}`,
    '',
    renderQualityOverview(),
  ].join('\n');
}
