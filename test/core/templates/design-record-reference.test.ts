import { describe, expect, it } from 'vitest';
import { getBuildSkillTemplate, getExploreSkillTemplate, getXirangProposeSkillTemplate } from '../../../src/core/templates/skill-templates.js';
import { collectSharedReferenceFiles } from '../../../src/core/templates/sync-engine.js';

describe('Design Record reference projection', () => {
  const template = getExploreSkillTemplate();
  const reference = template.referenceFiles?.find(file => file.path === 'references/design-record.md')?.content ?? '';

  it('records on confirmation and reports only the change', () => {
    for (const phrase of [
      'A user\'s design confirmation authorizes recording that content',
      'Do not ask for a separate persistence confirmation',
      'do not show the complete proposed record before writing',
      'report only this write\'s changes and the record summary',
      'Flag every modification of already-confirmed content',
      'Record only what the user explicitly confirmed',
      'an empty record list is a starting state, not an exemption',
    ]) expect(reference).toContain(phrase);
    expect(reference).not.toContain('explicit persistence confirmation');
    expect(reference).not.toContain('complete proposed payload');
  });

  it('defines the entry writing standard and the structure part', () => {
    for (const phrase of [
      'Could a downstream author write the Contract and Acceptance Cases from this entry without the conversation?',
      'Record user examples verbatim',
      'Confirmed component structure goes into `structure`',
      'schemaVersion: 3',
      'removed: true',
      '--source-version',
      'withdraw',
    ]) expect(reference).toContain(phrase);
  });

  it('keeps dependent consistency and the three-state record decision', () => {
    for (const phrase of [
      'invalidate affected design, Summary, and coverage conclusions',
      'confirm exactly one record decision before handoff',
      'do not offer exemption as the default',
      'a valid partial record does not prove capture is complete',
      'MUST NOT treat the latest statement as overriding earlier confirmation',
      'Propose MUST NOT create, update, rename, or discard records',
    ]) expect(reference).toContain(phrase);
  });

  it('gates handoff on atomic-detail coverage recorded by the CLI', () => {
    for (const phrase of [
      'Split each normative entry into atomic details',
      'an example without a location counts as uncovered',
      'A summary claim such as "checked item by item" is not a coverage result',
      'Write confirmed examples as Acceptance Cases',
      'Do not generalize numbers, timing, or exceptions',
      'Any Delta or Candidate edit after recording coverage requires rechecking',
      'copied from the current target file, never from memory or paraphrased',
      'If the excerpt states only a general rule without the example\'s concrete inputs and outcomes, the example is uncovered',
      'a missing quote or one that does not appear at its location',
    ]) expect(reference).toContain(phrase);
    const coverage = reference.indexOf('xirang record coverage');
    expect(coverage).toBeGreaterThan(-1);
    expect(reference.indexOf('xirang record consume', coverage)).toBeGreaterThan(coverage);
    expect(reference).toContain('record-source.md');
    expect(reference).toContain('record-coverage.json');
  });

  it('uses only the new vocabulary and stays tool-neutral', () => {
    expect(reference).not.toMatch(/framing|Definition Framing/i);
    expect(reference).not.toMatch(/\/xirang:|\$xirang-|\.pi\/skills|\.claude\/skills|\.codex\/skills/);
  });

  it('publishes the reference at the stable project-owned path', () => {
    const shared = collectSharedReferenceFiles([{ workflowId: 'explore', template }]);
    expect(shared).toContainEqual(expect.objectContaining({ fileName: 'xirang-design-record.md', sourcePath: 'references/design-record.md' }));
    for (const entry of [template, getBuildSkillTemplate(), getXirangProposeSkillTemplate()]) {
      expect(entry.instructions).toContain('.xirang/references/xirang-design-record.md');
      expect(entry.instructions).not.toMatch(/framing/i);
    }
  });
});
