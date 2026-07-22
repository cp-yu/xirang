import path from 'path';
import ora from 'ora';
import chalk from 'chalk';
import {
  getBootstrapPreInitStatus,
  getAllowedBootstrapModes,
  initBootstrap,
  getBootstrapStatus,
  validateGate,
  refreshBootstrapDerivedArtifacts,
  promoteBootstrap,
  readBootstrapState,
  advancePhase,
  BOOTSTRAP_PHASES,
  type BootstrapMode,
  type BootstrapStatus,
} from '../utils/bootstrap-utils.js';
import { backfillSpecs, readSemanticMappings } from '../core/backfill-specs.js';
import { resolveSchema } from '../core/artifact-graph/resolver.js';
import { buildFileDefinitionAuthoringInstruction } from '../core/artifact-graph/instruction-loader.js';
import type { BootstrapPhase } from '../utils/bootstrap-utils.js';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BootstrapInitOptions {
  mode?: string;
  scope?: string;
  restart?: boolean;
  granularity?: string;
}

export interface BootstrapStatusOptions {
  json?: boolean;
}

export interface BootstrapInstructionsOptions {
  phase?: string;
  json?: boolean;
}

export interface BootstrapValidateOptions {
  json?: boolean;
}

export interface BootstrapAdvanceOptions {
  json?: boolean;
}

export interface BootstrapPromoteOptions {
  yes?: boolean;
}

export interface BootstrapBackfillOptions {
  json?: boolean;
  mappings?: string;
}

// ─── Init ────────────────────────────────────────────────────────────────────

function isInteractive(): boolean {
  return Boolean((process.stdout as NodeJS.WriteStream & { isTTY?: boolean }).isTTY);
}

function parseBootstrapMode(mode: string | undefined): BootstrapMode {
  if (mode === 'full' || mode === 'opsx-first' || mode === 'refresh') {
    return mode;
  }

  throw new Error(`Invalid bootstrap mode '${mode}'. Valid modes: full, opsx-first, refresh`);
}

async function resolveBootstrapMode(
  projectRoot: string,
  requestedMode: string | undefined
): Promise<BootstrapMode> {
  if (requestedMode) {
    return parseBootstrapMode(requestedMode);
  }

  const preInitStatus = await getBootstrapPreInitStatus(projectRoot);
  if (!preInitStatus.supported) {
    throw new Error(preInitStatus.reason);
  }

  const allowedModes = getAllowedBootstrapModes(preInitStatus.baselineType);
  if (!isInteractive()) {
    throw new Error(
      `Missing required option --mode in non-interactive mode. Valid modes: ${allowedModes.join(', ')}`
    );
  }

  const { select } = await import('@inquirer/prompts');
  return select({
    message: 'Select bootstrap mode',
    choices: allowedModes.map((mode) => ({ name: mode, value: mode })),
  });
}

function parseGranularity(value: string | undefined): 'coarse' | 'fine' {
  if (!value) {
    throw new Error('Missing required option: --granularity coarse|fine');
  }
  if (value !== 'coarse' && value !== 'fine') {
    throw new Error(`Invalid granularity '${value}'. Valid values: coarse, fine`);
  }
  return value;
}

async function resolveGranularity(
  requested: string | undefined,
  restart: boolean | undefined
): Promise<'coarse' | 'fine' | undefined> {
  if (requested) {
    return parseGranularity(requested);
  }

  if (restart) {
    return undefined;
  }

  if (!isInteractive()) {
    throw new Error('Missing required option: --granularity coarse|fine');
  }

  const { select } = await import('@inquirer/prompts');
  return select({
    message: 'Select Element Contract granularity',
    choices: [
      { name: 'coarse — fewer, wider grouped Element Contracts', value: 'coarse' },
      { name: 'fine — per-element Element Contracts', value: 'fine' },
    ],
  });
}

export async function bootstrapInitCommand(options: BootstrapInitOptions): Promise<void> {
  const projectRoot = process.cwd();
  const mode = await resolveBootstrapMode(projectRoot, options.mode);
  const granularity = await resolveGranularity(options.granularity, options.restart);
  const scope = options.scope ? options.scope.split(',').map(s => s.trim()) : undefined;

  const spinner = ora(`${options.restart ? 'Restarting' : 'Initializing'} bootstrap workspace (mode: ${mode})...`).start();

  try {
    const result = await initBootstrap(projectRoot, { mode, scope, restart: options.restart, granularity });
    const metadata = result.metadata;
    spinner.succeed(`Bootstrap workspace ${result.restarted ? 'restarted' : 'created'} at .opsx/bootstrap/`);
    console.log(`  Phase: ${metadata.phase}`);
    console.log(`  Mode: ${metadata.mode}`);
    if (result.historyPath) {
      console.log(`  Previous workspace snapshot: ${result.historyPath}`);
    }
    console.log();
    if (metadata.mode === 'opsx-first') {
      console.log('This mode writes the v1 Semantic Model architecture plus a Project Contract and README starter. Add Element Contracts later through normal change workflows.');
      console.log();
    } else if (metadata.mode === 'refresh') {
      console.log('Refresh mode rebuilds a complete candidate for the v1 Semantic Model from all current repository evidence.');
      console.log('The legacy formal OPSX v2 model is review-only input evidence; approval promotes the reviewed v1 Semantic Model and Element Contracts.');
      console.log();
    } else if (metadata.baseline_type === 'raw') {
      console.log('Full mode will generate a v1 Semantic Model candidate with generic elements and singular-bound Element Contracts.');
      console.log();
    }
    if (result.restarted) {
      console.log('This run starts fresh from init while retaining the previous workspace as audit history.');
      console.log();
    }
    console.log('Next: Advance to scan, then discover elements.');
    console.log('  opsx bootstrap advance scan');
    console.log('  Use /opsx:bootstrap or opsx bootstrap instructions scan');
  } catch (error) {
    spinner.fail(`Failed to initialize bootstrap`);
    throw error;
  }
}

// ─── Status ──────────────────────────────────────────────────────────────────

export async function bootstrapStatusCommand(options: BootstrapStatusOptions): Promise<void> {
  const projectRoot = process.cwd();
  const spinner = options.json ? null : ora('Loading bootstrap status...').start();

  try {
    const status = await getBootstrapStatus(projectRoot);
    spinner?.stop();

    if (options.json) {
      console.log(JSON.stringify(status, null, 2));
      return;
    }

    printBootstrapStatus(status);
  } catch (error) {
    spinner?.stop();
    throw error;
  }
}

function printBootstrapStatus(status: BootstrapStatus): void {
  console.log('Bootstrap: opsx');

  if (!status.initialized) {
    console.log('Initialized: no');
    console.log(`Baseline: ${status.baselineType}`);
    console.log(`Supported: ${status.supported ? 'yes' : 'no'}`);
    console.log(`Allowed modes: ${status.allowedModes.length > 0 ? status.allowedModes.join(', ') : '(none)'}`);
    console.log(`Reason: ${status.reason}`);
    if (status.nextAction === 'init' && status.allowedModes.length > 0) {
      console.log();
      console.log(`Next: opsx bootstrap init --mode ${status.allowedModes[0]}`);
    }
    return;
  }

  console.log(`Workspace: ${status.workspaceState}`);
  const phaseIdx = BOOTSTRAP_PHASES.indexOf(status.phase);
  console.log(`Baseline: ${status.baselineType}`);
  console.log(`Mode: ${status.mode}`);
  if (status.workspaceState === 'completed') {
    console.log(`Completed at: ${status.completedAt ?? 'legacy retained workspace'}`);
    if (status.restartCommand) {
      console.log();
      console.log(`Next: ${status.restartCommand}`);
      console.log('Restart snapshots the retained workspace into .opsx/bootstrap-history/ before creating a fresh .opsx/bootstrap/.');
    }
    return;
  }

  console.log(`Phase: ${status.phase} (${phaseIdx + 1}/${BOOTSTRAP_PHASES.length})`);
  if (status.transitionCommand) {
    console.log(`Transition: ${status.transitionCommand}`);
  }
  console.log(`Candidate: ${status.candidateState}`);
  console.log(`Review: ${status.reviewState}${status.reviewApproved ? ' (approved)' : ''}`);

  if (status.totalElements > 0) {
    console.log(`Elements: ${status.mappedElements}/${status.totalElements} mapped`);
    console.log();
    for (const element of status.elements) {
      const indicator = element.reviewed
        ? chalk.green('[x]')
        : element.mapped
          ? chalk.yellow('[~]')
          : chalk.red('[ ]');
      console.log(`  ${indicator} ${element.elementId}  kind: ${element.kind}  confidence: ${element.confidence}`);
    }
  } else if (status.totalDomains > 0) {
    console.log(`Elements (legacy input adapter): ${status.mappedDomains}/${status.totalDomains} evidence groups mapped`);
    console.log();

    for (const dom of status.domains) {
      const indicator = dom.reviewed
        ? chalk.green('[x]')
        : dom.mapped
          ? chalk.yellow('[~]')
          : chalk.red('[ ]');

      const elementText = dom.mapped ? 'adapted element group' : 'discovered, unmapped';
      console.log(`  ${indicator} ${dom.id}  ${elementText}  confidence: ${dom.confidence}`);
    }
  } else if (phaseIdx < BOOTSTRAP_PHASES.indexOf('scan')) {
    console.log();
    console.log('No elements discovered yet. Run `opsx bootstrap advance scan` next.');
  }
}

// ─── Instructions ────────────────────────────────────────────────────────────

function getPhaseFileDefinitions(phase: BootstrapPhase) {
  const schema = resolveSchema('bootstrap');
  const artifact = schema.artifacts.find((candidate) => candidate.id === phase);
  if (!artifact) {
    throw new Error(`Bootstrap phase '${phase}' is not defined in the built-in schema.`);
  }
  const files = new Map((schema.files ?? []).map((file) => [file.id, file]));
  return (artifact.files ?? []).map((fileId) => files.get(fileId)!);
}

function printBootstrapInstructionText(
  heading: string,
  fileDefinitions: ReturnType<typeof getPhaseFileDefinitions>,
  instruction: string
): void {
  console.log(heading);
  console.log();
  console.log('<file_definitions>');
  console.log(JSON.stringify(fileDefinitions, null, 2));
  console.log('</file_definitions>');
  console.log();
  console.log('<instruction>');
  console.log(instruction);
  console.log('</instruction>');
}

export async function bootstrapInstructionsCommand(
  phase: string | undefined,
  options: BootstrapInstructionsOptions
): Promise<void> {
  const projectRoot = process.cwd();
  const spinner = options.json ? null : ora('Loading bootstrap instructions...').start();

  try {
    const requestedPhase = (phase ?? 'init') as BootstrapPhase;

    if (!BOOTSTRAP_PHASES.includes(requestedPhase)) {
      spinner?.stop();
      throw new Error(`Invalid phase '${requestedPhase}'. Valid phases: ${BOOTSTRAP_PHASES.join(', ')}`);
    }

    const status = await getBootstrapStatus(projectRoot);
    spinner?.stop();

    if (!status.initialized) {
      const fileDefinitions = getPhaseFileDefinitions('init');
      const instruction = buildFileDefinitionAuthoringInstruction(
        getPreInitInstructions(status, requestedPhase)
      );

      if (options.json) {
        console.log(JSON.stringify({
          initialized: false,
          phase: 'init',
          requestedPhase,
          currentPhase: null,
          baselineType: status.baselineType,
          supported: status.supported,
          allowedModes: status.allowedModes,
          nextAction: status.nextAction,
          reason: status.reason,
          fileDefinitions,
          instruction,
        }, null, 2));
        return;
      }

      printBootstrapInstructionText('## Bootstrap: init phase', fileDefinitions, instruction);
      return;
    }

    const targetPhase = (phase ?? status.phase) as BootstrapPhase;
    const fileDefinitions = getPhaseFileDefinitions(targetPhase);
    const phaseInstruction = status.workspaceState === 'completed'
      ? getCompletedWorkspaceInstructions(status)
      : getPhaseInstructions(targetPhase, status.mode, status.baselineType);
    const instruction = buildFileDefinitionAuthoringInstruction(phaseInstruction);

    if (options.json) {
      console.log(JSON.stringify({
        initialized: true,
        phase: targetPhase,
        currentPhase: status.phase,
        baselineType: status.baselineType,
        mode: status.mode,
        workspaceState: status.workspaceState,
        completedAt: status.completedAt,
        restartCommand: status.restartCommand,
        nextAction: status.nextAction,
        transitionCommand: status.transitionCommand,
        fileDefinitions,
        instruction,
      }, null, 2));
      return;
    }

    printBootstrapInstructionText(
      status.workspaceState === 'completed'
        ? '## Bootstrap: completed workspace'
        : `## Bootstrap: ${targetPhase} phase`,
      fileDefinitions,
      instruction
    );
  } catch (error) {
    spinner?.stop();
    throw error;
  }
}

function getCompletedWorkspaceInstructions(status: Extract<BootstrapStatus, { initialized: true }>): string {
  const lines = [
    'The retained bootstrap workspace belongs to a completed run.',
    '',
    `Baseline: ${status.baselineType}`,
    `Mode: ${status.mode}`,
  ];

  if (status.completedAt) {
    lines.push(`Completed at: ${status.completedAt}`);
  } else {
    lines.push('Completed at: legacy retained workspace (inferred)');
  }

  if (status.restartCommand) {
    lines.push('', `Run: ${status.restartCommand}`);
    lines.push('Restart moves the current .opsx/bootstrap/ into .opsx/bootstrap-history/ and creates a fresh workspace from init.');
    lines.push('Use the retained snapshot for audit or diff; do not delete .opsx/bootstrap/ as the normal restart path.');
  } else {
    lines.push('', 'The current repository baseline does not expose a supported restart mode.');
  }

  return lines.join('\n');
}

function getPreInitInstructions(status: Extract<BootstrapStatus, { initialized: false }>, requestedPhase: BootstrapPhase): string {
  const lines = [
    'Initialize the bootstrap workspace.',
    '',
    `Detected baseline: ${status.baselineType}`,
    status.reason,
  ];

  if (!status.supported) {
    lines.push('', 'Bootstrap cannot start on this repository baseline.');
    return lines.join('\n');
  }

  if (requestedPhase !== 'init') {
    lines.push('', `The requested phase '${requestedPhase}' is unavailable before initialization. Start with init first.`);
  }

  lines.push('', `Allowed modes: ${status.allowedModes.join(', ')}`);
  lines.push(`Run: opsx bootstrap init --mode ${status.allowedModes[0]} --granularity coarse|fine`);

  if (status.baselineType === 'specs-based') {
    lines.push('', 'Bootstrap will preserve existing Element Contracts, add missing contracts for generic elements, and fail fast on target-path conflicts.');
  }

  if (status.baselineType === 'formal-opsx') {
    lines.push('', 'Refresh rebuilds a complete candidate for the v1 Semantic Model from all current repository evidence.');
    lines.push('The legacy formal OPSX v2 model is review-only input evidence for the candidate review diff.');
    lines.push('After approval, promotion atomically writes the reviewed v1 Semantic Model architecture and Element Contracts.');
  }

  if (status.baselineType === 'raw') {
    lines.push('', 'Use `full` to prepare a v1 Semantic Model candidate with generic elements and singular-bound Element Contracts.');
    lines.push('Use `opsx-first` to prepare the v1 Semantic Model architecture, Project Contract, and README starter; add further Element Contracts through normal change workflows.');
  }

  return lines.join('\n');
}

function getPhaseInstructions(
  phase: BootstrapPhase,
  mode: BootstrapMode,
  baselineType: Extract<BootstrapStatus, { initialized: true }>['baselineType']
): string {
  switch (phase) {
    case 'init':
      return `Initialize the bootstrap workspace.

Run: opsx bootstrap init --mode ${mode} --granularity coarse|fine

This creates the workspace at .opsx/bootstrap/ with scope configuration. Initial init requires explicit granularity; a completed workspace restart inherits retained scope.yaml granularity unless explicitly overridden.
${mode === 'opsx-first'
  ? 'This mode prepares the v1 Semantic Model architecture plus a Project Contract and README starter; add further Element Contracts through normal change workflows.'
  : mode === 'refresh'
    ? 'This mode rebuilds a complete candidate for the v1 Semantic Model from current source, Specs, config, and reviewed evidence; the legacy formal OPSX v2 model is review-only input evidence.'
  : baselineType === 'specs-based'
    ? 'This mode preserves existing Element Contracts, adds missing contracts for generic elements, and fails fast if a generated target path already exists.'
    : 'This mode prepares a v1 Semantic Model candidate with generic elements and singular-bound Element Contracts.'}
After init, run \`opsx bootstrap advance scan\`; the agent can then analyze the codebase for element candidates.`;

    case 'scan':
      return `Scan the codebase to discover candidate semantic elements.

1. Read package.json, README, Specs, and OPSX config for project context
2. Identify evidence-backed project-defined kinds and refinement candidates
3. Scan source code for structural boundaries (directories, modules, entrypoints)
4. Write evidence.yaml with generic elements, confidence levels, and sources

Each element entry has:
- elementId: globally unique stable identity
- kind: project-defined element kind
- contractPolicy: required | optional
- localId: LikeC4 navigation identifier
- title and non-empty summary
- confidence: high | medium | low
- sources: evidence trail (spec:<path>, code:<path>)

Legacy \`domains\` evidence remains accepted through the explicit compatibility adapter.
${mode === 'refresh'
  ? '\nFor refresh, scan all current source, specs, configuration, and package/build metadata. The legacy formal OPSX v2 model is review-only input evidence and must not supply candidate content.'
  : ''}
After writing evidence.yaml, run: opsx bootstrap validate`;

    case 'map':
      return `Map refinement parentage, Element Contracts, and semantic relations.

Create one or more domain-map/*.yaml compatibility-path files containing:
- elements: generic candidates with elementId, kind, explicit contractPolicy (required | optional), localId, title, summary, and optional singular-bound Element Contract source
- parent_links: exactly one parent link per non-root element; use project.root for top-level candidates
- relations: precise invokes/produces/consumes/precedes/constrains/validates facts
- review_gaps: evidence and reason for ambiguous parentage, binding, or interaction semantics

Project-defined kinds and arbitrary depth are valid. Do not lower unknown kinds to domain/capability, and do not persist belongs_to/refines/abstracts relations. Legacy \`domain/capabilities\` maps remain accepted only through the compatibility adapter.
Run: opsx bootstrap status to see element mapping progress.
After mapping all elements, run: opsx bootstrap validate`;

    case 'review':
      return `Review the mapped architecture before promotion.

1. Run: opsx bootstrap validate (regenerates candidate files and review.md from current evidence.yaml + domain-map/*.yaml)
2. Review review.md — check each element's kind, explicit contract policy, stable identity, unique parent, contract binding, semantic relation type/direction, and review gaps${mode === 'refresh' ? ', plus the complete-candidate diff against the old formal review baseline' : ''}
3. Mark each element checkbox as reviewed
4. If evidence or element maps change, run validate again and re-approve the regenerated review

Low-confidence elements appear first for priority review.
When all checkboxes are checked, proceed to promote.`;

    case 'promote':
      return `Promote the reviewed v1 Semantic Model candidate.

Run: opsx bootstrap promote

This re-validates scan, map, and review gates before writing the v1 Semantic Model architecture and Element Contracts.
Successful promotion writes the complete \`.opsx/architecture/\` and \`.opsx/specs/\` tree and retains the bootstrap workspace as audit history.
${mode === 'opsx-first'
  ? 'Opsx-first writes the v1 architecture modules, Project Contract, and `.opsx/specs/README.md`; add further Element Contracts through normal change workflows.'
  : mode === 'refresh'
    ? 'Refresh rebuilds the complete candidate from current evidence, uses the legacy model only as review input, promotes the reviewed v1 Semantic Model, and fails fast on contract-path conflicts.'
    : baselineType === 'specs-based'
    ? 'Full mode preserves existing Element Contracts, adds only missing contracts for generic elements, and fails fast on target-path conflicts.'
    : 'Full mode writes v1 architecture modules plus singular-bound Element Contracts (coarse: grouped under one unambiguous element owner, fine: one per element).'}}
After a completed retained workspace, start the next refresh run with: opsx bootstrap init --mode refresh --restart. It inherits retained scope.yaml granularity; pass --granularity coarse|fine to override it.`;
  }
}

// ─── Phase Transition ───────────────────────────────────────────────────────

export async function bootstrapAdvanceCommand(
  targetPhase: string,
  options: BootstrapAdvanceOptions
): Promise<void> {
  const projectRoot = process.cwd();
  const status = await getBootstrapStatus(projectRoot);

  if (!status.initialized) {
    throw new Error('No bootstrap workspace found. Run `opsx bootstrap init` first.');
  }
  if (status.workspaceState === 'completed') {
    throw new Error('Bootstrap workspace is complete. Start a new retained-workspace run with the reported restart command.');
  }
  if (status.phase !== 'init' || targetPhase !== 'scan') {
    throw new Error(
      `Public bootstrap advance only supports 'init' -> 'scan'. Current: '${status.phase}', target: '${targetPhase}'. Later transitions are gate-driven by \`opsx bootstrap validate\`.`
    );
  }

  await advancePhase(projectRoot, 'scan');
  const result = { fromPhase: 'init', toPhase: 'scan' } as const;
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log('Bootstrap phase advanced: init -> scan');
  console.log('Next: collect repository evidence in .opsx/bootstrap/evidence.yaml, then run `opsx bootstrap validate`.');
}

// ─── Validate ────────────────────────────────────────────────────────────────

export async function bootstrapValidateCommand(options: BootstrapValidateOptions): Promise<void> {
  const projectRoot = process.cwd();
  const spinner = options.json ? null : ora('Validating bootstrap...').start();

  try {
    const state = await readBootstrapState(projectRoot);
    const phase = state.metadata.phase;
    const results: Array<{ gate: string; passed: boolean; errors: string[] }> = [];

    // Validate gates based on current phase
    if (BOOTSTRAP_PHASES.indexOf(phase) >= BOOTSTRAP_PHASES.indexOf('scan')) {
      const r = await validateGate(projectRoot, 'scan_to_map');
      results.push({ gate: 'scan_to_map', ...r });
    }
    if (BOOTSTRAP_PHASES.indexOf(phase) >= BOOTSTRAP_PHASES.indexOf('map')) {
      const r = await validateGate(projectRoot, 'map_to_review');
      results.push({ gate: 'map_to_review', ...r });
    }
    if (BOOTSTRAP_PHASES.indexOf(phase) >= BOOTSTRAP_PHASES.indexOf('review')) {
      await refreshBootstrapDerivedArtifacts(projectRoot);
      const r = await validateGate(projectRoot, 'review_to_promote');
      results.push({ gate: 'review_to_promote', ...r });
    }

    spinner?.stop();

    if (options.json) {
      console.log(JSON.stringify({ phase, results }, null, 2));
      return;
    }

    console.log(`Bootstrap phase: ${phase}`);
    console.log();

    let allPassed = true;
    for (const r of results) {
      const icon = r.passed ? chalk.green('✓') : chalk.red('✗');
      console.log(`${icon} ${r.gate}`);
      if (!r.passed) {
        allPassed = false;
        for (const err of r.errors) {
          console.log(`  ${chalk.red('•')} ${err}`);
        }
      }
    }

    if (results.length === 0) {
      console.log('No gates to validate at current phase.');
    }

    // Auto-advance phase if next gate passes
    if (allPassed && results.length > 0) {
      const nextPhaseIdx = BOOTSTRAP_PHASES.indexOf(phase) + 1;
      if (nextPhaseIdx < BOOTSTRAP_PHASES.length) {
        const nextPhase = BOOTSTRAP_PHASES[nextPhaseIdx];
        try {
          await advancePhase(projectRoot, nextPhase);
          console.log();
          console.log(chalk.green(`Phase advanced to: ${nextPhase}`));
        } catch { /* already at or past this phase */ }
      }
    }

    if (!allPassed) {
      process.exitCode = 1;
    }
  } catch (error) {
    spinner?.stop();
    throw error;
  }
}

// ─── Promote ─────────────────────────────────────────────────────────────────

export async function bootstrapPromoteCommand(options: BootstrapPromoteOptions): Promise<void> {
  const projectRoot = process.cwd();

  if (!options.yes) {
    console.log('This will promote the reviewed v1 Semantic Model and retain the bootstrap workspace as audit history.');
    console.log('Run with -y to confirm, or use the /opsx:bootstrap skill.');
    return;
  }

  const spinner = ora('Promoting bootstrap to formal OPSX...').start();

  try {
    const result = await promoteBootstrap(projectRoot);
    spinner.succeed('Bootstrap promoted to the formal v1 Semantic Model');
    console.log('  Written: .opsx/architecture/*.c4');
    console.log('  Written: .opsx/specs/');
    console.log(`  Backfill specs: written ${result.backfill.written.length}, unmatched ${result.backfill.unmatched.length}`);
    console.log(`  ${result.retainedWorkspaceNotice}`);
  } catch (error) {
    spinner.fail('Failed to promote bootstrap');
    throw error;
  }
}

export async function bootstrapBackfillSpecsCommand(options: BootstrapBackfillOptions): Promise<void> {
  const projectRoot = process.cwd();
  const spinner = options.json ? null : ora('Backfilling spec frontmatter...').start();

  try {
    const semanticMappings = options.mappings
      ? await readSemanticMappings(path.resolve(projectRoot, options.mappings))
      : [];
    const result = await backfillSpecs(projectRoot, semanticMappings);
    spinner?.succeed('Backfill specs complete');

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    console.log('Backfill specs complete');
    console.log(`  Written: ${result.written.length}`);
    console.log(`  Unmatched: ${result.unmatched.length}`);
    for (const spec of result.unmatched) {
      console.log(`    - ${spec}`);
    }
    if (result.unmatched.length > 0) {
      console.log('  Run with --json for semantic handoff context and mapping format.');
    }
  } catch (error) {
    spinner?.fail('Failed to backfill specs');
    throw error;
  }
}
