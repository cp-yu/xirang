import type { Command } from 'commander';
import { PARTITIONS } from '../core/model/types.js';
import {
  getCandidateStatus,
  initializeCandidate,
  type CandidateBaselineInput,
  type CandidateStatus,
} from '../core/candidate/workspace.js';
import {
  validateCandidate,
  type CandidateValidationResult,
} from '../core/candidate/validator.js';
import {
  promoteCandidate,
  recoverPendingCandidatePromotions,
} from '../core/candidate/promotion.js';

function baselineFromOptions(options: { from?: string; fromPath?: string }): CandidateBaselineInput {
  if (options.fromPath && options.from) {
    throw new Error('Use either --from <current|clean> or --from-path <path>, not both.');
  }
  if (options.fromPath) return { kind: 'path', path: options.fromPath };
  if (options.from === 'current' || options.from === 'clean') return { kind: options.from };
  if (options.from) throw new Error('--from must be "current" or "clean".');
  throw new Error('Candidate init requires --from <current|clean> or --from-path <path>.');
}

export function formatCandidateStatus(status: CandidateStatus): string {
  if (!status.active) {
    return [
      'No active Candidate.',
      status.guidance.init,
      `History: ${status.history.count} build(s), ${status.history.bytes} byte(s)`,
    ].join('\n');
  }
  const ready = Object.values(status.readiness).every(Boolean);
  return [
    `Candidate: active (${status.baseline?.kind ?? 'unknown'} baseline)`,
    ...PARTITIONS.map(partition => `${partition}: ${status.inventory.partitions[partition].length} file(s)`),
    `Candidate bytes: ${status.inventory.bytes}`,
    `History: ${status.history.count} build(s), ${status.history.bytes} byte(s)`,
    `Validation readiness: ${ready ? 'ready' : 'incomplete'}`,
    `Resume: ${status.guidance.resume}`,
    `Restart: ${status.guidance.restart}`,
  ].join('\n');
}

function printStatus(status: CandidateStatus): void {
  console.log(formatCandidateStatus(status));
}

export function formatCandidateValidation(result: CandidateValidationResult): string {
  const lines = [
    `Candidate validation: ${result.valid ? 'valid' : 'invalid'}`,
    ...PARTITIONS.map(partition => `${partition}: ${result.inventory.partitions[partition].length} file(s)`),
    `Candidate bytes: ${result.inventory.bytes}`,
    `Formal comparison baseline: ${result.comparison.baseline === 'formal' ? 'available' : 'absent'}`,
    ...(result.comparison.diff === 'available'
      ? [`Formal diff entries: ${result.diff!.summary.total}`]
      : ['Formal diff: unavailable (formal model absent)']),
  ];
  if (result.reviewDigest) lines.push(`Review digest: ${result.reviewDigest}`);
  for (const item of result.diagnostics) {
    const location = item.location ? `:${item.location.line}:${item.location.column}` : '';
    lines.push(`${item.level} ${item.code} ${item.path}${location} ${item.message}`);
  }
  return lines.join('\n');
}

export function registerCandidateCommand(program: Command): void {
  const candidate = program
    .command('candidate')
    .description('Manage the active Project Build Candidate');

  candidate
    .command('init')
    .description('Create the isolated active Candidate workspace')
    .option('--from <kind>', 'Starting point: current or clean')
    .option('--from-path <path>', 'Use an explicit source directory carrying the four Semantic Model partitions')
    .action(async (options: { from?: string; fromPath?: string }) => {
      await recoverPendingCandidatePromotions(process.cwd());
      const status = await initializeCandidate(process.cwd(), baselineFromOptions(options));
      printStatus(status);
    });

  candidate
    .command('status')
    .description('Report active Candidate and history state without writing files')
    .option('--json', 'Output structured JSON')
    .action(async (options: { json?: boolean }) => {
      const status = await getCandidateStatus(process.cwd());
      if (options.json) console.log(JSON.stringify(status, null, 2));
      else printStatus(status);
    });

  candidate
    .command('validate')
    .description('Validate the complete Candidate and compute its review digest')
    .option('--json', 'Output structured JSON')
    .action(async (options: { json?: boolean }) => {
      const result = await validateCandidate(process.cwd());
      console.log(options.json ? JSON.stringify(result, null, 2) : formatCandidateValidation(result));
      if (!result.valid) process.exitCode = 1;
    });

  candidate
    .command('promote')
    .description('Promote the exact user-confirmed Candidate version')
    .requiredOption('--digest <reviewDigest>', 'User-confirmed Candidate review digest')
    .option('--json', 'Output structured JSON')
    .action(async (options: { digest: string; json?: boolean }) => {
      // promoteCandidate recovers pending promotions before mutating formal source.
      const result = await promoteCandidate(process.cwd(), options.digest);
      if (options.json) console.log(JSON.stringify(result, null, 2));
      else {
        console.log(`Candidate promoted: ${result.reviewDigest}`);
        console.log(`History: ${result.historyPath}`);
        console.log(`Formal files changed: ${result.files.length}`);
      }
    });
}
