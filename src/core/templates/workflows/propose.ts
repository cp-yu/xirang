/**
 * Propose workflow template.
 */
import type { SkillTemplate } from '../types.js';
import { BUSINESS_SPECIFICATION_STANDARD_ROOT } from '../fragments/business-specification-standard-root.js';
import {
  ARTIFACT_DOC_LANGUAGE_CONTRACT,
  ELEMENT_CONTRACT_SEMANTICS,
  ELEMENT_DEFINITION_SEMANTICS,
  STRUCTURAL_DECOMPOSITION_GUIDANCE,
  TEST_QUALITY_GUIDANCE,
  XIRANG_PHILOSOPHY,
  XIRANG_SHARED_CONTEXT,
} from '../fragments/xirang-fragments.js';

export function getXirangProposeSkillTemplate(): SkillTemplate {
  return {
    name: 'xirang-propose',
    description: 'Propose a new change with all artifacts generated in one step. Use when the user wants to quickly describe what they want to build and get a complete proposal with design, specs, and tasks ready for implementation.',
    instructions: `Propose a new change or update an existing change, documenting the confirmed design as complete artifacts for implementation. Explore forms and confirms the design; Propose documents it and checks for gaps, rather than silently redesigning it.

${XIRANG_PHILOSOPHY}

${BUSINESS_SPECIFICATION_STANDARD_ROOT}

${TEST_QUALITY_GUIDANCE}

${XIRANG_SHARED_CONTEXT}

${ELEMENT_DEFINITION_SEMANTICS}

${ELEMENT_CONTRACT_SEMANTICS}

${STRUCTURAL_DECOMPOSITION_GUIDANCE}

## Workflow Stage

| Aspect | Value |
|--------|-------|
| **Stage** | \`PROPOSE\` - Artifact generation (no implementation) |
| **Allowed** | Generate proposal, design, tasks, and the four-partition Semantic Delta units in .xirang/changes/<name>/ |
| **Forbidden** | Implement code, directly modify project files outside the selected change directory; the only external write is post-gate \`framing consume\` for the explicit reviewed source |

## Confirmed design inputs

MUST read \`.xirang/references/xirang-definition-framing.md\` at entry, then discover records through the CLI even when the handoff does not mention one. Re-read on resume, record changes, and before source handoff; use its authorization, conflict, and reload protocol rather than reconstructing it. Propose MUST NOT create, update, rename, or discard records. If conflict resolution or drift requires a record revision, stop and return to Explore; its revised identity/version handoff must be rechecked before continuing. The shared protocol does not expand this stage boundary. A record is formation evidence, not a complete Semantic Delta. With no record, require the source to declare its record decision before compiling: an explicit user-granted exemption or a stated absence of normative content. An undeclared absence is a blocker, not an ordinary path, and MUST NOT be treated as an implicit exemption.

## Documentation and gap handling

- **Faithful elaboration**: expand confirmed mechanisms into complete prose, diagrams, Acceptance Cases and task/verification arrangements; repair omissions, duplicates and expression or derivation errors without changing confirmed commitments. Reasonable inferred details, including supporting guarantees, may be authored without another confirmation when they stay within the agreed scope and approach and do not materially change business outcomes, user obligations or architectural trade-offs. They need a stated basis, not proof that they are uniquely implied; disclose them at completion. Check authored branch outcomes, defaults, error results and restrictions against the confirmed conversation and design, including catch-all branches such as "otherwise". Do not ask the user to fix an Agent writing error when the confirmed design already determines the answer.
- **Decision gap**: when completion would change a confirmed commitment, expand scope, or settle a material business or architecture trade-off, explain the gap and alternatives, recommend with reasons, then ask one focused question and wait before writing the choice as settled. An isolated gap can be confirmed within Propose; substantial redesign belongs in Explore. A required record revision still follows the shared return-to-Explore protocol. A direct-Propose request or a request not to ask questions does not supply a missing decision; report the blocker instead of guessing.
- **Propagation and disclosure**: after confirmation, reconcile the affected Delta and Plan together. Do not hide a new observable behavior solely in design or tasks. Track Propose additions in the conversation for the final report; do not create a separate supplement ledger or add authorship/confirmation status to normative Contract text. Completion reporting covers both faithful elaborations and newly confirmed decisions; inferred details need disclosure, while material decisions require prior confirmation. Reconcile inferred observable guarantees into the Contract and Plan; do not add them to the confirmed source record or present them as user confirmations.

## Flow

1. Resolve a provisional kebab-case change ID. Ask one focused question when the requested change itself is unclear. Report status only at readiness, blocker, and final-summary points; do not emit per-artifact progress updates.
2. Gather read-only evidence before any write.
   - Run \`xirang list --json\` and inspect relevant existing change artifacts when present.
   - Run \`xirang framing list --json\`. Select a relevant Change-context record by immutable \`explorationId\`, then run \`xirang framing show <explorationId> --json\`, \`xirang framing status <explorationId> --json\`, and \`xirang framing validate <explorationId> --json\`. Read the complete current payload and retain \`sourceVersion\`; do not reconstruct it from Summary. Apply the shared reload/conflict gate to the record, Summary, and current context. Unresolved conflicts block Formation. A changed record invalidates affected Summary and coverage conclusions until reconciled and reconfirmed.
   - Load the formal Xirang Semantic Model through the shared context above.
   - Run \`xirang arch search <query> --json\` to locate the Elements a request touches.
   - For known or affected Elements, run \`xirang arch impact <identities...> --depth 2 --json\` to discover structural and Relationship context, then run one batch \`xirang arch query <selected-identities...> --contract --json\` for the selected complete semantics.
   - Use implementation evidence only where needed to resolve current behavior or lowering constraints.
3. Assess semantic readiness.
   - Reuse a confirmed, still-current \`Design Summary\` when the conversation contains one, and state that it is being reused. Route architecture decisions to proposal Architecture Source, \`design.md\`, and the Declaration, Relationship, Metamodel, and View Delta units; route testing strategy to \`design.md\` and concrete test work to \`tasks.md\`; route risk and trade-off decisions to \`design.md\`.
   - Otherwise require a clear problem, impact scope, approach, verification method, and no unresolved Semantic Delta decisions across Definition, Contract, or structural scope. Multi-subsystem scope is evidence, not an automatic Explore requirement; report a gap only when it cannot form one coherent change scope.
   - If readiness is incomplete, list the concrete missing items and use Documentation and gap handling: confirm an isolated decision here or recommend \`/xirang:explore\` for substantial design work. Until readiness passes or is explicitly overridden, do not create a change directory or modify project files.
   - If the user explicitly overrides the readiness recommendation, continue within that authorization, but the override does not authorize guessing source decisions. Ask one focused question at a time for every unresolved material behavior or architecture decision before authoring dependent content.
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
   - Do not redo confirmed structural decisions. A partial record leaves room for unconfirmed structure: when source impact requires a new or reorganized hierarchy, apply the Structural Decomposition Guidance to the unresolved scope and obtain user confirmation before authoring target sibling sets. If the configured guidance is unavailable or insufficient, stop Formation and ask one focused question; do not fall back to another method or infer structure from implementation layout.
   - Compile normative confirmations into the appropriate complete Delta targets, preserving conditions, numbers, exceptions, and timing; retain informative material in Plan or provenance without inventing obligations. Confirm no-op when current semantics already satisfy an entry. Missing behavior belongs in the host Contract, not Tasks.
   - When Architecture Source is \`None\`, do not invoke decomposition guidance or invent hierarchy changes.
   - Determine the Contract and structural scopes of one Semantic Delta. Keep the compatible \`Behavior Source\` and \`Architecture Source\` proposal headings: \`Behavior Source\` lists \`New Specs\` or \`Modified Specs\` as the Element identities whose Element Contract is added or modified, and \`Architecture Source\` lists the identities whose Declaration, Relationship, Metamodel, or View semantics change. Both sections address the same identity space; they separate Contract impact from structural impact, not two kinds of identifier. Use \`None\` only when that scope truly does not change.
6. Generate ready artifacts in dependency order. For each artifact, run \`xirang instructions <artifact-id> --change "<name>" --json\`.
   - For each response, follow the authoring order in the returned \`instruction\`. Keep \`definition\`, dependencies, \`currentState\`, \`configProjection\`, and \`template\` as separate inputs; do not copy non-artifact inputs into artifacts.
   - For \`proposal.md\`, write \`## Source Impact\` with the compatible Behavior Source and Architecture Source sections, referencing Elements by \`identity\`.
   - When creating \`specs\`, write the Element Contract delta into \`.xirang/changes/<name>/elements/<identity>.md\` for exactly the identities declared under proposal \`Behavior Source\`; the frontmatter locates the host Element and the body carries the Section Entries. Read the exact Section titles from the formal Element Contract before authoring ADDED, MODIFIED, or REMOVED deltas. Express a rename as REMOVED old Section plus ADDED new complete Section. Author only canonical \`### Section: <title>\` headings; a Section body is free-form. Rely on combined change validation for deterministic header compatibility. Follow the returned Specs authoring contract.
   - Route obsolete-test rationale from **Test Maintenance** to \`design.md\` and concrete test updates/removals to \`tasks.md\`. Route **One-time Verification** items to evidence-only \`tasks.md\` Checks with no persistent test file; absence assertions use \`Verifies: <path> REMOVED Section\`.
7. Continue until all \`applyRequires\` artifacts are done, applying Documentation and gap handling to newly discovered omissions. If an Element's concept identity, independent modeling reason, scope, or hierarchy boundary remains unresolved, stop and ask one focused question instead of guessing the Definition. Use faithful elaboration for reasonable details; ask before settling a material decision gap.
8. After Specs and Design are complete, reconcile structural scope before writing the remaining Delta units.
   - Re-read proposal Architecture Source, \`design.md\`, the formal Xirang Semantic Model, and current implementation evidence.
   - If a user-confirmed decision recorded in Design changes structural impact across Declarations, refinement, Relationships, Kinds, or Views, update only proposal \`Architecture Source\` to declare final structural scope, then reconcile the affected Delta and Plan. Writing a choice in Design does not itself confirm it.
   - Write each affected Entry into its partition under \`.xirang/changes/<name>/\`: \`elements/<identity>.md\` frontmatter for a Declaration Entry, \`relationships/<relationship kind identity>.yaml\` for \`{operation, source, kind, target}\` entries, \`metamodel/<kind identity>.md\` for Kind Entries, and \`views/<view identity>.md\` for Authored View Entries. Every Entry carries \`operation\` and its complete target state; \`REMOVED\` carries identity only; \`relationships/\` has no \`MODIFIED\`.
   - If Architecture Source is \`None\`, leave those partitions empty; do not invent structural changes from Contract changes alone.
   - Validate the Expected Semantic Model with \`xirang arch validate --change "<name>" --json\` and fix all errors before continuing.
9. Check compilation scaffolding before semantic-source validation.
   - Run \`xirang instructions proposal --change "<name>" --json\` and \`xirang instructions design --change "<name>" --json\`; compare each file with its current resolved definition and template.
   - Run \`xirang instructions tasks --change "<name>" --json\`. Support Actions and coarse \`### Task N:\`, Goal, Files, Sections, Checks, Covers:, Verifies:, change-local \`Verifies:\` Element unit paths, Section references, Command:, Evidence:, and Expect:. Do NOT invent semantic lint rules beyond the current templates. Apply Test Quality Guidance when compiling verification work. A Check is an evidence unit, not necessarily one test case. Group Acceptance Cases that represent one observable behavior and failure reason into one Check. Do not create Checks solely to match Acceptance Case count. Prefer modifying an existing test over adding a parallel test for the same behavior. Each Check SHALL declare Test action: reuse, modify, add, delete, or one-time. Route non-persistent evidence to one-time Checks without a test file. Task structure validation is owned by step 10's combined validation as a deterministic operation.
   - Make implementation work and dependencies concrete using Contract references, not a second behavior specification. Keep prompt source, managed projection, and its behavioral checks in the same loop as the behavior they deliver.
   - Before ready-for-apply, cross-check Goals, Files, Sections, and Checks as independently implementable and verifiable end-to-end loops. Production code, configuration, generated surfaces, and tests that jointly deliver one behavior MUST remain in one task. Split only when each task reaches its own GREEN independently, or when it depends only on an earlier task that is already GREEN; a task's RED/GREEN cycle MUST NOT depend on a later task. Do not split tasks by component, module, directory, or file type. Split by spec container when a Section, a safeguards item, or an acceptance case is itself an independently verifiable unit. When a later task is required for GREEN, Checks are split 1:1 with Acceptance Cases, or persistent tests only lock wording or cannot catch a real behavior mutation, reconcile those Checks and task boundaries before declaring the Change ready for Apply.
   - Derive dependencies from verification: in execution order, trace each Check to the implementation, files and commands it actually needs. Can it reach GREEN using only existing implementation, earlier GREEN tasks and that task? Reorder or regroup work when a later task is needed; ensure referenced test files and commands exist or are provided by then. Reading declared dependencies alone is not this check.
10. Run the closing consistency gate: first the plan consistency review, then the deterministic validation.
    - First review plan consistency: recheck the Delta, \`design.md\` and \`tasks.md\` against the confirmed design and any decisions confirmed during Propose, not merely against one another. Fix the artifacts yourself when they contradict each other and the confirmed source determines the correction; when a contradiction reflects misalignment with user intent or a confirmed decision, present all findings at once and wait for the user to rule, requesting one decision at a time.
    - Challenge the complete mechanism and its acceptance outcomes: try relevant boundary or competing-event sequences, tracing initial state, event order and expected outcome against invariants, timing and failure behavior. Check that the proposed implementation can realize those outcomes; do not substitute a list of scenario names for the reasoning. Repair expression or derivation errors without changing confirmed decisions; otherwise use Documentation and gap handling. A passing reference check cannot establish that a mechanism is coherent.
    - Perform two Agent coverage checks: record → Expected Semantic Model, then target semantics → implementation tasks and observable Checks. Use the loaded record as the authoring baseline from the start, not just a final validation attachment. Compare against the actual current record, not merely agreement among Delta, design, and tasks: shared omissions still block completion. A valid Section reference does not prove its command verifies the behavior. Repair missing normative detail in the Contract first, then reconcile Plan and Checks; ask the user when intent remains unresolved. Do not duplicate a permanent coverage ledger.
    - The first check is entry by entry against the record's own identities, not a narrative judgement. Walk every normative entry and mark each one placed in a Declaration, Contract, Relationship, Metamodel, or Authored View target, or report it uncovered with the reason. An entry left unmarked counts as uncovered and blocks ready-for-apply. For each entry, give its target location and a concise semantic finding preserving its conditions, exceptions and timing; a matching phrase or location alone is not proof. State the count of entries checked and the uncovered identities explicitly. When the source is an exemption or carries no normative content, state that instead of reporting a passing check by silence.
    - The second check stays outcome-oriented: every normative entry already placed in the target model must have a task and an observable Check that can falsify it, and no Check may exist without a target behavior behind it.
    - Then run the deterministic validation on the final artifacts after user rulings: \`xirang validate --change "<name>" --json\`, which owns combined validation, effective-diff review, and task structure validation. Do NOT run \`xirang sync\`.
    - Errors from deterministic validation or the scaffolding checks block ready-for-apply. Fix at most one round and recheck once; remaining errors stay blocking. Formatting repairs may only restate existing commitments; they must not invent restrictions to satisfy a validator. Recheck any affected semantic conclusions after repairs.
    - WARNING does not block ready-for-apply; retain it for the final summary.
11. Complete source handoff only when a confirmed design record exists.
    - Reload with \`xirang framing show <explorationId> --json\`, \`xirang framing status <explorationId> --json\`, and \`xirang framing validate <explorationId> --json\`. Changed source or relevant drift requires renewed conflict/coverage checks; do not hand off an old reviewed version.
    - After both coverage checks and combined Change validation succeed, run \`xirang framing consume <explorationId> --change "<name>" --source-version <sourceVersion> --json\`. The CLI rechecks source version, context, and target validation, not natural-language coverage. It freezes exact bytes at \`.xirang/changes/<name>/framing-source.md\` before removing the active source. Any failure blocks Formation; preserve source and existing destination and follow the shared recovery protocol.
    - Check the returned target and source cleanup. The frozen \`framing-source.md\` records Formation history only; do not parse it as a later semantic source or use it in Sync or Change Closure.
    - With no record, do not treat the source as covered by default. Require the Design Summary or current input to declare the record decision: an explicit user-granted exemption, or an absence of normative content. If neither is declared, stop Formation and return to Explore for the missing decision instead of compiling and consuming. Do not create an empty record.
12. Finish with \`xirang status --change "<name>"\`. Summarize artifacts created or updated and validation errors and warnings. In the conversation, distinguish reused Explore confirmations (or confirmed current input), faithful elaborations added during Propose, with their basis and artifact locations, new decisions confirmed by the user during Propose, and unresolved items and their effect on readiness. State explicitly when no supplements or new decisions were needed. Artifact completion and CLI success do not establish semantic readiness: unresolved material decisions affecting target behavior, scope or implementation approach block ready-for-apply; disclosed inferred details do not block readiness solely because they lacked separate confirmation. Report readiness for \`/xirang:apply\` separately, without claiming unconfirmed content came from Explore. Do NOT generate a presentation artifact or run a separate Diff command.
    Separate observed CLI results, Agent semantic findings and remaining evidence gaps. Support readiness with concise findings from the actual semantic and dependency checks, identifying relevant artifact locations and any unresolved issue; do not infer coverage or coherence from artifact counts, valid references or declared dependencies. No full review transcript or new report artifact is required.

## Artifact Contract

${ARTIFACT_DOC_LANGUAGE_CONTRACT}

Keep tasks coarse and aligned to TDD closure: each \`### Task N:\` is one independently implementable and verifiable end-to-end loop with one \`Goal\`, \`Files\`, no more than 5 high-level \`Sections\`, and nested Checks. Preserve canonical headings, IDs, schema keys, paths, commands, and code identifiers.`,
    referenceFiles: [
    ],
    license: 'MIT',
    compatibility: 'Requires xirang CLI.',
    metadata: { author: 'xirang', version: '1.0' },
  };
}
