import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { LikeC4Model } from './converters/types.js';
import { readLikeC4Architecture } from '../utils/likec4-reader.js';

export interface MigrationVerificationReport {
  skill: 'openspec-verify-migration';
  valid: boolean;
  expected: { domains: number; capabilities: number; relations: number };
  actual: { domains: number; capabilities: number; relations: number };
  missing: { domains: string[]; capabilities: string[]; relations: string[] };
  metadataMismatches: string[];
}

export async function verifyMigration(projectRoot: string, model: LikeC4Model): Promise<MigrationVerificationReport> {
  const architecture = await readLikeC4Architecture(projectRoot);
  const actualDomains = new Map(architecture.domains.map(domain => [domain.id, domain]));
  const actualCapabilities = new Map(architecture.capabilities.map(capability => [capability.capabilityId, capability]));
  const actualRelations = new Map(architecture.relations.map(relation => [`${relation.source}|${relation.kind}|${relation.target}`, relation]));
  const expectedRelations = model.relations.map(relation => `${relation.source}|${relation.kind}|${relation.target}`);
  const metadataMismatches = [
    ...model.domains.flatMap(domain => {
      const actualDomain = actualDomains.get(domain.elementId);
      const domainIssues: string[] = [];
      if (actualDomain) {
        if (actualDomain.description !== domain.description) domainIssues.push(`${domain.id}: description`);
        if (actualDomain.boundary !== domain.metadata.boundary) domainIssues.push(`${domain.id}: boundary`);
        if (actualDomain.status !== domain.metadata.status) domainIssues.push(`${domain.id}: status`);
      }
      return [
        ...domainIssues,
        ...domain.capabilities.flatMap(capability => {
          const actual = actualCapabilities.get(capability.metadata.capabilityId);
          if (!actual) return [];
          const issues: string[] = [];
          if (actual.description !== capability.description) issues.push(`${capability.id}: description`);
          if (actual.status !== capability.metadata.status) issues.push(`${capability.id}: status`);
          if (JSON.stringify(actual.specs) !== JSON.stringify(capability.metadata.specs ?? [])) issues.push(`${capability.id}: specs`);
          return issues;
        }),
      ];
    }),
    ...model.relations.flatMap(relation => {
      const key = `${relation.source}|${relation.kind}|${relation.target}`;
      const actual = actualRelations.get(key);
      return actual && actual.description !== relation.description ? [`${key}: description`] : [];
    }),
  ];
  const missing = {
    domains: model.domains.filter(domain => !actualDomains.has(domain.elementId)).map(domain => domain.id),
    capabilities: model.domains.flatMap(domain => domain.capabilities)
      .filter(capability => !actualCapabilities.has(capability.metadata.capabilityId))
      .map(capability => capability.id),
    relations: expectedRelations.filter(relation => !actualRelations.has(relation)),
  };
  const report: MigrationVerificationReport = {
    skill: 'openspec-verify-migration',
    valid: !missing.domains.length && !missing.capabilities.length && !missing.relations.length && !metadataMismatches.length,
    expected: {
      domains: model.domains.length,
      capabilities: model.domains.reduce((total, domain) => total + domain.capabilities.length, 0),
      relations: model.relations.length,
    },
    actual: {
      domains: architecture.domains.length,
      capabilities: architecture.capabilities.length,
      relations: architecture.relations.length,
    },
    missing,
    metadataMismatches,
  };
  await fs.writeFile(
    path.join(projectRoot, 'openspec', 'architecture', 'migration-report.json'),
    `${JSON.stringify(report, null, 2)}\n`
  );
  return report;
}
