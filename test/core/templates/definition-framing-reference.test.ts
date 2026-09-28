import { describe, expect, it } from 'vitest';
import { getBuildSkillTemplate, getExploreSkillTemplate, getXirangProposeSkillTemplate } from '../../../src/core/templates/skill-templates.js';
import { collectSharedReferenceFiles } from '../../../src/core/templates/sync-engine.js';

describe('Definition Framing reference projection', () => {
  const template = getExploreSkillTemplate();
  const reference = template.referenceFiles?.find(file => file.path === 'references/definition-framing.md');

  it('projects one Xirang-owned, tool-neutral framing protocol', () => {
    expect(reference).toBeDefined();
    expect(reference?.content).toContain('Definition Framing');
    for (const command of ['create', 'update', 'show', 'status', 'validate', 'discard']) {
      expect(reference?.content).toContain(`xirang framing ${command}`);
    }
    for (const gate of [
      'explicit persistence confirmation',
      'The Agent initiates capture at the end of each confirmed design section',
      'an empty framing list is a starting state, not an exemption',
      'every normative confirmation must be captured or explicitly exempted',
      'a concise explanation of how the conditions, exceptions and timing are preserved',
      'complete current payload',
      'MUST NOT treat the latest statement as overriding earlier confirmation',
      'Unresolved conflicts block Design Summary',
      'MUST carry `explorationId` and the checked `sourceVersion`',
      'Propose MUST NOT create, update, rename, or discard records',
      'schemaVersion: 2',
      'nature: normative',
      'nature: informative',
      'context: change',
      'context: build',
    ]) expect(reference?.content).toContain(gate);
    expect(reference?.content).not.toContain('Persist only complete structural targets');
    expect(reference?.content).not.toContain('before Design Exploration');
    expect(reference?.content).not.toMatch(/\/xirang:|\$xirang-|\.pi\/skills|\.claude\/skills|\.codex\/skills/);
    expect(reference?.content).not.toContain('One-question discipline');
    expect(reference?.content).not.toContain('Section-by-section design approval');
  });

  it('publishes the reference at the stable project-owned path', () => {
    const shared = collectSharedReferenceFiles([{ workflowId: 'explore', template }]);
    expect(shared).toContainEqual(expect.objectContaining({
      fileName: 'xirang-definition-framing.md',
      sourcePath: 'references/definition-framing.md',
    }));
    for (const entry of [template, getBuildSkillTemplate(), getXirangProposeSkillTemplate()]) {
      expect(entry.instructions).toContain('.xirang/references/xirang-definition-framing.md');
    }
    const all = collectSharedReferenceFiles([
      { workflowId: 'explore', template },
      { workflowId: 'build', template: getBuildSkillTemplate() },
      { workflowId: 'propose', template: getXirangProposeSkillTemplate() },
    ]);
    expect(all.filter(file => file.fileName === 'xirang-definition-framing.md')).toHaveLength(1);
  });
});
