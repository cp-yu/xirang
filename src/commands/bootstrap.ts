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
    message: 'Select spec granularity',
    choices: [
      { name: 'coarse — fewer, wider grouped specs', value: 'coarse' },
      { name: 'fine — per-capability specs', value: 'fine' },
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
    spinner.succeed(`Bootstrap workspace ${result.restarted ? 'restarted' : 'created'} at openspec/bootstrap/`);
    console.log(`  Phase: ${metadata.phase}`);
    console.log(`  Mode: ${metadata.mode}`);
    if (result.historyPath) {
      console.log(`  Previous workspace snapshot: ${result.historyPath}`);
    }
    console.log();
    if (metadata.mode === 'opsx-first') {
      console.log('This mode writes the formal OPSX bundle plus a README-only specs starter. Add behavior specs later through normal change workflows.');
      console.log();
    } else if (metadata.mode === 'refresh') {
      console.log('Refresh mode rebuilds a complete candidate from all current repository evidence.');
      console.log('The existing formal OPSX v2 files are review-only baseline evidence and are replaced atomically after approval.');
      console.log();
    } else if (metadata.baseline_type === 'raw') {
      console.log('Full mode will generate the formal OPSX bundle plus complete valid candidate specs for each capability.');
      console.log();
    }
    if (result.restarted) {
      console.log('This run starts fresh from init while retaining the previous workspace as audit history.');
      console.log();
    }
    console.log('Next: Advance to scan, then discover domains.');
    console.log('  openspec bootstrap advance scan');
    console.log('  Use /opsx:bootstrap or openspec bootstrap instructions scan');
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
  console.log('Bootstrap: openspec');

  if (!status.initialized) {
    console.log('Initialized: no');
    console.log(`Baseline: ${status.baselineType}`);
    console.log(`Supported: ${status.supported ? 'yes' : 'no'}`);
    console.log(`Allowed modes: ${status.allowedModes.length > 0 ? status.allowedModes.join(', ') : '(none)'}`);
    console.log(`Reason: ${status.reason}`);
    if (status.nextAction === 'init' && status.allowedModes.length > 0) {
      console.log();
      console.log(`Next: openspec bootstrap init --mode ${status.allowedModes[0]}`);
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
      console.log('Restart snapshots the retained workspace into openspec/bootstrap-history/ before creating a fresh openspec/bootstrap/.');
    }
    return;
  }

  console.log(`Phase: ${status.phase} (${phaseIdx + 1}/${BOOTSTRAP_PHASES.length})`);
  if (status.transitionCommand) {
    console.log(`Transition: ${status.transitionCommand}`);
  }
  console.log(`Candidate: ${status.candidateState}`);
  console.log(`Review: ${status.reviewState}${status.reviewApproved ? ' (approved)' : ''}`);

  if (status.totalDomains > 0) {
    console.log(`Domains: ${status.mappedDomains}/${status.totalDomains} mapped`);
    console.log();

    for (const dom of status.domains) {
      const indicator = dom.reviewed
        ? chalk.green('[x]')
        : dom.mapped
          ? chalk.yellow('[~]')
          : chalk.red('[ ]');

      const capText = dom.mapped ? `${dom.capabilityCount} capabilities` : 'discovered, unmapped';
      console.log(`  ${indicator} ${dom.id}  ${capText}  confidence: ${dom.confidence}`);
    }
  } else if (phaseIdx < BOOTSTRAP_PHASES.indexOf('scan')) {
    console.log();
    console.log('No domains discovered yet. Run `openspec bootstrap advance scan` next.');
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
    lines.push('Restart moves the current openspec/bootstrap/ into openspec/bootstrap-history/ and creates a fresh workspace from init.');
    lines.push('Use the retained snapshot for audit or diff; do not delete openspec/bootstrap/ as the normal restart path.');
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
  lines.push(`Run: openspec bootstrap init --mode ${status.allowedModes[0]} --granularity coarse|fine`);

  if (status.baselineType === 'specs-based') {
    lines.push('', 'Bootstrap will preserve existing specs, add missing capability specs, and fail fast on target-path conflicts.');
  }

  if (status.baselineType === 'formal-opsx') {
    lines.push('', 'Refresh rebuilds a complete candidate from all current repository evidence.');
    lines.push('The old formal OPSX v2 model is used only for the review diff.');
    lines.push('After approval, promotion atomically replaces both formal OPSX v2 files.');
  }

  if (status.baselineType === 'raw') {
    lines.push('', 'Use `full` to prepare the formal OPSX bundle plus complete valid specs for each mapped capability.');
    lines.push('Use `opsx-first` to prepare the formal OPSX bundle plus a README-only specs starter, then add behavior specs later through normal change workflows.');
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

Run: openspec bootstrap init --mode ${mode} --granularity coarse|fine

This creates the workspace at openspec/bootstrap/ with scope configuration. Initial init requires explicit granularity; a completed workspace restart inherits retained scope.yaml granularity unless explicitly overridden.
${mode === 'opsx-first'
  ? 'This mode prepares the formal OPSX bundle plus a README-only specs starter. Add behavior specs incrementally later through normal change workflows.'
  : mode === 'refresh'
    ? 'This mode rebuilds a complete candidate from current source, specs, config, and reviewed evidence; the existing formal OPSX v2 bundle is review-only baseline evidence.'
  : baselineType === 'specs-based'
    ? 'This mode preserves existing specs, adds missing capability specs, and fails fast if a generated target path already exists.'
    : 'This mode prepares the formal OPSX bundle plus complete valid candidate specs for each mapped capability.'}
After init, run \`openspec bootstrap advance scan\`; the agent can then analyze the codebase for domain candidates.`;

    case 'scan':
      return `Scan the codebase to discover candidate domains.

1. Read package.json, README, and OpenSpec config for project context
2. Inspect openspec/specs/ for existing domain/capability evidence
3. Scan source code for structural boundaries (directories, modules, entrypoints)
4. Write evidence.yaml with candidate domains, confidence levels, and sources

Each domain entry should have:
- id: dom.<area> (e.g., dom.auth, dom.cli)
- confidence: high | medium | low
- sources: evidence trail (spec:<path>, code:<path>)
- intent: one-sentence domain description

Prefer fewer domains with solid evidence over exhaustive noise.
${mode === 'refresh'
  ? '\nFor refresh, scan all current source, specs, configuration, and package/build metadata. The existing formal OPSX v2 model is review-only evidence and must not supply candidate content.'
  : ''}
After writing evidence.yaml, run: openspec bootstrap validate`;

    case 'map':
      return `Map capabilities and semantic relations per domain.

For each domain in evidence.yaml, create domain-map/<domain-id>.yaml:
- domain: the domain node definition
- capabilities: list of cap.<domain>.<action> entries
- relations: precise Registry-defined belongs_to/invokes/consumes/precedes/constrains/validates facts
- review_gaps: evidence and reason for interactions that cannot be classified precisely

Map one domain at a time, but derive every entry from the complete current scan.
Run: openspec bootstrap status to see per-domain progress.
After mapping all domains, run: openspec bootstrap validate`;

    case 'review':
      return `Review the mapped architecture before promotion.

1. Run: openspec bootstrap validate (regenerates candidate files and review.md from current evidence.yaml + domain-map/*.yaml)
2. Review review.md — check each domain's boundaries, capabilities, semantic relation type/direction, ownership, and review gaps${mode === 'refresh' ? ', plus the complete-candidate diff against the old formal review baseline' : ''}
3. Mark each domain checkbox as reviewed
4. If evidence or domain maps change, run validate again and re-approve the regenerated review

Low-confidence domains appear first for priority review.
When all checkboxes are checked, proceed to promote.`;

    case 'promote':
      return `Promote the candidate OPSX to formal project files.

Run: openspec bootstrap promote

This re-validates scan, map, and review gates before writing any formal OPSX files.
Successful promotion writes the two formal OPSX v2 files and retains the bootstrap workspace as audit history.
${mode === 'opsx-first'
  ? 'Opsx-first writes the formal OPSX bundle plus only openspec/specs/README.md.'
  : mode === 'refresh'
    ? 'Refresh rebuilds the complete candidate from current evidence, uses the old model only for review diff, replaces both formal files, and fails fast on spec-path conflicts.'
    : baselineType === 'specs-based'
    ? 'Full mode preserves your existing specs, adds only missing capability specs, and fails fast on target-path conflicts.'
    : 'Full mode writes the formal OPSX bundle plus valid specs covering all mapped capabilities (coarse: grouped via spec_groups, fine: one per capability).'}}
After a completed retained workspace, start the next refresh run with: openspec bootstrap init --mode refresh --restart. It inherits retained scope.yaml granularity; pass --granularity coarse|fine to override it.`;
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
    throw new Error('No bootstrap workspace found. Run `openspec bootstrap init` first.');
  }
  if (status.workspaceState === 'completed') {
    throw new Error('Bootstrap workspace is complete. Start a new retained-workspace run with the reported restart command.');
  }
  if (status.phase !== 'init' || targetPhase !== 'scan') {
    throw new Error(
      `Public bootstrap advance only supports 'init' -> 'scan'. Current: '${status.phase}', target: '${targetPhase}'. Later transitions are gate-driven by \`openspec bootstrap validate\`.`
    );
  }

  await advancePhase(projectRoot, 'scan');
  const result = { fromPhase: 'init', toPhase: 'scan' } as const;
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log('Bootstrap phase advanced: init -> scan');
  console.log('Next: collect repository evidence in openspec/bootstrap/evidence.yaml, then run `openspec bootstrap validate`.');
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
    console.log('This will write formal OPSX files and retain the bootstrap workspace as audit history.');
    console.log('Run with -y to confirm, or use the /opsx:bootstrap skill.');
    return;
  }

  const spinner = ora('Promoting bootstrap to formal OPSX...').start();

  try {
    const result = await promoteBootstrap(projectRoot);
    spinner.succeed('Bootstrap promoted to formal OPSX files');
    console.log('  Written: .opsx/project.opsx.yaml');
    console.log('  Written: .opsx/project.opsx.relations.yaml');
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
