# Semantic Refinement

## Inputs and boundaries

This is the framework's default general-purpose semantic refinement method. It applies when the normalized `decomposition` value resolves to this file and a hierarchy must be formed or reorganized; a project-specific guidance file configured through `decomposition` takes precedence, and a Contract-only change never triggers structural decomposition.

Take authorized user intent and semantic authority as input. Implementation files, deployment diagrams, and the technology stack are evidence only and do not become hierarchy on their own. This guidance cannot override formal semantics, confirmed design, Element Contracts, Relationships, or the current workflow's permissions; ask the user to rule when they conflict.

## Layer-by-layer formation

1. Identify the current abstraction from domain concepts, capabilities, or user goals. For each Element, state what it is, why it stands alone, what it includes and excludes, and its boundary with its parent, children, and siblings. Ask one question at a time for each unresolved semantic choice.
2. Choose exactly one dimension for the complete sibling set under one parent, then check mutual exclusivity and completeness (MECE) within the confirmed scope. Do not mix responsibility, lifecycle, deployment, and implementation coordinates; when several independent semantic views are needed, state each boundary explicitly.
3. Express semantic category through `project`, `element`, and `perspective` rather than prescribing levels. A Perspective must have a real semantic boundary that needs child refinement; when grouping merely presents the same set of concepts, use a View instead of duplicating Elements or Contracts.
4. Keep exactly one stable identity per concept. Express cross-view collaboration, dependency, or constraint as typed Relationships instead of solving a presentation problem with duplicated modeling. Extend the Metamodel only when genuinely shared semantics cannot be expressed accurately by an existing Kind.
5. Work breadth-first: present all siblings of the current layer with their dimension, boundaries, and coverage, and descend only after the user confirms. C4's fixed technical levels and any fixed number of levels are not required; refine to the point where the model can be understood and decided on.
6. Complete Declaration and Contract separately. Even when no further children are split, conditions, numbers, exceptions, timing, responsibilities, and guarantees still belong in the host Element Contract; do not mistake stopping structural refinement for omitting behavior. Implementation planning belongs to the Plan.

## Stop and hand off

Stop writing the affected structure and ask the user when guidance is insufficient, concept identities overlap, the dimension is unclear, or authorities conflict. Do not default to an implementation directory or a similar method. Confirming a method grants no file-write or record-persistence permission.

Hand the confirmed identities, Kinds, complete Definitions, hierarchy, Contract detail, and Relationships back to the current workflow. Explore maintains intermediate design through the Design Record protocol and delegates feasibility experiments; its Design Summary remains conversation-only and complete Change authoring belongs to Propose. Build authors the authorized Candidate, and Propose compiles the Delta. Persistence follows each workflow's own permissions. This guidance does not replace any workflow's validation, review, confirmation, or promotion gate.