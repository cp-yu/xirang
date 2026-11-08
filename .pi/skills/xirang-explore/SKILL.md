---
name: "xirang-explore"
description: "Enter explore mode - a thinking partner for exploring ideas, investigating problems, and clarifying requirements. Use when the user wants to think through something before or during a change."
license: "MIT"
compatibility: "Requires xirang CLI."
metadata:
  author: "xirang"
  version: "1.0"
  generatedBy: "0.2.7"
---

Explore the user's intent with project evidence, maintain the intermediate design, and confirm a design ready for Propose. Do not implement the formal Change, write the formal model or generated work surfaces, or author complete Change artifacts. CLI-managed records and delegated feasibility experiments are permitted within their protocols.

**Xirang Philosophy**

1. Xirang is a structured representation of human intent that an Agent can compile.
2. One Xirang Semantic Model is persisted as a single whole in the four partitions `metamodel/`, `elements/`, `relationships/`, and `views/`; a Semantic Delta uses the same four partitions and adds `operation`.
3. A change reconciles a Semantic Delta toward the target steady state. `proposal.md`, `design.md`, and `tasks.md` are compilation scaffolding, not competing sources of truth.
4. The Xirang Semantic Model is complete only when an Agent need not guess decisions that affect element hierarchy, contracts, or relationships.
5. The Agent acts like a compiler and faithfully translates authorized human intent. Existing code is current implementation evidence and MUST NOT silently override the Xirang Semantic Model.

**Business Specification Standard (4+N)**

For business-specification Elements, prepare scope/non-goals, the complete business mechanism, exceptions, and key acceptance outcomes; add Sections only for independently maintained commitments. Before exploring such a Contract or authoring/revising its Kind or Contract, read `.xirang/references/xirang-business-specification-standard.md` for applicability, canonical structure and self-checks. Generic framework or organizational Elements do not trigger this format.

**Test Quality Guidance**

Persistent tests protect observable behavior and provide fast, trustworthy feedback.

1. Repeatable in isolation. A test creates and cleans up its own state, does not depend on execution order, shared mutable state, or external mutable sources, and is fast enough for its intended feedback loop.
2. Coupled to behavior, decoupled from structure. A plausible behavioral mutation, such as changing a boundary comparison or deleting a required state update, must make the test fail. Refactoring, implementation replacement, prose changes, formatting changes, or semantic model prose changes must not fail the test when behavior is preserved.
3. One clear failure reason. A failing test identifies one broken behavior. Do not split one behavior merely to mirror multiple specification sentences, and do not combine unrelated behaviors in one test.

Design for testability: when behavior is difficult to test because of hidden global state, mixed responsibilities, or inaccessible results, improve the interface before writing the test. Do not compensate with internal mocks or implementation-coupled assertions.

Before adding a persistent test: inspect existing tests and prefer extending or replacing an existing test that already owns the behavior; choose the cheapest test boundary that can detect the intended defect; one test may cover multiple Acceptance Cases when they describe the same behavior and failure reason; add a boundary case only when it can expose a distinct plausible defect; keep slower integration or end-to-end tests only for cross-boundary behavior a cheaper test cannot prove; use one-time verification for build, typecheck, migration inspection, and other evidence that does not justify a maintained test; update or delete tests whose behavior changed, disappeared, became duplicated, or became coupled to obsolete structure.

## Load and navigate

Read `.xirang/references/xirang-explore-supperpowers-style.md` before exploring; it owns the design loop, question/confirmation discipline, experiments and Summary review.

Start with `xirang list --json` and `xirang record list --json`. Read relevant active Change artifacts completely. Ground code claims in current project evidence.

**Xirang Semantic Model Context**
- Resolve the absolute Project Root. The Semantic Model is stored in `.xirang/model/{metamodel,elements,relationships,views}/`; use the CLI projections below to load needed context, not a recursive read of all partitions. Locate the unique Project Root Element (`parent: null`) through outline and query its Declaration.
- Use `identity` as the only way to reference a semantic object. FQN, syntax position, and derived local names are generation artifacts and never appear in a persistent source.
- Read relevant parent and children as abstraction/refinement context. Do not assume a fixed element-kind hierarchy or treat nesting as ownership.
- An Element Contract is the body of its Element unit: one Element has at most one Contract, expressed as `## Specification`, and whether a Contract is required comes from the `contract` field of its Element Kind.
- Use `xirang arch outline --format json` as the navigation projection: it returns the complete Element hierarchy without Definitions, Relationships, or Metamodel unless explicitly selected.
- Use `xirang arch impact <identity> --depth <n> --json` for identity-only refinement context and a relationship summary. Use `--paths` only when relationship paths are needed; impact never returns Element Definitions or Contracts.
- Use `xirang arch query <identity> --json` for the complete Declaration of a selected identity; add `--contract` only when that Element Contract is needed. Batch only the selected identities whose semantics answer the current question.
- Before expanding a read or issuing a batch, state the concrete question it must answer and include only the identities or file ranges required for that question. Start discovery with `xirang arch search <query> --limit <n>`.
- For code evidence, locate symbols or definitions first with LSP or `rg`, then read the smallest relevant implementation range. For tests, locate the test that owns the behavior before opening test files; do not read whole directories by default.
- Use concurrency only for bounded, independent reads. Do not emit or retain raw nested JSON when a concise projection or selected fields answer the question.
- If a tool truncates output, treat it as incomplete: narrow the query or split it into bounded reads, then retrieve and verify the missing portion before relying on the result.
- If specific semantic context is missing, query that identity rather than expanding every identity returned by impact. If global model understanding is lost after context compression, session switch, or a model diagnostic, run `xirang arch snapshot --format json` for the full Declaration/Relationship/Metamodel baseline, then query only required Contracts.
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

For new or unfamiliar concepts affecting scope, search for finite candidates, inspect their refinement context and select focus identities; if ambiguity remains, ask one clarification question. Use `arch impact <identities...> --depth 2 --json` for relationship summary and refinement context, then query only the semantics needed to judge mustChange, mustVerify, contextual scope, unknowns and drift. Adjacency alone proves none of those conclusions. Do not pass a Change or Delta to impact. Before readiness, recheck focus Elements and evidence coverage and disclose gaps.

Assess Declaration/Definition impact only when concept identity or scope changes, and carry the complete confirmed target Definition into the Summary. Invoke configured decomposition guidance only for new Elements, reparenting or sibling reorganization; Contract-only work does not require hierarchy design. Guidance does not expand Explore's write permissions.

## Design Record entry points

Read `.xirang/references/xirang-design-record.md` before using a relevant existing record, preserving a pending question/hypothesis/recommendation, recording or revising design content, or closing a missing record decision before Summary. Ordinary discussion without these triggers does not preload it.

The shared protocol owns nature/decision states, user authority, complete and selective reads, versioned partial updates, conflict handling, user-facing record presentation and the Summary gate. Apply its **User-facing record presentation** rules at record loads and after updates. Apply it immediately after confirmations without asking for separate persistence permission. Proactively preserved suggestions remain pending; only the user permits accepted/excluded decisions and substantive revisions of confirmed content or structure. Keep unconfirmed structure in pending text. Record changes invalidate affected conclusions; reuse the loaded protocol and returned version unless context is lost or its content is unavailable.

## Work and handoff

Follow the design loop in the required reference. Delegate necessary practical questions to `xirang-experimenter` with the question, constraints and decision background, allowing independent experiment design and an appropriate location (workspace, temporary directory, copy or worktree). Finish necessary experiments before confirming dependent design. Maintain current design through the record rather than rewriting complete Change drafts.

After the reference's self-review and record gates, present the conversation-only Design Summary for review and stop. Once accepted, the user triggers `/skill:xirang-propose <change-name>`. Do not offer to start implementation.

### Existing Change capture

Read the active Change's Plan and Delta completely. Explore may maintain its design record but does not edit the Change. Carry future capture targets into the conversation-only Design Summary: behavior → Element Contract; identity/hierarchy → Declaration; relationships/kinds/views → their Delta partitions; scope → proposal.md; rationale, implementation strategy and rejected approaches → design.md; implementation and verification work → tasks.md.
