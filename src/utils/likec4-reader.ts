import { OPSX_DIR_NAME } from '../core/config.js';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { parseLikeC4Domain, type ArchitectureCapability, type ArchitectureDomain, type ArchitectureRelation } from './likec4-parser.js';

export interface LikeC4Architecture {
  source: 'likec4';
  files: string[];
  domains: ArchitectureDomain[];
  capabilities: ArchitectureCapability[];
  relations: ArchitectureRelation[];
}

export async function readLikeC4Architecture(projectRoot: string): Promise<LikeC4Architecture> {
  const architecture = path.join(projectRoot, OPSX_DIR_NAME, 'architecture');
  const domainsDir = path.join(architecture, 'domains');
  const domainNames = (await fs.readdir(domainsDir)).filter(name => name.endsWith('.c4')).sort();
  const rootNames = (await fs.readdir(architecture)).filter(name => name.endsWith('.c4')).sort();
  const files = [
    ...rootNames.map(name => path.join(architecture, name)),
    ...domainNames.map(name => path.join(domainsDir, name)),
  ];
  const parsed = await Promise.all(files.map(async file => parseLikeC4Domain(await fs.readFile(file, 'utf8'))));
  return {
    source: 'likec4', files,
    domains: parsed.flatMap(item => item.domains),
    capabilities: parsed.flatMap(item => item.capabilities),
    relations: parsed.flatMap(item => item.relations),
  };
}
