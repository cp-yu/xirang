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

**OpenSpec Philosophy**

OpenSpec is a human-intent programming layer between human intent and general-purpose programming languages.

1. Specs and OPSX jointly form the durable semantic source. Specs define observable behavior; OPSX defines project intent, capabilities, ownership, boundaries, and semantic relations.
2. A change reconciles semantic source deltas toward a target steady state. `proposal.md`, `design.md`, and `tasks.md` are compilation scaffolding, not competing sources of truth.
3. Source is complete only when an Agent can compile it without guessing decisions that affect behavior or architecture.
4. The Agent acts as a compiler: translate declared intent faithfully. Existing code is compiled output and current implementation evidence; it MUST NOT silently override the declared semantic source.

For workflow-managed writes, read the resolved file definition before its instruction and template, and MUST NOT copy definitions, config projections, or reasoning into artifacts.

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
