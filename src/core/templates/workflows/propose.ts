/**
 * Propose workflow template.
 */
import type { SkillTemplate } from '../types.js';
import {
  ARTIFACT_DOC_LANGUAGE_CONTRACT,
  OPSX_CLI_QUERY_CONTEXT,
  OPENSPEC_PHILOSOPHY,
  OPSX_SHARED_CONTEXT,
} from '../fragments/opsx-fragments.js';

export function getOpsxProposeSkillTemplate(): SkillTemplate {
  return {
    name: 'openspec-propose',
    description: 'Propose a new change with all artifacts generated in one step. Use when the user wants to quickly describe what they want to build and get a complete proposal with design, specs, and tasks ready for implementation.',
    instructions: `Propose a new change and generate all artifacts needed for implementation.

${OPENSPEC_PHILOSOPHY}

## Workflow Stage

| Aspect | Value |
|--------|-------|
| **Stage** | \`PROPOSE\` - Artifact generation (no implementation) |
| **Allowed** | Generate proposal, design, specs, tasks, opsx-delta in openspec/changes/<name>/ |
| **Forbidden** | Implement code, modify existing project files |

## Flow

1. Resolve a kebab-case change name. Ask one focused question when the requested change itself is unclear.
2. Apply smart routing: inspect the current conversation for an explore-generated \`Design Summary\`. If absent, respect \`propose.smartRouting: false\` and \`propose.requireExplore: false\`; otherwise score the user's input across 5 dimensions. Detect multi-subsystem scope. Report one of: "Design Summary found: proceed and show that Design Summary is being used", "Input is sufficiently detailed. Skipping explore; generating artifacts directly.", or "This request spans multiple independent subsystems. Consider running \`/opsx:explore\` to decompose it first." Show input length, detail score, multi-subsystem result, and final decision. Route obsolete-test rationale from **Test Maintenance** to \`design.md\` and concrete test updates/removals to \`tasks.md\`. Route **One-time Verification** items to evidence-only \`tasks.md\` Checks with no persistent test file; absence assertions use \`Verifies: <path> REMOVED Requirement\`.
3. Run \`openspec list --json\` before creation. If the target change exists, ask whether to continue it or use a new name; in non-interactive mode, fail and request an explicit choice. Otherwise run \`openspec new change "<name>"\`. Then run \`openspec status --change "<name>" --json\` for \`applyRequires\`, artifact order, dependencies, and schema.
4. Load shared OPSX context.
${OPSX_SHARED_CONTEXT}
5. Determine the initial source impact before creating \`proposal.md\`.
   - Run \`openspec list --specs --json\`. A Spec ID identifies \`openspec/specs/<spec-id>/spec.md\`; each entry in its \`capabilities\` string array is an associated canonical OPSX capability ID. Specs without frontmatter return \`capabilities: []\`.
   - Compare requested observable behavior with formal Specs. Reuse an existing Spec that owns the behavior; propose a New Spec only for genuinely new observable behavior. An OPSX capability missing Spec coverage does not by itself require a New Spec.
   - Compare durable architecture impact with the formal OPSX bundle. Identify affected OPSX node IDs, responsibility, ownership, boundaries, and semantic relations. Implementation movement or call/import evidence alone is not an architecture-source change.
   - Determine Behavior Source and Architecture Source independently. Behavior Source uses \`New Specs\` or \`Modified Specs\` with Spec IDs; Architecture Source uses OPSX node IDs. Use \`None\` only when that source truly does not change; ask one focused question for unresolved scope.
6. Use CLI-backed OPSX navigation.
${OPSX_CLI_QUERY_CONTEXT}
7. Generate ready artifacts in dependency order. For each artifact, run \`openspec instructions <artifact-id> --change "<name>" --json\`.
   - Read the resolved \`definition\` first. Before writing, use \`content.includes\` and \`content.excludes\` to decide what belongs, obey \`writePolicy\`, then follow \`instruction\` and fill the canonical structure from \`template\`. Read dependencies/current state and \`configProjection\` separately. Do not copy definition, context, rules, config projection, or Agent reasoning into artifacts.
   - For \`proposal.md\`, write \`## Source Impact\` with independent Behavior Source and Architecture Source sections. Keep Spec IDs distinct from OPSX node IDs.
   - Before writing change-local specs, run \`openspec check-delta --change "<name>" --caps <spec-id> --added <header> --modified <header> --removed <header> --renamed-from <header>\`. Missing and Conflict results are blocking before writing specs. Missing and Conflict results block spec authoring. When creating \`specs\`, create or modify only the Spec IDs declared under proposal \`Behavior Source\`. Use the resolved Specs definition to route non-behavior content to design/tasks/proposal/opsx-delta. Agent MUST NOT author scenario labels.
8. Continue until all \`applyRequires\` artifacts are done. Ask one focused question when an artifact decision remains unresolved.
9. After Specs and Design are complete, reconcile architecture scope before generating \`opsx-delta.yaml\`.
   - Re-read proposal Architecture Source, \`design.md\`, the formal OPSX bundle, and current implementation evidence.
   - If Design confirms a different durable architecture impact, update only proposal \`Architecture Source\` to declare final scope.
   - Run \`openspec instructions opsx-delta --change "<name>" --json\`. Real deltas use non-empty \`ADDED:\`, \`MODIFIED:\`, and \`REMOVED:\` YAML sections only when needed. Proposal declares scope; only \`opsx-delta.yaml\` defines exact target-state node operations and canonical relations.
   - If Architecture Source is \`None\`, write the canonical no-op \`schema_version: 2\` and do not invent OPSX operations from behavior changes alone.
10. Run warning-only post-propose validation. This validation is warning-only. Do NOT turn \`/opsx:propose\` into a blocking gate.
   - Run \`openspec validate --change "<name>" --artifacts specs --json\`, \`openspec validate --change "<name>" --artifacts opsx-delta --json\`, then \`openspec validate --change "<name>" --json\`.
   - Align with \`Validator.validateChangeDeltaSpecs()\`, SHALL/MUST requirement text, required \`#### Scenario:\` blocks, \`Validator.validateOpsxDelta()\`, \`applyOpsxDelta()\`, referential integrity, and relation semantic validation. Do NOT run \`openspec sync\`; report when validation skips this check.
   - For lightweight structure checks, run \`openspec instructions proposal --change "<name>" --json\`, \`openspec instructions design --change "<name>" --json\`, and \`openspec instructions tasks --change "<name>" --json\`; use \`validateTaskStructure\`. Support Actions and coarse \`### Task N:\`, Goal, Files, Requirements, Checks, Covers:, Verifies:, change-local \`Verifies:\` spec paths, Requirement/Scenario references, Command:, Evidence:, and Expect:. Do NOT invent semantic lint rules beyond the current templates. Do NOT judge whether a check is semantically sufficient.
   - If warnings appear, do exactly one repair pass, re-check once, and report remaining warnings.
11. After validation, run \`openspec scenario-labels "<name>" --write\`. This trusted programmatic metadata generation does not require a second validate pass. Labels remain change-local review metadata; sync/archive consume and clean existing labels but do not generate them.
12. Finish with \`openspec status --change "<name>"\` and report artifacts created plus readiness for \`/opsx:apply\`.

## Artifact Contract

${ARTIFACT_DOC_LANGUAGE_CONTRACT}

Keep tasks coarse: \`### Task N:\`, \`Goal\`, \`Files\`, \`Requirements\`, and nested Checks; at most 5 Requirements per task. Preserve canonical headings, IDs, schema keys, paths, commands, BDD keywords, and code identifiers.`,
    license: 'MIT',
    compatibility: 'Requires openspec CLI.',
    metadata: { author: 'openspec', version: '1.0' },
  };
}
