# proposal

## Definition

```yaml
purpose: Explain why the change is needed and declare its semantic source scope.
compilationRole: Compilation scaffolding for motivation and source impact.
content:
  includes:
    - Motivation, scope boundaries, Behavior Source impact, Architecture Source
      impact, and affected surfaces.
  excludes:
    - Complete observable behavior requirements, complete target-state Semantic
      Delta entries, lowering decisions, and implementation work.
writePolicy: agent-authored
validation:
  - xirang validate --change <name> --json
```

## Guidance

Create `proposal.md` to explain why the change is needed and bound its semantic source impact.

Use the template sections:
- **Why**: State the problem or opportunity and why it matters now in 1-2 sentences.
- **What Changes**: Summarize intended outcomes and scope, not detailed requirements or implementation steps. Mark breaking changes with **BREAKING**.
- **Source Impact**:
  - **Behavior Source**: List `New Specs` and `Modified Specs` by element identity. Write `None` when behavior source does not change.
  - **Architecture Source**: List affected element identities and summarize responsibility, ownership, boundary, or relationship impact. Write `None` when architecture source does not change.
- **Impact**: List affected code, APIs, dependencies, data, operations, or systems.

Use one shared identity space. Reuse an existing element identity when it already denotes the affected semantic object; introduce one only for a genuinely new Element. An Element has at most one Contract, so Behavior Source and Architecture Source may refer to the same identity.

The proposal declares source impact; it does not define target content:
- Complete target-state Semantic Delta entries belong in `elements/`, `metamodel/`, `relationships/`, and `views/`.
- Lowering and architecture decisions belong in `design.md`.
- Implementation work and verification belong in `tasks.md`.

Every declared durable semantic impact must be reconciled through the appropriate Delta partition. Keep the proposal concise and do not repeat requirements, target entries, design rationale, or task steps.


## Template

## Why

<!-- Explain the problem or opportunity and why it matters now. -->

## What Changes

<!-- Summarize the intended scope and outcomes. Do not define detailed requirements or implementation steps. Mark breaking changes with **BREAKING**. -->

## Source Impact

### Behavior Source

#### New Specs

<!-- List element identities for new Contracts. Use None when no new behavior source is required. -->
- `<element identity>`: <observable behavior covered by the new Contract>

#### Modified Specs

<!-- List existing element identities whose observable requirements change. Use None when no existing Contracts change. -->
- `<element identity>`: <observable behavior that changes>

### Architecture Source

#### Added Elements

<!-- List new element identities. Define exact target-state entries under elements/, metamodel/, relationships/, or views/. Use None when no Elements are added. -->
- `<element identity>`: <new semantic responsibility>

#### Modified Elements

<!-- List existing element identities whose responsibility, ownership, or boundary changes. Use None when no Elements change. -->
- `<element identity>`: <responsibility or boundary that changes>

#### Removed Elements

<!-- List element identities removed from the target model. Use None when no Elements are removed. -->
- `<element identity>`: <why the target model no longer contains this Element>

#### Architecture Relations

<!-- Summarize affected semantic collaboration without defining target entries here. Exact entries belong under elements/, metamodel/, relationships/, or views/. Use None when relationships do not change. -->
- <relationship or collaboration impact>

## Impact

<!-- List affected code, APIs, dependencies, data, operations, or systems. -->
