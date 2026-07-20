import { readProjectOpsx } from '../../utils/opsx-utils.js';
import { mapDomains } from './element-mapper.js';
import { mapRelations } from './relation-mapper.js';
import { inferSpecPaths } from '../utils/spec-path-inference.js';
import type { LikeC4Model } from './types.js';

export async function convertOpsxToLikeC4(projectRoot: string): Promise<LikeC4Model> {
  const bundle = await readProjectOpsx(projectRoot);
  if (!bundle) throw new Error('OPSX project model not found');
  const domains = mapDomains(bundle);
  await Promise.all(domains.flatMap(domain => domain.capabilities.map(async capability => {
    const specs = await inferSpecPaths(projectRoot, capability.id);
    if (specs.length) capability.metadata.specs = specs;
  })));
  return { project: bundle.project, domains, relations: mapRelations(bundle, domains) };
}
