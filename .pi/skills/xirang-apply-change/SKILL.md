---
name: "xirang-apply-change"
description: "Implement tasks from an Xirang change. Use when the user wants to start implementing, continue implementation, or work through tasks."
license: "MIT"
compatibility: "Requires xirang CLI."
metadata:
  author: "xirang"
  version: "1.0"
  generatedBy: "0.2.9"
---

Implement tasks from an Xirang change.

Before doing stage work, load the xirang-common skill from this tool's discovered skills or from ../xirang-common/SKILL.md relative to this skill file, unless its required guidance is already available and current in this Agent's project context. Keep the selected stage while loading it; do not route back or load this stage again. Follow common's on-demand guidance and reuse rules.

When designing verification, changing tests or reviewing test evidence, read project-root file `.xirang/references/xirang-test-quality.md` unless already available and current.

For workflow-managed artifact writes, load the matching `.xirang/references/xirang-artifact-<id>.md` only when needed, reading Definition before Guidance and Template. Do not copy guidance, configuration or reasoning into artifacts.

## Flow Outline

1. Step 1: Preparation — read `.xirang/references/xirang-apply-step-1-preparation.md`. Follow `.xirang/references/xirang-quality-recovery.md` for interrupted optimization, an explicit request to start verification again, or a reported recovery gap.
2. Step 2: Isolation router — skip this step when Preparation validated existing isolation; otherwise read the one method reference selected by Step 1. Do not load mutually exclusive methods.
3. Implementation loop — process all pending goals and Required Corrections until they are complete; completing one goal does not leave the loop.
4. [Mode: Delegate Review] Step 3: Review — after all ordinary goals and Required Corrections, read `.xirang/references/xirang-apply-step-3-review.md` and follow its independent Review, correction and post-Opt routing gates.
5. Step 4: Optimization — read `.xirang/references/xirang-apply-step-4-optimization.md`. For optimization failures, use the optional guidance in .xirang/references/xirang-optimization-failure-diagnosis.md.
6. Step 5: Seal — read `.xirang/references/xirang-apply-step-5-seal.md`.
7. Step 6: Output — read `.xirang/references/xirang-apply-step-6-output.md`.

## Quality Coordinator

Main owns Review dimension assignments and consolidation, optimization scope, boundary decisions, follow-up investment and final verification. Read actual code and evidence to make those judgments.
- Main: run required tests before Review delegation; delegate non-conflicting dimensions, wait for complete results, consolidate them into one v4 opinion, decide whether to run Opt and select required incremental/supplemental Reviews, then record the final Seal declaration.
- `xirang-optimizer`: independently discover/group/implement/test within the delegation and report actual results, preservation, evidence, failures and recommendations.
- `xirang-reviewer`: independently assess assigned quality dimensions from committed checkout HEAD in a fresh context; its instructions remain read-only while tool permissions match the main Agent.
- CLI: persist Review opinions by reviewKind, Opt dispositions/opinions, versions and Seal; validate record structures, revisions, and referenced commits. It does not rank opportunities, choose work or judge prose adequacy.

Use Step 3 for delegation, consolidation and required independent Review gates; Step 4 owns Opt and risk-based follow-up; Step 5 owns Seal. Wait for complete child responses; a slow subagent is not failed, and terminating one requires asking the user. For interrupted optimization follow Quality Recovery after the old writer stops.

## Implementation Discipline

- Before implementation, run `xirang arch impact <identity> --depth 2 --json` to discover affected identities and relationships, then run `xirang arch query <selected-identities...> --contract --json` for the explicit Elements whose Contracts and Declarations are needed; read the returned Element Contracts and current code.
- Process unfinished `## Required Corrections` `[code_fix]` and `[artifact_fix]` items before pending goals. Each goal is one implementation and verification loop based on its Contract and repository evidence. A goal is complete only after implementation and credible evidence for its verification direction. Completing one ordinary goal MUST NOT trigger a change-level Review, an optimization round, or a workflow handoff. Only after all ordinary goals and Required Corrections are complete may Apply enter change-level Review. Ordinary implementation and baseline-Review corrections require change-level Review after that loop. Optimization edits/recovery follow Step 4's risk-based verification and mandatory baseline-defect repair Review. The ordinary task failure counters and interface-first advice below do not govern Optimizer execution.
- Assess interface testability before changing behavior: inject external dependencies, prefer returned results over hidden side effects, and keep the public interface minimal. If behavior is hard to test, improve the interface first.
- For each pending goal, inspect existing tests and current behavior; establish credible evidence of unmet behavior when applicable, then implement minimally and verify the same observable behavior. Exercise public behavior; mock only injected system boundaries, never internal collaborators. Split tests only when failure reasons are independent.
- For behavior changes, establish credible evidence of unmet behavior before implementation when applicable, make the minimal implementation, then verify the same observable behavior afterward. Do not manufacture RED with syntax errors, wrong paths, broken fixtures, or unrelated failures.

- Non-runtime artifact changes require final-state evidence, not artificial failing tests.
- Config, schema, generated template, workflow template, and agent instruction template changes default to behavior verification unless evidence shows there is no runtime or generated-surface consumer.
- Prefer deletion, standard library, native platform support, installed dependencies, direct expressions, then minimal new code. Add no abstraction, dependency, or file unless required.
- Update goal and Required Corrections checkboxes only after applicable evidence passes. Do not write implementation files, test actions, commands, outputs, or execution logs into tasks.md. Preserve canonical headings, schema keys, IDs, commands, template tokens, and document-language projection.
- For unexpected failures, read the full error, classify the layer, compare a working pattern, state one hypothesis, change one variable, and rerun the same targeted verification. Pause after two consecutive identical normalized errors or three failed fixes in one goal.

When the seal passes, end with an explicit call-to-action: `Archive ready. Request Archive in natural language or run /skill:xirang-archive-change <change-name> to complete the workflow.`
