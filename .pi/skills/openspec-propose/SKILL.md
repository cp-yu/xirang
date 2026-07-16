---
name: "openspec-propose"
description: "Propose a new change with all artifacts generated in one step. Use when the user wants to quickly describe what they want to build and get a complete proposal with design, specs, and tasks ready for implementation."
license: "MIT"
compatibility: "Requires openspec CLI."
metadata:
  author: "openspec"
  version: "1.0"
  generatedBy: "1.4.1-cpyu.1"
---

Propose a new change and generate all artifacts needed for implementation.

**OpenSpec Philosophy**

OpenSpec is a human-intent programming layer between human intent and general-purpose programming languages.

1. Specs and OPSX jointly form the durable semantic source. Specs define observable behavior; OPSX defines project intent, capabilities, ownership, boundaries, and semantic relations.
2. A change reconciles semantic source deltas toward a target steady state. `proposal.md`, `design.md`, and `tasks.md` are compilation scaffolding, not competing sources of truth.
3. Source is complete only when an Agent can compile it without guessing decisions that affect behavior or architecture.
4. The Agent acts as a compiler: translate declared intent faithfully. Existing code is compiled output and current implementation evidence; it MUST NOT silently override the declared semantic source.

## Workflow Stage

| Aspect | Value |
|--------|-------|
| **Stage** | `PROPOSE` - Artifact generation (no implementation) |
| **Allowed** | Generate proposal, design, specs, tasks, opsx-delta in openspec/changes/<name>/ |
| **Forbidden** | Implement code, modify existing project files |

## Flow

1. Resolve a kebab-case change name. Ask one focused question when the requested change itself is unclear.
2. Apply smart routing: inspect the current conversation for an explore-generated `Design Summary`. If absent, respect `propose.smartRouting: false` and `propose.requireExplore: false`; otherwise score the user's input across 5 dimensions. Detect multi-subsystem scope. Report one of: "Design Summary found: proceed and show that Design Summary is being used", "Input is sufficiently detailed. Skipping explore; generating artifacts directly.", or "This request spans multiple independent subsystems. Consider running `/skill:openspec-explore` to decompose it first." Show input length, detail score, multi-subsystem result, and final decision. Route obsolete-test rationale from **Test Maintenance** to `design.md` and concrete test updates/removals to `tasks.md`. Route **One-time Verification** items to evidence-only `tasks.md` Checks with no persistent test file; absence assertions use `Verifies: <path> REMOVED Requirement`.
3. Run `openspec list --json` before creation. If the target change exists, ask whether to continue it or use a new name; in non-interactive mode, fail and request an explicit choice. Otherwise run `openspec new change "<name>"`. Then run `openspec status --change "<name>" --json` for `applyRequires`, artifact order, dependencies, and schema.
4. Load shared OPSX context.
Before reading other context files, check whether the formal OPSX two-file bundle exists:
- `openspec/project.opsx.yaml` for project intent, domains, and capabilities
- `openspec/project.opsx.relations.yaml` for the complete canonical semantic relation set
- If the bundle exists, read both files as one architecture source; do not treat either file as complete alone
- Read the `project:` block for project intent and scope
- Treat the bundle as navigation context, not as a replacement for change artifacts
5. Determine the initial source impact before creating `proposal.md`.
   - Run `openspec list --specs --json`. A Spec ID identifies `openspec/specs/<spec-id>/spec.md`; each entry in its `capabilities` string array is an associated canonical OPSX capability ID. Specs without frontmatter return `capabilities: []`.
   - Compare requested observable behavior with formal Specs. Reuse an existing Spec that owns the behavior; propose a New Spec only for genuinely new observable behavior. An OPSX capability missing Spec coverage does not by itself require a New Spec.
   - Compare durable architecture impact with the formal OPSX bundle. Identify affected OPSX node IDs, responsibility, ownership, boundaries, and semantic relations. Implementation movement or call/import evidence alone is not an architecture-source change.
   - Determine Behavior Source and Architecture Source independently. Behavior Source uses `New Specs` or `Modified Specs` with Spec IDs; Architecture Source uses OPSX node IDs. Use `None` only when that source truly does not change; ask one focused question for unresolved scope.
6. Use CLI-backed OPSX navigation.
After reading the formal OPSX two-file bundle, use OpenSpec CLI query surfaces for node details.
- Run `openspec list --specs --json` to get specs and their `capabilities` string arrays; specs without frontmatter return `capabilities: []`.
- For known or affected OPSX node IDs, run `openspec opsx query <node-id...> --json` to get node details and directed semantic relations in one batch; add `--depth 2` when broader related context is needed.
- Use optional CodeGraph or ACE/`rg`/`read` for current code locations; OPSX does not store code paths.
- Treat CLI output as navigation context, not as a replacement for change artifacts.
7. Generate ready artifacts in dependency order. For each artifact, run `openspec instructions <artifact-id> --change "<name>" --json`.
   - Read the resolved `definition` first. Before writing, use `content.includes` and `content.excludes` to decide what belongs, obey `writePolicy`, then follow `instruction` and fill the canonical structure from `template`. Read dependencies/current state and `configProjection` separately. Do not copy definition, context, rules, config projection, or Agent reasoning into artifacts.
   - For `proposal.md`, write `## Source Impact` with independent Behavior Source and Architecture Source sections. Keep Spec IDs distinct from OPSX node IDs.
   - Before writing change-local specs, run `openspec check-delta --change "<name>" --caps <spec-id> --added <header> --modified <header> --removed <header> --renamed-from <header>`. Missing and Conflict results are blocking before writing specs. Missing and Conflict results block spec authoring. When creating `specs`, create or modify only the Spec IDs declared under proposal `Behavior Source`. Use the resolved Specs definition to route non-behavior content to design/tasks/proposal/opsx-delta. Agent MUST NOT author scenario labels.
8. Continue until all `applyRequires` artifacts are done. Ask one focused question when an artifact decision remains unresolved.
9. After Specs and Design are complete, reconcile architecture scope before generating `opsx-delta.yaml`.
   - Re-read proposal Architecture Source, `design.md`, the formal OPSX bundle, and current implementation evidence.
   - If Design confirms a different durable architecture impact, update only proposal `Architecture Source` to declare final scope.
   - Run `openspec instructions opsx-delta --change "<name>" --json`. Real deltas use non-empty `ADDED:`, `MODIFIED:`, and `REMOVED:` YAML sections only when needed. Proposal declares scope; only `opsx-delta.yaml` defines exact target-state node operations and canonical relations.
   - If Architecture Source is `None`, write the canonical no-op `schema_version: 2` and do not invent OPSX operations from behavior changes alone.
10. Run warning-only post-propose validation. This validation is warning-only. Do NOT turn `/skill:openspec-propose` into a blocking gate.
   - Run `openspec validate --change "<name>" --artifacts specs --json`, `openspec validate --change "<name>" --artifacts opsx-delta --json`, then `openspec validate --change "<name>" --json`.
   - Align with `Validator.validateChangeDeltaSpecs()`, SHALL/MUST requirement text, required `#### Scenario:` blocks, `Validator.validateOpsxDelta()`, `applyOpsxDelta()`, referential integrity, and relation semantic validation. Do NOT run `openspec sync`; report when validation skips this check.
   - For lightweight structure checks, run `openspec instructions proposal --change "<name>" --json`, `openspec instructions design --change "<name>" --json`, and `openspec instructions tasks --change "<name>" --json`; use `validateTaskStructure`. Support Actions and coarse `### Task N:`, Goal, Files, Requirements, Checks, Covers:, Verifies:, change-local `Verifies:` spec paths, Requirement/Scenario references, Command:, Evidence:, and Expect:. Do NOT invent semantic lint rules beyond the current templates. Do NOT judge whether a check is semantically sufficient.
   - If warnings appear, do exactly one repair pass, re-check once, and report remaining warnings.
11. After validation, run `openspec scenario-labels "<name>" --write`. This trusted programmatic metadata generation does not require a second validate pass. Labels remain change-local review metadata; sync/archive consume and clean existing labels but do not generate them.
12. Finish with `openspec status --change "<name>"` and report artifacts created plus readiness for `/skill:openspec-apply-change`.

## Artifact Contract

**Document Language Contract**:
- Treat `openspec/config.yaml` as the compact source of truth, but consume its compiled prompt projection rather than reinterpreting raw keys ad hoc
- If the compiled projection includes `proseLanguage`, apply it to natural-language prose you write or revise in the artifact body
- Natural-language prose includes task titles, check names, Requirement titles, Scenario titles, bullet descriptions, Expect/Evidence descriptions, rationale, goals, risks, and summaries
- Follow the existing template structure exactly; do not invent a different layout because the prose language changes
- Keep template headings, normative keywords, BDD keywords, IDs, schema keys, relation types, file paths, commands, and code identifiers in their canonical form
- Preserve exact existing Requirement titles required for MODIFIED matching
- English project terminology may remain embedded in prose, but ordinary English sentences and titles still follow `proseLanguage`
- If no `proseLanguage` projection is present, keep the default writing behavior for prose

Keep tasks coarse: `### Task N:`, `Goal`, `Files`, `Requirements`, and nested Checks; at most 5 Requirements per task. Preserve canonical headings, IDs, schema keys, paths, commands, BDD keywords, and code identifiers.
