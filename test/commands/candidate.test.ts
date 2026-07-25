import { Command } from 'commander';
import { describe, expect, it } from 'vitest';
import { formatCandidateStatus, registerCandidateCommand } from '../../src/commands/candidate.js';
import type { CandidateStatus } from '../../src/core/candidate/workspace.js';

describe('Candidate command registration', () => {
  it('registers init and status with their current options', () => {
    const program = new Command();
    registerCandidateCommand(program);

    const candidate = program.commands.find((command) => command.name() === 'candidate');
    expect(candidate).toBeDefined();
    expect(candidate?.commands.map((command) => command.name())).toEqual([
      'init',
      'status',
      'validate',
      'promote',
    ]);

    const init = candidate?.commands.find((command) => command.name() === 'init');
    expect(init?.options.map((option) => option.long)).toEqual(['--from', '--from-path']);
    const status = candidate?.commands.find((command) => command.name() === 'status');
    expect(status?.options.map((option) => option.long)).toEqual(['--json']);
    const validate = candidate?.commands.find((command) => command.name() === 'validate');
    expect(validate?.options.map((option) => option.long)).toEqual(['--json']);
    const promote = candidate?.commands.find((command) => command.name() === 'promote');
    expect(promote?.options.map((option) => option.long)).toEqual(['--digest', '--json']);
  });

  it('prints resume and explicit restart guidance for an active Candidate', () => {
    const status: CandidateStatus = {
      active: true,
      baseline: { kind: 'clean', reference: null },
      inventory: { architectureFiles: [], specFiles: [], bytes: 0 },
      history: { count: 0, bytes: 0 },
      readiness: {
        metadata: true,
        build: true,
        specification: true,
        model: true,
        relations: true,
        views: true,
        specsDirectory: true,
      },
      guidance: {
        resume: 'Continue editing the active .xirang/candidate workspace.',
        restart: 'Explicitly remove or archive .xirang/candidate, then run "xirang candidate init" again.',
      },
    };

    expect(formatCandidateStatus(status)).toContain(status.guidance.resume);
    expect(formatCandidateStatus(status)).toContain(status.guidance.restart);
  });
});
