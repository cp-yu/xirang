# Workflows

OPSX exposes managed workflows as skills over one OPSX Semantic Model: versioned LikeC4 graph modules plus element-owned Markdown contract modules.

## Current Surface

- `/opsx:propose`
- `/opsx:explore`
- `/opsx:apply`
- `/opsx:archive`
- `/opsx:bootstrap-arch`
- `/opsx:snack`

## Typical Flows

### Standard

```text
/opsx:propose ──► /opsx:apply ──► /opsx:archive
```

Propose authors contract deltas and, when graph facts change, `architecture-delta.c4`. Apply queries affected elements by stable `elementId` before implementing serial TDD tasks. Archive verifies and atomically syncs the approved Semantic Delta.

### Explore First

```text
/opsx:explore ──► /opsx:propose ──► /opsx:apply ──► /opsx:archive
```

Use this when behavior or architecture decisions remain undefined.

### Bootstrap Architecture

```text
/opsx:bootstrap-arch ──► review candidates ──► opsx arch validate
```

The bootstrap workflow scans current evidence, produces a reviewed versioned Semantic Model candidate, and promotes it only after identity, binding, and validation gates pass.

### Code-First Reconciliation

```text
/opsx:snack ──► /opsx:archive
```

Use this when code already exists and OPSX artifacts must be reconciled afterward.

## Archive Contract

`/opsx:archive` requires fresh verification, synchronizes delta Specs and `architecture-delta.c4`, then establishes the archive boundary.
