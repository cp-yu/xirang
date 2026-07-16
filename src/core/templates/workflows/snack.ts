/**
 * Snack workflow template (code-first artifact reconciliation).
 */
import type { SkillTemplate } from '../types.js';
import {
  ARTIFACT_DOC_LANGUAGE_CONTRACT,
  OPSX_CLI_QUERY_CONTEXT,
  OPENSPEC_PHILOSOPHY,
  OPSX_GENERATE_DELTA,
  OPSX_SHARED_CONTEXT,
} from '../fragments/opsx-fragments.js';

const DEFINITION_FIRST = `Read the resolved \`definition\` first. Before writing, use \`content.includes\` and \`content.excludes\` to decide what belongs in the artifact, obey \`writePolicy\`, then follow \`instruction\` and fill the canonical structure from \`template\`. Use \`outputPath\` and \`configProjection\`; MUST NOT copy definition, projection, context, rules, or reasoning into the artifact.`;

export function getSnackSkillTemplate(): SkillTemplate {
  return {
    name: 'openspec-snack',
    description:
      'Quick code-first artifact reconciliation: from already-written code, conditionally create or update proposal + specs + simplified design + OPSX delta using available code-change evidence. Use after iterative coding to back-fill OpenSpec artifacts without redoing propose→apply. Does not generate tasks.md.',
    instructions: `Reconcile OpenSpec artifacts from already-written code (code-first artifact reconciliation, reverse of propose/apply).

${OPENSPEC_PHILOSOPHY}

Treat \`proposal.md\`, \`design.md\`, \`specs/*/spec.md\`, and \`opsx-delta.yaml\` as conditional artifacts: create them when missing, update them when stale or inconsistent, and leave them unchanged when current.

## Input

- Optional \`<change-name>\` (kebab-case).
- If omitted, run \`openspec list --json\` and reuse the single active change; if multiple or none, ask which change name to target.

## Flow

1. Resolve change name and reconcile mode.
   - If \`openspec/changes/<name>/\` does not exist, run \`openspec new change "<name>"\` and create only artifacts required by evidence.
   - Otherwise read current proposal, design, Specs, and OPSX delta; classify each as **missing**, **stale**, **inconsistent**, or **current** and preserve unrelated human-authored content.
2. Load shared OPSX context.
${OPSX_SHARED_CONTEXT}
3. Collect code-change evidence from conversation context plus \`git diff --cached\`, \`git diff HEAD\`, other available working-tree/staged diffs, and user-selected commit/range diffs. \`git diff\` is one evidence source among several and MUST NOT be treated as the only valid source. Treat natural-language commit/range selectors as agent-parsed evidence selectors, not OpenSpec CLI flags. Mark conflicts or uncertainty \`[REVIEW NEEDED]\`.
4. Map changed symbols/files to current architecture context.
   - Use formal OPSX capability IDs, intents, ownership, boundaries, and relations.
   - CodeGraph MAY accelerate symbol/call/import discovery; otherwise use ACE, \`rg\`, and \`read\`. Never read \`.codegraph/codegraph.db\`.
   - Treat code locations and call/import edges as implementation evidence, not as proof that OPSX must change. Do not create capabilities from uncertain file-name inference.
5. Determine Behavior Source impact.
   - Run \`openspec list --specs --json\` and keep each Spec ID separate from its \`capabilities\` string array.
   - Add an existing Spec ID to **Modified Specs** only when its observable requirements change. Add a **New Spec** only for genuinely new observable behavior not governed by an existing Spec.
   - An OPSX capability absent from every Spec's \`capabilities\` array does not by itself require a New Spec; mark missing coverage \`[REVIEW NEEDED]\`.
   - Behavior-preserving refactors create no delta Spec; later Checks use \`Preserves:\` against formal Specs.
6. Determine Architecture Source impact.
   - Declare impact only when durable capability responsibility, domain boundary, ownership, or semantic relation changes.
   - Implementation-only movement, symbol renaming, helper extraction, and mechanical call/import changes do not by themselves change OPSX.
   - If no durable architecture fact changes, set Architecture Source to \`None\`. If impact remains unresolved, stop and ask one focused question; do not write \`opsx-delta.yaml\` or claim reconciliation complete.
7. Use CLI-backed OPSX navigation.
${OPSX_CLI_QUERY_CONTEXT}
8. Reconcile \`proposal.md\`.
   - Run \`openspec instructions proposal --change "<name>" --json\`. ${DEFINITION_FIRST}
   - Reconcile \`## Source Impact\` from independently determined Behavior Source and Architecture Source impact. Keep Spec IDs distinct from OPSX node IDs.
   - Reuse the confirmed Behavior Source list as the delta Spec input; preserve \`## Why\`, \`## What Changes\`, \`## Source Impact\`, and \`## Impact\`.
   - If the proposal already matches evidence and source impact, leave it unchanged.
9. Reconcile delta Specs in \`specs/<spec-id>/spec.md\`.
   - Run \`openspec instructions specs --change "<name>" --json\`. ${DEFINITION_FIRST}
   - Create or update only Specs declared under Behavior Source. Do not derive the directory name directly from an OPSX capability ID.
   - Follow returned \`## ADDED Requirements\`, \`## MODIFIED Requirements\`, REMOVED/RENAMED rules, exact title matching, canonical Requirement/Scenario syntax, and label guidance. Preserve unrelated current delta content.
10. Reconcile simplified \`design.md\`.
   - Run \`openspec instructions design --change "<name>" --json\`. ${DEFINITION_FIRST}
   - Preserve Context, Goals / Non-Goals, Decisions, and Risks / Trade-offs. Mark inferred content \`[INFERRED FROM CODE]\` and unresolved decisions \`[REVIEW NEEDED]\`.
11. Reconcile \`opsx-delta.yaml\` only after Architecture Source is resolved. Create a canonical no-op containing only \`schema_version: 2\` when architecture is confirmed unchanged; a real delta otherwise.
   ${OPSX_GENERATE_DELTA}
   - Distinguish delta Spec Markdown headings from OPSX delta YAML keys (\`ADDED\`, \`MODIFIED\`, \`REMOVED\`).
12. Do NOT generate \`tasks.md\` (code is already implemented).
13. Run \`openspec validate "<name>" --type change --json\`. On ERROR/WARNING, repair once from artifact instructions, validate once more, and report the final result.
14. Run \`openspec scenario-labels "<name>" --write\` after validate to add deterministic change-local scenario operation labels. SHALL NOT run validate again only because scenario labels were added.
15. Finish with the output hints.

## Output Hints

⚠️ Generated specs are based on code inference. Review items marked [REVIEW NEEDED]

1. **Quick sync**: \`openspec sync "<change-name>" --no-verify\`
2. **Quick archive**: \`openspec archive "<change-name>" --no-verify\`
3. **Sync and archive**: \`openspec sync "<change-name>" --no-verify && openspec archive "<change-name>" --no-verify\`
4. **Continue development**: review change → modify code → run \`/opsx:snack\` again → continue iterating

## Artifact Contract

${ARTIFACT_DOC_LANGUAGE_CONTRACT}

Preserve canonical headings, IDs, schema keys, BDD keywords, paths, commands, and code identifiers.`,
    license: 'MIT',
    compatibility: 'Requires openspec CLI.',
    metadata: { author: 'openspec', version: '1.0' },
  };
}
