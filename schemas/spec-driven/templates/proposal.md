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

#### Added OPSX Nodes

<!-- List new canonical OPSX node IDs when known. Define exact target-state nodes and relations in opsx-delta.yaml. Use None when no nodes are added. -->
- `cap.<domain>.<name>`: <new architectural responsibility>

#### Modified OPSX Nodes

<!-- List existing OPSX node IDs whose intent, ownership, or boundary changes. Use None when no nodes change. -->
- `cap.<domain>.<name>`: <architecture responsibility or boundary that changes>

#### Removed OPSX Nodes

<!-- List OPSX node IDs removed from the target architecture. Use None when no nodes are removed. -->
- `cap.<domain>.<name>`: <why the architecture no longer contains this node>

#### Architecture Relations

<!-- Summarize affected semantic collaboration without defining authoritative from/type/to records here. Exact relations belong in opsx-delta.yaml. Use None when relations do not change. -->
- <relationship or collaboration impact>

## Impact

<!-- List affected code, APIs, dependencies, data, operations, or systems. -->
