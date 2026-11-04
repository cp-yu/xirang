import { randomUUID } from 'node:crypto';
import { completionManifestForSyncAssociation } from './sync-association.js';
import {
  type CodeManifest,
  type CompletionStatus,
  type QualityApplicability,
  type QualityCheckpoint,
  type QualityCompletionPlan,
  type QualityConclusion,
  type QualityState,
  QualityEngineError,
  buildCodeManifest,
  compareManifests,
  compareRecoverableCommit,
  readQualityStore,
  transactQuality,
} from './engine.js';

export interface CompletionPlanInput {
  changeDir: string;
  projectRoot: string;
  expectedVersion: number;
  delegationIds: string[];
  verificationPlan: Array<{ scope: string; reason: string }>;
  reasons: string;
  requiredEvidenceIds: string[];
  requiredReviewIds: string[];
  baselineDefects: Array<{ problem: string; repairScope: string; repairEvidenceIds: string[]; reviewId: string }>;
  applicability: Array<Omit<QualityApplicability, 'currentManifestHash' | 'planId'>>;
  recoveryConfirmed: boolean;
  unresolvedIssues: string[];
}

export interface CompletionEvaluationOptions {
  requireConclusion?: boolean;
  requireSuccessfulCheckpoint?: boolean;
}

export interface CompletionEvaluation {
  status: CompletionStatus;
  manifest: CodeManifest;
  baseline?: QualityCheckpoint;
  plans: QualityCompletionPlan[];
  conclusion?: QualityConclusion;
  verifications: QualityState['verifications'];
  reviews: QualityState['reviews'];
  checkpoints: QualityCheckpoint[];
  changedFiles: string[];
  headDifference: boolean;
  gaps: string[];
}

function fail(code: string, message: string): never {
  throw new QualityEngineError(code, message);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function sameStrings(left: string[], right: string[]): boolean {
  return left.length === right.length && [...left].sort().every((value, index) => value === [...right].sort()[index]);
}

function latestSave(delivery: QualityState['delegations'][number]): QualityState['delegations'][number]['saves'][number] | undefined {
  return delivery.saves.at(-1);
}

function allDeliveriesComplete(state: QualityState, ids: string[]): boolean {
  if (!sameStrings(ids, state.delegations.map(item => item.delegationId))) return false;
  return state.delegations.every(item => latestSave(item)?.delivery === 'delivered' && latestSave(item)?.unresolved === false);
}

export async function recordCheckpoint(input: {
  changeDir: string;
  projectRoot: string;
  expectedVersion: number;
  kind: QualityCheckpoint['kind'];
  commit: string;
  reviewId?: string;
}): Promise<{ checkpoint: QualityCheckpoint; snapshot: Awaited<ReturnType<typeof readQualityStore>>['snapshot'] }> {
  if (!['baseline', 'intermediate', 'successful'].includes(input.kind)) fail('INVALID_CHECKPOINT_KIND', 'Checkpoint kind must be baseline, intermediate, or successful.');
  if (!Number.isInteger(input.expectedVersion) || input.expectedVersion < 0 || !nonEmpty(input.commit)) fail('INVALID_CHECKPOINT_INPUT', 'Checkpoint version and commit are invalid.');
  const store = await readQualityStore(input.changeDir);
  if (store.snapshot.version !== input.expectedVersion) fail('STALE_QUALITY_VERSION', 'Checkpoint version is stale.');
  const matched = await compareRecoverableCommit(input.projectRoot, input.commit);
  if (!matched.equal) fail('CHECKPOINT_STATE_MISMATCH', 'Checkpoint commit must match current CODE.');
  const state = store.snapshot.state;
  const checkpoints = state.checkpoints ?? [];
  if (input.kind === 'baseline') {
    const review = state.reviews.find(item => item.reviewId === input.reviewId);
    if (!review || review.scope !== 'baseline' || !review.valid || !['PASS', 'PASS_WITH_WARNINGS'].includes(review.result ?? '') || review.afterManifest?.hash !== matched.workspace.hash) {
      fail('BASELINE_REVIEW_REQUIRED', 'Baseline checkpoint requires a valid passing baseline Review for this exact CODE state.');
    }
    if (state.delegations.length || checkpoints.some(item => item.kind === 'baseline')) fail('BASELINE_CHECKPOINT_EXISTS', 'Baseline checkpoint can only be recorded once before optimization.');
  } else if (input.kind === 'intermediate') {
    if (!checkpoints.some(item => item.kind === 'baseline')) fail('BASELINE_CHECKPOINT_REQUIRED', 'An intermediate checkpoint requires a recorded baseline.');
  } else {
    const readiness = await evaluateCompletion(input.changeDir, input.projectRoot, { requireConclusion: true, requireSuccessfulCheckpoint: false });
    if (readiness.gaps.length) fail('COMPLETION_NOT_READY', `Successful checkpoint is blocked: ${readiness.gaps.join(', ')}.`);
    if (!readiness.conclusion) fail('COMPLETION_NOT_READY', 'A complete current conclusion is required before a successful checkpoint.');
  }
  const checkpoint: QualityCheckpoint = {
    checkpointId: `CHK-${randomUUID()}`,
    kind: input.kind,
    commit: matched.commit.head!,
    manifest: matched.workspace,
    createdVersion: input.expectedVersion + 1,
    reviewId: input.reviewId,
    planId: input.kind === 'successful' ? state.completion?.conclusion?.planId : undefined,
  };
  const result = await transactQuality(input.changeDir, input.expectedVersion, `checkpoint.${input.kind}`, { checkpointId: checkpoint.checkpointId, commit: checkpoint.commit, checkpoint }, { ...state, checkpoints: [...checkpoints, checkpoint] });
  checkpoint.createdVersion = result.snapshot.version;
  return { checkpoint, snapshot: result.snapshot };
}

export async function planCompletion(input: CompletionPlanInput): Promise<{ plan: QualityCompletionPlan; snapshot: Awaited<ReturnType<typeof readQualityStore>>['snapshot'] }> {
  const store = await readQualityStore(input.changeDir);
  if (store.snapshot.version !== input.expectedVersion) fail('STALE_QUALITY_VERSION', 'Completion plan version is stale.');
  const state = store.snapshot.state;
  if (!Array.isArray(input.delegationIds) || !Array.isArray(input.requiredEvidenceIds) || !Array.isArray(input.requiredReviewIds) || !Array.isArray(input.verificationPlan) || !Array.isArray(input.baselineDefects) || !Array.isArray(input.applicability) || !Array.isArray(input.unresolvedIssues) || typeof input.recoveryConfirmed !== 'boolean'
    || input.delegationIds.some(item => !nonEmpty(item)) || input.requiredEvidenceIds.some(item => !nonEmpty(item)) || input.requiredReviewIds.some(item => !nonEmpty(item)) || input.unresolvedIssues.some(item => !nonEmpty(item))
    || input.verificationPlan.some(item => !isObject(item) || !nonEmpty(item.scope) || !nonEmpty(item.reason))
    || input.baselineDefects.some(item => !isObject(item) || !nonEmpty(item.problem) || !nonEmpty(item.repairScope) || !nonEmpty(item.reviewId) || !Array.isArray(item.repairEvidenceIds) || item.repairEvidenceIds.some(id => !nonEmpty(id)))
    || input.applicability.some(item => !isObject(item))) fail('INVALID_COMPLETION_PLAN', 'Completion plan fields or nested entries have invalid shapes.');
  if (!state.checkpoints?.some(item => item.kind === 'baseline')) fail('BASELINE_CHECKPOINT_REQUIRED', 'Optimization completion requires a recorded baseline checkpoint.');
  if (!sameStrings(input.delegationIds, state.delegations.map(item => item.delegationId))) {
    fail('DELEGATION_SET_MISMATCH', 'The plan must include every cumulative delegation.');
  }
  if (!state.delegations.length && !state.skip) fail('DELEGATION_OR_SKIP_REQUIRED', 'Record a delegation or an explicit optimization skip.');
  if (!input.requiredEvidenceIds.length) fail('REQUIRED_TEST_EVIDENCE', 'At least one actual successful verification is required.');
  if (!nonEmpty(input.reasons) || !input.verificationPlan.length || input.verificationPlan.some(item => !nonEmpty(item.scope) || !nonEmpty(item.reason))) fail('INVALID_COMPLETION_PLAN', 'Verification scope and reasons must be explicit.');
  const manifest = await buildCodeManifest(input.projectRoot);
  const planId = `PLN-${randomUUID()}`;
  if (input.applicability.some(item => item.affected !== false || (!!item.evidenceId === !!item.reviewId) || !nonEmpty(item.scope) || !nonEmpty(item.differenceBasis) || !nonEmpty(item.reason))) fail('INVALID_APPLICABILITY', 'Applicability requires exactly one source, explicit differences and reasons, and affected=false.');
  const applicability: QualityApplicability[] = input.applicability.map(item => ({ ...item, affected: false, currentManifestHash: manifest.hash, planId }));
  const plan: QualityCompletionPlan = {
    planId,
    version: input.expectedVersion + 1,
    manifest,
    delegationIds: [...input.delegationIds],
    delegationVersions: state.delegations.map(item => ({ delegationId: item.delegationId, saveVersion: latestSave(item)?.version ?? -1 })),
    verificationPlan: input.verificationPlan.map(item => ({ ...item })),
    reasons: input.reasons,
    requiredEvidenceIds: [...new Set(input.requiredEvidenceIds)],
    requiredReviewIds: [...new Set(input.requiredReviewIds)],
    baselineDefects: input.baselineDefects.map(item => ({ ...item, repairEvidenceIds: [...item.repairEvidenceIds] })),
    applicability,
    recoveryConfirmed: input.recoveryConfirmed,
    unresolvedIssues: [...input.unresolvedIssues],
  };
  const nextState: QualityState = { ...state, completion: { plan } };
  const result = await transactQuality(input.changeDir, input.expectedVersion, 'completion.plan', { plan }, nextState);
  plan.version = result.snapshot.version;
  return { plan, snapshot: result.snapshot };
}

function currentOrUnaffectedEvidence(plan: QualityCompletionPlan, evidenceId: string, original: CodeManifest, current: CodeManifest): boolean {
  if (original.hash === current.hash) return true;
  return plan.applicability.some(item => item.evidenceId === evidenceId && item.affected === false && item.planId === plan.planId && item.currentManifestHash === current.hash && nonEmpty(item.scope) && nonEmpty(item.differenceBasis) && nonEmpty(item.reason));
}

function reviewCurrentOrUnaffected(plan: QualityCompletionPlan, reviewId: string, original: CodeManifest, current: CodeManifest): boolean {
  if (original.hash === current.hash) return true;
  return plan.applicability.some(item => item.reviewId === reviewId && item.affected === false && item.planId === plan.planId && item.currentManifestHash === current.hash && nonEmpty(item.scope) && nonEmpty(item.differenceBasis) && nonEmpty(item.reason));
}

function validatePlanEvidence(plan: QualityCompletionPlan, state: QualityState, current: CodeManifest): string[] {
  const gaps: string[] = [];
  const evidenceById = new Map(state.verifications.map(item => [item.evidenceId, item]));
  const reviewsById = new Map(state.reviews.map(item => [item.reviewId, item]));
  for (const id of plan.requiredEvidenceIds) {
    const verification = evidenceById.get(id);
    if (!verification || !verification.success || verification.changedDuringRun || !currentOrUnaffectedEvidence(plan, id, verification.afterManifest, current)) gaps.push(`REQUIRED_EVIDENCE_INVALID:${id}`);
    else if (verification.delegationId && !plan.delegationIds.includes(verification.delegationId)) gaps.push(`EVIDENCE_DELEGATION_MISMATCH:${id}`);
  }
  for (const id of plan.requiredReviewIds) {
    const review = reviewsById.get(id);
    if (!review || !review.valid || !['PASS', 'PASS_WITH_WARNINGS'].includes(review.result ?? '') || !review.afterManifest || !reviewCurrentOrUnaffected(plan, id, review.afterManifest, current)) {
      gaps.push(`REQUIRED_REVIEW_INVALID:${id}`);
      continue;
    }
    if (review.scope !== 'incremental' || review.delegationIds.length === 0 || new Set(review.delegationIds).size !== review.delegationIds.length || review.delegationIds.some(id => !plan.delegationIds.includes(id))) gaps.push(`REQUIRED_REVIEW_SCOPE_MISMATCH:${id}`);
  }
  for (const defect of plan.baselineDefects) {
    const review = reviewsById.get(defect.reviewId);
    const repairEvidence = defect.repairEvidenceIds.map(id => evidenceById.get(id));
    const repairDelegations = [...new Set(repairEvidence.flatMap(item => item?.delegationId ? [item.delegationId] : []))];
    if (!nonEmpty(defect.problem) || !nonEmpty(defect.repairScope) || !defect.repairEvidenceIds.length || defect.repairEvidenceIds.some(id => !plan.requiredEvidenceIds.includes(id) || evidenceById.get(id)?.scope !== 'defect-repair')) gaps.push(`DEFECT_REPAIR_EVIDENCE_MISSING:${defect.problem}`);
    if (!review || review.scope !== 'defect-repair' || review.assignment !== defect.repairScope || !review.valid || !['PASS', 'PASS_WITH_WARNINGS'].includes(review.result ?? '') || !review.afterManifest || !reviewCurrentOrUnaffected(plan, review.reviewId, review.afterManifest, current) || !sameStrings(review.delegationIds, repairDelegations) || repairDelegations.some(id => !plan.delegationIds.includes(id))) gaps.push(`DEFECT_REPAIR_REVIEW_INVALID:${defect.reviewId}`);
  }
  return gaps;
}

export async function evaluateCompletion(changeDir: string, projectRoot: string, options: CompletionEvaluationOptions = {}): Promise<CompletionEvaluation> {
  const [store, manifest] = await Promise.all([readQualityStore(changeDir), buildCodeManifest(projectRoot)]);
  const state = store.snapshot.state;
  const completionManifest = await completionManifestForSyncAssociation(state, manifest) ?? manifest;
  const checkpoints = state.checkpoints ?? [];
  const baseline = checkpoints.find(item => item.kind === 'baseline');
  const plans = state.completion?.plan ? [state.completion.plan] : [];
  const plan = plans.at(-1);
  const gaps: string[] = [];
  if (!baseline) gaps.push('BASELINE_REVIEW_AND_CHECKPOINT_REQUIRED');
  if (plan) {
    const comparison = await compareManifests(plan.manifest, completionManifest);
    if (!comparison.equal) gaps.push('CODE_CHANGED_AFTER_PLAN');
    if (!plan.recoveryConfirmed) gaps.push('RECOVERY_NOT_CONFIRMED');
    if (plan.unresolvedIssues.length) gaps.push('UNRESOLVED_ISSUES');
    if (!allDeliveriesComplete(state, plan.delegationIds) && state.delegations.length) gaps.push('DELEGATION_DELIVERY_REQUIRED');
    if (!sameStrings(plan.delegationIds, state.delegations.map(item => item.delegationId)) || plan.delegationVersions.some(expected => latestSave(state.delegations.find(item => item.delegationId === expected.delegationId)!)?.version !== expected.saveVersion)) gaps.push('DELEGATION_CHANGED_AFTER_PLAN');
    gaps.push(...validatePlanEvidence(plan, state, completionManifest));
  } else if (baseline) gaps.push('COMPLETION_PLAN_REQUIRED');
  const conclusion = state.completion?.conclusion;
  if (conclusion && (conclusion.manifest.hash !== completionManifest.hash || conclusion.planId !== plan?.planId)) gaps.push('CONCLUSION_STALE');
  const successful = checkpoints.some(item => item.kind === 'successful' && item.manifest.hash === completionManifest.hash && item.planId === conclusion?.planId);
  if (options.requireConclusion !== false && !conclusion) gaps.push('FINAL_CONCLUSION_REQUIRED');
  if (options.requireSuccessfulCheckpoint !== false && !successful) gaps.push('SUCCESSFUL_CHECKPOINT_NOT_RECORDED');
  let status: CompletionStatus = !baseline ? 'needs_review' : 'needs_optimize';
  if (successful && conclusion && gaps.length === 0) status = 'all_done';
  const baselineManifest = baseline?.manifest;
  const baselineDiff = baselineManifest ? await compareManifests(baselineManifest, manifest) : undefined;
  return {
    status, manifest, baseline, plans, conclusion, verifications: state.verifications, reviews: state.reviews, checkpoints,
    changedFiles: baselineDiff ? [...baselineDiff.added, ...baselineDiff.deleted, ...baselineDiff.changed].sort() : [],
    headDifference: Boolean(baselineManifest && baselineManifest.head !== manifest.head),
    gaps,
  };
}

export async function completeOptimization(input: {
  changeDir: string;
  projectRoot: string;
  expectedVersion: number;
  planId: string;
  reasons: string;
}): Promise<{ conclusion: QualityConclusion; snapshot: Awaited<ReturnType<typeof readQualityStore>>['snapshot'] }> {
  const store = await readQualityStore(input.changeDir);
  if (store.snapshot.version !== input.expectedVersion) fail('STALE_QUALITY_VERSION', 'Completion version is stale.');
  const plan = store.snapshot.state.completion?.plan;
  if (!plan || plan.planId !== input.planId) fail('UNKNOWN_COMPLETION_PLAN', 'Completion plan is missing or no longer current.');
  if (!nonEmpty(input.reasons)) fail('INVALID_COMPLETION_REASON', 'Final conclusion requires a reason.');
  const evaluation = await evaluateCompletion(input.changeDir, input.projectRoot, { requireConclusion: false, requireSuccessfulCheckpoint: false });
  if (evaluation.gaps.length) fail('COMPLETION_NOT_READY', `Completion is blocked: ${evaluation.gaps.join(', ')}.`);
  const conclusion: QualityConclusion = { planId: plan.planId, version: input.expectedVersion + 1, manifest: evaluation.manifest, reasons: input.reasons, complete: true };
  const result = await transactQuality(input.changeDir, input.expectedVersion, 'completion.complete', { conclusion }, { ...store.snapshot.state, completion: { plan, conclusion } });
  conclusion.version = result.snapshot.version;
  return { conclusion, snapshot: result.snapshot };
}

export const qualityCompletion = { recordCheckpoint, planCompletion, evaluateCompletion, completeOptimization };
