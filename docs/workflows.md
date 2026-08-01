# Workflows

Xirang exposes six managed workflows over one Semantic Model: the four partitions under `.xirang/model/` (`metamodel/`, `elements/`, `relationships/`, `views/`).

## Current Surface

- `/xirang:propose`
- `/xirang:explore`
- `/xirang:apply`
- `/xirang:archive`
- `/xirang:build`
- `/xirang:snack`

## Typical Flows

### Standard Change

```text
/xirang:propose ──► /xirang:apply ──► /xirang:archive
```

Propose authors Semantic Deltas. Apply implements serial TDD checks. Archive verifies and atomically syncs the authorized delta.

### Explore First

```text
/xirang:explore ──► /xirang:propose ──► /xirang:apply ──► /xirang:archive
```

Use this when behavior or architecture decisions remain undefined.

### Project Build

```text
/xirang:build ──► xirang candidate validate ──► user confirmation ──► xirang candidate promote
```

Project Build asks for exploration scope and a starting point, then authors Architecture and Specs as one isolated Candidate. The CLI validates exact bytes and promotion requires the user-confirmed digest.

### Code-First Reconciliation

```text
/xirang:snack ──► /xirang:archive
```

Use this when code already exists and Xirang artifacts must be reconciled afterward.
