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

1. Input must identify a kebab-case change name or enough description to derive one. If unclear, ask what to build or fix.
2. Apply smart routing before creating files: inspect the current conversation for an explore-generated `Design Summary`; if no summary exists, respect `propose.smartRouting: false` and `propose.requireExplore: false`, otherwise score the user's input across 5 dimensions. Detect multi-subsystem scope. Outcomes include: "Design Summary found: proceed and show that Design Summary is being used", "Input is sufficiently detailed. Skipping explore; generating artifacts directly.", and "This request spans multiple independent subsystems. Consider running `/skill:openspec-explore` to decompose it first.". Show input length, detail score, multi-subsystem result, and final decision. For a **One-time Verification** subsection, route items to `tasks.md` Checks (no persistent test file; absence assertions use `Verifies: <path> REMOVED Requirement`).
3. Run `openspec new change "<name>"`, then `openspec status --change "<name>" --json` to read `applyRequires`, artifact order, dependencies, and schema.
4. Load shared OPSX context before artifact generation.
Before reading other context files, check whether the formal OPSX two-file bundle exists:
- `openspec/project.opsx.yaml` for project intent, domains, and capabilities
- `openspec/project.opsx.relations.yaml` for the complete canonical semantic relation set
- If the bundle exists, read both files as one architecture source; do not treat either file as complete alone
- Read the `project:` block for project intent and scope
- Treat the bundle as navigation context, not as a replacement for change artifacts
5. Before specs, run `openspec list --specs --json`; compare proposed capabilities to each spec's `capabilities` string array. Specs without frontmatter return `capabilities: []`. Reuse or modify existing coverage instead of duplicating specs.
6. Use CLI-backed OPSX navigation after shared context.
After reading the formal OPSX two-file bundle, use OpenSpec CLI query surfaces for node details.
- Run `openspec list --specs --json` to get specs and their `capabilities` string arrays; specs without frontmatter return `capabilities: []`.
- For known or affected OPSX node IDs, run `openspec opsx query <node-id...> --json` to get node details and directed semantic relations in one batch; add `--depth 2` when broader related context is needed.
- Use optional CodeGraph or ACE/`rg`/`read` for current code locations; OPSX does not store code paths.
- Treat CLI output as navigation context, not as a replacement for change artifacts.
7. For each ready artifact, run `openspec instructions <artifact-id> --change "<name>" --json`; read the resolved `definition` first and apply its content boundary and write policy, then read dependencies/current state, `instruction` and `template`. Read `configProjection` (especially `configProjection.normalized.proseLanguage` and `configProjection.prompt.fragments`) separately. MUST NOT copy definition, context, rules, config projection, or Agent reasoning into artifact files. Before writing change-local specs, run `openspec check-delta --change "<name>" --caps <spec-id> --added <header> --modified <header> --removed <header> --renamed-from <header>` with target spec ids and planned requirement headers. Missing and Conflict results are blocking before writing specs; post-write validation remains warning-only. When creating `specs`, apply the returned `Spec content boundary`: route non-behavior content to design/tasks/proposal/opsx-delta instead of requirements. Do not author scenario operation labels while creating specs; they remain change-local review metadata and are generated only by the explicit post-validation CLI step below.
8. Continue until all `applyRequires` artifacts are `done`. If an artifact is unclear, ask one focused question and continue.
9. After spec-driven specs are complete, generate `opsx-delta.yaml` from `openspec instructions opsx-delta --change "<name>" --json`; use `schema_version: 2`, `ADDED:`, `MODIFIED:`, and `REMOVED:` YAML keys and query existing nodes when needed.
10. Run warning-only post-propose validation: This validation is warning-only. Do NOT turn `/skill:openspec-propose` into a blocking gate. Use staged checks: `openspec validate --change "<name>" --artifacts specs --json` for generated specs and `openspec validate --change "<name>" --artifacts opsx-delta --json` for `opsx-delta.yaml`; then use `openspec validate --change "<name>" --json` for full change validation. Align with `Validator.validateChangeDeltaSpecs()`, SHALL/MUST requirement text, required `#### Scenario:` blocks, `Validator.validateOpsxDelta()`, `applyOpsxDelta()`, referential integrity, and relation semantic validation. Do NOT run `openspec sync`; report when validation skips this check. For structure checks, read `openspec instructions proposal --change "<name>" --json`, `openspec instructions design --change "<name>" --json`, and `openspec instructions tasks --change "<name>" --json`; use `validateTaskStructure`, support Actions and coarse `### Task N:` with Goal, Files, Requirements, Checks, Covers:, Verifies:, change-local `Verifies:` spec paths, Requirement/Scenario references, Command:, Evidence:, and Expect:. Do NOT invent semantic lint rules beyond the current templates. Do NOT judge whether a check is semantically sufficient. If warnings appear, do exactly one repair pass, re-check once, and summarize remaining warnings.
11. After validation and the optional single repair pass, run `openspec scenario-labels "<name>" --write`. Treat this as trusted programmatic metadata generation; it does not require a second validate pass.
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

Keep generated tasks coarse: `### Task N:`, `Goal`, `Files`, `Requirements`, and nested Checks. Keep each task to at most 5 Requirements. Preserve template structure, canonical headings, IDs, schema keys, paths, commands, BDD keywords, and code identifiers.
