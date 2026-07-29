import { describe, expect, it } from 'vitest';

import { XIRANG_PHILOSOPHY } from '../../../src/core/templates/fragments/xirang-fragments.js';
import { getExploreSkillTemplate } from '../../../src/core/templates/skill-templates.js';

describe('explore template semantic impact', () => {
  const template = getExploreSkillTemplate().instructions;

  it('includes unified Xirang Semantic Model context without code-map guidance', () => {
    expect(template).toContain(XIRANG_PHILOSOPHY);
    expect(template).toContain('Project Root');
    expect(template).toContain('one Element has at most one Contract');
    expect(template).toContain('semantic relationships');
    expect(template).not.toContain('code-map refs');
  });

  it('clarifies Definition impact only when conceptual structure changes', () => {
    expect(template).toContain('Element Definition');
    expect(template).toContain('concept identity or scope boundary changes');
    expect(template).toContain('complete target Definition in the Design Summary');
    expect(template).toContain('Do not include a Definition rewrite for behavior-only or implementation-only changes');
  });

  it('directly obtains semantic impact context for focus Elements', () => {
    expect(template).toContain('## Semantic Impact');
    expect(template).toContain('xirang arch search <query> --json');
    expect(template).toContain('focus Elements');
    expect(template).toContain('xirang arch impact <identities...> --depth 2 --json');
    expect(template).toContain('Formal Semantic Model');
    expect(template).toContain('Relationship adjacency');
  });

  it('collects implementation evidence separately and keeps judgments in the main agent', () => {
    expect(template).toContain('CodeGraph');
    expect(template).toContain('ACE');
    expect(template).toContain('`rg`');
    expect(template).toContain('`read`');
    expect(template).toContain('mustChange');
    expect(template).toContain('mustVerify');
    expect(template).toContain('architecture drift');
    expect(template).toContain('main Explore agent');
  });

  it('contains no retired Sweeper delegation or report protocol', () => {
    for (const retired of [
      'xirang-impact-sweeper',
      'opsx-impact-sweeper',
      'termMappings',
      'terminologyObservations',
      'optionalChangeName',
      'knownUserTerms',
      'final concept sweep',
    ]) {
      expect(template).not.toContain(retired);
    }
    expect(template).not.toContain('## Skill Delegation Protocol');
    expect(template).not.toContain('**Internal Subagents**');
  });

  it('keeps one compact six-step brainstorming checklist', () => {
    expect(template.match(/^## Brainstorming Checklist$/gm)).toHaveLength(1);
    expect(template).not.toContain('## Mandatory Exploration Flow');
    expect(template).toContain('Explore MUST run this sequence before saying a proposal is ready');
    expect(template).toContain('1. **Explore project context**');
    expect(template).toContain('If the request spans multiple independent subsystems');
    expect(template).toContain('recommend an implementation order');
    expect(template).toContain('2. **Decide whether a visual companion helps**');
    expect(template).toContain('3. **Clarify one question at a time**');
    expect(template).toContain('Ask exactly one question, then wait for the answer');
    expect(template).toContain('4. **Compare 2-3 options**');
    expect(template).toContain('Present 2-3 viable approaches');
    expect(template).toContain('5. **Confirm the applicable design sections**');
    expect(template).toContain('architecture, core components, data flow, technology stack, testing strategy, risks and trade-offs');
    expect(template).toContain('For a narrow change, confirm at least the problem, impact scope, approach, and verification method');
    expect(template).toContain('6. **Self-review and generate Design Summary**');
    expect(template).toContain('Present the Design Summary, then end with');
    expect(template).not.toContain('visible content block');
    expect(template).toContain('After presenting the Design Summary, STOP');
    expect(template).toContain('Only the user triggers the next workflow');
  });

  it('adapts conversation-facing summary language to the user', () => {
    const ref = getExploreSkillTemplate().referenceFiles?.find(f => f.path === 'references/explore-supperpowers-style.md');

    expect(template).toContain("Output language: use the user's main language for prose and non-canonical section labels");
    expect(template).toContain('keep commands, paths, artifact names, schema keys, and Xirang tokens unchanged');
    expect(ref?.content).toContain("Output language: use the user's main language for prose and non-canonical section labels");
  });

  it('tracks the explore flow with todo when available', () => {
    const ref = getExploreSkillTemplate().referenceFiles?.find(f => f.path === 'references/explore-supperpowers-style.md');

    expect(template).toContain('If todo is available, create this checklist before context reads and tick each stage as completed');
    expect(ref?.content).toContain('If todo is available, track these stages as a checklist and tick each completed stage');
    expect(ref?.content).toContain('Before context reads, create the todo checklist');
  });

  it('permits only explicitly confirmed CLI-managed structural persistence', () => {
    expect(template).toContain('Forbidden');
    expect(template).toContain('directly create, edit, or delete project or Change artifacts');
    expect(template).toContain('explicit persistence confirmation');
    expect(template).toContain('`xirang framing`');
    expect(template).toContain('produce a conversation-only `Design Summary`');
    expect(template).toContain('instruct the user to call `/xirang:propose <change-name>`');
  });

  it('treats design confirmation as direction only', () => {
    expect(template).toContain('User confirmations ("ok", "option 2") approve design direction only, not file modification');
  });

  it('keeps semantic navigation and non-framing artifacts read-only', () => {
    expect(template).toContain('The main Explore agent remains read-only outside the managed Definition Framing exception');
    expect(template).toContain('`arch search` and `arch impact` are read-only');
    expect(template).toContain('MUST NOT create or update project or Change artifacts');
    expect(template).not.toContain('Subagent Exception');
  });

  it('uses a complete persisted structural definition during Design Exploration when available', () => {
    expect(template).toContain('Definition Framing is optional and begins only when the user chooses it');
    expect(template).toContain('xirang framing list --json');
    expect(template).toContain('xirang framing show <explorationId> --json');
    expect(template).toContain('xirang framing status <explorationId> --json');
    expect(template).toContain('xirang framing validate <explorationId> --json');
    expect(template).toContain('On every resume, run all three before Design Exploration continues');
    expect(template).toContain('Use `show` for the complete current payload, `status` for baseline drift, and `validate` for current impacts');
    expect(template).toContain('Contract and Authored View impacts');
    expect(template).toContain('invalidate the affected structural confirmations and downstream design decisions');
    expect(template).toContain('When no Change Structural Definition exists, continue from the Semantic Model and project evidence');
  });

  it('routes active-change insights to future capture targets', () => {
    expect(template).toContain('Future Capture Target');
    expect(template).toContain('Observable behavior requirement');
    expect(template).toContain('Observable behavior changed');
    expect(template).toContain('Refactor rationale or rejected path');
    expect(template).toContain('Implementation strategy');
    expect(template).toContain('Element identity or hierarchy changed');
    expect(template).toContain('`relationships/<relationship kind identity>.yaml`');
    expect(template).toContain('`metamodel/<kind identity>.md`');
    expect(template).toContain('`views/<view identity>.md`');
    expect(template).not.toContain('architecture-delta');
    expect(template).toContain('This changes an Element Contract; include it in the Design Summary');
    expect(template).toContain('That is a design decision for `design.md`; include it in the Design Summary');
    expect(template).toContain('This changes scope for `proposal.md`; include it in the Design Summary');
  });

  it('uses the generated superpowers reference as the authoritative behavior guide', () => {
    expect(template).toContain('## Required References');
    expect(template).toContain('.xirang/references/xirang-explore-supperpowers-style.md');
    expect(template).toContain('authoritative Superpowers brainstorming behavior guide');
    expect(template).toContain('hard gate, context exploration, visual companion judgment, one-question discipline');
    expect(template).toContain('Do not reconstruct or duplicate Superpowers behavior from this prompt');
  });

  it('classifies testing items into persistent tests vs one-time verification', () => {
    expect(template).toContain('persistent or one-time verification');
    expect(template).toContain('no persistent test file');
  });

  it('emits a One-time Verification subsection in the Design Summary', () => {
    expect(template).toContain('`One-time Verification` subsection');
  });
});

describe('explore supperpowers-style reference', () => {
  it('declares supperpowers-style reference with Superpowers brainstorming discipline', () => {
    const template = getExploreSkillTemplate();
    const ref = (template.referenceFiles || []).find(f => f.path === 'references/explore-supperpowers-style.md');

    expect(ref).toBeDefined();
    expect(ref?.content).toContain('Superpowers brainstorming');
    expect(ref?.content).toContain('Hard gate before implementation');
    expect(ref?.content).toContain('Project context exploration');
    expect(ref?.content).toContain('Just-in-time visual companion');
    expect(ref?.content).toContain('One-question discipline');
    expect(ref?.content).toContain('2-3 approaches');
    expect(ref?.content).toContain('Section-by-section design approval');
    expect(ref?.content).toContain('Design Summary self-review');
    expect(ref?.content).toContain('User review gate');
    expect(ref?.content).toContain('xirang-propose handoff');
  });

  it('preserves the Superpowers design-before-implementation gate', () => {
    const template = getExploreSkillTemplate();
    const ref = (template.referenceFiles || []).find(f => f.path === 'references/explore-supperpowers-style.md');

    expect(ref).toBeDefined();
    expect(ref?.content).toContain('Do not implement before design confirmation is complete');
    expect(ref?.content).toContain('Simple changes still require design confirmation');
    expect(ref?.content).toContain('confirm only the applicable design sections');
    expect(ref?.content).toContain('at minimum confirm the problem, impact scope, approach, and verification method');
    expect(ref?.content).toContain('Only route to xirang-propose after the user reviews and accepts the Design Summary');
  });

  it('reference content routes to propose instead of direct writes', () => {
    const template = getExploreSkillTemplate();
    const ref = (template.referenceFiles || []).find(f => f.path === 'references/explore-supperpowers-style.md');

    expect(ref).toBeDefined();
    // Should NOT contain old direct-write phrasing
    expect(ref?.content).not.toContain('Want me to create a proposal');
    expect(ref?.content).not.toContain('I can create a change proposal');
    expect(ref?.content).not.toContain('Updated design.md');
    expect(ref?.content).not.toContain('write design doc');
    expect(ref?.content).not.toContain('commit the design document');
    expect(ref?.content).not.toContain('invoke writing-plans');

    // Should route to propose by logical workflow name, not tool-specific syntax.
    expect(ref?.content).toContain('xirang-propose');
    expect(ref?.content).not.toContain('$xirang-propose');
    expect(ref?.content).not.toContain('/xirang:propose');
  });

  it('reference content does not duplicate main instructions mechanisms', () => {
    const template = getExploreSkillTemplate();
    const ref = (template.referenceFiles || []).find(f => f.path === 'references/explore-supperpowers-style.md');

    expect(ref).toBeDefined();
    // Should NOT contain sweeper delegation protocol details
    expect(ref?.content).not.toContain('xirang-impact-sweeper');
    // Should NOT contain brainstorming checklist numbered flow
    expect(ref?.content).not.toContain('Explore MUST run this sequence');
    // Should NOT contain Future Capture Target routing table
    expect(ref?.content).not.toContain('Future Capture Target');
  });

  it('reference content is self-contained without template variables', () => {
    const template = getExploreSkillTemplate();
    const ref = (template.referenceFiles || []).find(f => f.path === 'references/explore-supperpowers-style.md');

    expect(ref).toBeDefined();
    expect(ref?.content).not.toMatch(/\$\{[^}]+\}/);
  });

  it('reference content is within 500 line limit', () => {
    const template = getExploreSkillTemplate();
    const ref = (template.referenceFiles || []).find(f => f.path === 'references/explore-supperpowers-style.md');

    expect(ref).toBeDefined();
    const lineCount = ref?.content.trim().split('\n').length || 0;
    expect(lineCount).toBeLessThanOrEqual(500);
  });
});
