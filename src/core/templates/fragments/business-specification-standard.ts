/**
 * Fragment: Business Specification Standard (full reference)
 * Used in: build, explore, propose, apply-change
 *
 * Root guidance is inlined into each SKILL.md by
 * `BUSINESS_SPECIFICATION_STANDARD_ROOT`; this file carries the complete
 * container list, carrier hints, and self-check list, and is materialized to
 * `.xirang/references/xirang-business-specification-standard.md`.
 */
import { BUSINESS_SPECIFICATION_STANDARD_ROOT } from './business-specification-standard-root.js';

export const BUSINESS_SPECIFICATION_STANDARD_REFERENCE = `
# Business Specification Standard

${BUSINESS_SPECIFICATION_STANDARD_ROOT}

## Element Contract shape

\`\`\`text
## Specification                      <- Element Contract body
### Section: <top-level item>         <- stable identity: <element>#<title>
    free body: any carrier, any sub-headings
\`\`\`

- A Section is one independently evolvable normative commitment and is the unit a Semantic Delta addresses.
- A Section body is free: prose, lists, tables, decision tables, formulas with input/output dependency tables, pseudocode blocks, event triples, state machines, sequence diagrams, matrices, or structured data. Do not force a carrier and do not require a fixed sub-heading structure.
- Sub-headings inside a Section are organizational only; they carry no identity and are never addressed by a delta.
- \`#### Acceptance Case:\` appears only inside the key-acceptance-cases Section.

## Resident base items

**Business goal** — the Declaration \`definition\`. State in one or two sentences the core business problem and who uses it.

**Scope and non-goals** — its own Section. List at least one or two things this Element explicitly does **not** do. This stops requirement creep and responsibility shifting.

**Business mechanics** — its own Section. Express the derivation itself. Carrier hints, none of them mandatory:

| Characteristic | Suggested carrier |
|---|---|
| Procedural, cross-system, strict ordering | Structured pseudocode: neutral verbs, consistent indentation, \`if/else\` phrasing; no pointers, no loop indices, no language-level types |
| Rule-based, multi-dimensional crossed conditions | Decision table; avoid nested \`if/else\` |
| Computed/derived (amounts, points, tiered pricing) | Formula plus input/output dependency table; never a loop-accumulation description |
| Event-driven | \`on [event] -> check [precondition] -> trigger [action]\` |

**Safeguards and edge cases** — its own Section, structured as a table or equivalent:
- Extremes and empties: zero, negative, over-long strings, null, whitespace-only input.
- Resource exhaustion: missing map entry, cache stampede.
- Security defence: hostile traversal, sensitive-character injection.

## \`+N\` items

Mount an item explicitly when the business carries the characteristic. The list is a starting point, not a closed set.

**State and lifecycle** — for long-lived documents or entities that transition state. Declare the entities and identifiers, give the transition chain or table, and name terminal states explicitly.

**Concurrency and mutual exclusion** — for bidding, funds, inventory, or debouncing. Answer four questions: contention target (resource granularity), mutual-exclusion mechanism (isolation strategy), conflict policy (fail fast, queue, or idempotent pass-through), safe release (lock/TTL timeout and deadlock fallback).

**Triggers and timing** — for delay, polling, or message listening. State whether the driver is a synchronous call, a delayed message, or a scheduled sweep, and give the timing tolerance.

**External contracts and fallback** — for a hard dependency on an unreliable external service. State the data-consistency assumption and the degradation contract: does an upstream timeout block the business, or pass through a default?

**Key acceptance cases** — for delivery acceptance or cross-team alignment. Use \`#### Acceptance Case:\` inside this Section: one standard positive flow, plus a boundary flow and a conflict flow when applicable. Enough to hand to a test team; never one case per detail.

## Self-check

1. **Non-goals explicit?** Does it state what this logic does not do?
2. **Carrier free of syntax noise?** No language-level types, map APIs, or parse calls in the mechanism expression.
3. **Branch overload resolved?** More than three crossed conditions handled by a decision table rather than nested conditionals?
4. **Concurrency transparent?** For assets or shared counters, are the contention target and conflict policy stated?
5. **Exceptions separated?** Are extremes and errors in their own Section rather than mixed into the main flow?
6. **Applicable \`+N\` mounted?** Does each applicable engineering characteristic have its own Section rather than being left implicit?
`.trim();
