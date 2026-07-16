---
name: "openspec-snack"
description: "Quick code-first artifact reconciliation: from already-written code, conditionally create or update proposal + specs + simplified design + OPSX delta using available code-change evidence. Use after iterative coding to back-fill OpenSpec artifacts without redoing propose→apply. Does not generate tasks.md."
license: "MIT"
compatibility: "Requires openspec CLI."
metadata:
  author: "openspec"
  version: "1.0"
  generatedBy: "1.4.1-cpyu.1"
---

Reconcile OpenSpec artifacts from already-written code (code-first artifact reconciliation, reverse of propose/apply).

**OpenSpec Philosophy**

OpenSpec is a human-intent programming layer between human intent and general-purpose programming languages.

1. Specs and OPSX jointly form the durable semantic source. Specs define observable behavior; OPSX defines project intent, capabilities, ownership, boundaries, and semantic relations.
2. A change reconciles semantic source deltas toward a target steady state. `proposal.md`, `design.md`, and `tasks.md` are compilation scaffolding, not competing sources of truth.
3. Source is complete only when an Agent can compile it without guessing decisions that affect behavior or architecture.
4. The Agent acts as a compiler: translate declared intent faithfully. Existing code is compiled output and current implementation evidence; it MUST NOT silently override the declared semantic source.

Treat `proposal.md`, `design.md`, `specs/*/spec.md`, and `opsx-delta.yaml` as conditional artifacts: create them when missing, update them when stale or inconsistent, and leave them unchanged when current.

## Input

- Optional `<change-name>` (kebab-case).
- If omitted, run `openspec list --json` and reuse the single active change; if multiple or none, ask which change name to target.

## Flow

1. Resolve change name and reconcile mode.
   - If `openspec/changes/<name>/` does not exist, run `openspec new change "<name>"` and create only artifacts required by evidence.
   - Otherwise read current proposal, design, Specs, and OPSX delta; classify each as **missing**, **stale**, **inconsistent**, or **current** and preserve unrelated human-authored content.
2. Load shared OPSX context.
Before reading other context files, check whether the formal OPSX two-file bundle exists:
- `openspec/project.opsx.yaml` for project intent, domains, and capabilities
- `openspec/project.opsx.relations.yaml` for the complete canonical semantic relation set
- If the bundle exists, read both files as one architecture source; do not treat either file as complete alone
- Read the `project:` block for project intent and scope
- Treat the bundle as navigation context, not as a replacement for change artifacts
3. Collect code-change evidence from conversation context plus `git diff --cached`, `git diff HEAD`, other available working-tree/staged diffs, and user-selected commit/range diffs. `git diff` is one evidence source among several and MUST NOT be treated as the only valid source. Treat natural-language commit/range selectors as agent-parsed evidence selectors, not OpenSpec CLI flags. Mark conflicts or uncertainty `[REVIEW NEEDED]`.
4. Map changed symbols/files to current architecture context.
   - Use formal OPSX capability IDs, intents, ownership, boundaries, and relations.
   - CodeGraph MAY accelerate symbol/call/import discovery; otherwise use ACE, `rg`, and `read`. Never read `.codegraph/codegraph.db`.
   - Treat code locations and call/import edges as implementation evidence, not as proof that OPSX must change. Do not create capabilities from uncertain file-name inference.
5. Determine Behavior Source impact.
   - Run `openspec list --specs --json` and keep each Spec ID separate from its `capabilities` string array.
   - Add an existing Spec ID to **Modified Specs** only when its observable requirements change. Add a **New Spec** only for genuinely new observable behavior not governed by an existing Spec.
   - An OPSX capability absent from every Spec's `capabilities` array does not by itself require a New Spec; mark missing coverage `[REVIEW NEEDED]`.
   - Behavior-preserving refactors create no delta Spec; later Checks use `Preserves:` against formal Specs.
6. Determine Architecture Source impact.
   - Declare impact only when durable capability responsibility, domain boundary, ownership, or semantic relation changes.
   - Implementation-only movement, symbol renaming, helper extraction, and mechanical call/import changes do not by themselves change OPSX.
   - If no durable architecture fact changes, set Architecture Source to `None`. If impact remains unresolved, stop and ask one focused question; do not write `opsx-delta.yaml` or claim reconciliation complete.
7. Use CLI-backed OPSX navigation.
After reading the formal OPSX two-file bundle, use OpenSpec CLI query surfaces for node details.
- Run `openspec list --specs --json` to get specs and their `capabilities` string arrays; specs without frontmatter return `capabilities: []`.
- For known or affected OPSX node IDs, run `openspec opsx query <node-id...> --json` to get node details and directed semantic relations in one batch; add `--depth 2` when broader related context is needed.
- Use optional CodeGraph or ACE/`rg`/`read` for current code locations; OPSX does not store code paths.
- Treat CLI output as navigation context, not as a replacement for change artifacts.
8. Reconcile `proposal.md`.
   - Run `openspec instructions proposal --change "<name>" --json`. Read the resolved `definition` first. Before writing, use `content.includes` and `content.excludes` to decide what belongs in the artifact, obey `writePolicy`, then follow `instruction` and fill the canonical structure from `template`. Use `outputPath` and `configProjection`; MUST NOT copy definition, projection, context, rules, or reasoning into the artifact.
   - Reconcile `## Source Impact` from independently determined Behavior Source and Architecture Source impact. Keep Spec IDs distinct from OPSX node IDs.
   - Reuse the confirmed Behavior Source list as the delta Spec input; preserve `## Why`, `## What Changes`, `## Source Impact`, and `## Impact`.
   - If the proposal already matches evidence and source impact, leave it unchanged.
9. Reconcile delta Specs in `specs/<spec-id>/spec.md`.
   - Run `openspec instructions specs --change "<name>" --json`. Read the resolved `definition` first. Before writing, use `content.includes` and `content.excludes` to decide what belongs in the artifact, obey `writePolicy`, then follow `instruction` and fill the canonical structure from `template`. Use `outputPath` and `configProjection`; MUST NOT copy definition, projection, context, rules, or reasoning into the artifact.
   - Create or update only Specs declared under Behavior Source. Do not derive the directory name directly from an OPSX capability ID.
   - Follow returned `## ADDED Requirements`, `## MODIFIED Requirements`, REMOVED/RENAMED rules, exact title matching, canonical Requirement/Scenario syntax, and label guidance. Preserve unrelated current delta content.
10. Reconcile simplified `design.md`.
   - Run `openspec instructions design --change "<name>" --json`. Read the resolved `definition` first. Before writing, use `content.includes` and `content.excludes` to decide what belongs in the artifact, obey `writePolicy`, then follow `instruction` and fill the canonical structure from `template`. Use `outputPath` and `configProjection`; MUST NOT copy definition, projection, context, rules, or reasoning into the artifact.
   - Preserve Context, Goals / Non-Goals, Decisions, and Risks / Trade-offs. Mark inferred content `[INFERRED FROM CODE]` and unresolved decisions `[REVIEW NEEDED]`.
11. Reconcile `opsx-delta.yaml` only after Architecture Source is resolved. Create a canonical no-op containing only `schema_version: 2` when architecture is confirmed unchanged; a real delta otherwise.
   **Generate opsx-delta.yaml**:
- Read `openspec instructions opsx-delta --change "<name>" --json`
- Read the resolved `definition` first. Before writing:
  - use `content.includes` and `content.excludes` to decide what belongs in `opsx-delta.yaml`
  - obey `writePolicy`
  - then follow `instruction` and fill the canonical structure from `template`
  - MUST NOT copy the definition or Agent reasoning into the artifact
- Read `proposal.md` → `Source Impact`:
  - use `Architecture Source` as the declared architecture scope
  - use `Behavior Source` to locate related change-local Specs; Spec IDs are not OPSX capability IDs
- Read the completed change-local Specs as target behavior context. Observable behavior does not by itself prove an OPSX node or relation change
- Read `design.md` when present for concrete architecture and lowering decisions
- Read the formal OPSX two-file bundle as the current architecture state
- Use current code only as implementation evidence; it MUST NOT override declared target source
- Treat proposal architecture entries as scope declarations, not authoritative OPSX records. Derive exact target-state nodes and canonical relations into `opsx-delta.yaml`
- If Architecture Source is `None`, write only `schema_version: 2`; do not emit empty operation sections; do not invent architecture changes from behavior changes alone
- Otherwise omit unused `ADDED`, `MODIFIED`, or `REMOVED` sections and follow the Registry relation contract below
- `belongs_to` (capability → domain): 记录 capability 的架构所有权。
- `invokes` (caller → callee): 一个 capability 在运行时主动调用另一个 capability。
- `consumes` (consumer → provider): 交互核心是读取或依赖提供内容。
- `precedes` (earlier → later): 执行顺序是正确性合同。
- `constrains` (constraint owner → constrained capability): 存在独立且稳定的行为约束。
- `validates` (validator → subject): 交互结果是明确的有效性判定。
- Imports/calls are evidence only. If no precise relation applies, omit it and keep the unresolved decision for review
   - Distinguish delta Spec Markdown headings from OPSX delta YAML keys (`ADDED`, `MODIFIED`, `REMOVED`).
12. Do NOT generate `tasks.md` (code is already implemented).
13. Run `openspec validate "<name>" --type change --json`. On ERROR/WARNING, repair once from artifact instructions, validate once more, and report the final result.
14. Run `openspec scenario-labels "<name>" --write` after validate to add deterministic change-local scenario operation labels. SHALL NOT run validate again only because scenario labels were added.
15. Finish with the output hints.

## Output Hints

⚠️ Generated specs are based on code inference. Review items marked [REVIEW NEEDED]

1. **Quick sync**: `openspec sync "<change-name>" --no-verify`
2. **Quick archive**: `openspec archive "<change-name>" --no-verify`
3. **Sync and archive**: `openspec sync "<change-name>" --no-verify && openspec archive "<change-name>" --no-verify`
4. **Continue development**: review change → modify code → run `/skill:openspec-snack` again → continue iterating

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

Preserve canonical headings, IDs, schema keys, BDD keywords, paths, commands, and code identifiers.
