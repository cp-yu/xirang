import type { LikeC4Domain } from '../converters/types.js';
import { indent, quoteLikeC4 } from './formatting-utils.js';

function metadata(entries: Array<[string, string | string[] | undefined]>): string {
  const values = entries.filter((entry): entry is [string, string | string[]] => entry[1] !== undefined);
  if (!values.length) return '';
  const lines = values.map(([key, value]) => `${key} ${Array.isArray(value) ? `[${value.map(quoteLikeC4).join(', ')}]` : quoteLikeC4(value)}`);
  return `\nmetadata {\n${indent(lines.join('\n'))}\n}`;
}

export function generateDomainFile(domain: LikeC4Domain): string {
  const capabilities = domain.capabilities.map(capability => {
    const body = [
      capability.description ? `description ${quoteLikeC4(capability.description)}` : '',
      metadata([
        ['capabilityId', capability.metadata.capabilityId],
        ['status', capability.metadata.status],
        ['specs', capability.metadata.specs],
      ]).trim(),
    ].filter(Boolean).join('\n');
    return `${capability.elementId} = capability ${quoteLikeC4(capability.title)} {\n${indent(body)}\n}`;
  });
  const domainBody = [
    domain.description ? `description ${quoteLikeC4(domain.description)}` : '',
    metadata([['boundary', domain.metadata.boundary], ['status', domain.metadata.status]]).trim(),
    ...capabilities,
  ].filter(Boolean).join('\n\n');
  return `model {\n  ${domain.elementId} = domain ${quoteLikeC4(domain.title)} {\n${indent(domainBody, 4)}\n  }\n}\n`;
}
