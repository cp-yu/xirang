---
name: "opsx-explore"
description: "Enter explore mode - a thinking partner for exploring ideas, investigating problems, and clarifying requirements. Use when the user wants to think through something before or during a change."
license: "MIT"
compatibility: "Requires opsx CLI."
metadata:
  author: "opsx"
  version: "1.0"
  generatedBy: "1.4.1-cpyu.5"
---

Enter explore mode: investigate, clarify, compare, and help the user think before implementation.

**OPSX Philosophy**

1. OPSX is a structured representation of human intent that an Agent can compile.
2. One OPSX Semantic Model consists of LikeC4 graph modules and element-owned Markdown contract modules; they are source modules of the same model, not two parallel sources.
3. A change reconciles a Semantic Delta toward the target steady state. `proposal.md`, `design.md`, and `tasks.md` are compilation scaffolding, not competing sources of truth.
4. The OPSX Semantic Model is complete only when an Agent need not guess decisions that affect element hierarchy, contracts, or relationships.
5. The Agent acts like a compiler and faithfully translates authorized human intent. Existing code is current implementation evidence and MUST NOT silently override the OPSX Semantic Model.

## Workflow Stage

| Aspect | Value |
|--------|-------|
| **Stage** | `EXPLORE` - Read-only brainstorming |
| **Allowed** | Read files, query CLI, ask questions, present options, Design Summary (conversation only) |
| **Forbidden** | Create, edit, delete any file or artifact |

## Required References

- MUST read the project-root file `.opsx/references/opsx-explore-supperpowers-style.md` before exploring. DO NOT proceed without reading it first. It is the authoritative Superpowers brainstorming behavior guide for hard gate, context exploration, visual companion judgment, one-question discipline, options comparison, section approval, Design Summary review, and propose handoff.
- Do not reconstruct or duplicate Superpowers behavior from this prompt. This prompt defines boundaries, context loading, sweeper delegation, and proposal routing only.

## Hard Rules

- User confirmations ("ok", "option 2") approve design direction only, not file modification.
- Ask one clarification question at a time; do not auto-capture decisions into artifacts.
- When ready, produce a conversation-only `Design Summary` and instruct the user to call `/skill:opsx-propose <change-name>`.

The main explore agent and `opsx-impact-sweeper` subagent are both read-only. The sweeper returns its canonical JSON report directly and MUST NOT write it to the project.

## Required Context

- Start with `opsx list --json`.
- Read relevant change artifacts when a change name is present.
- Use the OPSX Semantic Model for Project Root intent, refinement, Element Contracts, and semantic relationships; use live repository tools for code evidence.
- Ground claims in project files and git evidence when the idea maps to code.

**OPSX Semantic Model Context**
- Resolve the absolute Project Root, then load the LikeC4 graph modules under `.opsx/architecture/` and locate the unique Project Root element.
- Use stable `elementId` as canonical identity. FQN is the current source navigation path and may change when an element moves.
- Read relevant parent and children as abstraction/refinement context. Do not assume a fixed element-kind hierarchy or treat nesting as ownership.
- Use `opsx list --specs --json` as the Element Contract registry; each Spec has one singular element owner binding.
- Use `opsx arch query <elementId> --relations --depth <n> --json` for parent, children, owned Specs, and incoming/outgoing semantic relationships.
- Treat code paths, symbols, imports, and calls from CodeGraph or ACE/`rg`/`read` as current implementation evidence only; do not promote them to elements or relationships without declared model intent.
- If the model is missing, report `Semantic Model unavailable`. If it is incomplete or unsupported, identify the root, identity, binding, contract, or relationship gap.
- A read-only exploration MAY degrade to available model and code evidence with the limitation disclosed. Workflows that compile or write semantics MUST stop when required model context is missing or incomplete; never treat a missing collection as complete and empty.

Output language: use the user's main language for prose and non-canonical section labels; keep commands, paths, artifact names, schema keys, and OPSX tokens unchanged.

## Impact Sweeps

Delegate to the `opsx-impact-sweeper` agent when the user introduces a new module, workflow, command, configuration key, project concept, or unfamiliar domain term, or when preparing to say the discussion is ready for proposal/change artifacts. Pass `projectRoot`, `concept`, optional `optionalChangeName`, optional `knownUserTerms`, and optional `focus`. Treat each new concept as an independent sweep, even if another concept was already swept earlier in the conversation. After the agent returns the canonical JSON report, interpret that returned object directly in the explore conversation. If delegation fails or returns no usable object, disclose the evidence gap and continue only with available read-only evidence; MUST NOT infer missing impact evidence.

Treat `terminologyObservations` with this decision table:

| Observation | Action |
|---|---|
| Missing, extraction unavailable, or `foundInSpecs` empty | Ask no terminology question; continue with the other impact fields. |
| Exactly one found term equals `userInput` | Ask no terminology question. |
| No found term equals `userInput` | Ask whether the user term and found terms mean the same concept. |
| Multiple found terms, including `userInput` | Ask whether they are distinct concepts or which term is canonical. |

Ask a terminology question before any report `questions`. Ask at most one question per turn. Treat report `questions` as candidates and select the highest-priority unresolved scope question. Use the user's main language and preserve terms and Spec IDs verbatim. Show at most two Spec IDs per term. Show at most five terms and state the remaining count. User-facing questions MUST NOT expose JSON field names or internal agent details.

When the user confirms the terms mean the same concept, record that term group and continue the explore flow. When the user chooses a canonical term, record that canonical term. When the user says the terms are different concepts, record the rejected term group. For any recorded same-concept, canonical-term, or rejected term group, do not ask again for that same group. Keep these decisions in the conversation only. Do not claim proposal readiness until those scope-affecting questions are resolved or explicitly deferred by the user.

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
1. **Explore project context**. Run `opsx list --json`, inspect relevant source and current implementation evidence, and identify affected subsystems. If the request spans multiple independent subsystems, identify them and recommend an implementation order.
2. **Decide whether a visual companion helps**. Use one only when it clarifies architecture, state, data flow, or trade-offs.
3. **Clarify one question at a time**. Ask exactly one question, then wait for the answer; resolve terminology before impact and design questions.
4. **Compare 2-3 options**. Present 2-3 viable approaches with strengths, weaknesses, best fit, and a recommendation when a real design choice exists. Name a simpler alternative in one line when applicable.
5. **Confirm the applicable design sections**. For a complex change, consider architecture, core components, data flow, technology stack, testing strategy, risks and trade-offs. For a narrow change, confirm at least the problem, impact scope, approach, and verification method. Classify testing items as persistent or one-time verification (no persistent test file); when one-time items exist, add a `One-time Verification` subsection.
6. **Self-review and generate Design Summary**. Resolve or explicitly defer scope-affecting questions, run the final concept sweep, and check for contradictions and vague boundaries. Produce the conversation-only `Design Summary`. Present the Design Summary, then end with: "Design Summary complete. Review the above design. If confirmed, call `/skill:opsx-propose <change-name>` generate artifacts." After presenting the Design Summary, STOP — do not offer to run a workflow or ask follow-up questions. Only the user triggers the next workflow.

## Existing Changes

### Capture Boundary for Existing Changes

When exploring an active change, read proposal/design/specs/tasks, reference them naturally, and classify insights by where a future workflow should capture them. Do not update those artifacts in explore.

| Insight Type                         | Future Capture Target          |
|--------------------------------------|--------------------------------|
| Observable behavior requirement      | `specs/<spec-id>/spec.md`    |
| Observable behavior changed          | `specs/<spec-id>/spec.md`    |
| Refactor rationale or rejected path  | `design.md`                  |
| Implementation strategy              | `design.md`                  |
| Scope changed                        | `proposal.md`                |
| New work or verification identified  | `tasks.md`                   |
| LikeC4 architecture intent changed   | `architecture-delta.c4`      |
| Assumption invalidated               | Relevant artifact              |
| Test needs update or deletion        | `tasks.md` + `design.md`   |

Example offers:
- "That is a design decision for `design.md`; include it in the Design Summary, then call `/skill:opsx-propose <change-name>` or the appropriate non-explore workflow."
- "This changes an Element Contract; include it in the Design Summary, then call `/skill:opsx-propose <change-name>` or the appropriate non-explore workflow."
- "This changes scope for `proposal.md`; include it in the Design Summary, then call `/skill:opsx-propose <change-name>` or the appropriate non-explore workflow."
