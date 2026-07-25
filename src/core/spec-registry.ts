import { XIRANG_DIR_NAME } from './config.js';
import { promises as fs } from 'fs';
import path from 'path';
import {
  parseSpecFrontmatter,
  type SpecFrontmatterIssue,
} from './parsers/spec-frontmatter.js';
import type { SemanticElement, SemanticMetamodel } from '../utils/semantic-model.js';

export interface SpecRegistry {
  elementToSpecs: Map<string, string[]>;
  specToElement: Map<string, string>;
  getSpecsForElement(elementId: string): string[];
  getElementForSpec(specId: string): string | null;
  getOrphanedSpecs(): string[];
  getIssuesForSpec(specId: string): SpecFrontmatterIssue[];
  getUncoveredRequiredElements(elements: SemanticElement[], metamodel: SemanticMetamodel): string[];
}

export async function buildSpecRegistry(projectRoot: string, specsDirectory?: string): Promise<SpecRegistry> {
  const specsDir = path.resolve(specsDirectory ?? path.join(projectRoot, XIRANG_DIR_NAME, 'specs'));
  const elementToSpecs = new Map<string, string[]>();
  const specToElement = new Map<string, string>();
  const issuesBySpec = new Map<string, SpecFrontmatterIssue[]>();
  const orphanedSpecs: string[] = [];

  let entries;
  try {
    entries = await fs.readdir(specsDir, { withFileTypes: true });
  } catch {
    return createRegistry(elementToSpecs, specToElement, orphanedSpecs, issuesBySpec);
  }

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (!entry.isDirectory()) continue;

    const specId = entry.name;
    const specPath = path.join(specsDir, specId, 'spec.md');
    let content: string;
    try {
      content = await fs.readFile(specPath, 'utf8');
    } catch {
      continue;
    }

    const frontmatter = parseSpecFrontmatter(content);
    if (frontmatter.issues) issuesBySpec.set(specId, frontmatter.issues);
    if (frontmatter.element === null) {
      orphanedSpecs.push(specId);
      continue;
    }

    specToElement.set(specId, frontmatter.element);
    const specs = elementToSpecs.get(frontmatter.element) ?? [];
    specs.push(specId);
    elementToSpecs.set(frontmatter.element, specs);
  }

  for (const specs of elementToSpecs.values()) specs.sort();
  orphanedSpecs.sort();
  return createRegistry(elementToSpecs, specToElement, orphanedSpecs, issuesBySpec);
}

function createRegistry(
  elementToSpecs: Map<string, string[]>,
  specToElement: Map<string, string>,
  orphanedSpecs: string[],
  issuesBySpec: Map<string, SpecFrontmatterIssue[]>,
): SpecRegistry {
  return {
    elementToSpecs,
    specToElement,
    getSpecsForElement(elementId) {
      return elementToSpecs.get(elementId) ?? [];
    },
    getElementForSpec(specId) {
      return specToElement.get(specId) ?? null;
    },
    getOrphanedSpecs() {
      return orphanedSpecs;
    },
    getIssuesForSpec(specId) {
      return issuesBySpec.get(specId) ?? [];
    },
    getUncoveredRequiredElements(elements, metamodel) {
      return elements
        .filter(element => metamodel.elements[element.kind]?.contractPolicy === 'required')
        .filter(element => !elementToSpecs.has(element.id))
        .map(element => element.id)
        .sort();
    },
  };
}
