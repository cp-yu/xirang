import { execFile } from 'child_process';
import path from 'path';
import { promisify } from 'util';
import type { Command } from 'commander';
import { XIRANG_DIR_NAME } from '../core/config.js';
import { readProjectConfig } from '../core/project-config.js';
import { readQualitySnapshot, writeQualityRecord } from '../core/quality/log.js';
import { formatDiagnostics } from '../core/quality/diagnostics.js';
import {
  CONTRACT_VERSION,
  ARCHIVE_COMPATIBLE_TERMINALS,
  checkQualityState,
  computeEvidenceFingerprint,
  computeTasksFileHash,
  normalizeLedger,
} from '../core/quality/state.js';
import {
  allocateDirectionIds,
  deriveTerminal,
  diagnostic,
  generateSealHash,
  isDirectionId,
  selectEligibleDirection,
  validateDirectionTransition,
  validateOptimizeInput,
  validateQualityRecord,
  validateReviewInput,
} from '../core/quality/validators.js';
import {
  renderOptimizeHelp,
  renderQualityOverview,
  renderReviewHelp,
} from '../core/quality/protocol.js';
import type {
  DirectionUpdatePayload,
  Diagnostic,
  NewDirectionPayload,
  OptimizationDirection,
  OptimizationLedger,
  OptimizeInput,
  QualityRecord,
  QualityState,
} from '../core/quality/types.js';
import { validateChangeExists } from './workflow/shared.js';

const execFileAsync = promisify(execFile);

const QUALITY_CODES = {
  invalidInput: 'INVALID_INPUT',
  reviewNotRequired: 'REVIEW_NOT_REQUIRED',
  reviewRequired: 'REVIEW_REQUIRED',
  optimizationDisabled: 'OPTIMIZATION_DISABLED',
  optimizationFinalized: 'OPTIMIZATION_FINALIZED',
  abortedUnsafe: 'ABORTED_UNSAFE',
  directionLimitReached: 'DIRECTION_LIMIT_REACHED',
  unknownDirection: 'UNKNOWN_DIRECTION',
  directionOrderViolation: 'DIRECTION_ORDER_VIOLATION',
  illegalDirectionTransition: 'ILLEGAL_DIRECTION_TRANSITION',
  sealNotReady: 'SEAL_NOT_READY',
} as const;

const DEFAULT_DIRECTION_LIMIT = 3;
const DEFAULT_DIRECTION_RETRIES = 2;

interface QualityCommandOptions {
  input?: string;
  json?: boolean;
}

interface DirectionLimits {
  enabled: boolean;
  directionLimit: number;
  directionRetries: number;
}

export function registerQualityCommand(program: Command): void {
  const quality = program
    .command('quality')
    .description('Record review and optimization conclusions for a change');

  quality
    .command('review <change-name>')
    .description('Record the review conclusion for the current code state')
    .option('--input <json>', 'JSON payload; falls back to stdin when omitted')
    .option('--json', 'Output as JSON')
    .addHelpText('after', () => `\n${renderReviewHelp()}`)
    .action(async (changeName: string, options: QualityCommandOptions) => {
      await runWithExitCode(() => runQualityReview(changeName, options));
    });

  quality
    .command('optimize <change-name>')
    .description('Record one optimization round or stop the optimization loop')
    .option('--input <json>', 'JSON payload; falls back to stdin when omitted')
    .option('--json', 'Output as JSON')
    .addHelpText('after', () => `\n${renderOptimizeHelp()}`)
    .action(async (changeName: string, options: QualityCommandOptions) => {
      await runWithExitCode(() => runQualityOptimize(changeName, options));
    });

  quality
    .command('status <change-name>')
    .description('Report the recorded quality state and the operations still available')
    .option('--json', 'Output as JSON')
    .addHelpText('after', () => `\n${renderQualityOverview()}`)
    .action(async (changeName: string, options: QualityCommandOptions) => {
      await runWithExitCode(() => runQualityStatus(changeName, options));
    });

  quality
    .command('seal <change-name>')
    .description('Verify the recorded conclusion and print a seal hash')
    .option('--json', 'Output as JSON')
    .addHelpText('after', () => `\n${renderQualityOverview()}`)
    .action(async (changeName: string, options: QualityCommandOptions) => {
      await runWithExitCode(() => runQualitySeal(changeName, options));
    });

  quality.addHelpText('after', () => `\n${renderQualityOverview()}`);
}

async function runQualityReview(changeName: string, options: QualityCommandOptions): Promise<number> {
  const projectRoot = process.cwd();
  const changeDir = await resolveChangeDir(changeName, projectRoot);
  const state = await checkQualityState(changeDir, projectRoot);
  const limits = readDirectionLimits(projectRoot);

  if (state.status === 'clean') {
    return emitFailure(options, {
      code: QUALITY_CODES.reviewNotRequired,
      exitCode: 1,
      state: state.status,
      allowedNextOperations: allowedNextOperations(state.status, state.record?.optimization),
      diagnostics: [
        diagnostic(
          'state',
          'dirty',
          'clean',
          'The recorded review still matches the current code; run `xirang quality optimize` or record an optimization stop instead.'
        ),
      ],
      summary: 'The recorded review still matches the current code.',
    });
  }

  const input = await readInput(options.input);
  if (!input.ok) {
    return emitFailure(options, invalidInput(input.error));
  }
  const validation = validateReviewInput(input.value);
  if (!validation.ok || !validation.value) {
    return emitFailure(options, invalidInput(validation.diagnostics));
  }

  const review = validation.value;
  const timestamp = new Date().toISOString();
  const evidenceFiles = [...review.evidenceFiles].sort();
  const fingerprint = await computeEvidenceFingerprint(evidenceFiles, projectRoot);
  const optimization = carryLedgerThroughReview(state.record?.optimization);
  const record: QualityRecord = {
    kind: 'review',
    timestamp,
    result: review.result,
    issues: review.issues,
    tasksFileHash: await computeTasksFileHash(path.join(changeDir, 'tasks.md')),
    verificationContext: {
      contractVersion: CONTRACT_VERSION,
      evidenceFiles,
      evidenceFingerprint: fingerprint.hash,
      evidenceFingerprintEntries: fingerprint.entries,
      skippedEvidenceFiles: fingerprint.skippedFiles,
      gitHeadCommit: await getGitHead(projectRoot),
      ...(review.gitDiffSummary ? { gitDiffSummary: review.gitDiffSummary } : {}),
      timestamp,
    },
    ...(optimization ? { optimization } : {}),
  };

  await writeQualityRecord(changeDir, record);
  const nextState = await checkQualityState(changeDir, projectRoot);
  const summary = `Review recorded (${review.result}). State: ${nextState.status}.`;
  emit(options, summary, {
    ok: true,
    state: nextState.status,
    review: { result: record.result, timestamp },
    directions: summarizeDirections(optimization?.directions ?? []),
    ledger: summarizeLedger(optimization, limits),
    allowedNextOperations: allowedNextOperations(nextState.status, optimization),
  });
  return 0;
}

async function runQualityOptimize(changeName: string, options: QualityCommandOptions): Promise<number> {
  const projectRoot = process.cwd();
  const changeDir = await resolveChangeDir(changeName, projectRoot);
  const state = await checkQualityState(changeDir, projectRoot);
  const limits = readDirectionLimits(projectRoot);
  const previous = state.record ?? (await readQualitySnapshot(changeDir)) ?? undefined;

  const input = await readInput(options.input);
  if (!input.ok) {
    return emitFailure(options, invalidInput(input.error));
  }
  const validation = validateOptimizeInput(input.value);
  if (!validation.ok || !validation.value) {
    return emitFailure(options, invalidInput(validation.diagnostics));
  }
  const round = validation.value;

  if (state.status !== 'clean') {
    return emitFailure(options, {
      code: QUALITY_CODES.reviewRequired,
      exitCode: 1,
      state: state.status,
      allowedNextOperations: allowedNextOperations(state.status, previous?.optimization),
      diagnostics: [
        diagnostic(
          'state',
          'clean',
          state.status,
          'Record the current code state with `xirang quality review` before starting the next optimization round.'
        ),
      ],
      summary: 'Optimization requires code that already passed review.',
    });
  }

  if (previous?.optimization?.terminal === 'ABORTED_UNSAFE') {
    return emitFailure(options, {
      code: QUALITY_CODES.abortedUnsafe,
      exitCode: 1,
      state: state.status,
      allowedNextOperations: [],
      diagnostics: [
        diagnostic(
          'optimization.terminal',
          'a recovery path that restores the recorded state',
          'ABORTED_UNSAFE',
          'Restore the workspace to the recorded baseline before recording further optimization rounds.'
        ),
      ],
      summary: 'Optimization was aborted as unsafe.',
    });
  }

  if (previous?.optimization?.terminal) {
    return emitFailure(options, {
      code: QUALITY_CODES.optimizationFinalized,
      exitCode: 1,
      state: state.status,
      allowedNextOperations: allowedNextOperations(state.status, previous.optimization),
      diagnostics: [
        diagnostic(
          'optimization.terminal',
          'an unterminated ledger',
          previous.optimization.terminal,
          'Seal and archive the change; a new optimization requires a new change.'
        ),
      ],
      summary: 'Optimization is already finalized.',
    });
  }

  if (limits.enabled === false) {
    const declined = round.stopReason === 'USER_DECLINED' && round.directions.length === 0;
    if (!declined || round.selected || round.attempt) {
      return emitFailure(options, {
        code: QUALITY_CODES.optimizationDisabled,
        exitCode: 1,
        state: state.status,
        allowedNextOperations: allowedNextOperations(state.status, previous?.optimization),
        diagnostics: [
          diagnostic(
            'stopReason',
            'USER_DECLINED',
            round.stopReason ?? 'undefined',
            'optimization.enabled is false, so only { "directions": [], "stopReason": "USER_DECLINED", "summary": "<reason>" } is accepted.'
          ),
        ],
        summary: 'optimization.enabled is false.',
      });
    }
  }

  const ledger = cloneLedger(previous?.optimization);
  const transition = applyRound(ledger, round, limits);
  if (!transition.ok) {
    return emitFailure(options, transition.failure);
  }

  const record: QualityRecord = {
    ...(previous as QualityRecord),
    kind: 'optimize',
    timestamp: new Date().toISOString(),
    optimization: ledger,
  };
  await writeQualityRecord(changeDir, record);
  const nextState = await checkQualityState(changeDir, projectRoot);
  const summary = transition.selected
    ? `Direction ${transition.selected} selected for round ${transition.nextRound}.`
    : ledger.terminal
      ? `Optimization finalized as ${ledger.terminal}.`
      : `Round ${transition.nextRound} recorded with no actionable direction.`;
  emit(options, summary, {
    ok: true,
    state: nextState.status,
    round: transition.nextRound,
    ...(transition.selected ? { selected: transition.selected } : {}),
    directions: summarizeDirections(ledger.directions),
    ledger: summarizeLedger(ledger, limits),
    allowedNextOperations: allowedNextOperations(nextState.status, ledger),
  });
  return 0;
}

async function runQualityStatus(changeName: string, options: QualityCommandOptions): Promise<number> {
  const projectRoot = process.cwd();
  const changeDir = await resolveChangeDir(changeName, projectRoot);
  const state = await checkQualityState(changeDir, projectRoot);
  const limits = readDirectionLimits(projectRoot);
  const ledger = state.record?.optimization;

  const nextOperations = allowedNextOperations(state.status, ledger);
  const commands = nextCommands(changeName, state.status, ledger);
  emit(options, renderStatus(state, ledger, limits, commands), {
    ok: true,
    state: state.status,
    ...(state.changedFiles.length > 0 ? { changedFiles: state.changedFiles } : {}),
    ...(state.status === 'clean' && state.record
      ? { review: { result: state.record.result, timestamp: state.record.timestamp } }
      : {}),
    optimization: summarizeLedger(ledger, limits),
    allowedNextOperations: nextOperations,
    nextCommands: commands,
    information: state.information,
  });
  return 0;
}

async function runQualitySeal(changeName: string, options: QualityCommandOptions): Promise<number> {
  const projectRoot = process.cwd();
  const changeDir = await resolveChangeDir(changeName, projectRoot);
  const snapshot = await readQualitySnapshot(changeDir);
  const state = await checkQualityState(changeDir, projectRoot);
  const validation = validateQualityRecord(snapshot);
  const diagnostics: Diagnostic[] = [...validation.diagnostics];

  if (state.status !== 'clean') {
    diagnostics.push(
      diagnostic(
        'state',
        'clean',
        state.status,
        'Record a passing conclusion for the current code with `xirang quality review`.'
      )
    );
  }
  const terminal = snapshot?.optimization?.terminal;
  if (!terminal) {
    diagnostics.push(
      diagnostic(
        'optimization.terminal',
        [...ARCHIVE_COMPATIBLE_TERMINALS].join(' | '),
        'MISSING',
        'Record the optimization stop with `xirang quality optimize <change-name> --input \'{"directions":[],"stopReason":"...","summary":"..."}\'`.'
      )
    );
  } else if (!ARCHIVE_COMPATIBLE_TERMINALS.has(terminal)) {
    diagnostics.push(
      diagnostic(
        'optimization.terminal',
        [...ARCHIVE_COMPATIBLE_TERMINALS].join(' | '),
        terminal,
        'Restore the workspace to the recorded baseline before sealing this change.'
      )
    );
  }

  if (diagnostics.length > 0 || !snapshot) {
    return emitFailure(options, {
      code: QUALITY_CODES.sealNotReady,
      exitCode: 1,
      state: state.status,
      allowedNextOperations: allowedNextOperations(state.status, snapshot?.optimization),
      diagnostics,
      summary: 'The recorded conclusion is not ready for seal.',
    });
  }

  const sealHash = generateSealHash(snapshot);
  console.log(options.json ? JSON.stringify({ ok: true, sealHash, allowedNextOperations: ['archive'] }, null, 2) : `sealHash: ${sealHash}`);
  return 0;
}

function applyRound(
  ledger: OptimizationLedger,
  round: OptimizeInput,
  limits: DirectionLimits
): { ok: true; nextRound: number; selected?: string } | { ok: false; failure: FailureInput } {
  const byId = new Map(ledger.directions.map((direction) => [direction.id, direction]));

  if (round.attempt) {
    const target = byId.get(round.attempt.directionId);
    if (!target) {
      return {
        ok: false,
        failure: unknownDirectionFailure(`attempt.directionId`, round.attempt.directionId),
      };
    }
    if (target.status === 'selected') {
      target.status = 'implemented';
    }
    if (target.status === 'verified' && round.attempt.status === 'verified') {
      // already recorded; keep the round idempotent
    } else if (target.status !== 'implemented' && target.status !== 'failed') {
      return {
        ok: false,
        failure: {
          code: QUALITY_CODES.illegalDirectionTransition,
          exitCode: 2,
          diagnostics: [
            diagnostic(
              'attempt.status',
              'a direction that is selected, implemented, or failed',
              target.status,
              `Direction ${target.id} cannot report a round outcome from status ${target.status}.`
            ),
          ],
          summary: 'The reported round outcome does not match the recorded direction.',
        },
      };
    } else {
      target.failureCount += round.attempt.status === 'failed' ? 1 : 0;
      if (round.attempt.status === 'failed' && target.failureCount >= limits.directionRetries) {
        target.status = 'rejected';
        target.reason = round.attempt.summary ?? target.reason ?? 'failure limit reached';
      } else {
        target.status = round.attempt.status;
      }
    }
  }

  const reportedDirectionId = round.attempt?.directionId;
  for (const direction of ledger.directions) {
    if (direction.id === reportedDirectionId) {
      continue;
    }
    if (direction.status === 'selected') {
      direction.status = 'pending';
      continue;
    }
    if (direction.status === 'failed' && direction.failureCount < limits.directionRetries) {
      direction.status = 'pending';
    }
  }

  const newPayloads: Array<{ index: number; payload: NewDirectionPayload }> = [];
  for (const [index, entry] of round.directions.entries()) {
    const update = entry as DirectionUpdatePayload;
    if (!isDirectionId(update.id)) {
      newPayloads.push({ index, payload: entry as NewDirectionPayload });
      continue;
    }
    const target = byId.get(update.id);
    if (!target) {
      return { ok: false, failure: unknownDirectionFailure(`directions[${index}].id`, update.id) };
    }
    if (target.status !== update.status) {
      const transition = validateDirectionTransition(target.status, update.status);
      if (transition) {
        return {
          ok: false,
          failure: {
            code: QUALITY_CODES.illegalDirectionTransition,
            exitCode: 2,
            diagnostics: [
              diagnostic(
                `directions[${index}].status`,
                transition.expected,
                `${target.status} -> ${update.status}`,
                transition.fix
              ),
            ],
            summary: `Direction ${update.id} cannot move to ${update.status}.`,
          },
        };
      }
      target.status = update.status;
    }
    if (update.reason) {
      target.reason = update.reason;
    }
  }

  const assignedDirectionIds = allocateDirectionIds(newPayloads.length);
  for (const [batchIndex, entry] of newPayloads.entries()) {
    const id = assignedDirectionIds[batchIndex];
    const dependencies: string[] = [];
    for (const [dependencyIndex, dependency] of entry.payload.dependencies.entries()) {
      if (typeof dependency === 'string') {
        dependencies.push(dependency);
        continue;
      }
      const target = assignedDirectionIds[dependency.actionIndex];
      if (!target) {
        return {
          ok: false,
          failure: {
            code: QUALITY_CODES.invalidInput,
            exitCode: 2,
            diagnostics: [
              diagnostic(
                `directions[${entry.index}].dependencies[${dependencyIndex}]`,
                `an actionIndex of a new direction in this request (0 - ${newPayloads.length - 1})`,
                String(dependency.actionIndex),
                'actionIndex addresses the new directions of this request in order.'
              ),
            ],
            summary: 'A dependency actionIndex does not reference a new direction of this request.',
          },
        };
      }
      dependencies.push(target);
    }
    const direction: OptimizationDirection = {
      ...entry.payload,
      id,
      status: 'pending',
      failureCount: 0,
      dependencies,
    };
    ledger.directions.push(direction);
    byId.set(id, direction);
  }

  const priorSelections = collectSelectedIds(ledger.histories);
  const eligible = selectEligibleDirection(ledger.directions);
  const wantsSelection = Boolean(eligible) && !round.stopReason;

  if (wantsSelection && priorSelections.size >= limits.directionLimit) {
    return {
      ok: false,
      failure: {
        code: QUALITY_CODES.directionLimitReached,
        exitCode: 1,
        diagnostics: [
          diagnostic(
            'directions',
            `at most ${limits.directionLimit} selected direction(s)`,
            `${priorSelections.size} selected`,
            `Finalize the loop with { "directions": [], "stopReason": "DIRECTION_LIMIT_REACHED", "summary": "<conclusion>" } or raise optimization.directionLimit.`
          ),
        ],
        summary: 'The direction limit is reached; only finalization is accepted.',
      },
    };
  }

  if (round.selected && round.selected !== eligible?.id) {
    return {
      ok: false,
      failure: {
        code: QUALITY_CODES.directionOrderViolation,
        exitCode: 2,
        diagnostics: [
          diagnostic(
            'selected',
            eligible?.id ?? 'no selection for this round',
            round.selected,
            'Select the highest priority pending direction whose dependencies are verified, or omit selected.'
          ),
        ],
        summary: 'The requested direction is not the highest priority eligible direction.',
      },
    };
  }

  let selected: string | undefined;
  if (wantsSelection && eligible) {
    eligible.status = 'selected';
    selected = eligible.id;
    ledger.selected = eligible.id;
  }

  const nextRound = ledger.histories.length + 1;
  ledger.histories.push({
    round: nextRound,
    timestamp: new Date().toISOString(),
    directions: assignedDirectionIds,
    ...(selected ? { selected } : {}),
    outcome: round.attempt?.status ?? 'none',
    ...(round.summary ?? round.attempt?.summary
      ? { reason: round.summary ?? round.attempt?.summary }
      : {}),
    ...(round.attempt?.evidence ? { evidence: round.attempt.evidence } : {}),
  });

  if (round.stopReason) {
    ledger.stopReason = round.stopReason;
    ledger.terminal = deriveTerminal(
      round.stopReason,
      ledger.directions.some((direction) => direction.status === 'verified')
    );
    delete ledger.selected;
  }

  ledger.directionsUsed = collectSelectedIds(ledger.histories).size;
  return { ok: true, nextRound, ...(selected ? { selected } : {}) };
}

interface FailureInput {
  code: string;
  exitCode: number;
  diagnostics: Diagnostic[];
  summary: string;
  state?: QualityState['status'];
  allowedNextOperations?: string[];
}

function unknownDirectionFailure(fieldPath: string, value: string): FailureInput {
  return {
    code: QUALITY_CODES.unknownDirection,
    exitCode: 2,
    diagnostics: [
      diagnostic(
        fieldPath,
        'a direction ID echoed by this CLI',
        value,
        'Read the recorded directions with `xirang quality status <change-name> --json`.'
      ),
    ],
    summary: `Unknown direction ${value}.`,
  };
}

function invalidInput(diagnosticsOrMessage: Diagnostic[] | string): FailureInput {
  const diagnostics = Array.isArray(diagnosticsOrMessage)
    ? diagnosticsOrMessage
    : [diagnostic('$', 'a JSON object', String(diagnosticsOrMessage), 'Read `xirang quality --help` for the accepted payload.')];
  return {
    code: QUALITY_CODES.invalidInput,
    exitCode: 2,
    diagnostics,
    summary: 'The payload shape is invalid.',
  };
}

function emitFailure(options: QualityCommandOptions, failure: FailureInput): number {
  const payload = {
    ok: false,
    code: failure.code,
    diagnostics: failure.diagnostics,
    allowedNextOperations: failure.allowedNextOperations ?? [],
    ...(failure.state ? { state: failure.state } : {}),
  };
  emit(
    options,
    [`✗ ${failure.code} — ${failure.summary}`, formatDiagnostics(failure.diagnostics)].join('\n'),
    payload
  );
  return failure.exitCode;
}

function emit(options: QualityCommandOptions, text: string, payload: unknown): void {
  console.log(options.json ? JSON.stringify(payload, null, 2) : text);
}

function nextCommands(
  changeName: string,
  status: QualityState['status'],
  ledger?: OptimizationLedger
): string[] {
  if (status !== 'clean') {
    return [`xirang quality review ${changeName} --input '<review json>' --json`];
  }
  if (!ledger?.terminal) {
    return [
      `xirang quality optimize ${changeName} --input '<round json>' --json`,
      `xirang quality seal ${changeName} --json   # requires a finalized optimization ledger`,
    ];
  }
  if (ledger.terminal === 'ABORTED_UNSAFE') {
    return [];
  }
  return [`xirang quality seal ${changeName} --json`, `xirang archive ${changeName}`];
}

function renderStatus(
  state: QualityState,
  ledger: OptimizationLedger | undefined,
  limits: DirectionLimits,
  commands: string[]
): string {
  const lines = [`State: ${state.status}`];
  if (state.changedFiles.length > 0) {
    lines.push('Changed files:', ...state.changedFiles.map((file) => `  - ${file}`));
  }
  if (state.status === 'clean' && state.record) {
    lines.push(`Review: ${state.record.result} at ${state.record.timestamp}`);
  }
  lines.push(
    `Directions: ${ledger?.directionsUsed ?? 0}/${limits.directionLimit} selected, ${limits.directionRetries} retry budget per direction`,
    `Optimization: ${ledger?.terminal ?? 'not finalized'}`
  );
  const next = allowedNextOperations(state.status, ledger);
  lines.push(next.length > 0 ? `Next: ${next.join(', ')}` : 'Next: restore the workspace before continuing');
  lines.push(...commands.map((command) => `  ${command}`));
  return lines.join('\n');
}

function allowedNextOperations(status: QualityState['status'], ledger?: OptimizationLedger): string[] {
  if (status !== 'clean') {
    return ['review'];
  }
  if (!ledger?.terminal) {
    return ['optimize'];
  }
  if (ledger.terminal === 'ABORTED_UNSAFE') {
    return [];
  }
  return ['seal', 'archive'];
}

function summarizeLedger(ledger: OptimizationLedger | undefined, limits: DirectionLimits) {
  return {
    ...(ledger?.terminal ? { terminal: ledger.terminal } : {}),
    ...(ledger?.stopReason ? { stopReason: ledger.stopReason } : {}),
    directionsUsed: ledger?.directionsUsed ?? 0,
    directionLimit: limits.directionLimit,
    directionRetries: limits.directionRetries,
    directions: summarizeDirections(ledger?.directions ?? []),
  };
}

function summarizeDirections(directions: OptimizationDirection[]) {
  return directions.map((direction) => ({
    id: direction.id,
    status: direction.status,
    failureCount: direction.failureCount,
    opportunity: direction.opportunity,
  }));
}

function collectSelectedIds(histories: OptimizationLedger['histories']): Set<string> {
  const ids = new Set<string>();
  for (const round of histories) {
    if (round.selected) {
      ids.add(round.selected);
    }
  }
  return ids;
}

function cloneLedger(ledger?: OptimizationLedger): OptimizationLedger {
  if (!ledger) {
    return { directions: [], histories: [], directionsUsed: 0 };
  }
  return normalizeLedger(structuredClone(ledger));
}

function carryLedgerThroughReview(ledger?: OptimizationLedger): OptimizationLedger | undefined {
  if (!ledger) {
    return undefined;
  }
  const next = normalizeLedger(structuredClone(ledger));
  const target = next.directions.find((direction) => direction.status === 'selected');
  if (target) {
    target.status = 'implemented';
  }
  return next;
}

function readDirectionLimits(projectRoot: string): DirectionLimits {
  const optimization = readProjectConfig(projectRoot)?.optimization;
  return {
    enabled: optimization?.enabled ?? true,
    directionLimit: optimization?.directionLimit ?? DEFAULT_DIRECTION_LIMIT,
    directionRetries: optimization?.directionRetries ?? DEFAULT_DIRECTION_RETRIES,
  };
}

async function resolveChangeDir(changeName: string, projectRoot: string): Promise<string> {
  const validated = await validateChangeExists(changeName, projectRoot);
  return path.join(projectRoot, XIRANG_DIR_NAME, 'changes', validated);
}

async function readInput(input?: string): Promise<{ ok: true; value: unknown } | { ok: false; error: string }> {
  try {
    return { ok: true, value: await parseInput(input) };
  } catch (error) {
    return { ok: false, error: `Invalid JSON input: ${(error as Error).message}` };
  }
}

async function parseInput(input?: string): Promise<unknown> {
  const raw = input ?? (await readStdinIfAvailable());
  if (!raw) {
    return {};
  }
  return JSON.parse(raw);
}

async function readStdinIfAvailable(): Promise<string> {
  if (process.stdin.isTTY) {
    return '';
  }
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
  }
  return Buffer.concat(chunks).toString('utf-8').trim();
}

async function getGitHead(projectRoot: string): Promise<string | undefined> {
  try {
    const { stdout } = await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: projectRoot });
    return stdout.trim() || undefined;
  } catch {
    return undefined;
  }
}

async function runWithExitCode(handler: () => Promise<number>): Promise<void> {
  try {
    const code = await handler();
    if (code !== 0) {
      process.exitCode = code;
    }
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    process.exitCode = 1;
  }
}
