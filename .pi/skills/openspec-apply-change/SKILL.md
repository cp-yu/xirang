---
name: "openspec-apply-change"
description: "Implement tasks from an OpenSpec change. Use when the user wants to start implementing, continue implementation, or work through tasks."
license: "MIT"
compatibility: "Requires openspec CLI."
metadata:
  author: "openspec"
  version: "1.0"
  generatedBy: "1.4.1-cpyu.1"
---

Implement tasks from an OpenSpec change.

**OPSX Compilation Philosophy**:
OpenSpec treats human intent → running code as a compilation pipeline. Specs + OPSX are the durable semantic source: Specs define observable behavior; OPSX is the architecture symbol table and module graph. `proposal.md`, `design.md`, and `tasks.md` are compilation scaffolding and MUST NOT override Specs or OPSX. change-local specs and `opsx-delta.yaml` are semantic source deltas that express the target steady state; a change is the reconciliation unit. the agent is the compiler; `openspec validate` is static analysis; verify Phase 1 is the semantic-check pass; verify Phase 2 is the optimization pass; sync + archive is linking and release; snack is limited decompilation. Rules that follow:
1. Source MUST be elegant: every sentence is consumed downstream; redundant restatement is a code smell — state each fact exactly once.
2. Source completeness: key undefined decisions that change behavior or architecture return to the relevant Specs or OPSX. Make them explicit; Never guess silently.
3. Faithful translation: a compiler MUST NOT invent instructions or exceed the declared source.
4. Definition-first authoring: read the resolved `definition` (the resolved file definition), then dependencies/current state, then `instruction` and `template`; apply its content boundary and write policy. MUST NOT copy definitions, context, rules, projections, or reasoning into artifacts.
5. Syntax is contract: preserve canonical headings, IDs, schema keys, normative keywords, paths, and commands.
6. No dead-code output: no placeholders, empty sections, or repeated narration.
7. Not compiled until gates pass: validate/verify/seal are required pipeline stages.
A single compilation is faithful and deterministic; OpenSpec source iterates freely and recompiles fast.

## Flow Outline

1. Step 1: Preparation — read `openspec/references/openspec-apply-step-1-preparation.md`.
2. Step 2: Pre-flight scan — read `openspec/references/openspec-apply-step-2-preflight-scan.md`.
3. Step 3: Branch isolation — read `openspec/references/openspec-apply-step-3-branch-isolation.md`.
4. Execute tasks with the implementation discipline below.
5. Step 4: Phase 1 verification — read `openspec/references/openspec-apply-step-4-phase1-verification.md` and delegate to the clean-context `openspec-reviewer` agent.
6. Step 5: Phase 2 optimization — read `openspec/references/openspec-apply-step-5-phase2-optimization.md` and delegate to the clean-context `openspec-optimizer` agent when eligible.
7. Step 6: Phase 3 seal — read `openspec/references/openspec-apply-step-6-phase3-seal.md`.
8. Step 7: Output — read `openspec/references/openspec-apply-step-7-output.md`.

## Implementation Discipline

- Write or update targeted tests before behavior/code changes.
- Verify the expected failure before implementation, then rerun the same check after the minimal fix.
- Prefer deletion, standard library, native platform support, installed dependencies, and direct expressions before adding new code.
- Do not add abstractions, dependencies, or files unless the spec or failing test requires them.
- Exercise public behavior; mock only system boundaries injected through parameters.
- Preserve canonical artifact headings, schema keys, IDs, commands, and template tokens exactly.
- Treat failures as recovery feedback: read the full error, isolate the layer, compare a working pattern, state one hypothesis, change one variable, and rerun the same check.
- Pause after repeated identical failures or three failed fix attempts.

When Phase 3 seal passes, end with an explicit call-to-action: `Archive ready. Run /skill:openspec-archive-change <change-name> to complete the workflow.`
