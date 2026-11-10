# design

## Definition

```yaml
purpose: Record concrete lowering and architecture decisions that the Agent must
  not guess.
compilationRole: Compilation scaffolding for implementation strategy,
  architecture, and constraints.
content:
  includes:
    - Solution architecture, implementation boundaries, technical decisions,
      rationale, alternatives, refactoring strategy, risks, trade-offs, and
      migration decisions.
  excludes:
    - Observable behavior requirements, task progress, repeated motivation, and
      durable semantic changes not reconciled through the four Delta partitions.
writePolicy: agent-authored
validation:
  - xirang validate --change <name> --json
```

## Guidance

Create the design document that explains HOW to implement the change, documenting confirmed design decisions. Reuse Explore conclusions and the current framing record. Reasonable inferred details, including supporting guarantees, may be authored within the agreed scope and approach without separate confirmation; explain their basis and disclose them at completion. Check authored branch outcomes, defaults, error results and restrictions against confirmed commitments. Changes to confirmed commitments, scope expansion or material business/architecture trade-offs require asking the user before treating a choice as settled. An isolated gap can be confirmed within Propose; substantial redesign returns to Explore.
Use design.md for technical decisions, refactor rationale, rejected approaches, exploration decisions, implementation strategy, and why an old path should not be used. These belong here instead of specs unless they change externally observable behavior. Reconcile confirmed observable behavior and inferred guarantees with the Semantic Delta and tasks rather than defining it only in design.md.

When to include design.md (create only if any apply):
- Cross-cutting change (multiple services/modules) or new architectural pattern
- New external dependency or significant data model changes
- Security, performance, or migration complexity
- Ambiguity that benefits from technical decisions before coding

Sections:
- **Context**: Background, current state, constraints, stakeholders
- **Goals / Non-Goals**: What this design achieves and explicitly excludes
- **Decisions**: Key technical choices with rationale (why X over Y?). Include alternatives considered for each decision.
- **Risks / Trade-offs**: Known limitations, things that could go wrong. Format: [Risk] → Mitigation
- **Migration Plan**: Steps to deploy, rollback strategy (if applicable)
- **Open Questions**: Outstanding decisions or unknowns to resolve

Focus on architecture and approach, not line-by-line implementation.
Reference the proposal for motivation and specs for requirements.

Good design docs explain the "why" behind technical decisions.


## Template

## Context

<!-- Background and current state -->

## Goals / Non-Goals

**Goals:**
<!-- What this design aims to achieve -->

**Non-Goals:**
<!-- What is explicitly out of scope -->

## Decisions

<!-- Key design decisions and rationale -->

## Risks / Trade-offs

<!-- Known risks and trade-offs -->
