## Why

<!-- Explain the problem or opportunity and why it matters now. -->

## What Changes

<!-- Summarize the intended scope and outcomes. Do not define detailed requirements or implementation steps. Mark breaking changes with **BREAKING**. -->

## Source Impact

### Behavior Source

#### New Specs

<!-- List new Spec IDs. Each creates specs/<spec-id>/spec.md. Use None when no new Specs are required. -->
- `<spec-id>`: <observable behavior covered by the new Spec>

#### Modified Specs

<!-- List existing Spec IDs whose observable requirements change. Use None when no existing Specs change. -->
- `<existing-spec-id>`: <observable behavior that changes>

### Architecture Source

#### Added LikeC4 Elements

<!-- List new LikeC4 element IDs when known. Define exact target-state elements and relations in architecture-delta.c4. Use None when no elements are added. -->
- `domain_name.capability_name`: <new architectural responsibility>

#### Modified LikeC4 Elements

<!-- List existing LikeC4 element IDs whose responsibility, ownership, or boundary changes. Use None when no elements change. -->
- `domain_name.capability_name`: <architecture responsibility or boundary that changes>

#### Removed LikeC4 Elements

<!-- List LikeC4 element IDs removed from the target architecture. Use None when no elements are removed. -->
- `domain_name.capability_name`: <why the architecture no longer contains this element>

#### Architecture Relations

<!-- Summarize affected semantic collaboration without defining authoritative typed relations here. Exact relations belong in architecture-delta.c4. Use None when relations do not change. -->
- <relationship or collaboration impact>

## Impact

<!-- List affected code, APIs, dependencies, data, operations, or systems. -->
