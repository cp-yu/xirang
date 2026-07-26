import { XIRANG_DIR_NAME } from './config.js';
import { promises as fs } from 'fs';
import path from 'path';
import {
  parseSpecFrontmatter,
  type SpecFrontmatterIssue,
} from './parsers/spec-frontmatter.js';
import type { SemanticElement, SemanticMetamodel } from '../utils/semantic-model.js';
import { compareCodePoints } from '../utils/stable-order.js';

export interface SpecRegistryDiagnostic {
  specId: string;
  code: SpecFrontmatterIssue['code'] | 'MISSING_SPEC_OWNER' | 'READ_FAILED';
  message: string;
}

export interface SpecSource {
  readonly specId: string;
  readonly path: string;
  readonly content: string;
}

export interface SpecRegistry {
  elementToSpecs: Map<string, string[]>;
  specToElement: Map<string, string>;
  getSpecsForElement(elementId: string): string[];
  getElementForSpec(specId: string): string | null;
  getSpecSource(specId: string): SpecSource | null;
  getOrphanedSpecs(): string[];
  getIssuesForSpec(specId: string): SpecFrontmatterIssue[];
  getDiagnostics(): SpecRegistryDiagnostic[];
  getUncoveredRequiredElements(elements: SemanticElement[], metamodel: SemanticMetamodel): string[];
}

export async function buildSpecRegistry(projectRoot: string, specsDirectory?: string): Promise<SpecRegistry> {
  const specsDir = path.resolve(specsDirectory ?? path.join(projectRoot, XIRANG_DIR_NAME, 'specs'));
  const elementToSpecs = new Map<string, string[]>();
  const specToElement = new Map<string, string>();
  const specSources = new Map<string, SpecSource>();
  const issuesBySpec = new Map<string, SpecFrontmatterIssue[]>();
  const diagnostics: SpecRegistryDiagnostic[] = [];
  const orphanedSpecs: string[] = [];

  let entries;
  try {
    entries = await fs.readdir(specsDir, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      diagnostics.push({
        specId: '<registry>',
        code: 'READ_FAILED',
        message: error instanceof Error ? error.message : String(error),
      });
    }
    return createRegistry(elementToSpecs, specToElement, specSources, orphanedSpecs, issuesBySpec, diagnostics);
  }

  for (const entry of entries.sort((left, right) => compareCodePoints(left.name, right.name))) {
    if (!entry.isDirectory()) continue;

    const specId = entry.name;
    const specPath = path.join(specsDir, specId, 'spec.md');
    let content: string;
    try {
      content = await fs.readFile(specPath, 'utf8');
    } catch (error) {
      diagnostics.push({
        specId,
        code: 'READ_FAILED',
        message: error instanceof Error ? error.message : String(error),
      });
      continue;
    }

    specSources.set(specId, Object.freeze({
      specId,
      path: path.relative(projectRoot, specPath).split(path.sep).join('/'),
      content,
    }));

    const frontmatter = parseSpecFrontmatter(content);
    if (frontmatter.issues) {
      issuesBySpec.set(specId, frontmatter.issues);
      diagnostics.push(...frontmatter.issues.map(issue => ({ specId, code: issue.code, message: issue.message })));
    }
    if (frontmatter.element === null) {
      orphanedSpecs.push(specId);
      if (!frontmatter.issues) {
        diagnostics.push({
          specId,
          code: 'MISSING_SPEC_OWNER',
          message: 'Spec frontmatter must declare one element owner',
        });
      }
      continue;
    }

    specToElement.set(specId, frontmatter.element);
    const specs = elementToSpecs.get(frontmatter.element) ?? [];
    specs.push(specId);
    elementToSpecs.set(frontmatter.element, specs);
  }

  for (const specs of elementToSpecs.values()) specs.sort(compareCodePoints);
  orphanedSpecs.sort(compareCodePoints);
  diagnostics.sort((left, right) => compareCodePoints(left.specId, right.specId)
    || compareCodePoints(left.code, right.code)
    || compareCodePoints(left.message, right.message));
  return createRegistry(elementToSpecs, specToElement, specSources, orphanedSpecs, issuesBySpec, diagnostics);
}

function createRegistry(
  elementToSpecs: Map<string, string[]>,
  specToElement: Map<string, string>,
  specSources: Map<string, SpecSource>,
  orphanedSpecs: string[],
  issuesBySpec: Map<string, SpecFrontmatterIssue[]>,
  diagnostics: SpecRegistryDiagnostic[],
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
    getSpecSource(specId) {
      return specSources.get(specId) ?? null;
    },
    getOrphanedSpecs() {
      return orphanedSpecs;
    },
    getIssuesForSpec(specId) {
      return issuesBySpec.get(specId) ?? [];
    },
    getDiagnostics() {
      return diagnostics;
    },
    getUncoveredRequiredElements(elements, metamodel) {
      return elements
        .filter(element => metamodel.elements[element.kind]?.contractPolicy === 'required')
        .filter(element => !elementToSpecs.has(element.id))
        .map(element => element.id)
        .sort(compareCodePoints);
    },
  };
}
