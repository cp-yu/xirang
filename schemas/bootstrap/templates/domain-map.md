# Element Map

## Elements

<!--
- elementId: <stable-id>
  kind: <project-defined-kind>
  contractPolicy: required | optional
  localId: <likec4-local-id>
  title: <human-readable-title>
  summary: <non-empty-authored-summary>
  spec:
    folder: <single-path-segment>
    purpose: <contract-purpose>
    requirements: []
-->

## Parent Links

<!-- Every non-root element has exactly one parent. Top-level candidates use project.root.
- parent: project.root
  child: <stable-id>
- parent: <stable-parent-id>
  child: <stable-child-id>
-->

## Relations

<!-- Use only precise semantic relations: invokes, produces, consumes, precedes, constrains, validates.
Do not persist belongs_to, refines, or abstracts; nesting expresses refinement.
- from: <stable-source-id>
  type: invokes
  to: <stable-target-id>
-->

## Review Gaps

<!-- Record ambiguous parentage, Spec ownership, kinds, or interaction semantics instead of guessing.
- evidence: <repository-evidence>
  reason: <unresolved-ambiguity>
-->

<!-- Legacy domain/capabilities maps remain accepted only through the compatibility adapter. -->
