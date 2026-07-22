import type { ContractPolicy, SemanticElementKind, SemanticMetamodel, SemanticRelationshipKind } from './semantic-model.js';

export interface ArchitectureDomain { id: string; title: string; description?: string; boundary?: string; status?: string }
export interface ArchitectureCapability { id: string; title: string; description?: string; capabilityId?: string; status?: string; specs: string[]; domain?: string }
export interface ArchitectureRelation { source: string; target: string; kind: string; description?: string }

export interface ParsedOpsxProfile {
  languageVersion: string | null;
  metamodel: SemanticMetamodel;
  declaredElementContractPolicies: Record<string, ContractPolicy | null>;
  source: string;
}

function unquote(value: string): string {
  return value.replaceAll("\\'", "'").replaceAll('\\n', '\n').replaceAll('\\\\', '\\');
}

function blockAt(content: string, openBrace: number): { body: string; end: number } {
  let depth = 0;
  let quote: "'" | '"' | null = null;
  for (let index = openBrace; index < content.length; index += 1) {
    const char = content[index];
    if ((char === "'" || char === '"') && content[index - 1] !== '\\') {
      quote = quote === char ? null : quote ?? char;
      continue;
    }
    if (quote) continue;
    if (char === '{') depth += 1;
    if (char === '}' && --depth === 0) return { body: content.slice(openBrace + 1, index), end: index };
  }
  throw new Error('Unclosed LikeC4 block');
}

function property(body: string, name: string): string | undefined {
  const match = body.match(new RegExp(`(?:^|\\n)\\s*${name}\\s+'((?:\\\\'|[^'])*)'`));
  return match ? unquote(match[1]) : undefined;
}

function metadata(body: string): Record<string, string | string[]> {
  const start = body.search(/\bmetadata\s*\{/);
  if (start < 0) return {};
  const open = body.indexOf('{', start);
  const values: Record<string, string | string[]> = {};
  const source = blockAt(body, open).body;
  for (const match of source.matchAll(/([\w-]+)\s+(?:'((?:\\'|[^'])*)'|\[([^\]]*)\])/g)) {
    values[match[1]] = match[2] !== undefined
      ? unquote(match[2])
      : [...match[3].matchAll(/'((?:\\'|[^'])*)'/g)].map(item => unquote(item[1]));
  }
  return values;
}

function annotationBlock(body: string): string | undefined {
  const match = /\bopsx\s*\{/.exec(body);
  if (!match) return undefined;
  return blockAt(body, body.indexOf('{', match.index)).body;
}

function kindList(body: string, key: string): string[] | undefined {
  const match = body.match(new RegExp(`\\b${key}\\s*\\[([^\\]]*)\\]`));
  if (!match) return undefined;
  return match[1].split(',').map(value => value.trim()).filter(Boolean);
}

function declaredContractPolicy(body: string): ContractPolicy | null {
  const contract = annotationBlock(body)?.match(/\bcontract\s+(required|optional)\b/)?.[1];
  return contract === 'required' || contract === 'optional' ? contract : null;
}

function elementAnnotation(body: string): SemanticElementKind {
  const annotation = annotationBlock(body) ?? '';
  const root = annotation.match(/\broot\s+(true|false)\b/)?.[1];
  const contractPolicy = declaredContractPolicy(body);
  return {
    ...(contractPolicy ? { contractPolicy } : {}),
    ...(root === 'true' ? { root: true } : {}),
    ...(kindList(annotation, 'parents') ? { parents: kindList(annotation, 'parents') } : {}),
    ...(kindList(annotation, 'children') ? { children: kindList(annotation, 'children') } : {}),
  };
}

function relationshipAnnotation(body: string): SemanticRelationshipKind {
  const annotation = annotationBlock(body) ?? '';
  return {
    ...(kindList(annotation, 'sourceKinds') ? { sourceKinds: kindList(annotation, 'sourceKinds') } : {}),
    ...(kindList(annotation, 'targetKinds') ? { targetKinds: kindList(annotation, 'targetKinds') } : {}),
  };
}

function replaceRangesWithWhitespace(content: string, ranges: Array<[number, number]>): string {
  const chars = content.split('');
  for (const [start, end] of ranges) {
    for (let index = start; index <= end; index += 1) {
      if (chars[index] !== '\n' && chars[index] !== '\r') chars[index] = ' ';
    }
  }
  return chars.join('');
}

export function parseOpsxProfile(content: string): ParsedOpsxProfile {
  const metamodel: SemanticMetamodel = { elements: {}, relationships: {} };
  const declaredElementContractPolicies: Record<string, ContractPolicy | null> = {};
  const ranges: Array<[number, number]> = [];
  let languageVersion: string | null = null;

  for (const match of content.matchAll(/\bopsx\s*\{/g)) {
    const open = content.indexOf('{', match.index);
    const block = blockAt(content, open);
    ranges.push([match.index, block.end]);
    const version = block.body.match(/\blanguageVersion\s+['"]([^'"]+)['"]/);
    if (version) languageVersion = version[1];
  }

  for (const specification of content.matchAll(/\bspecification\s*\{/g)) {
    const specificationBlock = blockAt(content, content.indexOf('{', specification.index));
    for (const match of specificationBlock.body.matchAll(/\belement\s+([A-Za-z_][\w-]*)\s*(\{)?/g)) {
      if (!match[2]) {
        metamodel.elements[match[1]] = {};
        declaredElementContractPolicies[match[1]] = null;
        continue;
      }
      const body = blockAt(specificationBlock.body, match.index + match[0].lastIndexOf('{')).body;
      metamodel.elements[match[1]] = elementAnnotation(body);
      declaredElementContractPolicies[match[1]] = declaredContractPolicy(body);
    }
    for (const match of specificationBlock.body.matchAll(/\brelationship\s+([A-Za-z_][\w-]*)\s*(\{)?/g)) {
      const body = match[2] ? blockAt(specificationBlock.body, match.index + match[0].lastIndexOf('{')).body : '';
      metamodel.relationships[match[1]] = relationshipAnnotation(body);
    }
  }

  return { languageVersion, metamodel, declaredElementContractPolicies, source: replaceRangesWithWhitespace(content, ranges) };
}

export function parseLikeC4Domain(content: string): { domains: ArchitectureDomain[]; capabilities: ArchitectureCapability[]; relations: ArchitectureRelation[] } {
  const domains: ArchitectureDomain[] = [];
  const capabilities: ArchitectureCapability[] = [];
  const domainRanges: Array<[number, number]> = [];
  const domainPattern = /([A-Za-z_][\w-]*)\s*=\s*domain\s+'((?:\\'|[^'])*)'(\s*\{)?/g;
  for (const match of content.matchAll(domainPattern)) {
    const domainBlock = match[3]
      ? blockAt(content, match.index + match[0].lastIndexOf('{'))
      : null;
    const block = domainBlock?.body ?? '';
    if (domainBlock) domainRanges.push([match.index, domainBlock.end]);
    const domain = match[1];
    const domainMetadata = metadata(block);
    domains.push({
      id: domain,
      title: unquote(match[2]),
      ...(property(block, 'description') ? { description: property(block, 'description') } : {}),
      ...(typeof domainMetadata.boundary === 'string' ? { boundary: domainMetadata.boundary } : {}),
      ...(typeof domainMetadata.status === 'string' ? { status: domainMetadata.status } : {}),
    });
    const capabilityPattern = /([A-Za-z_][\w-]*)\s*=\s*capability\s+'((?:\\'|[^'])*)'(\s*\{)?/g;
    for (const capability of block.matchAll(capabilityPattern)) {
      const body = capability[3]
        ? blockAt(block, capability.index + capability[0].lastIndexOf('{')).body
        : '';
      const meta = metadata(body);
      capabilities.push({
        id: `${domain}.${capability[1]}`,
        title: unquote(capability[2]),
        domain,
        specs: Array.isArray(meta.specs) ? meta.specs : [],
        ...(typeof meta.capabilityId === 'string' ? { capabilityId: meta.capabilityId } : {}),
        ...(typeof meta.status === 'string' ? { status: meta.status } : {}),
        ...(property(body, 'description') ? { description: property(body, 'description') } : {}),
      });
    }
  }
  const orphanPattern = /([A-Za-z_][\w-]*)\s*=\s*capability\s+'((?:\\'|[^'])*)'(\s*\{)?/g;
  for (const capability of content.matchAll(orphanPattern)) {
    if (domainRanges.some(([start, end]) => capability.index >= start && capability.index <= end)) continue;
    const body = capability[3]
      ? blockAt(content, capability.index + capability[0].lastIndexOf('{')).body
      : '';
    const meta = metadata(body);
    capabilities.push({
      id: capability[1], title: unquote(capability[2]), specs: Array.isArray(meta.specs) ? meta.specs : [],
      ...(typeof meta.capabilityId === 'string' ? { capabilityId: meta.capabilityId } : {}),
      ...(typeof meta.status === 'string' ? { status: meta.status } : {}),
      ...(property(body, 'description') ? { description: property(body, 'description') } : {}),
    });
  }
  const relations = [...content.matchAll(/([A-Za-z_][\w.-]*)\s+-\[([\w-]+)\]->\s+([A-Za-z_][\w.-]*)(?:\s*\{([\s\S]*?)\})?/g)].map(match => ({
    source: match[1], target: match[3], kind: match[2],
    ...(match[4] && property(match[4], 'description') ? { description: property(match[4], 'description') } : {}),
  }));
  return { domains, capabilities, relations };
}
