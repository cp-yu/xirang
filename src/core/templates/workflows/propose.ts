/**
 * Propose workflow template.
 */
import type { SkillTemplate } from '../types.js';
import {
  ARTIFACT_DOC_LANGUAGE_CONTRACT,
  ELEMENT_CONTRACT_SEMANTICS,
  ELEMENT_DEFINITION_SEMANTICS,
  XIRANG_PHILOSOPHY,
  XIRANG_SHARED_CONTEXT,
} from '../fragments/xirang-fragments.js';

export function getOpsxProposeSkillTemplate(): SkillTemplate {
  return {
    name: 'xirang-propose',
    description: 'Propose a new change with all artifacts generated in one step. Use when the user wants to quickly describe what they want to build and get a complete proposal with design, specs, and tasks ready for implementation.',
    instructions: `Propose a new change or update an existing change, generating all artifacts needed for implementation.

${XIRANG_PHILOSOPHY}

${XIRANG_SHARED_CONTEXT}

${ELEMENT_DEFINITION_SEMANTICS}

${ELEMENT_CONTRACT_SEMANTICS}

## Workflow Stage

| Aspect | Value |
|--------|-------|
| **Stage** | \`PROPOSE\` - Artifact generation (no implementation) |
| **Allowed** | Generate proposal, design, tasks, and the four-partition Semantic Delta units in .xirang/changes/<name>/ |
| **Forbidden** | Implement code, modify project files outside the selected change directory |

## Flow

1. Resolve a provisional kebab-case change ID. Ask one focused question when the requested change itself is unclear. Report status only at readiness, blocker, and final-summary points; do not emit per-artifact progress updates.
2. Gather read-only evidence before any write.
   - Run \`xirang list --json\` and inspect relevant existing change artifacts when present.
   - Load the formal Xirang Semantic Model through the shared context above.
   - Run \`xirang arch search <query> --json\` to locate the Elements a request touches.
   - For known or affected Elements, run \`xirang arch query <identity> --relations --depth 2 --json\`, adding \`--contract\` when the current Element Contract matters.
   - Use implementation evidence only where needed to resolve current behavior or lowering constraints.
3. Assess semantic readiness.
   - Reuse a confirmed \`Design Summary\` when the conversation contains one, and state that it is being reused. Route architecture decisions to proposal Architecture Source, \`design.md\`, and the Declaration, Relationship, Metamodel, and View Delta units; route testing strategy to \`design.md\` and concrete test work to \`tasks.md\`; route risk and trade-off decisions to \`design.md\`.
   - Otherwise require a clear problem, impact scope, approach, verification method, and no unresolved Semantic Delta decisions across Definition, Contract, or structural scope. Multi-subsystem scope is evidence, not an automatic Explore requirement; report a gap only when it cannot form one coherent change scope.
   - If readiness is incomplete, list the concrete missing items, recommend \`/xirang:explore\`, and stop: do not create a change directory or modify project files.
   - If the user explicitly overrides the readiness recommendation, continue, but the override does not authorize guessing source decisions. Ask one focused question at a time for every unresolved behavior or architecture decision.
   - For an existing change, assess readiness from existing artifacts, current input, the confirmed Design Summary, formal source, and implementation evidence together.
   - Keep readiness, missing-item, and override state in the conversation only; do not copy it into change artifacts.
4. Resolve change identity after readiness passes or is explicitly overridden.
   - If the user explicitly requests a new change and the ID is unused, run \`xirang new change "<name>"\`.
   - If the user explicitly requests a new change and the ID already exists, stop and ask for a different ID. Do not overwrite, continue, or synthesize an alternative ID.
   - If the user explicitly requests an existing change, update that change in place without asking for another ID.
   - If intent is ambiguous and the ID exists, ask whether to update the existing change or create an independent new change; in non-interactive mode, fail and request an explicit choice.
   - Run \`xirang status --change "<name>" --json\` for \`applyRequires\`, artifact order, dependencies, and schema.
5. Determine source impact before writing \`proposal.md\`.
   - Compare requested observable behavior with formal Element Contracts. Reuse the Element whose Contract already governs the behavior; add a Contract to another Element only for genuinely new observable behavior. An optional-contract Element without a Contract does not by itself require a new one.
   - Compare structural impact with the formal Xirang Semantic Model. Identify affected Element Declarations, refinement, Relationships, Element Kinds, Relationship Kinds, and Authored Views. For every added or modified Declaration, write the complete target Definition, not a summary of what changed. Implementation movement or call/import evidence alone is not a structural change.
   - Determine the Contract and structural scopes of one Semantic Delta. Keep the compatible \`Behavior Source\` and \`Architecture Source\` proposal headings: \`Behavior Source\` lists \`New Specs\` or \`Modified Specs\` as the Element identities whose Element Contract is added or modified, and \`Architecture Source\` lists the identities whose Declaration, Relationship, Metamodel, or View semantics change. Both sections address the same identity space; they separate Contract impact from structural impact, not two kinds of identifier. Use \`None\` only when that scope truly does not change.
6. Generate ready artifacts in dependency order. For each artifact, run \`xirang instructions <artifact-id> --change "<name>" --json\`.
   - For each response, follow the authoring order in the returned \`instruction\`. Keep \`definition\`, dependencies, \`currentState\`, \`configProjection\`, and \`template\` as separate inputs; do not copy non-artifact inputs into artifacts.
   - For \`proposal.md\`, write \`## Source Impact\` with the compatible Behavior Source and Architecture Source sections, referencing Elements by \`identity\`.
   - When creating \`specs\`, write the Element Contract delta into \`.xirang/changes/<name>/elements/<identity>.md\` for exactly the identities declared under proposal \`Behavior Source\`; the frontmatter locates the host Element and the body carries the Requirement Entries. Read the exact Requirement titles from the formal Element Contract before authoring ADDED, MODIFIED, or REMOVED deltas. Express a rename as REMOVED old Requirement plus ADDED new complete Requirement. Author only canonical unlabeled \`#### Scenario: <title>\` headings. Rely on combined change validation for deterministic header compatibility. Follow the returned Specs authoring contract.
   - Route obsolete-test rationale from **Test Maintenance** to \`design.md\` and concrete test updates/removals to \`tasks.md\`. Route **One-time Verification** items to evidence-only \`tasks.md\` Checks with no persistent test file; absence assertions use \`Verifies: <path> REMOVED Requirement\`.
7. Continue until all \`applyRequires\` artifacts are done. If an Element's concept identity, independent modeling reason, scope, or hierarchy boundary remains unresolved, stop and ask one focused question instead of guessing the Definition. Ask one focused question when any other artifact decision remains unresolved.
8. After Specs and Design are complete, reconcile structural scope before writing the remaining Delta units.
   - Re-read proposal Architecture Source, \`design.md\`, the formal Xirang Semantic Model, and current implementation evidence.
   - If Design confirms a different structural impact across Declarations, refinement, Relationships, Kinds, or Views, update only proposal \`Architecture Source\` to declare final scope.
   - Write each affected Entry into its partition under \`.xirang/changes/<name>/\`: \`elements/<identity>.md\` frontmatter for a Declaration Entry, \`relationships/<relationship kind identity>.yaml\` for \`{operation, source, kind, target}\` entries, \`metamodel/<kind identity>.md\` for Kind Entries, and \`views/<view identity>.md\` for Authored View Entries. Every Entry carries \`operation\` and its complete target state; \`REMOVED\` carries identity only; \`relationships/\` has no \`MODIFIED\`.
   - If Architecture Source is \`None\`, leave those partitions empty; do not invent structural changes from Contract changes alone.
   - Validate the Expected Semantic Model with \`xirang arch validate --change "<name>" --json\` and fix all errors before continuing.
9. Check compilation scaffolding before semantic-source validation.
   - Run \`xirang instructions proposal --change "<name>" --json\` and \`xirang instructions design --change "<name>" --json\`; compare each file with its current resolved definition and template.
   - Run \`xirang instructions tasks --change "<name>" --json\` and use deterministic \`validateTaskStructure\`. Support Actions and coarse \`### Task N:\`, Goal, Files, Requirements, Checks, Covers:, Verifies:, change-local \`Verifies:\` Element unit paths, Requirement/Scenario references, Command:, Evidence:, and Expect:. Do NOT invent semantic lint rules beyond the current templates. Do NOT judge whether a check is semantically sufficient.
10. Run combined change validation exactly once with \`xirang validate --change "<name>" --json\`. Do NOT run \`xirang sync\`.
    - ERROR from either scaffolding checks or combined change validation blocks ready-for-apply. Perform at most one repair pass, re-check once, and stop with the remaining blockers if any ERROR remains.
    - WARNING does not block ready-for-apply; retain it for the final summary.
11. Finish with \`xirang status --change "<name>"\`. Summarize artifacts created or updated, validation errors and warnings, and readiness for \`/xirang:apply\`. Do NOT generate a presentation artifact or run a separate Diff command.

## Artifact Contract

${ARTIFACT_DOC_LANGUAGE_CONTRACT}

Keep tasks coarse: \`### Task N:\`, \`Goal\`, \`Files\`, \`Requirements\`, and nested Checks; at most 5 Requirements per task. Preserve canonical headings, IDs, schema keys, paths, commands, BDD keywords, and code identifiers.`,
    license: 'MIT',
    compatibility: 'Requires xirang CLI.',
    metadata: { author: 'xirang', version: '1.0' },
  };
}
