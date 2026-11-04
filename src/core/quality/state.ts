import { QualityEngineError, readQualityRecordStatus, type QualityStatus } from './engine.js';

export interface QualityCompletionStatus {
  status: QualityStatus;
  gaps: string[];
  unsupported?: boolean;
  diagnostic?: string;
  changedFiles: string[];
}

/** Read-only Quality projection. It never compares HEAD or workspace contents. */
export async function readQualityCompletion(changeDir: string, projectRoot: string): Promise<QualityCompletionStatus> {
  try {
    const result = await readQualityRecordStatus(changeDir, projectRoot);
    const gaps = result.status === 'all_done' ? [] : [result.status === 'needs_review' ? 'BASELINE_REVIEW_REQUIRED' : 'OPT_DISPOSITION_OR_SEAL_REQUIRED'];
    return { status: result.status, gaps, changedFiles: [] };
  } catch (cause) {
    const diagnostic = cause instanceof QualityEngineError
      ? `${cause.code}: ${cause.message}`
      : (cause as Error).message;
    return { status: 'needs_review', gaps: ['QUALITY_RECORD_MISSING_OR_INVALID'], changedFiles: [], unsupported: true, diagnostic };
  }
}

interface QualityGateFailureState {
  status?: string;
  changedFiles: string[];
  details: string[];
  information?: unknown;
}

interface ArchiveCompatibility { compatible: boolean; blockReason?: string }
interface QualityGateFailureContext { changeName?: string; command?: 'sync' | 'archive' }

export function formatQualityGateFailure(
  state: QualityGateFailureState,
  archiveCompatibility?: ArchiveCompatibility,
  context: QualityGateFailureContext = {},
): string {
  const changeName = context.changeName ?? '<change-name>';
  const command = context.command ?? 'sync';
  const lines = [`Quality gate failed: ${summarizeFailure(state, archiveCompatibility)}`];
  if (state.changedFiles.length) lines.push('', 'Changed files:', ...state.changedFiles.map(file => `  - ${file}`));
  if (archiveCompatibility && !archiveCompatibility.compatible) lines.push('', `Seal diagnostic: ${archiveCompatibility.blockReason}`);
  if (state.details.length) lines.push('', 'Diagnostics:', ...state.details.map(detail => `  - ${detail}`));
  lines.push('', 'Next steps:', `  xirang quality status "${changeName}" --json`, '  Record the missing commit-bound Review, Opt disposition or Seal.', `  Retry xirang ${command} "${changeName}" after the Seal commit exists.`);
  return lines.join('\n');
}

function summarizeFailure(state: QualityGateFailureState, archiveCompatibility?: ArchiveCompatibility): string {
  if (archiveCompatibility && !archiveCompatibility.compatible) return 'the recorded Seal is not valid';
  return state.details[0] ?? 'Quality record is incomplete or invalid';
}
