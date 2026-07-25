/**
 * Snack workflow template (code-first artifact reconciliation).
 */
import type { SkillTemplate } from '../types.js';
import {
  ARCHITECTURE_GENERATE_DELTA,
  ARTIFACT_DOC_LANGUAGE_CONTRACT,
  XIRANG_PHILOSOPHY,
  XIRANG_SHARED_CONTEXT,
} from '../fragments/xirang-fragments.js';

const ARTIFACT_INSTRUCTION_CONTRACT = `For each response, follow the authoring order in the returned \`instruction\`. Keep \`definition\`, dependencies, \`currentState\`, \`configProjection\`, and \`template\` as separate inputs; do not copy non-artifact inputs into the artifact.`;

export function getSnackSkillTemplate(): SkillTemplate {
  return {
    name: 'xirang-snack',
    description:
      'Quick code-first artifact reconciliation: from already-written code, conditionally create or update proposal + specs + simplified design + architecture delta using available code-change evidence. Use after iterative coding to back-fill Xirang artifacts without redoing propose→apply. Does not generate tasks.md.',
    instructions: `Reconcile Xirang artifacts from already-written code (code-first artifact reconciliation, reverse of propose/apply).

${XIRANG_PHILOSOPHY}

Treat \`proposal.md\`, \`design.md\`, \`specs/*/spec.md\`, and \`architecture-delta.c4\` as conditional artifacts: create them when missing, update them when stale or inconsistent, and leave them unchanged when current.

## Input

- Optional \`<change-name>\` (kebab-case).
- If omitted, run \`xirang list --json\` and reuse the single active change; if multiple or none, ask which change name to target.

## Flow

1. Resolve change name and reconcile mode.
   - If \`.xirang/changes/<name>/\` does not exist, run \`xirang new change "<name>"\` and create only artifacts required by evidence.
   - Otherwise read current proposal, design, Specs, and architecture delta; classify each as **missing**, **stale**, **inconsistent**, or **current** and preserve unrelated human-authored content.
2. Load the shared Xirang Semantic Model context.
${XIRANG_SHARED_CONTEXT}
3. Collect code-change evidence from conversation context plus \`git diff --cached\`, \`git diff HEAD\`, other available working-tree/staged diffs, and user-selected commit/range diffs. \`git diff\` is one evidence source among several and MUST NOT be treated as the only valid source. Treat natural-language commit/range selectors as agent-parsed evidence selectors, not Xirang CLI flags. Mark conflicts or uncertainty \`[REVIEW NEEDED]\`.
4. Map changed symbols/files to current Semantic Model context.
   - Use stable \`elementId\` values, current FQNs, refinement, Element Contracts, and relationships.
   - CodeGraph MAY accelerate symbol/call/import discovery; otherwise use ACE, \`rg\`, and \`read\`. Never read \`.codegraph/codegraph.db\`.
   - Treat code locations and call/import edges as implementation evidence, not as proof that the Xirang Semantic Model must change. Do not create elements from uncertain file-name inference.
5. Determine Element Contract impact.
   - Run \`xirang list --specs --json\` and keep each Spec ID with its singular owner binding from the Element Contract registry.
   - Add an existing Spec ID to **Modified Specs** only when its observable requirements change. Add a **New Spec** only for genuinely new observable behavior not governed by an existing Spec.
   - An optional-contract element without a registered Spec does not by itself require a New Spec; mark missing coverage \`[REVIEW NEEDED]\`.
   - Behavior-preserving refactors create no contract module delta; later Checks use \`Preserves:\` against formal Specs.
6. Determine graph impact.
   - Declare impact only when elements, refinement, contracts, or relationships change.
   - Implementation-only movement, symbol renaming, helper extraction, and mechanical call/import changes do not by themselves change the graph modules.
   - If no graph fact changes, set the compatible Architecture Source module scope to \`None\`. If impact remains unresolved, stop and ask one focused question; do not write \`architecture-delta.c4\` or claim reconciliation complete.
7. Reconcile the contract and graph module scopes as one Semantic Delta; keep Spec IDs distinct from stable \`elementId\` values.
8. Reconcile \`proposal.md\`.
   - Run \`xirang instructions proposal --change "<name>" --json\`. ${ARTIFACT_INSTRUCTION_CONTRACT}
   - Reconcile \`## Source Impact\` from the contract and graph module scopes of one Semantic Delta. Keep the compatible Behavior Source and Architecture Source headings, Spec IDs, and stable \`elementId\` values distinct.
   - Reuse the confirmed contract module scope as the delta Spec input; preserve \`## Why\`, \`## What Changes\`, \`## Source Impact\`, and \`## Impact\`.
   - If the proposal already matches evidence and source impact, leave it unchanged.
9. Reconcile delta Specs in \`specs/<spec-id>/spec.md\`.
   - Run \`xirang instructions specs --change "<name>" --json\`. ${ARTIFACT_INSTRUCTION_CONTRACT}
   - Create or update only Specs declared by the contract module scope. Do not derive the directory name directly from an element FQN or \`elementId\`.
   - Follow returned \`## ADDED Requirements\`, \`## MODIFIED Requirements\`, and \`## REMOVED Requirements\` rules with exact title matching and canonical unlabeled Requirement/Scenario syntax. Express a rename as REMOVED old Requirement plus ADDED new complete Requirement. Preserve unrelated current delta content.
10. Reconcile simplified \`design.md\`.
   - Run \`xirang instructions design --change "<name>" --json\`. ${ARTIFACT_INSTRUCTION_CONTRACT}
   - Preserve Context, Goals / Non-Goals, Decisions, and Risks / Trade-offs. Mark inferred content \`[INFERRED FROM CODE]\` and unresolved decisions \`[REVIEW NEEDED]\`.
11. Reconcile \`architecture-delta.c4\` only after graph impact is resolved. Omit the file when the graph modules are confirmed unchanged; author a validated LikeC4 delta otherwise.
   ${ARCHITECTURE_GENERATE_DELTA}
   - Distinguish delta Spec Markdown headings from LikeC4 model declarations and typed relations.
12. Do NOT generate \`tasks.md\` (code is already implemented).
13. Run \`xirang validate --change "<name>" --json\`. On ERROR/WARNING, repair once from artifact instructions, validate once more, and report the final result.
14. After validation passes, run \`xirang diff --change "<name>" --write\`. Treat \`.xirang/changes/<name>/effective-change.md\` as the only persistent effective-change report and require its status to be Passed before claiming reconciliation complete.
15. Finish with the output hints.

## Output Hints

⚠️ Generated specs are based on code inference. Review items marked [REVIEW NEEDED]

1. **Quick sync**: \`xirang sync "<change-name>" --no-verify\`
2. **Quick archive**: \`xirang archive "<change-name>" --no-verify\`
3. **Sync and archive**: \`xirang sync "<change-name>" --no-verify && xirang archive "<change-name>" --no-verify\`
4. **Continue development**: review change → modify code → run \`/xirang:snack\` again → continue iterating

## Artifact Contract

${ARTIFACT_DOC_LANGUAGE_CONTRACT}

Preserve canonical headings, IDs, schema keys, BDD keywords, paths, commands, and code identifiers.`,
    license: 'MIT',
    compatibility: 'Requires xirang CLI.',
    metadata: { author: 'xirang', version: '1.0' },
  };
}
