import { OPSX_DIR_NAME } from '../core/config.js';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
  parseLikeC4Domain,
  parseOpsxProfile,
  type ArchitectureCapability,
  type ArchitectureDomain,
  type ArchitectureRelation,
} from './likec4-parser.js';
import type { SemanticElement, SemanticMetamodel } from './semantic-model.js';

export interface LikeC4Architecture {
  source: 'likec4';
  files: string[];
  profile: 'legacy' | 'v1';
  languageVersion: string | null;
  metamodel: SemanticMetamodel;
  elements: SemanticElement[];
  domains: ArchitectureDomain[];
  capabilities: ArchitectureCapability[];
  relations: ArchitectureRelation[];
}

async function collectLikeC4Files(directory: string): Promise<string[]> {
  const files: string[] = [];
  const visit = async (current: string): Promise<void> => {
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
      if (entry.name === '.likec4') continue;
      const target = path.join(current, entry.name);
      if (entry.isDirectory()) await visit(target);
      else if (entry.isFile() && entry.name.endsWith('.c4')) files.push(target);
    }
  };
  await visit(directory);
  return files;
}

function mergeMetamodel(target: SemanticMetamodel, source: SemanticMetamodel): void {
  Object.assign(target.elements, source.elements);
  Object.assign(target.relationships, source.relationships);
}

function richText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    const source = value as { txt?: unknown; md?: unknown };
    if (typeof source.txt === 'string') return source.txt;
    if (typeof source.md === 'string') return source.md;
  }
  return '';
}

function dottedReferenceAt(source: string, line: number, character: number): string | null {
  const lineText = source.split(/\r?\n/)[line];
  if (!lineText) return null;
  let start = Math.min(character, lineText.length);
  let end = start;
  const isReferenceCharacter = (value: string | undefined) => {
    if (value === undefined || value === '.' || value === '-' || value === '_') return value !== undefined;
    const code = value.charCodeAt(0);
    return code >= 48 && code <= 57 || code >= 65 && code <= 90 || code >= 97 && code <= 122;
  };
  while (start > 0 && isReferenceCharacter(lineText[start - 1])) start -= 1;
  while (end < lineText.length && isReferenceCharacter(lineText[end])) end += 1;
  const reference = lineText.slice(start, end);
  return reference.includes('.') ? reference : null;
}

async function readV1(contents: string[], metamodel: SemanticMetamodel): Promise<Pick<LikeC4Architecture, 'elements' | 'relations'>> {
  const source = contents.map(content => parseOpsxProfile(content).source).join('\n');
  const runtimeUrl = new URL('../../likec4/packages/likec4/dist/index.mjs', import.meta.url).href;
  const { LikeC4 } = await import(runtimeUrl) as typeof import('likec4');
  const likec4 = await LikeC4.fromSource(source, { logger: false, printErrors: false, throwIfInvalid: false });
  try {
    if (likec4.hasErrors()) {
      const messages = likec4.getErrors().map(error => {
        const reference = dottedReferenceAt(source, error.line, error.range.start.character);
        return `  ${error.sourceFsPath}:${error.line} ${error.message}${reference ? `: ${reference}` : ''}`;
      });
      throw new Error(`Invalid model:\n${messages.join('\n')}`);
    }
    const model = await likec4.parsedModel();
    const modelElements = [...model.elements()];
    const idByFqn = new Map(modelElements.map(item => [item.id, typeof item.metadata.elementId === 'string' ? item.metadata.elementId : item.id]));
    const elements: SemanticElement[] = modelElements.map(item => {
      const id = idByFqn.get(item.id)!;
      return {
        id,
        fqn: item.id,
        kind: item.kind,
        title: item.title,
        summary: richText(item.$element.summary),
        parent: item.parent ? idByFqn.get(item.parent.id) ?? item.parent.id : null,
        children: [...item.children()].map(child => idByFqn.get(child.id) ?? child.id).sort(),
        metadata: item.metadata,
      };
    });
    const relations = [...model.relationships()].map(relation => ({
      source: idByFqn.get(relation.source.id) ?? relation.source.id,
      target: idByFqn.get(relation.target.id) ?? relation.target.id,
      kind: relation.kind ?? 'relationship',
      ...(relation.$relationship.description ? { description: richText(relation.$relationship.description) } : {}),
    }));
    return { elements, relations };
  } finally {
    await likec4.dispose();
  }
}

export async function readLikeC4Architecture(projectRoot: string): Promise<LikeC4Architecture> {
  const architecture = path.join(projectRoot, OPSX_DIR_NAME, 'architecture');
  const files = await collectLikeC4Files(architecture);
  const contents = await Promise.all(files.map(file => fs.readFile(file, 'utf8')));
  const profiles = contents.map(parseOpsxProfile);
  const versions = [...new Set(profiles.map(profile => profile.languageVersion).filter((version): version is string => version !== null))];
  if (versions.length > 1) throw new Error(`Conflicting OPSX language versions: ${versions.join(', ')}`);
  const languageVersion = versions[0] ?? null;
  if (languageVersion !== null && languageVersion !== '1') throw new Error(`Unsupported OPSX language version: ${languageVersion}`);

  const metamodel: SemanticMetamodel = { elements: {}, relationships: {} };
  for (const profile of profiles) mergeMetamodel(metamodel, profile.metamodel);

  if (languageVersion === '1') {
    const missingContractPolicies = profiles.flatMap(profile =>
      Object.entries(profile.declaredElementContractPolicies)
        .filter(([, policy]) => policy === null)
        .map(([kind]) => kind)
    );
    if (missingContractPolicies.length > 0) {
      throw new Error(
        `Element kind(s) ${[...new Set(missingContractPolicies)].sort().join(', ')} require an explicit contract policy in OPSX languageVersion '1'`
      );
    }
    const parsed = await readV1(contents, metamodel);
    return {
      source: 'likec4', files, profile: 'v1', languageVersion, metamodel,
      elements: parsed.elements, domains: [], capabilities: [], relations: parsed.relations,
    };
  }

  const parsed = contents.map(parseLikeC4Domain);
  return {
    source: 'likec4', files, profile: 'legacy', languageVersion: null, metamodel,
    elements: [],
    domains: parsed.flatMap(item => item.domains),
    capabilities: parsed.flatMap(item => item.capabilities),
    relations: parsed.flatMap(item => item.relations),
  };
}
