# Semantic Refinement

Use this default method only when the normalized `decomposition` configuration resolves to this file. A project-specific guidance file configured through `decomposition` takes precedence.

1. Identify the current abstraction from domain concepts, capabilities, or user goals, and choose a decomposition dimension for its children.
2. Express semantic category through `project`, `element`, and `perspective` rather than prescribing levels. A Perspective must have a real semantic boundary that needs child refinement; when grouping merely presents the same set of concepts, use a View instead of duplicating Elements or Contracts.
3. Express cross-view collaboration, dependency, or constraint as typed Relationships. Extend the Metamodel only when genuinely shared semantics cannot be expressed accurately by an existing Kind.
4. Refine to the point where the model can be understood and decided on; C4's fixed technical levels and any fixed number of levels are not required.

Return the resulting model design and unresolved material decisions to the current workflow.