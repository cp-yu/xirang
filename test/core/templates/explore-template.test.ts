import { describe, expect, it } from 'vitest';

import {
  STRUCTURAL_DECOMPOSITION_GUIDANCE,
  TEST_QUALITY_GUIDANCE,
  XIRANG_PHILOSOPHY,
} from '../../../src/core/templates/fragments/xirang-fragments.js';
import { getExploreSkillTemplate } from '../../../src/core/templates/skill-templates.js';

describe('explore template semantic impact', () => {
  const template = getExploreSkillTemplate().instructions;
  const brainstorming = getExploreSkillTemplate().referenceFiles!.find(file => file.path === 'references/explore-supperpowers-style.md')!.content;

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
    expect(template).toContain('xirang arch query <selected-identities...> --contract --json');
    expect(template).toContain('identity-only');
    expect(template).toContain('re-query that identity');
    expect(template).toContain('Semantic Model');
    expect(template).not.toContain('Formal Semantic Model');
    expect(template).toContain('Relationship adjacency');
    expect(template.indexOf('xirang arch impact <identities...> --depth 2 --json'))
      .toBeLessThan(template.indexOf('xirang arch query <selected-identities...> --contract --json'));
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
    expect(template).toContain('2. **Decide whether a visual companion helps**');
    expect(template).toContain('3. **Clarify one question at a time**');
    expect(template).toContain('4. **Compare 2-3 options**');
    expect(template).toContain('5. **Confirm the applicable design sections**');
    expect(template).toContain('6. **Self-review and generate Design Summary**');
    expect(template).toContain("using the reference's Section-by-section design approval");
    expect(template).toContain('using the reference and Simplicity Awareness');
    expect(template).toContain('Present the Design Summary, then end with');
    expect(template).not.toContain('visible content block');
    expect(template).toContain('After presenting the Design Summary, STOP');
    expect(template).toContain('Only the user triggers the next workflow');
  });

  it('adapts conversation-facing summary language to the user', () => {
    const ref = getExploreSkillTemplate().referenceFiles?.find(f => f.path === 'references/explore-supperpowers-style.md');

    expect(ref?.content).toContain('keep commands, paths, artifact names, schema keys, and Xirang tokens unchanged');
    expect(ref?.content).toContain("Output language: use the user's main language for prose and non-canonical section labels");
  });

  it('tracks the explore flow with todo when available', () => {
    const ref = getExploreSkillTemplate().referenceFiles?.find(f => f.path === 'references/explore-supperpowers-style.md');

    expect(template).toContain('If todo is available, create this checklist before context reads and tick each stage as completed');
    expect(ref?.content).toContain('If todo is available, track these stages as a checklist and tick each completed stage');
    expect(ref?.content).toContain('Before context reads, create the todo checklist');
  });

  it('records confirmed design through the CLI as the only write exception', () => {
    expect(template).toContain('Forbidden');
    expect(template).toContain('directly create, edit, or delete project or Change artifacts');
    expect(template).toContain('`xirang record`');
    expect(template).toContain('A user\'s design confirmation authorizes recording that content through `xirang record`');
    expect(template).toContain('it does not authorize any other file or artifact write');
    expect(template).not.toContain('explicit persistence confirmation');
    expect(template).toContain('produce a conversation-only `Design Summary`');
    expect(template).toContain('instruct the user to call `/xirang:propose <change-name>`');
  });

  it('keeps semantic navigation and other artifacts read-only', () => {
    expect(template).toContain('The main Explore agent remains read-only outside the Design Record exception');
    expect(template).toContain('`arch search` and `arch impact` are read-only');
    expect(template).toContain('MUST NOT create or update project or Change artifacts');
    expect(template).not.toContain('Subagent Exception');
  });

  it('treats recorded content as an intermediate basis, not a capture target', () => {
    expect(template).toContain('a record is an intermediate basis, not a capture target');
  });

  it('initiates capture and blocks conflicting, incomplete or stale Summary handoff', () => {
    expect(template).toContain('xirang record list --json');
    expect(template).toContain('**Inputs and authority** when opening or resuming it');
    expect(template).toContain('**Record on confirmation** after each confirmed section');
    expect(template).toContain('**Summary gate** before handoff');
    expect(template).toContain('do not preload it for ordinary discussion with no trigger');
    expect(template).toContain('**Existing record**');
    expect(template).toContain('normative confirmations not covered by an explicit exemption');
    expect(template).toContain('the user requests recording or revising design material');
    expect(template).toContain('**Handoff gap**');
    expect(template).not.toContain('even when no record exists');
    expect(template).toContain('all applicable gates must pass before a ready Summary');
    expect(template).toContain('do not wait for the user to name the tool');
    expect(template).not.toContain('before structural discussion');
    expect(template).not.toContain('Change Structural Definition');
    expect(template).not.toMatch(/framing/i);
  });

  it('applies decomposition guidance only when structural design is required', () => {
    expect(template).toContain(STRUCTURAL_DECOMPOSITION_GUIDANCE);
    expect(template).toContain('xirang config project --json');
    expect(template).toContain('before comparing structural options');
    expect(template).toContain('adds Elements, changes a parent, or reorganizes a sibling set');
    expect(template).toContain('Contract-only');
    expect(template).toContain('do not invoke the decomposition skill');
    expect(template).toContain('does not relax the Explore read-only boundary');
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
    expect(template).toContain(TEST_QUALITY_GUIDANCE);
    expect(brainstorming).toContain('persistent (test suite) or one-time verification');
    expect(brainstorming).toContain('no persistent test file');
    expect(brainstorming).toContain('reuse, modify, add, delete');
    expect(brainstorming).toContain('authoritative suite');
    expect(template).not.toContain('fail-closed');
  });

  it('emits a One-time Verification subsection in the Design Summary', () => {
    expect(brainstorming).toContain('`One-time Verification` subsection');
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

  it('discovers decisions and confirms observable outcomes before documenting the design', () => {
    const ref = getExploreSkillTemplate().referenceFiles?.find(f => f.path === 'references/explore-supperpowers-style.md')?.content ?? '';

    expect(ref).toContain('Actively identify decisions the user has not yet considered');
    expect(ref).toContain('failure outcomes, competing events, and timing origins or tolerances');
    expect(ref).toContain('A recommendation is not a user decision');
    expect(ref).toContain('confirm key conditions, actions, and observable expected outcomes');
    expect(ref).toContain('not just a test tool or method');
    expect(ref).toContain('Propose writes the complete Sections, Acceptance Cases, and tasks');
  });

  it('hands off confirmed boundaries without promoting recommendations or deferring in-scope decisions', () => {
    const instructions = getExploreSkillTemplate().instructions;
    const ref = getExploreSkillTemplate().referenceFiles?.find(f => f.path === 'references/explore-supperpowers-style.md')?.content ?? '';

    expect(ref).toContain('conditions, numbers, exceptions, timing, and key acceptance outcomes');
    expect(ref).toContain('Keep recommendations and unselected alternatives distinct from confirmed decisions');
    expect(ref).toContain('Deferral requires user agreement on the excluded scope and its boundary');
    expect(ref).toContain('Unresolved decisions affecting the current target block a ready handoff');
    expect(ref).toContain('try relevant boundary or competing-event sequences');
    expect(ref).toContain('do not create a separate decision ledger');
    expect(instructions).toContain("using the reference's Section-by-section design approval");
    expect(instructions).not.toContain('Resolve or explicitly defer scope-affecting questions');
  });

  it('reference content is within 500 line limit', () => {
    const template = getExploreSkillTemplate();
    const ref = (template.referenceFiles || []).find(f => f.path === 'references/explore-supperpowers-style.md');

    expect(ref).toBeDefined();
    const lineCount = ref?.content.trim().split('\n').length || 0;
    expect(lineCount).toBeLessThanOrEqual(500);
  });
});
