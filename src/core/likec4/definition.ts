import type { ElementDeclaration, SemanticModel } from '../model/types.js';

const EXCERPT_LIMIT = 120;

export interface BrowserElementDeclaration extends ElementDeclaration {
  summary: string;
  description: string;
}

export interface BrowserSemanticModel extends Omit<SemanticModel, 'elements'> {
  elements: Array<SemanticModel['elements'][number] & { declaration: BrowserElementDeclaration }>;
}

export function definitionExcerpt(definition: string): string {
  const firstParagraph = definition.trim().split(/\n\s*\n/, 1)[0] ?? '';
  const normalized = firstParagraph.replace(/\s+/gu, ' ').trim();
  const codePoints = [...normalized];
  return codePoints.length <= EXCERPT_LIMIT
    ? normalized
    : `${codePoints.slice(0, EXCERPT_LIMIT).join('')}...`;
}

export function projectBrowserDeclaration(declaration: ElementDeclaration): BrowserElementDeclaration {
  return {
    ...declaration,
    summary: definitionExcerpt(declaration.definition),
    description: declaration.definition,
  };
}

export function projectBrowserArchitecture(model: SemanticModel): BrowserSemanticModel {
  return {
    ...model,
    elements: model.elements.map(element => ({
      ...element,
      declaration: projectBrowserDeclaration(element.declaration),
    })),
  };
}
