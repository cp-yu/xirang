import path from 'node:path';
import { realpathSync } from 'node:fs';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { serializeContract } from './model/serializer.js';
import type { SemanticModel } from './model/types.js';

export interface ContractLink {
  href: string;
  element?: string;
  fragment?: string;
  external?: true;
}

export type ContractOrigin = (element: string, section: string) => string | undefined;

const parser = unified().use(remarkParse).use(remarkGfm);

/** Ordered rendered link occurrences, including reference-style links; code and images are excluded. */
function links(markdown: string): Array<{ href: string; offset: number }> {
  const tree = parser.parse(markdown);
  const definitions = new Map<string, string>();
  const collect = (node: typeof tree.children[number] | typeof tree): void => {
    if (node.type === 'definition' && !definitions.has(node.identifier)) definitions.set(node.identifier, node.url);
    if ('children' in node) node.children.forEach(collect);
  };
  collect(tree);
  const result: Array<{ href: string; offset: number }> = [];
  const visit = (node: typeof tree.children[number] | typeof tree): void => {
    if (node.type === 'link') result.push({ href: node.url, offset: node.position?.start.offset ?? 0 });
    if (node.type === 'linkReference') {
      const url = definitions.get(node.identifier);
      if (url !== undefined) result.push({ href: url, offset: node.position?.start.offset ?? 0 });
    }
    if ('children' in node) node.children.forEach(visit);
  };
  visit(tree);
  return result;
}

export function projectContractLinks(
  model: SemanticModel,
  origin: ContractOrigin,
  units: ReadonlyMap<string, string>,
): Record<string, ContractLink[]> {
  // Only probe aliases of an already loaded unit, preserving the filesystem's case rules.
  const folded = new Map<string, string[]>();
  for (const file of units.keys()) folded.set(file.toLowerCase(), [...(folded.get(file.toLowerCase()) ?? []), file]);
  const lookup = (file: string): string | undefined => {
    const exact = units.get(file);
    if (exact) return exact;
    for (const managed of folded.get(file.toLowerCase()) ?? []) {
      try {
        if (realpathSync.native(file) === realpathSync.native(managed)) return units.get(managed);
      } catch { /* An absent alias is unresolved on this filesystem. */ }
    }
    return undefined;
  };
  const readable = new Set(model.elements.filter(e => e.sections.length > 0).map(e => e.declaration.identity));
  const result: Record<string, ContractLink[]> = {};
  for (const element of model.elements) {
    if (!readable.has(element.declaration.identity)) continue;
    const identity = element.declaration.identity;
    const markdown = serializeContract(element);
    const prefixLength = '## Specification\n\n'.length;
    let cursor = prefixLength;
    const sections = element.sections.map(section => {
      const offset = cursor;
      cursor += serializeContract({ ...element, sections: [section] }).length - prefixLength + 2;
      return { name: section.name, offset };
    });
    result[identity] = links(markdown).map(({ href, offset }) => {
      const section = [...sections].reverse().find(s => s.offset <= offset);
      const source = section ? origin(identity, section.name) : undefined;
      if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href)) return { href, external: true as const };
      try {
        const hash = href.indexOf('#');
        const document = hash < 0 ? href : href.slice(0, hash);
        const fragment = hash < 0 ? '' : decodeURIComponent(href.slice(hash + 1));
        const target = document === '' ? identity : source
          ? lookup(path.resolve(path.dirname(source), decodeURIComponent(document)))
          : undefined;
        return { href, ...(target && readable.has(target) ? { element: target } : {}), ...(fragment ? { fragment } : {}) };
      } catch {
        return { href };
      }
    });
  }
  return result;
}
