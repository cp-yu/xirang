# Business Specification Standard

**Business Specification Standard (3+N)**

Every Element Contract SHALL give each class of normative detail its own container, so detail captured during exploration is not lost when it becomes a Section or a Task.

- **Resident base items, always required**: ① business goal — carried by the Declaration `definition`; ② scope and non-goals — its own Section naming what this Element does not do; ③ business mechanics — its own Section expressing the logic derivation.
- **`+N` items, mounted explicitly when the business carries the characteristic**: state and lifecycle, concurrency and mutual exclusion, triggers and timing, external contracts and fallback, key acceptance cases, plus any item the project's own characteristics call for. Never leave these implicit in natural language.
- **Safeguards and edge cases**: a table (or equivalent) enumerating extremes and empties, resource exhaustion, and security defence, kept out of the main flow.
- **Key acceptance cases**: a dedicated Section using `#### Acceptance Case:`; one positive flow, plus a boundary flow and a conflict flow when applicable. Not one case per detail, and never demanded of other Sections.
- **Carriers are free**: pseudocode, decision tables, formulas, and event triples are hints, not an enumeration. Any carrier that expresses the item completely is acceptable.
- **Container to task mapping**: each mounted `+N` item, each safeguards row, and each acceptance case SHOULD become an independently verifiable task or Check unit, so a missing container surfaces when tasks are written rather than later at model alignment.
- **Check anchors**: a Check points at its target semantics with a change-local Element unit path plus a Section anchor, appending an Acceptance Case anchor only when it verifies a key acceptance case. A free-form description is not an anchor.
- Read `.xirang/references/xirang-business-specification-standard.md` (project-root file) for the complete standard and its self-check list.

## Element Contract shape

```text
## Specification                      <- Element Contract body
### Section: <top-level item>         <- stable identity: <element>#<title>
    free body: any carrier, any sub-headings
```

- A Section is one independently evolvable normative commitment and is the unit a Semantic Delta addresses.
- A Section body is free: prose, lists, tables, decision tables, formulas with input/output dependency tables, pseudocode blocks, event triples, state machines, sequence diagrams, matrices, or structured data. Do not force a carrier and do not require a fixed sub-heading structure.
- Sub-headings inside a Section are organizational only; they carry no identity and are never addressed by a delta.
- `#### Acceptance Case:` appears only inside the key-acceptance-cases Section.

## Resident base items

**Business goal** — the Declaration `definition`. State in one or two sentences the core business problem and who uses it.

**Scope and non-goals** — its own Section. List at least one or two things this Element explicitly does **not** do. This stops requirement creep and responsibility shifting.

**Business mechanics** — its own Section. Express the derivation itself. Carrier hints, none of them mandatory:

| Characteristic | Suggested carrier |
|---|---|
| Procedural, cross-system, strict ordering | Structured pseudocode: neutral verbs, consistent indentation, `if/else` phrasing; no pointers, no loop indices, no language-level types |
| Rule-based, multi-dimensional crossed conditions | Decision table; avoid nested `if/else` |
| Computed/derived (amounts, points, tiered pricing) | Formula plus input/output dependency table; never a loop-accumulation description |
| Event-driven | `on [event] -> check [precondition] -> trigger [action]` |

**Safeguards and edge cases** — its own Section, structured as a table or equivalent:
- Extremes and empties: zero, negative, over-long strings, null, whitespace-only input.
- Resource exhaustion: missing map entry, cache stampede.
- Security defence: hostile traversal, sensitive-character injection.

## `+N` items

Mount an item explicitly when the business carries the characteristic. The list is a starting point, not a closed set.

**State and lifecycle** — for long-lived documents or entities that transition state. Declare the entities and identifiers, give the transition chain or table, and name terminal states explicitly.

**Concurrency and mutual exclusion** — for bidding, funds, inventory, or debouncing. Answer four questions: contention target (resource granularity), mutual-exclusion mechanism (isolation strategy), conflict policy (fail fast, queue, or idempotent pass-through), safe release (lock/TTL timeout and deadlock fallback).

**Triggers and timing** — for delay, polling, or message listening. State whether the driver is a synchronous call, a delayed message, or a scheduled sweep, and give the timing tolerance.

**External contracts and fallback** — for a hard dependency on an unreliable external service. State the data-consistency assumption and the degradation contract: does an upstream timeout block the business, or pass through a default?

**Key acceptance cases** — for delivery acceptance or cross-team alignment. Use `#### Acceptance Case:` inside this Section: one standard positive flow, plus a boundary flow and a conflict flow when applicable. Enough to hand to a test team; never one case per detail.

## Self-check

1. **Non-goals explicit?** Does it state what this logic does not do?
2. **Carrier free of syntax noise?** No language-level types, map APIs, or parse calls in the mechanism expression.
3. **Branch overload resolved?** More than three crossed conditions handled by a decision table rather than nested conditionals?
4. **Concurrency transparent?** For assets or shared counters, are the contention target and conflict policy stated?
5. **Exceptions separated?** Are extremes and errors in their own Section rather than mixed into the main flow?
6. **Applicable `+N` mounted?** Does each applicable engineering characteristic have its own Section rather than being left implicit?