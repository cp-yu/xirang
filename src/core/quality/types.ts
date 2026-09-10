export interface Diagnostic {
  path: string;
  expected: string;
  actual: string;
  fix: string;
}

export type QualityRecordKind = 'review' | 'optimize';

export type ReviewResultStatus = 'PASS' | 'PASS_WITH_WARNINGS' | 'FAIL_NEEDS_CORRECTIONS';

export type QualityStatus = 'clean' | 'dirty';

export type DirectionStatus =
  | 'pending'
  | 'selected'
  | 'implemented'
  | 'verified'
  | 'failed'
  | 'rejected'
  | 'deferred';

export type DirectionLevel = 'high' | 'medium' | 'low';

export type OptimizationTerminal =
  | 'SKIPPED'
  | 'NOT_NEEDED'
  | 'IMPROVED'
  | 'DEGRADED'
  | 'ABORTED_UNSAFE';

export type OptimizationStopReason =
  | 'USER_DECLINED'
  | 'NO_ACTIONABLE'
  | 'DIRECTION_REJECTED'
  | 'DIRECTION_LIMIT_REACHED'
  | 'UNSAFE';

export type ArchiveBlockReason = 'NOT_FINALIZED' | 'ABORTED_UNSAFE';

export interface QualityIssue {
  severity: 'CRITICAL' | 'WARNING' | 'SUGGESTION' | string;
  message: string;
  requirement?: string;
  task?: string;
  recommendation?: string;
  evidence?: string[];
  [key: string]: unknown;
}

export interface DirectionLocation {
  files: string[];
  symbols?: string[];
}

export interface OptimizationDirection {
  id: string;
  status: DirectionStatus;
  location: DirectionLocation;
  opportunity: string;
  impact: string;
  evidence: string[];
  recommendation: string;
  keyDesign: string;
  preservationConstraints: string[];
  implementationOutline: string[];
  validation: string[];
  impactLevel: DirectionLevel;
  confidence: DirectionLevel;
  risk: DirectionLevel;
  cost: DirectionLevel;
  dependencies: string[];
  priorityReason: string;
  failureCount: number;
  reason?: string;
  revocationEvidence?: string[];
}

export interface DirectionAttempt {
  directionId: string;
  status: 'verified' | 'failed';
  summary?: string;
  evidence?: string[];
}

export interface OptimizationRoundHistory {
  round: number;
  timestamp: string;
  directions: string[];
  selected?: string;
  outcome?: DirectionAttempt['status'] | 'none';
  stopReason?: OptimizationStopReason;
  reason?: string;
  evidence?: string[];
}

export interface OptimizationLedger {
  directions: OptimizationDirection[];
  histories: OptimizationRoundHistory[];
  directionsUsed: number;
  selected?: string;
  attempt?: DirectionAttempt;
  stopReason?: OptimizationStopReason;
  terminal?: OptimizationTerminal;
  baselineCommit?: string;
}

export interface EvidenceFingerprintEntry {
  path: string;
  hash: string;
}

export interface EvidenceFingerprint {
  hash: string;
  skippedFiles: string[];
  entries: EvidenceFingerprintEntry[];
}

export interface VerificationContext {
  contractVersion: '1.0' | string;
  evidenceFiles: string[];
  evidenceFingerprint: string;
  evidenceFingerprintEntries?: EvidenceFingerprintEntry[];
  skippedEvidenceFiles?: string[];
  gitHeadCommit?: string;
  gitDiffSummary?: string;
  timestamp?: string;
}

export interface QualityRecord {
  kind: QualityRecordKind;
  timestamp: string;
  result: ReviewResultStatus;
  issues: QualityIssue[];
  tasksFileHash: string | null;
  verificationContext: VerificationContext;
  optimization?: OptimizationLedger;
}

export interface QualityStateInformation {
  gitHeadCommit?: {
    matches: boolean;
    recorded?: string;
    current?: string;
  };
}

export interface QualityState {
  status: QualityStatus;
  record?: QualityRecord;
  changedFiles: string[];
  details: string[];
  information: QualityStateInformation;
}

export interface ArchiveCompatibility {
  compatible: boolean;
  blockReason?: ArchiveBlockReason;
}

export interface ReviewSummaryBlock {
  [dimension: string]: unknown;
}

export interface ReviewWriteBackEntry {
  taskLine?: string;
  action?: string;
  correctionType?: string;
  requirement?: string;
  summary?: string;
  nextAction?: string;
}

export interface ReviewInput {
  result: ReviewResultStatus;
  issues: QualityIssue[];
  evidenceFiles: string[];
  summary?: string | ReviewSummaryBlock;
  writeBackPlan?: ReviewWriteBackEntry[];
  executionMode?: string;
  gitDiffSummary?: string;
}

export interface DirectionAttemptInput {
  directionId: string;
  status: 'verified' | 'failed';
  summary?: string;
  evidence?: string[];
}

export interface NewDirectionPayload {
  location: DirectionLocation;
  opportunity: string;
  impact: string;
  evidence: string[];
  recommendation: string;
  keyDesign: string;
  preservationConstraints: string[];
  implementationOutline: string[];
  validation: string[];
  impactLevel: DirectionLevel;
  confidence: DirectionLevel;
  risk: DirectionLevel;
  cost: DirectionLevel;
  dependencies: Array<string | DirectionDependencyIndex>;
  priorityReason: string;
}

export interface DirectionDependencyIndex {
  actionIndex: number;
}

export interface DirectionUpdatePayload {
  id: string;
  status: DirectionStatus;
  reason?: string;
  evidence?: string[];
}

export interface OptimizeInput {
  directions: Array<NewDirectionPayload | DirectionUpdatePayload>;
  selected?: string;
  attempt?: DirectionAttemptInput;
  stopReason?: OptimizationStopReason;
  summary?: string;
}
