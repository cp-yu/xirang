import { existsSync, promises as fs, readFileSync } from 'fs';
import { createHash } from 'crypto';
import path from 'path';
import os from 'os';
import { promisify } from 'util';
import { execFile as execFileCallback } from 'child_process';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { z } from 'zod';
import { FileSystemUtils } from './file-system.js';
import {
  getRuntimeFingerprintInput,
  projectConfigForRuntime,
  type RuntimeProjection,
} from '../core/config-projection.js';
import { backfillSpecs, type BackfillSpecsResult } from '../core/backfill-specs.js';
import { OPSX_DIR_NAME } from '../core/config.js';
import { readProjectConfig } from '../core/project-config.js';
import { validateRelationGraph } from '../core/relations/validator.js';
import { Validator } from '../core/validation/validator.js';
import { buildSpecRegistry } from '../core/spec-registry.js';
import { readLikeC4Architecture } from './likec4-reader.js';
import { validateArchitecture } from './architecture-validator.js';
import { renderViews } from '../core/templates/architecture-skeleton.js';
import { quoteLikeC4, indent } from '../migration/generators/formatting-utils.js';
import type { ContractPolicy } from './semantic-model.js';
import {
  OPSX_SCHEMA_VERSION,
  OPSX_PATHS,
  OpsxRelationSchema,
  applyOpsxDelta,
  readProjectOpsx,
  type ProjectOpsxBundle,
  type OpsxRelation,
  type OpsxDelta,
  type OpsxNode,
  type OpsxDeltaApplyResult,
} from './opsx-utils.js';

// ─── Constants ───────────────────────────────────────────────────────────────

export const BOOTSTRAP_DIR = path.join(OPSX_DIR_NAME, 'bootstrap');
export const BOOTSTRAP_HISTORY_DIR = path.join(OPSX_DIR_NAME, 'bootstrap-history');
export const DEFAULT_BOOTSTRAP_PROJECT_ID = 'project';
export const DEFAULT_BOOTSTRAP_PROJECT_NAME = 'Project';
export const BOOTSTRAP_WORKSPACE_RETAINED_NOTICE =
  'Bootstrap workspace retained at .opsx/bootstrap/. To start the next refresh run with retained granularity, use `opsx bootstrap init --mode refresh --restart`; pass `--granularity coarse|fine` to override it. Delete the workspace only when you no longer need the audit trail.';
export const BOOTSTRAP_METADATA_FILE = '.bootstrap.yaml';
export const BOOTSTRAP_SCOPE_FILE = 'scope.yaml';
export const BOOTSTRAP_EVIDENCE_FILE = 'evidence.yaml';
export const BOOTSTRAP_DOMAIN_MAP_DIR = 'domain-map';
export const BOOTSTRAP_REVIEW_FILE = 'review.md';
export const BOOTSTRAP_CANDIDATE_DIR = 'candidate';
export const BOOTSTRAP_CANDIDATE_SPECS_DIR = path.join(BOOTSTRAP_CANDIDATE_DIR, 'specs');
export const BOOTSTRAP_CANDIDATE_ARCHITECTURE_DIR = path.join(BOOTSTRAP_CANDIDATE_DIR, 'architecture');
export const BOOTSTRAP_ARCHITECTURE_FILES = ['specification.c4', 'model.c4', 'relations.c4', 'views.c4'] as const;
export const BOOTSTRAP_CANDIDATE_FILE_NAMES = {
  project: 'model.c4',
  relations: 'relations.c4',
} as const;
const execFile = promisify(execFileCallback);

export const BOOTSTRAP_PHASES = ['init', 'scan', 'map', 'review', 'promote'] as const;
export type BootstrapPhase = typeof BOOTSTRAP_PHASES[number];

export const BOOTSTRAP_MODES = ['full', 'opsx-first', 'refresh'] as const;
export type BootstrapMode = typeof BOOTSTRAP_MODES[number];

export const BOOTSTRAP_BASELINE_TYPES = [
  'raw',
  'specs-based',
  'formal-opsx',
  'invalid-partial-opsx',
] as const;
export type BootstrapBaselineType = typeof BOOTSTRAP_BASELINE_TYPES[number];

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const BootstrapDiskModeSchema = z.union([z.enum(BOOTSTRAP_MODES), z.literal('seed')]);

const BaselineTypeDiskSchema = z.enum([
  'raw',
  'specs-based',
  'formal-opsx',
  'invalid-partial-opsx',
  'no-spec',
  'specs-only',
]).transform((value): BootstrapBaselineType => {
  if (value === 'no-spec') return 'raw';
  if (value === 'specs-only') return 'specs-based';
  return value;
});

const BootstrapMetadataDiskSchema = z.object({
  phase: z.enum(BOOTSTRAP_PHASES),
  baseline_type: BaselineTypeDiskSchema.optional(),
  mode: BootstrapDiskModeSchema,
  created_at: z.string(),
  completed_at: z.string().nullable().optional(),
  source_fingerprint: z.string().nullable().optional(),
  candidate_fingerprint: z.string().nullable().optional(),
  review_fingerprint: z.string().nullable().optional(),
  refresh_anchor_commit: z.string().nullable().optional(),
  candidate_spec_paths: z.array(z.string()).optional(),
});

const ScopeConfigDiskSchema = z.object({
  mode: BootstrapDiskModeSchema,
  include: z.array(z.string()).default([]),
  exclude: z.array(z.string()).default([]),
  granularity: z.enum(['coarse', 'fine']),
});


const BootstrapConfidenceSchema = z.enum(['high', 'medium', 'low']);
const ElementKindSchema = z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/);
const LocalElementIdSchema = z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/);
const StableElementIdSchema = z.string().trim().min(1);

const EvidenceDomainSchema = z.object({
  id: z.string().regex(/^dom\./),
  confidence: BootstrapConfidenceSchema,
  sources: z.array(z.string()),
  intent: z.string(),
});

const EvidenceElementSchema = z.object({
  elementId: StableElementIdSchema,
  kind: ElementKindSchema,
  contractPolicy: z.enum(['required', 'optional']).optional(),
  localId: LocalElementIdSchema,
  title: z.string().trim().min(1),
  summary: z.string().trim().min(1),
  confidence: BootstrapConfidenceSchema,
  sources: z.array(z.string()),
}).strict();

const LegacyEvidenceFileSchema = z.object({
  domains: z.array(EvidenceDomainSchema),
}).strict();

const GenericEvidenceFileSchema = z.object({
  elements: z.array(EvidenceElementSchema),
}).strict();

const EvidenceFileSchema = z.union([GenericEvidenceFileSchema, LegacyEvidenceFileSchema]);

const ElementSpecSchema = z.object({
  preserve_existing: z.boolean().optional().default(false),
  folder: z
    .string()
    .min(1)
    .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/)
    .refine((value) => value !== '.' && value !== '..', 'folder must be a single path segment'),
  purpose: z.string().min(1),
  requirements: z.array(z.object({
    title: z.string().min(1),
    text: z.string().min(1),
    scenarios: z.array(z.object({
      title: z.string().min(1),
      steps: z.array(z.object({
        keyword: z.enum(['GIVEN', 'WHEN', 'THEN', 'AND']),
        text: z.string().min(1),
      })).min(1),
    })).min(1),
  })).min(1),
});

const DomainCapabilitySchema = z.object({
  id: z.string().regex(/^cap\./),
  type: z.literal('capability').default('capability'),
  intent: z.string(),
  status: z.enum(['draft', 'active']).default('draft'),
  spec: ElementSpecSchema.optional(),
});

const DomainNodeSchema = z.object({
  id: z.string().regex(/^dom\./),
  type: z.literal('domain').default('domain'),
  intent: z.string(),
  status: z.enum(['draft', 'active']).default('draft'),
  boundary: z.string().optional(),
});

const DomainRelationSchema = OpsxRelationSchema;
const GenericRelationSchema = z.object({
  from: StableElementIdSchema,
  type: z.enum(['invokes', 'produces', 'consumes', 'precedes', 'constrains', 'validates']),
  to: StableElementIdSchema,
  note: z.string().max(200).optional(),
}).strict();

const SpecGroupSchema = z.object({
  folder: z
    .string()
    .min(1)
    .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/)
    .refine((value) => value !== '.' && value !== '..', 'folder must be a single path segment'),
  capabilities: z.array(z.string().regex(/^cap\./)).min(1),
  purpose: z.string().min(1).optional(),
  requirements: z.array(z.object({
    title: z.string().min(1),
    text: z.string().min(1),
    scenarios: z.array(z.object({
      title: z.string().min(1),
      steps: z.array(z.object({
        keyword: z.enum(['GIVEN', 'WHEN', 'THEN', 'AND']),
        text: z.string().min(1),
      })).min(1),
    })).min(1),
  })).min(1).optional(),
});

const ReviewGapSchema = z.object({
  evidence: z.string().min(1),
  reason: z.string().min(1),
}).strict();

const LegacyDomainMapFileSchema = z.object({
  domain: DomainNodeSchema,
  capabilities: z.array(DomainCapabilitySchema).default([]),
  relations: z.array(DomainRelationSchema).default([]),
  review_gaps: z.array(ReviewGapSchema).default([]),
  spec_groups: z.array(SpecGroupSchema).optional(),
}).strict();

const GenericElementCandidateSchema = z.object({
  elementId: StableElementIdSchema,
  kind: ElementKindSchema,
  contractPolicy: z.enum(['required', 'optional']).optional(),
  localId: LocalElementIdSchema,
  title: z.string().trim().min(1),
  summary: z.string().trim().min(1),
  spec: ElementSpecSchema.optional(),
}).strict();

const ParentLinkSchema = z.object({
  parent: StableElementIdSchema,
  child: StableElementIdSchema,
}).strict();

const GenericElementMapFileSchema = z.object({
  elements: z.array(GenericElementCandidateSchema),
  parent_links: z.array(ParentLinkSchema).default([]),
  relations: z.array(GenericRelationSchema).default([]),
  review_gaps: z.array(ReviewGapSchema).default([]),
}).strict();

const DomainMapFileSchema = z.union([GenericElementMapFileSchema, LegacyDomainMapFileSchema]);

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BootstrapMetadata {
  phase: BootstrapPhase;
  baseline_type: BootstrapBaselineType;
  mode: BootstrapMode;
  created_at: string;
  completed_at: string | null;
  source_fingerprint: string | null;
  candidate_fingerprint: string | null;
  review_fingerprint: string | null;
  refresh_anchor_commit: string | null;
  candidate_spec_paths: string[];
  completed_marker_present: boolean;
}

export interface ScopeConfig {
  mode: BootstrapMode;
  include: string[];
  exclude: string[];
  granularity: 'coarse' | 'fine';
}
export type EvidenceDomain = z.infer<typeof EvidenceDomainSchema>;
export type EvidenceElement = z.infer<typeof EvidenceElementSchema>;
export type EvidenceFile = z.infer<typeof EvidenceFileSchema>;
export type LegacyDomainMapFile = z.infer<typeof LegacyDomainMapFileSchema>;
export type GenericElementMapFile = z.infer<typeof GenericElementMapFileSchema>;
export type DomainMapFile = z.infer<typeof DomainMapFileSchema>;
export type DomainCapability = z.infer<typeof DomainCapabilitySchema>;
type ElementSpec = z.infer<typeof ElementSpecSchema>;
type CandidateRelation = z.infer<typeof GenericRelationSchema>;

interface BootstrapCandidateSpec {
  elementId: string;
  folder: string;
  candidateRelativePath: string;
  formalRelativePath: string;
  content: string;
}

interface CandidateSpecAssembly {
  specs: BootstrapCandidateSpec[];
  preservedFormalPaths: string[];
  sourceErrors: string[];
  validationErrors: string[];
}

interface RefreshPlan {
  strategy: 'full-rebuild';
  reason: string;
  impactedDomainIds: string[];
}

interface RefreshDeltaSummary {
  delta: OpsxDelta;
  result: OpsxDeltaApplyResult;
  mergedBundle: ProjectOpsxBundle;
  affectedDomainIds: string[];
  affectedNodeIds: string[];
  preservedNodeIds: string[];
}

export interface InvalidDomainMap {
  file: string;
  domainId: string;
  error: string;
}

export interface BootstrapState {
  metadata: BootstrapMetadata;
  scope: ScopeConfig | null;
  evidence: EvidenceFile | null;
  domainMaps: Map<string, DomainMapFile>;
  invalidDomainMaps: Map<string, InvalidDomainMap>;
  reviewExists: boolean;
}

export interface BootstrapInitializedStatus {
  initialized: true;
  phase: BootstrapPhase;
  baselineType: BootstrapBaselineType;
  mode: BootstrapMode;
  workspaceState: BootstrapWorkspaceState;
  completedAt: string | null;
  completionSource: BootstrapCompletionSource;
  restartCommand: string | null;
  nextAction: BootstrapPhase | 'restart' | null;
  transitionCommand: string | null;
  created_at: string;
  domains: DomainStatus[];
  totalDomains: number;
  mappedDomains: number;
  reviewedDomains: number;
  elements: ElementStatus[];
  totalElements: number;
  mappedElements: number;
  reviewedElements: number;
  candidateState: 'missing' | 'current' | 'stale';
  reviewState: 'missing' | 'current' | 'stale';
  reviewApproved: boolean;
}

export interface BootstrapPreInitStatus {
  initialized: false;
  baselineType: BootstrapBaselineType;
  supported: boolean;
  allowedModes: BootstrapMode[];
  nextAction: 'init' | null;
  reason: string;
}

export type BootstrapStatus = BootstrapInitializedStatus | BootstrapPreInitStatus;
export type BootstrapWorkspaceState = 'in-progress' | 'completed';
export type BootstrapCompletionSource = 'explicit' | 'legacy-refresh-anchor' | 'legacy-formal-opsx' | null;

export interface BootstrapInitResult {
  metadata: BootstrapMetadata;
  restarted: boolean;
  historyPath: string | null;
  workspacePath: string;
}

export interface DomainStatus {
  id: string;
  confidence: 'high' | 'medium' | 'low';
  mapped: boolean;
  mapState: 'valid' | 'missing' | 'invalid';
  mapError?: string;
  capabilityCount: number;
  reviewed: boolean;
}

export interface ElementStatus {
  elementId: string;
  kind: string;
  confidence: 'high' | 'medium' | 'low';
  mapped: boolean;
  reviewed: boolean;
}

export interface GateResult {
  passed: boolean;
  errors: string[];
}

interface DerivedBootstrapArtifacts {
  bundle: ProjectOpsxBundle | null;
  candidateModel: CandidateArchitectureModel | null;
  modelErrors: string[];
  candidateSpecs: BootstrapCandidateSpec[];
  preservedFormalPaths: string[];
  specErrors: string[];
  sourceFingerprint: string | null;
  candidateFingerprint: string | null;
  candidateState: 'missing' | 'current' | 'stale';
  reviewState: 'missing' | 'current' | 'stale';
  reviewApproved: boolean;
  checkedDomains: Set<string>;
  refreshPlan: RefreshPlan | null;
  refreshDelta: RefreshDeltaSummary | null;
}

export interface PromoteBootstrapResult {
  retainedWorkspaceNotice: string;
  backfill: BackfillSpecsResult;
}

interface BootstrapWorkspaceCompletion {
  state: BootstrapWorkspaceState;
  completedAt: string | null;
  source: BootstrapCompletionSource;
}

// ─── Path Helpers ────────────────────────────────────────────────────────────

function bootstrapPath(projectRoot: string, ...segments: string[]): string {
  return FileSystemUtils.joinPath(projectRoot, BOOTSTRAP_DIR, ...segments);
}

function bootstrapHistoryPath(projectRoot: string, ...segments: string[]): string {
  return FileSystemUtils.joinPath(projectRoot, BOOTSTRAP_HISTORY_DIR, ...segments);
}

function toDisplayPath(projectRoot: string, absolutePath: string): string {
  const relative = path.relative(projectRoot, absolutePath);
  return relative || '.';
}

function normalizeBootstrapMode(mode: BootstrapMode | 'seed'): BootstrapMode {
  return mode === 'seed' ? 'opsx-first' : mode;
}

const DOMAIN_CONFIDENCE_ORDER: Record<EvidenceDomain['confidence'], number> = {
  low: 0,
  medium: 1,
  high: 2,
};

async function hasRealSpecContent(projectRoot: string): Promise<boolean> {
  const specsDir = FileSystemUtils.joinPath(projectRoot, OPSX_DIR_NAME, 'specs');
  if (!await FileSystemUtils.directoryExists(specsDir)) {
    return false;
  }

  const entries = await fs.readdir(specsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const specPath = FileSystemUtils.joinPath(specsDir, entry.name, 'spec.md');
    if (await FileSystemUtils.fileExists(specPath)) {
      return true;
    }
  }

  return false;
}

async function inferLegacyBaselineType(projectRoot: string): Promise<BootstrapBaselineType> {
  return await hasRealSpecContent(projectRoot) ? 'specs-based' : 'raw';
}

function formatBootstrapHistoryStamp(date = new Date()): string {
  return date.toISOString().replace(/[:.]/g, '-');
}

function buildBootstrapRestartCommand(baselineType: BootstrapBaselineType): string | null {
  const allowedModes = getAllowedBootstrapModes(baselineType);
  if (allowedModes.length === 0) {
    return null;
  }

  return `opsx bootstrap init --mode ${allowedModes[0]} --restart`;
}

function hasExplicitCompletionMarker(metadata: BootstrapMetadata): boolean {
  return metadata.completed_marker_present;
}

async function resolveBootstrapWorkspaceCompletion(
  projectRoot: string,
  metadata: BootstrapMetadata
): Promise<BootstrapWorkspaceCompletion> {
  if (hasExplicitCompletionMarker(metadata)) {
    return {
      state: metadata.completed_at ? 'completed' : 'in-progress',
      completedAt: metadata.completed_at,
      source: metadata.completed_at ? 'explicit' : null,
    };
  }

  if (metadata.mode === 'refresh') {
    if (metadata.phase === 'promote' && metadata.refresh_anchor_commit) {
      return {
        state: 'completed',
        completedAt: metadata.created_at,
        source: 'legacy-refresh-anchor',
      };
    }
    return {
      state: 'in-progress',
      completedAt: null,
      source: null,
    };
  }

  if (metadata.phase === 'promote' && await countExistingFormalOpsxFiles(projectRoot) === 2) {
    return {
      state: 'completed',
      completedAt: metadata.created_at,
      source: 'legacy-formal-opsx',
    };
  }

  return {
    state: 'in-progress',
    completedAt: null,
    source: null,
  };
}

async function moveBootstrapWorkspaceToHistory(
  projectRoot: string,
  bootstrapDir: string
): Promise<string> {
  const historyRoot = bootstrapHistoryPath(projectRoot);
  await FileSystemUtils.createDirectory(historyRoot);

  const stamp = formatBootstrapHistoryStamp();
  let historyDir = bootstrapHistoryPath(projectRoot, stamp);
  let suffix = 1;
  while (await FileSystemUtils.directoryExists(historyDir)) {
    suffix += 1;
    historyDir = bootstrapHistoryPath(projectRoot, `${stamp}-${suffix}`);
  }

  try {
    await fs.rename(bootstrapDir, historyDir);
  } catch (error: any) {
    const code = error?.code;
    if (code === 'EPERM' || code === 'EXDEV') {
      await fs.cp(bootstrapDir, historyDir, { recursive: true });
      await fs.rm(bootstrapDir, { recursive: true, force: true });
    } else {
      throw error;
    }
  }

  return historyDir;
}

function parseBootstrapMetadata(
  raw: unknown,
  fallbackBaselineType: BootstrapBaselineType
): BootstrapMetadata {
  const parsed = BootstrapMetadataDiskSchema.parse(raw);
  const rawRecord = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  return {
    phase: parsed.phase,
    baseline_type: parsed.baseline_type ?? fallbackBaselineType,
    mode: normalizeBootstrapMode(parsed.mode),
    created_at: parsed.created_at,
    completed_at: parsed.completed_at ?? null,
    source_fingerprint: parsed.source_fingerprint ?? null,
    candidate_fingerprint: parsed.candidate_fingerprint ?? null,
    review_fingerprint: parsed.review_fingerprint ?? null,
    refresh_anchor_commit: parsed.refresh_anchor_commit ?? null,
    candidate_spec_paths: parsed.candidate_spec_paths ?? [],
    completed_marker_present: Object.prototype.hasOwnProperty.call(rawRecord, 'completed_at'),
  };
}

function parseScopeConfig(raw: unknown): ScopeConfig {
  const parsed = ScopeConfigDiskSchema.parse(raw);
  return {
    mode: normalizeBootstrapMode(parsed.mode),
    include: parsed.include,
    exclude: parsed.exclude,
    granularity: parsed.granularity,
  };
}

function formalOpsxPaths(projectRoot: string): string[] {
  return [
    FileSystemUtils.joinPath(projectRoot, OPSX_PATHS.PROJECT_FILE),
    FileSystemUtils.joinPath(projectRoot, OPSX_PATHS.RELATIONS_FILE),
  ];
}

function candidatePath(projectRoot: string, fileName: string): string {
  return bootstrapPath(projectRoot, BOOTSTRAP_CANDIDATE_ARCHITECTURE_DIR, fileName);
}

function candidateSpecPath(projectRoot: string, folder: string): string {
  return bootstrapPath(projectRoot, BOOTSTRAP_CANDIDATE_SPECS_DIR, folder, 'spec.md');
}

function localElementId(elementId: string): string {
  const normalized = elementId.replace(/[^A-Za-z0-9_]/g, '_');
  return /^[A-Za-z_]/.test(normalized) ? normalized : `element_${normalized}`;
}

function elementTitle(elementId: string): string {
  const value = elementId.split('.').at(-1) ?? elementId;
  return value.replace(/[-_]+/g, ' ').replace(/\b\w/g, character => character.toUpperCase());
}

function elementSummary(value: string | undefined, fallback: string): string {
  return normalizeBootstrapText(value) ?? fallback;
}

interface CandidateArchitectureElement {
  elementId: string;
  kind: string;
  contractPolicy?: ContractPolicy;
  localId: string;
  title: string;
  summary: string;
  spec?: ElementSpec;
  children: CandidateArchitectureElement[];
}

interface CandidateArchitectureModel {
  root: CandidateArchitectureElement;
  elements: CandidateArchitectureElement[];
  relations: CandidateRelation[];
}

function isGenericEvidence(evidence: EvidenceFile): evidence is z.infer<typeof GenericEvidenceFileSchema> {
  return 'elements' in evidence;
}

function isGenericMap(mapFile: DomainMapFile): mapFile is GenericElementMapFile {
  return 'elements' in mapFile;
}

function evidenceElements(evidence: EvidenceFile | null): EvidenceElement[] {
  if (!evidence) return [];
  if (isGenericEvidence(evidence)) return evidence.elements;
  return evidence.domains.map(domain => ({
    elementId: domain.id,
    kind: 'domain',
    contractPolicy: 'optional' as const,
    localId: localElementId(domain.id),
    title: elementTitle(domain.id),
    summary: elementSummary(domain.intent, `Intent for ${domain.id}.`),
    confidence: domain.confidence,
    sources: domain.sources,
  }));
}

function mapElements(mapFile: DomainMapFile): CandidateArchitectureElement[] {
  if (isGenericMap(mapFile)) {
    return mapFile.elements.map(element => ({
      ...element,
      children: [],
    }));
  }
  return [
    {
      elementId: mapFile.domain.id,
      kind: 'domain',
      contractPolicy: 'optional' as const,
      localId: localElementId(mapFile.domain.id),
      title: elementTitle(mapFile.domain.id),
      summary: elementSummary(mapFile.domain.intent, `Intent for ${mapFile.domain.id}.`),
      children: [],
    },
    ...mapFile.capabilities.map(capability => ({
      elementId: capability.id,
      kind: 'capability',
      contractPolicy: 'optional' as const,
      localId: localElementId(capability.id),
      title: elementTitle(capability.id),
      summary: elementSummary(capability.intent, `Intent for ${capability.id}.`),
      spec: capability.spec,
      children: [],
    })),
  ];
}

function mapParentLinks(mapFile: DomainMapFile): Array<{ parent: string; child: string }> {
  if (isGenericMap(mapFile)) return mapFile.parent_links;
  return [
    { parent: 'project.root', child: mapFile.domain.id },
    ...mapFile.capabilities.map(capability => ({ parent: mapFile.domain.id, child: capability.id })),
  ];
}

function mapRelations(mapFile: DomainMapFile): CandidateRelation[] {
  if (isGenericMap(mapFile)) return mapFile.relations;
  return mapFile.relations
    .filter(relation => !['belongs_to', 'refines', 'abstracts'].includes(relation.type))
    .map(relation => ({
      from: relation.from,
      type: relation.type as CandidateRelation['type'],
      to: relation.to,
      ...(relation.note === undefined ? {} : { note: relation.note }),
    }));
}

function assembleCandidateArchitectureModel(
  projectRoot: string,
  state: BootstrapState
): { model: CandidateArchitectureModel; errors: string[] } {
  const project = buildBootstrapProjectMetadata(projectRoot, state);
  const root: CandidateArchitectureElement = {
    elementId: 'project.root',
    kind: 'project',
    contractPolicy: 'required',
    localId: 'projectRoot',
    title: project.name,
    summary: elementSummary(project.intent, 'Project intent is reviewed before promotion.'),
    children: [],
  };
  const mappedElements = [...state.domainMaps.values()].flatMap(mapElements);
  const relations = [...state.domainMaps.values()].flatMap(mapRelations);
  const parentLinks = [...state.domainMaps.values()].flatMap(mapParentLinks);
  const errors: string[] = [];
  const evidenceById = new Map<string, EvidenceElement>();
  const validatesMappedElementsAgainstEvidence = state.evidence !== null && isGenericEvidence(state.evidence);

  for (const evidence of evidenceElements(state.evidence)) {
    if (evidenceById.has(evidence.elementId)) {
      errors.push(`Review gap: duplicate evidence elementId '${evidence.elementId}'.`);
    } else {
      evidenceById.set(evidence.elementId, evidence);
    }
    if (!evidence.contractPolicy) {
      errors.push(`Review gap: evidence element '${evidence.elementId}' has no explicit contractPolicy.`);
    }
  }

  const elementsById = new Map<string, CandidateArchitectureElement>();
  const contractPolicyByKind = new Map<string, ContractPolicy>();
  for (const element of mappedElements) {
    if (element.elementId === root.elementId) {
      errors.push(`Review gap: mapped elements must not redefine Project Root '${root.elementId}'.`);
      continue;
    }
    if (elementsById.has(element.elementId)) {
      errors.push(`Review gap: duplicate elementId '${element.elementId}'.`);
      continue;
    }
    const discovered = evidenceById.get(element.elementId);
    if (validatesMappedElementsAgainstEvidence && !discovered) {
      errors.push(`Review gap: element '${element.elementId}' was not discovered in evidence.yaml.`);
    } else if (validatesMappedElementsAgainstEvidence && discovered?.kind !== element.kind) {
      errors.push(`Review gap: element '${element.elementId}' uses unknown kind '${element.kind}'; evidence declares '${discovered?.kind}'.`);
    } else if (validatesMappedElementsAgainstEvidence && discovered?.contractPolicy !== element.contractPolicy) {
      errors.push(`Review gap: element '${element.elementId}' contractPolicy does not match evidence.yaml.`);
    }
    if (!element.contractPolicy) {
      errors.push(`Review gap: mapped element '${element.elementId}' has no explicit contractPolicy.`);
    } else {
      const kindPolicy = contractPolicyByKind.get(element.kind);
      if (kindPolicy && kindPolicy !== element.contractPolicy) {
        errors.push(`Review gap: element kind '${element.kind}' has conflicting contractPolicy values.`);
      } else {
        contractPolicyByKind.set(element.kind, element.contractPolicy);
      }
    }
    elementsById.set(element.elementId, element);
  }

  if (validatesMappedElementsAgainstEvidence) {
    for (const elementId of evidenceById.keys()) {
      if (!elementsById.has(elementId)) {
        errors.push(`Review gap: discovered element '${elementId}' has no mapped candidate.`);
      }
    }
  }

  const parentsByChild = new Map<string, string[]>();
  for (const link of parentLinks) {
    if (link.child === root.elementId) {
      errors.push(`Review gap: Project Root '${root.elementId}' must not have a parent.`);
      continue;
    }
    if (!elementsById.has(link.child)) {
      errors.push(`Review gap: parent link references unknown child '${link.child}'.`);
      continue;
    }
    if (link.parent !== root.elementId && !elementsById.has(link.parent)) {
      errors.push(`Review gap: parent link for '${link.child}' references unknown parent '${link.parent}'.`);
      continue;
    }
    const parents = parentsByChild.get(link.child) ?? [];
    parents.push(link.parent);
    parentsByChild.set(link.child, parents);
  }

  for (const element of elementsById.values()) {
    const parents = parentsByChild.get(element.elementId) ?? [];
    if (parents.length === 0) {
      errors.push(`Review gap: non-root element '${element.elementId}' must have exactly one parent.`);
    } else if (parents.length > 1) {
      errors.push(`Review gap: non-root element '${element.elementId}' has multiple parents: ${parents.join(', ')}.`);
    }
  }

  for (const element of elementsById.values()) {
    const seen = new Set([element.elementId]);
    let current = element.elementId;
    while (parentsByChild.get(current)?.length === 1) {
      const parent = parentsByChild.get(current)![0]!;
      if (parent === root.elementId) break;
      if (seen.has(parent)) {
        errors.push(`Review gap: containment cycle includes '${parent}'.`);
        break;
      }
      seen.add(parent);
      current = parent;
    }
  }

  if (errors.length === 0) {
    for (const element of elementsById.values()) {
      const parentId = parentsByChild.get(element.elementId)![0]!;
      const parent = parentId === root.elementId ? root : elementsById.get(parentId)!;
      parent.children.push(element);
    }

    const visiting = new Set<string>();
    const visited = new Set<string>();
    const visit = (element: CandidateArchitectureElement): void => {
      if (visiting.has(element.elementId)) {
        errors.push(`Review gap: containment cycle includes '${element.elementId}'.`);
        return;
      }
      if (visited.has(element.elementId)) return;
      visiting.add(element.elementId);
      const localIds = new Set<string>();
      for (const child of element.children) {
        if (localIds.has(child.localId)) {
          errors.push(`Review gap: siblings under '${element.elementId}' reuse localId '${child.localId}'.`);
        }
        localIds.add(child.localId);
        visit(child);
      }
      visiting.delete(element.elementId);
      visited.add(element.elementId);
      element.children.sort((left, right) => left.localId.localeCompare(right.localId));
    };
    visit(root);
    for (const element of elementsById.values()) {
      if (!visited.has(element.elementId)) {
        errors.push(`Review gap: element '${element.elementId}' is not reachable from Project Root.`);
      }
    }
  }

  const knownIds = new Set([root.elementId, ...elementsById.keys()]);
  for (const relation of relations) {
    if (!knownIds.has(relation.from)) errors.push(`Review gap: relation references unknown source '${relation.from}'.`);
    if (!knownIds.has(relation.to)) errors.push(`Review gap: relation references unknown target '${relation.to}'.`);
  }

  return {
    model: { root, elements: [root, ...elementsById.values()], relations },
    errors,
  };
}

function renderCandidateElement(element: CandidateArchitectureElement, level: number): string {
  const prefix = ' '.repeat(level);
  const bodyPrefix = ' '.repeat(level + 2);
  const children = element.children.map(child => renderCandidateElement(child, level + 2)).join('\n');
  const body = [
    `${bodyPrefix}metadata { elementId ${quoteLikeC4(element.elementId)} }`,
    children,
  ].filter(Boolean).join('\n');
  return `${prefix}${element.localId} = ${element.kind} ${quoteLikeC4(element.title)} ${quoteLikeC4(element.summary)} {\n${body}\n${prefix}}`;
}

function renderCandidateSpecification(model: CandidateArchitectureModel): string {
  const parentsByKind = new Map<string, Set<string>>();
  const childrenByKind = new Map<string, Set<string>>();
  const visit = (parent: CandidateArchitectureElement): void => {
    for (const child of parent.children) {
      const parents = parentsByKind.get(child.kind) ?? new Set<string>();
      parents.add(parent.kind);
      parentsByKind.set(child.kind, parents);
      const children = childrenByKind.get(parent.kind) ?? new Set<string>();
      children.add(child.kind);
      childrenByKind.set(parent.kind, children);
      visit(child);
    }
  };
  visit(model.root);

  const kinds = [...new Set(model.elements.map(element => element.kind))]
    .filter(kind => kind !== 'project')
    .sort();
  const contractPolicyByKind = new Map(model.elements.map(element => [element.kind, element.contractPolicy]));
  const renderKinds = ['project', ...kinds].map(kind => {
    const contractPolicy = contractPolicyByKind.get(kind);
    if (!contractPolicy) throw new Error(`Cannot render element kind '${kind}' without an explicit contractPolicy`);
    const annotations = [
      ...(kind === 'project' ? ['root true'] : []),
      `contract ${contractPolicy}`,
      ...(parentsByKind.has(kind) ? [`parents [${[...parentsByKind.get(kind)!].sort().join(', ')}]`] : []),
      ...(childrenByKind.has(kind) ? [`children [${[...childrenByKind.get(kind)!].sort().join(', ')}]`] : []),
    ];
    return `  element ${kind} {\n    opsx {\n${annotations.map(value => `      ${value}`).join('\n')}\n    }\n  }`;
  });

  return `opsx {\n  languageVersion '1'\n}\n\nspecification {\n${renderKinds.join('\n\n')}\n\n  relationship invokes\n  relationship produces\n  relationship consumes\n  relationship precedes\n  relationship constrains\n  relationship validates\n}\n`;
}

function renderCandidateArchitecture(model: CandidateArchitectureModel): Map<string, string> {
  const fqnByElementId = new Map<string, string>();
  const visit = (element: CandidateArchitectureElement, fqn: string): void => {
    fqnByElementId.set(element.elementId, fqn);
    for (const child of element.children) visit(child, `${fqn}.${child.localId}`);
  };
  visit(model.root, model.root.localId);

  const relations = model.relations.map(relation => {
    const source = fqnByElementId.get(relation.from)!;
    const target = fqnByElementId.get(relation.to)!;
    const note = relation.note ? ` {\n  description ${quoteLikeC4(relation.note)}\n}` : '';
    return `${source} -[${relation.type}]-> ${target}${note}`;
  });

  return new Map([
    ['specification.c4', renderCandidateSpecification(model)],
    ['model.c4', `model {\n${renderCandidateElement(model.root, 2)}\n}\n`],
    ['relations.c4', `model {\n${indent(relations.join('\n'))}\n}\n`],
    ['views.c4', renderViews()],
  ]);
}

function formalSpecPath(projectRoot: string, folder: string): string {
  return FileSystemUtils.joinPath(projectRoot, OPSX_DIR_NAME, 'specs', folder, 'spec.md');
}

function compareConfidence(a: EvidenceDomain['confidence'], b: EvidenceDomain['confidence']): number {
  return DOMAIN_CONFIDENCE_ORDER[a] - DOMAIN_CONFIDENCE_ORDER[b];
}

function compareEvidenceDomains(a: EvidenceDomain, b: EvidenceDomain): number {
  const confidenceComparison = compareConfidence(a.confidence, b.confidence);
  return confidenceComparison !== 0 ? confidenceComparison : a.id.localeCompare(b.id);
}

function compareEvidenceElements(a: EvidenceElement, b: EvidenceElement): number {
  const confidenceComparison = compareConfidence(a.confidence, b.confidence);
  return confidenceComparison !== 0 ? confidenceComparison : a.elementId.localeCompare(b.elementId);
}

function normalizeBootstrapText(value: string | undefined): string | undefined {
  const normalized = value?.trim().replace(/\s+/g, ' ');
  return normalized ? normalized : undefined;
}

function deriveProjectIntent(state: BootstrapState): string | undefined {
  if (state.domainMaps.size === 0) return undefined;
  const summariesByElement = new Map<string, string>();
  for (const evidence of evidenceElements(state.evidence)) {
    const summary = normalizeBootstrapText(evidence.summary);
    if (summary) summariesByElement.set(evidence.elementId, summary);
  }
  for (const mapFile of state.domainMaps.values()) {
    for (const element of mapElements(mapFile)) {
      const summary = normalizeBootstrapText(element.summary);
      if (summary) summariesByElement.set(element.elementId, summary);
    }
  }
  if (summariesByElement.size === 0) return undefined;
  return [...summariesByElement.entries()]
    .sort(([leftId], [rightId]) => leftId.localeCompare(rightId))
    .map(([, summary]) => summary)
    .join('; ');
}

function deriveProjectScope(state: BootstrapState): string | undefined {
  if (!state.scope) {
    return undefined;
  }

  const mappedElementIds = [...state.domainMaps.values()]
    .flatMap(mapElements)
    .map(element => element.elementId)
    .sort();
  const segments = [`mode=${state.scope.mode}`];
  if (state.scope.include.length > 0) {
    segments.push(`include=${state.scope.include.join(', ')}`);
  }
  if (state.scope.exclude.length > 0) {
    segments.push(`exclude=${state.scope.exclude.join(', ')}`);
  }
  if (mappedElementIds.length > 0) {
    segments.push(`mapped elements=${mappedElementIds.join(', ')}`);
  }

  if (segments.length === 1) {
    return undefined;
  }

  return segments.join('; ');
}

function inferBootstrapProjectName(projectRoot: string): string {
  try {
    const packagePath = path.join(projectRoot, 'package.json');
    if (existsSync(packagePath)) {
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8')) as { name?: unknown };
      if (typeof packageJson.name === 'string' && packageJson.name.trim()) {
        return packageJson.name.trim();
      }
    }
  } catch {
    // Fall through to the project directory name.
  }
  return path.basename(projectRoot) || DEFAULT_BOOTSTRAP_PROJECT_NAME;
}

function toBootstrapProjectId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || DEFAULT_BOOTSTRAP_PROJECT_ID;
}

function buildBootstrapProjectMetadata(projectRoot: string, state: BootstrapState): ProjectOpsxBundle['project'] {
  const name = inferBootstrapProjectName(projectRoot);
  const intent = deriveProjectIntent(state);
  const scope = deriveProjectScope(state);
  return {
    id: toBootstrapProjectId(name),
    name,
    ...(intent ? { intent } : {}),
    ...(scope ? { scope } : {}),
  };
}

function normalizeEvidenceForFingerprint(evidence: EvidenceFile): EvidenceFile {
  if (isGenericEvidence(evidence)) {
    return {
      elements: [...evidence.elements]
        .sort((a, b) => a.elementId.localeCompare(b.elementId))
        .map(element => ({ ...element, sources: [...element.sources].sort() })),
    };
  }
  return {
    domains: [...evidence.domains]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(domain => ({ ...domain, sources: [...domain.sources].sort() })),
  };
}

function normalizeDomainMapForFingerprint(mapFile: DomainMapFile): DomainMapFile {
  const sortRelationsForFingerprint = <T extends { from: string; type: string; to: string }>(relations: T[]): T[] =>
    [...relations].sort((a, b) => {
      const fromComparison = a.from.localeCompare(b.from);
      if (fromComparison !== 0) return fromComparison;
      const typeComparison = a.type.localeCompare(b.type);
      return typeComparison !== 0 ? typeComparison : a.to.localeCompare(b.to);
    });
  const review_gaps = [...mapFile.review_gaps].sort((a, b) => {
    const evidenceComparison = a.evidence.localeCompare(b.evidence);
    return evidenceComparison !== 0 ? evidenceComparison : a.reason.localeCompare(b.reason);
  });
  if (isGenericMap(mapFile)) {
    return {
      elements: [...mapFile.elements].sort((a, b) => a.elementId.localeCompare(b.elementId)),
      parent_links: [...mapFile.parent_links].sort((a, b) => {
        const childComparison = a.child.localeCompare(b.child);
        return childComparison !== 0 ? childComparison : a.parent.localeCompare(b.parent);
      }),
      relations: sortRelationsForFingerprint(mapFile.relations),
      review_gaps,
    };
  }
  return {
    domain: { ...mapFile.domain },
    capabilities: [...mapFile.capabilities].sort((a, b) => a.id.localeCompare(b.id)),
    relations: sortRelationsForFingerprint(mapFile.relations),
    review_gaps,
    ...(mapFile.spec_groups ? { spec_groups: mapFile.spec_groups } : {}),
  };
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([left], [right]) => left.localeCompare(right));
    return `{${entries.map(([key, entryValue]) => `${JSON.stringify(key)}:${stableStringify(entryValue)}`).join(',')}}`;
  }

  return JSON.stringify(value);
}

function fingerprintValue(value: unknown): string {
  return createHash('sha256').update(stableStringify(value)).digest('hex');
}

async function runGitCommand(projectRoot: string, args: string[]): Promise<{ ok: boolean; stdout: string; stderr: string }> {
  try {
    const result = await execFile('git', args, {
      cwd: projectRoot,
      windowsHide: true,
    });
    return {
      ok: true,
      stdout: result.stdout.trim(),
      stderr: result.stderr.trim(),
    };
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      return { ok: false, stdout: '', stderr: 'git executable not found' };
    }
    return {
      ok: false,
      stdout: typeof error?.stdout === 'string' ? error.stdout.trim() : '',
      stderr: typeof error?.stderr === 'string' ? error.stderr.trim() : String(error?.message ?? error),
    };
  }
}

async function resolveCurrentGitHead(projectRoot: string): Promise<string | null> {
  const result = await runGitCommand(projectRoot, ['rev-parse', 'HEAD']);
  return result.ok && result.stdout ? result.stdout : null;
}

async function countExistingFormalOpsxFiles(projectRoot: string): Promise<number> {
  const results = await Promise.all(formalOpsxPaths(projectRoot).map((filePath) => FileSystemUtils.fileExists(filePath)));
  return results.filter(Boolean).length;
}

export async function detectBootstrapBaseline(projectRoot: string): Promise<BootstrapBaselineType> {
  const formalOpsxCount = await countExistingFormalOpsxFiles(projectRoot);
  if (formalOpsxCount === 2) {
    try {
      return await readProjectOpsx(projectRoot) ? 'formal-opsx' : 'invalid-partial-opsx';
    } catch {
      return 'invalid-partial-opsx';
    }
  }
  if (formalOpsxCount > 0) {
    return 'invalid-partial-opsx';
  }

  if (await hasRealSpecContent(projectRoot)) {
    return 'specs-based';
  }

  return 'raw';
}

export function getAllowedBootstrapModes(baselineType: BootstrapBaselineType): BootstrapMode[] {
  switch (baselineType) {
    case 'raw':
      return ['full', 'opsx-first'];
    case 'specs-based':
      return ['full'];
    case 'formal-opsx':
      return ['refresh'];
    case 'invalid-partial-opsx':
      return [];
  }
}

export function getBootstrapBaselineReason(baselineType: BootstrapBaselineType): string {
  switch (baselineType) {
    case 'raw':
      return 'Repository has no spec content or formal OPSX files.';
    case 'specs-based':
      return 'Repository has spec content but no formal OPSX files.';
    case 'formal-opsx':
      return 'Repository already has both formal OPSX v2 files. Use refresh to rebuild a complete candidate from current evidence.';
    case 'invalid-partial-opsx':
      return 'Bootstrap does not support repositories with partial or invalid formal OPSX files.';
  }
}

export function buildBootstrapPreInitStatus(baselineType: BootstrapBaselineType): BootstrapPreInitStatus {
  const allowedModes = getAllowedBootstrapModes(baselineType);
  return {
    initialized: false,
    baselineType,
    supported: allowedModes.length > 0,
    allowedModes,
    nextAction: allowedModes.length > 0 ? 'init' : null,
    reason: getBootstrapBaselineReason(baselineType),
  };
}

export async function getBootstrapPreInitStatus(projectRoot: string): Promise<BootstrapPreInitStatus> {
  return buildBootstrapPreInitStatus(await detectBootstrapBaseline(projectRoot));
}

function formatAllowedModes(allowedModes: BootstrapMode[]): string {
  return allowedModes.length > 0 ? allowedModes.join(', ') : '(none)';
}

function assertBootstrapModeAllowed(baselineType: BootstrapBaselineType, mode: BootstrapMode): void {
  const allowedModes = getAllowedBootstrapModes(baselineType);
  if (!allowedModes.includes(mode)) {
    throw new Error(
      `Bootstrap mode '${mode}' is not supported for baseline '${baselineType}'. Valid modes: ${formatAllowedModes(allowedModes)}`
    );
  }
}

function getNextBootstrapAction(phase: BootstrapPhase): BootstrapPhase | null {
  const currentIdx = BOOTSTRAP_PHASES.indexOf(phase);
  return currentIdx >= 0 && currentIdx < BOOTSTRAP_PHASES.length - 1
    ? BOOTSTRAP_PHASES[currentIdx + 1]
    : null;
}

async function candidateFilesExist(projectRoot: string, candidateSpecs: BootstrapCandidateSpec[]): Promise<boolean> {
  const results = await Promise.all([
    ...BOOTSTRAP_ARCHITECTURE_FILES.map(file => FileSystemUtils.fileExists(candidatePath(projectRoot, file))),
    ...candidateSpecs.map((spec) => FileSystemUtils.fileExists(candidateSpecPath(projectRoot, spec.folder))),
  ]);
  return results.every(Boolean);
}

function collectReviewChecks(reviewContent: string): { checkedDomains: Set<string>; uncheckedItems: string[] } {
  const checkedDomains = new Set<string>();
  const uncheckedItems: string[] = [];

  for (const rawLine of reviewContent.split('\n')) {
    const line = rawLine.trim();
    const checkedMatch = line.match(/^-\s+\[x\]\s+([^\s—]+)/i);
    if (checkedMatch) {
      checkedDomains.add(checkedMatch[1]);
    }

    if (/^-\s+\[\s\]/.test(line)) {
      uncheckedItems.push(line);
    }
  }

  return { checkedDomains, uncheckedItems };
}

function usesShallOrMust(text: string): boolean {
  return /\b(SHALL|MUST)\b/.test(text);
}

function normalizeSpecFolderInput(folder: string): string {
  return folder.trim();
}

function getConfiguredSchemaName(projectRoot: string): string {
  return readProjectConfig(projectRoot)?.schema ?? 'spec-driven';
}

function validateSpecScenarioSteps(
  capabilityId: string,
  requirementTitle: string,
  scenarioTitle: string,
  steps: Array<{ keyword: 'GIVEN' | 'WHEN' | 'THEN' | 'AND'; text: string }>
): string[] {
  const errors: string[] = [];
  const keywords = new Set(steps.map((step) => step.keyword));
  if (!keywords.has('WHEN')) {
    errors.push(`Capability '${capabilityId}' requirement '${requirementTitle}' scenario '${scenarioTitle}' must include at least one WHEN step`);
  }
  if (!keywords.has('THEN')) {
    errors.push(`Capability '${capabilityId}' requirement '${requirementTitle}' scenario '${scenarioTitle}' must include at least one THEN step`);
  }
  return errors;
}

function renderProjectedProse(text: string, _projection: RuntimeProjection): string {
  return text.trim();
}

function renderProjectContractSpec(bundle: ProjectOpsxBundle, projection: RuntimeProjection): string {
  const intent = renderProjectedProse(
    bundle.project.intent ?? 'The project intent is reviewed as part of bootstrap promotion.',
    projection,
  );
  return `---\nelement: project.root\n---\n\n# Spec: project\n\n## Purpose\n\n${intent}\n\n## Requirements\n\n### Requirement: Project intent\nThe project SHALL preserve the reviewed semantic model intent.\n\n#### Scenario: Project model is reviewed\n- **WHEN** the bootstrap candidate is reviewed\n- **THEN** the promoted model reflects the approved project intent\n`;
}

function renderCandidateSpec(
  elementId: string,
  spec: ElementSpec,
  folder: string,
  projection: RuntimeProjection
): string {
  const lines: string[] = [
    '---',
    `element: ${elementId}`,
    '---',
    '',
    `# Spec: ${folder}`,
    '',
    '## Purpose',
    '',
    renderProjectedProse(spec.purpose, projection),
    '',
    '## Requirements',
    '',
  ];

  for (const requirement of spec.requirements) {
    lines.push(`### Requirement: ${renderProjectedProse(requirement.title, projection)}`);
    lines.push(renderProjectedProse(requirement.text, projection));
    lines.push('');

    for (const scenario of requirement.scenarios) {
      lines.push(`#### Scenario: ${renderProjectedProse(scenario.title, projection)}`);
      for (const step of scenario.steps) {
        lines.push(`- **${step.keyword}** ${renderProjectedProse(step.text, projection)}`);
      }
      lines.push('');
    }
  }

  return `${lines.join('\n').trim()}\n`;
}

async function assembleCandidateSpecs(
  projectRoot: string,
  state: BootstrapState,
  bundle: ProjectOpsxBundle | null,
  options: { addedCapabilityIds?: Set<string> } = {}
): Promise<CandidateSpecAssembly> {
  if (!bundle) {
    return { specs: [], preservedFormalPaths: [], sourceErrors: [], validationErrors: [] };
  }

  const sourceErrors: string[] = [];
  const specs: BootstrapCandidateSpec[] = [];
  const preservedFormalPaths: string[] = [];
  const validationErrors: string[] = [];
  const seenFolders = new Map<string, string>();
  const validator = new Validator(false);
  const candidateProjection = projectConfigForRuntime(readProjectConfig(projectRoot), {
    consumer: 'bootstrap-candidate-spec',
  });

  const projectFolder = 'project';
  const projectPath = formalSpecPath(projectRoot, projectFolder);
  if (state.metadata.baseline_type !== 'specs-based' || !await FileSystemUtils.fileExists(projectPath)) {
    const projectContent = renderProjectContractSpec(bundle, candidateProjection);
    const projectRelativePath = `.opsx/bootstrap/candidate/specs/${projectFolder}/spec.md`;
    specs.push({
      elementId: 'project.root',
      folder: projectFolder,
      candidateRelativePath: projectRelativePath,
      formalRelativePath: `.opsx/specs/${projectFolder}/spec.md`,
      content: projectContent,
    });
    const report = await validator.validateSpecContent(projectFolder, projectContent);
    if (!report.valid) {
      for (const issue of report.issues.filter(issue => issue.level === 'ERROR')) {
        validationErrors.push(`Candidate spec '${projectRelativePath}' failed validation at ${issue.path || 'file'}: ${issue.message}`);
      }
    }
  }

  if (state.metadata.mode === 'opsx-first') {
    return { specs, preservedFormalPaths, sourceErrors, validationErrors };
  }

  const sortedDomainMaps = [...state.domainMaps.entries()]
    .sort(([leftId], [rightId]) => leftId.localeCompare(rightId))
    .map(([, mapFile]) => mapFile);
  const restrictToAddedCapabilities = state.metadata.mode === 'refresh' ? (options.addedCapabilityIds ?? new Set<string>()) : null;

  for (const mapFile of sortedDomainMaps) {
    if (isGenericMap(mapFile)) {
      for (const element of [...mapFile.elements].sort((a, b) => a.elementId.localeCompare(b.elementId))) {
        if (!element.spec) continue;
        const folder = normalizeSpecFolderInput(element.spec.folder);
        if (!folder || folder.includes('/') || folder.includes('\\')) {
          sourceErrors.push(`Element '${element.elementId}' has invalid spec folder '${element.spec.folder}'. Use a single cross-platform path segment.`);
          continue;
        }
        const priorElement = seenFolders.get(folder);
        if (priorElement && priorElement !== element.elementId) {
          sourceErrors.push(`Elements '${priorElement}' and '${element.elementId}' map to the same spec folder '${folder}'`);
          continue;
        }
        seenFolders.set(folder, element.elementId);
        for (const requirement of element.spec.requirements) {
          if (!usesShallOrMust(requirement.text)) {
            sourceErrors.push(`Element '${element.elementId}' requirement '${requirement.title}' must contain SHALL or MUST`);
          }
          for (const scenario of requirement.scenarios) {
            sourceErrors.push(...validateSpecScenarioSteps(
              element.elementId,
              requirement.title,
              scenario.title,
              scenario.steps
            ));
          }
        }
        const formalRelativePath = `.opsx/specs/${folder}/spec.md`;
        const alreadyExists = await FileSystemUtils.fileExists(formalSpecPath(projectRoot, folder));
        if (state.metadata.baseline_type === 'specs-based' && alreadyExists) {
          if (element.spec.preserve_existing) {
            preservedFormalPaths.push(formalRelativePath);
            continue;
          }
          sourceErrors.push(`Element '${element.elementId}' maps to existing spec path '${formalRelativePath}'. Mark spec.preserve_existing: true to preserve it, or choose a different folder.`);
          continue;
        }
        if (state.metadata.mode === 'refresh' && alreadyExists) {
          sourceErrors.push(`Refresh cannot write spec '${formalRelativePath}' because the target path already exists. Preserve existing formal specs or choose a different folder.`);
          continue;
        }
        const candidateRelativePath = `.opsx/bootstrap/candidate/specs/${folder}/spec.md`;
        const content = renderCandidateSpec(element.elementId, element.spec, folder, candidateProjection);
        specs.push({ elementId: element.elementId, folder, candidateRelativePath, formalRelativePath, content });
        const report = await validator.validateSpecContent(folder, content);
        for (const issue of report.issues.filter(issue => issue.level === 'ERROR')) {
          validationErrors.push(`Candidate spec '${candidateRelativePath}' failed validation at ${issue.path || 'file'}: ${issue.message}`);
        }
      }
      continue;
    }

    // Coarse mode: generate specs from spec_groups
    if (state.scope?.granularity === 'coarse' && mapFile.spec_groups && mapFile.spec_groups.length > 0) {
      const domainCapIds = new Set(mapFile.capabilities.map((c) => c.id));
      for (const group of mapFile.spec_groups) {
        const folder = normalizeSpecFolderInput(group.folder);
        if (!folder || folder.includes('/') || folder.includes('\\')) {
          sourceErrors.push(`spec_groups folder '${group.folder}' must be a single cross-platform path segment`);
          continue;
        }

        const priorCapability = seenFolders.get(folder);
        if (priorCapability) {
          sourceErrors.push(`spec_groups folder '${folder}' conflicts with folder from ${priorCapability}`);
          continue;
        }
        seenFolders.set(folder, `spec_group:${folder}`);

        const candidateRelativePath = `.opsx/bootstrap/candidate/specs/${folder}/spec.md`;
        const formalRelativePath = `.opsx/specs/${folder}/spec.md`;
        const existingFormalPath = formalSpecPath(projectRoot, folder);
        const alreadyExists = await FileSystemUtils.fileExists(existingFormalPath);
        if (state.metadata.mode === 'refresh' && alreadyExists) {
          sourceErrors.push(
            `Refresh cannot write spec '${formalRelativePath}' because the target path already exists. Preserve existing formal specs or choose a different folder.`
          );
          continue;
        }

        if (state.metadata.baseline_type === 'specs-based' && alreadyExists) {
          preservedFormalPaths.push(formalRelativePath);
          continue;
        }

        const groupCapabilities = group.capabilities.filter((c) => domainCapIds.has(c));
        if (groupCapabilities.length !== 1) {
          sourceErrors.push(`Spec group '${folder}' has ambiguous owners (${groupCapabilities.join(', ')}); resolve to exactly one element before promotion.`);
          continue;
        }
        const elementId = groupCapabilities[0];
        const frontmatterLines = ['---', `element: ${elementId}`, '---', '', `# Spec: ${folder}`, '', '## Purpose', '', group.purpose || 'TODO', ''];
        const contentParts = [...frontmatterLines];
        if (group.requirements && group.requirements.length > 0) {
          contentParts.push('## Requirements', '');
          for (const req of group.requirements) {
            contentParts.push(`### Requirement: ${req.title}`, req.text, '');
            for (const scenario of req.scenarios) {
              contentParts.push(`#### Scenario: ${scenario.title}`);
              for (const step of scenario.steps) {
                contentParts.push(`- **${step.keyword}** ${step.text}`);
              }
              contentParts.push('');
            }
          }
        } else {
          contentParts.push('## Requirements', '', '### Requirement: TODO', 'The system SHALL be defined.', '', '#### Scenario: TODO', '- **WHEN** the system is used', '- **THEN** it responds', '');
        }
        const content = contentParts.join('\n');
        specs.push({
          elementId,
          folder,
          candidateRelativePath,
          formalRelativePath,
          content,
        });

        const report = await validator.validateSpecContent(folder, content);
        if (!report.valid) {
          for (const issue of report.issues.filter((issue) => issue.level === 'ERROR')) {
            validationErrors.push(
              `Candidate spec '${candidateRelativePath}' failed validation at ${issue.path || 'file'}: ${issue.message}`
            );
          }
        }
      }
      continue;
    }

    for (const capability of [...mapFile.capabilities].sort((a, b) => a.id.localeCompare(b.id))) {
      if (restrictToAddedCapabilities && !restrictToAddedCapabilities.has(capability.id)) {
        const formalPath = capability.spec ? `.opsx/specs/${normalizeSpecFolderInput(capability.spec.folder)}/spec.md` : null;
        if (formalPath) {
          preservedFormalPaths.push(formalPath);
        }
        continue;
      }

      if (!capability.spec) {
        if (state.scope?.granularity !== 'coarse' || !mapFile.spec_groups || mapFile.spec_groups.length === 0) {
          sourceErrors.push(`Capability '${capability.id}' is missing spec source data. Add spec.folder, spec.purpose, and spec.requirements.`);
        }
        continue;
      }

      const folder = normalizeSpecFolderInput(capability.spec.folder);
      if (!folder || folder.includes('/') || folder.includes('\\')) {
        sourceErrors.push(`Capability '${capability.id}' has invalid spec folder '${capability.spec.folder}'. Use a single cross-platform path segment.`);
        continue;
      }

      const priorCapability = seenFolders.get(folder);
      if (priorCapability && priorCapability !== capability.id) {
        sourceErrors.push(`Capabilities '${priorCapability}' and '${capability.id}' map to the same spec folder '${folder}'`);
        continue;
      }
      seenFolders.set(folder, capability.id);

      if (!capability.spec.purpose.trim()) {
        sourceErrors.push(`Capability '${capability.id}' has an empty spec purpose`);
      }

      for (const requirement of capability.spec.requirements) {
        if (!usesShallOrMust(requirement.text)) {
          sourceErrors.push(`Capability '${capability.id}' requirement '${requirement.title}' must contain SHALL or MUST`);
        }

        for (const scenario of requirement.scenarios) {
          sourceErrors.push(
            ...validateSpecScenarioSteps(capability.id, requirement.title, scenario.title, scenario.steps)
          );
        }
      }

      const formalRelativePath = `.opsx/specs/${folder}/spec.md`;
      const existingFormalPath = formalSpecPath(projectRoot, folder);
      const alreadyExists = await FileSystemUtils.fileExists(existingFormalPath);
      if (state.metadata.mode === 'refresh' && alreadyExists) {
        sourceErrors.push(
          `Refresh cannot write spec '${formalRelativePath}' because the target path already exists. Preserve existing formal specs or choose a different folder.`
        );
        continue;
      }

      if (state.metadata.baseline_type === 'specs-based' && alreadyExists) {
        if (capability.spec.preserve_existing) {
          preservedFormalPaths.push(formalRelativePath);
          continue;
        }
        sourceErrors.push(
          `Capability '${capability.id}' maps to existing spec path '${formalRelativePath}'. Mark spec.preserve_existing: true to preserve it, or choose a different folder.`
        );
        continue;
      }

      const candidateRelativePath = `.opsx/bootstrap/candidate/specs/${folder}/spec.md`;
      const content = renderCandidateSpec(capability.id, capability.spec, folder, candidateProjection);
      specs.push({
        elementId: capability.id,
        folder,
        candidateRelativePath,
        formalRelativePath,
        content,
      });

      const report = await validator.validateSpecContent(folder, content);
      if (!report.valid) {
        for (const issue of report.issues.filter((issue) => issue.level === 'ERROR')) {
          validationErrors.push(
            `Candidate spec '${candidateRelativePath}' failed validation at ${issue.path || 'file'}: ${issue.message}`
          );
        }
      }
    }
  }

  return {
    specs,
    preservedFormalPaths: preservedFormalPaths.sort(),
    sourceErrors,
    validationErrors,
  };
}

async function validateFormalSpecTargets(
  projectRoot: string,
  state: BootstrapState,
  candidateSpecs: BootstrapCandidateSpec[]
): Promise<string[]> {
  const errors: string[] = [];
  for (const spec of candidateSpecs) {
    const formalPath = formalSpecPath(projectRoot, spec.folder);
    if (await FileSystemUtils.fileExists(formalPath)) {
      if (state.metadata.baseline_type === 'specs-based') {
        errors.push(`Cannot promote candidate spec '${spec.formalRelativePath}' because the target path already exists`);
      } else {
        errors.push(`Raw bootstrap cannot promote over existing spec path '${spec.formalRelativePath}'`);
      }
    }
  }
  return errors;
}

async function validateCandidateArchitectureOnDisk(
  projectRoot: string,
  candidateSpecs: BootstrapCandidateSpec[]
): Promise<string[]> {
  const candidateRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'opsx-bootstrap-candidate-'));
  try {
    const architectureDirectory = path.join(candidateRoot, OPSX_DIR_NAME, 'architecture');
    await FileSystemUtils.createDirectory(architectureDirectory);
    await Promise.all(BOOTSTRAP_ARCHITECTURE_FILES.map(async file => {
      const source = candidatePath(projectRoot, file);
      await fs.copyFile(source, path.join(architectureDirectory, file));
    }));
    const specsDirectory = path.join(candidateRoot, OPSX_DIR_NAME, 'specs');
    await Promise.all(candidateSpecs.map(async spec => {
      const target = path.join(specsDirectory, spec.folder, 'spec.md');
      await FileSystemUtils.createDirectory(path.dirname(target));
      await fs.copyFile(candidateSpecPath(projectRoot, spec.folder), target);
    }));

    const architecture = await readLikeC4Architecture(candidateRoot);
    const validation = await validateArchitecture(candidateRoot, architecture);
    const errors = validation.errors.map(issue => `Candidate architecture: ${issue.message}`);
    const registry = await buildSpecRegistry(candidateRoot, specsDirectory);
    const elementIds = new Set(architecture.elements.map(element => element.id));
    errors.push(...registry.getOrphanedSpecs().map(spec => `Candidate spec '${spec}' has no singular element binding`));
    for (const [spec, element] of registry.specToElement) {
      if (!elementIds.has(element)) {
        errors.push(`Candidate spec '${spec}' binds missing element '${element}'`);
      }
      errors.push(...registry.getIssuesForSpec(spec).map(issue => `Candidate spec '${spec}': ${issue.message}`));
    }
    errors.push(...registry.getUncoveredRequiredElements(architecture.elements, architecture.metamodel)
      .map(element => `Candidate architecture required element '${element}' has no bound Spec`));
    return errors;
  } catch (error) {
    return [`Candidate architecture validation failed: ${error instanceof Error ? error.message : String(error)}`];
  } finally {
    await fs.rm(candidateRoot, { recursive: true, force: true }).catch(() => undefined);
  }
}

async function validateCandidateSpecsOnDisk(
  projectRoot: string,
  candidateSpecs: BootstrapCandidateSpec[]
): Promise<string[]> {
  const errors: string[] = [];
  const validator = new Validator(false);

  for (const spec of candidateSpecs) {
    const filePath = candidateSpecPath(projectRoot, spec.folder);
    let content: string;
    try {
      content = await fs.readFile(filePath, 'utf-8');
    } catch {
      errors.push(`Candidate spec is missing: ${spec.candidateRelativePath}`);
      continue;
    }

    const report = await validator.validateSpecContent(spec.folder, content);
    if (!report.valid) {
      for (const issue of report.issues.filter((i) => i.level === 'ERROR')) {
        errors.push(`Candidate spec '${spec.candidateRelativePath}' failed validation at ${issue.path || 'file'}: ${issue.message}`);
      }
    }
  }

  return errors;
}

async function copyFile(sourcePath: string, targetPath: string): Promise<void> {
  await FileSystemUtils.createDirectory(path.dirname(targetPath));
  const content = await fs.readFile(sourcePath);
  await fs.writeFile(targetPath, content);
}

function sortNodes<T extends OpsxNode>(nodes: T[]): T[] {
  return [...nodes].sort((left, right) => left.id.localeCompare(right.id));
}

function sortRelations(relations: OpsxRelation[]): OpsxRelation[] {
  return [...relations].sort((left, right) => {
    const fromComparison = left.from.localeCompare(right.from);
    if (fromComparison !== 0) return fromComparison;
    const toComparison = left.to.localeCompare(right.to);
    if (toComparison !== 0) return toComparison;
    return left.type.localeCompare(right.type);
  });
}

function relationKey(relation: OpsxRelation): string {
  return `${relation.from}|${relation.to}|${relation.type}`;
}

function nodesEqual(left: OpsxNode, right: OpsxNode): boolean {
  return stableStringify(left) === stableStringify(right);
}

function deriveRefreshPlan(state: BootstrapState): RefreshPlan {
  return {
    strategy: 'full-rebuild',
    reason: 'Rebuilding the complete candidate from current source, specs, config, and reviewed workspace evidence.',
    impactedDomainIds: [...state.domainMaps.keys()].sort(),
  };
}

function assembleRefreshDelta(
  formalBundle: ProjectOpsxBundle,
  candidateBundle: ProjectOpsxBundle,
  refreshPlan: RefreshPlan
): RefreshDeltaSummary {
  const addedDomains: ProjectOpsxBundle['domains'] = [];
  const modifiedDomains: ProjectOpsxBundle['domains'] = [];
  const removedDomains: ProjectOpsxBundle['domains'] = [];
  const addedCapabilities: ProjectOpsxBundle['capabilities'] = [];
  const modifiedCapabilities: ProjectOpsxBundle['capabilities'] = [];
  const removedCapabilities: ProjectOpsxBundle['capabilities'] = [];

  collectNodeDiff(formalBundle.domains, candidateBundle.domains, addedDomains, modifiedDomains, removedDomains);
  collectNodeDiff(
    formalBundle.capabilities,
    candidateBundle.capabilities,
    addedCapabilities,
    modifiedCapabilities,
    removedCapabilities,
  );

  const formalRelationsByKey = new Map(formalBundle.relations.map((relation) => [relationKey(relation), relation]));
  const candidateRelationsByKey = new Map(candidateBundle.relations.map((relation) => [relationKey(relation), relation]));
  const addedRelations = candidateBundle.relations.filter((relation) => !formalRelationsByKey.has(relationKey(relation)));
  const modifiedRelations = candidateBundle.relations.filter((relation) => {
    const current = formalRelationsByKey.get(relationKey(relation));
    return current !== undefined && stableStringify(current) !== stableStringify(relation);
  });
  const removedRelations = formalBundle.relations.filter((relation) => !candidateRelationsByKey.has(relationKey(relation)));

  const delta: OpsxDelta = {
    ...(addedDomains.length || addedCapabilities.length || addedRelations.length ? {
      ADDED: {
        ...(addedDomains.length ? { domains: sortNodes(addedDomains) } : {}),
        ...(addedCapabilities.length ? { capabilities: sortNodes(addedCapabilities) } : {}),
        ...(addedRelations.length ? { relations: sortRelations(addedRelations) } : {}),
      },
    } : {}),
    ...(modifiedDomains.length || modifiedCapabilities.length || modifiedRelations.length ? {
      MODIFIED: {
        ...(modifiedDomains.length ? { domains: sortNodes(modifiedDomains) } : {}),
        ...(modifiedCapabilities.length ? { capabilities: sortNodes(modifiedCapabilities) } : {}),
        ...(modifiedRelations.length ? { relations: sortRelations(modifiedRelations) } : {}),
      },
    } : {}),
    ...(removedDomains.length || removedCapabilities.length || removedRelations.length ? {
      REMOVED: {
        ...(removedDomains.length ? { domains: sortNodes(removedDomains) } : {}),
        ...(removedCapabilities.length ? { capabilities: sortNodes(removedCapabilities) } : {}),
        ...(removedRelations.length ? { relations: sortRelations(removedRelations) } : {}),
      },
    } : {}),
  };

  const result = applyOpsxDelta(formalBundle, delta);
  const affectedDomainIds = [...new Set([
    ...formalBundle.domains.map(({ id }) => id),
    ...candidateBundle.domains.map(({ id }) => id),
  ])].sort();
  const affectedNodeIds = [...new Set([
    ...affectedDomainIds,
    ...formalBundle.capabilities.map(({ id }) => id),
    ...candidateBundle.capabilities.map(({ id }) => id),
  ])].sort();

  return {
    delta,
    result,
    mergedBundle: candidateBundle,
    affectedDomainIds: refreshPlan.impactedDomainIds.length > 0
      ? refreshPlan.impactedDomainIds
      : affectedDomainIds,
    affectedNodeIds,
    preservedNodeIds: [],
  };
}

function collectNodeDiff<T extends OpsxNode>(
  formalNodes: T[],
  candidateNodes: T[],
  added: T[],
  modified: T[],
  removed: T[],
): void {
  const formalById = new Map(formalNodes.map((node) => [node.id, node]));
  const candidateById = new Map(candidateNodes.map((node) => [node.id, node]));
  for (const node of candidateNodes) {
    const current = formalById.get(node.id);
    if (!current) added.push(node);
    else if (!nodesEqual(current, node)) modified.push(node);
  }
  for (const node of formalNodes) {
    if (!candidateById.has(node.id)) removed.push(node);
  }
}

// ─── Core Functions ──────────────────────────────────────────────────────────

export async function initBootstrap(
  projectRoot: string,
  options: { mode?: BootstrapMode; scope?: string[]; restart?: boolean; granularity?: 'coarse' | 'fine' } = {}
): Promise<BootstrapInitResult> {
  const bsDir = bootstrapPath(projectRoot);
  const mode = options.mode ?? 'full';
  const baselineType = await detectBootstrapBaseline(projectRoot);
  const preInitStatus = buildBootstrapPreInitStatus(baselineType);
  if (!preInitStatus.supported) {
    throw new Error(preInitStatus.reason);
  }
  assertBootstrapModeAllowed(baselineType, mode);

  let historyPath: string | null = null;
  let inheritedScope: ScopeConfig | null = null;
  let inheritedAnchorCommit: string | null = null;

  if (await FileSystemUtils.directoryExists(bsDir)) {
    const existingState = await readBootstrapState(projectRoot);
    const completion = await resolveBootstrapWorkspaceCompletion(projectRoot, existingState.metadata);
    if (!options.restart) {
      if (completion.state === 'completed') {
        const restartCommand = buildBootstrapRestartCommand(baselineType) ?? `opsx bootstrap init --mode ${mode} --restart`;
        throw new Error(
          `Bootstrap workspace already exists and the previous run is complete. Run \`${restartCommand}\` to start a new run from the retained workspace.`
        );
      }

      throw new Error('Bootstrap workspace already exists and is still in progress. Run `opsx bootstrap status` or `opsx bootstrap instructions` to resume the current phase.');
    }

    if (completion.state !== 'completed') {
      throw new Error('Bootstrap workspace is still in progress. `--restart` only works after promote completes. Run `opsx bootstrap status` or `opsx bootstrap instructions` to resume the current phase.');
    }

    inheritedScope = existingState.scope;
    inheritedAnchorCommit = existingState.metadata.refresh_anchor_commit;
    historyPath = await moveBootstrapWorkspaceToHistory(projectRoot, bsDir);
  } else if (options.restart) {
    throw new Error('No retained bootstrap workspace exists. Remove `--restart` to create a new workspace.');
  }

  const now = new Date().toISOString();

  const metadata: BootstrapMetadata = {
    phase: 'init',
    baseline_type: baselineType,
    mode,
    created_at: now,
    completed_at: null,
    source_fingerprint: null,
    candidate_fingerprint: null,
    review_fingerprint: null,
    refresh_anchor_commit: inheritedAnchorCommit,
    candidate_spec_paths: [],
    completed_marker_present: true,
  };

  const scope: ScopeConfig = {
    mode,
    include: options.scope ?? inheritedScope?.include ?? [],
    exclude: inheritedScope?.exclude ?? [],
    granularity: options.granularity ?? (inheritedScope ? inheritedScope.granularity : undefined) as 'coarse' | 'fine',
  };

  if (!scope.granularity) {
    throw new Error('Missing required option: --granularity coarse|fine');
  }

  // Create workspace
  await FileSystemUtils.createDirectory(bsDir);
  await FileSystemUtils.createDirectory(bootstrapPath(projectRoot, BOOTSTRAP_DOMAIN_MAP_DIR));
  await FileSystemUtils.createDirectory(bootstrapPath(projectRoot, BOOTSTRAP_CANDIDATE_DIR));

  // Write files
  await writeBootstrapMetadata(projectRoot, metadata);
  await writeYaml(bootstrapPath(projectRoot, BOOTSTRAP_SCOPE_FILE), scope);

  return {
    metadata,
    restarted: options.restart === true,
    historyPath: historyPath ? toDisplayPath(projectRoot, historyPath) : null,
    workspacePath: bsDir,
  };
}

export async function readBootstrapState(projectRoot: string): Promise<BootstrapState> {
  const bsDir = bootstrapPath(projectRoot);

  if (!await FileSystemUtils.directoryExists(bsDir)) {
    throw new Error('No bootstrap workspace found. Run `opsx bootstrap init` first.');
  }

  const fallbackBaselineType = await inferLegacyBaselineType(projectRoot);
  const metaRaw = await readYaml(bootstrapPath(projectRoot, BOOTSTRAP_METADATA_FILE));
  const metadata = parseBootstrapMetadata(metaRaw, fallbackBaselineType);

  let scope: ScopeConfig | null = null;
  try {
    const scopeRaw = await readYaml(bootstrapPath(projectRoot, BOOTSTRAP_SCOPE_FILE));
    scope = parseScopeConfig(scopeRaw);
  } catch { /* scope may not exist yet */ }

  let evidence: EvidenceFile | null = null;
  try {
    const evidenceRaw = await readYaml(bootstrapPath(projectRoot, BOOTSTRAP_EVIDENCE_FILE));
    evidence = EvidenceFileSchema.parse(evidenceRaw);
  } catch { /* evidence may not exist yet */ }

  // Read domain maps
  const domainMaps = new Map<string, DomainMapFile>();
  const invalidDomainMaps = new Map<string, InvalidDomainMap>();
  const mapDir = bootstrapPath(projectRoot, BOOTSTRAP_DOMAIN_MAP_DIR);
  if (await FileSystemUtils.directoryExists(mapDir)) {
    const entries = await fs.readdir(mapDir);
    for (const entry of entries) {
      if (!entry.endsWith('.yaml')) continue;
      try {
        const raw = await readYaml(path.join(mapDir, entry));
        const parsed = DomainMapFileSchema.parse(raw);
        const mapId = isGenericMap(parsed) ? entry.replace(/\.yaml$/, '') : parsed.domain.id;
        domainMaps.set(mapId, parsed);
      } catch (error) {
        const domainId = entry.replace(/\.yaml$/, '');
        invalidDomainMaps.set(domainId, {
          file: entry,
          domainId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  const reviewPath = bootstrapPath(projectRoot, BOOTSTRAP_REVIEW_FILE);
  const reviewExists = await FileSystemUtils.fileExists(reviewPath);

  return { metadata, scope, evidence, domainMaps, invalidDomainMaps, reviewExists };
}

export async function advancePhase(projectRoot: string, targetPhase: BootstrapPhase): Promise<void> {
  const fallbackBaselineType = await inferLegacyBaselineType(projectRoot);
  const metaRaw = await readYaml(bootstrapPath(projectRoot, BOOTSTRAP_METADATA_FILE));
  const metadata = parseBootstrapMetadata(metaRaw, fallbackBaselineType);

  const currentIdx = BOOTSTRAP_PHASES.indexOf(metadata.phase);
  const targetIdx = BOOTSTRAP_PHASES.indexOf(targetPhase);

  if (targetIdx <= currentIdx) {
    throw new Error(`Cannot advance to '${targetPhase}' — current phase is '${metadata.phase}'.`);
  }

  if (targetIdx > currentIdx + 1) {
    throw new Error(`Cannot skip phases. Current: '${metadata.phase}', target: '${targetPhase}'.`);
  }

  metadata.phase = targetPhase;
  await writeBootstrapMetadata(projectRoot, metadata);
}

export async function updateDomainProgress(
  projectRoot: string,
  domainId: string,
  data: DomainMapFile
): Promise<void> {
  const validated = DomainMapFileSchema.parse(data);
  const fileName = `${domainId}.yaml`;
  await writeYaml(bootstrapPath(projectRoot, BOOTSTRAP_DOMAIN_MAP_DIR, fileName), validated);
}

export async function getBootstrapStatus(projectRoot: string): Promise<BootstrapStatus> {
  if (!await FileSystemUtils.directoryExists(bootstrapPath(projectRoot))) {
    return getBootstrapPreInitStatus(projectRoot);
  }

  const state = await readBootstrapState(projectRoot);
  const completion = await resolveBootstrapWorkspaceCompletion(projectRoot, state.metadata);
  const currentBaselineType = completion.state === 'completed'
    ? await detectBootstrapBaseline(projectRoot)
    : state.metadata.baseline_type;
  const derived = await deriveBootstrapArtifacts(projectRoot, state);
  const domains: DomainStatus[] = [];
  const elements: ElementStatus[] = [];

  if (state.evidence) {
    if (isGenericEvidence(state.evidence)) {
      const mappedIds = new Set([...state.domainMaps.values()].flatMap(mapElements).map(element => element.elementId));
      for (const element of [...state.evidence.elements].sort(compareEvidenceElements)) {
        elements.push({
          elementId: element.elementId,
          kind: element.kind,
          confidence: element.confidence,
          mapped: mappedIds.has(element.elementId),
          reviewed: derived.reviewState === 'current' && derived.checkedDomains.has(element.elementId),
        });
      }
    } else {
      const orderedDomains = [...state.evidence.domains].sort(compareEvidenceDomains);
      for (const dom of orderedDomains) {
        const mapFile = state.domainMaps.get(dom.id);
        const invalidMap = state.invalidDomainMaps.get(dom.id);
        const mapState = mapFile ? 'valid' : invalidMap ? 'invalid' : 'missing';
        domains.push({
          id: dom.id,
          confidence: dom.confidence,
          mapped: mapState === 'valid',
          mapState,
          ...(invalidMap ? { mapError: invalidMap.error } : {}),
          capabilityCount: mapFile && !isGenericMap(mapFile) ? mapFile.capabilities.length : 0,
          reviewed: derived.reviewState === 'current' && derived.checkedDomains.has(dom.id),
        });
      }
    }
  }

  return {
    initialized: true,
    phase: state.metadata.phase,
    baselineType: currentBaselineType,
    mode: state.metadata.mode,
    workspaceState: completion.state,
    completedAt: completion.completedAt,
    completionSource: completion.source,
    restartCommand: completion.state === 'completed' ? buildBootstrapRestartCommand(currentBaselineType) : null,
    nextAction: completion.state === 'completed' ? 'restart' : getNextBootstrapAction(state.metadata.phase),
    transitionCommand: completion.state === 'in-progress' && state.metadata.phase === 'init'
      ? 'opsx bootstrap advance scan'
      : null,
    created_at: state.metadata.created_at,
    domains,
    totalDomains: domains.length,
    mappedDomains: domains.filter(d => d.mapped).length,
    reviewedDomains: domains.filter(d => d.reviewed).length,
    elements,
    totalElements: elements.length,
    mappedElements: elements.filter(element => element.mapped).length,
    reviewedElements: elements.filter(element => element.reviewed).length,
    candidateState: derived.candidateState,
    reviewState: derived.reviewState,
    reviewApproved: derived.reviewApproved,
  };
}

// ─── Gate Validation ─────────────────────────────────────────────────────────

export async function validateGate(
  projectRoot: string,
  gate: 'scan_to_map' | 'map_to_review' | 'review_to_promote'
): Promise<GateResult> {
  const state = await readBootstrapState(projectRoot);
  const errors: string[] = [];

  switch (gate) {
    case 'scan_to_map': {
      if (!state.evidence) {
        errors.push('evidence.yaml not found');
        break;
      }
      const ids = new Set<string>();
      if (isGenericEvidence(state.evidence)) {
        for (const element of state.evidence.elements) {
          if (ids.has(element.elementId)) errors.push(`Duplicate elementId: ${element.elementId}`);
          ids.add(element.elementId);
        }
      } else {
        for (const dom of state.evidence.domains) {
          if (ids.has(dom.id)) errors.push(`Duplicate domain ID: ${dom.id}`);
          ids.add(dom.id);
        }
      }
      break;
    }
    case 'map_to_review': {
      if (!state.evidence) {
        errors.push('evidence.yaml not found');
        break;
      }
      if (isGenericEvidence(state.evidence)) {
        for (const invalidMap of state.invalidDomainMaps.values()) {
          errors.push(`Element map '${invalidMap.file}' is invalid — ${invalidMap.error}`);
        }
        if (state.domainMaps.size === 0 && state.invalidDomainMaps.size === 0) {
          errors.push('No element map file found');
        }
      } else {
        for (const dom of state.evidence.domains) {
          const invalidMap = state.invalidDomainMaps.get(dom.id);
          if (invalidMap) {
            errors.push(`Domain '${dom.id}' has invalid domain-map: ${invalidMap.file} — ${invalidMap.error}`);
            continue;
          }
          if (!state.domainMaps.has(dom.id)) errors.push(`Domain '${dom.id}' has no domain-map file`);
        }
      }

      // Validate spec_groups for coarse granularity
      if (state.scope?.granularity === 'coarse') {
        const capabilityIds = new Map<string, Set<string>>();
        for (const [, mapFile] of state.domainMaps) {
          if (isGenericMap(mapFile)) continue;
          const ids = new Set(mapFile.capabilities.map((c) => c.id));
          capabilityIds.set(mapFile.domain.id, ids);
        }

        for (const [, mapFile] of state.domainMaps) {
          if (isGenericMap(mapFile)) continue;
          const domainCaps = capabilityIds.get(mapFile.domain.id) ?? new Set();

          if (!mapFile.spec_groups || mapFile.spec_groups.length === 0) {
            errors.push(
              `Domain '${mapFile.domain.id}' uses coarse granularity but has no spec_groups`
            );
            continue;
          }

          const seenFolders = new Set<string>();
          for (const group of mapFile.spec_groups) {
            for (const capId of group.capabilities) {
              if (!domainCaps.has(capId)) {
                errors.push(
                  `Domain '${mapFile.domain.id}' spec_groups references capability '${capId}' not declared in domain-map capabilities`
                );
              }
            }

            if (seenFolders.has(group.folder)) {
              errors.push(
                `Domain '${mapFile.domain.id}' spec_groups has duplicate folder '${group.folder}'`
              );
            }
            seenFolders.add(group.folder);

            if (group.folder.includes('/') || group.folder.includes('\\')) {
              errors.push(
                `Domain '${mapFile.domain.id}' spec_groups folder '${group.folder}' is not a single path segment`
              );
            }
          }
        }
      }

      const derived = await deriveBootstrapArtifacts(projectRoot, state);
      errors.push(...derived.modelErrors, ...derived.specErrors);
      break;
    }
    case 'review_to_promote': {
      const scanGate = await validateGate(projectRoot, 'scan_to_map');
      const mapGate = await validateGate(projectRoot, 'map_to_review');
      errors.push(...scanGate.errors, ...mapGate.errors);
      for (const [mapId, mapFile] of state.domainMaps) {
        for (const gap of mapFile.review_gaps) {
          errors.push(`Unresolved review gap in '${mapId}': ${gap.evidence} — ${gap.reason}`);
        }
      }

      const derived = await deriveBootstrapArtifacts(projectRoot, state);
      if (!state.reviewExists) {
        errors.push('review.md not found');
      } else if (derived.reviewState !== 'current') {
        errors.push('Review approval is stale. Run `opsx bootstrap validate` to regenerate review.md and re-approve it.');
      }

      if (!derived.bundle || !derived.candidateModel || !derived.candidateFingerprint) {
        errors.push(...derived.modelErrors);
        errors.push('Candidate OPSX artifacts are unavailable. Run `opsx bootstrap validate` after scan/map are complete.');
        break;
      }

      const reviewContent = state.reviewExists
        ? await fs.readFile(bootstrapPath(projectRoot, 'review.md'), 'utf-8')
        : '';
      const { uncheckedItems } = collectReviewChecks(reviewContent);
      for (const item of uncheckedItems) {
        errors.push(`Unchecked review item: ${item}`);
      }

      errors.push(...derived.specErrors);
      errors.push(...await validateCandidateSpecsOnDisk(projectRoot, derived.candidateSpecs));
      errors.push(...await validateCandidateArchitectureOnDisk(projectRoot, derived.candidateSpecs));
      errors.push(...await validateFormalSpecTargets(projectRoot, state, derived.candidateSpecs));

      const bundle = derived.bundle;
      errors.push(...validateRelationGraph(bundle).errors);
      break;
    }
  }

  return { passed: errors.length === 0, errors };
}

// ─── Assemble & Promote ─────────────────────────────────────────────────────

function assembleBundle(projectRoot: string, state: BootstrapState): ProjectOpsxBundle {
  const domains: ProjectOpsxBundle['domains'] = [];
  const capabilities: ProjectOpsxBundle['capabilities'] = [];
  const relations: OpsxRelation[] = [];

  const sortedDomainMaps = [...state.domainMaps.entries()]
    .sort(([leftId], [rightId]) => leftId.localeCompare(rightId))
    .map(([, mapFile]) => mapFile);

  for (const mapFile of sortedDomainMaps) {
    if (isGenericMap(mapFile)) continue;
    domains.push({
      id: mapFile.domain.id,
      type: 'domain',
      intent: mapFile.domain.intent,
      status: mapFile.domain.status ?? 'active',
      boundary: mapFile.domain.boundary,
    });

    for (const cap of mapFile.capabilities) {
      capabilities.push({
        id: cap.id,
        type: 'capability',
        intent: cap.intent,
        status: cap.status ?? 'active',
      });
    }

    for (const rel of mapFile.relations) {
      relations.push({
        from: rel.from,
        type: rel.type,
        to: rel.to,
        ...(rel.note !== undefined ? { note: rel.note } : {}),
      });
    }

  }

  return {
    schema_version: OPSX_SCHEMA_VERSION,
    project: buildBootstrapProjectMetadata(projectRoot, state),
    domains: sortNodes(domains),
    capabilities: sortNodes(capabilities),
    relations: sortRelations(relations),
  };
}

function computeSourceFingerprint(projectRoot: string, state: BootstrapState): string | null {
  if (!state.evidence) {
    return null;
  }

  const normalizedDomainMaps = [...state.domainMaps.entries()]
    .sort(([leftId], [rightId]) => leftId.localeCompare(rightId))
    .map(([, mapFile]) => normalizeDomainMapForFingerprint(mapFile));

  return fingerprintValue({
    schema: getConfiguredSchemaName(projectRoot),
    evidence: normalizeEvidenceForFingerprint(state.evidence),
    domainMaps: normalizedDomainMaps,
  });
}

function computeCandidateFingerprint(
  projectRoot: string,
  bundle: ProjectOpsxBundle,
  candidateModel: CandidateArchitectureModel,
  state: BootstrapState,
  candidateSpecs: BootstrapCandidateSpec[],
  preservedFormalPaths: string[],
  refreshPlan: RefreshPlan | null,
  refreshDelta: RefreshDeltaSummary | null
): string {
  const projectConfig = readProjectConfig(projectRoot);
  return fingerprintValue({
    bundle,
    candidateModel,
    baseline: state.metadata.baseline_type,
    mode: state.metadata.mode,
    runtimeProjection: {
      candidateSpec: getRuntimeFingerprintInput(
        projectConfigForRuntime(projectConfig, { consumer: 'bootstrap-candidate-spec' })
      ),
      review: getRuntimeFingerprintInput(
        projectConfigForRuntime(projectConfig, { consumer: 'bootstrap-review' })
      ),
      starterReadme: getRuntimeFingerprintInput(
        projectConfigForRuntime(projectConfig, { consumer: 'bootstrap-starter-readme' })
      ),
    },
    refreshPlan,
    refreshDelta: refreshDelta ? {
      delta: refreshDelta.delta,
      counts: refreshDelta.result.counts,
      affectedDomainIds: refreshDelta.affectedDomainIds,
      affectedNodeIds: refreshDelta.affectedNodeIds,
      preservedNodeIds: refreshDelta.preservedNodeIds,
    } : null,
    candidateSpecs: candidateSpecs.map((spec) => ({
      elementId: spec.elementId,
      candidateRelativePath: spec.candidateRelativePath,
      formalRelativePath: spec.formalRelativePath,
      content: spec.content,
    })),
    preservedFormalPaths,
  });
}

function localizeBootstrapText(
  _projection: RuntimeProjection,
  text: { en: string; zh: string }
): string {
  return text.en;
}

async function writeBootstrapMetadata(projectRoot: string, metadata: BootstrapMetadata): Promise<void> {
  await writeYaml(bootstrapPath(projectRoot, BOOTSTRAP_METADATA_FILE), {
    phase: metadata.phase,
    baseline_type: metadata.baseline_type,
    mode: metadata.mode,
    created_at: metadata.created_at,
    completed_at: metadata.completed_at,
    source_fingerprint: metadata.source_fingerprint,
    candidate_fingerprint: metadata.candidate_fingerprint,
    review_fingerprint: metadata.review_fingerprint,
    refresh_anchor_commit: metadata.refresh_anchor_commit,
    candidate_spec_paths: metadata.candidate_spec_paths,
  });
}

async function writeCandidateFiles(
  projectRoot: string,
  state: BootstrapState,
  candidateModel: CandidateArchitectureModel,
  candidateSpecs: BootstrapCandidateSpec[]
): Promise<string[]> {
  const candidateDir = bootstrapPath(projectRoot, BOOTSTRAP_CANDIDATE_DIR);
  await FileSystemUtils.createDirectory(candidateDir);
  const nextSpecPaths = candidateSpecs.map((spec) => spec.candidateRelativePath).sort();
  const staleSpecPaths = state.metadata.candidate_spec_paths.filter((candidatePath) => !nextSpecPaths.includes(candidatePath));
  await Promise.all(staleSpecPaths.map(async (relativePath) => {
    await fs.rm(FileSystemUtils.joinPath(projectRoot, relativePath), { force: true }).catch(() => undefined);
  }));

  const architectureFiles = renderCandidateArchitecture(candidateModel);
  await Promise.all([
    ...[...architectureFiles.entries()].map(([relativePath, content]) =>
      FileSystemUtils.writeFile(candidatePath(projectRoot, relativePath), content)
    ),
    ...candidateSpecs.map((spec) => FileSystemUtils.writeFile(candidateSpecPath(projectRoot, spec.folder), spec.content)),
  ]);

  await Promise.all([
    fs.rm(bootstrapPath(projectRoot, BOOTSTRAP_CANDIDATE_DIR, 'project.opsx.yaml'), { force: true }),
    fs.rm(bootstrapPath(projectRoot, BOOTSTRAP_CANDIDATE_DIR, 'project.opsx.relations.yaml'), { force: true }),
  ]);

  return nextSpecPaths;
}

function buildReviewContent(
  state: BootstrapState,
  derived: DerivedBootstrapArtifacts,
  projection: RuntimeProjection
): string {
  if (!state.evidence) {
    throw new Error('No evidence.yaml found. Run scan phase first.');
  }

  const lines: string[] = ['# Bootstrap Review', ''];
  lines.push(
    localizeBootstrapText(projection, {
      en: 'Review the mapped architecture before promoting to formal OPSX files.',
      zh: 'Review the mapped architecture before promoting to formal OPSX files.',
    }),
    ''
  );
  lines.push(
    localizeBootstrapText(projection, {
      en: 'This file is derived from evidence.yaml and domain-map/*.yaml. If either changes, regenerate review via `opsx bootstrap validate`.',
      zh: 'This file is derived from evidence.yaml and domain-map/*.yaml. If either changes, regenerate review via `opsx bootstrap validate`.',
    }),
    ''
  );

  if (state.metadata.mode === 'refresh' && derived.refreshPlan && derived.refreshDelta) {
    lines.push('## Refresh Scope', '');
    lines.push(`- ${localizeBootstrapText(projection, {
      en: `Strategy: ${derived.refreshPlan.strategy}`,
      zh: `Strategy: ${derived.refreshPlan.strategy}`,
    })}`);
    lines.push(`- ${localizeBootstrapText(projection, {
      en: `Reason: ${derived.refreshPlan.reason}`,
      zh: `Reason: ${derived.refreshPlan.reason}`,
    })}`);
    lines.push(`- ${localizeBootstrapText(projection, {
      en: `Impacted domains: ${derived.refreshDelta.affectedDomainIds.join(', ') || '(none)'}`,
      zh: `Impacted domains: ${derived.refreshDelta.affectedDomainIds.join(', ') || '(none)'}`,
    })}`);
    lines.push(`- ${localizeBootstrapText(projection, {
      en: `Preserved baseline nodes: ${derived.refreshDelta.preservedNodeIds.length}`,
      zh: `Preserved baseline nodes: ${derived.refreshDelta.preservedNodeIds.length}`,
    })}`);
    lines.push('', '## Delta Summary', '');

    const addedNodeCount = derived.refreshDelta.result.counts.added.domains + derived.refreshDelta.result.counts.added.capabilities;
    const modifiedNodeCount = derived.refreshDelta.result.counts.modified.domains + derived.refreshDelta.result.counts.modified.capabilities;
    const removedNodeCount = derived.refreshDelta.result.counts.removed.domains + derived.refreshDelta.result.counts.removed.capabilities;
    lines.push(`- ${localizeBootstrapText(projection, {
      en: `ADDED: ${addedNodeCount} nodes, ${derived.refreshDelta.result.counts.added.relations} relations`,
      zh: `ADDED: ${addedNodeCount} nodes, ${derived.refreshDelta.result.counts.added.relations} relations`,
    })}`);
    lines.push(`- ${localizeBootstrapText(projection, {
      en: `MODIFIED: ${modifiedNodeCount} nodes, ${derived.refreshDelta.result.counts.modified.relations} relations`,
      zh: `MODIFIED: ${modifiedNodeCount} nodes, ${derived.refreshDelta.result.counts.modified.relations} relations`,
    })}`);
    lines.push(`- ${localizeBootstrapText(projection, {
      en: `REMOVED: ${removedNodeCount} nodes, ${derived.refreshDelta.result.counts.removed.relations} relations`,
      zh: `REMOVED: ${removedNodeCount} nodes, ${derived.refreshDelta.result.counts.removed.relations} relations`,
    })}`);
    if (derived.refreshDelta.preservedNodeIds.length > 0) {
      lines.push(`- ${localizeBootstrapText(projection, {
        en: `Preserved baseline nodes: ${derived.refreshDelta.preservedNodeIds.join(', ')}`,
        zh: `Preserved baseline nodes: ${derived.refreshDelta.preservedNodeIds.join(', ')}`,
      })}`);
    }
    lines.push('');
  }

  const reviewGaps = [...state.domainMaps.entries()]
    .flatMap(([mapId, mapFile]) => mapFile.review_gaps.map((gap) => ({ mapId, ...gap })))
    .sort((left, right) => {
      const mapComparison = left.mapId.localeCompare(right.mapId);
      if (mapComparison !== 0) return mapComparison;
      const evidenceComparison = left.evidence.localeCompare(right.evidence);
      return evidenceComparison !== 0 ? evidenceComparison : left.reason.localeCompare(right.reason);
    });
  if (reviewGaps.length > 0) {
    lines.push('## Review Gaps', '');
    for (const gap of reviewGaps) {
      lines.push(`- [ ] ${gap.mapId}: ${gap.evidence} — ${gap.reason}`);
    }
    lines.push('');
  }

  lines.push(isGenericEvidence(state.evidence) ? '## Element Checklist' : '## Domain Checklist', '');
  if (isGenericEvidence(state.evidence)) {
    const mappedIds = new Set([...state.domainMaps.values()].flatMap(mapElements).map(element => element.elementId));
    for (const element of [...state.evidence.elements].sort(compareEvidenceElements)) {
      const status = mappedIds.has(element.elementId) ? 'mapped' : 'unmapped';
      lines.push(`- [ ] ${element.elementId} — ${status}, kind: ${element.kind}, contractPolicy: ${element.contractPolicy}, confidence: ${element.confidence}`);
    }
  } else {
    const orderedDomains = [...state.evidence.domains]
      .filter((domain) => state.metadata.mode !== 'refresh' || !derived.refreshDelta || derived.refreshDelta.affectedDomainIds.length === 0 || derived.refreshDelta.affectedDomainIds.includes(domain.id))
      .sort(compareEvidenceDomains);
    for (const dom of orderedDomains) {
      const mapFile = state.domainMaps.get(dom.id);
      const capCount = mapFile && !isGenericMap(mapFile) ? mapFile.capabilities.length : 0;
      const status = mapFile
        ? localizeBootstrapText(projection, { en: `${capCount} capabilities`, zh: `${capCount} capabilities` })
        : localizeBootstrapText(projection, { en: 'unmapped', zh: 'unmapped' });
      lines.push(`- [ ] ${dom.id} — ${status}, confidence: ${dom.confidence}`);
    }
  }

  lines.push('', '## Candidate Specs', '');
  if (state.metadata.mode === 'opsx-first') {
    lines.push(`- ${localizeBootstrapText(projection, {
      en: 'Mode contract: Project Contract plus starter at .opsx/specs/README.md',
      zh: 'Mode contract: Project Contract plus starter at .opsx/specs/README.md',
    })}`);
    lines.push(`- ${localizeBootstrapText(projection, {
      en: 'No capability-level candidate Specs should be generated',
      zh: 'No capability-level candidate Specs should be generated',
    })}`);
  } else if (derived.candidateSpecs.length === 0) {
    lines.push(`- ${localizeBootstrapText(projection, {
      en: 'No candidate specs will be written',
      zh: 'No candidate specs will be written',
    })}`);
    if (state.metadata.mode === 'refresh') {
      lines.push(`- ${localizeBootstrapText(projection, {
        en: 'Existing formal specs remain the source of truth unless a new capability requires a missing spec file.',
        zh: 'Existing formal specs remain the source of truth unless a new capability requires a missing spec file.',
      })}`);
    }
  } else {
    for (const spec of derived.candidateSpecs) {
      lines.push(`- ${spec.elementId} -> ${spec.formalRelativePath}`);
    }
  }

  for (const preservedPath of derived.preservedFormalPaths) {
    lines.push(`- ${localizeBootstrapText(projection, {
      en: `preserved existing spec: ${preservedPath}`,
      zh: `preserved existing spec: ${preservedPath}`,
    })}`);
  }

  lines.push('', '## Validation', '');
  lines.push(`- [ ] ${localizeBootstrapText(projection, {
    en: 'Review matches current candidate output',
    zh: 'Review matches current candidate output',
  })}`);
  lines.push(`- [ ] ${localizeBootstrapText(projection, {
    en: 'Referential integrity passes',
    zh: 'Referential integrity passes',
  })}`);
  lines.push(`- [ ] ${localizeBootstrapText(projection, {
    en: 'Relation semantic validation passes',
    zh: 'Relation semantic validation passes',
  })}`);
  lines.push(`- [ ] ${localizeBootstrapText(projection, {
    en: 'No unresolved review gaps remain',
    zh: 'No unresolved review gaps remain',
  })}`);
  lines.push(`- [ ] ${localizeBootstrapText(projection, {
    en: 'Candidate spec set matches the bootstrap mode contract',
    zh: 'Candidate spec set matches the bootstrap mode contract',
  })}`);
  if (state.metadata.mode === 'refresh') {
    lines.push(`- [ ] ${localizeBootstrapText(projection, {
      en: 'Fresh candidate diff matches the current formal OPSX baseline',
      zh: 'Fresh candidate diff matches the current formal OPSX baseline',
    })}`);
  }
  lines.push(`- [ ] ${localizeBootstrapText(projection, {
    en: 'Candidate specs pass OPSX validation',
    zh: 'Candidate specs pass OPSX validation',
  })}`);
  lines.push(`- [ ] ${localizeBootstrapText(projection, {
    en: isGenericEvidence(state.evidence)
      ? 'Element kinds, contract policies, and refinement parentage match the reviewed model'
      : 'Domain boundaries match mental model',
    zh: isGenericEvidence(state.evidence)
      ? 'Element kinds, contract policies, and refinement parentage match the reviewed model'
      : 'Domain boundaries match mental model',
  })}`);
  lines.push('');

  return lines.join('\n');
}

async function deriveBootstrapArtifacts(projectRoot: string, state: BootstrapState): Promise<DerivedBootstrapArtifacts> {
  const reviewContent = state.reviewExists
    ? await fs.readFile(bootstrapPath(projectRoot, BOOTSTRAP_REVIEW_FILE), 'utf-8').catch(() => '')
    : '';
  const { checkedDomains, uncheckedItems } = collectReviewChecks(reviewContent);

  const sourceFingerprint = computeSourceFingerprint(projectRoot, state);
  let bundle: ProjectOpsxBundle | null = null;
  let candidateModel: CandidateArchitectureModel | null = null;
  let modelErrors: string[] = [];
  let refreshPlan: RefreshPlan | null = null;
  let refreshDelta: RefreshDeltaSummary | null = null;
  const preSpecErrors: string[] = [];

  if (sourceFingerprint) {
    const candidateArchitecture = assembleCandidateArchitectureModel(projectRoot, state);
    candidateModel = candidateArchitecture.model;
    modelErrors = candidateArchitecture.errors;
    if (state.metadata.mode === 'refresh') {
      const formalBundle = await readProjectOpsx(projectRoot);
      if (!formalBundle) {
        preSpecErrors.push('Refresh requires existing formal OPSX files.');
      } else {
        refreshPlan = deriveRefreshPlan(state);
        const partialBundle = assembleBundle(projectRoot, state);
        refreshDelta = assembleRefreshDelta(formalBundle, partialBundle, refreshPlan);
        bundle = refreshDelta.mergedBundle;
      }
    } else {
      bundle = assembleBundle(projectRoot, state);
    }
  }

  const addedCapabilityIds = new Set(refreshDelta?.delta.ADDED?.capabilities?.map((capability) => capability.id) ?? []);
  const candidateSpecAssembly = await assembleCandidateSpecs(projectRoot, state, bundle, { addedCapabilityIds });
  const specErrors = [
    ...preSpecErrors,
    ...candidateSpecAssembly.sourceErrors,
    ...candidateSpecAssembly.validationErrors,
  ];
  const candidateFingerprint = bundle && candidateModel && modelErrors.length === 0 && specErrors.length === 0
    ? computeCandidateFingerprint(
        projectRoot,
        bundle,
        candidateModel,
        state,
        candidateSpecAssembly.specs,
        candidateSpecAssembly.preservedFormalPaths,
        refreshPlan,
        refreshDelta
      )
    : null;
  const candidateExists = candidateFingerprint
    ? await candidateFilesExist(projectRoot, candidateSpecAssembly.specs)
    : false;

  let candidateState: 'missing' | 'current' | 'stale' = 'missing';
  if (candidateFingerprint) {
    if (!candidateExists) {
      candidateState = state.metadata.candidate_fingerprint ? 'stale' : 'missing';
    } else {
      candidateState = state.metadata.source_fingerprint === sourceFingerprint
        && state.metadata.candidate_fingerprint === candidateFingerprint
        ? 'current'
        : 'stale';
    }
  }

  let reviewState: 'missing' | 'current' | 'stale' = 'missing';
  if (candidateFingerprint) {
    if (!candidateExists) {
      reviewState = state.metadata.review_fingerprint || state.metadata.candidate_fingerprint ? 'stale' : 'missing';
    } else if (!state.reviewExists) {
      reviewState = state.metadata.review_fingerprint ? 'stale' : 'missing';
    } else {
      reviewState = state.metadata.source_fingerprint === sourceFingerprint
        && state.metadata.review_fingerprint === candidateFingerprint
        ? 'current'
        : 'stale';
    }
  }

  if (state.invalidDomainMaps.size > 0) {
    if (candidateState === 'current') {
      candidateState = 'stale';
    }
    if (reviewState === 'current') {
      reviewState = 'stale';
    }
  }

  return {
    bundle,
    candidateModel,
    modelErrors,
    candidateSpecs: candidateSpecAssembly.specs,
    preservedFormalPaths: candidateSpecAssembly.preservedFormalPaths,
    specErrors,
    sourceFingerprint,
    candidateFingerprint,
    candidateState,
    reviewState,
    reviewApproved: reviewState === 'current' && uncheckedItems.length === 0,
    checkedDomains,
    refreshPlan,
    refreshDelta,
  };
}

export async function assembleCandidate(projectRoot: string): Promise<ProjectOpsxBundle> {
  const state = await readBootstrapState(projectRoot);
  const derived = await deriveBootstrapArtifacts(projectRoot, state);
  if (!derived.bundle || !derived.candidateModel || !derived.sourceFingerprint || !derived.candidateFingerprint) {
    throw new Error('No evidence.yaml found. Run scan phase first.');
  }

  const candidateSpecPaths = await writeCandidateFiles(projectRoot, state, derived.candidateModel, derived.candidateSpecs);
  await writeBootstrapMetadata(projectRoot, {
    ...state.metadata,
    source_fingerprint: derived.sourceFingerprint,
    candidate_fingerprint: derived.candidateFingerprint,
    candidate_spec_paths: candidateSpecPaths,
  });

  return derived.bundle;
}

export async function generateReview(projectRoot: string): Promise<string> {
  const state = await readBootstrapState(projectRoot);
  const derived = await deriveBootstrapArtifacts(projectRoot, state);
  if (!derived.candidateFingerprint) {
    throw new Error('No evidence.yaml found. Run scan phase first.');
  }

  const content = buildReviewContent(
    state,
    derived,
    projectConfigForRuntime(readProjectConfig(projectRoot), { consumer: 'bootstrap-review' })
  );
  await fs.writeFile(bootstrapPath(projectRoot, BOOTSTRAP_REVIEW_FILE), content, 'utf-8');
  await writeBootstrapMetadata(projectRoot, {
    ...state.metadata,
    source_fingerprint: derived.sourceFingerprint,
    candidate_fingerprint: derived.candidateFingerprint,
    review_fingerprint: derived.candidateFingerprint,
    candidate_spec_paths: state.metadata.candidate_spec_paths,
  });

  return content;
}

export async function refreshBootstrapDerivedArtifacts(
  projectRoot: string
): Promise<{ candidateUpdated: boolean; reviewUpdated: boolean }> {
  const state = await readBootstrapState(projectRoot);
  const derived = await deriveBootstrapArtifacts(projectRoot, state);
  if (!derived.bundle || !derived.candidateModel || !derived.sourceFingerprint || !derived.candidateFingerprint) {
    return { candidateUpdated: false, reviewUpdated: false };
  }

  const candidateUpdated = derived.candidateState !== 'current';
  const reviewUpdated = derived.reviewState !== 'current';

  if (candidateUpdated) {
    state.metadata.candidate_spec_paths = await writeCandidateFiles(projectRoot, state, derived.candidateModel, derived.candidateSpecs);
  }

  if (reviewUpdated) {
    await fs.writeFile(
      bootstrapPath(projectRoot, BOOTSTRAP_REVIEW_FILE),
      buildReviewContent(
        state,
        derived,
        projectConfigForRuntime(readProjectConfig(projectRoot), { consumer: 'bootstrap-review' })
      ),
      'utf-8'
    );
  }

  if (candidateUpdated || reviewUpdated) {
    await writeBootstrapMetadata(projectRoot, {
      ...state.metadata,
      source_fingerprint: derived.sourceFingerprint,
      candidate_fingerprint: derived.candidateFingerprint,
      review_fingerprint: reviewUpdated ? derived.candidateFingerprint : state.metadata.review_fingerprint,
      candidate_spec_paths: state.metadata.candidate_spec_paths,
    });
  }

  return { candidateUpdated, reviewUpdated };
}

async function writeBootstrapSpecStarter(projectRoot: string, state: BootstrapState): Promise<void> {
  if (state.metadata.mode !== 'opsx-first') {
    return;
  }

  if (state.metadata.baseline_type !== 'raw') {
    return;
  }

  const specsReadmePath = FileSystemUtils.joinPath(projectRoot, OPSX_DIR_NAME, 'specs/README.md');
  if (await FileSystemUtils.fileExists(specsReadmePath)) {
    return;
  }

  const projection = projectConfigForRuntime(readProjectConfig(projectRoot), {
    consumer: 'bootstrap-starter-readme',
  });
  const content = `# Specs Starter

${localizeBootstrapText(projection, {
  en: 'This repository was bootstrapped in `opsx-first` mode.',
  zh: 'This repository was bootstrapped in `opsx-first` mode.',
})}

- ${localizeBootstrapText(projection, {
  en: 'Formal v1 Semantic Model files were generated from the bootstrap workflow.',
  zh: 'Formal v1 Semantic Model files were generated from the bootstrap workflow.',
})}
- ${localizeBootstrapText(projection, {
  en: 'Add behavior specs incrementally with normal OPSX changes.',
  zh: 'Add behavior specs incrementally with normal OPSX changes.',
})}
- ${localizeBootstrapText(projection, {
  en: 'Create focused specs under `.opsx/specs/<capability>/spec.md` as features evolve.',
  zh: 'Create focused specs under `.opsx/specs/<capability>/spec.md` as features evolve.',
})}
`;

  await FileSystemUtils.writeFile(specsReadmePath, content);
}

export async function promoteBootstrap(projectRoot: string): Promise<PromoteBootstrapResult> {
  await refreshBootstrapDerivedArtifacts(projectRoot);

  const gate = await validateGate(projectRoot, 'review_to_promote');
  if (!gate.passed) {
    throw new Error(`Cannot promote: gate validation failed.\n${gate.errors.join('\n')}`);
  }

  const state = await readBootstrapState(projectRoot);
  const derived = await deriveBootstrapArtifacts(projectRoot, state);
  if (!derived.bundle || !derived.candidateFingerprint) {
    throw new Error('Cannot promote: candidate artifacts are unavailable. Run `opsx bootstrap validate` first.');
  }

  const targetErrors = await validateFormalSpecTargets(projectRoot, state, derived.candidateSpecs);
  if (targetErrors.length > 0) {
    throw new Error(`Cannot promote: gate validation failed.\n${targetErrors.join('\n')}`);
  }

  const writes = [
    ...BOOTSTRAP_ARCHITECTURE_FILES.map(file => ({
      source: candidatePath(projectRoot, file),
      target: FileSystemUtils.joinPath(projectRoot, OPSX_DIR_NAME, 'architecture', file),
    })),
    ...derived.candidateSpecs.map(spec => ({
      source: candidateSpecPath(projectRoot, spec.folder),
      target: formalSpecPath(projectRoot, spec.folder),
    })),
  ];
  const originals = new Map<string, Buffer | null>();
  try {
    for (const write of writes) {
      let original: Buffer | null = null;
      try {
        original = await fs.readFile(write.target);
      } catch (error: any) {
        if (error?.code !== 'ENOENT') throw error;
      }
      originals.set(write.target, original);
      await copyFile(write.source, write.target);
    }
    await writeBootstrapSpecStarter(projectRoot, state);
  } catch (error) {
    for (const [target, original] of [...originals.entries()].reverse()) {
      if (original === null) {
        await fs.rm(target, { force: true }).catch(() => undefined);
      } else {
        await FileSystemUtils.createDirectory(path.dirname(target)).catch(() => undefined);
        await fs.writeFile(target, original).catch(() => undefined);
      }
    }
    throw error;
  }

  const completedAt = new Date().toISOString();
  await writeBootstrapMetadata(projectRoot, {
    ...state.metadata,
    completed_at: completedAt,
    completed_marker_present: true,
    refresh_anchor_commit: state.metadata.mode === 'refresh'
      ? await resolveCurrentGitHead(projectRoot)
      : state.metadata.refresh_anchor_commit,
  });

  const backfill = await backfillSpecs(projectRoot);

  return {
    retainedWorkspaceNotice: BOOTSTRAP_WORKSPACE_RETAINED_NOTICE,
    backfill,
  };
}

// ─── YAML Helpers ────────────────────────────────────────────────────────────

async function writeYaml(filePath: string, data: unknown): Promise<void> {
  const dir = path.dirname(filePath);
  await FileSystemUtils.createDirectory(dir);
  await fs.writeFile(filePath, stringifyYaml(data, { lineWidth: 0 }), 'utf-8');
}

async function readYaml(filePath: string): Promise<unknown> {
  const content = await fs.readFile(filePath, 'utf-8');
  return parseYaml(content);
}
