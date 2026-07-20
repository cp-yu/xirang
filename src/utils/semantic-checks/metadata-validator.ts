import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { LikeC4Architecture } from '../likec4-reader.js';
import type { ArchitectureIssue } from '../architecture-validator.js';

export async function validateMetadata(projectRoot: string, architecture: LikeC4Architecture): Promise<ArchitectureIssue[]> {
  const warnings: ArchitectureIssue[] = [];
  for (const capability of architecture.capabilities) {
    if (!capability.capabilityId) warnings.push({
      code: 'MISSING_CAPABILITY_ID', message: `Capability ${capability.id} missing capabilityId in metadata`, element: capability.id,
    });
    for (const spec of capability.specs) {
      try {
        await fs.access(path.join(projectRoot, spec));
      } catch {
        warnings.push({ code: 'SPEC_NOT_FOUND', message: `Spec file not found: ${spec}`, element: capability.id });
      }
    }
  }
  return warnings;
}
