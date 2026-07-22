import { OPSX_DIR_NAME } from './config.js';
import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';
import { readProjectOpsx } from '../utils/opsx-utils.js';
import { parseSpecFrontmatter } from './parsers/spec-frontmatter.js';

export interface BackfilledSpec {
  spec: string;
  caps: string[];
}

export interface UnmatchedSpecContext {
  spec: string;
  path: string;
  content: string;
}

export interface CapabilityIntent {
  id: string;
  intent: string;
}

export interface SemanticBackfillHandoff {
  unmatchedSpecs: UnmatchedSpecContext[];
  candidateCapabilities: CapabilityIntent[];
  mappingResultFormat: {
    mappings: Array<{ spec: '<spec-id>'; capabilities: ['<capability-id>'] }>;
  };
  applyCommand: string;
}

export interface BackfillSpecsResult {
  written: BackfilledSpec[];
  unmatched: string[];
  semanticHandoff: SemanticBackfillHandoff;
}

export interface SemanticSpecMapping {
  spec: string;
  capabilities: string[];
}

const SemanticMappingsSchema = z.object({
  mappings: z.array(z.object({
    spec: z.string().min(1),
    capabilities: z.array(z.string().regex(/^cap\./)).min(1),
  }).strict()),
}).strict();

export function matchSpecToCaps(specId: string, capIds: string[]): string[] {
  const specSegments = segmentSpecId(specId);
  if (specSegments.length === 0) return [];

  return capIds.filter((capId) => isSubsequence(specSegments, segmentCapId(capId)));
}

export async function writeSpecFrontmatter(specPath: string, capabilities: string[]): Promise<boolean> {
  const content = await fs.readFile(specPath, 'utf-8');
  if (hasLeadingFrontmatter(content)) {
    return false;
  }

  const frontmatter = [
    '---',
    'capabilities:',
    ...capabilities.map((capability) => `  - ${capability}`),
    '---',
    '',
  ].join('\n');

  await fs.writeFile(specPath, `${frontmatter}${content}`, 'utf-8');
  return true;
}

export async function readSemanticMappings(mappingPath: string): Promise<SemanticSpecMapping[]> {
  const content = await fs.readFile(mappingPath, 'utf-8');
  return SemanticMappingsSchema.parse(JSON.parse(content)).mappings;
}

export async function backfillSpecs(
  projectRoot: string,
  semanticMappings: SemanticSpecMapping[] = []
): Promise<BackfillSpecsResult> {
  const specs = await listSpecs(projectRoot);
  const bundle = await readProjectOpsx(projectRoot);
  const capabilities = [...(bundle?.capabilities ?? [])]
    .map(({ id, intent }) => ({ id, intent: intent ?? '' }))
    .sort((a, b) => a.id.localeCompare(b.id));
  const capIds = capabilities.map(({ id }) => id);
  const capIdSet = new Set(capIds);
  const specSet = new Set(specs);

  validateSemanticMappings(semanticMappings, specSet, capIdSet);
  const mappingBySpec = new Map(semanticMappings.map(({ spec, capabilities }) => [spec, capabilities]));
  const written: BackfilledSpec[] = [];
  const unmatched: string[] = [];

  for (const spec of specs) {
    const specPath = path.join(projectRoot, OPSX_DIR_NAME, 'specs', spec, 'spec.md');
    const content = await fs.readFile(specPath, 'utf-8');
    const frontmatter = parseSpecFrontmatter(content);
    if (frontmatter.element !== null || frontmatter.issues?.some(issue => issue.code === 'LEGACY_SPEC_OWNERSHIP')) {
      continue;
    }

    const caps = matchSpecToCaps(spec, capIds);
    const selectedCaps = caps.length > 0 ? caps : mappingBySpec.get(spec) ?? [];
    if (selectedCaps.length === 0) {
      unmatched.push(spec);
      continue;
    }

    if (await writeSpecFrontmatter(specPath, selectedCaps)) {
      written.push({ spec, caps: selectedCaps });
    }
  }

  return {
    written,
    unmatched,
    semanticHandoff: await buildSemanticHandoff(projectRoot, unmatched, capabilities),
  };
}

function validateSemanticMappings(
  mappings: SemanticSpecMapping[],
  specIds: Set<string>,
  capabilityIds: Set<string>
): void {
  const mappedSpecs = new Set<string>();
  for (const mapping of mappings) {
    if (!specIds.has(mapping.spec)) {
      throw new Error(`Unknown spec '${mapping.spec}' in semantic mapping.`);
    }
    if (mappedSpecs.has(mapping.spec)) {
      throw new Error(`Duplicate semantic mapping for spec '${mapping.spec}'.`);
    }
    mappedSpecs.add(mapping.spec);
    for (const capability of mapping.capabilities) {
      if (!capabilityIds.has(capability)) {
        throw new Error(`Unknown capability '${capability}' in semantic mapping for spec '${mapping.spec}'.`);
      }
    }
  }
}

async function buildSemanticHandoff(
  projectRoot: string,
  unmatched: string[],
  candidateCapabilities: CapabilityIntent[]
): Promise<SemanticBackfillHandoff> {
  const unmatchedSpecs = await Promise.all(unmatched.map(async (spec) => {
    const relativePath = path.posix.join(OPSX_DIR_NAME, 'specs', spec, 'spec.md');
    return {
      spec,
      path: relativePath,
      content: await fs.readFile(path.join(projectRoot, ...relativePath.split('/')), 'utf-8'),
    };
  }));

  return {
    unmatchedSpecs,
    candidateCapabilities,
    mappingResultFormat: {
      mappings: [{ spec: '<spec-id>', capabilities: ['<capability-id>'] }],
    },
    applyCommand: 'opsx bootstrap backfill-specs --mappings <mapping-file> --json',
  };
}

async function listSpecs(projectRoot: string): Promise<string[]> {
  const specsDir = path.join(projectRoot, OPSX_DIR_NAME, 'specs');
  let entries;
  try {
    entries = await fs.readdir(specsDir, { withFileTypes: true });
  } catch {
    return [];
  }

  const specs: string[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const specPath = path.join(specsDir, entry.name, 'spec.md');
    try {
      await fs.access(specPath);
      specs.push(entry.name);
    } catch {
      continue;
    }
  }

  return specs.sort();
}

function segmentSpecId(specId: string): string[] {
  return specId.split('-').map(normalizeSegment).filter(Boolean);
}

function segmentCapId(capId: string): string[] {
  return capId.replace(/^cap\./, '').split('.').map(normalizeSegment).filter(Boolean);
}

function normalizeSegment(segment: string): string {
  const value = segment.toLowerCase();
  if (value.endsWith('ion') && value.length > 4) {
    return `${value.slice(0, -3)}e`;
  }
  if (value.endsWith('ing') && value.length > 5) {
    return value.slice(0, -3);
  }
  if (value.endsWith('s') && value.length > 3) {
    return value.slice(0, -1);
  }
  return value;
}

function isSubsequence(needles: string[], haystack: string[]): boolean {
  let haystackIndex = 0;
  for (const needle of needles) {
    while (haystackIndex < haystack.length && haystack[haystackIndex] !== needle) {
      haystackIndex += 1;
    }
    if (haystackIndex >= haystack.length) {
      return false;
    }
    haystackIndex += 1;
  }
  return true;
}

function hasLeadingFrontmatter(content: string): boolean {
  const normalized = content.replace(/\r\n?/g, '\n');
  return normalized.startsWith('---\n') && normalized.indexOf('\n---', 4) !== -1;
}
