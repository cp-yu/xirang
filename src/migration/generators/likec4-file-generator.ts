import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { LikeC4Model } from '../converters/types.js';
import { generateDomainFile } from './domain-file-generator.js';
import { generateSpecification } from './specification-generator.js';
import { generateProjectFile } from './project-file-generator.js';
import { generateRelationFile } from './relation-file-generator.js';
import { generateViews } from './views-generator.js';

export interface GeneratedLikeC4Files {
  specification: string;
  project: string;
  domains: string[];
  relations: string;
  views: string;
}

export interface RenderedLikeC4File {
  relativePath: string;
  content: string;
}

function domainFileName(elementId: string): string {
  return `${elementId.replaceAll('_', '-')}.c4`;
}

export function renderLikeC4Files(model: LikeC4Model): RenderedLikeC4File[] {
  return [
    { relativePath: 'specification.c4', content: generateSpecification() },
    { relativePath: 'project.c4', content: generateProjectFile(model) },
    ...model.domains.map(domain => ({
      relativePath: path.join('domains', domainFileName(domain.elementId)),
      content: generateDomainFile(domain),
    })),
    { relativePath: 'relations.c4', content: generateRelationFile(model) },
    { relativePath: 'views.c4', content: generateViews(model.project.name) },
  ];
}

export async function generateLikeC4Files(projectRoot: string, model: LikeC4Model): Promise<GeneratedLikeC4Files> {
  const architectureDir = path.join(projectRoot, 'openspec', 'architecture');
  const rendered = renderLikeC4Files(model);
  await Promise.all(rendered.map(async file => {
    const output = path.join(architectureDir, file.relativePath);
    await fs.mkdir(path.dirname(output), { recursive: true });
    await fs.writeFile(output, file.content);
  }));
  return {
    specification: path.join(architectureDir, 'specification.c4'),
    project: path.join(architectureDir, 'project.c4'),
    domains: model.domains.map(domain => path.join(architectureDir, 'domains', domainFileName(domain.elementId))),
    relations: path.join(architectureDir, 'relations.c4'),
    views: path.join(architectureDir, 'views.c4'),
  };
}
