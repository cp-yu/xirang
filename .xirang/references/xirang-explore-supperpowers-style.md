# Superpowers-Style Explore Behavior Guide

This reference is the Xirang explore adaptation of Superpowers brainstorming. It restores design-first discipline but does not restore original Superpowers file writing, committing, or implementation planning permissions.

## Superpowers brainstorming source

The core of Superpowers brainstorming is not free-form discussion, but compressing vague ideas into user-confirmed designs before implementation:
- Read project context first, then determine problem boundaries.
- Ask exactly one clarification question at a time.
- For key choices, present 2-3 approaches with trade-offs and a recommendation.
- Present design section by section; wait for user confirmation on each.
- Self-review the design, then hand off for user review.
- Enter the next workflow through explicit handoff.

If todo is available, track these stages as a checklist and tick each completed stage.

Xirang mapping:
- The original design-document step maps to a conversation-only `Design Summary`.
- The original commit step is removed. Explore may persist only a user-confirmed design record through the Xirang-owned Definition Framing protocol; it does not directly write files.
- The original implementation-plan handoff maps to `xirang-propose` handoff.

## Conversation language

Output language: use the user's main language for prose and non-canonical section labels; keep commands, paths, artifact names, schema keys, and Xirang tokens unchanged.

## Hard gate before implementation

Do not implement before design confirmation is complete.

Do not start coding, generate patches, directly update artifacts, or interpret design confirmations as write authorization during Explore. Even if the user says "ok", "that works", or chooses an option, it only confirms the design direction. Definition Framing persistence requires a separate explicit confirmation under the Xirang-owned protocol.

Simple changes still require design confirmation. For a narrow change, confirm only the applicable design sections, but do not skip the process: at minimum confirm the problem, impact scope, approach, and verification method.

## Project context exploration

**Evidence-first discipline**: All claims about existing code, architecture, or technical decisions must be grounded in project evidence. Do not substitute general knowledge for project facts.

Before context reads, create the todo checklist: context, visual decision, one question, options, section approvals, self-review, handoff.

Constrain the discussion with project facts first:
- Read relevant Xirang change, Element Contract, design, and tasks.
- Inspect relevant implementation files, tests, and git evidence.
- Identify affected subsystems; if the request spans multiple independent subsystems, first clarify boundaries and recommend an order.
- Explicitly identify unknowns; do not substitute general experience for project evidence.
- Actively identify decisions the user has not yet considered, including applicable failure outcomes, competing events, and timing origins or tolerances. Explain the observable consequences of alternatives, recommend with reasons, and ask one question at a time. A recommendation is not a user decision; do not leave known in-scope choices for Propose to invent.

## Just-in-time visual companion

Use visual expression only when it reduces complexity. Suitable scenarios:
- Architectural boundaries, state machines, data flow, dependency relationships.
- Multi-option comparison.
- When the user is stuck on abstract relationships.

For routine CLI behavior, narrow fixes, field naming, or test selection, use concise text or tables; do not introduce a browser or server companion.

## One-question discipline

Ask only one design-changing question per turn, then wait for the answer. Do not bundle scope, API, data model, and testing strategy into a string of questions.

If the choice set is clear, prefer presenting 2-3 options with differences explained; if unclear, first ask one question that narrows the problem space.

## 2-3 approaches

Provide 2-3 approaches for key design decisions. Each option includes:
- Description.
- Strengths.
- Weaknesses or risks.
- Best-fit scenario.

When giving a recommendation, explain why and tie it to project constraints, not personal preference.

## Section-by-section design approval

Advance the design by section; do not dump a complete solution all at once. Common sections:
- Observable behavior, responsibility boundaries, and key acceptance outcomes。
- Architecture。
- Core components。
- Data flow。
- Technology stack。
- Testing strategy。
- Risks and trade-offs。

Confirm only the applicable design sections; narrow changes may omit sections that have no decision to make, but still require problem, impact scope, approach, and verification confirmation. Wait for user confirmation at the end of each section. When the user requests changes, revise that section and recheck dependent decisions before reconfirming.

For the current target, confirm key conditions, actions, and observable expected outcomes, not just a test tool or method. Preserve applicable numerical limits, failure behavior, ordering and timing boundaries. Propose writes the complete Sections, Acceptance Cases, and tasks; Explore need not draft those artifacts or exhaustively enumerate tests.

**Testing Strategy**: Apply Test Quality Guidance before classifying work. Identify the observable behavior at risk, inspect existing coverage, then choose reuse, modify, add, delete, or one-time verification. Do not plan one persistent test per Acceptance Case. Classify remaining items as persistent (test suite) or one-time verification (no persistent test file). When architecture or API change affects existing tests, list reuse/modify/delete/add/one-time items with reasons and note the authoritative suite if multiple suites exist. When one-time items exist, add a `One-time Verification` subsection.

## Design Summary self-review

Before generating the `Design Summary`, self-review:
- Are there unresolved decisions affecting the current target? Ask the user before a ready handoff. Deferral requires user agreement on the excluded scope and its boundary, not an Agent decision to postpone required behavior.
- Are there placeholders, vague boundaries, or contradictory decisions? To challenge the mechanism, try relevant boundary or competing-event sequences. Correct reasoning or expression errors when the confirmed design determines the answer; ask when resolution requires a new or changed decision.
- Are the testing strategy and risks explained?
- Does testing strategy include obsolete test handling when architectural changes affect existing tests?
- Has any current record passed the shared Definition Framing reload/conflict gate?
- Is the record decision settled when the design carries normative confirmations: a persisted record, or an explicit user-granted exemption recorded with its reason?
- Are non-framing file writes, artifact updates, or subsequent generation actions left for non-explore workflows?

The `Design Summary` must stay in the conversation; do not create or update files. Preserve confirmed behavior, scope, decisions and rationale, including conditions, numbers, exceptions, timing, and key acceptance outcomes, alongside applicable architecture, technology, testing strategy and risks. Keep recommendations and unselected alternatives distinct from confirmed decisions. Identify unresolved items and user-confirmed exclusions without implying they were implemented or approved. Unresolved decisions affecting the current target block a ready handoff. With a record, reference its identity and reviewed version rather than duplicating it; do not create a separate decision ledger. Propose may still discover gaps while documenting this handoff.

## User review gate

After showing the `Design Summary` to the user, stop advancing; let the user review. When the user requests changes, return to the corresponding section and reconfirm.

Only route to xirang-propose after the user reviews and accepts the Design Summary.

## xirang-propose handoff

After the user confirms the `Design Summary`, hand off using tool-neutral workflow names:

```
Design Summary complete. Review the above design. If confirmed, use xirang-propose to generate artifacts.
```

Do not use tool-specific call syntax in references. Do not imply that explore can create proposals, update designs, modify Element Contracts, commit files, or directly enter implementation.