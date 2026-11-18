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

Propose authors the Semantic Delta. Apply implements the Change, runs the checks, and completes independent Review and the Quality Seal. Default Archive requires the Seal and applies the Delta while sealing the Change in history. If the Seal is missing or invalid, return to Apply.

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
/xirang:snack ─┬─► /xirang:apply (record Seal) ─► /xirang:archive
              └─► xirang archive <change> --quick (only when you choose to skip the Seal)
```

Use this when code already exists and Xirang artifacts must be reconciled afterward.
