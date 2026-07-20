# OPSX Property-Based Testing Guarantees

> [!WARNING]
> Legacy OPSX YAML test-contract history; not active architecture authoring guidance.


## Overview

OPSX uses [fast-check](https://github.com/dubzzz/fast-check) to exercise the v2 two-file runtime across generated graph sizes and failure cases. The tests generate valid semantic graphs rather than arbitrary endpoint pairs.

## Core Properties

### YAML structure

`test/utils/opsx-utils.pbt.yaml-structure.test.ts` verifies that schema-valid project and relation documents remain parseable and structurally stable across serialization.

### Referential integrity

`test/utils/opsx-utils.pbt.referential-integrity.test.ts` verifies that every relation endpoint resolves and that dangling endpoints are reported.

### Merge idempotency

`test/utils/opsx-utils.pbt.merge-idempotency.test.ts` verifies:

```text
write(x); write(x); read() == x
write(x); read(); write(read()); read() == x
```

Generated bundles use unique IDs and give every capability exactly one ownership edge.

### Fixed two-file layout

`test/utils/opsx-utils.pbt.file-size-boundaries.test.ts` verifies that both small and large models always produce:

- `project.opsx.yaml`
- `project.opsx.relations.yaml`

Model size never introduces shards or companion files, and both files preserve all generated graph data.

### Atomic writes

`test/utils/opsx-utils.pbt.atomic-write.test.ts` verifies completed writes are immediately readable, sequential writes converge on the final bundle, and temporary files are not left behind.

## Semantic Graph Generation

A valid generated graph starts from unique domain and capability IDs. If capabilities exist, at least one domain exists. Every capability receives one ownership relation:

```typescript
const relations = capabilities.map((capability) => ({
  from: capability.id,
  type: 'belongs_to' as const,
  to: domains[0].id,
}));
```

Additional relation generators must use Registry endpoint contracts:

- `belongs_to`: capability to domain
- `invokes`, `consumes`, `precedes`, `constrains`, `validates`: capability to capability

Negative properties deliberately generate rejected tokens, illegal endpoint kinds, duplicate edges, dangling endpoints, self-loops, invalid notes, missing/duplicate ownership, and `precedes` cycles.

## Running the Tests

```bash
pnpm vitest run test/utils/opsx-utils.pbt.*.test.ts
pnpm vitest run test/core/relations
```

Use a reported fast-check seed and path to reproduce a counterexample:

```typescript
fc.assert(property, { seed: 1234567890, path: '23:0' });
```

## Interpretation

A property failure should be reduced to its minimal counterexample before changing production code. If the generator violates the v2 graph contract, repair the generator. Do not weaken runtime semantic validation to accept invalid generated data.
