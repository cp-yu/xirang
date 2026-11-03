# Explore design guide

Output language: use the user's main language for prose and non-canonical section labels; keep commands, paths, artifact names, schema keys, and Xirang tokens unchanged.

## Design loop

Use a todo checklist when available: evidence → applicable decisions → confirmation → self-review → Summary review. Scale each stage to the actual decisions; a narrow change still needs a clear, confirmed problem, scope, approach and verification method. Reuse confirmations already supplied instead of asking for them again.

1. Ground existing-project claims in the Semantic Model, relevant Change, implementation, tests and Git evidence. Identify unknowns and affected subsystem boundaries before design. For independent subsystems, clarify scope and recommend an implementation order.
2. Ask one design-changing question per turn and wait. Resolve terminology before dependent choices. For a key choice, compare 2–3 viable approaches with trade-offs, fit and a reasoned recommendation; include a simpler alternative when useful. Do not manufacture alternatives for settled decisions. Use diagrams only when they clarify architecture, state, flow or dependencies; concise text or tables suffice for routine CLI or field decisions. Do not introduce a browser/server companion for these.
3. Confirm applicable mechanisms or design sections incrementally: behavior and acceptance outcomes, architecture/components, data flow, technology, testing and risks. Preserve conditions, numbers, exceptions, event order and timing. Actively surface consequential failure, boundary and competing-event choices instead of leaving them for Propose to invent. After a revision, recheck dependent decisions. Apply the Design Record protocol immediately to each confirmation.
4. If a design depends on practical feasibility, delegate the question, constraints and decision background to Experimenter before confirming it. It independently designs and runs a minimal discriminating experiment, choosing an appropriate location with the main Agent. Inspect reproducible observations and limitations; experimental success is evidence, not user adoption. Experiment files are not formal implementation.
5. For verification, use Test Quality Guidance: identify the behavior at risk and existing coverage, then choose reuse/modify/add/delete/one-time with reasons. Name the authoritative suite when several exist. Include obsolete-test handling when needed and a One-time Verification subsection for evidence-only checks. Complete Contracts, Acceptance Cases and tasks belong to Propose.

## Summary gate and handoff

Before a ready Summary:
- Resolve contradictions, vague boundaries, and target-affecting pending choices. User agreement is required to exclude or defer in-scope behavior. Correct source-determined expression or reasoning errors yourself; ask for new or changed decisions.
- Exercise relevant boundary/competing-event sequences against the design, and check necessary experimental evidence, testing strategy, risks and semantic impact coverage.
- Pass the shared Design Record **Record decision and Summary gate**. It owns complete latest-record reload, capture completeness, conflicts and version binding.

Present the Design Summary in the conversation only. Preserve confirmed scope, behavior, rationale, conditions, numbers, exceptions, timing and acceptance outcomes, with applicable architecture, technology, testing and risks. Distinguish confirmed decisions, recommendations, unresolved items and user-approved exclusions. When record-backed, identify explorationId and checked sourceVersion instead of copying the record. Do not create a separate decision ledger.

Stop after presenting the Summary for user review. User changes return to the affected design section and dependent checks. Only after the user accepts the Summary may they trigger xirang-propose; Explore does not author a complete Change, update formal model/generated work surfaces, commit or implement. Design Record operations and delegated experimental writes follow their own permissions.