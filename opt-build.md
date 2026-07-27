# Build Optimization Decisions

## Confirmed

### Candidate initialization order

Build SHALL determine the Candidate baseline and run `xirang candidate init` before writing `.xirang/candidate/build.md`.

The workflow order is:

1. Confirm Xirang setup and inspect Candidate state.
2. Confirm the exploration scope and evidence authority.
3. When a formal model exists, present the available baselines and obtain the user's selection.
4. Run `xirang candidate init` with the selected baseline.
5. Record the authorized scope, authority order, and current requirements in `build.md`.

When an active Candidate already exists, Build SHALL present its baseline, inventory, and status, then require the user to choose either to continue it or explicitly authorize discarding and reinitializing it. Build SHALL NOT silently resume or replace an active Candidate.

### Git behavior

Build SHALL NOT promise that Candidate promotion leaves Git status or the Git index unchanged. Build documentation SHALL omit that guarantee; generated Model and History artifacts are allowed to appear in Git state.

### Element Contract definition

A future Change SHALL merge the existing definition with the following semantics:

> Element Contract 定义 Element 在一个确定模型状态中、其自身抽象层级上的完整规范性语义。它以该模型状态自身为视角，描述 Element 承担的职责、提供的保证、遵循的约束与表现的行为，只包含在该状态下成立的语义，不包含相对于其他模型状态的新增、修改、删除等变更叙述。Element Contract 可以表达由 children 进一步精化或共同实现的职责、保证、约束与行为；这种跨层语义覆盖是允许的。

The existing removal semantics and cardinality remain unchanged:

- When semantics are removed, the resulting Contract omits them instead of narrating their removal.
- One Element has at most one Element Contract.
- The Element Kind contract policy determines whether a Contract is required.

Completeness is evaluated at the Element's own abstraction level: users and Agents SHALL be able to understand and judge that Element's normative commitments without reading its children Contracts. Children Contracts further refine how those commitments are fulfilled; they do not supply semantics omitted from the parent at the parent's abstraction level.

The future Change SHALL update the corresponding `.xirang/model` Elements. It SHALL NOT introduce relative-to-children delta semantics, prohibit parent Elements from describing behavior refined by children, or define Requirement rename semantics.

### Requirement definition

`xirang-definition.md` defines Requirement as:

> Requirement 是 Element Contract 中具有稳定 identity 的规范性语义条目，用于表达宿主 Element 在自身抽象层级上的一项可独立演进的职责、保证、约束或行为。可独立演进，是指该项语义能够独立新增、修改或移除，而不要求同一 Contract 中其他 Requirements 同时发生语义变化。

A future Change SHALL add the corresponding Requirement Element under Element Contract in `.xirang/model/` and align the existing Element Contract and Semantic Delta Entry Contracts with this definition. Requirement rename semantics remain out of scope.

### Scenario definition

`xirang-definition.md` defines Scenario as:

> Scenario 是 Requirement 的规范性组成，用于表达该 Requirement 在特定条件下应表现的行为。Scenario 只能具体化宿主 Requirement 已定义的规范承诺，不得引入可独立演进的职责、保证、约束或行为。每个 Scenario 都具有规范约束力，但一个 Requirement 下的 Scenarios 不默认穷尽该 Requirement 的全部适用情况；未单独列出的情况仍由 Requirement 的一般规范语义约束。Scenario 从属于 Requirement，不作为独立 Semantic Delta Entry。

A future Change SHALL add the corresponding Scenario Element under Requirement in `.xirang/model/` and align the existing Element Contract, Semantic Delta Entry, and semantic-difference Contracts with this definition.

### Shared Element Contract semantics fragment

A future Change SHALL define the generated-prompt projection once in `src/core/templates/fragments/xirang-fragments.ts`:

```markdown
**Element Contract Semantics**

- An Element Contract defines the complete normative semantics of an Element at its own abstraction level in a specific model state. It may express responsibilities, guarantees, constraints, and behaviors that children further refine or jointly realize; semantic overlap across these abstraction levels is allowed.
- A Requirement is a normative semantic entry with stable identity. It expresses one independently evolvable responsibility, guarantee, constraint, or behavior of its host Element. Independently evolvable means that the semantics can be added, modified, or removed without requiring semantic changes to other Requirements in the same Contract.
- A Scenario is a normative constituent of a Requirement that expresses its behavior under a specific condition. It may only concretize the host Requirement and must not introduce an independently evolvable responsibility, guarantee, constraint, or behavior. Every Scenario is binding, but the Scenarios of a Requirement are not exhaustive by default. A Scenario is not an independent Semantic Delta Entry.
```

The fragment SHALL be exported as `ELEMENT_CONTRACT_SEMANTICS` and consumed by `xirang-build`, `xirang-propose`, and `xirang-snack`. It SHALL NOT be injected into `xirang-reviewer`. `SEMANTIC_MODEL_UNIT_NOTATION` remains responsible only for storage notation.

Tests SHALL prove that the three workflow templates consume the shared fragment and do not maintain separate Requirement or Scenario definitions.

### Build Contract authoring

`xirang-build` SHALL apply these authoring rules:

- Use separate Requirements when responsibilities, guarantees, constraints, or behaviors can be added, modified, or removed independently.
- Keep an action together with its inseparable conditions, results, and guarantees in one Requirement.
- Do not split by sentence count, clause count, or the number of `SHALL` statements.
- Do not require a minimum or target number of Requirements per Contract.
- Within one Contract, do not add a Requirement that only paraphrases the Declaration summary or the union of sibling Requirements without adding an independent normative commitment.
- Preserve whole-level Requirements that add an independently evolvable invariant, ordering constraint, atomicity guarantee, consistency rule, or completion condition.
- Allow parent and child Elements to express overlapping semantics at their respective abstraction levels.
- Use Scenarios only to concretize their host Requirement. Scenarios are binding but need not enumerate behavior already established by the Requirement or shared understanding.

The existing fixed Contract-granularity guardrail SHALL be replaced with:

> Do not impose fixed or numeric Requirement granularity; determine boundaries by independent semantic evolution.

After authoring the initial Candidate, Build SHALL review every Contract against these rules. This is an Agent semantic judgment and SHALL NOT be delegated to the deterministic Validator.

### Realization dimensions and responsibility relationships

`xirang-definition.md` defines the progression process and collaboration structure as complete, related description dimensions. Activity or Stage Elements describe work entry, progression, constraints, and results. Participant or Agent work-identity Elements describe authorization, responsibility, judgment, operation, coordination, and delivery. Semantic overlap across these dimensions is allowed; neither dimension is a delta of the other.

`responsible-for` connects a Participant or work identity to an Activity or Stage for which it carries responsibility. It does not imply exclusive or sole execution and does not transfer responsibilities held by the user, CLI, or other Participants.

Build SHALL apply these modeling rules:

- Do not require every Activity to have a corresponding Agent Role.
- Create a Role Element only when the authorized intent defines a distinct work identity.
- Allow one Role to carry responsibility for multiple Activities and one Activity to involve multiple Participants.
- When a Role and its Activity are both modeled, connect them explicitly with `responsible-for` rather than inferring the mapping from similar titles or identities.
- Allow Activity and Role Contracts to express overlapping semantics at their respective dimensions.
- Do not rewrite either dimension as a delta of the other merely to remove wording overlap.
- When one side changes, review the related Element for consistency without requiring both Elements to change.

The deterministic Validator SHALL validate only that the Relationship Kind and endpoints exist. It SHALL NOT decide whether a responsibility assignment is semantically correct.

A future Change SHALL add the `responsible-for` Relationship Kind and these Relationships to `.xirang/model/`:

```text
project-build-role responsible-for semantic-model-build
explore-role       responsible-for explore
propose-role       responsible-for propose
snack-role         responsible-for snack
apply-role         responsible-for apply
archive-role       responsible-for change-closure
reviewer           responsible-for review
optimizer          responsible-for optimization
```

The future Change SHALL align the corresponding Realization, Activity, Participant, Agent-role, and Internal-Agent Contracts without turning either dimension into a delta of the other.

### Conditional Modeling Decision Gate

Build SHALL run a conditional Modeling Decision Gate after exploring the authorized scope and before first authoring the Candidate:

```text
confirm scope and authority
→ select baseline and initialize Candidate
→ write build.md
→ explore authorized evidence
→ Modeling Decision Gate
→ author Candidate in layers
→ validate and semantic review
→ exact digest confirmation
→ promote
```

The gate SHALL stop Candidate authoring only when at least two semantically different target models remain compatible with the available authority and choosing between them would change any of the following:

- Element existence, stable identity, or boundary
- Element hierarchy
- Element Kind or contract policy
- Element Contract responsibilities, guarantees, constraints, or behavior
- Requirement boundary or target semantics
- Relationship Kind or Relationship
- Authored View
- shared Metamodel semantics
- target behavior selected from conflicting authority

Differences limited to wording, file names, scan order, or implementation method SHALL NOT trigger this gate.

Build SHALL classify each modeling question as one of:

1. The authorized source uniquely determines the model: compile without asking.
2. Implementation evidence proves only current state: do not promote it to user intent; ask only when inclusion would change target semantics.
3. Authorities conflict or multiple target models remain valid: present two or three bounded options, their semantic impact, and a recommendation, then ask one question at a time.

Resolve questions in dependency order:

```text
authority conflicts
→ Element identities and boundaries
→ hierarchy
→ Metamodel
→ Element Contracts and Requirements
→ Relationships
→ Authored Views
```

The gate passes only when no unresolved choice can change the target Semantic Model, every modeling decision is traceable to current user requirements, authorized authority, or an explicit user ruling, and the Agent no longer needs to guess identities, hierarchy, Contracts, Relationships, or Views. A newly discovered semantic ambiguity SHALL stop the affected authoring work and return Build to this gate.

User rulings from the gate SHALL be appended in concise natural language to the temporary `.xirang/candidate/build.md`. Build SHALL NOT create a separate modeling-decision artifact.

The Modeling Decision Gate confirms that compilation inputs are determinate. It SHALL NOT replace Candidate semantic review, deterministic validation, or exact-digest promotion authorization.

### Exception-only provenance

Build SHALL use exception-only provenance to preserve why non-obvious Candidate semantics are authorized without creating a second semantic model.

`.xirang/candidate/build.md` SHALL record the global authority sources and their priority once. Requirements and other model entries that follow directly and unambiguously from those sources SHALL NOT require per-entry source records.

Build SHALL record concise provenance only for exceptions:

- explicit user rulings made during the Modeling Decision Gate
- resolutions of conflicting authority, including the selected basis
- modeling choices derived from non-obvious evidence
- implementation facts explicitly excluded from durable semantics

Each exception record SHALL identify the decision, its authority or reason, and the affected model scope. It SHALL NOT duplicate Requirement bodies or become a competing semantic source.

Candidate semantic review MAY request provenance for a questionable model entry. An entry that cannot be traced to the global authority, an exception record, or a current user ruling SHALL be treated as an unresolved authorization gap rather than inferred from implementation evidence.

### Deterministic Semantic Model validation gates

A future Change SHALL extend `validateSemanticModel` and its parser diagnostics with the following deterministic gates.

These conditions SHALL produce `ERROR` and make Candidate or Formal validation fail:

- duplicate Requirement names within one Element Contract (`DUPLICATE_REQUIREMENT_NAME`)
- duplicate Scenario names within one Requirement (`DUPLICATE_SCENARIO_NAME`)
- a Requirement without at least one Scenario (`MISSING_REQUIREMENT_SCENARIO`)
- an Element Declaration whose `kind` does not identify a declared Element Kind (`UNDECLARED_ELEMENT_KIND`)
- a Relationship whose `kind` does not identify a declared Relationship Kind (`UNDECLARED_RELATIONSHIP_KIND`)
- a Kind constraint field that references an undeclared Kind (`UNRESOLVED_KIND_REFERENCE`), covering Element Kind `parents` and `children` plus Relationship Kind `sourceKinds` and `targetKinds`
- an Authored View whose `of` or list-form `include` references an undeclared Element (`UNRESOLVED_VIEW_REFERENCE`); `include: '*'` requires no reference expansion check

Kind reference closure means that every referenced identity exists. It SHALL NOT require `parents` and `children` lists to be mechanically symmetric; they may independently constrain allowed parent and child kinds.

An entity declared in a non-default partition SHALL continue to be parsed according to its explicit `entity`, but SHALL produce `WARNING` code `ENTITY_PARTITION_MISMATCH`. This warning SHALL NOT invalidate the model, withhold a Candidate digest, or block promotion.

The current `ModelIndex.organizationWarnings()` detection SHALL be projected into parser `diagnostics` so `candidate validate`, `arch validate`, and Change compilation receive the same warning. Tests SHALL cover the parser, Semantic Model validator, Candidate validation, Formal architecture validation, and warning/error severity behavior.

### Clean-context Candidate semantic review

After deterministic Candidate validation succeeds, Build SHALL delegate one complete semantic review to a generic read-only subagent with a clean context. It SHALL NOT require a named Xirang subagent, add an Internal Agent Element, or reuse the Change Implementation `xirang-reviewer`.

The delegation SHALL provide review entry information rather than the main Agent's conclusions:

- `projectRoot`
- `candidateRoot`
- `.xirang/candidate/build.md` path
- current Candidate `reviewDigest`
- authorized exploration scope
- authority sources and priority
- user rulings captured in `build.md`
- the semantic review checklist and output contract

The subagent SHALL independently read `build.md`, every file in all four Candidate partitions, the declared authority sources, necessary project evidence, and the `candidate validate --json` result. Main-Agent completion claims are not evidence.

The review SHALL cover:

- complete coverage of the authorized scope
- absence of unauthorized durable semantics
- faithful hierarchy, Kinds, Contracts, Relationships, and Authored Views
- Contract completeness at each Element's own abstraction level
- Requirement independent-evolution boundaries
- Scenario confinement to its host Requirement
- legitimate semantic overlap across parent/child levels and Realization dimensions
- sufficient exception provenance
- authorization gaps that require returning to the Modeling Decision Gate

The subagent SHALL return one structured result:

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

Only `BLOCKER` and `HIGH` findings SHALL fail this gate. Wording preferences and non-blocking style opinions SHALL NOT enter the correction loop.

The review loop is:

```text
candidate validate PASS
→ start a new clean-context read-only subagent
→ semantic review FAIL
→ correct Candidate or return to Modeling Decision Gate
→ candidate validate PASS
→ start another new clean-context read-only subagent
→ semantic review PASS
→ present the Candidate and digest to the user
```

Any Candidate modification invalidates the previous semantic-review result. Build SHALL NOT resume or reuse that subagent context for the replacement review.

If the current tool cannot provide a clean-context subagent, Build SHALL fail closed and report the missing review capability. It SHALL NOT fall back to self-review by the authoring Agent.

This semantic review evaluates whether a structurally valid Candidate faithfully compiles authorized intent. It complements and SHALL NOT replace deterministic Candidate validation, promotion digest checks, post-write validation, or Change Implementation Review.

### Explicit Formal comparison availability

Candidate initialization provenance and Formal comparison availability are distinct concepts:

- `candidate.yaml.baseline` records whether Candidate authoring began from `clean`, `current`, or `path`.
- Formal comparison availability records whether a current Formal Semantic Model exists for computing the promotion diff.

A clean Candidate initialization SHALL NOT by itself make the diff unavailable. When a valid Formal Model exists, Candidate validation SHALL compute the semantic diff from the current Formal Model to the Candidate regardless of Candidate initialization source.

When no Formal Model exists, Candidate validation SHALL return:

```json
{
  "valid": true,
  "comparison": {
    "baseline": "absent",
    "diff": "unavailable",
    "reason": "formal-model-absent"
  },
  "reviewDigest": "..."
}
```

It SHALL NOT return an invalid empty `ChangeDiff`, and SHALL NOT compare the Candidate to an invented empty Formal Model.

When a valid Formal Model exists, Candidate validation SHALL return:

```json
{
  "valid": true,
  "comparison": {
    "baseline": "formal",
    "diff": "available",
    "formalFingerprint": "..."
  },
  "diff": {
    "schemaVersion": "1",
    "change": "candidate",
    "valid": true,
    "summary": {
      "total": 0,
      "ADDED": 0,
      "MODIFIED": 0,
      "REMOVED": 0
    },
    "entries": []
  },
  "reviewDigest": "..."
}
```

The actual summary and entries SHALL describe the semantic change that promotion would apply to the current Formal Model.

Text output SHALL state either:

```text
Formal comparison baseline: absent
Formal diff: unavailable (formal model absent)
```

or:

```text
Formal comparison baseline: available
Formal diff entries: <count>
```

Diff unavailability SHALL NOT invalidate an otherwise valid Candidate, withhold its review digest, or prevent creation of the first Formal Model. The review digest SHALL remain a function of Candidate review content and SHALL NOT include comparison availability.

`CandidateValidationResult.diff` SHALL become conditional on `comparison.diff === "available"`. CLI formatting, JSON contracts, Build presentation, Candidate validation tests, and promotion tests SHALL be updated accordingly.

### Breadth-first Candidate authoring

After the Modeling Decision Gate passes, Build SHALL author the Candidate in breadth-first semantic layers:

```text
1. Metamodel
2. Element Declarations and hierarchy
3. Element Contracts
4. Relationships
5. Authored Views
6. complete Candidate validation
7. clean-context Candidate semantic review
```

Layer responsibilities are:

1. **Metamodel**: define only authorized Element Kinds, Relationship Kinds, shared semantics, and contract policies.
2. **Element Declarations and hierarchy**: define the Project Root and each Element's stable identity, kind, parent, title, and summary without mixing in Requirement authoring.
3. **Element Contracts**: express complete semantics at each Element's own abstraction level and apply Requirement independent-evolution plus Scenario confinement and non-exhaustiveness rules.
4. **Relationships**: persist only authorized cross-Element semantics, with explicit source, kind, target, and direction; never infer a relationship only from similar names.
5. **Authored Views**: persist only Views explicitly authorized by the user; never persist Derived Views.

Build SHALL perform an Agent check focused on each completed layer. It SHALL NOT require full `candidate validate` on intentionally incomplete intermediate states, because later required layers may not exist yet. Full deterministic validation begins only after all five model layers are present.

If a later layer exposes an earlier-layer defect, Build SHALL return to the affected layer and recheck its dependent later layers without rewriting unrelated layers. Identity changes require rechecking hierarchy, Relationships, and Views; a Requirement-body-only change does not require rewriting the Metamodel.

This breadth-first rule controls Candidate compilation order, not evidence exploration order. The existing freedom to inspect authorized code, tests, documents, configuration, Git history, and model evidence in any useful order remains unchanged.

Build SHALL NOT author one Element vertically through Declaration, Contract, and Relationships before establishing the same semantic layer across the model; doing so makes hierarchy, Metamodel vocabulary, Relationship endpoints, and peer Requirement boundaries unstable.

### Mandatory post-promotion checks

After `xirang candidate promote --digest <confirmed-reviewDigest>` succeeds, Build SHALL run these checks in order:

```text
candidate status --json: active === false
→ .xirang/model/{metamodel,elements,relationships,views}/ are real directories
→ xirang arch validate --json: success === true
→ report promotion complete
```

Candidate inactivity is the observable lifecycle postcondition of completing Build. All four Formal Model partition directories are required even when a partition, such as `views/`, is empty. Explicit Formal validation provides reproducible post-promotion evidence and exposes warnings in addition to the transactional post-write error check already performed by promotion.

Build SHALL report `arch validate` warnings without treating them as failure. It SHALL report promotion complete only when all three postconditions hold.

If a postcondition fails, Build SHALL state whether the promotion command succeeded, identify the failed postcondition, and report the current Formal and Candidate state. It SHALL NOT automatically rerun promotion.

These checks SHALL NOT add Git cleanup or Git-state guarantees, history checks, file-count checks, or a second digest calculation.
