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
      'report only this write\'s content delta and decision-state changes',
      'Do not re-present unchanged content or announce mechanical counts',
      'separately flag every modification of already-confirmed content',
      'an empty record list is a starting state, not an exemption',
    ]) expect(reference).toContain(phrase);
    expect(reference).not.toContain('explicit persistence confirmation');
    expect(reference).not.toContain('complete proposed payload');
  });

  it('defines user-facing load, update, and error presentation without leaking mechanics', () => {
    for (const phrase of [
      '## User-facing record presentation',
      'On the first complete load in a new conversation',
      'all accepted and excluded design decisions and confirmed structure',
      'every pending question or assumption',
      'After a record write, report only the content added, changed, removed, or reclassified',
      'invalid data, relevant drift, or a context conflict',
      'what is inconsistent and what reconciliation is needed',
      'Do not emit mechanical CLI receipts',
    ]) expect(reference).toContain(phrase);

    for (const template of [getBuildSkillTemplate(), getExploreSkillTemplate(), getXirangProposeSkillTemplate()]) {
      expect(template.instructions).toContain('User-facing record presentation');
    }

    expect(reference).not.toContain('report only this write\'s changes and the record summary returned by the CLI');
    expect(reference).not.toContain('identify `explorationId` and the checked `sourceVersion`');
  });

  it('defines the entry writing standard and the structure part', () => {
    for (const phrase of [
      'Could a downstream author write the Contract and Acceptance Cases from this entry without the conversation?',
      'Record user examples verbatim',
      'Confirmed component structure goes into `structure`',
      'schemaVersion: 4',
      'decision: accepted',
      'decision: pending',
      'decision: excluded',
      '--entry A --entry C',
      'removed: true',
      '--diff',
      'withdraw',
    ]) expect(reference).toContain(phrase);
  });

  it('uses filenames, selective reads and CLI updates without version copying or routine triples', () => {
    expect(reference).toContain('xirang record show <filename> --entry A --entry C --json');
    expect(reference).toContain('first takeover, after context loss, before Summary');
    expect(reference).toContain('Do not routinely run show/status/validate together');
    expect(reference).toContain('Agent writes MUST use `xirang record` structured operations');
    expect(reference).toContain('Successful updates are silent');
    expect(reference).not.toContain('--source-version');
    expect(reference).not.toContain('--slug');
  });

  it('keeps dependent consistency and the three-state record decision', () => {
    for (const phrase of [
      'invalidate affected design, Summary, and coverage conclusions',
      'confirm exactly one record decision before handoff',
      'do not offer exemption as the default',
      'a valid partial record does not prove capture is complete',
      'MUST NOT treat the latest statement as overriding earlier confirmation',
    ]) expect(reference).toContain(phrase);
  });

  it('gates handoff on atomic-detail coverage recorded by the CLI', () => {
    for (const phrase of [
      'result: covered',
      'result: not-applicable',
      'result: pending',
      'affectsTarget',
      'an example without a location counts as uncovered',
      'A summary claim such as "checked item by item" is not a coverage result',
      'Write confirmed examples as Acceptance Cases',
      'Do not generalize numbers, timing, or exceptions',
      'Any target-model change requires renewed coverage',
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
