import { describe, expect, it } from 'vitest';
import { validateArchitecture } from '../../../src/utils/architecture-validator.js';
import { validateSemanticModel } from '../../../src/core/model/validator.js';
import { parseSemanticModelFiles } from '../../../src/core/model/parser.js';
import type { ModelDiagnostic } from '../../../src/core/model/types.js';

function report(files: Record<string, string>) {
  const managed = {
    'metamodel/domain.md': '---\nentity: element-kind\nidentity: domain\ncontract: optional\n---\n',
    'metamodel/capability.md': CAPABILITY_KIND,
  };
  const parsed = parseSemanticModelFiles(Object.entries({ ...managed, ...files }));
  return validateArchitecture([...parsed.diagnostics, ...validateSemanticModel(parsed.model)]);
}

const ROOT_KIND = '---\nentity: element-kind\nidentity: project\ncontract: optional\nroot: true\n---\n';
const CAPABILITY_KIND = '---\nentity: element-kind\nidentity: capability\ncontract: optional\n---\n';
const ROOT = '---\nentity: element-declaration\nidentity: root\nkind: project\nparent: null\ntitle: Root\ndefinition: S\n---\n';

function element(identity: string, parent = 'root', kind = 'capability', contract = ''): string {
  return `---\nentity: element-declaration\nidentity: ${identity}\nkind: ${kind}\nparent: ${parent}\ntitle: T\ndefinition: S\n---\n${contract}`;
}

function requirements(...blocks: string[]): string {
  return `\n## Requirements\n\n${blocks.join('\n\n')}\n`;
}

function requirement(name: string, scenarios: string[] = ['S']): string {
  return `### Requirement: ${name}\n\nBody.\n${scenarios.map(scenario => `\n#### Scenario: ${scenario}\n\n- **WHEN** condition\n- **THEN** result`).join('')}`;
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

  it('rejects duplicate Requirement and Scenario names within their hosts', () => {
    const duplicateRequirements = report({
      'metamodel/project.md': ROOT_KIND,
      'metamodel/capability.md': CAPABILITY_KIND,
      'elements/root.md': ROOT,
      'elements/a.md': element('a', 'root', 'capability', requirements(requirement('R'), requirement('R'))),
    });
    expect(duplicateRequirements.errors.map(item => item.code)).toContain('DUPLICATE_REQUIREMENT_NAME');

    const duplicateScenarios = report({
      'metamodel/project.md': ROOT_KIND,
      'metamodel/capability.md': CAPABILITY_KIND,
      'elements/root.md': ROOT,
      'elements/a.md': element('a', 'root', 'capability', requirements(requirement('R', ['S', 'S']))),
    });
    expect(duplicateScenarios.errors.map(item => item.code)).toContain('DUPLICATE_SCENARIO_NAME');
  });

  it('requires every Requirement to contain a Scenario', () => {
    const result = report({
      'metamodel/project.md': ROOT_KIND,
      'metamodel/capability.md': CAPABILITY_KIND,
      'elements/root.md': ROOT,
      'elements/a.md': element('a', 'root', 'capability', requirements(requirement('R', []))),
    });
    expect(result.errors.map(item => item.code)).toContain('MISSING_REQUIREMENT_SCENARIO');
  });

  it('requires declared Element and Relationship Kinds', () => {
    const result = report({
      'metamodel/project.md': ROOT_KIND,
      'elements/root.md': ROOT,
      'elements/a.md': element('a', 'root', 'missing-kind'),
      'relationships/unknown.yaml': 'relationships:\n  - source: root\n    kind: missing-relation-kind\n    target: a\n',
    });
    expect(result.errors.map(item => item.code)).toEqual(expect.arrayContaining([
      'UNDECLARED_ELEMENT_KIND',
      'UNDECLARED_RELATIONSHIP_KIND',
    ]));
  });

  it('reports undeclared Relationship Kinds independently from unresolved endpoints', () => {
    const result = report({
      'metamodel/project.md': ROOT_KIND,
      'elements/root.md': ROOT,
      'relationships/unknown.yaml': 'relationships:\n  - source: root\n    kind: missing-relation-kind\n    target: ghost\n',
    });

    expect(result.errors.map(item => item.code)).toEqual(expect.arrayContaining([
      'INVALID_RELATION_ENDPOINT',
      'UNDECLARED_RELATIONSHIP_KIND',
    ]));
  });

  it('requires every Kind constraint reference to resolve without requiring symmetry', () => {
    const unresolved = report({
      'metamodel/project.md': ROOT_KIND,
      'metamodel/capability.md': '---\nentity: element-kind\nidentity: capability\ncontract: optional\nparents:\n  - missing-parent-kind\nchildren:\n  - missing-child-kind\n---\n',
      'metamodel/invokes.md': '---\nentity: relationship-kind\nidentity: invokes\nsourceKinds:\n  - missing-source-kind\ntargetKinds:\n  - missing-target-kind\n---\n',
      'elements/root.md': ROOT,
    });
    expect(unresolved.errors.filter(item => item.code === 'UNRESOLVED_KIND_REFERENCE')).toHaveLength(4);

    const asymmetric = report({
      'metamodel/project.md': ROOT_KIND,
      'metamodel/capability.md': '---\nentity: element-kind\nidentity: capability\ncontract: optional\nparents:\n  - project\n---\n',
      'elements/root.md': ROOT,
      'elements/a.md': element('a'),
    });
    expect(asymmetric.errors.map(item => item.code)).not.toContain('UNRESOLVED_KIND_REFERENCE');
  });

  it('requires Authored View element references to resolve except include star', () => {
    const unresolved = report({
      'metamodel/project.md': ROOT_KIND,
      'elements/root.md': ROOT,
      'views/missing.md': '---\nentity: authored-view\nidentity: missing\nof: ghost\ninclude:\n  - root\n  - absent\n---\n',
    });
    expect(unresolved.errors.filter(item => item.code === 'UNRESOLVED_VIEW_REFERENCE')).toHaveLength(2);

    const wildcard = report({
      'metamodel/project.md': ROOT_KIND,
      'elements/root.md': ROOT,
      'views/all.md': '---\nentity: authored-view\nidentity: all\ninclude: "*"\n---\n',
    });
    expect(wildcard.errors.map(item => item.code)).not.toContain('UNRESOLVED_VIEW_REFERENCE');
  });
});
