/**
 * Snack workflow template (code-first artifact reconciliation).
 */
import type { SkillTemplate } from '../types.js';
import {
  ARCHITECTURE_GENERATE_DELTA,
  ARTIFACT_DOC_LANGUAGE_CONTRACT,
  ELEMENT_CONTRACT_SEMANTICS,
  ELEMENT_DEFINITION_SEMANTICS,
  XIRANG_PHILOSOPHY,
  XIRANG_SHARED_CONTEXT,
} from '../fragments/xirang-fragments.js';

const ARTIFACT_INSTRUCTION_CONTRACT = `For each response, follow the authoring order in the returned \`instruction\`. Keep \`definition\`, dependencies, \`currentState\`, \`configProjection\`, and \`template\` as separate inputs; do not copy non-artifact inputs into the artifact.`;

export function getSnackSkillTemplate(): SkillTemplate {
  return {
    name: 'xirang-snack',
    description:
      'Quick code-first artifact reconciliation: from already-written code, conditionally create or update proposal + simplified design + the four-partition Semantic Delta using available code-change evidence. Use after iterative coding to back-fill Xirang artifacts without redoing propose→apply. Does not generate tasks.md.',
    instructions: `Reconcile Xirang artifacts from already-written code (code-first artifact reconciliation, reverse of propose/apply).

${XIRANG_PHILOSOPHY}

${ELEMENT_DEFINITION_SEMANTICS}

${ELEMENT_CONTRACT_SEMANTICS}

Treat \`proposal.md\`, \`design.md\`, and the Delta units under \`{metamodel,elements,relationships,views}/\` as conditional artifacts: create them when missing, update them when stale or inconsistent, and leave them unchanged when current.

## Input

- Optional \`<change-name>\` (kebab-case).
- If omitted, run \`xirang list --json\` and reuse the single active change; if multiple or none, ask which change name to target.

## Flow

1. Resolve change name and reconcile mode.
   - If \`.xirang/changes/<name>/\` does not exist, run \`xirang new change "<name>"\` and create only artifacts required by evidence.
   - Otherwise read the current proposal, design, and Delta units; classify each as **missing**, **stale**, **inconsistent**, or **current** and preserve unrelated human-authored content.
2. Load the shared Xirang Semantic Model context.
${XIRANG_SHARED_CONTEXT}
3. Collect code-change evidence from conversation context plus \`git diff --cached\`, \`git diff HEAD\`, other available working-tree/staged diffs, and user-selected commit/range diffs. \`git diff\` is one evidence source among several and MUST NOT be treated as the only valid source. Treat natural-language commit/range selectors as agent-parsed evidence selectors, not Xirang CLI flags. Mark conflicts or uncertainty \`[REVIEW NEEDED]\`.
4. Map changed symbols/files to current Semantic Model context.
   - Use Element \`identity\` values, refinement, Element Contracts, and relationships.
   - CodeGraph MAY accelerate symbol/call/import discovery; otherwise use ACE, \`rg\`, and \`read\`. Never read \`.codegraph/codegraph.db\`.
   - Treat code locations and call/import edges as implementation evidence, not as proof that the Xirang Semantic Model must change. Do not create elements from uncertain file-name inference.
5. Determine Element Contract impact.
   - Select only the candidate Element identities whose current Contracts are needed, then run one batch \`xirang arch query <selected-identities...> --contract --json\` and keep their current Requirements.
   - Add an identity to **Modified Specs** only when the observable requirements of its Element Contract change. Add it to **New Specs** only for genuinely new observable behavior not governed by an existing Element Contract.
   - An optional-contract Element without a Contract does not by itself require a new one; mark missing coverage \`[REVIEW NEEDED]\`.
   - Behavior-preserving refactors create no Contract delta; later Checks use \`Preserves:\` against formal Element Contracts.
6. Determine structural impact.
   - Declare impact only when Element Declarations, refinement, Relationships, Kinds, or Views change.
   - Reconcile a Definition only when user intent, existing semantic artifacts, or other authoritative evidence establishes its complete concept identity and scope boundary. Do not infer a Definition from file names, symbols, imports, or call relationships; when the required conceptual boundary is unresolved, stop and ask one focused question instead of guessing.
   - Implementation-only movement, symbol renaming, helper extraction, and mechanical call/import changes do not by themselves change the structure.
   - If no structural fact changes, set the compatible Architecture Source scope to \`None\`. If impact remains unresolved, stop and ask one focused question; do not write structural Delta units or claim reconciliation complete.
7. Reconcile the Contract and structural scopes as one Semantic Delta; both address the same Element identity space.
8. Reconcile \`proposal.md\`.
   - Run \`xirang instructions proposal --change "<name>" --json\`. ${ARTIFACT_INSTRUCTION_CONTRACT}
   - Reconcile \`## Source Impact\` from the Contract and structural scopes of one Semantic Delta. Keep the compatible Behavior Source and Architecture Source headings and reference Elements by \`identity\`.
   - Reuse the confirmed Contract scope as the Element Contract delta input; preserve \`## Why\`, \`## What Changes\`, \`## Source Impact\`, and \`## Impact\`.
   - If the proposal already matches evidence and source impact, leave it unchanged.
9. Reconcile Element Contract deltas in \`elements/<identity>.md\`.
   - Run \`xirang instructions specs --change "<name>" --json\`. ${ARTIFACT_INSTRUCTION_CONTRACT}
   - Create or update only the identities declared by the Contract scope. The default unit name is \`<identity>.md\`; a file name expresses nothing, so deviating from the default changes no model semantics.
   - Follow returned \`## ADDED Requirements\`, \`## MODIFIED Requirements\`, and \`## REMOVED Requirements\` rules with exact title matching and canonical unlabeled Requirement/Scenario syntax. Express a rename as REMOVED old Requirement plus ADDED new complete Requirement. Preserve unrelated current delta content.
10. Reconcile simplified \`design.md\`.
   - Run \`xirang instructions design --change "<name>" --json\`. ${ARTIFACT_INSTRUCTION_CONTRACT}
   - Preserve Context, Goals / Non-Goals, Decisions, and Risks / Trade-offs. Mark inferred content \`[INFERRED FROM CODE]\` and unresolved decisions \`[REVIEW NEEDED]\`.
11. Reconcile the structural Delta units only after structural impact is resolved. Leave those partitions empty when the structure is confirmed unchanged; author validated Entries otherwise.
   ${ARCHITECTURE_GENERATE_DELTA}
   - Distinguish Requirement Entries in an Element unit body from the Declaration Entry in its frontmatter.
12. Do NOT generate \`tasks.md\` (code is already implemented).
13. Run \`xirang validate --change "<name>" --json\`. On ERROR/WARNING, repair once from artifact instructions, validate once more, and report the final result.
14. Finish with the output hints. Do NOT generate a presentation artifact or run a separate Diff command.

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
