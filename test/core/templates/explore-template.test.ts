import { describe, expect, it } from 'vitest';

import {
  STRUCTURAL_DECOMPOSITION_GUIDANCE,
  TEST_QUALITY_GUIDANCE,
  XIRANG_PHILOSOPHY,
  XIRANG_SHARED_CONTEXT,
} from '../../../src/core/templates/fragments/xirang-fragments.js';
import { getExploreSkillTemplate } from '../../../src/core/templates/skill-templates.js';

describe('explore template integration', () => {
  const skill = getExploreSkillTemplate();
  const template = skill.instructions;
  const reference = skill.referenceFiles!.find(file => file.path === 'references/explore-supperpowers-style.md')!.content;

  it('includes the shared model, decomposition and test protocols', () => {
    for (const fragment of [XIRANG_PHILOSOPHY, XIRANG_SHARED_CONTEXT, STRUCTURAL_DECOMPOSITION_GUIDANCE, TEST_QUALITY_GUIDANCE]) {
      expect(template).toContain(fragment);
    }
    for (const command of [
      'xirang arch outline --format json',
      'xirang arch query <identity> --json',
      'xirang arch snapshot --format json',
      'xirang config project --select decomposition --json',
      'xirang record list --json',
    ]) expect(template).toContain(command);
    expect(template).toContain('--contract');
    expect(template).not.toMatch(/arch query[^\n]*(--relations|--depth)/);
  });

  it('connects the workflow to its generated references and logical roles', () => {
    for (const name of ['explore-supperpowers-style', 'design-record']) {
      expect(template).toContain(`.xirang/references/xirang-${name}.md`);
      expect(skill.referenceFiles).toContainEqual(expect.objectContaining({ path: `references/${name}.md`, content: expect.any(String) }));
    }
    expect(template).toContain('`xirang-experimenter`');
    expect(template).toContain('/xirang:propose <change-name>');
    expect(reference).toContain('xirang-propose');
    expect(reference).not.toContain('/xirang:propose');
    expect(reference).not.toContain('$xirang-propose');
  });

  it('preserves the formal implementation and handoff prohibitions', () => {
    expect(template).toContain('Do not implement the formal Change, write the formal model or generated work surfaces, or author complete Change artifacts.');
    expect(reference).toContain('Only after the user accepts the Summary');
    expect(reference).toContain('User agreement is required to exclude or defer in-scope behavior.');
    expect(reference).toMatch(/experimental success is evidence, not user adoption/i);
    expect(template).toContain('only the user permits accepted/excluded decisions and substantive revisions of confirmed content or structure');
  });

  it('preserves language and canonical-token boundaries', () => {
    expect(reference).toContain("Output language: use the user's main language for prose and non-canonical section labels");
    expect(reference).toContain('keep commands, paths, artifact names, schema keys, and Xirang tokens unchanged');
  });

  it('does not reintroduce retired delegation, direct-writing offers or model paths', () => {
    for (const retired of [
      'xirang-impact-sweeper', 'opsx-impact-sweeper', 'termMappings',
      'terminologyObservations', 'optionalChangeName', 'knownUserTerms',
      'final concept sweep', 'code-map refs', 'architecture-delta',
      '.xirang/architecture/', '.xirang/project.xirang.yaml',
    ]) expect(template + reference).not.toContain(retired);
    for (const retired of [
      'Want me to create a proposal', 'I can create a change proposal',
      'Updated design.md', 'write design doc', 'commit the design document', 'invoke writing-plans',
    ]) expect(reference).not.toContain(retired);
    expect(template).not.toContain('The main Explore agent remains read-only outside the Design Record exception');
    expect(template).not.toContain('MUST NOT create or update project or Change artifacts');
  });

  it('renders references without unresolved template variables', () => {
    for (const file of skill.referenceFiles!) {
      expect(file.content).not.toMatch(/\$\{[^}]+\}/);
    }
  });
});
