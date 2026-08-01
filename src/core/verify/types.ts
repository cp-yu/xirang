export type VerifyResultStatus = 'PASS' | 'PASS_WITH_WARNINGS' | 'FAIL_NEEDS_CORRECTIONS';

export type OptimizationStatus =
  | 'SKIPPED'
  | 'NOT_NEEDED'
  | 'PENDING_VERIFICATION'
  | 'IMPROVED'
  | 'DEGRADED'
  | 'ABORTED_UNSAFE';

export type Phase2Type = 'optimization' | 'verification';

export type Phase2OptimizationInputStatus =
  | 'NO_OPTIMIZATION_NEEDED'
  | 'OPTIMIZATION_PROPOSED'
  | 'ABORTED_UNSAFE'
  | 'SKIPPED';

export interface VerifyIssue {
  severity: 'CRITICAL' | 'WARNING' | 'SUGGESTION' | string;
  message: string;
  requirement?: string;
  task?: string;
  recommendation?: string;
  evidence?: string[];
  [key: string]: unknown;
}

export interface Phase1Input {
  result: VerifyResultStatus;
  issues: VerifyIssue[];
  evidenceFiles: string[];
  executionMode?: string;
  gitDiffSummary?: string;
}

export type FindingLevel = 'high' | 'medium' | 'low';

export type OptimizationFindingStatus =
  | 'pending'
  | 'selected'
  | 'implemented'
  | 'verified'
  | 'resolved'
  | 'failed'
  | 'rejected'
  | 'invalidated'
  | 'deferred'
  | 'merged';

export interface OptimizationFindingLocation {
  files: string[];
  symbols?: string[];
}

export interface OptimizationFinding {
  id: string;
  status: OptimizationFindingStatus;
  location: OptimizationFindingLocation;
  opportunity: string;
  impact: string;
  evidence: string[];
  recommendation: string;
  keyDesign: string;
  preservationConstraints: string[];
  implementationOutline: string[];
  validation: string[];
  impactLevel: FindingLevel;
  confidence: FindingLevel;
  risk: FindingLevel;
  cost: FindingLevel;
  dependencies: string[];
  priorityReason: string;
  targetFileHashes?: Record<string, string>;
  failureCount?: number;
}

export interface OptimizationActionDependency {
  actionIndex: number;
}

export type NewOptimizationFinding = Omit<OptimizationFinding, 'id' | 'dependencies'> & {
  id?: never;
  dependencies: Array<string | OptimizationActionDependency>;
};

export type OptimizationReconciliationAction =
  | { action: 'add'; finding: NewOptimizationFinding; reason?: string }
  | { action: 'retain' | 'reprioritize' | 'resolve' | 'invalidate' | 'reject'; findingId: string; reason: string }
  | { action: 'merge'; findingIds: string[]; finding: NewOptimizationFinding; reason: string }
  | { action: 'masterChallenge'; findingId: string; reason: string; evidence: string[] };

export interface OptimizationBlockingObservation {
  location: string;
  issue: string;
  evidence: string[];
}

export interface OptimizationEnvelope {
  blockingObservations: OptimizationBlockingObservation[];
  actions: OptimizationReconciliationAction[];
  findings: OptimizationFinding[];
}

export type OptimizationHistoryAction = OptimizationReconciliationAction['action']
  | 'select'
  | 'implemented'
  | 'verified'
  | 'failed'
  | 'stalled';

export interface OptimizationHistoryEvent {
  sequence: number;
  action: OptimizationHistoryAction;
  findingId?: string;
  findingIds?: string[];
  reason: string;
  evidence?: string[];
  hashes?: Record<string, string>;
  timestamp?: string;
}

export interface Phase2OptimizationInput {
  status: Phase2OptimizationInputStatus;
  mode?: 'reconcile' | 'begin-implementation';
  findingId?: string;
  summary?: string;
  score?: string;
  attempts?: unknown[];
  envelope?: OptimizationEnvelope;
  [key: string]: unknown;
}

export interface Phase2VerificationInput {
  result: VerifyResultStatus;
  findingId?: string;
  issues?: VerifyIssue[];
  summary?: string;
  [key: string]: unknown;
}

export type Phase2Input = Phase2OptimizationInput | Phase2VerificationInput;

export interface EvidenceFingerprint {
  hash: string;
  skippedFiles: string[];
  entries: EvidenceFingerprintEntry[];
}

export interface EvidenceFingerprintEntry {
  path: string;
  hash: string;
}

export interface VerificationContext {
  contractVersion: '1.0' | string;
  executionMode?: string;
  evidenceFiles: string[];
  evidenceFingerprint: string;
  evidenceFingerprintEntries?: EvidenceFingerprintEntry[];
  skippedEvidenceFiles?: string[];
  gitHeadCommit?: string;
  gitDiffSummary?: string;
  timestamp?: string;
}

export interface OptimizationAttempt {
  timestamp: string;
  type: Phase2Type;
  status?: string;
  files?: string[];
  result?: VerifyResultStatus;
  summary?: string;
  behaviorRetryCounter?: number;
  [key: string]: unknown;
}

export interface VerifyOptimization {
  status: OptimizationStatus;
  score?: string;
  attempts: OptimizationAttempt[];
  affectedFileHashes?: Record<string, string>;
  failedDirections?: string[];
  findings?: OptimizationFinding[];
  history?: OptimizationHistoryEvent[];
  reconciliationSignature?: string;
  unchangedReconciliations?: number;
  baseline?: unknown;
  final?: unknown;
}

export interface VerifyResult {
  timestamp: string;
  result: VerifyResultStatus;
  issues: VerifyIssue[];
  tasksFileHash: string;
  verificationContext: VerificationContext;
  optimization?: VerifyOptimization;
}

export interface FreshnessResult {
  status: 'FRESH' | 'STALE' | 'MISSING';
  verifyResult?: VerifyResult;
  checks: {
    fileExists: boolean;
    tasksFileHash: boolean;
    evidenceFingerprint: boolean;
    contractVersion: boolean;
    resultAcceptable: boolean;
  };
  information: {
    gitHeadCommit?: {
      matches: boolean;
      recorded?: string;
      current?: string;
    };
  };
  details: string[];
}

export interface ArchiveCompatibility {
  compatible: boolean;
  blockReason?: 'PENDING_VERIFICATION' | 'ABORTED_UNSAFE' | 'INVALID_OPTIMIZATION_STATUS';
}

export interface SealReport {
  valid: boolean;
  sealHash?: string;
  errors: string[];
}

export interface ValidationResult<T> {
  valid: boolean;
  value?: T;
  errors: string[];
}
