import { describe, expect, it } from 'vitest';
import { validateArchitecture } from '../../../src/utils/architecture-validator.js';
import { validateSemanticModel } from '../../../src/core/model/validator.js';
import { parseSemanticModelFiles } from '../../../src/core/model/parser.js';
import type { ModelDiagnostic } from '../../../src/core/model/types.js';

function report(files: Record<string, string>) {
  const parsed = parseSemanticModelFiles(Object.entries(files));
  return validateArchitecture([...parsed.diagnostics, ...validateSemanticModel(parsed.model)]);
}

const ROOT_KIND = '---\nentity: element-kind\nidentity: project\ncontract: optional\nroot: true\n---\n';
const CAPABILITY_KIND = '---\nentity: element-kind\nidentity: capability\ncontract: optional\n---\n';
const ROOT = '---\nentity: element-declaration\nidentity: root\nkind: project\nparent: null\ntitle: Root\nsummary: S\n---\n';

function element(identity: string, parent = 'root', kind = 'capability'): string {
  return `---\nentity: element-declaration\nidentity: ${identity}\nkind: ${kind}\nparent: ${parent}\ntitle: T\nsummary: S\n---\n`;
}

describe('architecture validator', () => {
  it('projects Semantic Model diagnostics onto the architecture report shape', () => {
    const diagnostics: ModelDiagnostic[] = [
      { level: 'ERROR', code: 'E1', path: 'elements/a.md', message: 'broken', identity: 'a' },
      { level: 'WARNING', code: 'W1', path: '', message: 'note' },
    ];
    expect(validateArchitecture(diagnostics)).toEqual({
      success: false,
      errors: [{ code: 'E1', message: 'broken', element: 'a' }],
      warnings: [{ code: 'W1', message: 'note' }],
    });
  });

  it('accepts one Project Root with arbitrary-depth single-parent containment', () => {
    const result = report({
      'metamodel/project.md': ROOT_KIND,
      'metamodel/capability.md': CAPABILITY_KIND,
      'elements/root.md': ROOT,
      'elements/a.md': element('a'),
      'elements/b.md': element('b', 'a'),
    });
    expect(result).toEqual({ success: true, errors: [], warnings: [] });
  });

  it('rejects missing and multiple Project Roots', () => {
    expect(report({
      'metamodel/project.md': ROOT_KIND,
      'metamodel/capability.md': CAPABILITY_KIND,
      'elements/a.md': element('a', 'null'),
    }).errors.map(item => item.code)).toContain('MISSING_PROJECT_ROOT');

    expect(report({
      'metamodel/project.md': ROOT_KIND,
      'elements/root.md': ROOT,
      'elements/root2.md': element('root2', 'null', 'project'),
    }).errors.map(item => item.code)).toContain('MULTIPLE_PROJECT_ROOTS');
  });

  it('rejects containment cycles and unknown parents', () => {
    const cycle = report({
      'metamodel/project.md': ROOT_KIND,
      'metamodel/capability.md': CAPABILITY_KIND,
      'elements/root.md': ROOT,
      'elements/a.md': element('a', 'b'),
      'elements/b.md': element('b', 'a'),
    });
    expect(cycle.errors.map(item => item.code)).toContain('CONTAINMENT_CYCLE');

    const missing = report({
      'metamodel/project.md': ROOT_KIND,
      'metamodel/capability.md': CAPABILITY_KIND,
      'elements/root.md': ROOT,
      'elements/a.md': element('a', 'ghost'),
    });
    expect(missing.errors.map(item => item.code)).toContain('MISSING_PARENT');
  });

  it('rejects duplicate identities and unresolved relationship endpoints', () => {
    const result = report({
      'metamodel/project.md': ROOT_KIND,
      'metamodel/capability.md': CAPABILITY_KIND,
      'metamodel/invokes.md': '---\nentity: relationship-kind\nidentity: invokes\n---\n',
      'elements/root.md': ROOT,
      'elements/a.md': element('a'),
      'relationships/invokes.yaml': 'relationships:\n  - source: a\n    kind: invokes\n    target: ghost\n',
    });
    expect(result.errors.map(item => item.code)).toContain('INVALID_RELATION_ENDPOINT');
  });

  it('rejects an Element Kind without an explicit contract', () => {
    const result = report({
      'metamodel/project.md': ROOT_KIND,
      'metamodel/capability.md': '---\nentity: element-kind\nidentity: capability\n---\n',
      'elements/root.md': ROOT,
      'elements/a.md': element('a'),
    });
    expect(result.errors.map(item => item.code)).toContain('MISSING_CONTRACT');
  });

  it('rejects an Element that omits a required Contract', () => {
    const result = report({
      'metamodel/project.md': ROOT_KIND,
      'metamodel/capability.md': '---\nentity: element-kind\nidentity: capability\ncontract: required\n---\n',
      'elements/root.md': ROOT,
      'elements/a.md': element('a'),
    });
    expect(result.errors.map(item => item.code)).toContain('MISSING_REQUIRED_CONTRACT');
  });

  it('rejects containment that violates declared Element Kind constraints', () => {
    const result = report({
      'metamodel/project.md': ROOT_KIND,
      'metamodel/capability.md': '---\nentity: element-kind\nidentity: capability\ncontract: optional\nparents:\n  - capability\n---\n',
      'elements/root.md': ROOT,
      'elements/a.md': element('a'),
    });
    expect(result.errors.map(item => item.code)).toContain('INVALID_CONTAINMENT');
  });
});
