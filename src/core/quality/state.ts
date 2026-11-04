import path from 'path';
import { evaluateCompletion, type CompletionEvaluation } from './completion.js';
import { QualityEngineError } from './engine.js';

export interface QualityCompletionStatus extends CompletionEvaluation {
  unsupported?: boolean;
  diagnostic?: string;
}

/** Read-only completion projection. Unsupported snapshots are diagnostics, never normalized. */
export async function readQualityCompletion(changeDir: string, projectRoot: string): Promise<QualityCompletionStatus> {
  try {
    return await evaluateCompletion(changeDir, projectRoot);
  } catch (error) {
    const diagnostic = error instanceof QualityEngineError
      ? `${error.code}: ${error.message}`
      : (error as Error).message;
    return {
      status: 'needs_optimize', manifest: { contractVersion: 2, root: path.resolve(projectRoot), entries: [], hash: '' },
      plans: [], verifications: [], reviews: [], checkpoints: [], changedFiles: [], headDifference: false,
      gaps: ['QUALITY_RECORD_UNSUPPORTED_OR_INVALID'], unsupported: true, diagnostic,
    };
  }
}

interface QualityGateFailureState {
  status?: string;
  changedFiles: string[];
  details: string[];
  information?: unknown;
}

interface ArchiveCompatibility {
  compatible: boolean;
  blockReason?: string;
}

interface QualityGateFailureContext {
  changeName?: string;
  command?: 'sync' | 'archive';
}

export function formatQualityGateFailure(
  state: QualityGateFailureState,
  archiveCompatibility?: ArchiveCompatibility,
  context: QualityGateFailureContext = {}
): string {
  const changeName = context.changeName ?? '<change-name>';
  const command = context.command ?? 'sync';
  const lines = [`✗ Quality gate failed — ${summarizeFailure(state, archiveCompatibility)}`];

  if (state.changedFiles.length > 0) {
    lines.push('', '  Changed files relative to the recorded code state:');
    for (const file of state.changedFiles) {
      lines.push(`    - ${file}`);
    }
  }

  if (archiveCompatibility && !archiveCompatibility.compatible) {
    lines.push('', '  Recorded compatibility diagnostic:', `    ${archiveCompatibility.blockReason}`);
  }

  if (state.details.length > 0) {
    lines.push('', '  Other diagnostics:');
    for (const detail of state.details) {
      lines.push(`    - ${detail}`);
    }
  }

  lines.push(
    '',
    '  Next steps:',
    `    xirang quality status "${changeName}" --json`,
    '    Read the specific baseline, delegation, verification, conclusion, checkpoint and recovery gaps.',
    '    Use the shared Apply Review/optimization and quality recovery references for the missing obligation; do not automatically rerun a whole-Change Review.',
    '    Preserve unsupported or inconsistent records and history. Resume an interrupted delegation only after its previous writer has stopped.',
    `    Retry xirang ${command} "${changeName}" after all_done with no gaps and a successful seal.`,
    '    --no-verify is an explicit user-authorized bypass, not evidence repair or a completed quality result.'
  );
  return lines.join('\n');
}

function summarizeFailure(
  state: QualityGateFailureState,
  archiveCompatibility?: ArchiveCompatibility
): string {
  if (archiveCompatibility && !archiveCompatibility.compatible) {
    return 'recorded quality obligations do not permit closure; inspect the specific diagnostics';
  }
  return state.details[0] ?? 'current quality completion evidence is incomplete or not applicable';
}
