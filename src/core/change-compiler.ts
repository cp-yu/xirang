import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { OPSX_DIR_NAME } from './config.js';
import { extractRequirementsSection, parseDeltaSpec, type RequirementBlock } from './parsers/requirement-blocks.js';
import { parseSpecFrontmatter } from './parsers/spec-frontmatter.js';
import { readLikeC4Architecture } from '../utils/likec4-reader.js';
import type {
  SemanticArchitectureModel,
  SemanticContract,
  SemanticElement,
  SemanticElementKind,
  SemanticRelationship,
  SemanticRelationshipKind,
  SemanticRequirement,
  TargetSemanticModel,
} from '../utils/semantic-model.js';
import {
  parseArchitectureDelta,
  type ArchitectureDeltaOperation,
  type ArchitectureDeltaParseResult,
  type ArchitectureElementTarget,
  type ArchitectureRelationshipTarget,
} from './architecture-delta-parser.js';
import { createSemanticDiff, type ChangeDiagnostic, type ChangeDiff } from './semantic-diff.js';
import { validateSemanticModel } from '../utils/semantic-checks/semantic-model-validator.js';
import { validateSemanticRelations } from '../utils/semantic-checks/relation-validator.js';
import { Validator } from './validation/validator.js';

export interface CompileArchitectureChangeOptions {
  change?: string;
  targetContracts?: TargetSemanticModel['contracts'];
  allowAlreadyApplied?: boolean;
  validateContracts?: boolean;
}

export interface CompileChangeOptions {
  architecture?: SemanticArchitectureModel;
  allowAlreadyApplied?: boolean;
}

export interface CompiledChange {
  formalFingerprint: string;
  changeFingerprint: string;
  target: TargetSemanticModel | null;
  diff: ChangeDiff;
  diagnostics: ChangeDiagnostic[];
  valid: boolean;
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => `${JSON.stringify(key)}:${canonical(nested)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function fingerprint(value: unknown): string {
  return createHash('sha256').update(canonical(value)).digest('hex');
}

function equal(left: unknown, right: unknown): boolean {
  return canonical(left) === canonical(right);
}

function relationIdentity(relation: SemanticRelationship): string {
  return `${relation.source}|${relation.kind}|${relation.target}`;
}

function diagnostic(operation: ArchitectureDeltaOperation, code: string, message: string): ChangeDiagnostic {
  return {
    level: 'ERROR', code, path: 'architecture-delta.c4', message,
    identity: operation.identity, location: operation.location,
  };
}

function elementFromTarget(target: ArchitectureElementTarget, existing?: SemanticElement): SemanticElement {
  return {
    id: target.id,
    fqn: existing?.fqn ?? target.id,
    kind: target.kind,
    title: target.title,
    summary: target.summary,
    parent: target.parent,
    children: existing?.children ?? [],
    metadata: structuredClone(target.metadata),
  };
}

function rebuildChildren(elements: SemanticElement[]): void {
  const byId = new Map(elements.map(element => [element.id, element]));
  for (const element of elements) element.children = [];
  for (const element of elements) {
    if (element.parent && byId.has(element.parent)) byId.get(element.parent)!.children.push(element.id);
  }
  for (const element of elements) element.children.sort();
}

function validateReplacementHints(
  operations: ArchitectureDeltaOperation[],
  replacements: Array<{ from: string; to: string; location: { line: number; column: number; offset: number } }>,
  diagnostics: ChangeDiagnostic[],
): void {
  const removed = new Set(operations.filter(item => item.entity === 'element' && item.operation === 'REMOVED').map(item => item.identity));
  const added = new Set(operations.filter(item => item.entity === 'element' && item.operation === 'ADDED').map(item => item.identity));
  const participating = new Set<string>();
  for (const hint of replacements) {
    if (!removed.has(hint.from) || !added.has(hint.to)) diagnostics.push({
      level: 'ERROR', code: 'INVALID_REPLACEMENT_HINT', path: 'architecture-delta.c4',
      message: `Replacement hint requires exactly one REMOVED ${hint.from} and one ADDED ${hint.to}`,
      location: hint.location,
    });
    if (participating.has(hint.from) || participating.has(hint.to)) diagnostics.push({
      level: 'ERROR', code: 'DUPLICATE_REPLACEMENT_HINT', path: 'architecture-delta.c4',
      message: `Element replacement operation may participate in at most one hint: ${hint.from} -> ${hint.to}`,
      location: hint.location,
    });
    participating.add(hint.from);
    participating.add(hint.to);
  }
}

function applyOperations(
  formal: TargetSemanticModel,
  target: TargetSemanticModel,
  operations: ArchitectureDeltaOperation[],
  diagnostics: ChangeDiagnostic[],
  allowAlreadyApplied = false,
): void {
  const elements = new Map(target.architecture.elements.map(item => [item.id, item]));
  const formalElements = new Map(formal.architecture.elements.map(item => [item.id, item]));
  const relations = new Map(target.architecture.relations.map(item => [relationIdentity(item), item]));
  const formalRelations = new Map(formal.architecture.relations.map(item => [relationIdentity(item), item]));

  for (const item of operations) {
    if (item.entity === 'element') {
      const exists = formalElements.has(item.identity);
      if (item.operation === 'ADDED') {
        if (exists) {
          const expected = elementFromTarget(item.target as ArchitectureElementTarget, formalElements.get(item.identity));
          if (!allowAlreadyApplied || !equal(formalElements.get(item.identity), expected)) {
            diagnostics.push(diagnostic(item, 'ADDED_IDENTITY_EXISTS', `ADDED element already exists: ${item.identity}`));
          }
          continue;
        }
        elements.set(item.identity, elementFromTarget(item.target as ArchitectureElementTarget));
      } else if (!exists) {
        if (!(allowAlreadyApplied && item.operation === 'REMOVED')) {
          diagnostics.push(diagnostic(item, `${item.operation}_IDENTITY_MISSING`, `${item.operation} element does not exist: ${item.identity}`));
        }
      } else if (item.operation === 'REMOVED') {
        elements.delete(item.identity);
      } else {
        const current = formalElements.get(item.identity)!;
        const next = item.target as ArchitectureElementTarget;
        if (next.kind !== current.kind) {
          diagnostics.push(diagnostic(item, 'ELEMENT_KIND_CHANGE', `MODIFIED element cannot change kind: ${current.kind} -> ${next.kind}`));
          continue;
        }
        const updated = elementFromTarget(next, current);
        if (equal(current, updated) && !allowAlreadyApplied) diagnostics.push(diagnostic(item, 'DECLARED_OPERATION_NO_EFFECT', `MODIFIED element has no effective change: ${item.identity}`));
        elements.set(item.identity, updated);
      }
      continue;
    }

    if (item.entity === 'relationship') {
      const exists = formalRelations.has(item.identity);
      if (item.operation === 'ADDED') {
        if (exists) {
          if (!allowAlreadyApplied || !equal(formalRelations.get(item.identity), item.target)) diagnostics.push(diagnostic(item, 'ADDED_IDENTITY_EXISTS', `ADDED relationship already exists: ${item.identity}`));
        } else relations.set(item.identity, structuredClone(item.target as ArchitectureRelationshipTarget));
      } else if (!exists) {
        if (!(allowAlreadyApplied && item.operation === 'REMOVED')) diagnostics.push(diagnostic(item, `${item.operation}_IDENTITY_MISSING`, `${item.operation} relationship does not exist: ${item.identity}`));
      } else if (item.operation === 'REMOVED') {
        relations.delete(item.identity);
      } else {
        const next = item.target as ArchitectureRelationshipTarget;
        if (equal(formalRelations.get(item.identity), next) && !allowAlreadyApplied) diagnostics.push(diagnostic(item, 'DECLARED_OPERATION_NO_EFFECT', `MODIFIED relationship has no effective change: ${item.identity}`));
        relations.set(item.identity, structuredClone(next));
      }
      continue;
    }

    const collection = item.entity === 'elementKind'
      ? target.architecture.metamodel.elements
      : target.architecture.metamodel.relationships;
    const formalCollection = item.entity === 'elementKind'
      ? formal.architecture.metamodel.elements
      : formal.architecture.metamodel.relationships;
    const exists = Object.hasOwn(formalCollection, item.identity);
    if (item.operation === 'ADDED') {
      if (exists) {
        if (!allowAlreadyApplied || !equal(formalCollection[item.identity], item.target)) diagnostics.push(diagnostic(item, 'ADDED_IDENTITY_EXISTS', `ADDED ${item.entity} already exists: ${item.identity}`));
      } else collection[item.identity] = structuredClone(item.target as SemanticElementKind & SemanticRelationshipKind);
    } else if (!exists) {
      if (!(allowAlreadyApplied && item.operation === 'REMOVED')) diagnostics.push(diagnostic(item, `${item.operation}_IDENTITY_MISSING`, `${item.operation} ${item.entity} does not exist: ${item.identity}`));
    } else if (item.operation === 'REMOVED') {
      delete collection[item.identity];
    } else {
      if (equal(formalCollection[item.identity], item.target) && !allowAlreadyApplied) diagnostics.push(diagnostic(item, 'DECLARED_OPERATION_NO_EFFECT', `MODIFIED ${item.entity} has no effective change: ${item.identity}`));
      collection[item.identity] = structuredClone(item.target as SemanticElementKind & SemanticRelationshipKind);
    }
  }

  target.architecture.elements = [...elements.values()].sort((left, right) => left.id.localeCompare(right.id));
  target.architecture.relations = [...relations.values()].sort((left, right) => relationIdentity(left).localeCompare(relationIdentity(right)));
  rebuildChildren(target.architecture.elements);
}

function validateTarget(
  formal: TargetSemanticModel,
  target: TargetSemanticModel,
  operations: ArchitectureDeltaOperation[],
  diagnostics: ChangeDiagnostic[],
  validateContracts: boolean,
): void {
  const elements = new Map(target.architecture.elements.map(item => [item.id, item]));
  const removed = new Map(operations.filter(item => item.entity === 'element' && item.operation === 'REMOVED').map(item => [item.identity, item]));

  for (const [removedId, operation] of removed) {
    for (const element of target.architecture.elements) {
      let parent = element.parent;
      while (parent) {
        if (parent === removedId) {
          diagnostics.push(diagnostic(operation, 'UNRESOLVED_DESCENDANT', `Removed element ${removedId} still owns descendant ${element.id}`));
          break;
        }
        parent = elements.get(parent)?.parent ?? null;
      }
    }
    for (const relation of target.architecture.relations) {
      if (relation.source === removedId || relation.target === removedId) diagnostics.push(diagnostic(
        operation,
        'UNRESOLVED_RELATIONSHIP',
        `Removed element ${removedId} still participates in relationship ${relationIdentity(relation)}`,
      ));
    }
    for (const element of target.architecture.elements) {
      if (element.id === removedId) continue;
      for (const [key, value] of Object.entries(element.metadata)) {
        if (value === removedId || (Array.isArray(value) && value.includes(removedId))) diagnostics.push(diagnostic(
          operation,
          'UNRESOLVED_METADATA_REFERENCE',
          `Removed element ${removedId} is still referenced by ${element.id} metadata.${key}`,
        ));
      }
    }
    if (validateContracts) {
      for (const contract of target.contracts) {
        if (contract.elementId === removedId) diagnostics.push(diagnostic(
          operation,
          'UNRESOLVED_SPEC_BINDING',
          `Removed element ${removedId} is still bound by Spec ${contract.specId}`,
        ));
      }
    }
  }

  for (const element of target.architecture.elements) {
    if (element.parent && !elements.has(element.parent)) diagnostics.push({
      level: 'ERROR', code: 'UNKNOWN_PARENT', path: 'architecture-delta.c4', identity: element.id,
      message: `Element ${element.id} has unknown parent ${element.parent}`,
    });
    const kind = target.architecture.metamodel.elements[element.kind];
    if (!kind) diagnostics.push({
      level: 'ERROR', code: 'UNKNOWN_ELEMENT_KIND', path: 'architecture-delta.c4', identity: element.id,
      message: `Element ${element.id} uses unknown kind ${element.kind}`,
    });
    if (element.parent && kind?.parents) {
      const parentKind = elements.get(element.parent)?.kind;
      if (parentKind && !kind.parents.includes(parentKind)) diagnostics.push({
        level: 'ERROR', code: 'INVALID_PARENT_KIND', path: 'architecture-delta.c4', identity: element.id,
        message: `Element ${element.id} kind ${element.kind} cannot be contained by ${parentKind}`,
      });
    }
  }

  for (const relation of target.architecture.relations) {
    if (!elements.has(relation.source) || !elements.has(relation.target)) continue;
    const kind = target.architecture.metamodel.relationships[relation.kind];
    if (!kind) diagnostics.push({
      level: 'ERROR', code: 'UNKNOWN_RELATIONSHIP_KIND', path: 'architecture-delta.c4', identity: relationIdentity(relation),
      message: `Relationship uses unknown kind ${relation.kind}`,
    });
    const sourceKind = elements.get(relation.source)!.kind;
    const targetKind = elements.get(relation.target)!.kind;
    if (kind?.sourceKinds && !kind.sourceKinds.includes(sourceKind)) diagnostics.push({
      level: 'ERROR', code: 'INVALID_RELATIONSHIP_SOURCE_KIND', path: 'architecture-delta.c4', identity: relationIdentity(relation),
      message: `Relationship ${relationIdentity(relation)} rejects source kind ${sourceKind}`,
    });
    if (kind?.targetKinds && !kind.targetKinds.includes(targetKind)) diagnostics.push({
      level: 'ERROR', code: 'INVALID_RELATIONSHIP_TARGET_KIND', path: 'architecture-delta.c4', identity: relationIdentity(relation),
      message: `Relationship ${relationIdentity(relation)} rejects target kind ${targetKind}`,
    });
  }

  const semanticArchitecture = {
    source: 'likec4' as const,
    files: [],
    profile: 'v1' as const,
    domains: [],
    capabilities: [],
    ...target.architecture,
  };
  for (const issue of [...validateSemanticModel(semanticArchitecture), ...validateSemanticRelations(semanticArchitecture)]) {
    if (diagnostics.some(item => item.code === issue.code && item.message === issue.message)) continue;
    diagnostics.push({
      level: 'ERROR', code: issue.code, path: '.opsx/architecture',
      identity: issue.element, message: issue.message,
    });
  }

  if (validateContracts) {
    for (const contract of target.contracts) {
      if (!elements.has(contract.elementId)) diagnostics.push({
        level: 'ERROR', code: 'UNKNOWN_SPEC_ELEMENT', path: `specs/${contract.specId}/spec.md`, identity: contract.elementId,
        message: `Spec ${contract.specId} binds unknown element ${contract.elementId}`,
      });
    }

    const bound = new Set(target.contracts.map(item => item.elementId));
    for (const element of target.architecture.elements) {
      if (target.architecture.metamodel.elements[element.kind]?.contractPolicy === 'required' && !bound.has(element.id)) diagnostics.push({
        level: 'ERROR', code: 'MISSING_REQUIRED_CONTRACT', path: '.opsx/architecture', identity: element.id,
        message: `Required element ${element.id} has no bound Spec`,
      });
    }
  }

  void formal;
}

interface ArchitectureMaterialization {
  formal: TargetSemanticModel;
  formalFingerprint: string;
  changeFingerprint: string;
  parsed: ArchitectureDeltaParseResult;
  target: TargetSemanticModel;
  diagnostics: ChangeDiagnostic[];
  valid: boolean;
}

function materializeArchitectureChange(
  formal: TargetSemanticModel,
  source: string,
  options: CompileArchitectureChangeOptions,
): ArchitectureMaterialization {
  const formalSnapshot = structuredClone(formal);
  const formalFingerprint = fingerprint(formalSnapshot);
  const changeFingerprint = fingerprint(source);
  const parsed = parseArchitectureDelta(source);
  const diagnostics: ChangeDiagnostic[] = parsed.diagnostics.map(item => ({ ...item }));
  const target = structuredClone(formalSnapshot);
  if (options.targetContracts) target.contracts = structuredClone(options.targetContracts);

  if (parsed.delta) {
    validateReplacementHints(parsed.delta.operations, parsed.delta.replacements, diagnostics);
    applyOperations(formalSnapshot, target, parsed.delta.operations, diagnostics, options.allowAlreadyApplied);
    validateTarget(formalSnapshot, target, parsed.delta.operations, diagnostics, options.validateContracts ?? true);
  }

  const valid = parsed.delta !== null && diagnostics.every(item => item.level !== 'ERROR');
  return { formal: formalSnapshot, formalFingerprint, changeFingerprint, parsed, target, diagnostics, valid };
}

export function compileArchitectureChange(
  formal: TargetSemanticModel,
  source: string,
  options: CompileArchitectureChangeOptions = {},
): CompiledChange {
  const compiled = materializeArchitectureChange(formal, source, options);
  const diff = createSemanticDiff(compiled.formal, compiled.target, {
    change: options.change,
    valid: compiled.valid,
    formalFingerprint: compiled.formalFingerprint,
    changeFingerprint: compiled.changeFingerprint,
    diagnostics: compiled.diagnostics,
    declaredOperations: compiled.parsed.delta?.operations,
    replacements: compiled.parsed.delta?.replacements,
  });
  return {
    formalFingerprint: compiled.formalFingerprint,
    changeFingerprint: compiled.changeFingerprint,
    target: compiled.parsed.delta ? compiled.target : null,
    diff,
    diagnostics: compiled.diagnostics,
    valid: compiled.valid,
  };
}

function parseRequirement(block: RequirementBlock): SemanticRequirement {
  const lines = block.raw.replace(/\r\n?/g, '\n').split('\n').slice(1);
  const scenarioIndexes: number[] = [];
  let fenced = false;
  for (let index = 0; index < lines.length; index += 1) {
    if (/^\s*```/.test(lines[index])) fenced = !fenced;
    if (!fenced && /^####\s+Scenario:\s+/.test(lines[index])) scenarioIndexes.push(index);
  }
  const bodyEnd = scenarioIndexes[0] ?? lines.length;
  const body = lines.slice(0, bodyEnd).join('\n').trim();
  const scenarios = scenarioIndexes.map((start, index) => {
    const header = lines[start].match(/^####\s+Scenario:\s+(.+?)\s*$/)!;
    const end = scenarioIndexes[index + 1] ?? lines.length;
    return { title: header[1].trim(), body: lines.slice(start + 1, end).join('\n').trim() };
  });
  return { title: block.name, body, scenarios };
}

async function readContracts(specsDir: string): Promise<SemanticContract[]> {
  const entries = await fs.readdir(specsDir, { withFileTypes: true }).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  const contracts: SemanticContract[] = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (!entry.isDirectory()) continue;
    const file = path.join(specsDir, entry.name, 'spec.md');
    const content = await fs.readFile(file, 'utf8').catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return null;
      throw error;
    });
    if (content === null) continue;
    const owner = parseSpecFrontmatter(content).element;
    if (!owner) continue;
    contracts.push({
      specId: entry.name,
      elementId: owner,
      requirements: extractRequirementsSection(content).bodyBlocks.map(parseRequirement),
    });
  }
  return contracts;
}

async function applyContractDeltas(
  formal: SemanticContract[],
  changeSpecsDir: string,
  allowAlreadyApplied = false,
): Promise<{ contracts: SemanticContract[]; diagnostics: ChangeDiagnostic[]; sources: Array<[string, string]> }> {
  const contracts = new Map(formal.map(contract => [contract.specId, structuredClone(contract)]));
  const formalById = new Map(formal.map(contract => [contract.specId, contract]));
  const diagnostics: ChangeDiagnostic[] = [];
  const sources: Array<[string, string]> = [];
  const entries = await fs.readdir(changeSpecsDir, { withFileTypes: true }).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (!entry.isDirectory()) continue;
    const file = path.join(changeSpecsDir, entry.name, 'spec.md');
    const content = await fs.readFile(file, 'utf8').catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return null;
      throw error;
    });
    if (content === null) continue;
    sources.push([entry.name, content]);
    const frontmatter = parseSpecFrontmatter(content);
    if (!frontmatter.element) {
      diagnostics.push({
        level: 'ERROR', code: 'MISSING_SPEC_ELEMENT', path: path.relative(path.dirname(changeSpecsDir), file),
        message: `Spec ${entry.name} has no singular element binding`,
      });
      continue;
    }
    const formalContract = formalById.get(entry.name);
    if (formalContract && formalContract.elementId !== frontmatter.element) diagnostics.push({
      level: 'ERROR', code: 'SPEC_OWNER_CHANGE', path: path.relative(path.dirname(changeSpecsDir), file), identity: entry.name,
      message: `Spec ${entry.name} cannot change owner from ${formalContract.elementId} to ${frontmatter.element}`,
    });
    const contract = contracts.get(entry.name) ?? { specId: entry.name, elementId: frontmatter.element, requirements: [] };
    const formalRequirements = new Map((formalContract?.requirements ?? []).map(requirement => [requirement.title, requirement]));
    const targetRequirements = new Map(contract.requirements.map(requirement => [requirement.title, requirement]));
    const plan = parseDeltaSpec(content);
    if (plan.unsupportedSections.length > 0) diagnostics.push({
      level: 'ERROR', code: 'UNSUPPORTED_RENAMED_REQUIREMENTS', path: path.relative(path.dirname(changeSpecsDir), file),
      message: 'RENAMED Requirements is not supported; use REMOVED old plus ADDED new',
    });
    for (const block of plan.added) {
      const parsed = parseRequirement(block);
      if (formalRequirements.has(block.name)) {
        if (!allowAlreadyApplied || !equal(formalRequirements.get(block.name), parsed)) diagnostics.push({
          level: 'ERROR', code: 'ADDED_REQUIREMENT_EXISTS', path: path.relative(path.dirname(changeSpecsDir), file), identity: block.name,
          message: `ADDED Requirement already exists: ${block.name}`,
        });
      } else targetRequirements.set(block.name, parsed);
    }
    for (const block of plan.modified) {
      if (!formalRequirements.has(block.name)) diagnostics.push({
        level: 'ERROR', code: 'MODIFIED_REQUIREMENT_MISSING', path: path.relative(path.dirname(changeSpecsDir), file), identity: block.name,
        message: `MODIFIED Requirement does not exist: ${block.name}`,
      });
      else targetRequirements.set(block.name, parseRequirement(block));
    }
    for (const name of plan.removed) {
      if (!formalRequirements.has(name)) {
        if (!allowAlreadyApplied) diagnostics.push({
          level: 'ERROR', code: 'REMOVED_REQUIREMENT_MISSING', path: path.relative(path.dirname(changeSpecsDir), file), identity: name,
          message: `REMOVED Requirement does not exist: ${name}`,
        });
      } else targetRequirements.delete(name);
    }
    contract.elementId = frontmatter.element;
    contract.requirements = [...targetRequirements.values()].sort((left, right) => left.title.localeCompare(right.title));
    if (contract.requirements.length === 0) contracts.delete(entry.name);
    else contracts.set(entry.name, contract);
  }
  return {
    contracts: [...contracts.values()].sort((left, right) => left.specId.localeCompare(right.specId)),
    diagnostics,
    sources,
  };
}

async function readArchitectureModel(projectRoot: string): Promise<SemanticArchitectureModel> {
  const architecture = await readLikeC4Architecture(projectRoot);
  if (architecture.profile === 'v1') return {
    languageVersion: architecture.languageVersion,
    metamodel: structuredClone(architecture.metamodel),
    elements: structuredClone(architecture.elements),
    relations: structuredClone(architecture.relations),
  };
  const domains: SemanticElement[] = architecture.domains.map(domain => ({
    id: domain.id, fqn: domain.id, kind: 'domain', title: domain.title,
    summary: domain.description ?? '', parent: null,
    children: architecture.capabilities.filter(item => item.domain === domain.id).map(item => item.id).sort(),
    metadata: {},
  }));
  const capabilities: SemanticElement[] = architecture.capabilities.map(capability => ({
    id: capability.id, fqn: capability.id, kind: 'capability', title: capability.title,
    summary: capability.description ?? '', parent: capability.domain ?? null, children: [],
    metadata: {
      ...(capability.capabilityId ? { capabilityId: capability.capabilityId } : {}),
      ...(capability.status ? { status: capability.status } : {}),
      ...(capability.specs.length ? { specs: capability.specs } : {}),
    },
  }));
  return {
    languageVersion: null,
    metamodel: structuredClone(architecture.metamodel),
    elements: [...domains, ...capabilities],
    relations: structuredClone(architecture.relations),
  };
}

async function appendChangeSpecDiagnostics(
  projectRoot: string,
  changeDir: string,
  target: TargetSemanticModel,
  diagnostics: ChangeDiagnostic[],
  allowAlreadyApplied = false,
): Promise<void> {
  const report = await new Validator(true).validateChangeDeltaSpecs(changeDir, {
    projectRoot,
    architecture: {
      source: 'likec4', files: [], profile: 'v1', domains: [], capabilities: [],
      ...target.architecture,
    },
    knownElementIds: new Set(target.architecture.elements.map(element => element.id)),
    allowAlreadyApplied,
  });
  for (const issue of report.issues) {
    if (issue.level === 'INFO') continue;
    const code = issue.message.match(/^([A-Z][A-Z0-9_]+):/)?.[1] ?? 'CHANGE_SPEC_VALIDATION';
    const normalizedPath = issue.path.split(path.sep).join('/');
    const diagnostic: ChangeDiagnostic = {
      level: issue.level,
      code,
      path: normalizedPath.startsWith('specs/') || normalizedPath.startsWith('.opsx/')
        ? normalizedPath
        : `specs/${normalizedPath}`,
      message: issue.message,
    };
    if (!diagnostics.some(item => item.level === diagnostic.level && item.path === diagnostic.path && item.message === diagnostic.message)) {
      diagnostics.push(diagnostic);
    }
  }
}

export async function readFormalSemanticModel(
  projectRoot: string,
  architecture?: SemanticArchitectureModel,
): Promise<TargetSemanticModel> {
  return {
    architecture: structuredClone(architecture ?? await readArchitectureModel(projectRoot)),
    contracts: await readContracts(path.join(projectRoot, OPSX_DIR_NAME, 'specs')),
  };
}

export async function compileChange(
  projectRoot: string,
  changeName: string,
  options: CompileChangeOptions = {},
): Promise<CompiledChange> {
  const changeDir = path.join(projectRoot, OPSX_DIR_NAME, 'changes', changeName);
  const formal = await readFormalSemanticModel(projectRoot, options.architecture);
  const contractResult = await applyContractDeltas(formal.contracts, path.join(changeDir, 'specs'), options.allowAlreadyApplied);
  const deltaPath = path.join(changeDir, 'architecture-delta.c4');
  const deltaSource = await fs.readFile(deltaPath, 'utf8').catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return null;
    throw error;
  });
  const combinedChangeFingerprint = fingerprint({ architecture: deltaSource, specs: contractResult.sources });
  let compiled: ArchitectureMaterialization;

  if (deltaSource !== null) {
    compiled = materializeArchitectureChange(formal, deltaSource, {
      change: changeName,
      targetContracts: contractResult.contracts,
      allowAlreadyApplied: options.allowAlreadyApplied,
    });
  } else {
    const target = structuredClone(formal);
    target.contracts = structuredClone(contractResult.contracts);
    const formalFingerprint = fingerprint(formal);
    const diagnostics = [...contractResult.diagnostics];
    validateTarget(formal, target, [], diagnostics, true);
    await appendChangeSpecDiagnostics(projectRoot, changeDir, target, diagnostics, options.allowAlreadyApplied);
    const valid = diagnostics.every(item => item.level !== 'ERROR');
    const diff = createSemanticDiff(formal, target, {
      change: changeName, valid, formalFingerprint, changeFingerprint: combinedChangeFingerprint, diagnostics,
    });
    return { formalFingerprint, changeFingerprint: combinedChangeFingerprint, target, diff, diagnostics, valid };
  }

  const diagnostics = [...compiled.diagnostics, ...contractResult.diagnostics];
  const target = compiled.target;
  await appendChangeSpecDiagnostics(projectRoot, changeDir, target, diagnostics, options.allowAlreadyApplied);
  const valid = compiled.parsed.delta !== null && diagnostics.every(item => item.level !== 'ERROR');
  const diff = createSemanticDiff(formal, target, {
    change: changeName,
    valid,
    formalFingerprint: compiled.formalFingerprint,
    changeFingerprint: combinedChangeFingerprint,
    diagnostics,
    declaredOperations: compiled.parsed.delta?.operations,
    replacements: compiled.parsed.delta?.replacements,
  });
  return {
    formalFingerprint: compiled.formalFingerprint,
    changeFingerprint: combinedChangeFingerprint,
    target: compiled.parsed.delta ? target : null,
    diff,
    diagnostics,
    valid,
  };
}
