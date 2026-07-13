/**
 * Snack workflow template (code-first artifact reconciliation).
 *
 * Reverse direction of propose/explore/apply: from already-written code back to
 * OpenSpec artifacts. Reconciles proposal, specs, simplified design.md, and
 * opsx-delta.yaml from available code-change evidence; never generates tasks.md
 * because the code is already implemented.
 */
import type { SkillTemplate } from '../types.js';
import {
  ARTIFACT_DOC_LANGUAGE_CONTRACT,
  OPSX_CLI_QUERY_CONTEXT,
  OPSX_COMPILATION_PHILOSOPHY,
  OPSX_GENERATE_DELTA,
  OPSX_SHARED_CONTEXT,
} from '../fragments/opsx-fragments.js';

export function getSnackSkillTemplate(): SkillTemplate {
  return {
    name: 'openspec-snack',
    description:
      'Quick code-first artifact reconciliation: from already-written code, conditionally create or update proposal + specs + simplified design + OPSX delta using available code-change evidence. Use after iterative coding to back-fill OpenSpec artifacts without redoing propose→apply. Does not generate tasks.md.',
    instructions: `Reconcile OpenSpec artifacts from already-written code (code-first artifact reconciliation, reverse of propose/apply).

${OPSX_COMPILATION_PHILOSOPHY}

snack performs artifact reconciliation, not unconditional regeneration. Treat \`proposal.md\`, \`design.md\`, \`specs/*/spec.md\`, and \`opsx-delta.yaml\` as conditional artifacts: create them when missing, update them when stale or inconsistent, and leave them unchanged when current.

## Input

- Optional \`<change-name>\` (kebab-case).
- If omitted, run \`openspec list --json\` and reuse the single active change; if multiple or none, ask which change name to target.

## Flow

1. Resolve change name and reconcile mode.
   - If \`openspec/changes/<name>/\` does not exist (no matching change), run \`openspec new change "<name>"\`, then create only the artifacts required by the evidence.
   - If the change already exists (existing change, possibly stale), read its current \`proposal.md\`, \`design.md\`, \`specs/\`, and \`opsx-delta.yaml\` before writing anything; do not recreate a valid proposal.
   - Classify each artifact as **missing**, **stale**, **inconsistent**, or **current** against the collected evidence, and reconcile only the missing, stale, or inconsistent ones.
2. Load shared OPSX context before generating artifacts.
${OPSX_SHARED_CONTEXT}
3. Collect code-change evidence from all available sources (conversation-guided union).
   - Use conversation context to guide scope and intent; treat code evidence as concrete file and behavior facts.
   - Collect changed files and symbol-level changes from applicable git commands: \`git diff --name-only\`, \`git diff\`, \`git diff --cached --name-only\`, \`git diff --cached\`, \`git diff HEAD --name-only\`, and \`git diff HEAD\`.
   - \`git diff\` is one evidence source among several; it MUST NOT be treated as the only valid source.
   - A user-specified commit, commit range, or branch range given in natural language is an agent-parsed evidence selector (e.g. \`git diff <range> --name-only\`), not a formal OpenSpec CLI flag.
   - Exclude non-code files (\`.md\`, \`.json\`, \`.yaml\`, lock files) from spec inference.
   - Mark conflicts or uncertain mappings with \`[REVIEW NEEDED]\`.
4. Map changed symbols/files to capabilities using current evidence.
   - Use capability IDs/intents, OPSX relations, and spec coverage as semantic context.
   - If CodeGraph is available, use symbol/call/import evidence as an optional accelerator; never read \`.codegraph/codegraph.db\`.
   - Otherwise use ACE, \`rg\`, and \`read\`; uncertain mappings remain \`[REVIEW NEEDED]\` and MUST NOT silently create capabilities.
5. Map capabilities to existing specs via spec registry.
   - Run \`openspec list --specs --json\` to get all specs with their \`capabilities\` field.
   - For each capability ID from step 4 evidence mapping:
     - If the capability ID appears in any spec's \`capabilities\` array → mark as **Modified Capability** and record the spec directory name.
     - If no existing spec covers it → mark as **New Capability**.
   - Use this mapping when reconciling the proposal's \`## Capabilities\` section.
6. Use CLI-backed OPSX navigation after evidence mapping.
${OPSX_CLI_QUERY_CONTEXT}
7. Reconcile \`proposal.md\`.
   - Run \`openspec instructions proposal --change "<name>" --json\`.
   - Use the returned \`template\`, \`instruction\`, \`outputPath\`, and \`configProjection\`; do not invent non-template sections.
   - Determine the \`## Capabilities\` list before specs generation and reuse the same list as specs input.
   - Reuse the confirmed evidence mapping; uncertain inference MUST be marked \`[REVIEW NEEDED]\`.
   - Preserve the template headings including \`## Why\`, \`## What Changes\`, \`## Capabilities\`, and \`## Impact\`.
   - If an existing proposal already matches the evidence and capability mapping, leave it current and report that no reconciliation was needed.
8. Reconcile delta specs in \`specs/<capability>/spec.md\`.
   - Run \`openspec instructions specs --change "<name>" --json\`.
   - Use the returned \`template\`, \`instruction\`, \`outputPath\`, and \`configProjection\`; do not invent non-template sections.
   - Follow the returned \`instruction\` for ADDED/MODIFIED selection, spec directory naming, and MODIFIED requirement title matching.
   - Reuse an existing \`openspec/specs/<capability>/\` directory when the instruction says it applies; otherwise use the proposal capability name.
   - New concerns use \`## ADDED Requirements\`; changed existing behavior uses \`## MODIFIED Requirements\` with the exact existing Requirement title.
   - Requirement text MUST contain SHALL/MUST language and at least one \`#### Scenario:\` block with WHEN/THEN style.
   - Do not author scenario operation labels during reconciliation; they are generated only after final validation by the explicit CLI step below and remain change-local review metadata.
   - Preserve unrelated existing delta requirements unless the evidence makes them stale or inconsistent.
   - Mark uncertain inferences with \`[REVIEW NEEDED]\`.
9. Reconcile simplified \`design.md\`.
   - Run \`openspec instructions design --change "<name>" --json\`.
   - Use the returned \`template\`, \`instruction\`, \`outputPath\`, and \`configProjection\`; do not invent non-template sections.
   - Preserve the full template skeleton: Context, Goals / Non-Goals, Decisions, and Risks / Trade-offs.
   - Mark inferred content with \`[INFERRED FROM CODE]\`; mark unresolved risks or trade-offs with \`[REVIEW NEEDED]\`.
   - If an existing design is current against the evidence, leave unrelated design content unchanged and report that no reconciliation was needed.
10. Reconcile \`opsx-delta.yaml\` ONLY when evidence shows new/deleted exports or new files; otherwise skip and log "No architecture-level changes detected. Skipping OPSX delta reconciliation".
   ${OPSX_GENERATE_DELTA}
   - Distinguish delta spec Markdown headings (\`## ADDED Requirements\`, \`## MODIFIED Requirements\`) from OPSX delta YAML keys (\`ADDED\`, \`MODIFIED\`, \`REMOVED\`).
11. Do NOT generate \`tasks.md\` (code is already implemented).
12. Run \`openspec validate "<name>" --type change --json\` after all reconciled artifacts are written.
   - If validation returns ERROR or WARNING, run one repair pass using the relevant artifact \`instruction\` rules, then run \`openspec validate "<name>" --type change --json\` once more.
   - Treat the second validation result as final evidence.
   - Output validate result: if passed, indicate self-check passed; if ERROR/WARNING remain, list each and advise user review.
13. Run \`openspec scenario-labels "<name>" --write\` after validate to add deterministic change-local scenario operation labels. Treat this as trusted programmatic metadata generation and SHALL NOT run validate again only because scenario labels were added.
14. Finish with the output hints below, including the validate result.

## Output Hints

After artifacts are reconciled, output:

⚠️ Generated specs are based on code inference. Review items marked [REVIEW NEEDED]

1. **Quick sync**: \`openspec sync "<change-name>" --no-verify\`
2. **Quick archive**: \`openspec archive "<change-name>" --no-verify\`
3. **Sync and archive**: \`openspec sync "<change-name>" --no-verify && openspec archive "<change-name>" --no-verify\`
4. **Continue development**: review change → modify code → run \`/opsx:snack\` again → continue iterating

## Artifact Contract

${ARTIFACT_DOC_LANGUAGE_CONTRACT}

Keep generated specs coarse and behavior-focused; preserve template headings, canonical IDs, schema keys, BDD keywords, paths, commands, and code identifiers.`,
    license: 'MIT',
    compatibility: 'Requires openspec CLI.',
    metadata: { author: 'openspec', version: '1.0' },
  };
}
