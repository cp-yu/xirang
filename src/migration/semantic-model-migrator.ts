import { promises as fs } from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { OPSX_DIR_NAME } from '../core/config.js';
import { parseSpecFrontmatter } from '../core/parsers/spec-frontmatter.js';
import { buildSpecRegistry } from '../core/spec-registry.js';
import { validateSpecBindings, Validator } from '../core/validation/validator.js';
import { readLikeC4Architecture, type LikeC4Architecture } from '../utils/likec4-reader.js';
import { validateArchitecture } from '../utils/architecture-validator.js';
import { parseOpsxProfile, type ArchitectureCapability, type ArchitectureDomain } from '../utils/likec4-parser.js';
import type { ContractPolicy } from '../utils/semantic-model.js';

export interface SemanticMigrationGap {
  code: string;
  message: string;
  source?: string;
  resolution: 'human-review';
}

export interface SemanticMigrationMapping {
  type: 'domain' | 'capability' | 'spec';
  legacyId: string;
  elementId: string;
  source?: string;
  specId?: string;
}

export interface SemanticMigrationContractPolicy {
  kind: 'project' | 'domain' | 'capability';
  contractPolicy: ContractPolicy;
  basis: 'generated-project-contract' | 'legacy-structural-containment' | 'legacy-capability-contract';
}

export interface SemanticMigrationReport {
  sourceVersion: 'legacy';
  targetVersion: '1';
  resolvedMappings: SemanticMigrationMapping[];
  contractPolicies: SemanticMigrationContractPolicy[];
  gaps: SemanticMigrationGap[];
  files: string[];
  sourceRefs: string[];
  validation: { success: boolean; errors: string[] };
}

export interface SemanticModelMigrationOptions {
  candidatePath?: string;
  promote?: boolean;
  yes?: boolean;
}

export interface SemanticModelMigrationResult {
  candidatePath: string;
  report: SemanticMigrationReport;
  promoted: boolean;
}

interface LegacyMapping {
  domains: Map<string, string>;
  capabilities: Map<string, string>;
  capabilitiesByFqn: Map<string, string>;
  duplicateCapabilityIds: Set<string>;
}

const OMITTED_RELATIONS = new Set(['belongs_to', 'refines', 'abstracts']);
const LEGACY_CONTRACT_POLICIES: readonly SemanticMigrationContractPolicy[] = [
  { kind: 'project', contractPolicy: 'required', basis: 'generated-project-contract' },
  { kind: 'domain', contractPolicy: 'optional', basis: 'legacy-structural-containment' },
  { kind: 'capability', contractPolicy: 'required', basis: 'legacy-capability-contract' },
];
const CONTRACT_POLICY_BY_KIND = new Map(LEGACY_CONTRACT_POLICIES.map(policy => [policy.kind, policy.contractPolicy]));

function relativeRef(projectRoot: string, file: string): string {
  return path.relative(projectRoot, file).split(path.sep).join('/');
}

function quote(value: string): string {
  return `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'").replaceAll('\n', '\\n')}'`;
}

function safeName(value: string): string {
  const name = value.replaceAll(/[^A-Za-z0-9_-]/g, '-');
  return name || 'element';
}

function elementIdForDomain(domain: ArchitectureDomain): string {
  return `project.root/domain.${domain.id}`;
}

function elementIdForCapability(capability: ArchitectureCapability): string {
  return `project.root/domain.${capability.domain ?? 'unowned'}/${capability.capabilityId ?? `cap.${capability.id}`}`;
}

function sourceElementId(mapping: LegacyMapping, reference: string): string | undefined {
  return mapping.capabilities.get(reference) ?? mapping.capabilitiesByFqn.get(reference) ?? mapping.domains.get(reference);
}

function parseLegacyOwners(content: string): string[] | null {
  const normalized = content.replace(/\r\n?/g, '\n');
  if (!normalized.startsWith('---\n')) return null;
  const end = normalized.indexOf('\n---', 4);
  if (end < 0) return null;
  const data = parseYaml(normalized.slice(4, end));
  if (!data || typeof data !== 'object' || Array.isArray(data)) return [];
  const value = (data as Record<string, unknown>).capabilities;
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function replaceWithElement(content: string, elementId: string): string {
  const normalized = content.replace(/\r\n?/g, '\n');
  if (!normalized.startsWith('---\n')) return `---\nelement: ${elementId}\n---\n\n${normalized}`;
  const end = normalized.indexOf('\n---', 4);
  if (end < 0) return `---\nelement: ${elementId}\n---\n\n${normalized}`;
  return `---\nelement: ${elementId}\n---${normalized.slice(end + 4)}`;
}

function makeGap(code: string, message: string, source?: string): SemanticMigrationGap {
  return { code, message, ...(source ? { source } : {}), resolution: 'human-review' };
}

async function collectContractPolicyGaps(
  projectRoot: string,
  architecture: LikeC4Architecture,
  gaps: SemanticMigrationGap[],
): Promise<void> {
  const declarations = new Map<string, { policy: ContractPolicy | null; source: string }>();
  for (const file of architecture.files) {
    const profile = parseOpsxProfile(await fs.readFile(file, 'utf8'));
    for (const [kind, policy] of Object.entries(profile.declaredElementContractPolicies)) {
      const source = relativeRef(projectRoot, file);
      const previous = declarations.get(kind);
      if (previous && previous.policy !== policy) {
        gaps.push(makeGap('CONFLICTING_CONTRACT_POLICY', `Element kind ${kind} has conflicting legacy contract policies`, source));
        continue;
      }
      declarations.set(kind, { policy, source });
    }
  }

  for (const [kind, declaration] of [...declarations].sort(([left], [right]) => left.localeCompare(right))) {
    const mappedPolicy = CONTRACT_POLICY_BY_KIND.get(kind as SemanticMigrationContractPolicy['kind']);
    if (!mappedPolicy || declaration.policy === null) {
      gaps.push(makeGap(
        'UNKNOWN_CONTRACT_POLICY',
        `Element kind ${kind} has no deterministic v1 contract policy mapping`,
        declaration.source,
      ));
      continue;
    }
    if (declaration.policy !== mappedPolicy) {
      gaps.push(makeGap(
        'CONFLICTING_CONTRACT_POLICY',
        `Element kind ${kind} declares ${declaration.policy}, but legacy migration maps it to ${mappedPolicy}`,
        declaration.source,
      ));
    }
  }
}

function createMappings(architecture: LikeC4Architecture, gaps: SemanticMigrationGap[]): { mappings: SemanticMigrationMapping[]; legacy: LegacyMapping } {
  const mappings: SemanticMigrationMapping[] = [];
  const domains = new Map<string, string>();
  const capabilities = new Map<string, string>();
  const capabilitiesByFqn = new Map<string, string>();
  const duplicateCapabilityIds = new Set(
    architecture.capabilities
      .map(capability => capability.capabilityId)
      .filter((id): id is string => !!id && id.startsWith('cap.'))
      .filter((id, index, ids) => ids.indexOf(id) !== index)
  );

  for (const domain of [...architecture.domains].sort((a, b) => a.id.localeCompare(b.id))) {
    const elementId = elementIdForDomain(domain);
    domains.set(domain.id, elementId);
    mappings.push({ type: 'domain', legacyId: domain.id, elementId });
  }

  for (const capability of [...architecture.capabilities].sort((a, b) => a.id.localeCompare(b.id))) {
    const legacyId = capability.capabilityId;
    if (!legacyId || !legacyId.startsWith('cap.')) {
      gaps.push(makeGap('MISSING_CAPABILITY_ID', `Capability ${capability.id} has no canonical cap.* identity`, capability.id));
      continue;
    }
    if (duplicateCapabilityIds.has(legacyId)) {
      gaps.push(makeGap('DUPLICATE_CAPABILITY_ID', `Capability identity ${legacyId} is not unique`, capability.id));
      continue;
    }
    if (!capability.domain) {
      gaps.push(makeGap('ORPHAN_CAPABILITY', `Capability ${legacyId} has no unique domain owner`, capability.id));
      continue;
    }
    const elementId = elementIdForCapability(capability);
    capabilities.set(legacyId, elementId);
    capabilitiesByFqn.set(capability.id, elementId);
    mappings.push({ type: 'capability', legacyId, elementId, source: capability.id });
  }

  return { mappings, legacy: { domains, capabilities, capabilitiesByFqn, duplicateCapabilityIds } };
}

function collectSpecOwners(
  architecture: LikeC4Architecture,
  projectRoot: string,
  legacy: LegacyMapping,
  gaps: SemanticMigrationGap[],
): Map<string, string[]> {
  const owners = new Map<string, string[]>();
  const add = (specId: string, capabilityId: string, source: string) => {
    if (legacy.duplicateCapabilityIds.has(capabilityId)) {
      gaps.push(makeGap('DUPLICATE_CAPABILITY_MAPPING', `Spec references non-unique capability ${capabilityId}`, source));
      return;
    }
    const elementId = legacy.capabilities.get(capabilityId);
    if (!elementId) {
      gaps.push(makeGap('UNKNOWN_CAPABILITY', `Spec references unknown capability ${capabilityId}`, source));
      return;
    }
    const values = owners.get(specId) ?? [];
    if (!values.includes(elementId)) values.push(elementId);
    owners.set(specId, values);
  };

  for (const capability of architecture.capabilities) {
    const capabilityId = capability.capabilityId;
    if (!capabilityId) continue;
    for (const reference of capability.specs) {
      const normalized = reference.replaceAll('\\', '/');
      const match = normalized.match(/(?:^|\/)specs\/([^/]+)\/spec\.md$/);
      if (match) add(match[1], capabilityId, relativeRef(projectRoot, path.resolve(projectRoot, reference)));
    }
  }
  return owners;
}

async function readFormalSpecs(projectRoot: string, architecture: LikeC4Architecture, legacy: LegacyMapping, gaps: SemanticMigrationGap[]): Promise<{
  files: Map<string, { source: string; content: string; elementId?: string }>;
  mappings: SemanticMigrationMapping[];
}> {
  const specsDirectory = path.resolve(projectRoot, OPSX_DIR_NAME, 'specs');
  const metadataOwners = collectSpecOwners(architecture, projectRoot, legacy, gaps);
  const files = new Map<string, { source: string; content: string; elementId?: string }>();
  const mappings: SemanticMigrationMapping[] = [];
  let entries;
  try {
    entries = await fs.readdir(specsDirectory, { withFileTypes: true });
  } catch {
    return { files, mappings };
  }

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory()) continue;
    const specId = entry.name;
    const source = path.join(specsDirectory, specId, 'spec.md');
    let content: string;
    try {
      content = await fs.readFile(source, 'utf8');
    } catch {
      continue;
    }
    const frontmatter = parseSpecFrontmatter(content);
    const owners = new Set<string>();
    const declared = parseLegacyOwners(content);
    if (declared === null) {
      const metadata = metadataOwners.get(specId) ?? [];
      if (metadata.length === 1) owners.add(metadata[0]);
    } else {
      for (const capabilityId of declared) {
        if (legacy.duplicateCapabilityIds.has(capabilityId)) {
          gaps.push(makeGap('DUPLICATE_CAPABILITY_MAPPING', `Spec ${specId} references non-unique capability ${capabilityId}`, relativeRef(projectRoot, source)));
          continue;
        }
        const elementId = legacy.capabilities.get(capabilityId);
        if (elementId) owners.add(elementId);
        else gaps.push(makeGap('UNKNOWN_CAPABILITY', `Spec ${specId} references unknown capability ${capabilityId}`, relativeRef(projectRoot, source)));
      }
      if (declared.length > 1) gaps.push(makeGap('MULTIPLE_SPEC_OWNERS', `Spec ${specId} declares multiple capability owners`, relativeRef(projectRoot, source)));
    }

    const metadata = metadataOwners.get(specId) ?? [];
    for (const elementId of metadata) owners.add(elementId);
    if (owners.size > 1) {
      gaps.push(makeGap('AMBIGUOUS_SPEC_OWNER', `Spec ${specId} has multiple candidate owners`, relativeRef(projectRoot, source)));
      files.set(specId, { source, content });
      continue;
    }
    if (owners.size === 0 || (declared !== null && declared.some(capabilityId => !legacy.capabilities.has(capabilityId)))) {
      gaps.push(makeGap('ORPHAN_SPEC', `Spec ${specId} has no uniquely determined legacy owner`, relativeRef(projectRoot, source)));
      files.set(specId, { source, content });
      continue;
    }
    const elementId = [...owners][0];
    if (frontmatter.issues?.some(issue => issue.code === 'MALFORMED_FRONTMATTER')) {
      gaps.push(makeGap('MALFORMED_SPEC_FRONTMATTER', `Spec ${specId} has malformed frontmatter`, relativeRef(projectRoot, source)));
      files.set(specId, { source, content });
      continue;
    }
    files.set(specId, { source, content, elementId });
    mappings.push({ type: 'spec', specId, legacyId: specId, elementId, source: relativeRef(projectRoot, source) });
  }
  return { files, mappings };
}

function renderSpecification(): string {
  return `opsx {\n  languageVersion '1'\n}\n\nspecification {\n  element project {\n    opsx { root true contract required }\n  }\n  element domain { opsx { contract optional parents [project] } }\n  element capability { opsx { contract required parents [domain] } }\n  relationship invokes\n  relationship consumes\n  relationship precedes\n  relationship constrains\n  relationship validates\n  relationship produces\n}\n`;
}

function renderProjectContract(projectName: string): string {
  return `---\nelement: project.root\n---\n\n# Spec: Project Contract\n\n## Purpose\nPreserve the reviewed intent of ${projectName}.\n\n## Requirements\n\n### Requirement: Migrated project intent\nThe project SHALL preserve the reviewed legacy semantic model intent.\n\n#### Scenario: Candidate is promoted\n- **WHEN** the migration candidate passes complete validation and receives human authorization\n- **THEN** the promoted project model reflects the reviewed candidate\n`;
}

function renderModel(projectName: string, architecture: LikeC4Architecture, legacy: LegacyMapping): string {
  const domains = architecture.domains.slice().sort((a, b) => a.id.localeCompare(b.id)).map(domain => {
    const capabilities = architecture.capabilities.filter(capability => capability.domain === domain.id).sort((a, b) => a.id.localeCompare(b.id)).flatMap(capability => {
      const elementId = legacy.capabilitiesByFqn.get(capability.id);
      if (!elementId) return [];
      return [`    ${safeName(capability.id.split('.').pop() ?? capability.id)} = capability ${quote(capability.title)} ${quote(capability.description ?? capability.title)} {\n      metadata {\n        elementId ${quote(elementId)}\n      }\n    }`];
    }).join('\n');
    return `    ${safeName(domain.id)} = domain ${quote(domain.title)} ${quote(domain.description ?? domain.title)} {\n      metadata {\n        elementId ${quote(elementIdForDomain(domain))}\n      }${capabilities ? `\n${capabilities}` : ''}\n    }`;
  }).join('\n');
  return `model {\n  projectRoot = project ${quote(projectName)} ${quote(projectName)} {\n    metadata {\n      elementId 'project.root'\n    }${domains ? `\n${domains}` : ''}\n  }\n}\n`;
}

function candidateFqn(architecture: LikeC4Architecture, reference: string): string {
  const capability = architecture.capabilities.find(item => item.id === reference || item.capabilityId === reference);
  if (capability) return `projectRoot.${capability.domain ? `${safeName(capability.domain)}.` : ''}${safeName(capability.id.split('.').pop() ?? capability.id)}`;
  const domain = architecture.domains.find(item => item.id === reference);
  return domain ? `projectRoot.${safeName(domain.id)}` : reference;
}

function renderRelations(architecture: LikeC4Architecture, legacy: LegacyMapping): string {
  const relations = architecture.relations.filter(relation => !OMITTED_RELATIONS.has(relation.kind)).flatMap(relation => {
    const source = sourceElementId(legacy, relation.source);
    const target = sourceElementId(legacy, relation.target);
    return source && target ? [`${candidateFqn(architecture, relation.source)} -[${relation.kind}]-> ${candidateFqn(architecture, relation.target)}`] : [];
  });
  return `model {\n${relations.join('\n')}\n}\n`;
}

function renderViews(): string {
  return `views {\n  view index {\n    include *\n    autoLayout TopBottom\n  }\n}\n`;
}

async function writeCandidate(
  projectRoot: string,
  candidatePath: string,
  architecture: LikeC4Architecture,
  legacy: LegacyMapping,
  specs: Map<string, { source: string; content: string; elementId?: string }>,
): Promise<string[]> {
  await fs.rm(candidatePath, { recursive: true, force: true });
  const architectureDir = path.join(candidatePath, OPSX_DIR_NAME, 'architecture');
  const specsDir = path.join(candidatePath, OPSX_DIR_NAME, 'specs');
  await fs.mkdir(architectureDir, { recursive: true });
  await fs.mkdir(specsDir, { recursive: true });
  const projectName = path.basename(projectRoot) || 'OPSX Project';
  const files: Array<{ relative: string; content: string }> = [
    [path.join(OPSX_DIR_NAME, 'architecture', 'specification.c4'), renderSpecification()],
    [path.join(OPSX_DIR_NAME, 'architecture', 'model.c4'), renderModel(projectName, architecture, legacy)],
    [path.join(OPSX_DIR_NAME, 'architecture', 'relations.c4'), renderRelations(architecture, legacy)],
    [path.join(OPSX_DIR_NAME, 'architecture', 'views.c4'), renderViews()],
  ].map(([relative, content]) => ({ relative, content }));
  for (const [specId, spec] of specs) {
    files.push({
      relative: path.join(OPSX_DIR_NAME, 'specs', specId, 'spec.md'),
      content: spec.elementId ? replaceWithElement(spec.content, spec.elementId) : spec.content,
    });
  }
  for (const file of files) {
    const target = path.join(candidatePath, file.relative);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, file.content);
  }
  return files.map(file => relativeRef(candidatePath, path.join(candidatePath, file.relative)));
}

async function validateCandidate(candidatePath: string): Promise<{ success: boolean; errors: string[] }> {
  try {
    const architecture = await readLikeC4Architecture(candidatePath);
    const architectureResult = await validateArchitecture(candidatePath, architecture);
    const bindingIssues = await validateSpecBindings(candidatePath, architecture);
    const registry = await buildSpecRegistry(candidatePath);
    const errors = [
      ...architectureResult.errors.map(issue => issue.message),
      ...bindingIssues.map(issue => issue.message),
    ];
    const validator = new Validator();
    for (const specId of registry.specToElement.keys()) {
      const report = await validator.validateSpec(path.join(candidatePath, OPSX_DIR_NAME, 'specs', specId, 'spec.md'));
      errors.push(...report.issues.filter(issue => issue.level === 'ERROR').map(issue => `${specId}: ${issue.message}`));
    }
    return { success: errors.length === 0, errors };
  } catch (error) {
    return { success: false, errors: [error instanceof Error ? error.message : String(error)] };
  }
}

async function promoteCandidate(projectRoot: string, candidatePath: string): Promise<void> {
  const opsx = path.resolve(projectRoot, OPSX_DIR_NAME);
  const stage = await fs.mkdtemp(path.join(opsx, '.semantic-model-stage-'));
  const architecture = path.join(opsx, 'architecture');
  const specs = path.join(opsx, 'specs');
  const oldArchitecture = path.join(opsx, '.semantic-model-old-architecture');
  const oldSpecs = path.join(opsx, '.semantic-model-old-specs');
  let movedArchitecture = false;
  let movedSpecs = false;
  let installedArchitecture = false;
  let installedSpecs = false;
  try {
    await fs.cp(path.join(candidatePath, OPSX_DIR_NAME, 'architecture'), path.join(stage, 'architecture'), { recursive: true });
    await fs.cp(path.join(candidatePath, OPSX_DIR_NAME, 'specs'), path.join(stage, 'specs'), { recursive: true });
    await fs.rm(oldArchitecture, { recursive: true, force: true });
    await fs.rm(oldSpecs, { recursive: true, force: true });
    await fs.rename(architecture, oldArchitecture);
    movedArchitecture = true;
    await fs.rename(specs, oldSpecs);
    movedSpecs = true;
    await fs.rename(path.join(stage, 'architecture'), architecture);
    installedArchitecture = true;
    await fs.rename(path.join(stage, 'specs'), specs);
    installedSpecs = true;
  } catch (error) {
    if (installedArchitecture) await fs.rm(architecture, { recursive: true, force: true });
    if (installedSpecs) await fs.rm(specs, { recursive: true, force: true });
    if (movedArchitecture) await fs.rename(oldArchitecture, architecture).catch(() => undefined);
    if (movedSpecs) await fs.rename(oldSpecs, specs).catch(() => undefined);
    throw error;
  } finally {
    await fs.rm(stage, { recursive: true, force: true });
  }
  await fs.rm(oldArchitecture, { recursive: true, force: true }).catch(() => undefined);
  await fs.rm(oldSpecs, { recursive: true, force: true }).catch(() => undefined);
}

export async function migrateSemanticModel(projectRoot: string, options: SemanticModelMigrationOptions = {}): Promise<SemanticModelMigrationResult> {
  const resolvedProjectRoot = path.resolve(projectRoot);
  const candidatePath = path.resolve(resolvedProjectRoot, options.candidatePath ?? path.join(OPSX_DIR_NAME, 'migration-candidate'));
  const architecture = await readLikeC4Architecture(resolvedProjectRoot);
  if (architecture.profile !== 'legacy') throw new Error('Semantic model migration requires a legacy LikeC4 profile');
  const gaps: SemanticMigrationGap[] = [];
  await collectContractPolicyGaps(resolvedProjectRoot, architecture, gaps);
  const { mappings, legacy } = createMappings(architecture, gaps);
  const specs = await readFormalSpecs(resolvedProjectRoot, architecture, legacy, gaps);
  if (specs.files.has('project-contract')) {
    gaps.push(makeGap('PROJECT_CONTRACT_CONFLICT', 'Spec project-contract already exists and cannot be replaced by the generated Project Contract'));
  } else {
    specs.files.set('project-contract', {
      source: path.join(resolvedProjectRoot, OPSX_DIR_NAME, 'specs', 'project-contract', 'spec.md'),
      content: renderProjectContract(path.basename(resolvedProjectRoot) || 'OPSX Project'),
      elementId: 'project.root',
    });
  }
  const files = await writeCandidate(resolvedProjectRoot, candidatePath, architecture, legacy, specs.files);
  const validation = await validateCandidate(candidatePath);
  if (!validation.success) gaps.push(...validation.errors.map(message => makeGap('VALIDATION_FAILURE', message, relativeRef(resolvedProjectRoot, candidatePath))));
  const report: SemanticMigrationReport = {
    sourceVersion: 'legacy', targetVersion: '1', resolvedMappings: [...mappings, ...specs.mappings],
    contractPolicies: [...LEGACY_CONTRACT_POLICIES], gaps,
    files, sourceRefs: architecture.files.map(file => relativeRef(resolvedProjectRoot, file)), validation,
  };
  report.files.push('migration-report.json');
  await fs.writeFile(path.join(candidatePath, 'migration-report.json'), `${JSON.stringify(report, null, 2)}\n`);
  if (options.promote) {
    if (!options.yes) throw new Error('Promotion requires --yes human authorization');
    if (report.gaps.length > 0) throw new Error(`Migration promotion blocked:\n${report.gaps.map(gap => `${gap.code}: ${gap.message}`).join('\n')}`);
    await promoteCandidate(resolvedProjectRoot, candidatePath);
  }
  return { candidatePath, report, promoted: !!options.promote };
}
