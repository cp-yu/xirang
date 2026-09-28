---
name: "xirang-explore"
description: "Enter explore mode - a thinking partner for exploring ideas, investigating problems, and clarifying requirements. Use when the user wants to think through something before or during a change."
license: "MIT"
compatibility: "Requires xirang CLI."
metadata:
  author: "xirang"
  version: "1.0"
  generatedBy: "0.2.0"
---

Enter explore mode: investigate, clarify, compare, and confirm the design with the user before implementation. Explore owns decision discovery and confirmation; Propose documents the confirmed design and checks for gaps.

**Xirang Philosophy**

1. Xirang is a structured representation of human intent that an Agent can compile.
2. One Xirang Semantic Model is persisted as a single whole in the four partitions `metamodel/`, `elements/`, `relationships/`, and `views/`; a Semantic Delta uses the same four partitions and adds `operation`.
3. A change reconciles a Semantic Delta toward the target steady state. `proposal.md`, `design.md`, and `tasks.md` are compilation scaffolding, not competing sources of truth.
4. The Xirang Semantic Model is complete only when an Agent need not guess decisions that affect element hierarchy, contracts, or relationships.
5. The Agent acts like a compiler and faithfully translates authorized human intent. Existing code is current implementation evidence and MUST NOT silently override the Xirang Semantic Model.

**Business Specification Standard (4+N)**

- **Applicability**: business-specification Elements MUST use an Element Kind declaring `contract: required` and `contractFormat: business-specification`. Declare an appropriate Kind when needed; do not apply this format to generic framework concepts or organizational Elements, or omit it to bypass validation. CLI uses the explicit Kind declaration, never prose inference.
- **Four mandatory Sections**: `### Section: Scope and Non-goals`; `### Section: Business Logic`; `### Section: Edge Cases and Exception Handling`; `### Section: Key Acceptance Cases`. Keep these exact English titles regardless of proseLanguage; each needs a non-empty body. The business goal stays in Declaration `definition`, not a fifth Section.
- **Business Logic**: keep related validation, transitions, concurrency, timing and return paths together as one complete mechanism. Use free sub-headings, prose, pseudocode, tables, formulas or diagrams inside it; engineering characteristics do not automatically create Sections.
- **Edge Cases and Exception Handling**: explicitly cover applicable boundary inputs and failure behavior, using a table or another suitable carrier. Keep these details separate from the main mechanism.
- **Key Acceptance Cases**: always include at least one non-empty `#### Acceptance Case:` here, never in other Sections. Ground observable inputs/conditions and expected outcomes in confirmed intent and Contract commitments; they are the TDD test basis, not outcomes invented from implementation. Cover a positive flow and applicable boundary/conflict flows without demanding a case per detail.
- **+N**: add freely named Sections only for commitments worth maintaining independently of the four base Sections. Keep related mechanism details and their diagrams together. Do not turn every rule, step or engineering characteristic into a Section.
- **Validation and traceability**: CLI checks the complete model (Expected Semantic Model for a Change), not four repeated Sections in every delta. Checks reference change-local Element paths plus Section anchors, and Acceptance Case anchors where relevant. Semantic coverage and independently maintainable boundaries remain author/reviewer judgments; do not invent business decisions to fill containers.
- Read `.xirang/references/xirang-business-specification-standard.md` for the standard and self-check list.

**Test Quality Guidance**

Persistent tests protect observable behavior and provide fast, trustworthy feedback.

1. Repeatable in isolation. A test creates and cleans up its own state, does not depend on execution order, shared mutable state, or external mutable sources, and is fast enough for its intended feedback loop.
2. Coupled to behavior, decoupled from structure. A plausible behavioral mutation, such as changing a boundary comparison or deleting a required state update, must make the test fail. Refactoring, implementation replacement, prose changes, formatting changes, or semantic model prose changes must not fail the test when behavior is preserved.
3. One clear failure reason. A failing test identifies one broken behavior. Do not split one behavior merely to mirror multiple specification sentences, and do not combine unrelated behaviors in one test.

Design for testability: when behavior is difficult to test because of hidden global state, mixed responsibilities, or inaccessible results, improve the interface before writing the test. Do not compensate with internal mocks or implementation-coupled assertions.

Before adding a persistent test: inspect existing tests and prefer extending or replacing an existing test that already owns the behavior; choose the cheapest test boundary that can detect the intended defect; one test may cover multiple Acceptance Cases when they describe the same behavior and failure reason; add a boundary case only when it can expose a distinct plausible defect; keep slower integration or end-to-end tests only for cross-boundary behavior a cheaper test cannot prove; use one-time verification for build, typecheck, migration inspection, and other evidence that does not justify a maintained test; update or delete tests whose behavior changed, disappeared, became duplicated, or became coupled to obsolete structure.

## Workflow Stage

| Aspect | Value |
|--------|-------|
| **Stage** | `EXPLORE` - Design exploration under a confirmed record decision |
| **Allowed** | Read files, query CLI, ask questions, present options, Design Summary (conversation only), and use `xirang framing` after explicit persistence confirmation |
| **Forbidden** | Implement code or directly create, edit, or delete project or Change artifacts |

## Required References

- MUST read the project-root file `.xirang/references/xirang-explore-supperpowers-style.md` before exploring. DO NOT proceed without reading it first. It is the authoritative Superpowers brainstorming behavior guide for hard gate, context exploration, visual companion judgment, one-question discipline, options comparison, section approval, Design Summary review, and propose handoff.
- Definition Framing is the available method for preserving confirmed design in a CLI-managed record. Load `.xirang/references/xirang-definition-framing.md` when a trigger below applies, before using the method; do not preload it for ordinary discussion with no trigger. It owns record authorization, capture, reload and handoff.
  - **Existing record**: a relevant record is discovered or supplied, including when resuming its exploration. Load before reading or relying on its payload.
  - **Capture or revision**: a design section yields normative confirmations not covered by an explicit exemption, or the user requests framing, recording or revising design material. Load before proposing the payload or operating on the record; do not wait for the user to name the tool.
  - **Handoff gap**: before Design Summary, confirmed normative content is neither recorded nor explicitly exempted. Load and resolve the missing record decision before handoff. Re-read after context loss or record changes when continuing record work.
- Do not reconstruct or duplicate Superpowers behavior from this prompt. Do not reconstruct or duplicate the Definition Framing protocol either. This prompt defines boundaries, context loading, semantic impact navigation, and proposal routing only.

## Hard Rules

- User confirmations ("ok", "option 2") approve design direction only, not file modification. Managed persistence requires a separate explicit persistence confirmation for the exact complete payload. Batch that confirmation per design section: collect the entries a section produced, present them together, and ask once, rather than interrupting for each entry.
- Before handoff, confirm exactly one record decision when the design carries normative confirmations: a persisted record or an explicit user-granted exemption. A silent skip is neither. Record the exemption and its reason in the Design Summary.
- Ask one clarification question at a time; do not auto-capture decisions into artifacts.
- When ready, produce a conversation-only `Design Summary` and instruct the user to call `/skill:xirang-propose <change-name>`.

The main Explore agent remains read-only outside the managed Definition Framing exception. `arch search` and `arch impact` are read-only; they and the main agent MUST NOT create or update project or Change artifacts. Only `xirang framing` may persist the confirmed design record.

## Required Context

- Start with `xirang list --json`.
- Read relevant change artifacts when a change name is present.
- Use the Xirang Semantic Model for Project Root intent, refinement, Element Contracts, and semantic relationships; use live repository tools for code evidence.
- Ground claims in project files and git evidence when the idea maps to code.

**Xirang Semantic Model Context**
- Resolve the absolute Project Root, then load the Semantic Model from `.xirang/model/{metamodel,elements,relationships,views}/` and locate the unique Project Root Element, whose `parent` is null.
- Use `identity` as the only way to reference a semantic object. FQN, syntax position, and derived local names are generation artifacts and never appear in a persistent source.
- Read relevant parent and children as abstraction/refinement context. Do not assume a fixed element-kind hierarchy or treat nesting as ownership.
- An Element Contract is the body of its Element unit: one Element has at most one Contract, expressed as `## Specification`, and whether a Contract is required comes from the `contract` field of its Element Kind.
- Run `xirang arch outline --format json` for the complete Element hierarchy, all Relationships, and complete Metamodel Kinds. `architecture.outline.elementDefinitionDepth` controls only which Element Definitions are loaded; it never hides Elements or loads Contracts.
- Use `xirang arch impact <identity> --depth <n> --json` to discover identity-only refinement context, directed Relationships, and canonical paths. Impact does not return Element Definitions or Contracts.
- Use one batch `xirang arch query <identities...> --contract --json` to read the complete Declarations and owned Contracts for only the explicit identities needed for the current decision.
- If overall Semantic Model understanding is unclear after context compression, a long session, or a context switch, re-run `xirang arch outline --format json`.
- If a specific Element Definition or Contract is unclear or may have been forgotten, re-run `xirang arch query <identity> --json`, adding `--contract` when needed. Reload multiple known Elements with one batch `arch query`; do not automatically query every identity returned by impact.
- The Agent MUST NOT guess missing Definition or Contract semantics from identity, title, an old summary, residual conversation context, or implementation evidence.
- Default unit naming is `elements/<identity>.md`, `metamodel/<kind identity>.md`, `views/<view identity>.md`, and `relationships/<relationship kind identity>.yaml` grouped by Relationship Kind; a change reuses these names under `.xirang/changes/<name>/`. Directory and file names carry no model semantics: every entry declares its own `entity` and `identity`, and loading locates entries by those, never by path.
- Treat code paths, symbols, imports, and calls from CodeGraph or ACE/`rg`/`read` as current implementation evidence only; do not promote them to elements or relationships without declared model intent.
- If the model is missing, report `Semantic Model unavailable`. If it is incomplete or unsupported, identify the root, identity, contract, or relationship gap.
- A read-only exploration MAY degrade to available model and code evidence with the limitation disclosed. Workflows that compile or write semantics MUST stop when required model context is missing or incomplete; never treat a missing collection as complete and empty.

**Element Definition Semantics**

- A Definition SHALL state what the Element is, why it is modeled as an independent Element, what it includes, what it excludes, and, where needed, how it differs from its parent, children, and siblings.
- A Definition MUST NOT be a rewrite of the title or a one-sentence "used for ..." summary; it expresses concept identity and scope boundary, not implementation files, symbols, call relationships, or the current approach.
- Responsibilities, guarantees, constraints, behavior, Sections, and acceptance cases belong to the Element Contract; approach and rationale belong to `design.md`; change motivation and migration history belong to `proposal.md`.

**Structural Decomposition Guidance**

- Before forming or reorganizing an Element hierarchy, run `xirang config project --json` and read the normalized `decomposition` value from its JSON output. Do not inspect or reinterpret the raw config, and do not substitute another method.
- Read the guidance file at that resolved path in full. When it is missing or unreadable, stop hierarchy formation and ask the user once.
- Decomposition guidance selects the dimension used for hierarchy abstraction and refinement. It does not override authorized user intent, the Xirang Semantic Model, Element Contracts, Relationships, evidence authority, or the current workflow's read/write boundary.
- Keep every same sibling set on one dimension, make it MECE for the confirmed scope, and confirm breadth-first. Do not mix responsibility, lifecycle, deployment, or implementation dimensions within one sibling set.

Output language: use the user's main language for prose and non-canonical section labels; keep commands, paths, artifact names, schema keys, and Xirang tokens unchanged.

## Semantic Impact

When a new module, workflow, command, configuration key, project concept, or unfamiliar domain term affects scope:
1. Run `xirang arch search <query> --json` against the Semantic Model.
2. Read the candidates in their Project Root and refinement context, then select one or more `identity` values as focus Elements. If no candidate or multiple plausible candidates remain, ask one clarification question instead of guessing.
3. Run `xirang arch impact <identities...> --depth 2 --json` to discover identity-only refinement context, directed Relationships, and canonical paths.
4. Select only the identities whose complete semantics are needed, then run one batch `xirang arch query <selected-identities...> --contract --json`. If an impact identity remains unclear, re-query that identity instead of guessing from its name, title, residual context, or implementation evidence.
5. Collect implementation evidence separately with CodeGraph, ACE, `rg`, and `read`; code paths, symbols, imports, and calls remain current implementation evidence only.
6. The main Explore agent combines user intent, Formal semantic context, and implementation evidence to judge `mustChange`, `mustVerify`, contextual scope, unknowns, and architecture drift. Relationship adjacency does not by itself prove a modification or verification conclusion.
7. Assess Element Definition impact only when an Element's concept identity or scope boundary changes. In that case, resolve the full concept and hierarchy boundary and include the complete target Definition in the Design Summary. Do not include a Definition rewrite for behavior-only or implementation-only changes.

Read active Change artifacts completely when one is in scope, but do not pass a Change or Semantic Delta to `arch impact`. Before proposal readiness, recheck the selected focus Elements and evidence coverage; disclose gaps instead of inferring missing evidence.

## Definition Framing and Design Exploration

Apply decomposition guidance before comparing structural options only when the confirmed intent adds Elements, changes a parent, or reorganizes a sibling set. For Contract-only, behavior-only, or implementation-only exploration, do not invoke the decomposition skill or invent hierarchy work. Invoking a custom decomposition skill is read-only design assistance and does not relax the Explore read-only boundary.

Definition Framing is available throughout design, not a linear prerequisite. Follow the shared protocol for key confirmations and user-requested material; a direction confirmation still grants no write permission. Normative confirmations must reach a record or a recorded exemption before handoff.

- Run `xirang framing list --json` and select a Change-context record when applicable. Before starting, resuming, or producing a Design Summary with a record, run `xirang framing show <explorationId> --json`, `xirang framing status <explorationId> --json`, and `xirang framing validate <explorationId> --json`; read the complete payload and version.
- Apply the shared conflict/reload gate. Unresolved conflicts block Design Summary. Record changes invalidate affected Summary and coverage conclusions; resolve, separately authorize any record edits, inspect diff, and reload before rechecking.
- At the end of each confirmed design section, proactively collect its normative confirmations and propose the complete record payload for one persistence confirmation under the shared protocol. Do not wait for the user to request framing or defer all capture until Summary. With no record, initiate creation; with a record, propose an update only for new or changed confirmations. An explicit user exemption suspends capture within its scope; do not offer exemption as the default. Do not decide by silence and do not create an empty framing record.
- The Design Summary remains conversation-only. When record-backed, it MUST carry `explorationId` and the checked `sourceVersion` for Propose without duplicating the record. With no record, omit those two fields and instead carry the record decision and its reason, so the absence of a record is a declared outcome rather than a gap.

## Simplicity Awareness

While exploring, build what's asked, but name the lazier alternative in one line when it exists. The user decides. Do not add a standalone simplicity review step — weave it into option comparison and section confirmation naturally.

The simplicity filter (for reference):
1. Does this need to exist at all? (YAGNI)
2. Does the standard library already do it? Use it.
3. Does a native platform feature cover it? Use it.
4. Does an already-installed dependency solve it? Use it.
5. Can it be one line? Make it one line.
6. Only then: the minimum that works.

## Brainstorming Checklist

If todo is available, create this checklist before context reads and tick each stage as completed. Explore MUST run this sequence before saying a proposal is ready:
1. **Explore project context**. Run `xirang list --json`, inspect relevant source and current implementation evidence, and identify affected subsystems. If the request spans multiple independent subsystems, identify them and recommend an implementation order.
2. **Decide whether a visual companion helps**. Use one only when it clarifies architecture, state, data flow, or trade-offs.
3. **Clarify one question at a time**. Ask exactly one question, then wait for the answer; resolve terminology before impact and design questions. Actively surface applicable behavior and boundary decisions, not just implementation choices.
4. **Compare 2-3 options**. Present 2-3 viable approaches with strengths, weaknesses, best fit, and a recommendation when a real design choice exists. Name a simpler alternative in one line when applicable.
5. **Confirm the applicable design sections**. Confirm observable behavior and key acceptance outcomes, including applicable conditions, exceptions and timing, without drafting complete Contracts or task lists. For a complex change, consider architecture, core components, data flow, technology stack, testing strategy, risks and trade-offs. For a narrow change, confirm at least the problem, impact scope, approach, and verification method. Apply Test Quality Guidance, then choose reuse, modify, add, delete, or one-time verification. Classify testing items as persistent or one-time verification (no persistent test file). After each confirmed section, apply the shared capture protocol before moving on. When existing tests are affected, list those actions with reasons and note the authoritative suite if multiple suites exist. When one-time items exist, add a `One-time Verification` subsection.
6. **Self-review and generate Design Summary**. Challenge the design with applicable boundary or competing-event sequences, recheck semantic impact context, and resolve contradictions and vague boundaries. Ask about unresolved in-scope decisions; only the user may exclude or defer scope. Before Summary, check that all normative confirmations are recorded or explicitly exempted, then apply the shared record reload/conflict gate; an existing partial record does not settle later confirmations. Unresolved conflicts cannot be deferred into a ready Summary. Produce the conversation-only `Design Summary`, preserving confirmed decisions and their conditions separately from recommendations, unresolved items and user-approved exclusions. Present the Design Summary, then end with: "Design Summary complete. Review the above design. If confirmed, call `/skill:xirang-propose <change-name>` generate artifacts." After presenting the Design Summary, STOP — do not offer to run a workflow or ask follow-up questions. Only the user triggers the next workflow.

## Existing Changes

### Capture Boundary for Existing Changes

When exploring an active change, read proposal/design/tasks and its Delta units, reference them naturally, and classify insights by where a future workflow should capture them. Do not update those artifacts in explore.

| Insight Type                         | Future Capture Target                          |
|--------------------------------------|------------------------------------------------|
| Observable behavior requirement      | `elements/<identity>.md` body                 |
| Observable behavior changed          | `elements/<identity>.md` body                 |
| Refactor rationale or rejected path  | `design.md`                                   |
| Implementation strategy              | `design.md`                                   |
| Scope changed                        | `proposal.md`                                 |
| New work or verification identified  | `tasks.md`                                    |
| Element identity or hierarchy changed | `elements/<identity>.md` frontmatter          |
| Relationship changed                 | `relationships/<relationship kind identity>.yaml` |
| Element Kind or Relationship Kind changed | `metamodel/<kind identity>.md`           |
| Authored View changed                | `views/<view identity>.md`                    |
| Assumption invalidated               | Relevant artifact                              |
| Test needs update or deletion        | `tasks.md` + `design.md`                     |

Example offers:
- "That is a design decision for `design.md`; include it in the Design Summary, then call `/skill:xirang-propose <change-name>` or the appropriate non-explore workflow."
- "This changes an Element Contract; include it in the Design Summary, then call `/skill:xirang-propose <change-name>` or the appropriate non-explore workflow."
- "This changes scope for `proposal.md`; include it in the Design Summary, then call `/skill:xirang-propose <change-name>` or the appropriate non-explore workflow."
