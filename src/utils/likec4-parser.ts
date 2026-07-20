export interface ArchitectureDomain { id: string; title: string; description?: string; boundary?: string; status?: string }
export interface ArchitectureCapability { id: string; title: string; description?: string; capabilityId?: string; status?: string; specs: string[]; domain?: string }
export interface ArchitectureRelation { source: string; target: string; kind: string; description?: string }

function unquote(value: string): string {
  return value.replaceAll("\\'", "'").replaceAll('\\n', '\n').replaceAll('\\\\', '\\');
}

function blockAt(content: string, openBrace: number): { body: string; end: number } {
  let depth = 0;
  let quote = false;
  for (let index = openBrace; index < content.length; index += 1) {
    const char = content[index];
    if (char === "'" && content[index - 1] !== '\\') quote = !quote;
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
