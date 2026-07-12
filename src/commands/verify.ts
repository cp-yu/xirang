import { createHash } from 'crypto';
import { execFile } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { promisify } from 'util';
import type { Command } from 'commander';
import { readProjectConfig } from '../core/project-config.js';
import {
  checkArchiveCompatibility,
  checkFreshness,
  computeEvidenceFingerprint,
  computeTasksFileHash,
  formatVerifyGateFailure,
  hashFiles,
  readVerifyResult,
} from '../core/verify/freshness.js';
import {
  generateSealHash,
  validateFindingStatusTransition,
  validatePhase1Input,
  validatePhase2Input,
  validateVerifyResult,
} from '../core/verify/result-validator.js';
import type {
  OptimizationEnvelope,
  OptimizationFinding,
  OptimizationHistoryEvent,
  OptimizationReconciliationAction,
  Phase2OptimizationInput,
  Phase2Type,
  Phase2VerificationInput,
  VerifyResult,
} from '../core/verify/types.js';
import { validateChangeExists } from './workflow/shared.js';

const execFileAsync = promisify(execFile);
const PHASE1_PASS_RESULTS = new Set(['PASS', 'PASS_WITH_WARNINGS']);

interface VerifyCommandOptions {
  input?: string;
  json?: boolean;
  type?: Phase2Type;
}

export function registerVerifyCommand(program: Command): void {
  const verify = program
    .command('verify')
    .description('Programmatic verify gates for changes');

  verify
    .command('phase1 <change-name>')
    .description('Accept and persist a canonical Phase 1 verify result')
    .option('--input <json>', 'JSON payload; falls back to stdin when omitted')
    .option('--json', 'Output as JSON')
    .action(async (changeName: string, options: VerifyCommandOptions) => {
      await runWithExitCode(() => verifyPhase1(changeName, options));
    });

  verify
    .command('phase2 <change-name>')
    .description('Run the Phase 2 optimization/verification gate')
    .requiredOption('--type <type>', 'optimization|verification')
    .option('--input <json>', 'JSON payload; falls back to stdin when omitted')
    .option('--json', 'Output as JSON')
    .action(async (changeName: string, options: VerifyCommandOptions) => {
      await runWithExitCode(() => verifyPhase2(changeName, options));
    });

  verify
    .command('seal <change-name>')
    .description('Validate .verify-result.json and print a seal hash')
    .option('--json', 'Output as JSON')
    .action(async (changeName: string, options: VerifyCommandOptions) => {
      await runWithExitCode(() => verifySeal(changeName, options));
    });

  verify
    .command('status <change-name>')
    .description('Check verify freshness and archive compatibility')
    .option('--json', 'Output as JSON')
    .action(async (changeName: string, options: VerifyCommandOptions) => {
      await runWithExitCode(() => verifyStatus(changeName, options));
    });
}

async function verifyPhase1(changeName: string, options: VerifyCommandOptions): Promise<number> {
  const projectRoot = process.cwd();
  const changeDir = await getChangeDir(changeName, projectRoot);
  const tasksPath = path.join(changeDir, 'tasks.md');
  const tasksContent = await readOptionalText(tasksPath);
  if (!tasksContent || !/- \[[ xX]\]/.test(tasksContent)) {
    writeOutput(
      options,
      { ok: false, warning: 'tasks.md is missing or contains no checkbox tasks' },
      'Warning: tasks.md is missing or contains no checkbox tasks'
    );
    return 1;
  }

  const inputResult = await parseJsonInput(options.input);
  if (!inputResult.ok) {
    writeOutput(options, { ok: false, errors: [inputResult.error] }, inputResult.error);
    return 2;
  }
  const parsedInput = inputResult.value;
  const validation = validatePhase1Input(parsedInput);
  if (!validation.valid || !validation.value) {
    writeOutput(options, { ok: false, errors: validation.errors }, validation.errors.join('\n'));
    return 2;
  }

  const tasksFileHash = await computeTasksFileHash(tasksPath);
  if (!tasksFileHash) {
    writeOutput(options, { ok: false, warning: 'tasks.md is missing' }, 'Warning: tasks.md is missing');
    return 1;
  }
  const evidence = await computeEvidenceFingerprint(validation.value.evidenceFiles, projectRoot);
  const result: VerifyResult = {
    timestamp: new Date().toISOString(),
    result: validation.value.result,
    issues: validation.value.issues,
    tasksFileHash,
    verificationContext: {
      contractVersion: '1.0',
      executionMode: validation.value.executionMode,
      evidenceFiles: [...validation.value.evidenceFiles].sort(),
      evidenceFingerprint: evidence.hash,
      evidenceFingerprintEntries: evidence.entries,
      skippedEvidenceFiles: evidence.skippedFiles,
      gitHeadCommit: await getGitHead(projectRoot),
      gitDiffSummary: validation.value.gitDiffSummary,
    },
  };
  if (PHASE1_PASS_RESULTS.has(result.result)) {
    result.optimization = {
      status: 'PENDING_VERIFICATION',
      attempts: [],
      baseline: phase1Baseline(result),
    };
  }

  await writeVerifyResult(changeDir, result);
  const nextStep = result.result === 'FAIL_NEEDS_REMEDIATION'
    ? 'Fix CRITICAL issues'
    : 'Enter Phase 2';
  writeOutput(options, { ok: true, nextStep, result }, nextStep);
  return 0;
}

async function verifyPhase2(changeName: string, options: VerifyCommandOptions): Promise<number> {
  const projectRoot = process.cwd();
  const changeDir = await getChangeDir(changeName, projectRoot);
  const phase2Type = normalizePhase2Type(options.type);
  const current = await readRequiredVerifyResult(changeDir);
  if (!PHASE1_PASS_RESULTS.has(current.result)) {
    writeOutput(options, { ok: false, reason: 'Phase 1 result is not PASS/PASS_WITH_WARNINGS' }, 'Phase 2 skipped: Phase 1 result is not PASS/PASS_WITH_WARNINGS');
    return 1;
  }
  const inputResult = await parseJsonInput(options.input);
  if (!inputResult.ok) {
    writeOutput(options, { ok: false, errors: [inputResult.error] }, inputResult.error);
    return 2;
  }
  const parsedInput = inputResult.value;
  const validation = validatePhase2Input(parsedInput, phase2Type);
  if (!validation.valid || !validation.value) {
    writeOutput(options, { ok: false, errors: validation.errors }, validation.errors.join('\n'));
    return 2;
  }
  if (
    readProjectConfig(projectRoot)?.optimization?.enabled === false &&
    !(phase2Type === 'optimization' && (validation.value as Phase2OptimizationInput).status === 'SKIPPED')
  ) {
    writeOutput(options, { ok: false, reason: 'optimization.enabled is false' }, 'Phase 2 skipped: optimization.enabled is false');
    return 1;
  }

  if (phase2Type === 'optimization') {
    return handleOptimization(changeDir, projectRoot, current, validation.value as Phase2OptimizationInput, options);
  }
  return handleVerification(changeDir, projectRoot, current, validation.value as Phase2VerificationInput, options);
}

async function verifySeal(changeName: string, options: VerifyCommandOptions): Promise<number> {
  const projectRoot = process.cwd();
  const changeDir = await getChangeDir(changeName, projectRoot);
  const result = await readRequiredVerifyResult(changeDir);
  const validation = validateVerifyResult(result);
  const errors = [...validation.errors];
  if (result.optimization?.status === 'PENDING_VERIFICATION') {
    errors.push('optimization.status must be terminal before seal');
  }
  if (errors.length > 0) {
    writeOutput(options, { valid: false, errors }, errors.join('\n'));
    return 1;
  }
  const sealHash = generateSealHash(result);
  writeOutput(options, { valid: true, sealHash }, `sealHash: ${sealHash}`);
  return 0;
}

async function verifyStatus(changeName: string, options: VerifyCommandOptions): Promise<number> {
  const projectRoot = process.cwd();
  const changeDir = await getChangeDir(changeName, projectRoot);
  const freshness = await checkFreshness(changeDir, projectRoot);
  const archiveCompatibility = freshness.verifyResult
    ? checkArchiveCompatibility(freshness.verifyResult)
    : undefined;
  const ok = freshness.status === 'FRESH' && (archiveCompatibility?.compatible ?? false);
  writeOutput(
    options,
    { ok, freshness, archiveCompatibility },
    ok
      ? formatVerifyStatusSuccess(freshness)
      : formatVerifyGateFailure(freshness, archiveCompatibility, {
          changeName,
          command: 'sync',
        })
  );
  return ok ? 0 : 1;
}

function formatVerifyStatusSuccess(freshness: Awaited<ReturnType<typeof checkFreshness>>): string {
  const gitHead = freshness.information.gitHeadCommit;
  if (!gitHead || gitHead.matches) {
    return 'Verify gate passed.';
  }
  return [
    'Verify gate passed.',
    '',
    'Information:',
    `  - gitHeadCommit changed: ${gitHead.recorded ?? 'unknown'} → ${gitHead.current ?? 'unknown'}`,
  ].join('\n');
}

async function handleOptimization(
  changeDir: string,
  projectRoot: string,
  current: VerifyResult,
  input: Phase2OptimizationInput,
  options: VerifyCommandOptions
): Promise<number> {
  const existingStatus = current.optimization?.status;
  if (existingStatus === 'ABORTED_UNSAFE') {
    writeOutput(options, { ok: false, reason: 'ABORTED_UNSAFE' }, 'Phase 2 recovery is unsafe. Restore the workspace before retrying');
    return 1;
  }
  if (existingStatus === 'PENDING_VERIFICATION' && current.optimization?.affectedFileHashes) {
    writeOutput(options, { ok: false, reason: 'PENDING_VERIFICATION' }, 'Unfinished Phase 2 verification detected. Complete verification or reset first');
    return 1;
  }
  if (existingStatus && existingStatus !== 'PENDING_VERIFICATION') {
    writeOutput(options, { ok: false, reason: 'PHASE2_DONE' }, 'Phase 2 already completed');
    return 1;
  }

  if (input.mode === 'begin-implementation') {
    return beginFindingImplementation(changeDir, projectRoot, current, input, options);
  }
  if (input.envelope) {
    return handleFindingReconciliation(changeDir, projectRoot, current, input, options);
  }

  const attempts = [...(current.optimization?.attempts ?? []), {
    timestamp: new Date().toISOString(),
    type: 'optimization' as const,
    status: input.status,
    summary: input.summary,
  }];

  if (input.status === 'NO_OPTIMIZATION_NEEDED') {
    writeOutput(options, { ok: false, reason: 'OPTIMIZER_REQUIRED' }, 'NO_OPTIMIZATION_NEEDED requires a valid optimizer reconciliation envelope');
    return 1;
  }
  if (input.status === 'SKIPPED') {
    current.optimization = { status: 'SKIPPED', attempts, baseline: phase1Baseline(current) };
    await writeVerifyResult(changeDir, current);
    writeOutput(options, { ok: true, result: current }, 'Phase 2 skipped. Ready for sync/archive');
    return 0;
  }
  if (input.status === 'ABORTED_UNSAFE') {
    current.optimization = { status: 'ABORTED_UNSAFE', attempts, baseline: phase1Baseline(current), final: input };
    await writeVerifyResult(changeDir, current);
    writeOutput(options, { ok: true, result: current }, 'Phase 2 aborted unsafe. Restore workspace before retrying');
    return 0;
  }

  writeOutput(
    options,
    { ok: false, reason: 'FINDING_ENVELOPE_REQUIRED' },
    'OPTIMIZATION_PROPOSED requires a finding reconciliation envelope'
  );
  return 2;
}

async function beginFindingImplementation(
  changeDir: string,
  projectRoot: string,
  current: VerifyResult,
  input: Phase2OptimizationInput,
  options: VerifyCommandOptions
): Promise<number> {
  const selected = current.optimization?.findings?.find((finding) => finding.status === 'selected');
  if (!selected || selected.id !== input.findingId) {
    writeOutput(options, { ok: false, reason: 'SELECTED_FINDING_REQUIRED' }, 'begin-implementation must reference the selected finding');
    return 1;
  }
  const recorded = selected.targetFileHashes ?? {};
  const currentHashes = await hashFiles(Object.keys(recorded), projectRoot);
  const stale = Object.keys(recorded).filter((file) => currentHashes[file] !== recorded[file]);
  if (stale.length > 0) {
    writeOutput(options, { ok: false, reason: 'STALE_FINDING', stale }, 'Selected finding is stale. Re-run optimizer reconciliation');
    return 1;
  }
  const transition = validateFindingStatusTransition(selected.status, 'implemented');
  if (!transition.valid) {
    writeOutput(options, { ok: false, reason: 'ILLEGAL_FINDING_TRANSITION', errors: transition.errors }, transition.errors.join('\n'));
    return 2;
  }
  selected.status = 'implemented';
  appendHistory(current.optimization!.history ??= [], 'implemented', 'Master began implementation after freshness check', selected.id, undefined, currentHashes);
  await writeVerifyResult(changeDir, current);
  writeOutput(options, { ok: true, result: current }, `Finding ${selected.id} is fresh and ready for implementation`);
  return 0;
}

async function handleFindingReconciliation(
  changeDir: string,
  projectRoot: string,
  current: VerifyResult,
  input: Phase2OptimizationInput,
  options: VerifyCommandOptions
): Promise<number> {
  const envelope = input.envelope as OptimizationEnvelope;
  if (envelope.blockingObservations.length > 0) {
    current.result = 'FAIL_NEEDS_REMEDIATION';
    current.issues.push(...envelope.blockingObservations.map((observation) => ({
      severity: 'CRITICAL',
      message: observation.issue,
      evidence: [observation.location, ...observation.evidence],
    })));
    await writeVerifyResult(changeDir, current);
    writeOutput(options, { ok: false, reason: 'BLOCKING_OBSERVATIONS', result: current }, 'Optimizer found correctness or artifact conflicts. Return to Phase 1 remediation');
    return 1;
  }

  const optimization = current.optimization ?? {
    status: 'PENDING_VERIFICATION' as const,
    attempts: [],
  };
  const previousFindings = optimization.findings ?? [];
  const reconciliationError = validateCompleteReconciliation(previousFindings, envelope);
  if (reconciliationError) {
    writeOutput(options, { ok: false, reason: 'INCOMPLETE_RECONCILIATION', errors: [reconciliationError] }, reconciliationError);
    return 2;
  }
  const findings = new Map(previousFindings.map((finding) => [finding.id, structuredClone(finding)]));
  for (const finding of envelope.findings) {
    findings.set(finding.id, structuredClone(finding));
  }
  const history = [...(optimization.history ?? [])];
  const createActions = envelope.actions.filter((action) => action.action === 'add' || action.action === 'merge');
  const batchIds = allocateTimestampFindingIds(createActions.length);
  const actionIds = new Map<number, string>();
  let createIndex = 0;
  envelope.actions.forEach((action, actionIndex) => {
    if (action.action === 'add' || action.action === 'merge') {
      actionIds.set(actionIndex, batchIds[createIndex]);
      createIndex += 1;
    }
  });

  for (let actionIndex = 0; actionIndex < envelope.actions.length; actionIndex += 1) {
    const action = envelope.actions[actionIndex];
    if (action.action === 'add') {
      const findingId = actionIds.get(actionIndex)!;
      const dependencies = resolveActionDependencies(
        action.finding.dependencies,
        actionIndex,
        envelope.actions,
        actionIds
      );
      const finding: OptimizationFinding = {
        ...action.finding,
        id: findingId,
        status: action.finding.status,
        dependencies,
      };
      findings.set(findingId, finding);
      appendHistory(history, 'add', action.reason ?? 'Optimizer added finding', findingId);
      continue;
    }
    const actionError = applyReconciliationAction(
      action,
      findings,
      history,
      actionIds.get(actionIndex),
      action.action === 'merge'
        ? resolveActionDependencies(action.finding.dependencies, actionIndex, envelope.actions, actionIds)
        : []
    );
    if (actionError) {
      writeOutput(options, { ok: false, reason: 'ILLEGAL_FINDING_TRANSITION', errors: [actionError] }, actionError);
      return 2;
    }
  }

  const currentFindings = [...findings.values()];
  const knownFindingIds = new Set(currentFindings.map((finding) => finding.id));
  const unknownDependency = currentFindings.flatMap((finding) =>
    finding.dependencies
      .filter((dependency) => !knownFindingIds.has(dependency))
      .map((dependency) => ({ findingId: finding.id, dependency }))
  )[0];
  if (unknownDependency) {
    const error = `${unknownDependency.findingId} references unknown dependency ${unknownDependency.dependency}`;
    writeOutput(options, { ok: false, reason: 'UNKNOWN_FINDING_DEPENDENCY', errors: [error] }, error);
    return 2;
  }
  for (const finding of currentFindings) {
    if (finding.status === 'selected') {
      const transition = validateFindingStatusTransition('selected', 'pending');
      if (!transition.valid) {
        writeOutput(options, { ok: false, reason: 'ILLEGAL_FINDING_TRANSITION', errors: transition.errors }, transition.errors.join('\n'));
        return 2;
      }
      finding.status = 'pending';
    }
  }
  const selected = selectActionableFinding(currentFindings);
  if (input.status === 'NO_OPTIMIZATION_NEEDED' && selected) {
    writeOutput(
      options,
      { ok: false, reason: 'CONTRADICTORY_OPTIMIZATION_STATUS', selectedFindingId: selected.id },
      'NO_OPTIMIZATION_NEEDED cannot include actionable findings'
    );
    return 2;
  }
  if (selected) {
    const transition = validateFindingStatusTransition(selected.status, 'selected');
    if (!transition.valid) {
      writeOutput(options, { ok: false, reason: 'ILLEGAL_FINDING_TRANSITION', errors: transition.errors }, transition.errors.join('\n'));
      return 2;
    }
    selected.status = 'selected';
  }
  const signatureFindings = currentFindings
    .filter((finding) => ['pending', 'selected'].includes(finding.status))
    .sort(compareFindingPriority);
  const signaturePaths = normalizeFindingPaths(
    [...new Set(signatureFindings.flatMap((finding) => finding.location.files))].sort(),
    projectRoot
  );
  const selectedPaths = normalizeFindingPaths(selected?.location.files ?? [], projectRoot);
  const hashPaths = [...selectedPaths, ...signaturePaths.filter((file) => !selectedPaths.includes(file))];
  const hashSnapshot = await hashFiles(hashPaths, projectRoot);
  const signatureHashes = projectFindingHashes(signaturePaths, hashSnapshot);
  if (selected) {
    selected.targetFileHashes = projectFindingHashes(selectedPaths, hashSnapshot);
    appendHistory(history, 'select', selected.priorityReason, selected.id, undefined, selected.targetFileHashes);
  }

  const attempts = [...optimization.attempts, {
    timestamp: new Date().toISOString(),
    type: 'optimization' as const,
    status: input.status,
    summary: input.summary,
  }];
  const hasCompletedFinding = currentFindings.some((finding) =>
    ['verified', 'resolved'].includes(finding.status)
  );
  const terminal = currentFindings.every((finding) =>
    ['verified', 'resolved', 'rejected', 'invalidated', 'deferred', 'merged'].includes(finding.status)
  );
  const reconciliationSignature = computeReconciliationSignature(signatureFindings, signatureHashes);
  const noProgress = envelope.actions.every(
    (action) => action.action === 'retain' || action.action === 'reprioritize'
  );
  const unchangedReconciliations = noProgress && optimization.reconciliationSignature === reconciliationSignature
    ? (optimization.unchangedReconciliations ?? 0) + 1
    : 0;
  const stalled = unchangedReconciliations >= 2;
  if (stalled) {
    appendHistory(history, 'stalled', 'Two consecutive reconciliations made no progress');
  }
  const hasRejectedFinding = currentFindings.some((finding) => finding.status === 'rejected');
  const status = stalled
    ? 'DEGRADED'
    : selected
      ? 'PENDING_VERIFICATION'
      : terminal
        ? hasRejectedFinding ? 'DEGRADED' : hasCompletedFinding ? 'IMPROVED' : 'NOT_NEEDED'
        : 'PENDING_VERIFICATION';
  if (stalled || (terminal && hasRejectedFinding)) {
    current.result = 'PASS_WITH_WARNINGS';
  }

  current.optimization = {
    ...optimization,
    status,
    attempts,
    findings: currentFindings,
    history,
    reconciliationSignature,
    unchangedReconciliations,
    baseline: optimization.baseline ?? phase1Baseline(current),
  };
  await writeVerifyResult(changeDir, current);
  const nextStep = selected && !stalled ? 'IMPLEMENT_SELECTED' : 'PHASE2_COMPLETE';
  writeOutput(options, { ok: true, nextStep, selectedFindingId: stalled ? undefined : selected?.id, result: current }, selected && !stalled
    ? `Finding ${selected.id} selected. Implement it, then run speculative verification`
    : stalled
      ? 'Phase 2 stopped after two reconciliations without progress'
      : 'Phase 2 reconciliation complete with no actionable findings');
  return 0;
}

function applyReconciliationAction(
  action: Exclude<OptimizationReconciliationAction, { action: 'add' }>,
  findings: Map<string, OptimizationFinding>,
  history: OptimizationHistoryEvent[],
  createdFindingId?: string,
  createdDependencies: string[] = []
): string | undefined {
  if (action.action === 'merge') {
    const missing = action.findingIds.filter((findingId) => !findings.has(findingId));
    if (missing.length > 0) {
      return `merge references unknown findings: ${missing.join(', ')}`;
    }
    for (const findingId of action.findingIds) {
      const finding = findings.get(findingId)!;
      const transition = validateFindingStatusTransition(finding.status, 'merged');
      if (!transition.valid) {
        return transition.errors[0];
      }
    }
    const mergedId = createdFindingId!;
    for (const findingId of action.findingIds) {
      findings.get(findingId)!.status = 'merged';
    }
    findings.set(mergedId, {
      ...action.finding,
      id: mergedId,
      status: action.finding.status,
      dependencies: createdDependencies,
    });
    appendHistory(history, 'merge', action.reason, mergedId, action.findingIds);
    return undefined;
  }

  const finding = findings.get(action.findingId);
  if (!finding) {
    return `${action.action} references unknown finding ${action.findingId}`;
  }
  let nextStatus: OptimizationFinding['status'] | undefined;
  if (action.action === 'retain' || action.action === 'reprioritize' || action.action === 'masterChallenge') {
    if (finding.status === 'selected' || finding.status === 'failed' || finding.status === 'verified') {
      nextStatus = 'pending';
    }
  } else {
    nextStatus = {
      resolve: 'resolved',
      invalidate: 'invalidated',
      reject: 'rejected',
    }[action.action] as OptimizationFinding['status'];
  }
  if (nextStatus && nextStatus !== finding.status) {
    const transition = validateFindingStatusTransition(finding.status, nextStatus);
    if (!transition.valid) {
      return transition.errors[0];
    }
    finding.status = nextStatus;
  }
  appendHistory(
    history,
    action.action,
    action.reason,
    action.findingId,
    undefined,
    undefined,
    action.action === 'masterChallenge' ? action.evidence : undefined
  );
  return undefined;
}

function resolveActionDependencies(
  dependencies: Array<string | { actionIndex: number }>,
  actionIndex: number,
  actions: OptimizationReconciliationAction[],
  actionIds: Map<number, string>
): string[] {
  return dependencies.map((dependency) => {
    if (typeof dependency === 'string') {
      return dependency;
    }
    const resolvedAction = actions[dependency.actionIndex];
    const resolved = resolvedAction?.action === 'add'
      ? actionIds.get(dependency.actionIndex)
      : undefined;
    if (!resolved) {
      throw new Error(`actions[${actionIndex}] dependency actionIndex ${dependency.actionIndex} does not reference an add action`);
    }
    return resolved;
  });
}

function selectActionableFinding(findings: OptimizationFinding[]): OptimizationFinding | undefined {
  const completed = new Set(findings
    .filter((finding) => ['verified', 'resolved'].includes(finding.status))
    .map((finding) => finding.id));
  return findings
    .filter((finding) =>
      finding.status === 'pending' && finding.dependencies.every((dependency) => completed.has(dependency))
    )
    .sort(compareFindingPriority)[0];
}

function compareFindingPriority(left: OptimizationFinding, right: OptimizationFinding): number {
  const highFirst = { high: 0, medium: 1, low: 2 };
  const lowFirst = { low: 0, medium: 1, high: 2 };
  return highFirst[left.impactLevel] - highFirst[right.impactLevel]
    || highFirst[left.confidence] - highFirst[right.confidence]
    || lowFirst[left.risk] - lowFirst[right.risk]
    || lowFirst[left.cost] - lowFirst[right.cost]
    || left.id.localeCompare(right.id);
}

function validateCompleteReconciliation(
  previousFindings: OptimizationFinding[],
  envelope: OptimizationEnvelope
): string | undefined {
  const nonTerminal = previousFindings.filter((finding) => ![
    'resolved', 'rejected', 'invalidated', 'merged',
  ].includes(finding.status));
  if (nonTerminal.length === 0) {
    return envelope.findings.length === 0
      ? undefined
      : 'initial reconciliation findings view must be empty; new findings require add actions';
  }
  const actionIds = envelope.actions.flatMap((action) => {
    if ('findingId' in action) {
      return [action.findingId];
    }
    if ('findingIds' in action) {
      return action.findingIds;
    }
    return [];
  });
  const viewIds = envelope.findings.map((finding) => finding.id);
  const missingActions = nonTerminal.filter((finding) => !actionIds.includes(finding.id));
  const missingView = nonTerminal.filter((finding) => !viewIds.includes(finding.id));
  if (missingActions.length > 0 || missingView.length > 0) {
    const missing = new Set([...missingActions, ...missingView].map((finding) => finding.id));
    return `reconciliation must cover every non-terminal finding: ${[...missing].join(', ')}`;
  }
  const expectedView = nonTerminal.map((finding) => finding.id);
  if (viewIds.length !== expectedView.length || new Set(viewIds).size !== viewIds.length) {
    return 'reconciliation findings view must contain each non-terminal finding exactly once';
  }
  const previousById = new Map(nonTerminal.map((finding) => [finding.id, finding]));
  const changedStatus = envelope.findings.find((finding) =>
    previousById.get(finding.id)?.status !== finding.status
  );
  if (changedStatus) {
    return `reconciliation findings view cannot mutate status for ${changedStatus.id}`;
  }
  return undefined;
}

function computeReconciliationSignature(
  findings: OptimizationFinding[],
  hashes: Record<string, string>
): string {
  const state = findings.map((finding) => ({
    id: finding.id,
    dependencies: finding.dependencies,
  }));
  return createHash('sha256').update(JSON.stringify({ hashes, state })).digest('hex');
}

function normalizeFindingPaths(files: string[], projectRoot: string): string[] {
  const root = path.resolve(projectRoot);
  const normalized = files.map((file) => {
    const platformPath = file.split(/[/\\]+/).join(path.sep);
    const resolved = path.isAbsolute(platformPath)
      ? path.normalize(platformPath)
      : path.resolve(root, platformPath);
    return path.relative(root, resolved).split(path.sep).join('/');
  });
  return [...new Set(normalized)];
}

function projectFindingHashes(
  files: string[],
  hashes: Record<string, string>
): Record<string, string> {
  return Object.fromEntries(files.map((file) => [file, hashes[file]]));
}

function allocateTimestampFindingIds(count: number): string[] {
  const timestamp = new Date().toISOString().replace(/[-:.]/g, '');
  return Array.from({ length: count }, (_, index) =>
    `OPT-${timestamp}-${String(index + 1).padStart(2, '0')}`
  );
}

function appendHistory(
  history: OptimizationHistoryEvent[],
  action: OptimizationHistoryEvent['action'],
  reason: string,
  findingId?: string,
  findingIds?: string[],
  hashes?: Record<string, string>,
  evidence?: string[]
): void {
  history.push({
    sequence: history.length + 1,
    action,
    reason,
    timestamp: new Date().toISOString(),
    ...(findingId ? { findingId } : {}),
    ...(findingIds ? { findingIds } : {}),
    ...(hashes ? { hashes } : {}),
    ...(evidence ? { evidence } : {}),
  });
}

async function handleVerification(
  changeDir: string,
  projectRoot: string,
  current: VerifyResult,
  input: Phase2VerificationInput,
  options: VerifyCommandOptions
): Promise<number> {
  if (!current.optimization?.findings) {
    writeOutput(options, { ok: false, reason: 'FINDING_ENVELOPE_REQUIRED' }, 'Verification requires a finding-first optimization result');
    return 2;
  }
  return handleFindingVerification(changeDir, projectRoot, current, input, options);
}

async function handleFindingVerification(
  changeDir: string,
  projectRoot: string,
  current: VerifyResult,
  input: Phase2VerificationInput,
  options: VerifyCommandOptions
): Promise<number> {
  const optimization = current.optimization!;
  const selected = optimization.findings!.find((finding) => finding.status === 'implemented');
  if (!selected || input.findingId !== selected.id) {
    writeOutput(options, { ok: false, reason: 'IMPLEMENTED_FINDING_REQUIRED' }, 'Verification must reference the current implemented finding');
    return 1;
  }

  optimization.attempts.push({
    timestamp: new Date().toISOString(),
    type: 'verification',
    result: input.result,
    summary: input.summary,
  });
  if (input.result === 'PASS' || input.result === 'PASS_WITH_WARNINGS') {
    const transition = validateFindingStatusTransition(selected.status, 'verified');
    if (!transition.valid) {
      writeOutput(options, { ok: false, reason: 'ILLEGAL_FINDING_TRANSITION', errors: transition.errors }, transition.errors.join('\n'));
      return 2;
    }
    selected.status = 'verified';
    appendHistory(optimization.history ??= [], 'verified', input.summary ?? 'Fresh reviewer verified preservation constraints', selected.id);
    const evidence = await computeEvidenceFingerprint(
      current.verificationContext.evidenceFiles,
      projectRoot
    );
    current.verificationContext.evidenceFingerprint = evidence.hash;
    current.verificationContext.evidenceFingerprintEntries = evidence.entries;
    current.verificationContext.gitHeadCommit = await getGitHead(projectRoot);
    current.verificationContext.timestamp = new Date().toISOString();
    optimization.status = 'PENDING_VERIFICATION';
    delete optimization.affectedFileHashes;
    await writeVerifyResult(changeDir, current);
    writeOutput(options, { ok: true, nextStep: 'RECONCILE', result: current }, 'Finding verified. Re-run optimizer reconciliation against current code');
    return 0;
  }

  const optRetries = readProjectConfig(projectRoot)?.optimization?.optRetries ?? 2;
  selected.failureCount = (selected.failureCount ?? 0) + 1;
  const failedTransition = validateFindingStatusTransition(selected.status, 'failed');
  if (!failedTransition.valid) {
    writeOutput(options, { ok: false, reason: 'ILLEGAL_FINDING_TRANSITION', errors: failedTransition.errors }, failedTransition.errors.join('\n'));
    return 2;
  }
  selected.status = 'failed';
  const exhausted = selected.failureCount >= optRetries;
  if (exhausted) {
    const rejectedTransition = validateFindingStatusTransition(selected.status, 'rejected');
    if (!rejectedTransition.valid) {
      writeOutput(options, { ok: false, reason: 'ILLEGAL_FINDING_TRANSITION', errors: rejectedTransition.errors }, rejectedTransition.errors.join('\n'));
      return 2;
    }
    selected.status = 'rejected';
  }
  const reason = input.summary ?? 'Speculative reviewer rejected the optimization';
  appendHistory(optimization.history ??= [], 'failed', reason, selected.id, undefined, undefined, input.issues?.flatMap((issue) => issue.evidence ?? [issue.message]));
  optimization.failedDirections = [
    ...(optimization.failedDirections ?? []),
    `${selected.id}: ${selected.keyDesign} — ${reason}`,
  ];
  optimization.status = 'PENDING_VERIFICATION';
  await writeVerifyResult(changeDir, current);
  writeOutput(options, { ok: true, nextStep: 'ROLLBACK_AND_RECONCILE', result: current }, 'Finding verification failed. Roll back speculative edits and reconcile again');
  return 0;
}

async function getChangeDir(changeName: string, projectRoot: string): Promise<string> {
  const validated = await validateChangeExists(changeName, projectRoot);
  return path.join(projectRoot, 'openspec', 'changes', validated);
}

async function readRequiredVerifyResult(changeDir: string): Promise<VerifyResult> {
  const result = await readVerifyResult(changeDir);
  if (!result) {
    throw new Error('.verify-result.json is missing. Run openspec verify phase1 first.');
  }
  return result;
}

async function writeVerifyResult(changeDir: string, result: VerifyResult): Promise<void> {
  await fs.writeFile(
    path.join(changeDir, '.verify-result.json'),
    `${JSON.stringify(result, null, 2)}\n`,
    'utf-8'
  );
}

async function parseJsonInput(input?: string): Promise<{ ok: true; value: unknown } | { ok: false; error: string }> {
  try {
    return { ok: true, value: await parseInput(input) };
  } catch (error) {
    return { ok: false, error: `Invalid JSON input: ${(error as Error).message}` };
  }
}

async function parseInput(input?: string): Promise<unknown> {
  const raw = input ?? await readStdinIfAvailable();
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

async function readOptionalText(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

async function getGitHead(projectRoot: string): Promise<string | undefined> {
  try {
    const { stdout } = await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: projectRoot });
    return stdout.trim() || undefined;
  } catch {
    return undefined;
  }
}

function normalizePhase2Type(type?: string): Phase2Type {
  if (type === 'optimization' || type === 'verification') {
    return type;
  }
  throw new Error('--type must be optimization or verification');
}

function phase1Baseline(result: VerifyResult): Omit<VerifyResult, 'optimization'> {
  const { optimization: _optimization, ...baseline } = result;
  return baseline;
}

function writeOutput(options: VerifyCommandOptions, jsonValue: unknown, text: string): void {
  if (options.json) {
    console.log(JSON.stringify(jsonValue, null, 2));
    return;
  }
  console.log(text);
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
