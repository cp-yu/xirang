# Business Specification Standard

## Applicability and notation

The Metamodel declares applicability on an Element Kind, not on a filename, title or inferred business vocabulary. Business-specification Elements MUST use a Kind declaring both `contract: required` and `contractFormat: business-specification`; declare an appropriate Kind when needed, never omit the format to bypass validation. For example:

```yaml
entity: element-kind
identity: business
contract: required
contractFormat: business-specification
```

Every instance of this Kind requires the 4+N Contract. Generic concepts (such as Section, Metamodel or View definitions) and organizational Elements need not use this format. If a Kind mixes business specifications and generic concepts, separate their Kinds instead of forcing business structure onto all instances.

```text
## Specification
### Section: Scope and Non-goals
### Section: Business Logic
### Section: Edge Cases and Exception Handling
### Section: Key Acceptance Cases
#### Acceptance Case: <name>
### Section: <optional independently maintained commitment>
```

All four base Section titles in the outline are canonical English tokens regardless of proseLanguage. This outline needs real content. Each mandatory Section needs its own non-empty body. In Key Acceptance Cases, retain or write a brief statement of the commitments being verified before the first `#### Acceptance Case:` header; case bodies do not count as the Section's own body. After shortening a Contract, check that this text remains as well as the case bodies, without adding new commitments or repeating the full rules. CLI rejects missing, duplicate or empty mandatory Sections, a missing/empty Acceptance Case, and Acceptance Cases outside Key Acceptance Cases. It does not decide whether the business rules or acceptance outcomes are correct. Change units use ADDED/MODIFIED/REMOVED Sections as usual; only the complete Expected Semantic Model must contain all four base Sections.

## Four base Sections

**Scope and Non-goals** — state this Element's responsibilities and only the exclusions needed to clarify that boundary, without adding unconfirmed restrictions or listing everything it does not do. Whole-Change goals and non-goals belong in proposal.md; implementation choices and rejected approaches belong in design.md. Do not repeat the complete pipeline here. Declaration definition still gives the complete concept definition and business purpose; do not duplicate it as a fifth base Section.

**Business Logic** — express the complete related mechanism at this Element's abstraction level and centralize its rules here instead of repeating them elsewhere at the same level. Request validation, deduction, concurrent safety and timeout return can form one mechanism. Use internal sub-headings and diagrams to explain their relationships; sub-headings have no identity and are not delta targets. Pseudocode, decision tables, formulas and event triples are examples, not an exhaustive or mandatory list of carriers. Implementation choices belong in design.md. A parent must state its complete guarantees at its own level without requiring its children's Contracts; necessary cross-level coverage is preserved without copying children item by item.

**Edge Cases and Exception Handling** — add distinct exceptional conditions and outcomes, rather than rewording the normal mechanism. Cover applicable exceptional inputs, extreme values, absent resources, resource exhaustion, security concerns and failure outcomes. Use a table or equivalent when helpful. Do not invent irrelevant defensive obligations; state briefly when there are no additional applicable exceptions. This Section remains mandatory.

**Key Acceptance Cases** — use named Acceptance Cases with concrete inputs, conditions, actions and observable outcomes derived from confirmed commitments; verify the rules rather than repeating their wording. Preserve the user's confirmed positive and negative examples and exact numbers, exceptions, and timing. These are the contract basis for TDD; Agent-written tests must verify these outcomes rather than define new ones. Keep key positive, boundary and conflict coverage proportionate. Cases cannot introduce independently evolvable semantics or override Business Logic, and test count need not equal case count.

## Additional Sections and coverage

+N titles are unrestricted. Promote content to an additional Section only when it has a coherent normative boundary worth maintaining independently; being a concurrency rule, state transition, timer or external dependency is not sufficient by itself. Concision does not relax the four mandatory base Sections or justified +N commitments. Reuse accurate existing wording, revise only affected behavior, and keep conditions, numbers, exceptions, timing, and concrete examples. State conditions, behavior, and results directly; avoid explanations or repeated formulations that add no meaning.

Check applicable state/lifecycle, concurrency, timing and external-failure details within the existing base Sections first. Related details stay in Business Logic; exceptional outcomes belong in Edge Cases and Exception Handling. Place each diagram next to the mechanism it explains. Record unknown business decisions rather than making them normative to complete the structure.

Goal-level tasks reference the responsible Contract Section and state an observable verification direction. They do not prescribe implementation file paths, test actions, nested Checks, or Acceptance Case anchors. A missing observable outcome is a specification gap to resolve before implementation; do not derive the expected result from the implementation under test.

## Self-check

1. Is the business Kind explicitly marked, while generic concept Kinds remain outside this format?
2. Are all four fixed English Section titles present with substantive content?
3. Does Business Logic explain the complete related mechanism, with internal organization or diagrams as useful?
4. Are applicable edge cases and exceptional outcomes explicit and consistent with the main mechanism?
5. Do mandatory Acceptance Cases state confirmed observable outcomes sufficient to guide TDD?
6. Is each +N Section worth maintaining independently, rather than a fragmented step or engineering characteristic?
7. Do tasks reference the existing contract outcomes without inventing new obligations?