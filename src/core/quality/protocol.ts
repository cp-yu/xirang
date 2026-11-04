import { z } from 'zod';
import { commandSchemas, qualityOptionMetadata } from './command-schema.js';

export const QUALITY_SUBCOMMANDS = ['review', 'delegation', 'verification', 'conclusion', 'checkpoint', 'status', 'seal'] as const;
export const QUALITY_RECOVERY_REFERENCE = '.xirang/references/xirang-quality-recovery.md';
export const QUALITY_EXIT_CODES = [
  { code: 0, meaning: 'the operation was accepted or the query answered; inspect status and gaps before claiming completion' },
  { code: 1, meaning: 'an operation prerequisite, verification result, or completion condition blocks advancement' },
  { code: 2, meaning: 'the command, payload, version, path, or stored format was rejected; read code and diagnostics' },
];

type SchemaName = keyof typeof commandSchemas;
type OptionName = keyof typeof qualityOptionMetadata;

function options(...names: OptionName[]): string {
  return names.map(name => qualityOptionMetadata[name].flags).join(' ');
}

/** Render structural input documentation from the same Zod schemas used by the CLI. */
export function renderQualityPayloadSchema(name: SchemaName): string {
  const schema = z.toJSONSchema(commandSchemas[name], { io: 'input' });
  return `**${name}**\n\n\`\`\`json\n${JSON.stringify(schema)}\n\`\`\``;
}

function payloadSchemas(...names: SchemaName[]): string {
  return names.map(renderQualityPayloadSchema).join('\n\n');
}

export function renderQualityStateDiagram(): string {
  return `**Quality completion flow**
\`\`\`text
Independent baseline Review: begin -> fresh Reviewer -> submit
  | failing or invalid: correct ordinary implementation, then obtain a new Review
  v
Record a recoverable baseline checkpoint matching the passing reviewed code
  |
  +-> configured disabled / explicit user refusal: record skip
  |
  +-> persist delegation start -> Opt implements and runs local tests
         | save abandonment when it happens; save pause/handoff/delivery
         | recover the same delegation after the old writer has stopped
         | main may return corrections or commission a new fresh exploration
         v
Main assesses cumulative delivery, actual code, risk, and verification evidence
  | run affected tests; obtain independent Review wherever required
  | confirmed baseline defect: repair + targeted independent Review required
  | unaffected prior success: separately justify applicability to current code
  v
conclusion plan -> conclusion complete -> successful checkpoint -> seal
\`\`\`
Read status and every gap. Only status=all_done with no gaps is complete. A baseline PASS does not review later optimization edits. A decision that additional Review is unnecessary belongs in the main agent's reasons, never in a fabricated Reviewer PASS. Required tests and Reviews must actually pass; intermediate checkpoints and delivered reports do not establish final completion.`;
}

export function renderQualityCheckpointStateMachine(): string {
  return `**Recoverable and successful checkpoints**

| Kind | Required meaning | Operation |
| --- | --- | --- |
| baseline | Passing independent baseline Review and an actual Git commit matching current code, before optimization edits | quality checkpoint with kind=baseline, commit and review |
| intermediate | Optional recoverable state during optimization; local tests do not imply final success | quality checkpoint with kind=intermediate and a matching commit |
| successful | Current main-agent conclusion complete, all declared verification passing and applicable, delivery complete and recovery confirmed | quality checkpoint with kind=successful and a matching commit |

Use \`xirang quality checkpoint <change-name> ${options('kind', 'commit')} [${options('review')}] [${options('version')}] ${options('json')}\`.
The baseline checkpoint must be recorded before delegation start. Explicit revalidation establishes a new active association through review --begin; its new passing baseline Review needs a new checkpoint association, while all prior Git commits and historical checkpoint records remain preserved. Ordinary continuation reuses its established baseline. Create a real commit containing the intended current code or reuse an existing matching commit; never use an empty commit merely to create a checkpoint. Keep the immutable Apply baseCommit and workspace identity. Later delegations reuse the established baseline Review and may use a current matching recovery commit or the original baseline recovery commit.

Save intermediate code only when useful, with no per-direction commit requirement. Save the final successful checkpoint after conclusion complete. Preserve existing commits, records and failure history. Prefer a verified local repair or reversal that retains reliable work; do not automatically reset or clean the whole workspace. If local recovery cannot be confirmed, restore an identifiable baseline without discarding unrelated work or history; if reliability still cannot be established, stop and return the evidence gap to the main agent. Later code changes require reassessing affected verification; an older successful checkpoint is no proof of the new state.`;
}

export function renderQualityErrorRecovery(): string {
  return `**Quality diagnostics and recovery**

Read code, diagnostics, version, status, gaps and allowedNextOperations. status is read-only; an empty list of suggested operations is not a permanent terminal and is not permission to invent an operation.
- Invalid payload or option: consult the generated schemas and option list, correct the request, and retain the rejected evidence. Use --input or --from, never both. review submit uses result. delegation and conclusion take --version on the command, not inside the JSON.
- STALE_QUALITY_VERSION: re-read status, reconcile intervening records and disk state, then submit against the current version. Do not change only the version to overwrite work you have not inspected.
- Revalidation input rejected: use baseline scope, omit delegationIds, supply a nonempty reason and current --version, and declare previousFlowStopped=true only after confirming the old flow and pending writes/recovery stopped. An explicit request does not bypass store integrity checks. After an interrupted response inspect the association before retrying; preserve all historical records and code.
- Missing baseline or checkpoint: obtain the actual independent baseline Review when absent; if a valid passing Review already matches current code, record its matching baseline checkpoint. Do not rerun Review just because a checkpoint is missing.
- VERIFICATION_FAILED: inspect the captured command, output and before/after state. Failure or code changes during execution remain evidence, but cannot count as successful current verification. Repair or rerun affected verification; never report a fabricated pass.
- Invalid or stale required evidence, missing delivery or conclusion: use the shared optimization reference to address that specific gap. Reassess affected validation rather than automatically rerunning a whole Change Review.
- CHECKPOINT_STATE_MISMATCH: inspect code and commit contents; use a real matching commit. Do not force an association to an unrelated SHA.
- Unsupported legacy command/config/record: preserve code, archives, commits and history. directionLimit, directionRetries and minImpactLevel are retired. Do not silently reinterpret, migrate, delete, or downgrade old records to unblock the gate. The main agent and user decide continuation.
- Store lock, incomplete log/snapshot, mismatch, or uncertain recovery: stop dependent writes, confirm the previous writer has stopped and preserve all material. Do not hand-edit hashes, delete history, or guess which record to remove. Report the exact missing evidence.
- SEAL_NOT_READY: address every reported completion gap through the owning operation. A skipped optional optimization still needs independent baseline Review, applicable successful tests, main-agent conclusion and final successful checkpoint.

Use ${QUALITY_RECOVERY_REFERENCE} for interrupted delegation recovery and explicit re-verification requests. Ordinary repairable failures do not create a permanent unsafe lock.`;
}

export function renderQualityFastPath(): string {
  return `**Proportionate optimization**
After baseline Review and a recoverable checkpoint, delegate an initial fresh-context Opt unless optimization is disabled or the user refuses. Opt may combine changes and share relevant local tests. Main may finish after inspecting one delivery or commission further fresh exploration; there is no fixed round count or exhaustion proof. Main decides whether cumulative local tests suffice or whether full tests and incremental Review are required, and records reasons. Tests remain mandatory. Required Review and targeted independent Review of a repaired baseline defect cannot be waived by main-agent judgment.`;
}

export function renderQualityOverview(entryCommand = 'xirang quality'): string {
  return [
    'Quality records independent Review, delegated implementation, real verification, and main-agent completion decisions.',
    'Run commands from the validated project root. CLI owns IDs, versions, timestamps and execution-state associations.',
    'Main owns scope, continued investment, semantic adequacy and final verification requirements; Opt implements/tests; Reviewer independently inspects without writes.',
    'Status and seal use the same completion conditions. Completion requires all_done with no gaps, including a current final conclusion and successful checkpoint.',
    'Optimization skip is explicit and does not waive baseline Review or applicable tests. Old direction input/configuration is unsupported and preserved for diagnosis.',
    '',
    'Options (from the command definitions; each command exposes its applicable subset)',
    ...Object.values(qualityOptionMetadata).map(option => `  ${option.flags}: ${option.label}`),
    '',
    'Exit codes',
    ...QUALITY_EXIT_CODES.map(item => `  ${item.code}: ${item.meaning}`),
    '',
    `Subcommands: ${QUALITY_SUBCOMMANDS.map(name => `${entryCommand} ${name}`).join(', ')}`,
  ].join('\n');
}

export function renderReviewHelp(): string {
  const beginExample = commandSchemas.reviewBegin.parse({ assignment: 'Independently review the complete Change implementation.' });
  const revalidationExample = commandSchemas.reviewBegin.parse({ scope: 'baseline', assignment: 'Independently revalidate the complete Change implementation.', revalidation: { reason: 'The user requested a new assessment of the existing implementation.', previousFlowStopped: true } });
  return [
    `Begin: xirang quality review <change-name> ${options('begin', 'input', 'json')}`,
    `Submit: xirang quality review <change-name> ${options('review', 'version', 'from', 'json')}`,
    'Begin before launching the independent Reviewer. Retain review.reviewId and version. Submit the actual complete Reviewer response using that reviewId and the reconciled current version. Begin cannot include --review. Ordinary begin does not accept --version; explicit revalidation requires --version.',
    'Only for a user-requested fresh verification, use scope=baseline with a nonempty revalidation.reason and revalidation.previousFlowStopped=true after main has confirmed that the original flow and pending result handling/writes/recovery have stopped. The declaration does not perform process detection. Omit delegationIds. The existing --version supplies expectedVersion; it must match the reconciled current quality version.',
    'A successful revalidation preserves the prior snapshot core and reason in associated revalidationHistory, retains every earlier history entry and raw execution evidence file, continues the append-only log/version, and starts one new baseline Review. No old PASS, delegation, test evidence, skip, plan/conclusion, checkpoint or Sync association remains active. Code, Git commits, workspace identity and immutable baseCommit are preserved. Status requires the new baseline Review; reuse its returned reviewId for the fresh Reviewer handoff.',
    'History supports reading, not new completion. Ordinary fixes and interrupted-delegation recovery do not request revalidation. Unsupported or inconsistent stores fail closed without migration or deletion. After an interrupted response, inspect current status/history before retrying; do not repeat a completed revalidation blindly. See the shared quality recovery reference for the continuation.',
    'The caller submits; Reviewer remains read-only. CLI applies only CRITICAL writeBackPlan entries before recording tasksFileHash and Review. Do not duplicate the writeback manually.',
    'Scope baseline covers the complete Change and has no delegationIds. Incremental Review covers the assigned cumulative affected subset. Defect-repair Review covers the defect and its impact; use exactly the eventual repairScope text and the delegation set that actually performed the repair.',
    'Provide a nonempty summary and at least one existing project-relative regular evidence file outside CLI quality runtime storage. Put gitDiffSummary inside summary; it is not an accepted top-level field. Use exact taskLine for unmark, or taskLine=null for append_correction. Both require correctionType and summary or nextAction. Writeback is empty without CRITICAL findings; CRITICAL requires FAIL_NEEDS_CORRECTIONS and corrections.',
    'A Review whose code changes during assessment is retained as invalid. A historical baseline never proves optimized code was reviewed. A main-agent no-additional-Review decision is not submitted here.',
    '', payloadSchemas('reviewBegin', 'reviewSubmit'), '',
    'Minimal begin payload (generated and validated by the runtime schema; supply the selected real Change name to the command):',
    JSON.stringify(beginExample),
    'Explicit revalidation payload (only after the user request and stopped-flow confirmation; include --version <current-version> on begin):',
    JSON.stringify(revalidationExample),
  ].join('\n');
}

export function renderDelegationHelp(): string {
  return [
    `xirang quality delegation <change-name> ${options('version', 'from', 'json')}`,
    'Use --input instead of --from for inline JSON. Start is persisted before the first implementation or test edit. Read baselineReviewId from the established independent baseline Review and recoveryCommit from its recorded recoverable checkpoint; do not invent IDs. Later delegations retain that original baseline Review.',
    'Save uses the returned delegationId, a single report, and actual evidenceIds. Use delivery=progress for active work, abandonment, pause or incomplete handoff; delivered means this delegation is handed over, not that the Change is complete. Set unresolved truthfully. Save abandonment at the time it happens; preserve item, reason and treatment. Save actual progress, tests and issues at pause and handoff. Other saves are by need.',
    'Reports contain retained changes/benefit/scope/preservation, actual tests/results/evidence, abandoned or unfinished work/reversal/issues (or explicit none), and follow-up optimization/verification recommendations with reasons. Shared concise explanations are allowed. CLI checks structure and association, not prose adequacy.',
    'Skip basis=disabled requires optimization.enabled=false; otherwise user_refusal requires actual user refusal. Skip does not fabricate a delivery or waive baseline and verification.',
    '', payloadSchemas('delegationStart', 'delegationSave', 'delegationSkip'),
  ].join('\n');
}

export function renderVerificationHelp(): string {
  return [
    `xirang quality verification <change-name> [${options('delegation')}] [${options('scope')}] ${options('json')} -- <executable> <args...>`,
    'Supply actual executable argv after --. Put --json and all quality options before --. This command executes the process; it does not accept --input/--from or a claimed result. It captures stdout/stderr, exit status and before/after code manifests, and returns verification.evidenceId and verification.evidenceFile.',
    'Run relevant project tests, not a dummy successful process. Use the actual delegationId for Opt work; omit it for main-agent verification when no delegation performed that work. Default scope is verification. Repair evidence for a confirmed baseline defect must use --scope defect-repair.',
    'Serialize writes and verification so a changed-during-run result cannot be mistaken for success. Save failures truthfully. A later report references the original execution state; it never rebinds that run to later code.',
  ].join('\n');
}

export function renderConclusionHelp(): string {
  return [
    `xirang quality conclusion <change-name> ${options('version', 'from', 'json')}`,
    'The main agent reads actual delivery, code and outputs and decides cumulative verification scope. Execute required tests and independent Reviews, inspect results, then create the plan with their actual IDs. A plan records requirements; it does not prove them satisfied. Complete references the returned plan.planId and records final reasons. All writes use the current reconciled global --version.',
    'Include every cumulative delegation, including those returned for correction. Latest saves must be delivered and unresolved=false. Explicit skip permits an empty delegation set, but still needs successful actual test evidence. verificationPlan is nonempty and explains scopes/reasons. requiredEvidenceIds includes the actual successful runs needed for completion.',
    'requiredReviewIds contains actual required incremental Reviews, each scoped to its real nonempty affected subset of cumulative delegations; it need not cover every delegation. Record why no incremental Review/full suite is needed when that is the risk decision. Never create a Reviewer PASS for that decision.',
    'For each confirmed pre-optimization defect of this Change, baselineDefects links problem, repairScope, repairEvidenceIds and its independently passing defect-repair reviewId. Repair evidence also belongs in requiredEvidenceIds and uses scope=defect-repair. The Review assignment must exactly equal repairScope; its delegationIds must equal the actual repair-evidence delegation set (empty for a main-agent repair without a delegation). Do not put defect-repair Review IDs into requiredReviewIds, which is for incremental Reviews.',
    'When a successful run or scoped Review from S1 is unaffected by the actual changes to S2, applicability records exactly one evidenceId or reviewId, the applicable scope, concrete differenceBasis, reason and affected=false. CLI associates the judgment with current code while retaining the original execution record. Main must inspect dependencies and justify this; failure, missing results or known affected validation cannot be excused. A local A run at S1 may remain applicable after independent B at S2; changing A\'s shared helper requires examining impact and rerunning affected checks.',
    'Set recoveryConfirmed only when reliable recovery is established and unresolvedIssues truthfully. Complete must wait for every required verification to pass and remain applicable. New code or changed delivery requires reassessment and a new plan. Record a current matching successful checkpoint after complete; status/seal stay blocked until that checkpoint exists.',
    '', payloadSchemas('completionPlan', 'completionComplete'),
  ].join('\n');
}

export function renderQualityCliReference(): string {
  return [
    '# Quality CLI', renderQualityOverview(),
    'JSON payload shapes below are generated from commandSchemas, and option spellings from qualityOptionMetadata. Runtime refinements and state/association prerequisites still apply; schema shape alone is not acceptance. Use --from with a real JSON file outside the code manifest (for example an external temporary file), or correctly quoted --input. Do not create report payload files inside the project after Review begin or after final verification; their addition would itself change the captured code state. Each response supplies version; use actual returned IDs, never example IDs or authored hashes.',
    renderReviewHelp(), renderDelegationHelp(), renderVerificationHelp(), renderConclusionHelp(),
    renderQualityCheckpointStateMachine(), renderQualityStateDiagram(), renderQualityFastPath(), renderQualityErrorRecovery(),
  ].join('\n\n');
}
