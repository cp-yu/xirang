# Workflows

OPSX exposes six managed workflows over one Semantic Model: versioned LikeC4 graph modules plus element-owned Markdown contract modules.

## Current Surface

- `/opsx:propose`
- `/opsx:explore`
- `/opsx:apply`
- `/opsx:archive`
- `/opsx:build`
- `/opsx:snack`

## Typical Flows

### Standard Change

```text
/opsx:propose ──► /opsx:apply ──► /opsx:archive
```

Propose authors Semantic Deltas. Apply implements serial TDD checks. Archive verifies and atomically syncs the authorized delta.

### Explore First

```text
/opsx:explore ──► /opsx:propose ──► /opsx:apply ──► /opsx:archive
```

Use this when behavior or architecture decisions remain undefined.

### Project Build

```text
/opsx:build ──► opsx candidate validate ──► user confirmation ──► opsx candidate promote
```

Project Build asks for exploration scope and a starting point, then authors Architecture and Specs as one isolated Candidate. The CLI validates exact bytes and promotion requires the user-confirmed digest.

### Code-First Reconciliation

```text
/opsx:snack ──► /opsx:archive
```

Use this when code already exists and OPSX artifacts must be reconciled afterward.
