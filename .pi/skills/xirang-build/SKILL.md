---
name: "xirang-build"
description: "Build or rebuild the project Xirang Semantic Model as one reviewed Candidate."
license: "MIT"
compatibility: "Requires xirang CLI with candidate commands."
metadata:
  author: "xirang"
  version: "1.0"
  generatedBy: "0.2.7"
---

Build the project Xirang Semantic Model from user-authorized intent and evidence.

**Xirang Philosophy**

1. Xirang is a structured representation of human intent that an Agent can compile.
2. One Xirang Semantic Model is persisted as a single whole in the four partitions `metamodel/`, `elements/`, `relationships/`, and `views/`; a Semantic Delta uses the same four partitions and adds `operation`.
3. A change reconciles a Semantic Delta toward the target steady state. `proposal.md`, `design.md`, and `tasks.md` are compilation scaffolding, not competing sources of truth.
4. The Xirang Semantic Model is complete only when an Agent need not guess decisions that affect element hierarchy, contracts, or relationships.
5. The Agent acts like a compiler and faithfully translates authorized human intent. Existing code is current implementation evidence and MUST NOT silently override the Xirang Semantic Model.

**Business Specification Standard (4+N)**

For business-specification Elements, prepare scope/non-goals, the complete business mechanism, exceptions, and key acceptance outcomes; add Sections only for independently maintained commitments. Before exploring such a Contract or authoring/revising its Kind or Contract, read `.xirang/references/xirang-business-specification-standard.md` for applicability, canonical structure and self-checks. Generic framework or organizational Elements do not trigger this format.

**Element Definition Semantics**

- A Definition SHALL state what the Element is, why it is modeled as an independent Element, what it includes, what it excludes, and, where needed, how it differs from its parent, children, and siblings.
- A Definition MUST NOT be a rewrite of the title or a one-sentence "used for ..." summary; it expresses concept identity and scope boundary, not implementation files, symbols, call relationships, or the current approach.
- Responsibilities, guarantees, constraints, behavior, Sections, and acceptance cases belong to the Element Contract; approach and rationale belong to `design.md`; change motivation and migration history belong to `proposal.md`.

**Element Contract Semantics**

- An Element Contract SHALL express completely the responsibilities, guarantees, constraints, and behavior the host Element carries at its own abstraction level; children may further refine or jointly fulfill those commitments. A parent must independently state its complete commitments at that level without requiring readers to read child Contracts. Preserve necessary coverage across abstraction levels without copying child Contracts item by item.
- Scope states this Element's responsibilities and necessary exclusions, not every thing it does not do. Whole-Change goals and non-goals belong in `proposal.md`; implementation choices, rejected approaches, and reasons needed to understand the design belong in `design.md` (execution work belongs in `tasks.md`). For `pi-native-markdown-preview`, “自研 HTTP 预览服务” is an implementation approach exclusion: route it to `design.md`, not the Element Contract's Scope and Non-goals.
- State conditions, behavior, and results directly; remove explanations that add no meaning. For example, “系统 MUST 对提交的来源版本进行严格校验，以确保更新始终基于最新记录，避免过期操作对现有内容造成覆盖。” can be shortened to “来源版本过期时，MUST 拒绝更新，记录保持不变。”
- State each rule once at the same abstraction level. Scope does not repeat the complete pipeline; Business Logic explains the mechanism; exceptions add distinct conditions and outcomes; acceptance uses concrete inputs and results to verify the commitment. Preserve complete commitments across parent/child levels rather than removing them as duplicates.
- Reuse accurate existing wording and change only affected behavior. Do not polish unrelated passages or repackage clear user-confirmed language merely to make it sound formal. Preserve conditions, numbers, exceptions, timing, and concrete examples. Keep implementation internals and process detail out of Contracts, and name Sections for enduring verifiable commitments, not one-time gap, recovery, or migration actions.
- A Section SHALL express one independently evolvable normative commitment under a stable identity. Its boundary is whether that commitment can be added, modified, or removed on its own; do not split mechanically by sentence, clause, `SHALL` count, or target Section count. Content that only restates the Declaration definition or the union of sibling Sections without adding a normative commitment does not form a Section; independent invariants, ordering, atomicity, consistency, or completion conditions are preserved. Business-specification Contracts use the mandatory 4+N groups; related mechanism details remain inside Business Logic instead of becoming separate Sections.
- A Section body is free-form: prose, lists, tables, decision tables, formulas, pseudocode blocks, event triples, or any other carrier that expresses the item completely. Do not force a carrier, require fixed sub-headings, or treat sub-headings as identity. `### Section:` headers are the only structural unit inside `## Specification`.
- `#### Acceptance Case:` is used only inside the key-acceptance-cases Section. It is not a general structural requirement; do not demand Acceptance Cases from other Sections, and do not let Acceptance Case count determine the number of persistent tests.

**Structural Decomposition Guidance**

- Before forming or reorganizing an Element hierarchy, run `xirang config project --select decomposition --json` and read the normalized `decomposition` value from its JSON output. Do not inspect or reinterpret the raw config, and do not substitute another method.
- Read the guidance file at that resolved path in full. When it is missing or unreadable, stop hierarchy formation and ask the user once.
- Decomposition guidance selects the dimension used for hierarchy abstraction and refinement. It does not override authorized user intent, the Xirang Semantic Model, Element Contracts, Relationships, evidence authority, or the current workflow's read/write boundary.
- Keep every same sibling set on one dimension, make it MECE for the confirmed scope, and confirm breadth-first. Do not mix responsibility, lifecycle, deployment, or implementation dimensions within one sibling set.

**Semantic Model Unit Notation**

Every Markdown unit declares its own `entity` in frontmatter. The partition does not determine the type.

| entity | frontmatter fields |
|---|---|
| `element-declaration` | `identity`, `kind`, `parent`, `title`, `definition` |
| `element-kind` | `identity`, `contract`; optional `contractFormat`, `root`, `parents`, `children` |
| `relationship-kind` | `identity`; optional `sourceKinds`, `targetKinds` |
| `authored-view` | `identity`, `include`; optional `exclude`, `of`, `title`, `autoLayout` |

- `parent: null` marks the single Project Root. `include` is `'*'` or a list of element identities; `exclude` is a list of element identities whose whole descendant subtree is pruned, taking precedence over `include`; `of` is one element identity.
- A `relationships/` file is a container of `{source, kind, target}` entries. A Relationship's identity is its entire content and it carries no other field.
- An `elements/` unit body is exactly the `## Specification` section: `### Section: <name>` items, each with a free body and optionally `#### Acceptance Case: <name>` blocks inside the acceptance-cases Section. Concept identity and scope prose belongs to the Declaration's `definition` and MUST NOT be repeated in the Contract. Any other body content is a validation error.
- A `views/` unit has no body.
- `identity` uses `[A-Za-z0-9._-]+` and contains no path separator. Element Kind and Relationship Kind identities are globally unique within the Metamodel. Do not encode a parent path or hierarchy position into an identity: position changes over time while identity does not.
- Default file naming, non-normative: `elements/<identity>.md`, `metamodel/<kind identity>.md`, `views/<view identity>.md`, `relationships/<relationship kind identity>.yaml` grouped by Relationship Kind.

Before authoring, load `.xirang/references/xirang-configuration-use.md` and query the effective configuration fields needed for this Build. Reuse current guidance and configuration.

## Confirmed design inputs

MUST read `.xirang/references/xirang-design-record.md` before using or creating a design record or checking the source's record decision. Use its **Inputs and authority**, **User-facing record presentation**, **Record on confirmation**, entry writing standard, **Writing rules**, **Coverage gate**, and **Output and handoff** at the flow points below. Build uses its own instance of the shared schemaVersion 4 record: pending material is not confirmation, and only the user decides accepted/excluded or permits substantive revisions to confirmed entries and structure. Record confirmed decisions immediately and follow the shared user-facing delta report. A Build record may exist before Candidate initialization; this does not authorize Candidate writes or add a Design Summary stage. With no record, require the declared exemption or absence of normative content on `build.md`; an undeclared absence blocks promotion readiness.

## Workflow

1. Run `xirang record list --json`. For an applicable Build record, follow the shared **Inputs and authority** protocol. If source was already consumed into the active Candidate, read its `record-source.md` and `record-coverage.json` as provenance instead of attempting another consumption. Confirm that the project has been prepared with `xirang setup`, then run `xirang candidate status --json`.
2. If a Candidate is active, use `xirang candidate status --details --json` when inventory is needed and present its current baseline and status. Ask the user to choose either to continue the active Candidate or explicitly authorize discarding it and initialize a replacement. If the user chooses to continue, preserve the active Candidate and skip Candidate initialization. Build MUST NOT silently continue, discard, or replace an active Candidate.
3. Ask the user to choose the exploration scope: whole project, code and tests, documentation and current Xirang, or custom paths and rules.
4. Detect whether subagents are available in the current environment. If they are, ask the user which model the subagent should use for the work ahead; content placement and rewriting are semantic choices that need agent support, not mechanical copying.
5. Only initialize when no Candidate is active or the user explicitly authorizes replacement. Resolve the Candidate baseline before authoring any Build file, summarize the Semantic Model when it exists, ask the user to choose the starting point, then run exactly one applicable command:
   - `xirang candidate init --from current`
   - `xirang candidate init --from clean`
   - `xirang candidate init --from-path <path>`
6. After initialization succeeds or active-Candidate continuation is confirmed, write `.xirang/candidate/build.md` with the authorized scope, authority order, current requirements, and explicit exclusions. Current user requirements have highest priority.
7. Explore the authorized scope in any useful order. Code, tests, documents, configuration, Git history, and current Xirang are evidence only unless the user explicitly designates them as source of truth. Subagents MAY accelerate read-only exploration.
8. Run the conditional Modeling Decision Gate after exploration and before the first Candidate hierarchy write. Apply the Structural Decomposition Guidance before choosing or confirming a hierarchy dimension.
   - Ask only when multiple reasonable choices would change identity, hierarchy, Contract, Kind, Relationship, or Authored View semantics. Do not block on implementation details or wording preferences that cannot change the target Semantic Model.
   - Resolve decisions in dependency order: authority conflicts → Element identity and boundaries → hierarchy → Metamodel → Contracts → Relationships → Authored Views.
   - Present bounded options with trade-offs and ask one decision at a time. If no semantic choice remains, continue without asking.
   - For decisions made at this gate, append only exception provenance to `build.md`: user rulings, authority-conflict resolutions, non-obvious evidence choices, and explicit exclusions. Record each decision, evidence, and affected scope; do not create a Section provenance matrix. This limits decision logging, not the scope, source summaries, or informative notes required by other steps.
9. Author the Candidate breadth-first across the whole model: Metamodel → Element Declarations, hierarchy, and Element Definitions → Element Contracts → Relationships → Authored Views. Compile only accepted normative record content applicable to this Candidate; preserve concrete examples, numbers, exceptions, and timing under the shared Writing rules. Resolve pending decisions affecting this target before treating dependent design as settled; excluded and informative material supplies necessary context, not invented obligations.
   - Write `.xirang/candidate/{metamodel,elements,relationships,views}/` in the unit notation above. Complete and review each Definition independently before authoring its Contract; reject a Definition when its concept boundary conflicts with its parent, children, or siblings. An Element Contract is the body of its Element unit, so one Element has at most one Contract; whether a Contract is required comes from the `contract` field of its Element Kind.
   - Element Kind is a project-defined semantic label, not a hierarchy constraint: prefer the most specific existing Kind that accurately expresses the Element; when none does, add or refine a Kind through the Metamodel instead of weakening the Element's meaning. Do not default to a generic Kind merely because it validates. Any Kind may appear at any depth, and a parent's Kind does not restrict its children's Kinds. Hierarchy expresses abstraction→refinement only.
   - Check each completed layer with focused Agent inspection. Do not require full `candidate validate` for an intentionally incomplete intermediate layer.
   - If a later layer exposes an earlier defect, correct the affected layer and recheck every dependent later layer without rewriting unrelated layers.
10. When legacy documents or the formal model contain still-current behavior missing from the Candidate, recover it as authored semantic content. Deciding where each piece belongs (which Element, which hierarchy level, which Contract Section) is a semantic choice that requires model understanding: an Agent selects the placement, it is not derived by file name, heading match, or programmatic mapping. Copying content verbatim MAY be done directly; any rewriting or migration (including vocabulary migration: `spec` → `contract`, `architecture-delta.c4` → four-partition Semantic Delta, `.opsx` → `.xirang`) MUST go through a subagent when one is available, using the model the user selected when subagents were confirmed. Keep already-covered content, never resurrect retired behavior (for example: architecture-delta.c4 persistence, Spec store/registry/frontmatter, `xirang change/spec/diff` command groups, archive-time sync or `--no-sync`, impact-sweeper, scenario operation-label acceptance), and record which sources were covered, added, and retired in `build.md`.
11. After all five layers exist, reload the complete latest record under **Inputs and authority**, reconcile conflicts, and apply the shared **Coverage gate** to current record → complete Candidate. Classify nature, decision, and applicability; resolve target-affecting pending issues and justify non-applicability or no effect. Excluded and informative material belongs in `build.md` or provenance, not invented Contract obligations. Coverage must pass before source handoff.
    - Run `xirang candidate validate --json`. Fix every ERROR in Candidate source and repeat deterministic validation until it succeeds. The CLI is read-only and must not author or normalize semantics.
    - When an active Build record exists and validation passes, use `result: covered` with atomic details, exact Candidate locations, and excerpts copied from current Candidate files for each applicable accepted normative entry; `result: not-applicable` with a reason for accepted normative content outside this target; and `result: pending` with `affectsTarget` for every pending entry (true blocks, false requires a reason). Excluded and non-pending informative entries need no target locations. Run `xirang record coverage <filename> --candidate --from <file> --json`. On rejection, resolve missing decisions, correct classifications, or write missing details into the Candidate, then revalidate and recheck. Any source or Candidate change invalidates coverage and requires a new check.
    - After coverage is recorded, reload the complete record when needed, then run `xirang record consume <filename> --candidate --json`. It also compares the record's `structure` with the Candidate field by field. Follow the shared **Output and handoff** success and failure checks; any failure blocks promotion readiness.
    - Run `xirang candidate validate --details --json` again after handoff. Retain the actual Formal comparison and diff, or the explicit unavailable reason, for independent review and final presentation. Do not reuse a pre-handoff digest. The final `reviewDigest` includes `record-source.md` and `record-coverage.json`; review and user confirmation must use this final version. With no record, skip consumption, not validation or independent review, and confirm the declared record decision on `build.md` before promotion readiness.
12. After deterministic validation succeeds, delegate one complete semantic review to a generic read-only subagent with a clean context.
    - Provide the absolute project root, Candidate root, `build.md`, any `record-source.md` and `record-coverage.json`, current `reviewDigest`, authorized scope, authority order, recorded user rulings, validation result, review checklist, and output contract.
    - Require the subagent to independently read build.md, all four Candidate partitions, any record-source.md and record-coverage.json, authority sources, and necessary project evidence. Main-Agent completion claims are not evidence.
    - Review authorization coverage, unauthorized durable semantics, hierarchy, Kinds, Definitions, Definition boundaries against parent/children/siblings, Contracts, Section boundaries, Acceptance Case confinement, Relationships, Authored Views, cross-level overlap, and exception provenance. When a record source exists, additionally require the subagent to independently recheck accepted normative content applicable to this Candidate, the reasons for non-applicability, and every pending entry's effect on the target. Do not force excluded or informative content into obligations. Independently of the recorded coverage result, report any accepted detail marked as placed that has no corresponding Candidate semantics, any unresolved pending decision affecting the target, and any Candidate obligation based only on an unconfirmed suggestion or unsupported claim. Check that the selected decomposition guidance is applied consistently and that the same sibling set does not mix responsibility, lifecycle, deployment, or implementation dimensions. Check that recovered legacy/formal content matches current behavior and does not resurrect retired vocabulary or recorded exclusions. Any Candidate modification invalidates the review.
    - Require one structured result with this exact contract:

```json
{
  "result": "PASS | FAIL",
  "findings": [
    {
      "severity": "BLOCKER | HIGH",
      "identity": "element-or-entry-identity",
      "issue": "problem",
      "authorityEvidence": ["path:line"],
      "correction": "required correction"
    }
  ],
  "coverage": {
    "metamodel": true,
    "elements": true,
    "relationships": true,
    "views": true,
    "build": true,
    "authority": true
  }
}
```

    - Only `BLOCKER` and `HIGH` findings fail the gate. Correct a finding or return to the Modeling Decision Gate as appropriate.
    - Any Candidate modification invalidates the review. Rerun `xirang candidate validate --details --json` to refresh the comparison and digest, and delegate another new clean-context subagent; never resume or reuse the previous review context.
    - If a clean-context subagent is unavailable, fail closed. Do not substitute author self-review or use `xirang-reviewer`.
13. Present the Project Root, Metamodel, hierarchy, Element Definitions, Element Contracts, Relationships, Authored Views, important confirmed decisions, Formal comparison, semantic-review result, and returned `reviewDigest` directly to the user.
14. Before promotion, re-run `xirang candidate validate --json` and present the fresh digest. Only after the user confirms that exact version, run `xirang candidate promote --digest <reviewDigest>`. Promotion replaces `.xirang/model/` with the Candidate as a whole; a unit absent from the Candidate is not retained. If the digest changed since the last review, refresh and present the comparison with `xirang candidate validate --details --json` before seeking confirmation of the new version. For a changed digest: a change made by the user is user approval of the current content and MAY be promoted directly after re-validation only when no record source or its coverage is affected; a change made by the Agent invalidates the review, so re-run validation and delegate a new clean-context review before asking again. Any source or target revision invalidates affected coverage; recheck it and repeat final validation, independent review, and digest confirmation before promotion. User involvement during the build normally means rework: treat multiple review rounds and re-validation as the expected flow, not a failure.
15. After promotion succeeds, verify these postconditions in order:
    - Run `xirang candidate status --json` and require `active === false`.
    - Verify `.xirang/model/metamodel`, `.xirang/model/elements`, `.xirang/model/relationships`, and `.xirang/model/views` are real directories, even when a partition is empty.
    - Run `xirang arch validate --json` and require success. Report warnings without failing the postcondition.
    - Report Build complete only after all checks pass. On failure, report whether promotion succeeded, the failed condition, and current Formal/Candidate state; MUST NOT retry promotion automatically.

## Guardrails

- The Candidate is one complete Semantic Model, authored and reviewed as a whole.
- `build.md` is temporary compilation scaffolding, not durable semantic source. The exact `record-source.md` and `record-coverage.json` are retained in Build history, never promoted into formal partitions.
- The breadth-first authoring order does not impose a fixed evidence scan order.
- Do not infer hierarchy, behavior, or relationships from paths, imports, calls, passing tests, or implementation existence alone.
- Do not modify formal `.xirang/model/` before digest-confirmed promotion.
- Build and promotion provide no guarantee that Git status or index remain unchanged.
- Preserve canonical identities, paths, commands, and schema keys.
