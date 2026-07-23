---
name: "opsx-propose"
description: "Propose a new change with all artifacts generated in one step. Use when the user wants to quickly describe what they want to build and get a complete proposal with design, specs, and tasks ready for implementation."
license: "MIT"
compatibility: "Requires opsx CLI."
metadata:
  author: "opsx"
  version: "1.0"
  generatedBy: "1.4.1-cpyu.5"
---

Propose a new change or update an existing change, generating all artifacts needed for implementation.

**OPSX Philosophy**

OPSX is a human-intent programming layer between human intent and general-purpose programming languages.

1. Specs and LikeC4 jointly form the durable semantic source. Specs define observable behavior; LikeC4 defines project intent, capabilities, ownership, boundaries, and semantic relations.
2. A change reconciles semantic source deltas toward a target steady state. `proposal.md`, `design.md`, and `tasks.md` are compilation scaffolding, not competing sources of truth.
3. Source is complete only when an Agent can compile it without guessing decisions that affect behavior or architecture.
4. The Agent acts as a compiler: translate declared intent faithfully. Existing code is compiled output and current implementation evidence; it MUST NOT silently override the declared semantic source.

## Workflow Stage

| Aspect | Value |
|--------|-------|
| **Stage** | `PROPOSE` - Artifact generation (no implementation) |
| **Allowed** | Generate proposal, design, specs, tasks, architecture-delta.c4 in .opsx/changes/<name>/ |
| **Forbidden** | Implement code, modify project files outside the selected change directory |

## Flow

1. Resolve a provisional kebab-case change ID. Ask one focused question when the requested change itself is unclear. Report status only at readiness, blocker, and final-summary points; do not emit per-artifact progress updates.
2. Gather read-only evidence before any write.
   - Run `opsx list --json` and inspect relevant existing change artifacts when present.
   - Load the formal LikeC4 model under `.opsx/architecture/` through CLI navigation; do not read legacy OPSX YAML.
   - Run `opsx list --specs --json`. A Spec ID identifies `.opsx/specs/<spec-id>/spec.md`; each item in its `capabilities` string array is an associated canonical capability ID. Specs without frontmatter return `capabilities: []`.
   - For known or affected capability IDs, run `opsx arch query <element-id> --relations --depth 2`. LikeC4 element IDs use `domain_name.capability_name`; metadata retains canonical capability IDs.
   - Use implementation evidence only where needed to resolve current behavior or lowering constraints.
3. Assess semantic readiness.
   - Reuse a confirmed `Design Summary` when the conversation contains one, and state that it is being reused. Route architecture decisions to proposal Architecture Source, `design.md`, and `architecture-delta.c4`; route testing strategy to `design.md` and concrete test work to `tasks.md`; route risk and trade-off decisions to `design.md`.
   - Otherwise require a clear problem, impact scope, approach, verification method, and no unresolved Behavior Source or Architecture Source decisions. Multi-subsystem scope is evidence, not an automatic Explore requirement; report a gap only when it cannot form one coherent change scope.
   - If readiness is incomplete, list the concrete missing items, recommend `/skill:opsx-explore`, and stop: do not create a change directory or modify project files.
   - If the user explicitly overrides the readiness recommendation, continue, but the override does not authorize guessing source decisions. Ask one focused question at a time for every unresolved behavior or architecture decision.
   - For an existing change, assess readiness from existing artifacts, current input, the confirmed Design Summary, formal source, and implementation evidence together.
   - Keep readiness, missing-item, and override state in the conversation only; do not copy it into change artifacts.
4. Resolve change identity after readiness passes or is explicitly overridden.
   - If the user explicitly requests a new change and the ID is unused, run `opsx new change "<name>"`.
   - If the user explicitly requests a new change and the ID already exists, stop and ask for a different ID. Do not overwrite, continue, or synthesize an alternative ID.
   - If the user explicitly requests an existing change, update that change in place without asking for another ID.
   - If intent is ambiguous and the ID exists, ask whether to update the existing change or create an independent new change; in non-interactive mode, fail and request an explicit choice.
   - Run `opsx status --change "<name>" --json` for `applyRequires`, artifact order, dependencies, and schema.
5. Determine source impact before writing `proposal.md`.
   - Compare requested observable behavior with formal Specs. Reuse an existing Spec that owns the behavior; propose a New Spec only for genuinely new observable behavior. A capability without Spec coverage does not by itself require a New Spec.
   - Compare durable architecture impact with the formal LikeC4 model. Identify affected element IDs, responsibility, ownership, boundaries, and semantic relations. Implementation movement or call/import evidence alone is not an architecture-source change.
   - Determine Behavior Source and Architecture Source independently. Behavior Source uses `New Specs` or `Modified Specs` with Spec IDs; Architecture Source uses LikeC4 element IDs. Use `None` only when that source truly does not change.
6. Generate ready artifacts in dependency order. For each artifact, run `opsx instructions <artifact-id> --change "<name>" --json`.
   - For each response, follow the authoring order in the returned `instruction`. Keep `definition`, dependencies, `currentState`, `configProjection`, and `template` as separate inputs; do not copy non-artifact inputs into artifacts.
   - For `proposal.md`, write `## Source Impact` with independent Behavior Source and Architecture Source sections. Keep Spec IDs distinct from LikeC4 element IDs.
   - When creating `specs`, create or modify only the Spec IDs declared under proposal `Behavior Source`. Read the exact Requirement titles from the formal Spec before authoring ADDED, MODIFIED, REMOVED, or RENAMED deltas. Rely on combined change validation for deterministic header compatibility. Follow the returned Specs authoring contract. Agent MUST NOT author scenario operation labels.
   - Route obsolete-test rationale from **Test Maintenance** to `design.md` and concrete test updates/removals to `tasks.md`. Route **One-time Verification** items to evidence-only `tasks.md` Checks with no persistent test file; absence assertions use `Verifies: <path> REMOVED Requirement`.
7. Continue until all `applyRequires` artifacts are done. Ask one focused question when an artifact decision remains unresolved.
8. After Specs and Design are complete, reconcile architecture scope before generating `architecture-delta.c4`.
   - Re-read proposal Architecture Source, `design.md`, the formal LikeC4 model, and current implementation evidence.
   - If Design confirms a different durable architecture impact, update only proposal `Architecture Source` to declare final scope.
   - Read `.opsx/references/likec4-authoring.md`. Extend an existing domain with `extend existing_domain { ... }`; use change-local specs metadata such as `specs ['.opsx/changes/<name>/specs/...']`.
   - Encode semantic relationship kinds with LikeC4 kind syntax, for example `source -[invokes]-> target`; never encode a kind as a relationship title.
   - If Architecture Source is `None`, omit `architecture-delta.c4`; do not invent architecture operations from behavior changes alone.
   - Validate a generated delta with `opsx arch validate --delta .opsx/changes/<name>/architecture-delta.c4` and fix all errors before continuing.
9. Check compilation scaffolding before semantic-source validation.
   - Run `opsx instructions proposal --change "<name>" --json` and `opsx instructions design --change "<name>" --json`; compare each file with its current resolved definition and template.
   - Run `opsx instructions tasks --change "<name>" --json` and use deterministic `validateTaskStructure`. Support Actions and coarse `### Task N:`, Goal, Files, Requirements, Checks, Covers:, Verifies:, change-local `Verifies:` spec paths, Requirement/Scenario references, Command:, Evidence:, and Expect:. Do NOT invent semantic lint rules beyond the current templates. Do NOT judge whether a check is semantically sufficient.
10. Run combined change validation exactly once with `opsx validate --change "<name>" --json`. Do NOT run `opsx sync`.
    - ERROR from either scaffolding checks or combined change validation blocks ready-for-apply. Perform at most one repair pass, re-check once, and stop with the remaining blockers if any ERROR remains.
    - WARNING does not block ready-for-apply; retain it for the final summary.
11. After validation passes, run `opsx scenario-labels "<name>" --preview --json`.
    - Compare every suggested ADDED, MODIFIED, or REMOVED operation with proposal Behavior Source and the intended delta.
    - Unexpected ADDED, MODIFIED, or REMOVED operations block label writing. Correct the Spec, rerun combined change validation, and preview again.
    - When the preview matches intent, run `opsx scenario-labels "<name>" --write`. This deterministic write does not require a second validate pass. Labels remain change-local review metadata; sync/archive consume and clean existing labels but do not generate them.
12. Finish with `opsx status --change "<name>"`. Summarize artifacts created or updated, validation errors and warnings, scenario-label results, and readiness for `/skill:opsx-apply-change`.

## Artifact Contract

**Document Language Contract**:
- Treat `.opsx/config.yaml` as the compact source of truth, but consume its compiled prompt projection rather than reinterpreting raw keys ad hoc
- If the compiled projection includes `proseLanguage`, apply it to natural-language prose you write or revise in the artifact body
- Natural-language prose includes task titles, check names, Requirement titles, Scenario titles, bullet descriptions, Expect/Evidence descriptions, rationale, goals, risks, and summaries
- Follow the existing template structure exactly; do not invent a different layout because the prose language changes
- Keep template headings, normative keywords, BDD keywords, IDs, schema keys, relation types, file paths, commands, and code identifiers in their canonical form
- Preserve exact existing Requirement titles required for MODIFIED matching
- English project terminology may remain embedded in prose, but ordinary English sentences and titles still follow `proseLanguage`
- If no `proseLanguage` projection is present, keep the default writing behavior for prose

Keep tasks coarse: `### Task N:`, `Goal`, `Files`, `Requirements`, and nested Checks; at most 5 Requirements per task. Preserve canonical headings, IDs, schema keys, paths, commands, BDD keywords, and code identifiers.
