import type { LikeC4Architecture } from '../likec4-reader.js';
import type { ArchitectureIssue } from '../architecture-validator.js';

export function validateOwnership(architecture: LikeC4Architecture): ArchitectureIssue[] {
  const domains = new Set(architecture.domains.map(domain => domain.id));
  const issues: ArchitectureIssue[] = architecture.capabilities.flatMap(capability => {
    if (!capability.domain || !domains.has(capability.domain)) {
      return [{ code: 'MISSING_OWNERSHIP', message: `Capability ${capability.id} has no domain (missing nesting)`, element: capability.id }];
    }
    return [];
  });
  const owners = new Map<string, Set<string>>();
  for (const capability of architecture.capabilities) {
    if (!capability.capabilityId || !capability.domain) continue;
    const domains = owners.get(capability.capabilityId) ?? new Set<string>();
    domains.add(capability.domain);
    owners.set(capability.capabilityId, domains);
  }
  for (const [capabilityId, domains] of owners) {
    if (domains.size > 1) issues.push({
      code: 'MULTIPLE_OWNERSHIP',
      message: `Capability ${capabilityId} belongs to multiple domains`,
      element: capabilityId,
    });
  }
  return issues;
}
