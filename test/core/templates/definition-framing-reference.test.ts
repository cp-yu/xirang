import { describe, expect, it } from 'vitest';
import { getExploreSkillTemplate } from '../../../src/core/templates/skill-templates.js';
import { collectSharedReferenceFiles } from '../../../src/core/templates/sync-engine.js';

describe('Definition Framing reference projection', () => {
  const template = getExploreSkillTemplate();
  const reference = template.referenceFiles?.find(file => file.path === 'references/definition-framing.md');

  it('projects one Xirang-owned, tool-neutral framing protocol', () => {
    expect(reference).toBeDefined();
    expect(reference?.content).toContain('Definition Framing');
    expect(reference?.content).toContain('user chooses');
    expect(reference?.content).toContain('explicit persistence confirmation');
    expect(reference?.content).toContain('causal definition');
    expect(reference?.content).toContain('MECE');
    expect(reference?.content).toContain('single structural dimension');
    expect(reference?.content).toContain('breadth-first (BFS) order');
    expect(reference?.content).toContain('same-level structure');
    expect(reference?.content).toContain('identity, Kind, parent, or Relationship');
    expect(reference?.content).toContain('complete current payload');
    expect(reference?.content).toContain('xirang framing create');
    expect(reference?.content).toContain('xirang framing update');
    expect(reference?.content).toContain('xirang framing status');
    expect(reference?.content).toContain('xirang framing validate');
    expect(reference?.content).toContain('xirang framing discard');
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
    expect(template.instructions).toContain('.xirang/references/xirang-definition-framing.md');
  });
});
