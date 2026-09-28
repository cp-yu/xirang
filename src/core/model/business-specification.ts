import type { ModelDiagnostic, ModelElement } from './types.js';

export const BUSINESS_SPECIFICATION_SECTIONS = [
  'Scope and Non-goals',
  'Business Logic',
  'Edge Cases and Exception Handling',
  'Key Acceptance Cases',
] as const;

export function validateBusinessSpecification(element: ModelElement): ModelDiagnostic[] {
  const diagnostics: ModelDiagnostic[] = [];
  const add = (code: string, message: string): void => {
    diagnostics.push({
      level: 'ERROR', code, path: '', message,
      identity: element.declaration.identity, entity: 'element-declaration',
    });
  };
  const sections = new Map(element.sections.map(section => [section.name, section]));
  for (const name of BUSINESS_SPECIFICATION_SECTIONS) {
    const section = sections.get(name);
    if (!section) {
      add('MISSING_BUSINESS_SECTION', `Business Contract ${element.declaration.identity} requires Section "${name}"`);
    } else if (!section.body.trim()) {
      add('EMPTY_BUSINESS_SECTION', `Business Section "${name}" must have a non-empty body`);
    }
  }
  for (const section of element.sections) {
    if (section.name !== 'Key Acceptance Cases') {
      if (section.acceptanceCases.length) {
        add('MISPLACED_ACCEPTANCE_CASE', `Section "${section.name}" must place Acceptance Cases in "Key Acceptance Cases"`);
      }
      continue;
    }
    if (!section.acceptanceCases.length) {
      add('MISSING_KEY_ACCEPTANCE_CASE', 'Section "Key Acceptance Cases" requires at least one Acceptance Case');
    }
    for (const acceptanceCase of section.acceptanceCases) {
      if (!acceptanceCase.body.trim()) {
        add('EMPTY_KEY_ACCEPTANCE_CASE', `Acceptance Case "${acceptanceCase.name}" must have a non-empty body`);
      }
    }
  }
  return diagnostics;
}
