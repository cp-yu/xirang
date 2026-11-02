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
      'schemaVersion: 4',
      'decision: accepted',
      'decision: pending',
      'decision: excluded',
      '--entry A --entry C',
      'removed: true',
      '--source-version',
      'withdraw',
    ]) expect(reference).toContain(phrase);
  });

  it('uses record read commands and recovery/version protocol tokens', () => {
    for (const token of [
      'xirang record list --json',
      'xirang record show <explorationId> --json',
      'xirang record status <explorationId> --json',
      'xirang record validate <explorationId> --json',
      'xirang record show <explorationId> --entry A --entry C --json',
      'sourceVersion',
      'source-version conflict',
      'context compression',
      'session switch',
      'relevant drift',
      'ordinary discussion',
      'each section',
      'diff and summary',
    ]) expect(reference).toContain(token);

    const bullets: string[] = [];
    for (const line of reference.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (trimmed.startsWith('- ')) bullets.push(trimmed.slice(2));
      else if (bullets.length > 0 && trimmed) bullets[bullets.length - 1] += ` ${trimmed}`;
    }
    const normalized = bullets.map(line => line.replace(/\s+/g, ' '));
    const positiveReuse = (line: string) => /(?:reuse|retain|carry forward|keep using)[\s\S]*(?:latest|current|returned|new)[\s\S]*version/i.test(line)
      && !/(?:do not|don't|never|must not|shall not)[\s\S]*(?:reuse|retain|carry|keep)/i.test(line);
    const reuseRule = normalized.find(line => /sourceVersion/i.test(line) && /across sections/i.test(line));
    expect(reuseRule && positiveReuse(reuseRule)).toBe(true);
    expect(positiveReuse('Keep using the current version across sections.')).toBe(true);
    expect(positiveReuse('Do not reuse the latest version across sections.')).toBe(false);
    const updateRule = normalized.find(line => /after (?:an )?update/i.test(line));
    expect(updateRule && /(?:diff|summary)[\s\S]*(?:reuse|retain|carry forward|keep using)/i.test(updateRule)).toBe(true);

    const hasRecoveryAction = (line: string) => /(?:context compression|session switch|source-version conflict|relevant drift|unknown semantic detail)[\s\S]*(?:reload|re-read|refresh|re-establish)[\s\S]*(?:complete record|full record)[\s\S]*(?:status|validation)[\s\S]*(?:only then|before continuing|before continue|then continue|then proceed)/i.test(line)
      && !/(?:do not|don't|never|must not|shall not)[\s\S]{0,50}(?:reload|re-read|refresh|re-establish)/i.test(line);
    const recoveryRule = normalized.find(line => /context compression/i.test(line) && /source-version conflict/i.test(line));
    expect(recoveryRule && hasRecoveryAction(recoveryRule)).toBe(true);
    expect(hasRecoveryAction('On context compression, reload the full record plus status and validation, and only then proceed.')).toBe(true);
    expect(hasRecoveryAction('On context compression, do not reload the full record plus status and validation; continue immediately.')).toBe(false);
    expect(hasRecoveryAction('On context compression,\nreload the full record plus status and validation, and only then proceed.')).toBe(true);

    const avoidsRepeatedReads = (line: string) => /(?:ordinary discussion|each section)[\s\S]*(?:do not|don't|never|must not|shall not|avoid)[\s\S]*(?:repeat|rerun)[\s\S]*(?:full show|show\/status\/validate|complete read)/i.test(line)
      || /(?:do not|don't|never|must not|shall not|avoid)[\s\S]*(?:repeat|rerun)[\s\S]*(?:full show|show\/status\/validate|complete read)[\s\S]*(?:ordinary discussion|each section)/i.test(line);
    const repetitionRule = normalized.find(line => /ordinary discussion/i.test(line) && /full show\/status\/validate/i.test(line));
    expect(repetitionRule && avoidsRepeatedReads(repetitionRule)).toBe(true);
    expect(avoidsRepeatedReads('For ordinary discussion, repeat the full show/status/validate sequence.')).toBe(false);
    expect(avoidsRepeatedReads('During ordinary discussion,\navoid repeating the full show/status/validate sequence.')).toBe(true);
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
