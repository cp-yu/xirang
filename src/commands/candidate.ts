import type { Command } from 'commander';
import {
  getCandidateStatus,
  initializeCandidate,
  type CandidateBaselineInput,
  type CandidateStatus,
} from '../core/candidate/workspace.js';

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
    `Architecture files: ${status.inventory.architectureFiles.length}`,
    `Spec files: ${status.inventory.specFiles.length}`,
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

export function registerCandidateCommand(program: Command): void {
  const candidate = program
    .command('candidate')
    .description('Manage the active Project Build Candidate');

  candidate
    .command('init')
    .description('Create the isolated active Candidate workspace')
    .option('--from <kind>', 'Starting point: current or clean')
    .option('--from-path <path>', 'Use an explicit Architecture and Specs source directory')
    .action(async (options: { from?: string; fromPath?: string }) => {
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
    .action(() => {
      throw new Error('Candidate Semantic Closure validation requires the Target Semantic Model compiler.');
    });

  candidate
    .command('promote')
    .description('Promote the exact user-confirmed Candidate version')
    .requiredOption('--digest <reviewDigest>', 'User-confirmed Candidate review digest')
    .action(() => {
      throw new Error('Candidate promotion requires the shared Target Semantic Model transaction writer.');
    });
}
