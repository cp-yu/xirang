# Business Specification Standard

**Business Specification Standard (4+N)**

- **Applicability**: business-specification Elements MUST use an Element Kind declaring `contract: required` and `contractFormat: business-specification`. Declare an appropriate Kind when needed; do not apply this format to generic framework concepts or organizational Elements, or omit it to bypass validation. CLI uses the explicit Kind declaration, never prose inference.
- **Four mandatory Sections**: `### Section: Scope and Non-goals`; `### Section: Business Logic`; `### Section: Edge Cases and Exception Handling`; `### Section: Key Acceptance Cases`. Keep these exact English titles regardless of proseLanguage; each needs a non-empty body. The business goal stays in Declaration `definition`, not a fifth Section.
- **Business Logic**: keep related validation, transitions, concurrency, timing and return paths together as one complete mechanism. Use free sub-headings, prose, pseudocode, tables, formulas or diagrams inside it; engineering characteristics do not automatically create Sections.
- **Edge Cases and Exception Handling**: explicitly cover applicable boundary inputs and failure behavior, using a table or another suitable carrier. Keep these details separate from the main mechanism.
- **Key Acceptance Cases**: always include at least one non-empty `#### Acceptance Case:` here, never in other Sections. Ground observable inputs/conditions and expected outcomes in confirmed intent and Contract commitments; they are the TDD test basis, not outcomes invented from implementation. Cover a positive flow and applicable boundary/conflict flows without demanding a case per detail.
- **+N**: add freely named Sections only for commitments worth maintaining independently of the four base Sections. Keep related mechanism details and their diagrams together. Do not turn every rule, step or engineering characteristic into a Section.
- **Validation and traceability**: CLI checks the complete model (Expected Semantic Model for a Change), not four repeated Sections in every delta. Checks reference change-local Element paths plus Section anchors, and Acceptance Case anchors where relevant. Semantic coverage and independently maintainable boundaries remain author/reviewer judgments; do not invent business decisions to fill containers.
- Read `.xirang/references/xirang-business-specification-standard.md` for the standard and self-check list.

## Applicability and notation

The Metamodel declares applicability on an Element Kind, not on a filename, title or inferred business vocabulary. For example:

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

This outline needs real content. CLI rejects missing, duplicate or empty mandatory Sections, a missing/empty Acceptance Case, and Acceptance Cases outside Key Acceptance Cases. It does not decide whether the business rules or acceptance outcomes are correct. Change units use ADDED/MODIFIED/REMOVED Sections as usual; only the complete Expected Semantic Model must contain all four base Sections.

## Four base Sections

**Scope and Non-goals** — state the responsibility boundary and explicit exclusions without adding unconfirmed restrictions. Declaration definition still gives the complete concept definition and business purpose; do not duplicate it as a fifth base Section.

**Business Logic** — express the complete related mechanism at this Element's abstraction level. Request validation, deduction, concurrent safety and timeout return can form one mechanism. Use internal sub-headings and diagrams to explain their relationships; sub-headings have no identity and are not delta targets. Pseudocode, decision tables, formulas and event triples are examples, not an exhaustive or mandatory list of carriers. Implementation choices belong in design.md.

**Edge Cases and Exception Handling** — state applicable exceptional inputs, extreme values, absent resources, resource exhaustion, security concerns and failure outcomes. Use a table or equivalent when helpful. Do not invent irrelevant defensive obligations; if a category does not apply, explain that briefly. This Section is mandatory even when there are no additional applicable exceptions.

**Key Acceptance Cases** — use named Acceptance Cases with concrete conditions, actions and observable outcomes derived from confirmed commitments. These are the contract basis for TDD; Agent-written tests must verify these outcomes rather than define new ones. Keep key positive, boundary and conflict coverage proportionate. Cases cannot introduce independently evolvable semantics or override Business Logic, and test count need not equal case count.

## Additional Sections and coverage

+N titles are unrestricted. Promote content to an additional Section only when it has a coherent normative boundary worth maintaining independently; being a concurrency rule, state transition, timer or external dependency is not sufficient by itself.

Check applicable state/lifecycle, concurrency, timing and external-failure details within the existing base Sections first. Related details stay in Business Logic; exceptional outcomes belong in Edge Cases and Exception Handling. Place each diagram next to the mechanism it explains. Record unknown business decisions rather than making them normative to complete the structure.

Tasks and Checks trace back to Sections or their Acceptance Cases. A missing observable outcome is a specification gap to resolve before writing its test; do not derive the expected result from the implementation under test.

## Self-check

1. Is the business Kind explicitly marked, while generic concept Kinds remain outside this format?
2. Are all four fixed English Section titles present with substantive content?
3. Does Business Logic explain the complete related mechanism, with internal organization or diagrams as useful?
4. Are applicable edge cases and exceptional outcomes explicit and consistent with the main mechanism?
5. Do mandatory Acceptance Cases state confirmed observable outcomes sufficient to guide TDD?
6. Is each +N Section worth maintaining independently, rather than a fragmented step or engineering characteristic?
7. Do tasks reference the existing contract outcomes without inventing new obligations?